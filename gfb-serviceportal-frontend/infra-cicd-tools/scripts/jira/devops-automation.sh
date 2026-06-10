#!/bin/bash

# =============================================================================
# JIRA Release and Stories Creator - ESTRUCTURA JERÁRQUICA
# =============================================================================

set -Eeuo pipefail

# Load utilities
UTILS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../utils" && pwd)"
source "$UTILS_DIR/logging.sh"
source "$UTILS_DIR/error-handling.sh"
source "$UTILS_DIR/utils.sh"

# Initialize
init_utilities
start_timer

log_section "JIRA Release and Stories Creator - Estructura Jerárquica Completa"

# =============================================================================
# Configuration
# =============================================================================

# Cargar variables desde .env
if [ -f .env ]; then
    source .env
fi

# Project and repo configuration
JIRA_PROJECT_KEY="${JIRA_PROJECT_KEY:-JD}"
REPO_NAME="${REPO_NAME:-app-source-code}"
APP_VERSION="${APP_VERSION:-1.0.0}"
BUILD_NUMBER="${BITBUCKET_BUILD_NUMBER:-local}"

# JIRA Configuration
validate_required_vars JIRA_BASE_URL JIRA_USERNAME JIRA_API_TOKEN
JIRA_BASE_URL="${JIRA_BASE_URL%/}"

log_info "Configuration:"
log_info "  Project: $JIRA_PROJECT_KEY"
log_info "  Repository: $REPO_NAME"
log_info "  Version: $APP_VERSION"
log_info "  Build: $BUILD_NUMBER"

# =============================================================================
# Global Variables para resultados
# =============================================================================
RELEASE_VERSION_ID=""
RELEASE_NAME=""
RELEASE_URL=""
PROJECT_ID=""
EPIC_ISSUE_TYPE_ID=""
STORY_ISSUE_TYPE_ID=""
SUBTASK_ISSUE_TYPE_ID=""
EPIC_KEY=""

# =============================================================================
# Functions - ESTRUCTURA JERÁRQUICA COMPLETA
# =============================================================================

# Function to test JIRA connection
test_jira_connection() {
    log_step "1" "Testing JIRA connection"
    
    response=$(curl -s -w "\n%{http_code}" -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
        -X GET "$JIRA_BASE_URL/rest/api/3/myself")
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" -eq 200 ]; then
        local user_displayName=$(echo "$response" | sed '$d' | jq -r '.displayName')
        log_success "Connected to JIRA as: $user_displayName"
        return 0
    else
        log_error "JIRA connection failed (HTTP $http_code)"
        return 1
    fi
}

# Function to check if release version exists
check_release_exists() {
    local project_key="$1"
    local version_name="$2"
    
    log_step "2" "Checking if release exists: $version_name"
    
    # Obtener todas las versiones del proyecto
    response=$(curl -s -w "\n%{http_code}" -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
        -X GET "$JIRA_BASE_URL/rest/api/3/project/$project_key/versions")
    
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        local version_id=$(echo "$response_body" | jq -r ".[] | select(.name == \"$version_name\") | .id")
        
        if [ -n "$version_id" ]; then
            log_success "Release version exists: $version_name (ID: $version_id)"
            RELEASE_VERSION_ID="$version_id"
            return 0
        else
            log_info "Release version does not exist: $version_name"
            return 1
        fi
    else
        log_warning "Failed to get versions (HTTP $http_code)"
        return 1
    fi
}

