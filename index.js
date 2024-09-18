
const encabezado_tabla = document.getElementById("encabezado_tabla")
const boton_calcular = document.getElementById("calcular");
const boton_añadir = document.getElementById("añadir");
const boton_quitar = document.getElementById("quitar");
const tbody = document.getElementById("cuerpo_tabla");
const mostrador_contador= document.getElementById("mostrador_contador");
const deducciones_nomina= document.getElementById("deducciones_nomina");
const tota_deducciones = document.getElementById('tota_deducciones');
const salario_neto = document.getElementById('salario_neto');
const subsidio_transporte_label =document.getElementById('subsidio_transporte_label');

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

const calcularNominaConSubsidio = () => {
    if (suma < 2600000 && !subsidioYaAplicado) {  // Se añade el subsidio solo si no se ha aplicado antes
        let subsidio_transporte = 0;

        if (tbody.children.length > 30) {
            subsidio_transporte = 162000;
            //suma += subsidio_transporte;
            subsidio_transporte_label.innerText = Number(subsidio_transporte).toLocaleString('es-ES', { style: 'currency', currency: 'COP' });
        } else {
            let dia_subsidio_transporte = 162000 / 30;
            let subsidio_transporte_a_pagar = dia_subsidio_transporte * tbody.children.length;
            //suma += subsidio_transporte_a_pagar;
            subsidio_transporte_label.innerText = Number(subsidio_transporte_a_pagar).toLocaleString('es-ES', { style: 'currency', currency: 'COP' });
        }

        subsidioYaAplicado = true;  // Marcamos que ya se ha aplicado el subsidio
        //salario_neto.innerText = Number(suma).toLocaleString('es-ES', { style: 'currency', currency: 'COP' });

    } else if (suma > 2600000) {
        subsidio_transporte_label.innerText = 0;
        
    }
    return
};


const turnos = {
    "6:00 Am-13:00 Pm": { valor: 75865.62, horas: 7 },
    "5:00 Am-13:00 Pm": { valor: 90486.90, horas: 8 },
    "Descanso-Descanso": { valor:0,horas:""}
    // Agrega aquí los demás turnos y sus valores
};



const CalcularNomina = () => {
    let contador_turnos = 0;
    let suma=0;
    // Selecciona todas las filas dinámicamente
    let filas = document.querySelectorAll('tbody tr'); // Selecciona todas las filas dentro de <tbody>

    filas.forEach((fila, index) => {
        let i = index + 1; // Ajusta el índice para que comience en 1 (opcional si lo necesitas)
        
        let horaInicio = document.getElementById(`hora_inicio_${i}`);
        let horaSalida = document.getElementById(`hora_salida_${i}`);
        
        if (horaInicio && horaSalida) { // Verifica que ambos elementos existan
            let key = `${horaInicio.value}-${horaSalida.value}`;
            
            
            // Verificar si el par de horarios está en el objeto 'turnos'
            if (turnos[key]) {
                document.getElementById(`valor_${i}`).innerText = turnos[key].valor;
                suma +=turnos[key].valor;
                //console.log(suma)
                document.getElementById(`horas_${i}`).innerText = turnos[key].horas;
                if(horaInicio.value==="Descanso" && horaSalida.value==="Descanso"){
                    document.getElementById(`numero_${i}`).innerText = " ";
                }else{
                contador_turnos += 1;
                document.getElementById(`numero_${i}`).innerText = contador_turnos;
                }
                let monto  = Number(deducciones_nomina.value).toLocaleString('es-ES',{style:'currency',currency:'COP'})
                //console.log(monto);

                tota_deducciones.innerText =monto;
            }
        } else {
            console.error(`No se encontró el elemento hora_inicio_${i} o hora_salida_${i}`);
        }
        console.log(calcularNominaConSubsidio(suma));
        let total_subsidio = calcularNominaConSubsidio(suma);
        suma+=total_subsidio
        salario_neto.innerText = Number(suma).toLocaleString('es-ES', { style: 'currency', currency: 'COP' });

    });

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
        let totalSuma = CalcularNomina();
        //console.log(totalSuma);   
    }
    mostrador_contador.innerText = tbody.children.length;
};


boton_calcular.addEventListener("click", CalcularNomina);
boton_añadir.addEventListener("click", AñadirFila);
boton_quitar.addEventListener('click',QuitarFila);

