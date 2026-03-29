output "resource_group_name" {
  value = azurerm_resource_group.this.name
}

output "key_vault_name" {
  value = azurerm_key_vault.this.name
}

output "key_vault_uri" {
  value = azurerm_key_vault.this.vault_uri
}

output "container_apps_managed_identity_id" {
  value = azurerm_user_assigned_identity.container_apps.id
}

output "frontend_container_app_name" {
  value = azurerm_container_app.frontend.name
}

output "backend_container_app_name" {
  value = azurerm_container_app.backend.name
}

output "frontend_url" {
  value = "https://${azurerm_container_app.frontend.ingress[0].fqdn}"
}

output "backend_url" {
  value = var.backend_external_enabled ? "https://${azurerm_container_app.backend.ingress[0].fqdn}" : null
}

output "backend_internal_url" {
  value = "http://${azurerm_container_app.backend.name}"
}

output "postgresql_fqdn" {
  value = azurerm_postgresql_flexible_server.this.fqdn
}

output "postgresql_database_name" {
  value = azurerm_postgresql_flexible_server_database.this.name
}

output "postgresql_admin_username" {
  value = var.postgresql_admin_username
}

output "connection_string_secret_name" {
  value = var.connection_string_secret_name
}

output "jwt_secret_name" {
  value = var.jwt_secret_name
}

output "registry_password_secret_name" {
  value = var.registry_password_secret_name
}

output "smtp_password_secret_name" {
  value = var.smtp_password_secret_name
}

output "storage_account_name" {
  value = azurerm_storage_account.this.name
}

output "attachments_share_name" {
  value = azurerm_storage_share.attachments.name
}
