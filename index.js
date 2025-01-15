
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
const btn_cambio_tema = document.getElementById('btn_cambio_tema');
const hora_diurna = document.getElementById('hora_diurna');
const hora_nocturna = document.getElementById('hora_nocturna');
const hora_diurna_festiva=document.getElementById('hora_diurna_festiva');
const hora_nocturna_festiva=document.getElementById('hora_nocturna_festiva');

const diasSemana = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

btn_cambio_tema.addEventListener('click',()=>{
    document.body.classList.toggle('dark-theme');
})

const diasFestivos = ["2024-10-14", "2024-11-04","2024-11-11","2024-12-25","2024-10-13","2024-11-03","2024-11-10","2024-08-7","2024-08-19","2025-01-01","2025-01-06"]; // Ejemplo de fechas festivas
const esFestivo = (fecha) => {
    let fechaString;

    // Verificar si fecha es una instancia de Date
    if (fecha instanceof Date) {
        fechaString = fecha.toISOString().split('T')[0]; // Convertir a 'YYYY-MM-DD'
    } else {
        // Si ya es una cadena (como 'YYYY-MM-DD')
        fechaString = fecha; // Asumimos que es un string de fecha
    }

    // Verificar si la fecha está en el array de días festivos
    return diasFestivos.includes(fechaString);
};


// Calcular dia de la semana
const calcularDia = (fechaInput, resultadoDia, fila) => {
    if (fechaInput.value) {
        let date = new Date(fechaInput.value); // Convertir el valor del input a Date
        let diaSemana = diasSemana[date.getDay()];
        resultadoDia.innerText = diaSemana;

        // Obtener la fecha en formato 'YYYY-MM-DD' para pasarla a esFestivo
        let fechaFormateada = fechaInput.value; // Ya está en 'YYYY-MM-DD' porque viene del input

        // Cambiar el background-color de la fila si es domingo o festivo
        if (diaSemana === "Domingo" || esFestivo(fechaFormateada)) {
            if (fila) {

                fila.style.boxShadow = "10px 5px 10px 5px rgba(0, 0, 0, 0.7)";
                fila.style.transform = "scale(1.04)"; // Aumenta ligeramente el tamaño
                
            } else {
                console.error("No se pudo encontrar la fila para aplicar el color de fondo.");
            }
        } else {
            if (fila) {
                fila.style.boxShadow = "";
                fila.style.transform = ""; 
            }
        }
    } else {
        resultadoDia.innerText = " ";
        if (fila) fila.style.backgroundColor = ""; // Restablece el color si no hay fecha
    }
};




// Asignar a todos los inputs y resultados correspondientes
const asignarCalculadorDia = (fechaId, diaId, filaId) => {
    const fechaInput = document.getElementById(fechaId);
    const resultadoDia = document.getElementById(diaId);
    const fila = document.getElementById(filaId);  // Selecciona la fila

    fechaInput.addEventListener('change', () => calcularDia(fechaInput, resultadoDia, fila));
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
    if (suma < 2847000 && !subsidioYaAplicado) {  
        if (tbody.children.length > 30) {
            subsidio_transporte_global = 200000;
        } else {
            let dia_subsidio_transporte = 200000 / 30;
            subsidio_transporte_global = dia_subsidio_transporte * tbody.children.length;
        }

        subsidio_transporte_label.innerText = Number(subsidio_transporte_global).toLocaleString('es-ES', { style: 'currency', currency: 'COP' });
        subsidioYaAplicado = true;  // Asegurar que solo se aplica una vez
    } else if (suma >= 2847000) {
        subsidio_transporte_global = 0;
        subsidio_transporte_label.innerText = subsidio_transporte_global;       
    }

    return subsidio_transporte_global;
};


