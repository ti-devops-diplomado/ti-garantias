pipeline {
  agent any

  options {
    timestamps()
    ansiColor('xterm')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  parameters {
    choice(name: 'ENVIRONMENT', choices: ['dev', 'test', 'prod'], description: 'Ambiente objetivo')
    choice(name: 'TERRAFORM_ACTION', choices: ['plan', 'apply'], description: 'Accion de Terraform')
    booleanParam(name: 'PUSH_IMAGES', defaultValue: true, description: 'Construir y publicar imagenes')
    string(name: 'REGISTRY_SERVER', defaultValue: 'docker.io', description: 'Registry server')
    string(name: 'REGISTRY_NAMESPACE', defaultValue: 'tu-usuario', description: 'Namespace u organizacion del registry')
    string(name: 'IMAGE_TAG', defaultValue: '', description: 'Tag manual opcional. Si se deja vacio se genera desde VERSION + SHA')
  }

  environment {
    TF_IN_AUTOMATION = 'true'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Resolve metadata') {
      steps {
        script {
          def version = readFile('VERSION').trim()
          def shortSha = env.GIT_COMMIT.take(7)
          env.EFFECTIVE_IMAGE_TAG = params.IMAGE_TAG?.trim() ? params.IMAGE_TAG.trim() : "v${version}-${shortSha}"
          env.BACKEND_IMAGE = "${params.REGISTRY_SERVER}/${params.REGISTRY_NAMESPACE}/ti-garantias-backend:${env.EFFECTIVE_IMAGE_TAG}"
          env.FRONTEND_IMAGE = "${params.REGISTRY_SERVER}/${params.REGISTRY_NAMESPACE}/ti-garantias-frontend:${env.EFFECTIVE_IMAGE_TAG}"
          env.TF_ROOT = "infra/terraform/env/${params.ENVIRONMENT}"
        }
      }
    }

    stage('Terraform quality') {
      steps {
        sh '''
          set -euo pipefail
          terraform fmt -check -recursive infra/terraform
          terraform -chdir="$TF_ROOT" init -backend=false
          terraform -chdir="$TF_ROOT" validate
        '''
      }
    }

    stage('Backend tests') {
      steps {
        dir('backend/tests/TiGarantias.Api.Tests') {
          sh '''
            set -euo pipefail
            dotnet test TiGarantias.Api.Tests.csproj -c Release
          '''
        }
      }
    }

    stage('Frontend build') {
      steps {
        dir('frontend') {
          sh '''
            set -euo pipefail
            npm ci
            npm run build
          '''
        }
      }
    }

    stage('Build and push images') {
      when {
        expression { return params.PUSH_IMAGES }
      }
      steps {
        withCredentials([usernamePassword(credentialsId: 'ti-garantias-registry', usernameVariable: 'REGISTRY_USERNAME', passwordVariable: 'REGISTRY_PASSWORD')]) {
          sh '''
            set -euo pipefail
            printf '%s' "$REGISTRY_PASSWORD" | docker login "$REGISTRY_SERVER" -u "$REGISTRY_USERNAME" --password-stdin
            docker build -t "$BACKEND_IMAGE" backend
            docker build -t "$FRONTEND_IMAGE" frontend
            docker push "$BACKEND_IMAGE"
            docker push "$FRONTEND_IMAGE"
          '''
        }
      }
    }

    stage('Terraform init') {
      steps {
        dir("${env.TF_ROOT}") {
          withCredentials([
            string(credentialsId: 'azure-client-id', variable: 'ARM_CLIENT_ID'),
            string(credentialsId: 'azure-client-secret', variable: 'ARM_CLIENT_SECRET'),
            string(credentialsId: 'azure-subscription-id', variable: 'ARM_SUBSCRIPTION_ID'),
            string(credentialsId: 'azure-tenant-id', variable: 'ARM_TENANT_ID')
          ]) {
            sh '''
              set -euo pipefail
              terraform init \
                -backend-config="resource_group_name=$TFSTATE_RESOURCE_GROUP" \
                -backend-config="storage_account_name=$TFSTATE_STORAGE_ACCOUNT" \
                -backend-config="container_name=$TFSTATE_CONTAINER" \
                -backend-config="key=ti-garantias-${ENVIRONMENT}.tfstate"
            '''
          }
        }
      }
    }

    stage('Bootstrap Key Vault secrets') {
      steps {
        dir("${env.TF_ROOT}") {
          withCredentials([
            string(credentialsId: 'azure-client-id', variable: 'ARM_CLIENT_ID'),
            string(credentialsId: 'azure-client-secret', variable: 'ARM_CLIENT_SECRET'),
            string(credentialsId: 'azure-subscription-id', variable: 'ARM_SUBSCRIPTION_ID'),
            string(credentialsId: 'azure-tenant-id', variable: 'ARM_TENANT_ID'),
            string(credentialsId: "ti-garantias-${params.ENVIRONMENT}-pg-admin-password", variable: 'TF_VAR_postgresql_admin_password'),
            string(credentialsId: "ti-garantias-${params.ENVIRONMENT}-jwt-secret", variable: 'TF_VAR_jwt_secret'),
            string(credentialsId: "ti-garantias-${params.ENVIRONMENT}-unique-suffix", variable: 'TF_VAR_unique_suffix'),
            usernamePassword(credentialsId: 'ti-garantias-registry', usernameVariable: 'REGISTRY_USERNAME', passwordVariable: 'REGISTRY_PASSWORD')
          ]) {
            sh '''
              set -euo pipefail
              terraform apply -auto-approve \
                -target=module.stack.azurerm_key_vault.this \
                -target=module.stack.azurerm_user_assigned_identity.container_apps \
                -target=module.stack.azurerm_role_assignment.container_apps_key_vault_reader \
                -target=module.stack.azurerm_role_assignment.deployer_key_vault_secrets_officer \
                -target=module.stack.azurerm_postgresql_flexible_server.this \
                -target=module.stack.azurerm_postgresql_flexible_server_database.this \
                -target=module.stack.azurerm_postgresql_flexible_server_firewall_rule.azure_services \
                -var="backend_image=$BACKEND_IMAGE" \
                -var="frontend_image=$FRONTEND_IMAGE" \
                -var="registry_server=$REGISTRY_SERVER" \
                -var="registry_username=$REGISTRY_USERNAME" \
                -var="enable_key_vault_secret_references=false"

              az login --service-principal -u "$ARM_CLIENT_ID" -p "$ARM_CLIENT_SECRET" --tenant "$ARM_TENANT_ID" >/dev/null
              az account set --subscription "$ARM_SUBSCRIPTION_ID"

              KEY_VAULT_NAME="$(terraform output -raw key_vault_name)"
              POSTGRES_FQDN="$(terraform output -raw postgresql_fqdn)"
              POSTGRES_DATABASE_NAME="$(terraform output -raw postgresql_database_name)"
              POSTGRES_ADMIN_USERNAME="$(terraform output -raw postgresql_admin_username)"

              az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name connection-string --value "Host=$POSTGRES_FQDN;Port=5432;Database=$POSTGRES_DATABASE_NAME;Username=$POSTGRES_ADMIN_USERNAME;Password=$TF_VAR_postgresql_admin_password;Ssl Mode=Require;Trust Server Certificate=true" --only-show-errors >/dev/null
              az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name jwt-secret --value "$TF_VAR_jwt_secret" --only-show-errors >/dev/null
              az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name postgresql-admin-password --value "$TF_VAR_postgresql_admin_password" --only-show-errors >/dev/null

              if [ -n "${REGISTRY_USERNAME:-}" ]; then
                az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name registry-password --value "$REGISTRY_PASSWORD" --only-show-errors >/dev/null
              fi

              sleep 20
            '''
          }
        }
      }
    }

    stage('Terraform plan/apply') {
      steps {
        dir("${env.TF_ROOT}") {
          withCredentials([
            string(credentialsId: 'azure-client-id', variable: 'ARM_CLIENT_ID'),
            string(credentialsId: 'azure-client-secret', variable: 'ARM_CLIENT_SECRET'),
            string(credentialsId: 'azure-subscription-id', variable: 'ARM_SUBSCRIPTION_ID'),
            string(credentialsId: 'azure-tenant-id', variable: 'ARM_TENANT_ID'),
            string(credentialsId: "ti-garantias-${params.ENVIRONMENT}-pg-admin-password", variable: 'TF_VAR_postgresql_admin_password'),
            string(credentialsId: "ti-garantias-${params.ENVIRONMENT}-jwt-secret", variable: 'TF_VAR_jwt_secret'),
            string(credentialsId: "ti-garantias-${params.ENVIRONMENT}-unique-suffix", variable: 'TF_VAR_unique_suffix'),
            usernamePassword(credentialsId: 'ti-garantias-registry', usernameVariable: 'TF_VAR_registry_username', passwordVariable: 'TF_VAR_registry_password')
          ]) {
            sh '''
              set -euo pipefail
              terraform plan \
                -var="backend_image=$BACKEND_IMAGE" \
                -var="frontend_image=$FRONTEND_IMAGE" \
                -var="registry_server=$REGISTRY_SERVER" \
                -out=tfplan
            '''
            script {
              if (params.TERRAFORM_ACTION == 'apply') {
                if (params.ENVIRONMENT == 'prod') {
                  input message: 'Confirmar despliegue a prod', ok: 'Desplegar'
                }
                sh '''
                  set -euo pipefail
                  terraform apply -auto-approve tfplan
                '''
              }
            }
          }
        }
      }
    }
  }
}
