variable "location" {
  type    = string
  default = "centralus"
}

variable "name_prefix" {
  type    = string
  default = "tigarantias"
}

variable "unique_suffix" {
  description = "Sufijo corto para recursos globally unique."
  type        = string
}

variable "backend_image" {
  type = string
}

variable "frontend_image" {
  type = string
}

variable "registry_server" {
  type    = string
  default = null
}

variable "registry_username" {
  type      = string
  default   = null
  sensitive = true
}

variable "registry_password" {
  type      = string
  default   = null
  sensitive = true
}

variable "postgresql_admin_username" {
  type    = string
  default = "tigarantiasadmin"
}

variable "postgresql_admin_password" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "enable_key_vault_secret_references" {
  description = "Cuando es true, Container Apps consume secretos desde Key Vault usando managed identity."
  type        = bool
  default     = true
}

variable "tags" {
  type    = map(string)
  default = {}
}
