

// Extraccion de horarios de los turnos
const  hora_inicio_1= document.getElementById("hora_inicio_1");
const hora_salida_1 = document.getElementById("hora_salida_1");

const  hora_inicio_2= document.getElementById("hora_inicio_2");
const hora_salida_2 = document.getElementById("hora_salida_2");

const  hora_inicio_3= document.getElementById("hora_inicio_3");
const hora_salida_3 = document.getElementById("hora_salida_3");

const  hora_inicio_4= document.getElementById("hora_inicio_4");
const hora_salida_4 = document.getElementById("hora_salida_4");

//Extraccion de valores de los turnos
const valor_1 = document.getElementById("valor_1");
const valor_2 = document.getElementById("valor_2");
const valor_3 = document.getElementById("valor_3");
const valor_4 = document.getElementById("valor_4");

//Extraccion de Horas de los turnos
const horas_1= document.getElementById("horas_1");
const horas_2= document.getElementById("horas_2");
const horas_3= document.getElementById("horas_3");
const horas_4= document.getElementById("horas_4");
//Extraccion de numero de turnos 
const numero_1= document.getElementById("numero_1");
const numero_2= document.getElementById("numero_2");
const numero_3= document.getElementById("numero_3");
const numero_4= document.getElementById("numero_4");

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
    console.log(i)
    // añadir filas y columnas que se agregen a peticion del usuario
}

const CalcularNomina = ()=>{
    let contador_turnos =0;
    if (hora_inicio_1.value==="6:00 Am" && hora_salida_1.value==="13:00 Pm") {
        valor_1.innerText=75865.62
        horas_1.innerText =7
        contador_turnos+=1;
        numero_1.innerText=contador_turnos;
    }
    if (hora_inicio_1.value==="5:00 Am" && hora_salida_1.value==="13:00 Pm") {
        valor_1.innerText=90486.90
        horas_1.innerText =8
        contador_turnos+=1;
        numero_1.innerText=contador_turnos;
    }
    if (hora_inicio_3.value==="6:00 Am" && hora_salida_3.value==="13:00 Pm") {
        valor_3.innerText=75865.62
        horas_3.innerText =7
        contador_turnos+=1;
        numero_3.innerText=contador_turnos;
    }
    if (hora_inicio_4.value==="5:00 Am" && hora_salida_4.value==="13:00 Pm") {
        valor_4.innerText=90486.90
        horas_4.innerText =8
        contador_turnos+=1;
        numero_4.innerText=contador_turnos;
    }
}

boton.addEventListener("click", CalcularNomina)

