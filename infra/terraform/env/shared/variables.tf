variable "location" {
  type    = string
  default = "centralus"
}

variable "name_prefix" {
  type    = string
  default = "tigarantias"
}

variable "admin_username" {
  type    = string
  default = "azureuser"
}

variable "ssh_public_key" {
  type      = string
  sensitive = true
}

variable "vm_size" {
  type    = string
  default = "Standard_B2s"
}

variable "jenkins_port" {
  type    = number
  default = 8080
}

variable "ssh_source_address_prefix" {
  type    = string
  default = "*"
}

variable "jenkins_source_address_prefix" {
  type    = string
  default = "*"
}

variable "public_ip_dns_label" {
  type    = string
  default = null
}

variable "bootstrap_jenkins" {
  type    = bool
  default = false
}

variable "repository_url" {
  type    = string
  default = ""
}

variable "repository_branch" {
  type    = string
  default = "main"
}

variable "tags" {
  type    = map(string)
  default = {}
}
