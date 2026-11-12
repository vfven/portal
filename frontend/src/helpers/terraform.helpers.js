// ═══════════════════════════════════════════════════════════════════════════
// GENERADOR DE TERRAFORM — Provisión de VM
//
// Recibe el payload del form "Provisión de VM" del portal y genera un set
// de archivos .tf listos para que el equipo DevOps corra `terraform init`
// y `terraform apply`.
//
// Proveedores según `centro_datos`:
//   - Querétaro / Monterrey / Ciudad de México → vSphere (on-prem)
//   - Cloud AWS   → AWS
//   - Cloud Azure → Azure (azurerm)
//
// Los archivos usan placeholders `TODO://` donde se necesita info de la
// infra real (vCenter URL, datastore, network, AMI, etc.). El equipo DevOps
// completa esos TODO antes de aplicar.
// ═══════════════════════════════════════════════════════════════════════════

const ON_PREM = ['Querétaro', 'Monterrey', 'Ciudad de México'];

/**
 * Determina el proveedor Terraform basado en el centro de datos elegido.
 * @param {string} centroDatos
 * @returns {'vsphere'|'aws'|'azurerm'}
 */
function detectarProveedor(centroDatos) {
  if (!centroDatos) return 'vsphere';
  if (ON_PREM.includes(centroDatos)) return 'vsphere';
  if (/azure/i.test(centroDatos))    return 'azurerm';
  return 'aws';
}

/**
 * Normaliza el nombre de la VM a snake_case para usarlo como identificador
 * Terraform (letras/dígitos/_).
 */
function tfIdent(nombre) {
  return String(nombre || 'vm').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'vm';
}

/**
 * Parsea el campo `discos` (que llega como string JSON desde el repeater).
 * @returns {Array<{nombre:string, size_gb:number}>}
 */
function parseDiscos(raw) {
  if (!raw) return [];
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(arr)) return [];
    return arr
      .map(d => ({ nombre: String(d.nombre || '').trim(), size_gb: parseInt(d.size_gb, 10) }))
      .filter(d => d.nombre && d.size_gb > 0);
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