# Function to create release version
create_release_version() {
    local project_key="$1"
    local version_name="$2"
    local repo_name="$3"
    
    log_step "3" "Creating release version: $version_name"
    
    # Crear nueva versión
    VERSION_JSON=$(cat << EOF
{
    "name": "$version_name",
    "description": "Automated release for repository: $repo_name",
    "archived": false,
    "released": false,
    "project": "$project_key"
}
EOF
)
    
    log_debug "Version JSON: $VERSION_JSON"
    
    response=$(curl -s -w "\n%{http_code}" -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$VERSION_JSON" \
        "$JIRA_BASE_URL/rest/api/3/version")
    
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 201 ]; then
        local version_id=$(echo "$response_body" | jq -r '.id')
        local created_version_name=$(echo "$response_body" | jq -r '.name')
        log_success "Release version created: $created_version_name (ID: $version_id)"
        RELEASE_VERSION_ID="$version_id"
        return 0
    else
        log_error "Failed to create release version (HTTP $http_code)"
        echo "Error: $response_body"
        return 1
    fi
}

# Function to get release info
get_release_info() {
    local version_id="$1"
    
    log_step "4" "Getting release information"
    
    response=$(curl -s -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
        -X GET "$JIRA_BASE_URL/rest/api/3/version/$version_id")
    
    RELEASE_NAME=$(echo "$response" | jq -r '.name // "Unknown"')
    local version_description=$(echo "$response" | jq -r '.description // "No description"')
    
    log_info "Release Name: $RELEASE_NAME"
    log_info "Release Description: $version_description"
}

# Function to create or get release
create_or_get_release() {
    local project_key="$1"
    local repo_name="$2"
    local app_version="$3"
    
    log_step "5" "Creating or getting release"
    
    # Formato según el manual: "repo-name vversion"
    RELEASE_NAME="$repo_name v$app_version"
    
    log_info "Release name: $RELEASE_NAME"
    
    # Verificar si ya existe
    if check_release_exists "$project_key" "$RELEASE_NAME"; then
        log_info "Release already exists, using existing version"
        # RELEASE_VERSION_ID ya está establecida por check_release_exists
    else
        log_info "Creating new release version"
        if create_release_version "$project_key" "$RELEASE_NAME" "$repo_name"; then
            log_info "Release created successfully"
        else
            log_error "Failed to create release"
            return 1
        fi
    fi
    
    # Obtener información del release
    if [ -n "$RELEASE_VERSION_ID" ]; then
        get_release_info "$RELEASE_VERSION_ID"
        
        # Construir URL del release
        RELEASE_URL="$JIRA_BASE_URL/projects/$project_key/versions/$RELEASE_VERSION_ID"
        
        log_success "🎉 Release ready: $RELEASE_NAME"
        log_success "📋 Release URL: $RELEASE_URL"
        log_success "🔧 Release ID: $RELEASE_VERSION_ID"
        
        return 0
    else
        log_error "No release version ID available"
        return 1
    fi
}

# Function to get project ID
get_project_id() {
    log_step "6" "Getting project ID"
    
    response=$(curl -s -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
        -X GET "$JIRA_BASE_URL/rest/api/3/project/$JIRA_PROJECT_KEY")
    
    PROJECT_ID=$(echo "$response" | jq -r '.id')
    
    if [ -n "$PROJECT_ID" ] && [ "$PROJECT_ID" != "null" ]; then
        log_success "Project ID: $PROJECT_ID"
        return 0
    else
        log_error "Failed to get project ID"
        return 1
    fi
}

# Function to get issue type ID
get_issue_type_id() {
    local issue_type_name="$1"
    local variable_name="$2"
    
    log_step "7" "Getting $issue_type_name issue type for project"
    
    # Obtener metadata específica del proyecto
    response=$(curl -s -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
        -X GET "$JIRA_BASE_URL/rest/api/3/issue/createmeta?projectKeys=$JIRA_PROJECT_KEY&expand=projects.issuetypes.fields")
    
    # Buscar el tipo específico en los disponibles para el proyecto
    local issue_type_id=$(echo "$response" | jq -r ".projects[0].issuetypes[] | select(.name == \"$issue_type_name\") | .id" 2>/dev/null | head -1)
    
    if [ -n "$issue_type_id" ] && [ "$issue_type_id" != "null" ]; then
        log_success "Found $issue_type_name issue type: $issue_type_id"
        eval "$variable_name=\"$issue_type_id\""
        return 0
    else
        log_error "$issue_type_name issue type not found in project $JIRA_PROJECT_KEY"
        
        # Mostrar los tipos disponibles para debugging
        log_info "Available issue types for project:"
        echo "$response" | jq -r '.projects[0].issuetypes[].name' 2>/dev/null | while read type; do
            log_info "  - $type"
        done
        
        return 1
    fi
}

