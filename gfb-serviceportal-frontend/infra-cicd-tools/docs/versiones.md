# Manual de Gestión de Releases en Jira para Pipeline DevOps

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Estructura de Jira](#estructura-de-jira)
3. [Versionamiento Semántico](#versionamiento-semántico)
4. [Flujo Completo de Versiones - Paso a Paso](#flujo-completo-de-versiones---paso-a-paso)
5. [Reglas Importantes del Versionamiento](#reglas-importantes-del-versionamiento)
6. [Estructura de Issues](#estructura-de-issues)
7. [Flujo de Trabajo por Ambiente](#flujo-de-trabajo-por-ambiente)
8. [Ejemplos Prácticos](#ejemplos-prácticos)
9. [Checklist de Aprobación](#checklist-de-aprobación)

---

## Introducción

Este manual describe la estructura recomendada para gestionar releases de aplicaciones usando Jira Software integrado con pipelines de Bitbucket.

### Principios Básicos

- **1 Proyecto Bitbucket = 1 Proyecto Jira**
- **1 Repositorio = 1 Componente en Jira**
- **1 Despliegue = 1 Release en Jira**
- **La misma versión pasa por todos los ambientes (DEV → QA → PROD)**

---

## Estructura de Jira

### Jerarquía de Issues

```
📦 Release (Fix Version): hola-mundo v1.0.0
   │
   └── 📋 Épica: Release hola-mundo v1.0.0
       │
       ├── 📖 Historia de Usuario: Build & Quality Assurance
       │   ├── ✓ Tarea: Build Application
       │   ├── ✓ Tarea: Execute Unit Tests
       │   └── ✓ Tarea: Run Integration Tests
       │
       ├── 📖 Historia de Usuario: Security & Compliance
       │   ├── ✓ Tarea: Security Vulnerability Scan
       │   └── ✓ Tarea: Dependency Check
       │
       ├── 📖 Historia de Usuario: Containerización
       │   ├── ✓ Tarea: Build Docker Image
       │   └── ✓ Tarea: Push to Container Registry
       │
       ├── 📖 Historia de Usuario: Deploy to Development
       │   ├── ✓ Tarea: Deploy to Development Environment
       │   ├── ✓ Tarea: Execute Smoke Tests (DEV)
       │   └── ✓ Tarea: Validate Application Health (DEV)
       │
       ├── 📖 Historia de Usuario: Deploy to QA/Staging
       │   ├── ✓ Tarea: Deploy to Staging Environment
       │   ├── ✓ Tarea: Execute Smoke Tests (QA)
       │   ├── ✓ Tarea: Performance and Load Testing
       │   └── ✓ Tarea: User Acceptance Tests
       │
       └── 📖 Historia de Usuario: Deploy to Production
           ├── ⏸️ Tarea: Production Deployment (Manual Approval)
           └── ⏸️ Tarea: Post-Deployment Validation
```

### Componentes del Proyecto

Cada repositorio de Bitbucket = 1 Componente en Jira:

```
Proyecto Jira: MI-APP

Componentes:
├── hola-mundo
├── adios-mundo
├── backend-api
├── worker-service
└── admin-portal
```

---

## Versionamiento Semántico

### Formato: MAJOR.MINOR.PATCH

```
1.0.0
│ │ │
│ │ └─ PATCH: Bugfixes, hotfixes (1.0.0 → 1.0.1)
│ └─── MINOR: Nuevas features sin breaking changes (1.0.0 → 1.1.0)
└───── MAJOR: Breaking changes o cambios incompatibles (1.0.0 → 2.0.0)
```

### Estrategia de Versiones por Fase

#### Fase de Desarrollo (0.x.x)

Antes de la primera versión estable en producción:

```
0.1.0 → Primera feature completa funcional
0.2.0 → Segunda feature agregada
0.3.0 → Tercera feature agregada
0.4.0 → MVP completo, listo para pruebas finales
```

**Características:**
- Versiones inestables en desarrollo
- Cambios frecuentes
- Solo en ambientes DEV y QA
- NO en producción

#### Primera Versión Estable (1.0.0)

```
1.0.0 → Primera release oficial en PRODUCCIÓN
```

**Criterios para liberar 1.0.0:**
- ✅ Todas las features del MVP completadas
- ✅ Probada exhaustivamente en QA
- ✅ Aprobada por stakeholders
- ✅ Documentación completa
- ✅ Lista para usuarios finales

#### Post-Producción

```
1.0.1 → Hotfix de bug crítico en producción
1.0.2 → Otro bugfix menor
1.1.0 → Nueva feature (sin romper compatibilidad)
1.2.0 → Otra feature nueva
1.3.0 → Mejoras y optimizaciones
2.0.0 → Breaking change (ej: cambio de API, migración de BD)
```

### Tabla de Decisión: Ambientes vs Versiones

| Escenario | Versión | DEV | QA | PROD | Estado Release |
|-----------|---------|-----|----|----- |----------------|
| Desarrollo inicial | 0.1.0 | ✅ | ❌ | ❌ | Unreleased |
| Pasa a QA | 0.1.0 | ✅ | ✅ | ❌ | Unreleased |
| QA aprueba, lista para PROD | 0.4.0 | ✅ | ✅ | ⏸️ | Waiting Approval |
| Primera versión estable | 1.0.0 | ✅ | ✅ | ✅ | **Released** |
| Bugfix urgente | 1.0.1 | ✅ | ✅ | ✅ | Released |
| Nueva feature en desarrollo | 1.1.0 | ✅ | ⏸️ | 1.0.1 | Unreleased |
| Feature aprobada | 1.1.0 | ✅ | ✅ | ✅ | Released |
| Breaking change | 2.0.0 | ✅ | ✅ | ⏸️ | Waiting Approval |

---

## Flujo Completo de Versiones - Paso a Paso

### ⚠️ IMPORTANTE: Cómo empezar correctamente

**❌ NO hagas esto:**
- Crear v1.0.0 y v1.1.0 al mismo tiempo desde el inicio
- Pensar que v1.1.0 se convertirá en v2.0.0
- Crear múltiples versiones mayores simultáneamente

**✅ HAZ esto:**
- Empieza con v0.1.0 (desarrollo)
- Crea UNA versión a la vez
- Termínala, desplíegala, y DESPUÉS empieza la siguiente

---

### FASE 1: Desarrollo Inicial (Versiones 0.x.x)

#### Sprint 1: Primera versión funcional

```
1. Creas en Jira:
   📦 Release: hola-mundo v0.1.0
   └── 📋 Épica: Release hola-mundo v0.1.0
       └── 6 Historias con 14 tareas

2. Desarrollas y despliegas:
   - DEV: ✅ (funciona)
   - QA: ✅ (pasa pruebas)
   - PROD: ❌ (NO despliegas aún, solo es desarrollo)

3. Estado del Release: "Unreleased"
   Release Date: (vacío)
```

**Resultado:**
- Tienes tu primera versión funcional
- Solo existe en ambientes de desarrollo
- No está en producción todavía

---

#### Sprint 2: Agregas más features

```
1. Creas NUEVO release en Jira:
   📦 Release: hola-mundo v0.2.0
   └── 📋 Épica: Release hola-mundo v0.2.0
       └── 6 Historias con 14 tareas

2. Desarrollas y despliegas:
   - DEV: ✅ (nuevas features funcionan)
   - QA: ✅ (pruebas pasan)
   - PROD: ❌ (aún NO)

3. Estado del Release: "Unreleased"
```

**Estado en Jira:**
```
Releases:
├── hola-mundo v0.1.0 (Unreleased) - Completado en DEV/QA
└── hola-mundo v0.2.0 (Unreleased) - Completado en DEV/QA
```

---

#### Sprints 3 y 4: Completas el MVP

```
Sprint 3:
📦 hola-mundo v0.3.0
   └── DEV: ✅ | QA: ✅ | PROD: ❌
   └── Status: Unreleased

Sprint 4:
📦 hola-mundo v0.4.0
   └── DEV: ✅ | QA: ✅ | PROD: ❌
   └── Status: Unreleased
   └── ✅ MVP COMPLETO
```

**En este punto tienes:**
- 4 releases en Jira (v0.1.0, v0.2.0, v0.3.0, v0.4.0)
- TODOS marcados como "Unreleased"
- NINGUNO está en PROD
- Todos solo en DEV y QA
- MVP completo y listo para considerar producción

---

### FASE 2: Primera Versión a Producción

#### Decisión: ¿Está lista para PROD?

```
Product Owner revisa v0.4.0:
✅ MVP completo (login, dashboard, reportes)
✅ Todas las pruebas pasaron en QA
✅ Stakeholders aprueban funcionalidad
✅ Documentación completa
✅ Listo para usuarios finales

→ DECISIÓN: Subir a versión 1.0.0 para PROD
```

#### Crear la primera versión estable

```
1. Creas NUEVO release en Jira:
   📦 Release: hola-mundo v1.0.0
   └── 📋 Épica: Release hola-mundo v1.0.0
       └── Description: "Primera versión estable en PRODUCCIÓN.
                         Incluye todas las features del MVP."

2. Despliegas por todos los ambientes:
   - DEV: ✅ (28 Oct 9:00 AM)
   - QA: ✅ (28 Oct 11:00 AM)
   - PROD: ⏸️ Waiting for Approval

3. Tech Lead revisa:
   - Checklist de PROD completo ✅
   - Aprueba tarea "Production Deployment"

4. Pipeline despliega a PROD:
   - PROD: ✅ (28 Oct 2:00 PM)
   - Post-deployment validation: ✅

5. Actualizas Release en Jira:
   Status: "Released" 🎉
   Release Date: 28 Oct 2025
```

**Estado final en Jira:**
```
Releases:
├── hola-mundo v0.1.0 (Released: 1 Sep) - Solo DEV/QA
├── hola-mundo v0.2.0 (Released: 15 Sep) - Solo DEV/QA
├── hola-mundo v0.3.0 (Released: 1 Oct) - Solo DEV/QA
├── hola-mundo v0.4.0 (Released: 15 Oct) - Solo DEV/QA
└── hola-mundo v1.0.0 (Released: 28 Oct) ← EN PRODUCCIÓN ✅
```

**Resultado:**
- PROD tiene: hola-mundo v1.0.0 ✅
- Es tu PRIMERA y ÚNICA versión en producción
- Usuarios finales ya pueden usarla

---

### FASE 3: Desarrollo de Nueva Feature (Post-Producción)

#### Semanas después: Nueva feature solicitada

```
Fecha: 1 Nov 2025
PROD actual: hola-mundo v1.0.0 ✅ (sigue funcionando)

1. Product Owner solicita nueva feature: "Sistema de notificaciones"

2. Creas NUEVO release en Jira:
   📦 Release: hola-mundo v1.1.0
   └── 📋 Épica: Release hola-mundo v1.1.0 - Notificaciones
       └── Description: "Agrega sistema de notificaciones push"

3. Empiezas desarrollo:
   - DEV: 🔄 (en desarrollo activo)
   - QA: ❌ (no está lista aún)
   - PROD: hola-mundo v1.0.0 ✅ (sigue con la versión anterior)
```

**Estado durante desarrollo (5 Nov):**
```
Releases:
├── hola-mundo v1.0.0 (Released: 28 Oct) ← EN PRODUCCIÓN ✅
└── hola-mundo v1.1.0 (Unreleased) ← EN DESARROLLO 🔄
```

#### Completando la nueva feature

```
Fecha: 15 Nov 2025

1. Desarrollo completado:
   📦 hola-mundo v1.1.0
   - DEV: ✅ (15 Nov 10:00 AM)
   - QA: ✅ (15 Nov 2:00 PM)

2. UAT aprobado por stakeholders: ✅

3. Listo para PROD:
   - Historia "Deploy to Production" → Waiting for Approval

4. Tech Lead aprueba:
   - PROD: ✅ (15 Nov 6:00 PM)

5. Release marcado como "Released"
   Release Date: 15 Nov 2025
```

**Estado final:**
```
Releases:
├── hola-mundo v1.0.0 (Released: 28 Oct) - Ya no está en PROD
└── hola-mundo v1.1.0 (Released: 15 Nov) ← AHORA EN PRODUCCIÓN ✅
```

**Resultado:**
- PROD ahora tiene: hola-mundo v1.1.0 ✅
- v1.1.0 REEMPLAZÓ a v1.0.0 en producción
- Nueva feature disponible para usuarios

---

### FASE 4: Hotfix Urgente

#### Bug crítico encontrado en PROD

```
Fecha: 20 Nov 2025, 9:00 AM
PROD actual: hola-mundo v1.1.0

1. Incidente reportado:
   - Bug crítico en módulo de notificaciones
   - Usuarios no pueden recibir alertas importantes

2. Creas release de HOTFIX:
   📦 Release: hola-mundo v1.1.1
   └── 📋 Épica: Hotfix v1.1.1 - Corregir notificaciones
       └── Description: "Bugfix urgente en sistema de notificaciones"

3. Fast-track por todos los ambientes:
   - DEV: ✅ (20 Nov 10:00 AM) - Fix implementado y probado
   - QA: ✅ (20 Nov 11:00 AM) - Pruebas reducidas pero completas
   - PROD: ⏸️ (20 Nov 1:00 PM) - Aprobación expedita

4. Tech Lead aprueba inmediatamente:
   - PROD: ✅ (20 Nov 2:00 PM)
   - Downtime: 0 minutos (rolling deployment)

5. Release marcado como "Released"
   Release Date: 20 Nov 2025
```

**Estado en Jira:**
```
Releases:
├── hola-mundo v1.0.0 (Released: 28 Oct)
├── hola-mundo v1.1.0 (Released: 15 Nov)
└── hola-mundo v1.1.1 (Released: 20 Nov) ← AHORA EN PRODUCCIÓN ✅
```

**Resultado:**
- PROD tiene: hola-mundo v1.1.1 ✅
- Bug crítico resuelto en el mismo día
- Proceso completo tomó 5 horas

---

### FASE 5: Breaking Change

#### Cambio importante que rompe compatibilidad

```
Fecha: 1 Dec 2025
PROD actual: hola-mundo v1.1.1 ✅

1. Decisión de arquitectura:
   - Migración de API REST a GraphQL
   - Breaking change (clientes deben actualizar)
   - Cambio de base de datos

2. Creas release MAJOR:
   📦 Release: hola-mundo v2.0.0
   └── 📋 Épica: Release v2.0.0 - Migración GraphQL
       └── Description: "Breaking change: Migración completa a GraphQL"

3. Desarrollo extenso (varias semanas):
   - DEV: 🔄 (1-15 Dec)
   - QA: 🔄 (16-20 Dec)
   - PROD: hola-mundo v1.1.1 ✅ (sigue funcionando normal)

4. Testing exhaustivo:
   - Migration scripts probados
   - Backward compatibility verificada
   - Plan de rollback documentado

5. Despliegue a PROD:
   - DEV: ✅ (15 Dec)
   - QA: ✅ (20 Dec)
   - PROD: ✅ (22 Dec)

6. Release marcado como "Released"
   Release Date: 22 Dec 2025
```

**Estado final:**
```
Releases:
├── hola-mundo v1.0.0 (Released: 28 Oct)
├── hola-mundo v1.1.0 (Released: 15 Nov)
├── hola-mundo v1.1.1 (Released: 20 Nov)
└── hola-mundo v2.0.0 (Released: 22 Dec) ← AHORA EN PRODUCCIÓN ✅
```

---

### 📊 Timeline Visual Completo

```
SEPTIEMBRE 2025:
├── v0.1.0 (DEV/QA) ──────┐
├── v0.2.0 (DEV/QA) ──────┤
OCTUBRE 2025:             ├── Fase de Desarrollo
├── v0.3.0 (DEV/QA) ──────┤    (MVP en construcción)
├── v0.4.0 (DEV/QA) ──────┘
├── v1.0.0 (PROD) ✅ ──────── PRIMERA VERSIÓN EN PRODUCCIÓN
NOVIEMBRE 2025:
├── v1.1.0 (PROD) ✅ ──────── Nueva feature (notificaciones)
├── v1.1.1 (PROD) ✅ ──────── Hotfix urgente
DICIEMBRE 2025:
└── v2.0.0 (PROD) ✅ ──────── Breaking change (GraphQL)
```

---

### 🔄 Flujo de una Versión Típica

```
1. CREAR RELEASE
   └── Jira: Crear Fix Version "hola-mundo vX.Y.Z"
   └── Jira: Crear Épica vinculada al release
   └── Jira: Crear 6 Historias con 14 tareas

2. DESARROLLO
   └── Pipeline: Ejecuta en DEV
   └── Jira: Historias 1-4 se marcan Done
   └── Estado: En desarrollo

3. QA/STAGING
   └── Pipeline: Ejecuta en QA
   └── Jira: Historia 5 se marca Done
   └── Estado: En testing

4. APROBACIÓN
   └── Product Owner: Aprueba UAT
   └── Tech Lead: Revisa checklist
   └── Jira: Historia 6 → "Waiting for Approval"

5. PRODUCCIÓN
   └── Tech Lead: Aprueba despliegue
   └── Pipeline: Ejecuta en PROD
   └── Jira: Historia 6 se marca Done
   └── Jira: Release marcado "Released"

6. SIGUIENTE VERSIÓN
   └── Volver al paso 1 con nueva versión
```

---

## Reglas Importantes del Versionamiento

### ⚠️ Regla 1: NO crees múltiples versiones mayores simultáneamente

```
❌ MAL:
- Crear v1.0.0 y v1.1.0 al mismo tiempo
- Crear v1.0.0 y v2.0.0 al mismo tiempo
- Trabajar en v1.1.0, v1.2.0 y v2.0.0 en paralelo

✅ BIEN:
- Crear v1.0.0 → Terminar → Desplegar a PROD
- DESPUÉS crear v1.1.0 → Terminar → Desplegar a PROD
- DESPUÉS crear v2.0.0
```

**Excepción:** Puedes tener hotfix (v1.0.1) mientras desarrollas feature (v1.1.0)

---

### ⚠️ Regla 2: Las versiones son SECUENCIALES, no paralelas

```
❌ MAL:
Empezar v1.0.0, v1.1.0 y v2.0.0 todos juntos

✅ BIEN:
v1.0.0 (terminas) → v1.1.0 (terminas) → v2.0.0 (empiezas)

Flujo correcto:
1. Trabajas en v1.0.0
2. Completas v1.0.0
3. Despliegas v1.0.0 a PROD
4. ENTONCES empiezas v1.1.0
5. Completas v1.1.0
6. Despliegas v1.1.0 a PROD
7. ENTONCES empiezas v2.0.0
```

---

### ⚠️ Regla 3: Una versión NO se convierte en otra

```
❌ MAL:
"v1.1.0 se convertirá en v2.0.0 al final"

✅ BIEN:
- v1.1.0 es v1.1.0 (nueva feature sin breaking changes)
- v2.0.0 es v2.0.0 (breaking change completamente diferente)
- Son releases SEPARADOS e INDEPENDIENTES

Ejemplo correcto:
- v1.1.0: Agrega notificaciones (nueva feature)
- v2.0.0: Migra a GraphQL (breaking change)
- Ambos son desarrollos diferentes
```

---

### ⚠️ Regla 4: Una sola versión activa en PROD

```
En cualquier momento, PROD solo tiene UNA versión:

28 Oct: PROD = v1.0.0
15 Nov: PROD = v1.1.0 (reemplazó v1.0.0)
20 Nov: PROD = v1.1.1 (reemplazó v1.1.0)
22 Dec: PROD = v2.0.0 (reemplazó v1.1.1)

NO puedes tener v1.0.0 y v1.1.0 en PROD simultáneamente.
Cada nueva versión REEMPLAZA la anterior.
```

---

### ⚠️ Regla 5: La misma versión pasa por TODOS los ambientes

```
❌ MAL:
- DEV tiene v0.0.1
- QA tiene v0.1.0
- PROD tiene v1.0.0

✅ BIEN:
Versión v1.1.0:
- DEV: v1.1.0 ✅
- QA: v1.1.0 ✅
- PROD: v1.1.0 ✅

La MISMA versión (v1.1.0) se despliega en los 3 ambientes.
```

---

### ⚠️ Regla 6: Empieza con 0.x.x, NO con 1.0.0

```
❌ MAL:
Primer commit → v1.0.0

✅ BIEN:
Primer desarrollo → v0.1.0
Más features → v0.2.0, v0.3.0, v0.4.0
MVP completo y estable → v1.0.0 (primera en PROD)

1.0.0 significa: Primera versión ESTABLE en PRODUCCIÓN
No lo uses para desarrollo inicial.
```

---

### ⚠️ Regla 7: Cuándo incrementar cada número

```
PATCH (1.0.0 → 1.0.1):
✅ Bugfix
✅ Hotfix urgente
✅ Corrección de seguridad
✅ Sin nuevas features

MINOR (1.0.0 → 1.1.0):
✅ Nueva feature
✅ Mejora de funcionalidad existente
✅ Compatible con versión anterior
✅ Sin breaking changes

MAJOR (1.0.0 → 2.0.0):
✅ Breaking change en API
✅ Cambio de arquitectura
✅ Incompatible con versión anterior
✅ Migración de base de datos
✅ Cambio que requiere actualización de clientes
```

---

### 📋 Checklist de decisión de versión

**¿Qué versión crear?**

```
Pregunta 1: ¿Es la primera versión del proyecto?
└── SÍ: Usa v0.1.0
└── NO: Continúa ↓

Pregunta 2: ¿Ya está en producción?
└── NO: Usa 0.x.x (0.2.0, 0.3.0, etc.)
└── SÍ: Continúa ↓

Pregunta 3: ¿Es un hotfix o bugfix?
└── SÍ: Incrementa PATCH (1.0.0 → 1.0.1)
└── NO: Continúa ↓

Pregunta 4: ¿Es una nueva feature sin breaking changes?
└── SÍ: Incrementa MINOR (1.0.0 → 1.1.0)
└── NO: Continúa ↓

Pregunta 5: ¿Es un breaking change?
└── SÍ: Incrementa MAJOR (1.0.0 → 2.0.0)
```

---

## Estructura de Issues

### 1. Release (Fix Version)

**Propósito:** Agrupa todos los issues relacionados con una versión específica.

**Configuración:**
- Nombre: `hola-mundo v1.0.0`
- Start Date: Fecha de inicio del desarrollo
- Release Date: Fecha de despliegue a PRODUCCIÓN
- Status: Unreleased / Released

### 2. Épica

**Propósito:** Contenedor principal para todas las historias y tareas de un release.

**Configuración:**
- Summary: `Release hola-mundo v1.0.0`
- Epic Name: `hola-mundo-v1.0.0`
- Component: `hola-mundo`
- Fix Version: `hola-mundo v1.0.0`
- Description: Descripción del release, features incluidas

### 3. Historias de Usuario

#### Historia 1: Build & Quality Assurance

**Summary:** `Build & Quality Assurance - hola-mundo v1.0.0`

**Descripción:**
```
Como equipo de DevOps, necesitamos compilar la aplicación y ejecutar 
todas las pruebas automatizadas para validar la calidad del código 
antes de proceder con el despliegue.
```

**Tareas incluidas:**
1. **Build Application**
   - Descripción: Compilar y construir la aplicación desde el código fuente
   - Criterios de éxito: Build exitoso sin errores
   
2. **Execute Unit Tests**
   - Descripción: Ejecutar suite de pruebas unitarias y generar reportes de cobertura
   - Criterios de éxito: Todas las pruebas pasan, cobertura > 80%
   
3. **Run Integration Tests**
   - Descripción: Ejecutar pruebas de integración con dependencias externas
   - Criterios de éxito: Todas las integraciones funcionan correctamente

---

#### Historia 2: Security & Compliance

**Summary:** `Security & Compliance - hola-mundo v1.0.0`

**Descripción:**
```
Como especialista en seguridad, necesitamos escanear la aplicación 
y sus dependencias para identificar vulnerabilidades antes del despliegue.
```

**Tareas incluidas:**
1. **Security Vulnerability Scan**
   - Descripción: Escanear la aplicación en busca de vulnerabilidades de seguridad
   - Criterios de éxito: Sin vulnerabilidades críticas o altas
   
2. **Dependency Check**
   - Descripción: Verificar dependencias del proyecto para detectar librerías vulnerables
   - Criterios de éxito: Sin dependencias con vulnerabilidades conocidas

---

#### Historia 3: Containerización

**Summary:** `Containerización - hola-mundo v1.0.0`

**Descripción:**
```
Como ingeniero de DevOps, necesitamos construir y publicar la imagen 
Docker de la aplicación para su despliegue en contenedores.
```

**Tareas incluidas:**
1. **Build Docker Image**
   - Descripción: Construir la imagen Docker y validar las capas
   - Criterios de éxito: Imagen construida correctamente, tamaño optimizado
   
2. **Push to Container Registry**
   - Descripción: Subir la imagen Docker al registro de contenedores
   - Criterios de éxito: Imagen disponible en registry con tag correcto

---

#### Historia 4: Deploy to Development

**Summary:** `Deploy to Development - hola-mundo v1.0.0`

**Descripción:**
```
Como desarrollador, necesitamos desplegar la aplicación en el ambiente 
de desarrollo para realizar pruebas iniciales y validaciones.
```

**Tareas incluidas:**
1. **Deploy to Development Environment**
   - Descripción: Desplegar la aplicación en el ambiente de desarrollo
   - Criterios de éxito: Aplicación desplegada y accesible
   - Ambiente: DEV
   
2. **Execute Smoke Tests (DEV)**
   - Descripción: Ejecutar pruebas smoke básicas en DEV
   - Criterios de éxito: Funcionalidades críticas funcionan
   
3. **Validate Application Health (DEV)**
   - Descripción: Verificar health checks y métricas básicas
   - Criterios de éxito: Todos los servicios saludables

---

#### Historia 5: Deploy to QA/Staging

**Summary:** `Deploy to QA/Staging - hola-mundo v1.0.0`

**Descripción:**
```
Como QA, necesitamos desplegar la aplicación en el ambiente de staging 
para realizar pruebas de calidad exhaustivas antes de producción.
```

**Tareas incluidas:**
1. **Deploy to Staging Environment**
   - Descripción: Desplegar la aplicación en el ambiente de staging/QA
   - Criterios de éxito: Aplicación desplegada correctamente
   - Ambiente: QA/Staging
   
2. **Execute Smoke Tests (QA)**
   - Descripción: Ejecutar pruebas smoke en staging
   - Criterios de éxito: Funcionalidades básicas operativas
   
3. **Performance and Load Testing**
   - Descripción: Ejecutar pruebas de carga y rendimiento
   - Criterios de éxito: Cumple con requisitos de performance
   
4. **User Acceptance Tests**
   - Descripción: Ejecutar pruebas de aceptación con stakeholders
   - Criterios de éxito: Aprobación de product owner/stakeholders

---

#### Historia 6: Deploy to Production

**Summary:** `Deploy to Production - hola-mundo v1.0.0`

**Descripción:**
```
Como equipo de operaciones, necesitamos desplegar la aplicación en 
producción y validar que todo funciona correctamente para usuarios finales.
```

**⚠️ IMPORTANTE:** Esta historia requiere **aprobación manual** antes de ejecutarse.

**Tareas incluidas:**
1. **Production Deployment** ⚠️ MANUAL
   - Descripción: Desplegar la aplicación en el ambiente de producción
   - Status inicial: "Waiting for Approval"
   - Assignee: Tech Lead / Release Manager
   - Criterios de éxito: Aplicación desplegada sin downtime
   - Ambiente: PRODUCTION
   
2. **Post-Deployment Validation**
   - Descripción: Validar despliegue y monitorear la aplicación post-release
   - Criterios de éxito: 
     - Sin errores en logs
     - Métricas de salud normales
     - Usuarios pueden acceder correctamente

---

## Flujo de Trabajo por Ambiente

### Flujo Completo de un Release

```
1. DESARROLLO (0.1.0 → 0.4.0)
   ↓
   Pipeline automático crea/actualiza:
   - Fix Version: hola-mundo v0.1.0
   - Épica: Release hola-mundo v0.1.0
   - 6 Historias con 14 tareas
   ↓
   Ejecuta automáticamente:
   ✅ Build & QA
   ✅ Security & Compliance
   ✅ Containerización
   ✅ Deploy to Development
   ↓
   Estado: Historias 1-4 Done, Historia 5-6 To Do

2. QA/STAGING (0.4.0)
   ↓
   Pipeline continúa:
   ✅ Deploy to QA/Staging
   ✅ Smoke Tests
   ✅ Performance Tests
   ✅ UAT
   ↓
   Estado: Historias 1-5 Done, Historia 6 To Do
   ↓
   QA Team aprueba ✅
   Product Owner aprueba ✅
   ↓
   Decisión: ¿Lista para PROD?
   → SI: Versión sube a 1.0.0
   → NO: Más cambios → 0.5.0

3. PRODUCCIÓN (1.0.0)
   ↓
   Tarea "Production Deployment" en estado:
   "Waiting for Approval"
   ↓
   Tech Lead/Release Manager revisa:
   - ✅ Todas las pruebas pasaron
   - ✅ Sin vulnerabilidades
   - ✅ Aprobaciones de stakeholders
   - ✅ Plan de rollback listo
   ↓
   Aprueba manualmente en Jira
   ↓
   Pipeline despliega a PROD (automático o manual)
   ✅ Production Deployment
   ✅ Post-Deployment Validation
   ↓
   Release marcado como "Released"
   Release Date: 28 Oct 2025
```

### Estados de las Historias por Ambiente

| Historia | DEV | QA | PROD |
|----------|-----|----|----- |
| Build & QA | ✅ Done | ✅ Done | ✅ Done |
| Security | ✅ Done | ✅ Done | ✅ Done |
| Container | ✅ Done | ✅ Done | ✅ Done |
| Deploy DEV | ✅ Done | ✅ Done | ✅ Done |
| Deploy QA | 📝 To Do | ✅ Done | ✅ Done |
| Deploy PROD | 📝 To Do | 📝 To Do | ⏸️ Waiting → ✅ Done |

---

## Ejemplos Prácticos

### Ejemplo 1: Primera Versión a Producción

#### Contexto
Aplicación "Hola Mundo" completó MVP después de 4 sprints.

#### Releases Creados

```
📦 hola-mundo v0.1.0 (Released: 1 Sep 2025)
   └── Épica: Login básico
   └── DEV: ✅ | QA: ✅ | PROD: ❌

📦 hola-mundo v0.2.0 (Released: 15 Sep 2025)
   └── Épica: Dashboard principal
   └── DEV: ✅ | QA: ✅ | PROD: ❌

📦 hola-mundo v0.3.0 (Released: 1 Oct 2025)
   └── Épica: Sistema de reportes
   └── DEV: ✅ | QA: ✅ | PROD: ❌

📦 hola-mundo v0.4.0 (Released: 15 Oct 2025)
   └── Épica: Integraciones externas
   └── DEV: ✅ | QA: ✅ | PROD: ❌
   └── MVP COMPLETO ✅

📦 hola-mundo v1.0.0 (Released: 28 Oct 2025) 🎉
   └── Épica: Primera versión estable en PRODUCCIÓN
   └── DEV: ✅ | QA: ✅ | PROD: ✅
```

#### Timeline

**1 Oct - 15 Oct: Desarrollo de v0.4.0**
- Historias 1-4 completadas automáticamente
- Deploy a DEV exitoso

**16 Oct - 22 Oct: Testing en QA**
- Historia 5 completada
- UAT aprobado por Product Owner

**23 Oct - 27 Oct: Preparación para PROD**
- Decisión: Subir versión a 1.0.0
- Crear nuevo release: hola-mundo v1.0.0
- Documentación final
- Plan de rollback preparado

**28 Oct: Despliegue a PRODUCCIÓN**
- Tech Lead aprueba tarea "Production Deployment"
- Pipeline despliega a PROD
- Post-deployment validation exitosa
- Release marcado como "Released" ✅

---

### Ejemplo 2: Hotfix en Producción

#### Contexto
Bug crítico encontrado en producción el 30 Oct.

#### Flujo

```
PROD actual: hola-mundo v1.0.0
Bug: Error en validación de formularios

1. Crear hotfix:
📦 hola-mundo v1.0.1
   └── Épica: Hotfix - Validación de formularios
   
2. Fast-track por todos los ambientes:
   - DEV: 30 Oct 10:00 AM ✅
   - QA: 30 Oct 11:00 AM ✅ (pruebas reducidas)
   - PROD: 30 Oct 2:00 PM ✅ (aprobación expedita)

3. Release marcado como Released
   Downtime: 0 minutos (rolling deployment)
```

---

### Ejemplo 3: Múltiples Features en Paralelo

#### Contexto
Dos features desarrollándose al mismo tiempo.

```
PROD: hola-mundo v1.0.1

Equipo A desarrolla Feature X:
📦 hola-mundo v1.1.0 (branch: feature/notifications)
   └── DEV: ✅ | QA: 🔄 | PROD: 1.0.1

Equipo B desarrolla Feature Y:
📦 hola-mundo v1.2.0 (branch: feature/analytics)
   └── DEV: 🔄 | QA: ❌ | PROD: 1.0.1

Timeline:
- Feature X aprobada primero → Deploy 1.1.0 a PROD
- Feature Y se rebasea sobre 1.1.0
- Feature Y aprobada → Deploy 1.2.0 a PROD

PROD final: hola-mundo v1.2.0
```

---

## Checklist de Aprobación para PROD

### Pre-Despliegue

**Technical Readiness:**
- [ ] Todas las pruebas automatizadas pasaron
- [ ] Sin vulnerabilidades críticas o altas
- [ ] Performance tests cumplen requisitos
- [ ] Smoke tests en QA exitosos
- [ ] Documentación actualizada
- [ ] Variables de entorno configuradas en PROD

**Testing & Validation:**
- [ ] UAT completado y aprobado
- [ ] Pruebas de regresión pasadas
- [ ] Pruebas de integración con sistemas externos exitosas
- [ ] Data migrations validadas (si aplica)

**Operational Readiness:**
- [ ] Plan de rollback documentado y probado
- [ ] Equipo de soporte notificado
- [ ] Monitoring y alertas configurados
- [ ] Backup de base de datos realizado (si aplica)
- [ ] Runbook de despliegue revisado

**Business Approval:**
- [ ] Product Owner aprueba features
- [ ] Stakeholders notificados del release
- [ ] Release notes preparadas
- [ ] Ventana de mantenimiento coordinada (si aplica)

### Durante el Despliegue

- [ ] Deployment ejecutado sin errores
- [ ] Health checks pasando
- [ ] Logs sin errores críticos
- [ ] Métricas de performance normales

### Post-Despliegue

- [ ] Smoke tests en PROD pasados
- [ ] Usuarios pueden acceder normalmente
- [ ] Funcionalidades críticas operativas
- [ ] Sin aumento en error rate
- [ ] Monitoreo activo por 24 horas
- [ ] Release notes publicadas

---

## Configuración en Jira

### Crear Componente

1. Project Settings → Components
2. Click "Create Component"
3. Name: `hola-mundo`
4. Component Lead: DevOps Team
5. Default Assignee: Component Lead

### Crear Fix Version (Release)

1. Project → Releases → Create Version
2. Name: `hola-mundo v1.0.0`
3. Start Date: (fecha inicio desarrollo)
4. Release Date: (vacío hasta despliegue a PROD)
5. Description: Features incluidas en este release

### Crear Épica

1. Create → Epic
2. Summary: `Release hola-mundo v1.0.0`
3. Epic Name: `hola-mundo-v1.0.0`
4. Component: `hola-mundo`
5. Fix Version: `hola-mundo v1.0.0`

### Crear Historias y Tareas

Ver sección [Estructura de Issues](#estructura-de-issues) para detalles completos.

---

## Automatización con Bitbucket

### Variables del Pipeline

```bash
# En bitbucket-pipelines.yml o script
REPO_NAME="hola-mundo"
VERSION="1.0.0"
COMPONENT="${REPO_NAME}"
FIX_VERSION="${COMPONENT} v${VERSION}"
JIRA_PROJECT="MI-APP"
```

### Integración Jira-Bitbucket

1. Bitbucket → Repository Settings → Jira
2. Conectar instancia de Jira
3. Smart commits habilitados
4. Webhooks configurados para actualizar issues

### Actualización Automática de Issues

```bash
# Cuando tarea se completa en pipeline:
# Commit message: "BUILD-123 #done Build completed successfully"

# Esto automáticamente:
# - Marca la tarea BUILD-123 como Done
# - Agrega comentario con resultado del pipeline
# - Actualiza fecha de resolución
```

---

## Glosario

- **Release / Fix Version**: Versión específica de la aplicación
- **Épica**: Contenedor de todas las historias de un release
- **Historia de Usuario**: Agrupa tareas relacionadas por fase
- **Tarea**: Paso individual del pipeline
- **Component**: Identifica el repositorio/módulo
- **Semantic Versioning**: MAJOR.MINOR.PATCH
- **DEV**: Ambiente de desarrollo
- **QA/Staging**: Ambiente de pruebas
- **PROD**: Ambiente de producción

---

## Contacto y Soporte

Para dudas o sugerencias sobre este proceso:
- Equipo DevOps: digital@bancobase.com
---

**Versión del Manual:** 1.0.0  
**Última Actualización:** 28 Octubre 2025  
**Mantenido por:** Equipo DevOps