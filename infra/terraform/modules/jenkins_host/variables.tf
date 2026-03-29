variable "name_prefix" {
  description = "Prefijo corto del proyecto usado en nombres de recursos."
  type        = string
}

variable "location" {
  description = "Region de Azure."
  type        = string
}

variable "resource_group_name" {
  description = "Nombre del resource group compartido."
  type        = string
}

variable "virtual_network_name" {
  description = "Nombre de la red virtual."
  type        = string
}

variable "subnet_name" {
  description = "Nombre de la subnet de Jenkins."
  type        = string
}

variable "network_security_group_name" {
  description = "Nombre del NSG."
  type        = string
}

variable "public_ip_name" {
  description = "Nombre del public IP."
  type        = string
}

variable "network_interface_name" {
  description = "Nombre del NIC."
  type        = string
}

variable "vm_name" {
  description = "Nombre de la VM de Jenkins."
  type        = string
}

variable "admin_username" {
  description = "Usuario administrador de la VM."
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key" {
  description = "Llave publica SSH para acceder a la VM."
  type        = string
}

variable "vm_size" {
  description = "Tamaño de la VM."
  type        = string
  default     = "Standard_B2s"
}

variable "os_disk_size_gb" {
  description = "Tamano del disco del sistema operativo."
  type        = number
  default     = 64
}

variable "jenkins_port" {
  description = "Puerto publico de Jenkins en la VM."
  type        = number
  default     = 8080
}

variable "vnet_address_space" {
  description = "Espacio de direcciones de la VNet."
  type        = list(string)
  default     = ["10.40.0.0/16"]
}

variable "subnet_address_prefixes" {
  description = "Prefijos CIDR de la subnet."
  type        = list(string)
  default     = ["10.40.1.0/24"]
}

variable "ssh_source_address_prefix" {
  description = "Origen permitido para SSH."
  type        = string
  default     = "*"
}

variable "jenkins_source_address_prefix" {
  description = "Origen permitido para la UI de Jenkins."
  type        = string
  default     = "*"
}

variable "public_ip_dns_label" {
  description = "DNS label opcional para la IP publica."
  type        = string
  default     = null
}

variable "repository_url" {
  description = "URL del repositorio a clonar para bootstrap automatico."
  type        = string
  default     = ""
}

variable "repository_branch" {
  description = "Branch a clonar durante el bootstrap."
  type        = string
  default     = "main"
}

variable "bootstrap_jenkins" {
  description = "Si es true, la VM clona el repo y levanta Jenkins automaticamente."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags comunes."
  type        = map(string)
  default     = {}
}
