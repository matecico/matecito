// 1. ESTADO GLOBAL
let carrito = [];
try {
  carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  if (!Array.isArray(carrito)) carrito = [];
} catch (err) {
  carrito = [];
}

let costoEnvio = 0;

function guardarCarrito() {
  try {
    localStorage.setItem('carrito', JSON.stringify(carrito));
  } catch (err) {
    console.error('Error al guardar en localStorage:', err);
  }
}

// 2. RENDERIZAR CARRITO
function renderizarCarrito() {
  const contenedor = document.getElementById('contenedor-carrito');
  if (!contenedor) return;

  if (carrito.length === 0) {
    contenedor.innerHTML = '<div style="background:#1e1e1e; padding:20px; border-radius:8px; text-align:center; color:#ccc; border:1px solid #333;">El carrito está vacío. Agregá productos desde el catálogo.</div>';
    actualizarTotales();
    return;
  }

  contenedor.innerHTML = '';
  carrito.forEach((prod, index) => {
    const precio = Number(prod.unit_price || prod.precio || 0);
    const cant = Number(prod.quantity || prod.cantidad || 1);
    const subtotal = precio * cant;
    const titulo = prod.title || prod.nombre || 'Producto';
    const img = prod.imagen || prod.img || '';

    const div = document.createElement('div');
    div.className = 'item-carrito';
    div.innerHTML = `
      <div class="info-producto-carrito">
        ${img ? `<img src="${img}" alt="${titulo}" class="img-item-carrito">` : ''}
        <div class="detalles-item">
          <h4>${titulo}</h4>
          <span>$${precio.toLocaleString('es-AR')} c/u</span>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:12px;">
        <div class="selector-cantidad">
          <button type="button" onclick="cambiarCantidad(${index}, -1)">-</button>
          <span>${cant}</span>
          <button type="button" onclick="cambiarCantidad(${index}, 1)">+</button>
        </div>
        <strong class="precio-item-carrito">$${subtotal.toLocaleString('es-AR')}</strong>
        <button type="button" onclick="eliminarDelCarrito(${index})" class="btn-eliminar-item">🗑️</button>
      </div>
    `;
    contenedor.appendChild(div);
  });

  actualizarTotales();
}

function cambiarCantidad(index, cambio) {
  if (carrito[index]) {
    let cant = Number(carrito[index].quantity || carrito[index].cantidad || 1) + cambio;
    if (cant <= 0) {
      carrito.splice(index, 1);
    } else {
      carrito[index].quantity = cant;
      carrito[index].cantidad = cant;
    }
    guardarCarrito();
    renderizarCarrito();
  }
}

function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  guardarCarrito();
  renderizarCarrito();
}

window.cambiarCantidad = cambiarCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;

// 3. CALCULAR ENVÍO
function calcularCostoEnvio() {
  const inputCP = document.getElementById('input-cp');
  const mensajeEnvio = document.getElementById('mensaje-envio');
  const cp = inputCP ? inputCP.value.trim() : '';

  if (!cp) {
    alert('⚠️ Por favor ingresá tu Código Postal para calcular el envío.');
    costoEnvio = 0;
    actualizarTotales();
    return;
  }

  // Costo fijo de prueba
  costoEnvio = 4500;

  if (mensajeEnvio) {
    mensajeEnvio.style.color = '#25d366';
    mensajeEnvio.innerText = `Envío a CP ${cp}: $${costoEnvio.toLocaleString('es-AR')}`;
  }

  actualizarTotales();
  alert(`✅ Envío calculado con éxito: $${costoEnvio.toLocaleString('es-AR')}`);
}

window.calcularCostoEnvio = calcularCostoEnvio;

function actualizarTotales() {
  const subtotal = carrito.reduce((acc, item) => {
    const p = Number(item.precio || item.unit_price || 0);
    const c = Number(item.cantidad || item.quantity || 1);
    return acc + (p * c);
  }, 0);

  const totalConEnvio = subtotal + costoEnvio;

  const elemEnvio = document.getElementById('costo-envio-texto');
  if (elemEnvio) elemEnvio.innerText = `$${costoEnvio.toLocaleString('es-AR')}`;

  const elemTotalLista = document.getElementById('total-lista');
  if (elemTotalLista) elemTotalLista.innerText = `$${totalConEnvio.toLocaleString('es-AR')}`;

  const elemTotalTransf = document.getElementById('total-transferencia');
  if (elemTotalTransf) {
    const desc = Math.round(totalConEnvio * 0.9);
    elemTotalTransf.innerText = `$${desc.toLocaleString('es-AR')}`;
  }
}

