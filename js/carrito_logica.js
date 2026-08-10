document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar productos del carrito
    renderizarCarrito();

    // 2. Eventos de cálculo de envío
    const selectProvincia = document.getElementById('select-provincia');
    const inputLocalidad = document.getElementById('input-localidad');
    
    if (selectProvincia) selectProvincia.addEventListener('change', calcularCostoEnvio);
    if (inputLocalidad) inputLocalidad.addEventListener('input', calcularCostoEnvio);

    // 3. Botón WhatsApp
    const btnFinalizar = document.getElementById('btn-finalizar');
    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', enviarWhatsApp);
    }

    // 4. Botón Vaciar
    const btnVaciar = document.getElementById('btn-vaciar');
    if (btnVaciar) {
        btnVaciar.addEventListener('click', () => {
            localStorage.removeItem('carrito');
            location.reload();
        });
    }
});

function renderizarCarrito() {
    const contenedor = document.getElementById('contenedor-carrito');
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    if (!contenedor) return;

    if (carrito.length === 0) {
        contenedor.innerHTML = '<p>Tu carrito está vacío.</p>';
        return;
    }

    contenedor.innerHTML = '';
    carrito.forEach((item, index) => {
        contenedor.innerHTML += `
            <div class="item-carrito">
                <span>${item.nombre}</span>
                <span>$${item.precio}</span>
                <button type="button" onclick="eliminarItem(${index})">❌</button>
            </div>`;
    });
    calcularCostoEnvio(); // Calcular apenas carga
}

function calcularCostoEnvio() {
    const provincia = document.getElementById('select-provincia').value;
    const localidad = document.getElementById('input-localidad').value.toLowerCase();
    let costo = 0;

    // Lógica de precios
    if (localidad.includes("cañuelas") || localidad.includes("uribelarrea") || localidad.includes("máximo paz")) {
        costo = 3500;
    } else if (provincia === "CABA") {
        costo = 3500;
    } else if (provincia === "Buenos Aires") {
        costo = 6500;
    } else if (provincia !== "") {
        costo = 8500;
    }

    document.getElementById('costo-envio-texto').innerText = '$' + costo;
    actualizarTotales(costo);
}

function actualizarTotales(envio) {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const subtotal = carrito.reduce((acc, item) => acc + item.precio, 0);
    const total = subtotal + envio;

    document.getElementById('total-lista').innerText = '$' + total;
    document.getElementById('total-transferencia').innerText = '$' + Math.round(total * 0.9);
}

function eliminarItem(index) {
    let carrito = JSON.parse(localStorage.getItem('carrito'));
    carrito.splice(index, 1);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    renderizarCarrito();
}

function enviarWhatsApp(e) {
    e.preventDefault();
    const nombre = document.getElementById('cliente-nombre').value;
    const direccion = document.getElementById('cliente-direccion').value;
    const total = document.getElementById('total-lista').innerText;
    
    const mensaje = `Hola, quiero finalizar mi compra. Nombre: ${nombre}, Dirección: ${direccion}, Total: ${total}`;
    const url = `https://wa.me/5491100000000?text=${encodeURIComponent(mensaje)}`; // Cambia el numero
    window.open(url, '_blank');
}