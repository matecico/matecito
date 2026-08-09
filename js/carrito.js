// 1. ESTADO GLOBAL
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let costoEnvio = 0;

function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

// 2. MOSTRAR PRODUCTOS EN EL CARRITO
function cargarCarrito() {
  const contenedor = document.getElementById('lista-carrito') || document.getElementById('contenedor-carrito');
  const elemTotal = document.getElementById('total-precio') || document.getElementById('total-lista');

  if (!contenedor) return;

  if (carrito.length === 0) {
    contenedor.innerHTML = '<p class="carrito-vacio" style="text-align:center; padding: 20px; color:#ccc;">El carrito está vacío.</p>';
    if (elemTotal) elemTotal.innerText = '$0';
    actualizarTotalesPantalla(0);
    return;
  }

  contenedor.innerHTML = '';
  let subtotalProductos = 0;

  carrito.forEach((producto, index) => {
    const cant = Number(producto.cantidad || producto.quantity || 1);
    const precio = Number(producto.precio || producto.unit_price || 0);
    const subtotal = precio * cant;
    subtotalProductos += subtotal;

    const titulo = producto.nombre || producto.title || 'Producto';
    const img = producto.imagen || producto.img || '';

    contenedor.innerHTML += `
      <div class="item-carrito" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom:10px;">
        <div style="display:flex; align-items:center; gap:10px;">
          ${img ? `<img src="${img}" alt="${titulo}" class="img-thumb" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">` : ''}
          <div>
            <h3 style="margin:0; font-size:1rem; color:#fff;">${titulo}</h3>
            <p style="margin:0; color:#aaa; font-size:0.9rem;">$${precio.toLocaleString('es-AR')}</p>
          </div>
        </div>
        <div class="controles-cantidad" style="display:flex; align-items:center; gap:8px;">
          <button type="button" onclick="cambiarCantidad(${index}, -1)">-</button>
          <span>${cant}</span>
          <button type="button" onclick="cambiarCantidad(${index}, 1)">+</button>
        </div>
        <div class="subtotal-item" style="color:#fff;">
          $${subtotal.toLocaleString('es-AR')}
        </div>
        <button type="button" class="btn-eliminar" onclick="eliminarProducto(${index})">✕</button>
      </div>
    `;
  });

  actualizarTotalesPantalla(subtotalProductos);
}

function cambiarCantidad(index, cambio) {
  if (!carrito[index]) return;
  let cant = (carrito[index].cantidad || carrito[index].quantity || 1) + cambio;

  if (cant <= 0) {
    carrito.splice(index, 1);
  } else {
    carrito[index].cantidad = cant;
    carrito[index].quantity = cant;
  }
  guardarCarrito();
  cargarCarrito();
}

function eliminarProducto(index) {
  carrito.splice(index, 1);
  guardarCarrito();
  cargarCarrito();
}

window.cambiarCantidad = cambiarCantidad;
window.eliminarProducto = eliminarProducto;

// 3. CÁLCULO DE ENVÍO
function calcularCostoEnvio() {
  const inputCP = document.querySelector('input[placeholder*="Postal" i], input[placeholder*="CP" i], #input-cp, #cp');
  const mensajeEnvio = document.getElementById('mensaje-envio');
  const cp = inputCP ? inputCP.value.trim() : '';

  if (!cp) {
    alert('⚠️ Por favor ingresá un Código Postal en la casilla correspondinte.');
    if (mensajeEnvio) {
      mensajeEnvio.style.color = '#ff4d4d';
      mensajeEnvio.innerText = 'Ingresá un código postal válido';
    }
    costoEnvio = 0;
    cargarCarrito();
    return;
  }

  costoEnvio = 4500;

  if (mensajeEnvio) {
    mensajeEnvio.style.color = '#25d366';
    mensajeEnvio.innerText = `Envío a CP ${cp}: $${costoEnvio.toLocaleString('es-AR')}`;
  }

  cargarCarrito();
}

function actualizarTotalesPantalla(subtotal) {
  const totalConEnvio = subtotal + costoEnvio;

  const elemCostoEnvio = document.getElementById('costo-envio-texto');
  if (elemCostoEnvio) elemCostoEnvio.innerText = `$${costoEnvio.toLocaleString('es-AR')}`;

  const elemTotal = document.getElementById('total-precio') || document.getElementById('total-lista');
  if (elemTotal) elemTotal.innerText = `$${totalConEnvio.toLocaleString('es-AR')}`;

  const elemTotalTransf = document.getElementById('total-transferencia');
  if (elemTotalTransf) {
    const desc = Math.round(totalConEnvio * 0.9);
    elemTotalTransf.innerText = `$${desc.toLocaleString('es-AR')}`;
  }
}

// 4. PROCESAR PAGO CON VALIDACIONES ESTRICTAS
async function procesarPagoStrict(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  if (!carrito || carrito.length === 0) {
    alert('⚠️ El carrito está vacío. Agregá un producto antes de pagar.');
    return false;
  }

  // Buscar inputs específicos por ID o Placeholder
  const inputNombre = document.querySelector('#cliente-nombre, input[name="nombre"], input[placeholder*="Nombre" i]');
  const inputTelefono = document.querySelector('#cliente-telefono, input[name="telefono"], input[placeholder*="Tel" i], input[placeholder*="WhatsApp" i]');
  const inputDireccion = document.querySelector('#cliente-direccion, input[name="direccion"], input[placeholder*="Direcci" i], input[placeholder*="Calle" i]');
  const inputCP = document.querySelector('#input-cp, #cp, input[placeholder*="Postal" i], input[placeholder*="CP" i]');

  const nombre = inputNombre ? inputNombre.value.trim() : '';
  const telefono = inputTelefono ? inputTelefono.value.trim() : '';
  const direccion = inputDireccion ? inputDireccion.value.trim() : '';
  const cp = inputCP ? inputCP.value.trim() : '';

  // VALIDACIONES OBLIGATORIAS
  if (!nombre) {
    alert('❌ Faltan datos: Por favor, ingresá tu Nombre y Apellido.');
    if (inputNombre) inputNombre.focus();
    return false;
  }

  if (!telefono) {
    alert('❌ Faltan datos: Por favor, ingresá tu Teléfono de contacto.');
    if (inputTelefono) inputTelefono.focus();
    return false;
  }

  if (!direccion) {
    alert('❌ Faltan datos: Por favor, ingresá tu Dirección de entrega.');
    if (inputDireccion) inputDireccion.focus();
    return false;
  }

  if (!cp || costoEnvio === 0) {
    alert('❌ Envío no calculado: Por favor ingresá tu Código Postal y hacé clic en "Calcular" antes de pagar.');
    if (inputCP) inputCP.focus();
    return false;
  }

  // ARMADO DE ITEMS CON ENVÍO INCLUIDO
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

  const cliente = {
    nombre: nombre,
    telefono: telefono,
    direccion: direccion
  };

  const btnPagar = document.getElementById('btn-pagar') || 
                   Array.from(document.querySelectorAll('button')).find(el => 
                     el.innerText.toLowerCase().includes('pagar')
                   );

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
        cliente: cliente
      })
    });

    const data = await respuesta.json();

    if (data.init_point) {
      window.location.href = data.init_point;
    } else {
      alert('Error al generar la preferencia de pago.');
    }
  } catch (error) {
    console.error('Error al pagar:', error);
    alert('Ocurrió un error al conectar con el servidor.');
  } finally {
    if (btnPagar) {
      btnPagar.innerText = 'PAGAR';
      btnPagar.disabled = false;
    }
  }
}

window.pagar = procesarPagoStrict;

// 5. EVENTOS E INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
  cargarCarrito();

  // Interceptar todos los formularios HTML para evitar que envíen automáticamente
  const formularios = document.querySelectorAll('form');
  formularios.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      procesarPagoStrict(e);
    });
  });

  // Botón Calcular Envío
  const btnCalcular = document.getElementById('btn-calcular-cp') || 
                      Array.from(document.querySelectorAll('button')).find(el => 
                        el.innerText.toLowerCase().includes('calcular')
                      );
  if (btnCalcular) {
    btnCalcular.addEventListener('click', (e) => {
      e.preventDefault();
      calcularCostoEnvio();
    });
  }

  // Reiniciar costo de envío si modifican el input CP
  const inputCP = document.querySelector('#input-cp, #cp, input[placeholder*="Postal" i], input[placeholder*="CP" i]');
  if (inputCP) {
    inputCP.addEventListener('input', () => {
      costoEnvio = 0;
      const msj = document.getElementById('mensaje-envio');
      if (msj) msj.innerText = '';
      cargarCarrito();
    });
  }

  // Botón Vaciar
  const btnVaciar = document.getElementById('btn-vaciar') || 
                    Array.from(document.querySelectorAll('button, a')).find(el => 
                      el.innerText.toLowerCase().includes('vaciar')
                    );
  if (btnVaciar) {
    btnVaciar.addEventListener('click', (e) => {
      e.preventDefault();
      carrito = [];
      costoEnvio = 0;
      guardarCarrito();
      cargarCarrito();
    });
  }

  // Botón PAGAR
  const btnPagar = document.getElementById('btn-pagar') || 
                   Array.from(document.querySelectorAll('button, a')).find(el => 
                     el.innerText.toLowerCase().includes('pagar')
                   );

  if (btnPagar) {
    btnPagar.onclick = (e) => procesarPagoStrict(e);
  }
});