# Function to get Epic Name field ID - VERSIÓN SEGURA
get_epic_name_field() {
    log_info "Detecting Epic Name field..."
    
    # Método directo: intentar obtener campos del proyecto
    response=$(curl -s -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
        -X GET "$JIRA_BASE_URL/rest/api/3/field")
    
    if [ $? -eq 0 ]; then
        # Buscar el campo Epic Name específicamente
        local epic_name_field=$(echo "$response" | jq -r '.[] | select(.name == "Epic Name") | .id' 2>/dev/null | head -1)
        
        if [ -n "$epic_name_field" ] && [ "$epic_name_field" != "null" ]; then
            # Verificar si este campo específico está causando problemas
            if [ "$epic_name_field" = "customfield_10011" ]; then
                log_warning "Epic Name field found but known to be problematic (customfield_10011), skipping"
                echo ""
                return 1
            else
                log_success "Found Epic Name field: $epic_name_field"
                echo "$epic_name_field"
                return 0
            fi
        fi
    fi
    
    log_info "No usable Epic Name field found, will create Epic without it"
    echo ""
    return 1
}

# Function to create Epic - VERSIÓN SIMPLE Y ELEGANTE
create_epic() {
    log_step "8" "Creating Epic for release"
    
    local epic_summary="Release $REPO_NAME v$APP_VERSION"
    
    log_info "Creating Epic: $epic_summary"
    
    EPIC_JSON=$(cat << EOF
{
    "fields": {
        "project": {
            "key": "$JIRA_PROJECT_KEY"
        },
        "summary": "$epic_summary",
        "issuetype": {
            "name": "Epic"
        }
    }
}
EOF
)
    
    response=$(curl -s -w "\n%{http_code}" -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$EPIC_JSON" \
        "$JIRA_BASE_URL/rest/api/3/issue")
    
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 201 ]; then
        # SOLUCIÓN SIMPLE - usar valor por defecto si summary es null
        EPIC_KEY=$(echo "$response_body" | jq -r '.key')
        local actual_summary=$(echo "$response_body" | jq -r '.fields.summary // "Release '$REPO_NAME' v'$APP_VERSION'"')
        local epic_url="$JIRA_BASE_URL/browse/$EPIC_KEY"
        
        log_success "✅ Epic created successfully: $EPIC_KEY"
        log_info "   Summary: $actual_summary"
        log_info "   URL: $epic_url"
        
        # Asignar versión al Epic
        assign_version_to_issue "$EPIC_KEY" "$RELEASE_VERSION_ID"
        return 0
    else
        log_error "Epic creation failed (HTTP $http_code)"
        echo "Error response: $response_body"
        return 1
    fi
}

