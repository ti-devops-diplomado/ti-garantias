locals {
  environment                    = "test"
  resource_group_name            = "${var.name_prefix}-${local.environment}-rg"
  container_app_environment_name = "${var.name_prefix}-${local.environment}-cae"
  log_analytics_workspace_name   = "${var.name_prefix}-${local.environment}-law"
  key_vault_name                 = substr(lower(replace("${var.name_prefix}${local.environment}${var.unique_suffix}kv", "-", "")), 0, 24)
  storage_account_name           = substr(lower(replace("${var.name_prefix}${local.environment}${var.unique_suffix}st", "-", "")), 0, 24)
  postgresql_server_name         = "${var.name_prefix}-${local.environment}-pg-${var.unique_suffix}"
  backend_app_name               = "${var.name_prefix}-${local.environment}-be"
  frontend_app_name              = "${var.name_prefix}-${local.environment}-fe"
}

module "stack" {
  source = "../../modules/pilot_environment"

  environment                    = local.environment
  location                       = var.location
  name_prefix                    = var.name_prefix
  resource_group_name            = local.resource_group_name
  container_app_environment_name = local.container_app_environment_name
  log_analytics_workspace_name   = local.log_analytics_workspace_name
  key_vault_name                 = local.key_vault_name
  storage_account_name           = local.storage_account_name
  postgresql_server_name         = local.postgresql_server_name
  backend_app_name               = local.backend_app_name
  frontend_app_name              = local.frontend_app_name

  backend_image             = var.backend_image
  frontend_image            = var.frontend_image
  registry_server           = var.registry_server
  registry_username         = var.registry_username
  registry_password         = var.registry_password
  postgresql_admin_username = var.postgresql_admin_username
  postgresql_admin_password = var.postgresql_admin_password
  jwt_secret                = var.jwt_secret

  backend_min_replicas     = 0
  backend_max_replicas     = 1
  frontend_min_replicas    = 0
  frontend_max_replicas    = 1
  backend_external_enabled = false

  tags = merge(var.tags, { tier = "nonprod" })
}

output "frontend_url" {
  value = module.stack.frontend_url
}

output "backend_internal_url" {
  value = module.stack.backend_internal_url
}

output "key_vault_name" {
  value = module.stack.key_vault_name
}

output "postgresql_fqdn" {
  value = module.stack.postgresql_fqdn
}

output "postgresql_database_name" {
  value = module.stack.postgresql_database_name
}

output "postgresql_admin_username" {
  value = module.stack.postgresql_admin_username
}