function renderVsphere(datos) {
  const id       = tfIdent(datos.nombre_vm);
  const discos   = parseDiscos(datos.discos);
  const guestId  = datos.os === 'Windows' ? 'windows2019srvNext_64Guest' : 'ubuntu64Guest';
  const vcpus    = parseInt(datos.vcpus, 10) || 2;
  const ramMb    = (parseInt(datos.ram_gb, 10) || 4) * 1024;

  const main = `# ═══════════════════════════════════════════════════════════════════════════
# VM: ${datos.nombre_vm}   ·   Proveedor: vSphere (On-Prem)
# Centro de datos: ${datos.centro_datos}
# Generado automáticamente por el Portal DevOps · ${new Date().toISOString()}
# ═══════════════════════════════════════════════════════════════════════════

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    vsphere = {
      source  = "hashicorp/vsphere"
      version = "~> 2.8"
    }
  }
}

provider "vsphere" {
  user                 = var.vsphere_user
  password             = var.vsphere_password
  vsphere_server       = var.vsphere_server
  allow_unverified_ssl = true
}

# ── Data sources ──────────────────────────────────────────────────────────
data "vsphere_datacenter" "dc" {
  name = var.vsphere_datacenter
}

data "vsphere_datastore" "ds" {
  name          = var.vsphere_datastore
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_resource_pool" "pool" {
  name          = var.vsphere_resource_pool
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_network" "net" {
  name          = var.vsphere_network
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_virtual_machine" "template" {
  name          = var.vsphere_template   # TODO:// mapeo real de "${datos.template}"
  datacenter_id = data.vsphere_datacenter.dc.id
}

# ── VM ────────────────────────────────────────────────────────────────────
resource "vsphere_virtual_machine" "${id}" {
  name             = "${datos.nombre_vm}"
  resource_pool_id = data.vsphere_resource_pool.pool.id
  datastore_id     = data.vsphere_datastore.ds.id

  num_cpus = ${vcpus}
  memory   = ${ramMb}
  guest_id = "${guestId}"

  network_interface {
    network_id   = data.vsphere_network.net.id
    adapter_type = "vmxnet3"
  }

  # Disco de sistema (clonado del template)
  disk {
    label            = "disk0"
    size             = data.vsphere_virtual_machine.template.disks[0].size
    eagerly_scrub    = false
    thin_provisioned = true
  }
${discos.map((d, i) => `
  # Disco adicional: ${d.nombre}
  disk {
    label            = "${tfIdent(d.nombre)}"
    size             = ${d.size_gb}
    unit_number      = ${i + 1}
    eagerly_scrub    = false
    thin_provisioned = true
  }`).join('')}

  clone {
    template_uuid = data.vsphere_virtual_machine.template.id
  }

  # Tags / metadata (solo informativos — vSphere requiere category_id si usas vsphere_tag)
  # TODO:// Habilitar tags si tu vCenter tiene categorías configuradas.
  # tags = [...]

  # Metadata extra para trazabilidad en el inventario
  extra_config = {
    "guestinfo.ambiente"       = "${datos.ambiente || ''}"
    "guestinfo.rol"            = "${datos.rol || ''}"
    "guestinfo.proyecto"       = "${datos.proyecto || ''}"
    "guestinfo.propietario"    = "${datos.propietario || ''}"
    "guestinfo.clasificacion"  = "${datos.clasificacion || ''}"
    "guestinfo.grupo_usuarios" = "${datos.grupo_usuarios || ''}"
    "guestinfo.software"       = "${datos.software || ''}"
  }
}

# ── Outputs ───────────────────────────────────────────────────────────────
output "vm_name" {
  value = vsphere_virtual_machine.${id}.name
}

output "vm_ip" {
  value = vsphere_virtual_machine.${id}.default_ip_address
}

output "vm_uuid" {
  value = vsphere_virtual_machine.${id}.uuid
}
`;

  const variables = `# Variables — define en terraform.tfvars o exporta como TF_VAR_*
variable "vsphere_user"           { type = string ; sensitive = true }
variable "vsphere_password"       { type = string ; sensitive = true }
variable "vsphere_server"         { type = string ; description = "FQDN del vCenter" }
variable "vsphere_datacenter"     { type = string }
variable "vsphere_datastore"      { type = string }
variable "vsphere_resource_pool"  { type = string }
variable "vsphere_network"        { type = string }
variable "vsphere_template"       { type = string ; description = "Nombre del template VM a clonar" }
`;

  const tfvars = `# ═══════════════════════════════════════════════════════════════════════════
# Valores para ESTA solicitud. Completa los TODO antes de correr terraform.
# NO commitees credenciales — usa variables de entorno TF_VAR_* en su lugar.
# ═══════════════════════════════════════════════════════════════════════════

# TODO:// Credenciales — mejor pasa por env TF_VAR_vsphere_user / _password
# vsphere_user     = "svc_terraform@bancobase.com"
# vsphere_password = "***"

vsphere_server        = "vcenter-${datos.centro_datos.toLowerCase().replace(/[^a-z]/g, '')}.bancobase.local"   # TODO:// URL real del vCenter
vsphere_datacenter    = "DC-${datos.centro_datos}"                                                             # TODO:// nombre real del datacenter
vsphere_datastore     = "DS-${datos.ambiente}"                                                                 # TODO:// datastore real por ambiente
vsphere_resource_pool = "RP-${datos.ambiente}"                                                                 # TODO:// resource pool real
vsphere_network       = "VLAN-${datos.ambiente}"                                                               # TODO:// VLAN/network real
vsphere_template      = "TMPL-${(datos.template || '').match(/\(([A-Z]+)\)/)?.[1] || 'LNX'}"                   # TODO:// nombre real del template
`;

  return { main, variables, tfvars };
}

