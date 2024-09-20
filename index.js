
const encabezado_tabla = document.getElementById("encabezado_tabla")
const boton_calcular = document.getElementById("calcular");
const boton_añadir = document.getElementById("añadir");
const boton_quitar = document.getElementById("quitar");
const tbody = document.getElementById("cuerpo_tabla");
const mostrador_contador= document.getElementById("mostrador_contador");
const deducciones_nomina= document.getElementById("deducciones_nomina");
const deducciones_emi_familiares = document.getElementById('deducciones_emi_familiares');
const otras_deducciones = document.getElementById('otras_deducciones');
const tota_deducciones = document.getElementById('tota_deducciones');
const total_devengado = document.getElementById('total_devengado');
const subsidio_transporte_label =document.getElementById('subsidio_transporte_label');
const horas_label = document.getElementById('horas_label');
const turnos_label = document.getElementById('turnos_label');
const valor_salud_empleado_label =  document.getElementById('valor_salud_empleado_label');
const valor_pension_empleado_label = document.getElementById('valor_pension_empleado_label');
const total_empleado_label = document.getElementById('total_empleado_label');
const valor_salud_empresa_label = document.getElementById('valor_salud_empresa_label');
const valor_pension_empresa_label = document.getElementById('valor_pension_empresa_label');
const total_empresa_label = document.getElementById('total_empresa_label');
const neto_a_pagar =  document.getElementById('neto_a_pagar');

const diasSemana = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

// Calcular dia de la semana
const calcularDia = (fechaInput, resultadoDia) => {
    if (fechaInput.value) {
        let date = new Date(fechaInput.value);
        let diaSemana = diasSemana[date.getDay()];
        resultadoDia.innerText = diaSemana;
    } else {
        resultadoDia.innerText = " ";
    }
};

// Asignar a todos los inputs y resultados correspondientes
const asignarCalculadorDia = (fechaId, diaId) => {
    const fechaInput = document.getElementById(fechaId);
    const resultadoDia = document.getElementById(diaId);

    fechaInput.addEventListener('change', () => calcularDia(fechaInput, resultadoDia));
};

// // Asignar a múltiples inputs y resultados
// for (let i = 1; i <= 4; i++) {
//     asignarCalculadorDia(`fecha_${i}`, `dia_${i}`);
//     // añadir filas y columnas que se agregen a peticion del usuario
// }


//-------------------------------------------------------------------------------------------------------//

let subsidioYaAplicado = false;
let subsidio_transporte_global = 0; // Mantener el subsidio fuera de la función

const calcularNominaConSubsidio = (suma) => {
    // Solo aplicar subsidio si no ha sido aplicado antes
    if (suma < 2600000 && !subsidioYaAplicado) {  
        if (tbody.children.length > 30) {
            subsidio_transporte_global = 162000;
        } else {
            let dia_subsidio_transporte = 162000 / 30;
            subsidio_transporte_global = dia_subsidio_transporte * tbody.children.length;
        }

        subsidio_transporte_label.innerText = Number(subsidio_transporte_global).toLocaleString('es-ES', { style: 'currency', currency: 'COP' });
        subsidioYaAplicado = true;  // Asegurar que solo se aplica una vez
    } else if (suma >= 2600000) {
        subsidio_transporte_global = 0;
        subsidio_transporte_label.innerText = subsidio_transporte_global;       
    }

    return subsidio_transporte_global;
};



const turnos = {
    "Descanso-Descanso": { valor: 0, horas: 0, domingo: 0, festivo: 0 },
    "5:00 Am-13:00 Pm": { valor: 90486.90, horas: 8, domingo: 155524.14, festivo: 155524.14 },
    "6:00 Am-13:00 Pm": { valor: 75865.62, horas: 7, domingo: 132764.56, festivo: 132764.56 },
    "6:00 Am-14:00 Pm": { valor: 86703.57, horas: 8, domingo: 151730.93, festivo: 151730.93 },
    "7:00 Am-15:00 Pm": { valor: 86703.57, horas: 8, domingo: 151730.93, festivo: 151730.93 },
    "8:00 Am-16:00 Pm": { valor: 86703.57, horas: 8, domingo: 151730.93, festivo: 151730.93 },
    "9:00 Am-16:00 Pm": { valor: 75865.62, horas: 7, domingo: 132764.56, festivo: 132764.56 },
    "14:00 Pm-22:00 Pm": { valor: 90486.90, horas: 8, domingo: 155524.14, festivo: 155524.14 },
    "15:00 Pm-23:00 Pm": { valor: 94290.24, horas: 8, domingo: 159317.35, festivo: 159317.35 },
    "16:00 Pm-23:00 Pm": { valor: 83452.29, horas: 7, domingo: 140350.98, festivo: 140350.98},
    "16:00 Pm-24:00 Pm": { valor: 98083.58, horas: 8, domingo: 163110.56, festivo: 163110.56},
    "22:00 Pm-6:00 Am": { valor: 117050.26, horas: 8, domingo: 133306.84, festivo: 182076.60},
};


