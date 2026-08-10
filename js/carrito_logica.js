let cuponAplicado = null;
let descuentoPorcentaje = 0;

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

    // 5. Botón Aplicar Cupón
    const btnAplicarCupon = document.getElementById('btn-aplicar-cupon'); 
    const inputCupon = document.getElementById('input-cupon'); 
    const mensajeCupon = document.getElementById('mensaje-cupon'); 

    if (btnAplicarCupon && inputCupon) {
        btnAplicarCupon.addEventListener('click', (e) => {
            e.preventDefault();
            procesarAplicacionCupon();
        });
    }

    // 6. DETECCIÓN UNIVERSAL DEL BOTÓN DE PAGO (Cubre 'btn-pagar-mp', 'btn-pagar' o cualquier botón de pago)
    const btnPagar = document.getElementById('btn-pagar-mp') || 
                     document.getElementById('btn-pagar') || 
                     Array.from(document.querySelectorAll('button')).find(el => el.innerText.toLowerCase().includes('pagar'));

    if (btnPagar) {
        btnPagar.addEventListener('click', pagarConMercadoPago);
        btnPagar.onclick = (e) => { e.preventDefault(); pagarConMercadoPago(e); };
    }
});

function procesarAplicacionCupon() {
    const inputCupon = document.getElementById('input-cupon');
    const mensajeCupon = document.getElementById('mensaje-cupon');
    const codigo = inputCupon ? inputCupon.value.trim().toUpperCase() : '';

    if (codigo === 'MATE95') {
        cuponAplicado = 'MATE95';
        descuentoPorcentaje = 0.99; // 99% de descuento
        if (mensajeCupon) {
            mensajeCupon.innerText = '¡Cupón MATE95 aplicado (99% OFF)!';
            mensajeCupon.style.color = '#22c55e';
        }
    } else {
        cuponAplicado = null;
        descuentoPorcentaje = 0;
        if (mensajeCupon) {
            mensajeCupon.innerText = 'Cupón inválido';
            mensajeCupon.style.color = '#ef4444';
        }
    }
    calcularCostoEnvio();
}

function renderizarCarrito() {
    const contenedor = document.getElementById('contenedor-carrito') || document.getElementById('lista-carrito');
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
                <span>${item.title || item.nombre}</span>
                <span>$${item.unit_price || item.precio}</span>
                <button type="button" onclick="eliminarItem(${index})">❌</button>
            </div>`;
    });
    calcularCostoEnvio();
}

function calcularCostoEnvio() {
    const selectProv = document.getElementById('select-provincia');
    const inputLoc = document.getElementById('input-localidad');
    
    const provincia = selectProv ? selectProv.value : '';
    const localidad = inputLoc ? inputLoc.value.toLowerCase() : '';
    let costo = 0;

    if (localidad.includes("cañuelas") || localidad.includes("uribelarrea") || localidad.includes("máximo paz")) {
        costo = 3500;
    } else if (provincia === "CABA") {
        costo = 3500;
    } else if (provincia === "Buenos Aires") {
        costo = 6500;
    } else if (provincia !== "") {
        costo = 8500;
    }

    const envioTexto = document.getElementById('costo-envio-texto');
    if (envioTexto) envioTexto.innerText = '$' + costo;
    actualizarTotales(costo);
}

function actualizarTotales(envio) {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    const subtotal = carrito.reduce((acc, item) => {
        let precio = Number(item.unit_price || item.precio || 0);
        if (cuponAplicado === 'MATE95') {
            precio = precio * (1 - descuentoPorcentaje); 
        }
        const cantidad = Number(item.quantity || item.cantidad || 1);
        return acc + (precio * cantidad);
    }, 0);

    const total = subtotal + envio;

    const totalLista = document.getElementById('total-lista') || document.getElementById('total-precio');
    const totalTransferencia = document.getElementById('total-transferencia');

    if (totalLista) totalLista.innerText = '$' + Math.round(total);
    if (totalTransferencia) totalTransferencia.innerText = '$' + Math.round(total * 0.9);
}

function eliminarItem(index) {
    let carrito = JSON.parse(localStorage.getItem('carrito'));
    carrito.splice(index, 1);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    renderizarCarrito();
}

async function pagarConMercadoPago(e) {
    if (e) e.preventDefault();
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    if (carrito.length === 0) {
        alert('El carrito está vacío');
        return;
    }

    const nombre = document.getElementById('cliente-nombre')?.value || '';
    const telefono = document.getElementById('cliente-telefono')?.value || '';
    const direccion = document.getElementById('cliente-direccion')?.value || '';
    const localidad = document.getElementById('input-localidad')?.value || '';
    
    // Captura automática del cupón directamente del input por si olvidó darle al botón "Aplicar"
    const inputCuponDOM = document.getElementById('input-cupon');
    const codigoInput = inputCuponDOM ? inputCuponDOM.value.trim().toUpperCase() : '';
    const cuponFinal = (codigoInput === 'MATE95' || cuponAplicado === 'MATE95') ? 'MATE95' : null;

    const esRetiro = document.querySelector('#retiro-tienda')?.classList.contains('selected') || false; 
    const metodoEntrega = esRetiro ? 'retiro' : 'envio';

    const datosCliente = {
        nombre,
        telefono,
        direccion,
        localidad,
        metodo: metodoEntrega
    };

    try {
        const respuesta = await fetch('https://matecito.onrender.com/api/crear-preferencia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: carrito,
                cliente: datosCliente,
                cupon: cuponFinal // Envía el cupón detectado al servidor de Render
            })
        });

        const datos = await respuesta.json();
        if (datos.init_point) {
            window.location.href = datos.init_point; 
        } else {
            alert('Error al generar la preferencia de pago.');
        }
    } catch (error) {
        console.error('Error de conexión con el servidor:', error);
        alert('No se pudo conectar con el servidor de pagos.');
    }
}

function enviarWhatsApp(e) {
    e.preventDefault();
    const nombre = document.getElementById('cliente-nombre')?.value || '';
    const direccion = document.getElementById('cliente-direccion')?.value || '';
    const total = document.getElementById('total-lista')?.innerText || '$0';
    
    const mensaje = `Hola, quiero finalizar mi compra. Nombre: ${nombre}, Dirección: ${direccion}, Total: ${total}`;
    const url = `https://wa.me/5491100000000?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}