# Método alternativo para crear Epic - CORREGIDO
create_epic_alternative() {
    log_info "Using alternative Epic creation method..."
    
    # Método aún más simple
    EPIC_JSON=$(cat << EOF
{
    "fields": {
        "project": {
            "key": "$JIRA_PROJECT_KEY"
        },
        "summary": "Release $REPO_NAME v$APP_VERSION",
        "issuetype": {
            "name": "Epic"
        }
    }
}
EOF
)
    
    log_debug "Alternative Epic JSON: $EPIC_JSON"
    
    response=$(curl -s -w "\n%{http_code}" -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$EPIC_JSON" \
        "$JIRA_BASE_URL/rest/api/3/issue")
    
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | sed '$d')
    
    log_debug "Alternative method response: $response_body"
    
    if [ "$http_code" -eq 201 ]; then
        EPIC_KEY=$(echo "$response_body" | jq -r '.key')
        local epic_summary=$(echo "$response_body" | jq -r '.fields.summary')
        local epic_url="$JIRA_BASE_URL/browse/$EPIC_KEY"
        
        log_success "✅ Epic created (alternative method): $EPIC_KEY"
        log_info "   Summary: $epic_summary"
        log_info "   URL: $epic_url"
        
        # Asignar versión al Epic
        assign_version_to_issue "$EPIC_KEY" "$RELEASE_VERSION_ID"
        return 0
    else
        log_error "Alternative Epic creation failed (HTTP $http_code)"
        echo "Error: $response_body"
        return 1
    fi
}

# Function to assign version to issue - MEJORADA
assign_version_to_issue() {
    local issue_key="$1"
    local version_id="$2"
    
    log_debug "Assigning version $version_id to issue $issue_key"
    sleep 0.5
    
    VERSION_UPDATE_JSON=$(cat << EOF
{
    "update": {
        "fixVersions": [
            {
                "add": {
                    "id": "$version_id"
                }
            }
        ]
    }
}
EOF
)
    
    if ! echo "$VERSION_UPDATE_JSON" | jq . > /dev/null 2>&1; then
        log_error "Invalid version update JSON for $issue_key"
        return 1
    fi
    
    response=$(curl -s -w "\n%{http_code}" -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
        -X PUT \
        -H "Content-Type: application/json" \
        -d "$VERSION_UPDATE_JSON" \
        "$JIRA_BASE_URL/rest/api/3/issue/$issue_key")
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" -eq 204 ]; then
        log_debug "✅ Version successfully assigned to $issue_key"
        return 0
    else
        log_debug "⚠️ Version assignment failed for $issue_key (HTTP $http_code)"
        return 1
    fi
}

# Function to create Story under Epic
create_story() {
    local story_name="$1"
    local story_description="$2"
    local parent_epic_key="$3"
    
    local story_summary="$story_name"
    
    STORY_JSON=$(cat <<EOF
{
    "fields": {
        "project": {
            "id": "$PROJECT_ID"
        },
        "parent": {
            "key": "$parent_epic_key"
        },
        "summary": "$story_summary",
        "description": {
            "type": "doc",
            "version": 1,
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": "$story_description"
                        }
                    ]
                },
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": " "
                        }
                    ]
                },
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": "Repositorio: $REPO_NAME | Versión: $APP_VERSION | Build: $BUILD_NUMBER"
                        }
                    ]
                }
            ]
        },
        "issuetype": {
            "id": "$STORY_ISSUE_TYPE_ID"
        }
    }
}
EOF
)
    
    log_info "Creating story: $story_name"
    
    response=$(curl -s -w "\n%{http_code}" -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$STORY_JSON" \
        "$JIRA_BASE_URL/rest/api/3/issue")
    
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 201 ]; then
        local story_key=$(echo "$response_body" | jq -r '.key')
        local story_url="$JIRA_BASE_URL/browse/$story_key"
        log_success "✅ Story created: $story_key - $story_name"
        
        # Asignar versión a la Story
        assign_version_to_issue "$story_key" "$RELEASE_VERSION_ID"
        
        echo "$story_key"
        return 0
    else
        log_warning "⚠️ Failed to create story: $story_name (HTTP $http_code)"
        echo "Error: $response_body"
        echo ""
        return 1
    fi
}