const valor_hora_diurna=   11509.90; const valor_media_hora_diurna = valor_hora_diurna/2;
const valor_hora_nocturna=  15538.42 ;const valor_media_hora_nocturna=valor_hora_nocturna/2;
const valor_hora_diurna_festiva= 20142.28 ; const valor_media_hora_diurna_festiva=valor_hora_diurna_festiva/2;
const valor_hora_nocturna_festiva= 24170.67;const valor_media_hora_nocturna_festiva=valor_hora_nocturna_festiva/2;

const turnos = {
    "Descanso-Descanso": { valor: 0, horas: 0, domingo: 0, festivo: 0,normalFestivo:0},
    "5:00 Am-13:00 Pm": { valor: valor_hora_diurna*7+valor_hora_nocturna, horas: 8, domingo: valor_hora_diurna_festiva*7+valor_hora_nocturna_festiva, festivo: valor_hora_diurna_festiva*7+valor_hora_nocturna_festiva , normalFestivo:valor_hora_diurna*7+valor_hora_nocturna},
    "5:30 Am-13:30 Pm": { valor:valor_hora_diurna*7+valor_media_hora_diurna+valor_media_hora_nocturna, horas: 8, domingo: valor_hora_diurna_festiva*7+valor_media_hora_diurna_festiva+valor_media_hora_nocturna_festiva, festivo: valor_hora_diurna_festiva*7+valor_media_hora_diurna_festiva+valor_media_hora_nocturna_festiva, normalFestivo:valor_hora_diurna*7+valor_media_hora_diurna+valor_media_hora_nocturna},
    "6:00 Am-12:00 m": { valor: valor_hora_diurna*6, horas: 6, domingo: valor_hora_diurna_festiva*6, festivo: valor_hora_diurna_festiva*6, normalFestivo:valor_hora_diurna*6},
    "6:00 Am-13:00 Pm": { valor: valor_hora_diurna*7, horas: 7, domingo: valor_hora_diurna_festiva*7, festivo: valor_hora_diurna_festiva*7 , normalFestivo:valor_hora_diurna*7},
    "6:00 Am-14:00 Pm": { valor: valor_hora_diurna*8, horas: 8, domingo: valor_hora_nocturna_festiva*8, festivo: valor_hora_nocturna_festiva*8 , normalFestivo:valor_hora_diurna*8},
    "7:00 Am-15:00 Pm": {valor: valor_hora_diurna*8, horas: 8, domingo: valor_hora_nocturna_festiva*8, festivo: valor_hora_nocturna_festiva*8 , normalFestivo:valor_hora_diurna*8},
    "8:00 Am-15:00 Pm": { valor: valor_hora_diurna*7, horas: 7, domingo: valor_hora_diurna_festiva*7, festivo: valor_hora_diurna_festiva*7 , normalFestivo:valor_hora_diurna*7},
    "8:00 Am-16:00 Pm": { valor: valor_hora_diurna*8, horas: 8, domingo: valor_hora_nocturna_festiva*8, festivo: valor_hora_nocturna_festiva*8 , normalFestivo:valor_hora_diurna*8},
    "9:00 Am-16:00 Pm": { valor: valor_hora_diurna*7, horas: 7, domingo: valor_hora_diurna_festiva*7, festivo: valor_hora_diurna_festiva*7 , normalFestivo:valor_hora_diurna*7},
    "10:00 Am-16:00 Pm": { valor: valor_hora_diurna*6, horas: 6, domingo: valor_hora_diurna_festiva*6, festivo: valor_hora_diurna_festiva*6, normalFestivo:valor_hora_diurna*6},
    "12:00 m-18:00 Pm": { valor: valor_hora_diurna*6, horas: 6, domingo: valor_hora_diurna_festiva*6, festivo: valor_hora_diurna_festiva*6, normalFestivo:valor_hora_diurna*6},
    "13:00 Pm-19:00 Pm": { valor: valor_hora_diurna*6, horas: 6, domingo: valor_hora_diurna_festiva*6, festivo: valor_hora_diurna_festiva*6, normalFestivo:valor_hora_diurna*6},
    "13:00 Pm-21:00 Pm": { valor: valor_hora_diurna*8, horas: 8, domingo: valor_hora_nocturna_festiva*8, festivo: valor_hora_nocturna_festiva*8 , normalFestivo:valor_hora_diurna*8},
    "13:30 Pm-21:30 Pm": { valor:valor_hora_diurna*7+valor_media_hora_diurna+valor_media_hora_nocturna, horas: 8, domingo: valor_hora_diurna_festiva*7+valor_media_hora_diurna_festiva+valor_media_hora_nocturna_festiva, festivo: valor_hora_diurna_festiva*7+valor_media_hora_diurna_festiva+valor_media_hora_nocturna_festiva, normalFestivo:valor_hora_diurna*7+valor_media_hora_diurna+valor_media_hora_nocturna},
    "14:00 Pm-22:00 Pm": { valor: valor_hora_diurna*7+valor_hora_nocturna, horas: 8, domingo: valor_hora_diurna_festiva*7+valor_hora_nocturna_festiva, festivo: valor_hora_diurna_festiva*7+valor_hora_nocturna_festiva , normalFestivo:valor_hora_diurna*7+valor_hora_nocturna},
    "14:00 Pm-21:00 Pm": {  valor: valor_hora_diurna*7, horas: 7, domingo: valor_hora_diurna_festiva*7, festivo: valor_hora_diurna_festiva*7 , normalFestivo:valor_hora_diurna*7},
    "15:00 Pm-21:00 Pm": { valor: valor_hora_diurna*6, horas: 6, domingo: valor_hora_diurna_festiva*6, festivo: valor_hora_diurna_festiva*6, normalFestivo:valor_hora_diurna*6},
    "15:00 Pm-22:00 Pm": { valor: valor_hora_diurna*6+valor_hora_nocturna, horas: 7, domingo: valor_hora_diurna_festiva*6+valor_hora_nocturna_festiva, festivo: valor_hora_diurna_festiva*6+valor_hora_nocturna_festiva, normalFestivo:valor_hora_diurna*6+valor_hora_nocturna},
    "15:00 Pm-23:00 Pm": { valor:valor_hora_diurna*6+valor_hora_nocturna*2 , horas: 8, domingo:valor_hora_diurna_festiva*6+valor_hora_nocturna_festiva*2 , festivo: valor_hora_diurna_festiva*6+valor_hora_nocturna_festiva*2  , normalFestivo:valor_hora_diurna*6+valor_hora_nocturna*2},
    "16:00 Pm-22:00 Pm": { valor: valor_hora_diurna*5+valor_hora_nocturna, horas:6, domingo: valor_hora_diurna_festiva*5+valor_hora_nocturna_festiva, festivo: valor_hora_diurna_festiva*5+valor_hora_nocturna_festiva, normalFestivo:valor_hora_diurna*5+valor_hora_nocturna},
    "16:00 Pm-23:00 Pm": { valor:valor_hora_diurna*5+valor_hora_nocturna*2 , horas: 7, domingo:valor_hora_diurna_festiva*5+ valor_hora_nocturna_festiva*2, festivo: valor_hora_diurna_festiva*5+ valor_hora_nocturna_festiva*2, normalFestivo:valor_hora_diurna*5+valor_hora_nocturna*2},
    "16:00 Pm-24:00 Pm": { valor: valor_hora_diurna*5+valor_hora_nocturna*3, horas: 8, domingo: valor_hora_diurna_festiva*5+ valor_hora_nocturna_festiva*3, festivo: valor_hora_diurna_festiva*5+ valor_hora_nocturna_festiva*3, normalFestivo:valor_hora_diurna*5+valor_hora_nocturna*3},
    "17:00 Pm-23:00 Pm": { valor: valor_hora_diurna*4+valor_hora_nocturna*2, horas: 6, domingo: valor_hora_diurna_festiva*4+valor_hora_nocturna_festiva*2, festivo: valor_hora_diurna_festiva*4+valor_hora_nocturna_festiva*2, normalFestivo:valor_hora_diurna*4+valor_hora_nocturna*2},
    "18:00 Pm-24:00 Pm": { valor: valor_hora_diurna*3+valor_hora_nocturna*3, horas: 6, domingo: valor_hora_diurna_festiva*3+valor_hora_nocturna_festiva*3, festivo: valor_hora_diurna_festiva*3+valor_hora_nocturna_festiva*3, normalFestivo:valor_hora_diurna*3+valor_hora_nocturna*3},
    "22:00 Pm-6:00 Am": { valor: valor_hora_nocturna*8, horas: 8, domingo:valor_hora_nocturna_festiva*2+valor_hora_nocturna*6, festivo: valor_hora_nocturna_festiva*8, normalFestivo:valor_hora_nocturna_festiva*6+valor_hora_nocturna*2},
    "23:00 Pm-5:00 Am": { valor: valor_hora_nocturna*6, horas: 6, domingo: valor_hora_nocturna_festiva+valor_hora_nocturna*5, festivo: valor_hora_nocturna_festiva*6, normalFestivo:valor_hora_nocturna_festiva*6+valor_hora_nocturna}
};


