
const valor1 = document.getElementById("valor#1");
//console.log(valor1.textContent);

const  seleccion1= document.getElementById("_6Am");
//console.log(seleccion1.value);

const seleccion2 = document.getElementById("_13Pm");
//console.log(seleccion2.value)

const horas1= document.getElementById("horas#1");
const numero1= document.getElementById("numero11");
//console.log(numero1)
//console.log(numero1.item)

const fechaa= document.getElementById("fecha1");
//console.log(fechaa.value);
const diaa= document.getElementById("dia1");
//console.log(diaa.value);


const boton = document.querySelector("button");

const funcionprueba1 = () =>{
    if (fechaa.value) {
    let date = new Date(fechaa.value);
    let fechaactual= date.getDay();
    console.log(fechaactual)
    let diaSemana;
    switch(fechaactual){
    case 6:
        diaSemana = "Domingo";
        break;
    case 0:
        diaSemana = "Lunes";
        break;
    case 1:
        diaSemana = "Martes";
        break;
    case 2:
        diaSemana= "Miercoles";
        break
    case 3:
        diaSemana = "Jueves";
        break;
    case 4:
        diaSemana= "Viernes";
        break;
    case 5:
        diaSemana = "Sabado";      
    }
    diaa.innerText = diaSemana;
    }else{
        diaa.innerText="Sin Fecha";
    }
}


fechaa.addEventListener("change", funcionprueba1)

const funcionprueba = ()=>{
    if (seleccion1.value==="6:00 Am" && seleccion2.value==="13:00 Pm") {
        valor1.innerText="85.000.02"
        horas1.innerText =7
        numero1.innerText=100
    }else{
        valor1.innerText="0"
        horas1.innerText =0
        numero1.innerText=0
        diaa.innerText="juernes"
        console.warn("ERRORRRRRRRRRR")
    }
}

boton.addEventListener("click", funcionprueba)