// Verifica si la fecha es domingo
const esDomingo = (fecha) => {
    let diaSemana = new Date(fecha).getDay();
    return diaSemana === 6; // 6 representa domingo
};

// Verifica si la fecha es festivo (puedes personalizar este arreglo con las fechas de festivos)
const festivos = ["2024-01-01", "2024-12-25","2024-09-20","2024-09-29"]; // Ejemplo de fechas festivas
const esFestivo = (fecha) => {
    return festivos.includes(fecha);
};

// Modificar la función de cálculo de nómina
const CalcularNomina = () => {
    subsidioYaAplicado = false; // Reiniciar la variable cada vez que se hace click
    let suma_horas = 0;
    let contador_turnos = 0;
    let suma = 0;
    
    // Selecciona todas las filas dinámicamente
    let filas = document.querySelectorAll('tbody tr'); // Selecciona todas las filas dentro de <tbody>

    filas.forEach((fila, index) => {
        let i = index + 1;
        
        let horaInicio = document.getElementById(`hora_inicio_${i}`);
        let horaSalida = document.getElementById(`hora_salida_${i}`);
        let fechaInput = document.getElementById(`fecha_${i}`).value; // Obtener la fecha
        
        if (horaInicio && horaSalida) { // Verifica que ambos elementos existan
            let key = `${horaInicio.value}-${horaSalida.value}`;
            
            // Verificar si el par de horarios está en el objeto 'turnos'
            if (turnos[key]) {
                let valorTurno = turnos[key].valor; // Valor por defecto
                
                // Verificar si es domingo o festivo
                if (esDomingo(fechaInput)) {
                    valorTurno = turnos[key].domingo; // Valor para domingo
                } else if (esFestivo(fechaInput)) {
                    valorTurno = turnos[key].festivo; // Valor para festivo
                }

                // Mostrar el valor del turno en la tabla
                document.getElementById(`valor_${i}`).innerText = Number(valorTurno).toLocaleString('es-ES', { style: 'currency', currency: 'COP' });
                suma += valorTurno;
                
                // Actualizar las horas trabajadas
                document.getElementById(`horas_${i}`).innerText = turnos[key].horas;
                suma_horas += turnos[key].horas;

                // Control del número de turnos
                if (horaInicio.value === "Descanso" && horaSalida.value === "Descanso") {
                    document.getElementById(`numero_${i}`).innerText = " ";
                } else {
                    contador_turnos += 1;
                    document.getElementById(`numero_${i}`).innerText = contador_turnos;
                }
            }
        } else {
            console.error(`No se encontró el elemento hora_inicio_${i} o hora_salida_${i}`);
        }
    });

    // Actualizar contadores y etiquetas
    turnos_label.innerText = contador_turnos;
    horas_label.innerText = suma_horas;
    let total_subsidio = calcularNominaConSubsidio(suma);
    suma += total_subsidio;
    
    // Calcular y actualizar los valores de salud, pensión y salario neto
    let salud_empleado = 4 * suma / 100;
    let salud_empresa = 8.5 * suma / 100;
    let pension_empleado = 4 * suma / 100;
    let pension_empresa = 12 * suma / 100;
    let total_salud_pension_empleado = salud_empleado + pension_empleado;
    let total_salud_pension_empresa = salud_empresa + pension_empresa;
    
    let montoDeducciones = Number(deducciones_nomina.value) + Number(deducciones_emi_familiares.value) + Number(otras_deducciones.value) + pension_empleado + salud_empleado;
    
    tota_deducciones.innerText = Number(montoDeducciones).toLocaleString('es-ES', { style: 'currency', currency: 'COP' });
    total_empresa_label.innerText = Number(total_salud_pension_empresa).toLocaleString('es-ES', { style: 'currency', currency: 'COP' });
    valor_pension_empresa_label.innerText = Number(pension_empresa).toLocaleString('es-ES', { style: 'currency', currency: 'COP' });
    valor_salud_empresa_label.innerText = Number(salud_empresa).toLocaleString('es-ES', { style: 'currency', currency: 'COP' });
    total_empleado_label.innerText = Number(total_salud_pension_empleado).toLocaleString('es-ES', { style: 'currency', currency: 'COP' });
    valor_pension_empleado_label.innerText = Number(pension_empleado).toLocaleString('es-ES', { style: 'currency', currency:'COP' });
    valor_salud_empleado_label.innerText = Number(salud_empleado).toLocaleString('es-ES', { style: 'currency', currency:'COP' });
    
    let salario_neto = suma - montoDeducciones;
    neto_a_pagar.innerText = Number(salario_neto).toLocaleString('es-ES', { style: 'currency', currency: 'COP' });
    total_devengado.innerText = Number(suma).toLocaleString('es-ES', { style: 'currency', currency: 'COP' });
    
    return suma;
};



