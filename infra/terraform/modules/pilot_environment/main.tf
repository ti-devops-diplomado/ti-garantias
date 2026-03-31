locals {
  common_tags = merge(
    {
      project     = var.name_prefix
      environment = var.environment
      managed_by  = "terraform"
      workload    = "ti-garantias"
    },
    var.tags
  )

  backend_upstream        = "http://${var.backend_app_name}"
  connection_string       = "Host=${azurerm_postgresql_flexible_server.this.fqdn};Port=5432;Database=${azurerm_postgresql_flexible_server_database.this.name};Username=${var.postgresql_admin_username};Password=${var.postgresql_admin_password};Ssl Mode=Require;Trust Server Certificate=true"
  container_identity_name = "${var.name_prefix}-${var.environment}-ca-mi"
  use_registry            = var.registry_server != null && var.registry_username != null
  use_smtp_password       = trimspace(var.smtp_user) != ""
}

data "azurerm_client_config" "current" {}

resource "azurerm_resource_group" "this" {
  name     = var.resource_group_name
  location = var.location
  tags     = local.common_tags
}

resource "azurerm_log_analytics_workspace" "this" {
  name                = var.log_analytics_workspace_name
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.common_tags
}

resource "azurerm_storage_account" "this" {
  name                            = var.storage_account_name
  resource_group_name             = azurerm_resource_group.this.name
  location                        = azurerm_resource_group.this.location
  account_tier                    = "Standard"
  account_replication_type        = "LRS"
  min_tls_version                 = "TLS1_2"
  allow_nested_items_to_be_public = false
  public_network_access_enabled   = true
  shared_access_key_enabled       = true
  tags                            = local.common_tags
}

resource "azurerm_storage_share" "attachments" {
  name                 = var.attachments_share_name
  storage_account_name = azurerm_storage_account.this.name
  quota                = 5
}

resource "azurerm_key_vault" "this" {
  name                          = var.key_vault_name
  location                      = azurerm_resource_group.this.location
  resource_group_name           = azurerm_resource_group.this.name
  tenant_id                     = data.azurerm_client_config.current.tenant_id
  sku_name                      = var.key_vault_sku_name
  rbac_authorization_enabled    = true
  public_network_access_enabled = true
  purge_protection_enabled      = var.key_vault_purge_protection_enabled
  soft_delete_retention_days    = 7
  tags                          = local.common_tags
}

resource "azurerm_postgresql_flexible_server" "this" {
  name                          = var.postgresql_server_name
  resource_group_name           = azurerm_resource_group.this.name
  location                      = azurerm_resource_group.this.location
  version                       = var.postgresql_version
  administrator_login           = var.postgresql_admin_username
  administrator_password        = var.postgresql_admin_password
  public_network_access_enabled = true
  sku_name                      = var.postgresql_sku_name
  storage_mb                    = var.postgresql_storage_mb
  backup_retention_days         = var.postgresql_backup_retention_days
  tags                          = local.common_tags

  lifecycle {
    # Azure may auto-assign an availability zone for Flexible Server.
    # We do not model that choice in this pilot, so ignore future drift.
    ignore_changes = [zone]
  }
}

