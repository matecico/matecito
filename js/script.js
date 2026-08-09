// 1. MEMORIA Y ESTADO GLOBAL DEL CARRITO
let carrito = [];
try {
  carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  if (!Array.isArray(carrito)) carrito = [];
} catch (e) {
  carrito = [];
}

let costoEnvio = 0;

function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

// 2. MOSTRAR PRODUCTOS EN INDEX.HTML (Desde js/productos.js)
function cargarProductosInicio() {
  const contenedor = document.getElementById('contenedor-productos');
  if (!contenedor) return;

  const lista = (typeof productos !== 'undefined') ? productos : [];
  contenedor.innerHTML = '';

  lista.forEach(prod => {
    const div = document.createElement('div');
    div.className = 'tarjeta-producto';
    div.innerHTML = `
      <img src="${prod.imagen}" alt="${prod.nombre}">
      <h3>${prod.nombre}</h3>
      <p class="descripcion">${prod.descripcion || ''}</p>
      <p class="precio">$${prod.precio.toLocaleString('es-AR')}</p>
      <button type="button" onclick="agregarAlCarrito(${prod.id})">Agregar al Carrito</button>
    `;
    contenedor.appendChild(div);
  });
}

function agregarAlCarrito(idProducto) {
  const lista = (typeof productos !== 'undefined') ? productos : [];
  const prod = lista.find(p => Number(p.id) === Number(idProducto));
  if (!prod) return;

  const existe = carrito.find(item => Number(item.id) === Number(prod.id));
  if (existe) {
    existe.cantidad = (existe.cantidad || 1) + 1;
  } else {
    carrito.push({
      id: prod.id,
      nombre: prod.nombre,
      precio: prod.precio,
      imagen: prod.imagen,
      cantidad: 1
    });
  }

  guardarCarrito();
  alert(`✅ ${prod.nombre} agregado al carrito`);
}

// 3. RENDERIZAR CARRITO EN CARRITO.HTML
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
    const precio = Number(prod.precio || 0);
    const cant = Number(prod.cantidad || 1);
    const subtotal = precio * cant;

    const div = document.createElement('div');
    div.className = 'item-carrito';
    div.innerHTML = `
      <div class="info-producto-carrito">
        ${prod.imagen ? `<img src="${prod.imagen}" alt="${prod.nombre}" class="img-item-carrito">` : ''}
        <div class="detalles-item">
          <h4>${prod.nombre}</h4>
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
    let cant = (carrito[index].cantidad || 1) + cambio;
    if (cant <= 0) {
      carrito.splice(index, 1);
    } else {
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

// 4. CALCULAR CÓDIGO POSTAL POR ZONAS
function calcularCostoEnvio() {
  const inputCP = document.getElementById('input-cp');
  const mensajeEnvio = document.getElementById('mensaje-envio');
  const cpTexto = inputCP ? inputCP.value.trim() : '';
  const cp = parseInt(cpTexto, 10);

  if (!cpTexto || isNaN(cp)) {
    alert('⚠️ Por favor ingresá un Código Postal válido.');
    costoEnvio = 0;
    actualizarTotales();
    return;
  }

  // Tarifas según rango de CP en Argentina
  if (cp >= 1000 && cp <= 1499) {
    costoEnvio = 3500; // CABA
  } else if (cp >= 1500 && cp <= 1999) {
    costoEnvio = 4500; // GBA / Prov. Buenos Aires
  } else {
    costoEnvio = 7500; // Resto del país / Interior
  }

  if (mensajeEnvio) {
    mensajeEnvio.style.color = '#25d366';
    mensajeEnvio.innerText = `Envío a CP ${cp}: $${costoEnvio.toLocaleString('es-AR')}`;
  }

  actualizarTotales();
  alert(`✅ Envío calculado con éxito para CP ${cp}: $${costoEnvio.toLocaleString('es-AR')}`);
}

function actualizarTotales() {
  const subtotal = carrito.reduce((acc, item) => {
    const p = Number(item.precio || 0);
    const c = Number(item.cantidad || 1);
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

// 5. VALIDACIÓN DE FORMULARIO
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

// 6. PROCESAR PAGO CON MERCADO PAGO
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
    id: String(prod.id),
    title: prod.nombre,
    unit_price: Number(prod.precio),
    quantity: Number(prod.cantidad || 1)
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
      alert('Error al generar el enlace de Mercado Pago. Verifica la consola.');
      console.error('Respuesta de la API:', data);
    }
  } catch (error) {
    console.error('Error enviando al servidor:', error);
    alert('Ocurrió un error de conexión con el servidor.');
  } finally {
    if (btnPagar) {
      btnPagar.innerText = 'PAGAR';
      btnPagar.disabled = false;
    }
  }
}

// 7. PEDIDO POR WHATSAPP
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
    mensaje += `- ${p.cantidad || 1}x ${p.nombre}\n`;
  });

  mensaje += `\n📦 Envío: $${costoEnvio.toLocaleString('es-AR')}`;
  mensaje += `\n👤 Cliente: ${nombre}`;
  mensaje += `\n📞 Tel: ${telefono}`;
  mensaje += `\n📍 Dirección: ${direccion}, ${localidad}`;

  window.open(`https://wa.me/5491160149903?text=${encodeURIComponent(mensaje)}`, '_blank');
}

// 8. ENVIAR CONSULTA DE CONTACTO POR WHATSAPP
function enviarConsultaContacto(e) {
  if (e) e.preventDefault();

  const nombre = document.getElementById('contacto-nombre')?.value.trim();
  const telefono = document.getElementById('contacto-telefono')?.value.trim();
  const mensajeTexto = document.getElementById('contacto-mensaje')?.value.trim();

  if (!nombre || !telefono || !mensajeTexto) {
    alert('⚠️ Por favor completa todos los campos del formulario de contacto.');
    return;
  }

  let mensaje = `Hola! Mi nombre es *${nombre}* (Tel: ${telefono}).\n\n`;
  mensaje += `Tengo la siguiente consulta:\n${mensajeTexto}`;

  window.open(`https://wa.me/5491160149903?text=${encodeURIComponent(mensaje)}`, '_blank');
}

// FUNCIONES GLOBALES
window.agregarAlCarrito = agregarAlCarrito;
window.cambiarCantidad = cambiarCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;
window.calcularCostoEnvio = calcularCostoEnvio;
window.procesarPagoMercadoPago = procesarPagoMercadoPago;
window.enviarPedidoWhatsApp = enviarPedidoWhatsApp;
window.enviarConsultaContacto = enviarConsultaContacto;

// 9. VINCULACIÓN DE EVENTOS AL CARGAR LA PÁGINA
document.addEventListener('DOMContentLoaded', () => {
  cargarProductosInicio();
  renderizarCarrito();

  const btnCalcular = document.getElementById('btn-calcular-cp');
  if (btnCalcular) {
    btnCalcular.onclick = (e) => {
      e.preventDefault();
      calcularCostoEnvio();
    };
  }

  const form = document.getElementById('form-carrito');
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      procesarPagoMercadoPago(e);
    };
  }

  const btnPagar = document.getElementById('btn-pagar');
  if (btnPagar) {
    btnPagar.onclick = (e) => {
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

  const formContacto = document.getElementById('form-contacto');
  if (formContacto) {
    formContacto.onsubmit = (e) => {
      enviarConsultaContacto(e);
    };
  }
});