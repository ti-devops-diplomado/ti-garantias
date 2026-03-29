variable "name_prefix" {
  description = "Prefijo corto del proyecto usado en nombres de recursos."
  type        = string
}

variable "environment" {
  description = "Nombre del ambiente."
  type        = string
}

variable "location" {
  description = "Region de Azure."
  type        = string
}

variable "resource_group_name" {
  description = "Nombre del resource group."
  type        = string
}

variable "container_app_environment_name" {
  description = "Nombre del Container Apps Environment."
  type        = string
}

variable "storage_account_name" {
  description = "Nombre globally unique del storage account."
  type        = string
}

variable "attachments_share_name" {
  description = "Nombre del Azure File Share para adjuntos."
  type        = string
  default     = "attachments"
}

variable "log_analytics_workspace_name" {
  description = "Nombre del Log Analytics Workspace."
  type        = string
}

variable "key_vault_name" {
  description = "Nombre globally unique del Key Vault."
  type        = string
}

variable "postgresql_server_name" {
  description = "Nombre globally unique del PostgreSQL Flexible Server."
  type        = string
}

variable "postgresql_database_name" {
  description = "Nombre de la base de datos de la aplicacion."
  type        = string
  default     = "ti_garantias"
}

variable "postgresql_admin_username" {
  description = "Usuario administrador de PostgreSQL."
  type        = string
}

variable "postgresql_admin_password" {
  description = "Password administrador de PostgreSQL."
  type        = string
  sensitive   = true
}

variable "postgresql_version" {
  description = "Version de PostgreSQL Flexible Server."
  type        = string
  default     = "16"
}

variable "postgresql_sku_name" {
  description = "SKU de PostgreSQL Flexible Server."
  type        = string
  default     = "B_Standard_B1ms"
}

variable "postgresql_storage_mb" {
  description = "Storage aprovisionado para PostgreSQL en MB."
  type        = number
  default     = 32768
}

variable "postgresql_backup_retention_days" {
  description = "Dias de retencion de backups."
  type        = number
  default     = 7
}

variable "backend_app_name" {
  description = "Nombre de la Container App del backend."
  type        = string
}

variable "frontend_app_name" {
  description = "Nombre de la Container App del frontend."
  type        = string
}

variable "backend_image" {
  description = "Imagen completa del backend."
  type        = string
}

variable "frontend_image" {
  description = "Imagen completa del frontend."
  type        = string
}

variable "registry_server" {
  description = "Servidor del container registry. Nulo para imagenes publicas."
  type        = string
  default     = null
}

variable "registry_username" {
  description = "Usuario del registry."
  type        = string
  default     = null
  sensitive   = true
}

variable "registry_password" {
  description = "Password o token del registry."
  type        = string
  default     = null
  sensitive   = true
}

variable "enable_key_vault_secret_references" {
  description = "Cuando es true, Container Apps consume secretos desde Key Vault usando managed identity."
  type        = bool
  default     = true
}

variable "key_vault_sku_name" {
  description = "SKU del Key Vault."
  type        = string
  default     = "standard"
}

variable "key_vault_purge_protection_enabled" {
  description = "Habilita purge protection para el Key Vault."
  type        = bool
  default     = false
}

variable "connection_string_secret_name" {
  description = "Nombre del secreto de connection string en Key Vault."
  type        = string
  default     = "connection-string"
}

variable "jwt_secret_name" {
  description = "Nombre del secreto JWT en Key Vault."
  type        = string
  default     = "jwt-secret"
}

variable "registry_password_secret_name" {
  description = "Nombre del secreto del registry en Key Vault."
  type        = string
  default     = "registry-password"
}

variable "smtp_password_secret_name" {
  description = "Nombre del secreto SMTP en Key Vault."
  type        = string
  default     = "smtp-password"
}

variable "jwt_secret" {
  description = "Secreto JWT del backend."
  type        = string
  sensitive   = true
}

variable "jwt_issuer" {
  description = "Issuer del token JWT."
  type        = string
  default     = "ti-garantias"
}

variable "jwt_audience" {
  description = "Audience del token JWT."
  type        = string
  default     = "ti-garantias-clients"
}

variable "aspnetcore_environment" {
  description = "Valor de ASPNETCORE_ENVIRONMENT."
  type        = string
  default     = "Production"
}

variable "smtp_host" {
  type    = string
  default = ""
}

variable "smtp_port" {
  type    = number
  default = 25
}

variable "smtp_user" {
  type      = string
  default   = ""
  sensitive = true
}

variable "smtp_password" {
  type      = string
  default   = ""
  sensitive = true
}

variable "smtp_from" {
  type    = string
  default = "no-reply@demo.local"
}

variable "backend_allowed_origins" {
  description = "Origins permitidos por CORS para escenarios directos."
  type        = list(string)
  default     = ["http://localhost:4200"]
}

variable "attachments_mount_path" {
  description = "Path montado para adjuntos."
  type        = string
  default     = "/data/attachments"
}

variable "backend_min_replicas" {
  type    = number
  default = 0
}

variable "backend_max_replicas" {
  type    = number
  default = 1
}

variable "backend_cpu" {
  type    = number
  default = 0.5
}

variable "backend_memory" {
  type    = string
  default = "1Gi"
}

variable "backend_external_enabled" {
  type    = bool
  default = false
}

variable "frontend_min_replicas" {
  type    = number
  default = 0
}

variable "frontend_max_replicas" {
  type    = number
  default = 1
}

variable "frontend_cpu" {
  type    = number
  default = 0.25
}

variable "frontend_memory" {
  type    = string
  default = "0.5Gi"
}

variable "frontend_api_base_url" {
  description = "Valor inyectado al frontend. Vacio para usar mismo origen."
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags comunes."
  type        = map(string)
  default     = {}
}