# Function to create Subtask under Story
create_subtask() {
    local subtask_name="$1"
    local subtask_description="$2"
    local acceptance_criteria="$3"
    local parent_story_key="$4"
    
    local subtask_summary="$subtask_name"
    
    SUBTASK_JSON=$(cat <<EOF
{
    "fields": {
        "project": {
            "id": "$PROJECT_ID"
        },
        "parent": {
            "key": "$parent_story_key"
        },
        "summary": "$subtask_summary",
        "description": {
            "type": "doc",
            "version": 1,
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": "$subtask_description"
                        }
                    ]
                },
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": " "
                        }
                    ]
                },
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": "Criterios de Aceptación:"
                        }
                    ]
                },
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": "$acceptance_criteria"
                        }
                    ]
                },
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": " "
                        }
                    ]
                },
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": "Repositorio: $REPO_NAME | Versión: $APP_VERSION | Build: $BUILD_NUMBER"
                        }
                    ]
                }
            ]
        },
        "issuetype": {
            "id": "$SUBTASK_ISSUE_TYPE_ID"
        }
    }
}
EOF
)
    
    log_info "Creating subtask: $subtask_name"
    
    response=$(curl -s -w "\n%{http_code}" -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$SUBTASK_JSON" \
        "$JIRA_BASE_URL/rest/api/3/issue")
    
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 201 ]; then
        local subtask_key=$(echo "$response_body" | jq -r '.key')
        local subtask_url="$JIRA_BASE_URL/browse/$subtask_key"
        log_success "✅ Subtask created: $subtask_key - $subtask_name"
        
        # Asignar versión a la Subtask
        assign_version_to_issue "$subtask_key" "$RELEASE_VERSION_ID"
        
        echo "$subtask_key"
        return 0
    else
        log_warning "⚠️ Failed to create subtask: $subtask_name (HTTP $http_code)"
        echo "Error: $response_body"
        echo ""
        return 1
    fi
}

# Function to assign version to issue
assign_version_to_issue() {
    local issue_key="$1"
    local version_id="$2"
    
    sleep 0.3
    
    VERSION_UPDATE_JSON=$(cat << EOF
{
    "update": {
        "fixVersions": [
            {
                "add": {
                    "id": "$version_id"
                }
            }
        ]
    }
}
EOF
)
    
    if ! echo "$VERSION_UPDATE_JSON" | jq . > /dev/null 2>&1; then
        log_error "Invalid version update JSON for $issue_key"
        return 1
    fi
    
    response=$(curl -s -w "\n%{http_code}" -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
        -X PUT \
        -H "Content-Type: application/json" \
        -d "$VERSION_UPDATE_JSON" \
        "$JIRA_BASE_URL/rest/api/3/issue/$issue_key")
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" -eq 204 ]; then
        log_debug "Version assigned to $issue_key"
        return 0
    else
        log_debug "Version assignment failed for $issue_key (HTTP $http_code)"
        return 1
    fi
}

