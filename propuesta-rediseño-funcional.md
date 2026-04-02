# Propuesta de Rediseño Funcional — Calculadora de Nómina

## 1. Objetivo Principal de la Página

Permitir al usuario registrar sus turnos laborales, horas adicionales, deducciones e incapacidades para calcular de manera transparente y en tiempo real su salario neto a pagar, con información clara sobre cada concepto que compone su liquidación.

La página debe ser una herramienta de **auto-verificación** — el trabajador debe poder entender exactamente cómo se llegó al valor final, con breakdowns claros de devengados, deducciones y aportes patronales.

---

## 2. Tipo de Usuario y Necesidad Principal

**Usuario objetivo:** Trabajadores con turnos variables (aquellos que laboran en horarios diversos, no tienen un salary fijo, o necesitan verificar su liquidación semanal/quincenal/mensual).

**Necesidad principal:**
- Saber cuánto va a recibir en su próximo pago
- Entender qué conceptos componen su salario (evitar opacidad)
- Desde el móvil — actualmente la app no es usable en dispositivos pequeños

**Usuario secundario:** Liquidadores de RH o administración que necesitan verificar cálculos rápido.

---

## 3. Flujo Ideal End-to-End del Usuario

```
1. Selección de período → 2. Registro de turnos → 3. Horas adicionales → 4. Deducciones e incapacidades → 5. Resumen y neto a pagar
```

**Paso a paso:**

1. **Selección de período:** El usuario define si es semanal, quincenal o mensual y las fechas correspondientes (default: mes actual).
2. **Registro de turnos:** Agrega filas con fecha, turno (selección de horario) y opcionalmente marca si fue día festivo o tuvo incapacidad.
3. **Horas adicionales:** Input manual de horas diurnas/nocturnas y festivas adicionales (fuera de los turnos).
4. **Deducciones:** Ingresa deducciones conocidas (préstamos, embargos, etc.) — el sistema muestra las obligatorias (salud, pensión) calculadas automáticamente.
5. **Resumen:** Muestra el breakdown completo con:
   - Total devengado (turnos + horas extras + subsidio)
   - Total deducciones (obligatorias + manuales)
   - **Neto a pagar** (el número más importante, bien destacado)
   - Aportes patronales (informativo)

**El usuario siempre ve el neto actualizado mientras ingresa datos.** No necesita presionar "Calcular" — el resultado se actualiza en tiempo real.

---

## 4. Arquitectura de la Página por Secciones (Orden Recomendado)

### Header
- Título de la app
- Selector de período (semana/mes actual)
- Botón de modo oscuro/claro
- Usuario (si se implementa login futuro) — o simplificado: sin header complejo para MVP

### Sección 1: Turnos del Período
- Tabla de turnos con filas dinámicas
- Botones de agregar/eliminar turno
- Cada fila: fecha, día (auto-calculado), hora inicio, hora salida, turno, valor (calculado), incidencia (checkboxes)

### Sección 2: Horas Adicionales (Overtime)
- Inputs para horas diurnas, nocturnas, diurnas festivas, nocturnas festivas
- Labels con valores por hora (información transparente)

### Sección 3: Deducciones Manuales
- Inputs para deducciones por nómina, EMI familiares, otras deducciones

### Sección 4: Resumen de Liquidación (destacado visual)
- Total devengado
- Subsidio de transporte (si aplica)
- Deducciones obligatorias (breakdown salud + pensión empleado)
- Deducciones manuales
- **NETO A PAGAR** (prominente)
- Aportes patronales (opcional, colapsable)

### Footer
- Información de versión
- Links a recursos (futuro)

---

## 5. Componentes/Inputs por Sección

### Sección 1: Turnos
- **Fecha:** date input con selector de calendario accesible
- **Día:** label (auto-llenado, solo lectura) — muestra "Lunes", "Martes", etc.
- **Hora inicio:** select con opciones de horario + "Descanso"
- **Hora salida:** select con opciones de horario + "Descanso"
- **Turno:** select (selección de rango horario predefinido, ej: "06:00 - 14:00")
- **Incidencia:** checkbox "Incapacidad" (aplica reducción del 66.66%)
- **Festivo:** selector o checkbox "Festivo" (marca visual la fila)
- **Valor:** label calculado (readonly)
- **Horas:** label (readonly)
- **#:** número correlativo del turno

### Sección 2: Horas Adicionales
- Input numérico: "Horas diurnas adicionales"
- Input numérico: "Horas nocturnas adicionales"
- Input numérico: "Horas diurnas festivas adicionales"
- Input numérico: "Horas nocturnas festivas adicionales"
- Labels informativos: valor hora de cada tipo

