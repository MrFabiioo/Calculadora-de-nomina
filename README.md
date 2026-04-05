# 💰 Calculadora de Nómina Colombiana

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Web-blue.svg)](https://fabiozzp.github.io/Calculadora-de-nomina/)

Una calculadora de nómina en línea diseñada para trabajadores Colombianos con turnos variables. Calcula tu salario neto de forma transparente, mostrando exactamente cómo se llegó a cada valor.

## ✨ ¿Qué hace esta aplicación?

Esta herramienta te permite:

- **Registrar turnos laborales** con fecha, hora de inicio y salida
- **Calcular automáticamente** el valor de cada turno considerando:
  - Turnos diurnos y nocturnos
  - Días festivos
  - Incapacidades (66.67% de descuento)
  - Cruces de medianoche
- **Agregar horas adicionales** (extras diurnas/nocturnas y festivas)
- **Gestionar deducciones** (préstamos, EMI, otras)
- **Ver el desglose completo** de tu liquidación en tiempo real
- **Exportar a Excel** para tus registros o compartir

> 💡 **Nota:** Los cálculos se actualizan automáticamente mientras escribes. No necesitas presionar ningún botón para ver el resultado.

---

## 📋 Principales Funcionalidades

### Cálculo por Tramos Horarios

La app divide cada turno en tramos para calcular correctamente el valor según la hora del día:

| Tramo | Horario | Tarifa |
|-------|---------|--------|
| Diurno | 06:00 - 19:00 | 100% |
| Nocturno | 19:00 - 06:00 | 135% |

**Ejemplos de cálculo:**

- Turno de 08:00 a 16:00 → Todo diurno (8 horas)
- Turno de 20:00 a 04:00 → Todo nocturno (8 horas)  
- Turno de 16:00 a 00:00 → 3h diurnas + 5h nocturnas

### Días Festivos

Los turnos lavorados en días festivos se calculan con recargo del **75%** adicional sobre la hora diurna. La app detecta automáticamente si la fecha es festiva.

### Incapacidades

Si marcás una fecha como incapacidad, el turno se descuenta al **66.67%** (2/3) del valor normal, según la normativa laboral colombiana (Art. 227 CST).

### Subsidio de Transporte

El subsidy se calcula automáticamente:

- **Monto máximo:** $249,095 / mes
- **Límite de ingresos:** No aplica si el devengado supera $3,501,810
- **Cálculo:** Prorrateo por días trabajados (máximo 30 días)

---

## 🖥️ Cómo Usar la App

### 1. Agregar Turnos

En la sección **Turnos**, hacé clic en el botón `+` para agregar una fila. Completá:

- **Fecha:** Seleccioná el día trabajado
- **Hora inicio:** Elegí el horario de entrada
- **Hora salida:** Elegí el horario de salida
- **Incapacidad:** Marcá si fue un día de incapacidad

### 2. Agregar Horas Extras

En la sección **Horas adicionales**, ingresá:

- Horas diurnas adicionales
- Horas nocturnas adicionales
- Horas diurnas festivas adicionales
- Horas nocturnas festivas adicionales

### 3. Deducciones

En la sección **Deducciones**, podés agregar:

- Deducción por nómina
- EMI familiares
- Otras deducciones

### 4. Ver Resultados

El **salario neto** aparece destacado en el panel lateral y se actualiza en tiempo real. También podés ver:

- Total devengado
- Subsidio de transporte
- Deducciones obligatorias (salud 4% + pensión 4%)
- Aportes patronales (salud 8.5% + pensión 12%)

### 5. Exportar

Hacé clic en el botón **Excel** para descargar un archivo con el resumen completo, detalle por turno y desglose por tramo.

---

## 🌙 Características de UX

- **Tema oscuro/claro:** Toggle en el header para cambiar entre modos
- **Diseño responsivo:** Funciona en celular (320px) hasta desktop
- **Persistência:** Tus datos se guardan en localStorage, así que no los perdés si cerrás la pestaña
- **Validaciones:** Feedback visual cuando los valores son inválidos

---

## 🏗️ Estructura del Proyecto

```
Calculadora-de-nomina/
├── index.html          # Estructura HTML principal
├── styles.css         # Estilos (tema claro/oscuro)
├── index.js           # Entry point y coordinación
├── src/
│   ├── domain/        # Lógica de negocio
│   │   ├── calculations.js    # Cálculo de nómina
│   │   ├── shifts.js          # Definición de turnos y tarifas
│   │   ├── payroll-breakdown.js  # Liquidación por tramos
│   │   ├── segments.js       # Segmentación temporal
│   │   ├── holidays.js       # Fechas festivas
│   │   └── store.js          # Estado de la aplicación
│   ├── ui/
│   │   └── renderer.js       # Renderizado del DOM
│   └── utils/
│       ├── formatters.js     # Formato de moneda
│       ├── validators.js     # Validaciones de input
│       └── exporter.js       # Exportación a Excel
├── tests/             # Tests unitarios
├── scripts/           # Scripts de regresión
└── LICENSE            # Licencia MIT
```

---

## 🚀 Tecnologías

- **Vanilla JavaScript** (ES Modules)
- **SheetJS** para exportación a Excel
- **CSS Custom Properties** para theming
- **HTML5 semántico** con accesibilidad

---

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).

---

## 🤝 Contribuciones

¿Encontraste un bug o quisieras agregar una funcionalidad? Abrí un issue o mandá un PR. Las contribuciones son bienvenidas.

---

*Desarrollado con 💚 para trabajadores Colombianos*
