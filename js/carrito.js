function cargarCarrito() {
  const listaContenedor = document.getElementById('lista-carrito');
  const totalElemento = document.getElementById('total-precio');
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

  if (!listaContenedor) return;

  if (carrito.length === 0) {
    listaContenedor.innerHTML = '<p class="carrito-vacio">El carrito está vacío.</p>';
    if (totalElemento) totalElemento.innerText = '$0';
    return;
  }

  listaContenedor.innerHTML = '';
  let total = 0;

  carrito.forEach((producto, index) => {
    const cantidad = producto.cantidad || 1;
    const subtotal = producto.precio * cantidad;
    total += subtotal;

    listaContenedor.innerHTML += `
      <div class="item-carrito">
        <img src="${producto.imagen}" alt="${producto.nombre}" class="img-thumb">
        <div class="info-item">
          <h3>${producto.nombre}</h3>
          <p class="precio-unitario">$${producto.precio.toLocaleString('es-AR')}</p>
        </div>
        <div class="controles-cantidad">
          <button onclick="cambiarCantidad(${index}, -1)">-</button>
          <span>${cantidad}</span>
          <button onclick="cambiarCantidad(${index}, 1)">+</button>
        </div>
        <div class="subtotal-item">
          $${subtotal.toLocaleString('es-AR')}
        </div>
        <button class="btn-eliminar" onclick="eliminarProducto(${index})">✕</button>
      </div>
    `;
  });

  if (totalElemento) {
    totalElemento.innerText = `$${total.toLocaleString('es-AR')}`;
  }
}

function cambiarCantidad(index, cambio) {
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  if (!carrito[index]) return;

  carrito[index].cantidad = (carrito[index].cantidad || 1) + cambio;

  if (carrito[index].cantidad <= 0) {
    carrito.splice(index, 1);
  }

  localStorage.setItem('carrito', JSON.stringify(carrito));
  cargarCarrito();
}

function eliminarProducto(index) {
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  carrito.splice(index, 1);
  localStorage.setItem('carrito', JSON.stringify(carrito));
  cargarCarrito();
}

async function pagar() {
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  if (carrito.length === 0) {
    alert('El carrito está vacío');
    return;
  }

  try {
    const respuesta = await fetch('/crear-preferencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: carrito })
    });

    if (respuesta.ok) {
      const data = await respuesta.json();
      if (data.init_point) {
        window.location.href = data.init_point;
        return;
      }
    }
    
    // Si no responde el servidor backend local, avisa limpiamente
    alert('Para procesar el pago real debe estar ejecutándose el servidor (Node.js/server.js).');
  } catch (error) {
    alert('El servidor local no está conectado. Ejecutá "node server.js" en la terminal.');
  }
}

document.addEventListener('DOMContentLoaded', cargarCarrito);