// 4. VALIDACIÓN MANUAL STRICTA
function validarCampos() {
  const nombre = document.getElementById('cliente-nombre')?.value.trim();
  const telefono = document.getElementById('cliente-telefono')?.value.trim();
  const direccion = document.getElementById('cliente-direccion')?.value.trim();
  const localidad = document.getElementById('cliente-localidad')?.value.trim();

  if (!nombre || !telefono || !direccion || !localidad) {
    alert('❌ Todos los campos marcados con (*) son obligatorios.');
    return false;
  }

  if (costoEnvio === 0) {
    alert('❌ Debes presionar el botón "Calcular" en el Código Postal antes de continuar.');
    document.getElementById('input-cp')?.focus();
    return false;
  }

  return true;
}

// 5. PROCESAR PAGO MERCADO PAGO
async function procesarPagoMercadoPago(e) {
  if (e) e.preventDefault();

  if (!carrito || carrito.length === 0) {
    alert('⚠️ El carrito está vacío.');
    return;
  }

  if (!validarCampos()) return;

  const nombre = document.getElementById('cliente-nombre').value.trim();
  const telefono = document.getElementById('cliente-telefono').value.trim();
  const direccion = document.getElementById('cliente-direccion').value.trim();
  const localidad = document.getElementById('cliente-localidad').value.trim();
  const notas = document.getElementById('cliente-notas')?.value.trim() || '';

  const itemsAEnviar = carrito.map(prod => ({
    id: prod.id || 'prod',
    title: prod.nombre || prod.title,
    unit_price: Number(prod.precio || prod.unit_price),
    quantity: Number(prod.cantidad || prod.quantity || 1)
  }));

  itemsAEnviar.push({
    id: 'envio-domicilio',
    title: 'Costo de Envío a Domicilio',
    unit_price: Number(costoEnvio),
    quantity: 1
  });

  const btnPagar = document.getElementById('btn-pagar');
  if (btnPagar) {
    btnPagar.innerText = 'Cargando...';
    btnPagar.disabled = true;
  }

  try {
    const respuesta = await fetch('/api/crear-preferencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: itemsAEnviar,
        cliente: { nombre, telefono, direccion: `${direccion} (${localidad})`, notas }
      })
    });

    const data = await respuesta.json();

    if (data.init_point) {
      window.location.href = data.init_point;
    } else {
      alert('Error al generar el enlace de Mercado Pago.');
    }
  } catch (error) {
    console.error('Error enviando al servidor:', error);
    alert('Ocurrió un error de conexión.');
  } finally {
    if (btnPagar) {
      btnPagar.innerText = 'PAGAR';
      btnPagar.disabled = false;
    }
  }
}

// 6. ENVIAR A WHATSAPP
function enviarPedidoWhatsApp() {
  if (!carrito || carrito.length === 0) {
    alert('⚠️ El carrito está vacío.');
    return;
  }

  if (!validarCampos()) return;

  const nombre = document.getElementById('cliente-nombre').value.trim();
  const telefono = document.getElementById('cliente-telefono').value.trim();
  const direccion = document.getElementById('cliente-direccion').value.trim();
  const localidad = document.getElementById('cliente-localidad').value.trim();

  let mensaje = `Hola! Quiero realizar un pedido:\n\n`;
  carrito.forEach(p => {
    mensaje += `- ${p.cantidad || p.quantity || 1}x ${p.nombre || p.title}\n`;
  });

  mensaje += `\n📦 Envío: $${costoEnvio}`;
  mensaje += `\n👤 Cliente: ${nombre}`;
  mensaje += `\n📞 Tel: ${telefono}`;
  mensaje += `\n📍 Dirección: ${direccion}, ${localidad}`;

  window.open(`https://wa.me/5491112345678?text=${encodeURIComponent(mensaje)}`, '_blank');
}

// 7. VINCULACIÓN DE EVENTOS
document.addEventListener('DOMContentLoaded', () => {
  renderizarCarrito();

  const btnCalcular = document.getElementById('btn-calcular-cp');
  if (btnCalcular) {
    btnCalcular.onclick = (e) => {
      e.preventDefault();
      calcularCostoEnvio();
    };
  }

  const inputCP = document.getElementById('input-cp');
  if (inputCP) {
    inputCP.addEventListener('input', () => {
      costoEnvio = 0;
      const msj = document.getElementById('mensaje-envio');
      if (msj) msj.innerText = '';
      actualizarTotales();
    });
  }

  const btnVaciar = document.getElementById('btn-vaciar');
  if (btnVaciar) {
    btnVaciar.onclick = (e) => {
      e.preventDefault();
      carrito = [];
      costoEnvio = 0;
      guardarCarrito();
      renderizarCarrito();
    };
  }

  const form = document.getElementById('form-carrito');
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      procesarPagoMercadoPago(e);
    };
  }

  const btnFinalizar = document.getElementById('btn-finalizar');
  if (btnFinalizar) {
    btnFinalizar.onclick = (e) => {
      e.preventDefault();
      enviarPedidoWhatsApp();
    };
  }
});