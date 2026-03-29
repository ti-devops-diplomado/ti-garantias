locals {
  resource_group_name         = "${var.name_prefix}-shared-rg"
  virtual_network_name        = "${var.name_prefix}-shared-vnet"
  subnet_name                 = "jenkins-subnet"
  network_security_group_name = "${var.name_prefix}-jenkins-nsg"
  public_ip_name              = "${var.name_prefix}-jenkins-pip"
  network_interface_name      = "${var.name_prefix}-jenkins-nic"
  vm_name                     = "${var.name_prefix}-jenkins-vm"
}

module "jenkins_host" {
  source = "../../modules/jenkins_host"

  location                    = var.location
  name_prefix                 = var.name_prefix
  resource_group_name         = local.resource_group_name
  virtual_network_name        = local.virtual_network_name
  subnet_name                 = local.subnet_name
  network_security_group_name = local.network_security_group_name
  public_ip_name              = local.public_ip_name
  network_interface_name      = local.network_interface_name
  vm_name                     = local.vm_name

  admin_username                = var.admin_username
  ssh_public_key                = var.ssh_public_key
  vm_size                       = var.vm_size
  jenkins_port                  = var.jenkins_port
  ssh_source_address_prefix     = var.ssh_source_address_prefix
  jenkins_source_address_prefix = var.jenkins_source_address_prefix
  public_ip_dns_label           = var.public_ip_dns_label
  bootstrap_jenkins             = var.bootstrap_jenkins
  repository_url                = var.repository_url
  repository_branch             = var.repository_branch

  tags = merge(var.tags, { tier = "shared" })
}

output "jenkins_url" {
  value = module.jenkins_host.jenkins_url
}

output "ssh_command" {
  value = module.jenkins_host.ssh_command
}

output "public_ip_address" {
  value = module.jenkins_host.public_ip_address
}
