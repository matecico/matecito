// 1. ESTADO GLOBAL
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let costoEnvio = 0;
let porcentajeDescuento = 0; // Variable para el cupón

function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

// FUNCIÓN AUXILIAR PARA MENSAJES VISUALES (Reemplaza los alert)
function mostrarMensaje(texto, tipo = 'error') {
  let contenedor = document.getElementById('mensaje-global-alerta');
  if (!contenedor) {
    // Si no existe el contenedor en el HTML, lo creamos dinámicamente arriba del botón pagar
    contenedor = document.createElement('div');
    contenedor.id = 'mensaje-global-alerta';
    contenedor.style.padding = '10px';
    contenedor.style.margin = '10px 0';
    contenedor.style.borderRadius = '5px';
    contenedor.style.fontSize = '0.9rem';
    contenedor.style.fontWeight = 'bold';
    contenedor.style.textAlign = 'center';
    
    const btnPagar = document.getElementById('btn-pagar') || document.querySelector('button');
    if (btnPagar && btnPagar.parentNode) {
      btnPagar.parentNode.insertBefore(contenedor, btnPagar);
    } else {
      document.body.appendChild(contenedor);
    }
  }

  contenedor.style.color = '#ffffff';
  contenedor.style.backgroundColor = tipo === 'exito' ? 'rgba(37, 211, 102, 0.2)' : 'rgba(255, 77, 77, 0.2)';
  contenedor.style.border = `1px solid ${tipo === 'exito' ? '#25d366' : '#ff4d4d'}`;
  contenedor.innerText = texto;

  // Hacer scroll suave hacia el mensaje para que el usuario lo vea
  contenedor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function limpiarMensaje() {
  const contenedor = document.getElementById('mensaje-global-alerta');
  if (contenedor) {
    contenedor.innerText = '';
    contenedor.style.backgroundColor = 'transparent';
    contenedor.style.border = 'none';
  }
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

  let subtotalConDescuento = subtotalProductos * (1 - porcentajeDescuento);
  actualizarTotalesPantalla(subtotalConDescuento);
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

// LÓGICA DE CUPÓN
function aplicarCupon() {
  limpiarMensaje();
  const inputCupon = document.getElementById('input-cupon');
  const mensajeCupon = document.getElementById('mensaje-cupon');
  const codigo = inputCupon ? inputCupon.value.trim().toUpperCase() : '';

  if (codigo === "MESSETEAMO") {
    porcentajeDescuento = 1; 
    costoEnvio = 0;
    if (mensajeCupon) {
      mensajeCupon.style.color = '#25d366';
      mensajeCupon.innerText = '🎁 ¡Cupón aplicado! Compra totalmente GRATIS.';
    }
  } else {
    porcentajeDescuento = 0;
    if (mensajeCupon) {
      mensajeCupon.style.color = '#ff4d4d';
      mensajeCupon.innerText = '❌ Cupón no válido.';
    }
  }
  cargarCarrito();
}
window.aplicarCupon = aplicarCupon;

// 3. CÁLCULO DE ENVÍO
function calcularCostoEnvio() {
  limpiarMensaje();
  const inputCP = document.querySelector('input[placeholder*="Postal" i], input[placeholder*="CP" i], #input-cp, #cp');
  const mensajeEnvio = document.getElementById('mensaje-envio');
  const cpTexto = inputCP ? inputCP.value.trim() : '';

  if (!cpTexto && porcentajeDescuento !== 1) {
    mostrarMensaje('⚠️ Por favor ingresá un Código Postal en la casilla correspondiente.', 'error');
    if (mensajeEnvio) {
      mensajeEnvio.style.color = '#ff4d4d';
      mensajeEnvio.innerText = 'Ingresá un código postal válido';
    }
    costoEnvio = 0;
    cargarCarrito();
    return;
  }

  if (porcentajeDescuento === 1 || cpTexto === "150722") {
    costoEnvio = 0;
  } else {
    costoEnvio = 0;
  }

  if (mensajeEnvio) {
    mensajeEnvio.style.color = '#25d366';
    if (costoEnvio === 0) {
      mensajeEnvio.innerText = `🎉 ¡Envío GRATIS aplicado!`;
    } else {
      mensajeEnvio.innerText = `Envío a CP ${cpTexto}: $${costoEnvio.toLocaleString('es-AR')}`;
    }
  }

  cargarCarrito();
}

function actualizarTotalesPantalla(subtotalConDescuento) {
  const totalConEnvio = subtotalConDescuento + costoEnvio;

  const elemCostoEnvio = document.getElementById('costo-envio-texto');
  if (elemCostoEnvio) elemCostoEnvio.innerText = (costoEnvio === 0) ? 'GRATIS' : `$${costoEnvio.toLocaleString('es-AR')}`;

  const elemTotal = document.getElementById('total-precio') || document.getElementById('total-lista');
  if (elemTotal) elemTotal.innerText = `$${totalConEnvio.toLocaleString('es-AR')}`;

  const elemTotalTransf = document.getElementById('total-transferencia');
  if (elemTotalTransf) {
    const desc = Math.round(totalConEnvio * 0.9);
    elemTotalTransf.innerText = `$${desc.toLocaleString('es-AR')}`;
  }
}

// 4. PROCESAR PAGO CON VALIDACIONES ESTRICTAS (CORREGIDO CON /api/)
async function procesarPagoStrict(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  limpiarMensaje();

  if (!carrito || carrito.length === 0) {
    mostrarMensaje('⚠️ El carrito está vacío. Agregá un producto antes de pagar.', 'error');
    return false;
  }

  if (porcentajeDescuento === 1) {
    mostrarMensaje('🎉 ¡Tu pedido ha sido procesado exitosamente como regalo!', 'exito');
    carrito = [];
    guardarCarrito();
    cargarCarrito();
    return false;
  }

  const inputNombre = document.querySelector('#cliente-nombre, input[name="nombre"], input[placeholder*="Nombre" i]');
  const inputTelefono = document.querySelector('#cliente-telefono, input[name="telefono"], input[placeholder*="Tel" i], input[placeholder*="WhatsApp" i]');
  const inputDireccion = document.querySelector('#cliente-direccion, input[name="direccion"], input[placeholder*="Direcci" i], input[placeholder*="Calle" i]');
  const inputCP = document.querySelector('#input-cp, #cp, input[placeholder*="Postal" i], input[placeholder*="CP" i]');

  const nombre = inputNombre ? inputNombre.value.trim() : '';
  const telefono = inputTelefono ? inputTelefono.value.trim() : '';
  const direccion = inputDireccion ? inputDireccion.value.trim() : '';
  const cp = inputCP ? inputCP.value.trim() : '';

  if (!nombre) {
    mostrarMensaje('❌ Faltan datos: Por favor, ingresá tu Nombre y Apellido.', 'error');
    if (inputNombre) inputNombre.focus();
    return false;
  }

  if (!telefono) {
    mostrarMensaje('❌ Faltan datos: Por favor, ingresá tu Teléfono de contacto.', 'error');
    if (inputTelefono) inputTelefono.focus();
    return false;
  }

  if (!direccion) {
    mostrarMensaje('❌ Faltan datos: Por favor, ingresá tu Dirección de entrega.', 'error');
    if (inputDireccion) inputDireccion.focus();
    return false;
  }

  if (!cp || (costoEnvio === 0 && cp !== "150722")) {
    mostrarMensaje('❌ Envío no calculado: Por favor ingresá tu Código Postal y hacé clic en "Calcular" antes de pagar.', 'error');
    if (inputCP) inputCP.focus();
    return false;
  }

  const itemsAEnviar = carrito.map(prod => ({
    id: prod.id || 'prod',
    title: prod.nombre || prod.title,
    unit_price: Number(prod.precio || prod.unit_price),
    quantity: Number(prod.cantidad || prod.quantity || 1)
  }));

  if (costoEnvio > 0) {
    itemsAEnviar.push({
      id: 'envio-domicilio',
      title: 'Costo de Envío a Domicilio',
      unit_price: Number(costoEnvio),
      quantity: 1
    });
  }

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
    // AQUÍ ESTABA EL ERROR: Se agregó el /api/ al endpoint
    const respuesta = await fetch('https://matecito.onrender.com/api/crear-preferencia', {
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
      mostrarMensaje('Error al generar la preferencia de pago.', 'error');
    }
  } catch (error) {
    console.error('Error al pagar:', error);
    mostrarMensaje('Ocurrió un error al conectar con el servidor.', 'error');
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

  const btnCupon = document.getElementById('btn-aplicar-cupon');
  if (btnCupon) {
    btnCupon.addEventListener('click', (e) => {
      e.preventDefault();
      aplicarCupon();
    });
  }

  const formularios = document.querySelectorAll('form');
  formularios.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      procesarPagoStrict(e);
    });
  });

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

  const inputCP = document.querySelector('#input-cp, #cp, input[placeholder*="Postal" i], input[placeholder*="CP" i]');
  if (inputCP) {
    inputCP.addEventListener('input', () => {
      costoEnvio = 0;
      const msj = document.getElementById('mensaje-envio');
      if (msj) msj.innerText = '';
      cargarCarrito();
    });
  }

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

  const btnPagar = document.getElementById('btn-pagar') || 
                    Array.from(document.querySelectorAll('button, a')).find(el => 
                      el.innerText.toLowerCase().includes('pagar')
                    );

  if (btnPagar) {
    btnPagar.onclick = (e) => procesarPagoStrict(e);
  }
});