let contador = 1; // Contador para generar IDs únicos dinámicos

const AñadirFila = () => {
    let totalFilas = tbody.querySelectorAll('tr').length + 1; // Cuenta las filas actuales y suma 1 para el nuevo índice
    tbody.insertAdjacentHTML("beforeend", `
        <tr>
            <td>
                <label id='dia_${totalFilas}' class='cajas' type='text'></label>
            </td>
            <td>
                <input id='fecha_${totalFilas}' class='cajas' type='date'>
            </td>
            <td class='list-1'>
                <select id='hora_inicio_${totalFilas}' class='opciones'>
                    <option class='opciones'>Selecciona un horario</option>
                    <option class='opciones'>Descanso</option>
                    <option class='opciones'>5:00 Am</option>
                    <option class='opciones'>6:00 Am</option>
                    <option class='opciones'>7:00 Am</option>
                    <option class='opciones'>8:00 Am</option>
                    <option class='opciones'>9:00 Am</option>
                    <option class='opciones'>12:00 m</option>
                    <option class='opciones'>13:00 Pm</option>
                    <option class='opciones'>14:00 Pm</option>
                    <option class='opciones'>15:00 Pm</option>
                    <option class='opciones'>16:00 Pm</option>
                    <option class='opciones'>17:00 Pm</option>
                    <option class='opciones'>18:00 Pm</option>
                    <option class='opciones'>22:00 Pm</option>
                    <option class='opciones'>23:00 Pm</option>
                </select>
            </td>
            <td class='list-1'>
                <select id='hora_salida_${totalFilas}' class='opciones'>
                    <option class='opciones'>Selecciona un horario</option>
                    <option class='opciones'>Descanso</option>
                    <option class='opciones'>5:00 Am</option>
                    <option class='opciones'>6:00 Am</option>
                    <option class='opciones'>12:00 m</option>
                    <option class='opciones'>13:00 Pm</option>
                    <option class='opciones'>14:00 Pm</option>
                    <option class='opciones'>15:00 Pm</option>
                    <option class='opciones'>16:00 Pm</option>
                    <option class='opciones'>17:00 Pm</option>
                    <option class='opciones'>18:00 Pm</option>
                    <option class='opciones'>22:00 Pm</option>
                    <option class='opciones'>23:00 Pm</option>
                    <option class='opciones'>24:00 Pm</option>
                </select>
            </td>
            <td id='valor_${totalFilas}' class='Valor'></td>
            <td id='horas_${totalFilas}' class='Horas'></td>
            <td id='numero_${totalFilas}' class='numero'></td>
        </tr>
    `);

        // Asignar el cálculo del día a la nueva fila
        asignarCalculadorDia(`fecha_${totalFilas}`, `dia_${totalFilas}`);

        contador++; // Incrementar el contador para la próxima fila
        mostrador_contador.innerText = tbody.children.length;
};

const QuitarFila = () => {
    // Asegurarse de que haya filas en el tbody
    let filas = tbody.querySelectorAll('tr');
    if (filas.length > 0) {
        // Eliminar la última fila si existe
        tbody.removeChild(filas[filas.length - 1]);
        //let totalSuma = CalcularNomina();
        //console.log(totalSuma);   
    }
    mostrador_contador.innerText = tbody.children.length;
};


boton_calcular.addEventListener("click", CalcularNomina);
boton_añadir.addEventListener("click", AñadirFila);
boton_quitar.addEventListener('click',QuitarFila);