### Sección 3: Deducciones Manuales
- Input numérico: "Deducción por nómina"
- Input numérico: "EMI familiares"
- Input numérico: "Otras deducciones"

### Sección 4: Resumen (labels readonly)
- Total devengado
- Subsidio transporte
- Deducciones obligatorias (desglosado: salud empleado, pensión empleado)
- Deducciones manuales
- **Neto a pagar** (gran destaque)
- Aportes empresa (colapsable)

---

## 6. Cálculos y Feedback en Tiempo Real

**Debe actualizarse automáticamente (no esperar botón "Calcular"):**

| Concepto | Cálculo | Cuándo actualizar |
|----------|---------|-------------------|
| Día de la semana | `new Date(fecha).getDay()` → nombre | Al cambiar fecha |
| Valor del turno | según tabla de turnos (ver código actual) | Al cambiar turno + fecha |
| Horas trabajadas | de la tabla de turnos | Al cambiar turno |
| Horas extras | `input * valor_hora_tipo` | Al cambiar input |
| Subsidio transporte | si devengado < 2.847.000, prorrateo por días trabajados | Al cambiar turnos |
| Salud empleado | 4% del devengado | Al cambiar devengado |
| Pensión empleado | 4% del devengado | Al cambiar devengado |
| Salud empresa | 8.5% del devengado | Al cambiar devengado |
| Pensión empresa | 12% del devengado | Al cambiar devengado |
| Total deducciones | sumatoria deducciones + salud + pensión | Al cambiar cualquier input |
| **Neto a pagar** | `devengado - deducciones` | **Siempre** |

**Feedback visual:**
- Si el neto supera el umbral de embargo, mostrar warning
- Si el subsidiose aplica o no se aplica, mostrar indicador
- Si hay incapacidades, mostrar cuánto se descontó
- Si es festivo, destacada visualmente la fila (color/textura)
- Número de turnos y horas totales siempre visibles

---

## 7. Acciones Principales y Secundarias

### Acciones principales
1. **Agregar turno** — button (+) — agrega una fila nueva a la tabla
2. **Eliminar turno** — button (×) — elimina la última fila
3. **Limpiar todo** — button (opcional) — resetea el período completo
4. **Exportar** — botón para descargar PDF o CSV (futuro)
5. **Cambiar período** — selector para cambiar semana/mes

### Acciones secundarias
1. **Cambiar tema** — toggle modo oscuro/claro
2. **Ver ayuda** — tooltip o modal con guía rápida
3. **Duplicar período** — copiar turnos del mes anterior (futuro)
4. **Historial** — ir a períodos guardados (futuro)

### Acciones del MVP
- Agregar/eliminar turnos ✅
- Inputs de horas adicionales ✅
- Inputs de deducciones ✅
- Cálculo en tiempo real ✅
- Tema oscuro ✅

### Acciones para versión futura
- Login/usuario (persistencia real)
- Exportar PDF
- Historial de períodos
- Comparar períodos
- Notifications de pago

---

## 8. Información que Debe Persistirse

**Para MVP (localStorage):**
- Lista de turnos del período actual (fecha, hora inicio, hora salida, incidencia)
- Inputs de horas adicionales
- Inputs de deducciones manuales
- Tema seleccionado (oscuro/claro)
- Período seleccionado (mes/semana)

**Para versión futura (Backend):**
- Usuario autenticado
- Historial de todos los períodos
- Configuración personal (valor hora base, datos de empresa)
- Preferencias de exportación

**Clave:** El usuario no debe perder lo que está escribiendo si cierra la pestaña. localStorage es suficiente para MVP.

---

## 9. Errores y Estados Vacíos a Contemplar

### Estados vacíos
- **Sin turnos registrados:** mostrar mensaje claro "Agregá tu primer turno" + botón destacado
- **Sin horas extras:** input en 0, mostrar label "Sin horas adicionales"
- **Sin deducciones:** valores en 0, mostrar "$0" o "-"
- **Turnos sin fecha:** no calcular, mostrar "-" en valor

### Validaciones y errores
- **Hora inicio > hora salida:** mostrar error "El horario de salida no puede ser anterior al de inicio" — no permitir ese turno
- **Fecha futura:** warning "Esta fecha es futura" — permitir pero notificar
- **Valores negativos:** no permitir inputs negativos, mostrar "Valor inválido"
- **Devengado > 10 millones:** warning informativo (possibly indicate calculation might need verification)
- **Período sin turnos:** al intentar exportar, mostrar "No hay datos para exportar"
- **Más de 31 turnos en un mes:** warning "Verificá que los datos sean correctos"