function renderAws(datos) {
  const id      = tfIdent(datos.nombre_vm);
  const discos  = parseDiscos(datos.discos);
  const vcpus   = parseInt(datos.vcpus, 10) || 2;
  const ramGb   = parseInt(datos.ram_gb, 10) || 4;

  // Sugerencia de instance type aproximada (el ops debe validar)
  const instanceType =
    vcpus <= 2 && ramGb <= 8  ? 't3.large' :
    vcpus <= 4 && ramGb <= 16 ? 't3.xlarge' :
    vcpus <= 8 && ramGb <= 32 ? 'm5.2xlarge' :
                                 'm5.4xlarge';

  const main = `# ═══════════════════════════════════════════════════════════════════════════
# VM: ${datos.nombre_vm}   ·   Proveedor: AWS
# Generado automáticamente por el Portal DevOps · ${new Date().toISOString()}
# ═══════════════════════════════════════════════════════════════════════════

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_instance" "${id}" {
  ami           = var.ami_id     # TODO:// AMI según OS (${datos.os}) y región
  instance_type = "${instanceType}"   # Sugerido (${vcpus} vCPU · ${ramGb} GB) — ajustar si procede
  subnet_id     = var.subnet_id  # TODO:// subnet del ambiente ${datos.ambiente}

  vpc_security_group_ids = var.security_group_ids  # TODO:// SGs apropiados

  root_block_device {
    volume_size = 80
    volume_type = "gp3"
    encrypted   = true
  }
${discos.map(d => `
  ebs_block_device {
    device_name = "/dev/sd${d.nombre.toLowerCase().charAt(0) || 'f'}"  # TODO:// mapeo real device
    volume_size = ${d.size_gb}
    volume_type = "gp3"
    encrypted   = true
  }`).join('')}

  tags = {
    Name          = "${datos.nombre_vm}"
    Environment   = "${datos.ambiente || ''}"
    Project       = "${datos.proyecto || ''}"
    ProjectKey    = "${datos.claves || ''}"
    Role          = "${datos.rol || ''}"
    Owner         = "${datos.propietario || ''}"
    Classification= "${datos.clasificacion || ''}"
    OS            = "${datos.os || ''}"
    ManagedBy     = "terraform"
    CreatedBy     = "devops-portal"
  }
}

output "instance_id"  { value = aws_instance.${id}.id }
output "private_ip"   { value = aws_instance.${id}.private_ip }
output "public_ip"    { value = aws_instance.${id}.public_ip }
`;

  const variables = `variable "aws_region"         { type = string }
variable "ami_id"             { type = string ; description = "AMI para ${datos.os}" }
variable "subnet_id"          { type = string }
variable "security_group_ids" { type = list(string) ; default = [] }
`;

  const tfvars = `# ═══════════════════════════════════════════════════════════════════════════
# Valores para ESTA solicitud. Completa los TODO.
# Credenciales AWS: usa AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (env).
# ═══════════════════════════════════════════════════════════════════════════

aws_region         = "us-east-1"        # TODO:// región correcta
ami_id             = "ami-TODO"         # TODO:// AMI ${datos.os} aprobada por seguridad
subnet_id          = "subnet-TODO"      # TODO:// subnet del VPC para ${datos.ambiente}
security_group_ids = ["sg-TODO"]        # TODO:// security groups aplicables
`;

  return { main, variables, tfvars };
}

function renderAzure(datos) {
  const id    = tfIdent(datos.nombre_vm);
  const vcpus = parseInt(datos.vcpus, 10) || 2;
  const ramGb = parseInt(datos.ram_gb, 10) || 4;
  const vmSize =
    vcpus <= 2 && ramGb <= 8  ? 'Standard_D2s_v5' :
    vcpus <= 4 && ramGb <= 16 ? 'Standard_D4s_v5' :
                                 'Standard_D8s_v5';

  const main = `# ═══════════════════════════════════════════════════════════════════════════
# VM: ${datos.nombre_vm}   ·   Proveedor: Azure
# Generado automáticamente por el Portal DevOps · ${new Date().toISOString()}
# ═══════════════════════════════════════════════════════════════════════════

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
  }
}

provider "azurerm" { features {} }

resource "azurerm_${datos.os === 'Windows' ? 'windows' : 'linux'}_virtual_machine" "${id}" {
  name                  = "${datos.nombre_vm}"
  resource_group_name   = var.resource_group
  location              = var.location
  size                  = "${vmSize}"   # Sugerido (${vcpus} vCPU · ${ramGb} GB)
  admin_username        = "azureuser"
  network_interface_ids = [azurerm_network_interface.${id}_nic.id]

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb         = 80
  }

  # TODO:// configurar source_image_reference o source_image_id según plantilla
  # source_image_reference { publisher = "Canonical" ; offer = "0001-com-ubuntu-server-jammy" ; sku = "22_04-lts" ; version = "latest" }

  tags = {
    Environment = "${datos.ambiente || ''}"
    Project     = "${datos.proyecto || ''}"
    Owner       = "${datos.propietario || ''}"
    Role        = "${datos.rol || ''}"
  }
}

resource "azurerm_network_interface" "${id}_nic" {
  name                = "${datos.nombre_vm}-nic"
  location            = var.location
  resource_group_name = var.resource_group
  ip_configuration {
    name                          = "ipcfg"
    subnet_id                     = var.subnet_id   # TODO://
    private_ip_address_allocation = "Dynamic"
  }
}
`;

  const variables = `variable "resource_group" { type = string }
variable "location"       { type = string }
variable "subnet_id"      { type = string }
`;

  const tfvars = `resource_group = "rg-TODO"      # TODO:// resource group del ambiente ${datos.ambiente}
location       = "eastus"       # TODO:// región Azure
subnet_id      = "/subscriptions/.../subnets/TODO"   # TODO:// subnet real
`;

  return { main, variables, tfvars };
}