# Function to create complete hierarchical structure
create_hierarchical_structure() {
    log_step "9" "Creating complete hierarchical structure"
    
    # Estructura según el manual
    declare -A stories=(
        ["Build & Quality Assurance"]="Como equipo de DevOps, necesitamos compilar la aplicación y ejecutar todas las pruebas automatizadas para validar la calidad del código antes de proceder con el despliegue."
        ["Security & Compliance"]="Como especialista en seguridad, necesitamos escanear la aplicación y sus dependencias para identificar vulnerabilidades antes del despliegue."
        ["Containerización"]="Como ingeniero de DevOps, necesitamos construir y publicar la imagen Docker de la aplicación para su despliegue en contenedores."
        ["Deploy to Development"]="Como desarrollador, necesitamos desplegar la aplicación en el ambiente de desarrollo para realizar pruebas iniciales y validaciones."
        ["Deploy to QA/Staging"]="Como QA, necesitamos desplegar la aplicación en el ambiente de staging para realizar pruebas de calidad exhaustivas antes de producción."
        ["Deploy to Production"]="Como equipo de operaciones, necesitamos desplegar la aplicación en producción y validar que todo funciona correctamente para usuarios finales."
    )
    
    declare -A subtasks=(
        # Build & Quality Assurance
        ["Build Application"]="Build & Quality Assurance:Compilar y construir la aplicación desde el código fuente:Build exitoso sin errores"
        ["Execute Unit Tests"]="Build & Quality Assurance:Ejecutar suite de pruebas unitarias y generar reportes de cobertura:Todas las pruebas pasan, cobertura > 80%"
        ["Run Integration Tests"]="Build & Quality Assurance:Ejecutar pruebas de integración con dependencias externas:Todas las integraciones funcionan correctamente"
        
        # Security & Compliance
        ["Security Vulnerability Scan"]="Security & Compliance:Escanear la aplicación en busca de vulnerabilidades de seguridad:Sin vulnerabilidades críticas o altas"
        ["Dependency Check"]="Security & Compliance:Verificar dependencias del proyecto para detectar librerías vulnerables:Sin dependencias con vulnerabilidades conocidas"
        
        # Containerización
        ["Build Docker Image"]="Containerización:Construir la imagen Docker y validar las capas:Imagen construida correctamente, tamaño optimizado"
        ["Push to Container Registry"]="Containerización:Subir la imagen Docker al registro de contenedores:Imagen disponible en registry con tag correcto"
        
        # Deploy to Development
        ["Deploy to Development Environment"]="Deploy to Development:Desplegar la aplicación en el ambiente de desarrollo:Aplicación desplegada y accesible en DEV"
        ["Execute Smoke Tests (DEV)"]="Deploy to Development:Ejecutar pruebas smoke básicas en DEV:Funcionalidades críticas funcionan"
        ["Validate Application Health (DEV)"]="Deploy to Development:Verificar health checks y métricas básicas:Todos los servicios saludables en DEV"
        
        # Deploy to QA/Staging
        ["Deploy to Staging Environment"]="Deploy to QA/Staging:Desplegar la aplicación en el ambiente de staging/QA:Aplicación desplegada correctamente en QA"
        ["Execute Smoke Tests (QA)"]="Deploy to QA/Staging:Ejecutar pruebas smoke en staging:Funcionalidades básicas operativas en QA"
        ["Performance and Load Testing"]="Deploy to QA/Staging:Ejecutar pruebas de carga y rendimiento:Cumple con requisitos de performance"
        ["User Acceptance Tests"]="Deploy to QA/Staging:Ejecutar pruebas de aceptación con stakeholders:Aprobación de product owner/stakeholders"
        
        # Deploy to Production
        ["Production Deployment"]="Deploy to Production:Desplegar la aplicación en el ambiente de producción:Aplicación desplegada sin downtime en PROD"
        ["Post-Deployment Validation"]="Deploy to Production:Validar despliegue y monitorear la aplicación post-release:Sin errores en logs, métricas normales, usuarios acceden correctamente"
    )
    
    local created_stories=()
    local created_subtasks=()
    local story_success_count=0
    local subtask_success_count=0
    local fail_count=0
    
    log_info "Creating hierarchical structure:"
    log_info "  📦 Release: $RELEASE_NAME"
    log_info "    └── 📋 Epic: $EPIC_KEY"
    log_info "        └── 📖 ${#stories[@]} Stories"
    log_info "            └── ✓ ${#subtasks[@]} Subtasks"
    
    # Primero crear todas las Stories bajo el Epic
    for story_name in "${!stories[@]}"; do
        story_description="${stories[$story_name]}"
        
        log_info "Creating story under Epic $EPIC_KEY: $story_name"
        story_key=$(create_story "$story_name" "$story_description" "$EPIC_KEY")
        
        if [ -n "$story_key" ]; then
            created_stories+=("$story_key:$story_name")
            ((story_success_count++))
            log_success "📖 Story created successfully: $story_key"
            
            # Ahora crear las subtasks para esta story
            for subtask_name in "${!subtasks[@]}"; do
                subtask_info="${subtasks[$subtask_name]}"
                IFS=':' read -r parent_story subtask_description acceptance_criteria <<< "$subtask_info"
                
                # Verificar si esta subtask pertenece a la story actual
                if [ "$parent_story" = "$story_name" ]; then
                    log_info "Creating subtask under Story $story_key: $subtask_name"
                    subtask_key=$(create_subtask "$subtask_name" "$subtask_description" "$acceptance_criteria" "$story_key")
                    
                    if [ -n "$subtask_key" ]; then
                        created_subtasks+=("$subtask_key:$subtask_name")
                        ((subtask_success_count++))
                        log_success "✓ Subtask created: $subtask_key"
                    else
                        ((fail_count++))
                    fi
                    
                    sleep 0.5
                fi
            done
            
        else
            ((fail_count++))
        fi
        
        sleep 0.5
    done
    
    # Resumen final
    log_step "10" "Hierarchical structure creation summary"
    log_info "📋 Structure created:"
    log_info "  📦 Release: $RELEASE_NAME"
    log_info "    └── 📋 Epic: $EPIC_KEY"
    log_info "        └── 📖 Stories: $story_success_count/${#stories[@]}"
    log_info "            └── ✓ Subtasks: $subtask_success_count/${#subtasks[@]}"
    
    if [ $fail_count -eq 0 ]; then
        log_success "🎉 Complete hierarchical structure created successfully!"
        log_info "🌐 Release URL: $RELEASE_URL"
        log_info "📋 Epic URL: $JIRA_BASE_URL/browse/$EPIC_KEY"
    else
        log_warning "⚠️ Structure created with $fail_count failures"
    fi
    
    return $fail_count
}

