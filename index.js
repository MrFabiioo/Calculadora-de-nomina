
const valor1 = document.getElementById("valor#1");
console.log(valor1.textContent);

const  seleccion1= document.getElementById("_6Am");
console.log(seleccion1.value);

const seleccion2 = document.getElementById("_13Pm");
console.log(seleccion2.value)

const boton = document.querySelector("button");

const funcionprueba = ()=>{
    if (seleccion1.value==="6:00 Am" && seleccion2.value==="13:00 Pm") {
        valor1.innerText="85.000 peso"
    }else{
        valor1.innerText="0"
        alert("Las opciones que estas usando no son correctas")
    }
}

boton.addEventListener("click", funcionprueba)