// ═══════════════════════════════════════════════════════════════════════════
// README
// ═══════════════════════════════════════════════════════════════════════════

function renderReadme(datos, proveedor) {
  return `# Terraform · ${datos.nombre_vm}

Archivos autogenerados por el Portal DevOps de Banco BASE.

**Proveedor**: ${proveedor}
**Centro de datos**: ${datos.centro_datos}
**Ambiente**: ${datos.ambiente}
**Solicitante**: ${datos.email_solicitante || 'n/a'}
**Propietario**: ${datos.propietario || 'n/a'}

---

## Pasos

1. Descarga los 3 archivos adjuntos del ticket (\`main.tf\`, \`variables.tf\`, \`terraform.tfvars\`).
2. Colócalos en un directorio limpio junto a este README.
3. Revisa y completa los placeholders marcados como \`TODO://\` en \`terraform.tfvars\` y \`main.tf\`.
4. Configura credenciales como variables de entorno (NO en los archivos):
${proveedor === 'vsphere' ? `   \`\`\`bash
   export TF_VAR_vsphere_user='svc_terraform@bancobase.com'
   export TF_VAR_vsphere_password='***'
   \`\`\`` : proveedor === 'aws' ? `   \`\`\`bash
   export AWS_ACCESS_KEY_ID='AKIA...'
   export AWS_SECRET_ACCESS_KEY='***'
   \`\`\`` : `   \`\`\`bash
   az login
   \`\`\``}
5. Ejecuta:
   \`\`\`bash
   terraform init
   terraform plan -out=tfplan
   terraform apply tfplan
   \`\`\`
6. Al terminar, pega el output (IP, hostname) como comentario en el ticket de Jira.

---

## Resumen del request

| Campo | Valor |
|---|---|
${Object.entries(datos)
  .filter(([k]) => !['email_solicitante', 'fecha', 'nombreServicio', 'discos'].includes(k))
  .map(([k, v]) => `| ${k.replace(/_/g, ' ')} | ${String(v)} |`)
  .join('\n')}

${(() => {
  const discos = parseDiscos(datos.discos);
  if (!discos.length) return '';
  return `\n### Discos adicionales\n\n| Nombre | Tamaño (GB) |\n|---|---|\n${discos.map(d => `| ${d.nombre} | ${d.size_gb} |`).join('\n')}\n`;
})()}
`;
}

// ═══════════════════════════════════════════════════════════════════════════
// API PÚBLICA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Genera el set de archivos .tf para una solicitud de VM.
 * @param {object} datos - payload del form "Provisión de VM"
 * @returns {{proveedor:string, files: Array<{name:string, content:string}>}}
 */
function generarTerraformVM(datos) {
  const proveedor = detectarProveedor(datos.centro_datos);
  let rendered;
  if (proveedor === 'vsphere')  rendered = renderVsphere(datos);
  else if (proveedor === 'aws') rendered = renderAws(datos);
  else                           rendered = renderAzure(datos);

  return {
    proveedor,
    files: [
      { name: 'main.tf',           content: rendered.main },
      { name: 'variables.tf',      content: rendered.variables },
      { name: 'terraform.tfvars',  content: rendered.tfvars },
      { name: 'README.md',         content: renderReadme(datos, proveedor) },
    ],
  };
}

module.exports = {
  generarTerraformVM,
  detectarProveedor,
};
