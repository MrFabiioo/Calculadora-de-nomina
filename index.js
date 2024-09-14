//Extraccion de dias de los turnos 
const dia_1= document.getElementById("dia_1");
const dia_2= document.getElementById("dia_2");
const dia_3= document.getElementById("dia_3");
const dia_4= document.getElementById("dia_4");
//Extraccion de fechas de los turnos 
const fecha_1= document.getElementById("fecha_1");
const fecha_2= document.getElementById("fecha_2");
const fecha_3= document.getElementById("fecha_3");
const fecha_4= document.getElementById("fecha_4");

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

const CalcularDia = () =>{
    if (fecha_1.value) {
    let date_1 = new Date(fecha_1.value);
    let fecha_actual_1= date_1.getDay();
    //console.log(fecha_actual_1)
    let dia_semana_1;
    switch(fecha_actual_1){
    case 6:
        dia_semana_1 = "Domingo";
        break;
    case 0:
        dia_semana_1 = "Lunes";
        break;
    case 1:
        dia_semana_1 = "Martes";
        break;
    case 2:
        dia_semana_1= "Miercoles";
        break
    case 3:
        dia_semana_1 = "Jueves";
        break;
    case 4:
        dia_semana_1= "Viernes";
        break;
    case 5:
        dia_semana_1 = "Sabado";      
    }
    dia_1.innerText = dia_semana_1;
    }else{
        dia_1.innerText="Sin Fecha";
    }
    if (fecha_2.value) {
        let date_2 = new Date(fecha_2.value);
        let fecha_actual_2= date_2.getDay();
       // console.log(fecha_actual_2)
        let dia_semana_2;
        switch(fecha_actual_2){
        case 6:
            dia_semana_2 = "Domingo";
            break;
        case 0:
            dia_semana_2 = "Lunes";
            break;
        case 1:
            dia_semana_2 = "Martes";
            break;
        case 2:
            dia_semana_2= "Miercoles";
            break
        case 3:
            dia_semana_2 = "Jueves";
            break;
        case 4:
            dia_semana_2= "Viernes";
            break;
        case 5:
            dia_semana_2 = "Sabado";      
        }
        dia_2.innerText = dia_semana_2;
        }else{
            dia_2.innerText=" ";
        }
}


fecha_1.addEventListener("change", CalcularDia)
fecha_2.addEventListener("change", CalcularDia)

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