//valor horas


// Verifica si la fecha es domingo
const esDomingo = (fecha) => {
    let diaSemana = new Date(fecha).getDay();
    return diaSemana === 6; // 6 representa domingo
};

const normal_a_festivos = ["2024-12-31"];

const festivo_a_normal =["2025-01-01","2025-01-06"]

const esNormalAFestivo = (fecha)=>{
    return normal_a_festivos.includes(fecha);
};
const esFestivoANormal = (fecha)=>{
    return festivo_a_normal.includes(fecha);
};

const domingo_y_festivo= ["2024-10-13","2024-08-18","2025-01-05"];


// Verifica si la fecha es festivo (puedes personalizar este arreglo con las fechas de festivos)


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
        let incapacidad = document.getElementById(`incapacidad_${i}`)
        let filarr = document.getElementById(`fila_${i}`)
        
        if (horaInicio && horaSalida) { // Verifica que ambos elementos existan
            let key = `${horaInicio.value}-${horaSalida.value}`;
            if (horaInicio.value==="Descanso" && horaSalida.value==="Descanso") {
                filarr.style.opacity = "0.4";
            }
            
            // Verificar si el par de horarios está en el objeto 'turnos'
            if (turnos[key]) {
                let valorTurno = turnos[key].valor; // Valor por defecto
                if (incapacidad.checked==true) {
                    valorTurno*=0.6666;
                }
                if (esDomingo(fechaInput) && esFestivo(fechaInput)){
                    valorTurno = turnos[key].festivo; // Valor para domingo y festivo
                    if (incapacidad.checked==true) {
                        valorTurno*=0.6666;
                    }
                }
                // Verificar si es domingo o festivo
                else if (esDomingo(fechaInput)) {
                    valorTurno = turnos[key].domingo; // Valor para domingo
                    if (incapacidad.checked==true) {
                        valorTurno*=0.6666;
                    }
                } else if (esNormalAFestivo(fechaInput)) {
                    valorTurno = turnos[key].normalFestivo; // Valor para festivo
                    if (incapacidad.checked==true) {
                        valorTurno*=0.6666;
                    }
                    }else if (esFestivoANormal(fechaInput)) {
                        valorTurno = turnos[key].domingo;
                        if (incapacidad.checked==true) {
                            valorTurno*=0.6666;
                        }
                    } else if(esFestivo(fechaInput)) {
                        valorTurno= turnos[key].festivo;
                        if (incapacidad.checked==true) {
                            valorTurno*=0.6666;
                        }
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
    // console.log(hora_diurna.value);
    // console.log(hora_nocturna.value);
    // console.log(hora_diurna_festiva.value);
    // console.log(hora_nocturna_festiva.value);
    // Actualizar contadores y etiquetas
    if (hora_diurna.value) {
        suma+=hora_diurna.value*valor_hora_diurna; 
        //console.log(suma);  
    }
    if (hora_nocturna.value) {
        suma+=hora_nocturna.value*valor_hora_nocturna;
        //console.log(suma);  
    }
    if (hora_diurna_festiva.value) {
        suma+=hora_diurna_festiva.value*valor_hora_diurna_festiva;
        //console.log(suma);  
    }
    if (hora_nocturna_festiva.value) {
        suma+=hora_nocturna_festiva.value*valor_hora_nocturna_festiva;
        //console.log(suma);  
    }

    turnos_label.innerText = contador_turnos;
    horas_label.innerText = suma_horas;
    let total_subsidio = calcularNominaConSubsidio(suma);
    let salud_empleado = 4 * suma / 100;
    let salud_empresa = 8.5 * suma / 100;
    let pension_empleado = 4 * suma / 100;
    let pension_empresa = 12 * suma / 100;
    suma += total_subsidio;
    
    // Calcular y actualizar los valores de salud, pensión y salario neto

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
        <tr id='fila_${totalFilas}'>
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
                    <option class='opciones'>5:30 Am</option>
                    <option class='opciones'>6:00 Am</option>
                    <option class='opciones'>7:00 Am</option>
                    <option class='opciones'>8:00 Am</option>
                    <option class='opciones'>9:00 Am</option>
                    <option class='opciones'>10:00 Am</option>
                    <option class='opciones'>12:00 m</option>
                    <option class='opciones'>13:00 Pm</option>
                    <option class='opciones'>13:30 Pm</option>
                    <option class='opciones'>14:00 Pm</option>
                    <option class='opciones'>15:00 Pm</option>
                    <option class='opciones'>16:00 Pm</option>
                    <option class='opciones'>17:00 Pm</option>
                    <option class='opciones'>18:00 Pm</option>
                    <option class='opciones'>19:00 Pm</option>
                    <option class='opciones'>21:00 Pm</option>
                    <option class='opciones'>22:00 Pm</option>
                    <option class='opciones'>23:00 Pm</option>
                    <option class='opciones'>24:00 Pm</option>
                </select>
            </td>
            <td class='list-1'>
                <select id='hora_salida_${totalFilas}' class='opciones'>
                    <option class='opciones'>Selecciona un horario</option>
                    <option class='opciones'>Descanso</option>
                    <option class='opciones'>5:00 Am</option>
                    <option class='opciones'>5:30 Am</option>
                    <option class='opciones'>6:00 Am</option>
                    <option class='opciones'>7:00 Am</option>
                    <option class='opciones'>8:00 Am</option>
                    <option class='opciones'>9:00 Am</option>
                    <option class='opciones'>10:00 Am</option>
                    <option class='opciones'>12:00 m</option>
                    <option class='opciones'>13:00 Pm</option>
                    <option class='opciones'>13:30 Pm</option>
                    <option class='opciones'>14:00 Pm</option>
                    <option class='opciones'>15:00 Pm</option>
                    <option class='opciones'>16:00 Pm</option>
                    <option class='opciones'>17:00 Pm</option>
                    <option class='opciones'>18:00 Pm</option>
                    <option class='opciones'>19:00 Pm</option>
                    <option class='opciones'>21:00 Pm</option>
                    <option class='opciones'>21:30 Pm</option>
                    <option class='opciones'>22:00 Pm</option>
                    <option class='opciones'>23:00 Pm</option>
                    <option class='opciones'>24:00 Pm</option>
                </select>
            </td>
            <td id='valor_${totalFilas}' class='Valor'></td>
            <td id='horas_${totalFilas}' class='Horas'></td>
            <td id='numero_${totalFilas}' class='numero'></td>

            <td>
                <input id='incapacidad_${totalFilas}' type='checkbox' value='incapacidad'>
            </td>
        </tr>
    `);

        // Asignar el cálculo del día a la nueva fila
        asignarCalculadorDia(`fecha_${totalFilas}`, `dia_${totalFilas}`, `fila_${totalFilas}`);

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

