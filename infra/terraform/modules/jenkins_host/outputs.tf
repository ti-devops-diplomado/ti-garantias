output "resource_group_name" {
  value = azurerm_resource_group.this.name
}

output "vm_name" {
  value = azurerm_linux_virtual_machine.this.name
}

output "public_ip_address" {
  value = azurerm_public_ip.this.ip_address
}

output "jenkins_url" {
  value = "http://${azurerm_public_ip.this.ip_address}:${var.jenkins_port}"
}

output "ssh_command" {
  value = "ssh ${var.admin_username}@${azurerm_public_ip.this.ip_address}"
}
