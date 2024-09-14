

const boton = document.querySelector("button");

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

// Asignar a múltiples inputs y resultados
for (let i = 1; i <= 4; i++) {
    asignarCalculadorDia(`fecha_${i}`, `dia_${i}`);
    // añadir filas y columnas que se agregen a peticion del usuario
}

const turnos = {
    "6:00 Am-13:00 Pm": { valor: 75865.62, horas: 7 },
    "5:00 Am-13:00 Pm": { valor: 90486.90, horas: 8 }
    // Agrega aquí los demás turnos y sus valores
};

const CalcularNomina = () => {
    let contador_turnos = 0;

    // Procesar cada input
    for (let i = 1; i <= 4; i++) {
        let horaInicio = document.getElementById(`hora_inicio_${i}`).value;
        let horaSalida = document.getElementById(`hora_salida_${i}`).value;
        let key = `${horaInicio}-${horaSalida}`;
        
        // Verificar si el par de horarios está en el objeto 'turnos'
        if (turnos[key]) {
            console.log(turnos[key])
            document.getElementById(`valor_${i}`).innerText = turnos[key].valor;
            document.getElementById(`horas_${i}`).innerText = turnos[key].horas;
            contador_turnos += 1;
            console.log("van: "+contador_turnos)
            document.getElementById(`numero_${i}`).innerText = contador_turnos;
        }
    }
};

boton.addEventListener("click", CalcularNomina);