### Estados de carga
- Si los cálculos demoran (>100ms), mostrar spinner o skeleton en los labels de resultado

---

## 10. Recomendaciones de Confianza y Producto

### Funcionalidades de confianza
1. **Transparencia de cálculos:** mostrar siempre cómo se llegó a cada número — el usuario debe poder verificar manualmente si quiere
2. **Valores por hora visibles:** en la sección de horas adicionales, mostrar el valor unitario usado (ej: "$11.509,90/hora diurna")
3. **Histórico de cambios:** permitir al usuario ver qué valores tuvo antes (localStorage con versiones del período)
4. **Confirmación antes de borrar todo:** modal "Vas a borrar todos los datos del período. ¿Continuás?"

### Funcionalidades de producto (valor agregado)
1. **Comparación período a período:** ver cuánto varió el neto entre meses
2. **Exportación PDF:** generar liquidación formateada para enviar o imprimir
3. **Exportación CSV:** para cargar en Excel
4. **Notifications:** Recordatorio de que cerró el período (si está cerca del fin de mes)
5. **Perfiles:** guardar múltiples configuraciones (si trabaja en dos empresas)
6. **Modo offline:** funciona sin internet (PWA)

### Estas son las que construyen confianza:
- **Breakdown claro:** que el usuario pueda decir "ah, el turno del lunes vale X porque es festivo"
- **Feedback inmediato:** que no tenga que adivinar cuánto va a ganar hasta presionar un botón
- **Persistencia:** que no pierda el trabajo si cierra el browser

---

## 11. Propuesta de Versión MVP y Versión Futura

### MVP (2-3 semanas de desarrollo)

**Scope:**
- UI responsiva (mobile-first, funciona en 320px hasta desktop)
- Registro de turnos con tabla dinámica
- Inputs de horas adicionales
- Inputs de deducciones manuales
- Cálculos en tiempo real (no botón "Calcular")
- Tema oscuro/claro
- Persistencia en localStorage
- Validaciones básicas (horarios, valores negativos)
- Breakdown claro en resumen

**No incluye:**
- Login/usuario
- Backend
- Exportación
- Historial
- Perfiles múltiples

**Criterio de done:** Un usuario puede abrir la página en su celular, registrar 15 turnos de un mes, ver su neto actualizado, y cerrar knowing exactly cuánto va a cobrar.

### Versión Futura ( Fase 2, 3-4 semanas adicionales)

**Features:**
- Autenticación (email, Google, Apple)
- Backend con PostgreSQL/firebase
- Historial de períodos (persistido, no solo localStorage)
- Exportación PDF con formato profesional
- Exportación CSV
- Mode offline (PWA)
- Comparación período a período
- Notifications push
- Perfiles múltiples (varias empresas)
- Soporte para diferentes tipos de contrato (por hora, salary, mixto)
- Widget de salary prediction (estimado del próximo pago basado en tendencia)

**Priorización:**
1. Autenticación + Backend + Historial (core de producto)
2. Exportación PDF (alta demanda de usuarios)
3. Modo offline (alta utilidad)
4. Comparación períodos (feature diferenciador)

---

## Resumen Ejecutivo

| Aspecto | Propuesta |
|---------|-----------|
| **Objetivo** | Calculadora transparente de nómina con feedback en tiempo real |
| **Usuario principal** | Trabajadores con turnos variables que necesitan verificar su salario |
| **Flujo** | Período → Turnos → Horas extras → Deducciones → Resumen (neto) |
| **Cálculo en tiempo real** | Sí — el neto se actualiza mientras el usuario tipea |
| **Responsividad** | Mobile-first — debe funcionar en 320px |
| **Persistencia** | localStorage para MVP, backend para versión futura |
| **MVP alcance** | Turnos, horas extras, deducciones, cálculo实时, tema, validaciones |
| **MVP duración** | 2-3 semanas |
| **Versión futura** | Login, historial, exportación PDF/CSV, offline, perfiles |

La clave del redesign es pasar de una app que "calcula al final" a una que **acompaña al usuario mientras ingresa**, con transparencia total en cada número.

---

*Esta propuesta fue generada tras analizar el código actual (index.html, index.js, styles.css) y el contexto del usuario sobre los problemas existentes en la aplicación.*