resource "azurerm_postgresql_flexible_server_database" "this" {
  name      = var.postgresql_database_name
  server_id = azurerm_postgresql_flexible_server.this.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
  name             = "allow-azure-services"
  server_id        = azurerm_postgresql_flexible_server.this.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

resource "azurerm_user_assigned_identity" "container_apps" {
  name                = local.container_identity_name
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  tags                = local.common_tags
}

resource "azurerm_role_assignment" "container_apps_key_vault_reader" {
  scope                = azurerm_key_vault.this.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.container_apps.principal_id
}

resource "azurerm_role_assignment" "deployer_key_vault_secrets_officer" {
  scope                = azurerm_key_vault.this.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

resource "azurerm_container_app_environment" "this" {
  name                       = var.container_app_environment_name
  location                   = azurerm_resource_group.this.location
  resource_group_name        = azurerm_resource_group.this.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.this.id
  tags                       = local.common_tags
}

resource "azurerm_container_app_environment_storage" "attachments" {
  name                         = "attachments"
  container_app_environment_id = azurerm_container_app_environment.this.id
  account_name                 = azurerm_storage_account.this.name
  share_name                   = azurerm_storage_share.attachments.name
  access_key                   = azurerm_storage_account.this.primary_access_key
  access_mode                  = "ReadWrite"
}

data "azurerm_key_vault_secret" "connection_string" {
  count        = var.enable_key_vault_secret_references ? 1 : 0
  name         = var.connection_string_secret_name
  key_vault_id = azurerm_key_vault.this.id

  depends_on = [azurerm_role_assignment.deployer_key_vault_secrets_officer]
}

data "azurerm_key_vault_secret" "jwt_secret" {
  count        = var.enable_key_vault_secret_references ? 1 : 0
  name         = var.jwt_secret_name
  key_vault_id = azurerm_key_vault.this.id

  depends_on = [azurerm_role_assignment.deployer_key_vault_secrets_officer]
}

data "azurerm_key_vault_secret" "registry_password" {
  count        = var.enable_key_vault_secret_references && local.use_registry ? 1 : 0
  name         = var.registry_password_secret_name
  key_vault_id = azurerm_key_vault.this.id

  depends_on = [azurerm_role_assignment.deployer_key_vault_secrets_officer]
}

data "azurerm_key_vault_secret" "smtp_password" {
  count        = var.enable_key_vault_secret_references && local.use_smtp_password ? 1 : 0
  name         = var.smtp_password_secret_name
  key_vault_id = azurerm_key_vault.this.id

  depends_on = [azurerm_role_assignment.deployer_key_vault_secrets_officer]
}

resource "azurerm_container_app" "backend" {
  name                         = var.backend_app_name
  resource_group_name          = azurerm_resource_group.this.name
  container_app_environment_id = azurerm_container_app_environment.this.id
  revision_mode                = "Single"
  tags                         = local.common_tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.container_apps.id]
  }

  secret {
    name                = var.connection_string_secret_name
    identity            = var.enable_key_vault_secret_references ? azurerm_user_assigned_identity.container_apps.id : null
    key_vault_secret_id = var.enable_key_vault_secret_references ? data.azurerm_key_vault_secret.connection_string[0].versionless_id : null
    value               = var.enable_key_vault_secret_references ? null : local.connection_string
  }

  secret {
    name                = var.jwt_secret_name
    identity            = var.enable_key_vault_secret_references ? azurerm_user_assigned_identity.container_apps.id : null
    key_vault_secret_id = var.enable_key_vault_secret_references ? data.azurerm_key_vault_secret.jwt_secret[0].versionless_id : null
    value               = var.enable_key_vault_secret_references ? null : var.jwt_secret
  }

  dynamic "secret" {
    for_each = local.use_registry ? [1] : []
    content {
      name                = var.registry_password_secret_name
      identity            = var.enable_key_vault_secret_references ? azurerm_user_assigned_identity.container_apps.id : null
      key_vault_secret_id = var.enable_key_vault_secret_references ? data.azurerm_key_vault_secret.registry_password[0].versionless_id : null
      value               = var.enable_key_vault_secret_references ? null : var.registry_password
    }
  }

  dynamic "secret" {
    for_each = local.use_smtp_password ? [1] : []
    content {
      name                = var.smtp_password_secret_name
      identity            = var.enable_key_vault_secret_references ? azurerm_user_assigned_identity.container_apps.id : null
      key_vault_secret_id = var.enable_key_vault_secret_references ? data.azurerm_key_vault_secret.smtp_password[0].versionless_id : null
      value               = var.enable_key_vault_secret_references ? null : var.smtp_password
    }
  }

  ingress {
    external_enabled           = var.backend_external_enabled
    target_port                = 8080
    allow_insecure_connections = false
    transport                  = "auto"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  dynamic "registry" {
    for_each = local.use_registry ? [1] : []
    content {
      server               = var.registry_server
      username             = var.registry_username
      password_secret_name = var.registry_password_secret_name
    }
  }

  template {
    min_replicas = var.backend_min_replicas
    max_replicas = var.backend_max_replicas

    volume {
      name         = "attachments"
      storage_name = azurerm_container_app_environment_storage.attachments.name
      storage_type = "AzureFile"
    }

    container {
      name   = "backend"
      image  = var.backend_image
      cpu    = var.backend_cpu
      memory = var.backend_memory

      env {
        name  = "ASPNETCORE_ENVIRONMENT"
        value = var.aspnetcore_environment
      }

      env {
        name        = "CONNECTION_STRING"
        secret_name = var.connection_string_secret_name
      }

      env {
        name        = "Jwt__Secret"
        secret_name = var.jwt_secret_name
      }

      env {
        name  = "Jwt__Issuer"
        value = var.jwt_issuer
      }

      env {
        name  = "Jwt__Audience"
        value = var.jwt_audience
      }

      env {
        name  = "Storage__AttachmentsPath"
        value = var.attachments_mount_path
      }

      env {
        name  = "CORS_ALLOWED_ORIGINS"
        value = join(",", var.backend_allowed_origins)
      }

      env {
        name  = "Smtp__Host"
        value = var.smtp_host
      }

      env {
        name  = "Smtp__Port"
        value = tostring(var.smtp_port)
      }

      env {
        name  = "Smtp__User"
        value = var.smtp_user
      }

      dynamic "env" {
        for_each = local.use_smtp_password ? [1] : []
        content {
          name        = "Smtp__Password"
          secret_name = var.smtp_password_secret_name
        }
      }

      env {
        name  = "Smtp__From"
        value = var.smtp_from
      }

      volume_mounts {
        name = "attachments"
        path = var.attachments_mount_path
      }
    }
  }
}

resource "azurerm_container_app" "frontend" {
  name                         = var.frontend_app_name
  resource_group_name          = azurerm_resource_group.this.name
  container_app_environment_id = azurerm_container_app_environment.this.id
  revision_mode                = "Single"
  tags                         = local.common_tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.container_apps.id]
  }

  dynamic "secret" {
    for_each = local.use_registry ? [1] : []
    content {
      name                = var.registry_password_secret_name
      identity            = var.enable_key_vault_secret_references ? azurerm_user_assigned_identity.container_apps.id : null
      key_vault_secret_id = var.enable_key_vault_secret_references ? data.azurerm_key_vault_secret.registry_password[0].versionless_id : null
      value               = var.enable_key_vault_secret_references ? null : var.registry_password
    }
  }

  ingress {
    external_enabled           = true
    target_port                = 80
    allow_insecure_connections = false
    transport                  = "auto"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  dynamic "registry" {
    for_each = local.use_registry ? [1] : []
    content {
      server               = var.registry_server
      username             = var.registry_username
      password_secret_name = var.registry_password_secret_name
    }
  }

  template {
    min_replicas = var.frontend_min_replicas
    max_replicas = var.frontend_max_replicas

    container {
      name   = "frontend"
      image  = var.frontend_image
      cpu    = var.frontend_cpu
      memory = var.frontend_memory

      env {
        name  = "API_BASE_URL"
        value = var.frontend_api_base_url
      }

      env {
        name  = "BACKEND_UPSTREAM"
        value = local.backend_upstream
      }
    }
  }
}