# =============================================================================
# Main Execution - ESTRUCTURA JERÁRQUICA
# =============================================================================

log_section "Starting JIRA Hierarchical Structure Automation"

# 1. Test connection
if ! test_jira_connection; then
    exit 1
fi

# 2. Create or get release
if create_or_get_release "$JIRA_PROJECT_KEY" "$REPO_NAME" "$APP_VERSION"; then
    log_success "✅ Release process completed successfully"
else
    log_error "❌ Failed to create or get release version"
    exit 1
fi

# 3. Get project ID
if ! get_project_id; then
    log_error "❌ Cannot continue without project ID"
    exit 1
fi

# 4. Get Epic issue type
if ! get_issue_type_id "Epic" "EPIC_ISSUE_TYPE_ID"; then
    log_error "❌ Cannot continue without Epic issue type"
    exit 1
fi

# 5. Get Story issue type
if ! get_issue_type_id "Historia" "STORY_ISSUE_TYPE_ID"; then
    log_warning "Historia issue type not found, trying Story"
    if ! get_issue_type_id "Story" "STORY_ISSUE_TYPE_ID"; then
        log_error "❌ Cannot continue without Story issue type"
        exit 1
    fi
fi

# 6. Get Subtask issue type
if ! get_issue_type_id "Subtarea" "SUBTASK_ISSUE_TYPE_ID"; then
    log_warning "Subtarea issue type not found, trying Sub-task"
    if ! get_issue_type_id "Sub-task" "SUBTASK_ISSUE_TYPE_ID"; then
        log_error "❌ Cannot continue without Subtask issue type"
        exit 1
    fi
fi

# 7. Create Epic
if ! create_epic; then
    log_error "❌ Failed to create Epic"
    exit 1
fi

# 8. Create complete hierarchical structure
log_info "Creating complete hierarchical structure: Release → Epic → Stories → Subtasks"
if create_hierarchical_structure; then
    log_success "✅ Complete hierarchical structure created successfully"
else
    log_warning "⚠️ Some issues failed, but structure was created"
fi

log_duration "JIRA Hierarchical Structure Automation"
log_success "🚀 JIRA complete hierarchical structure automation completed successfully!"