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

  // Mapeamos los campos del carrito a lo que espera Mercado Pago / Telegram en server.js
  const itemsFormateados = carrito.map(producto => ({
    title: producto.nombre,
    unit_price: Number(producto.precio),
    quantity: Number(producto.cantidad || 1)
  }));

  try {
    // 1. Ruta corregida a '/api/crear-preferencia'
    const respuesta = await fetch('/api/crear-preferencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        items: itemsFormateados,
        cliente: {
          nombre: 'Cliente Web',
          direccion: 'Dirección a coordinar',
          telefono: 'Sin especificar'
        }
      })
    });

    if (respuesta.ok) {
      const data = await respuesta.json();
      if (data.init_point) {
        // Redirige a Mercado Pago
        window.location.href = data.init_point;
        return;
      }
    }
    
    alert('No se pudo generar el checkout. Revisa la consola.');
  } catch (error) {
    console.error('Error al pagar:', error);
    alert('Error de conexión con el servidor.');
  }
}// 6. INICIALIZAR Y MANEJAR EVENTOS
document.addEventListener('DOMContentLoaded', () => {
    renderizarCatalogo();
    renderizarCarrito();

    // Botón Vaciar
    const btnVaciar = Array.from(document.querySelectorAll('button, a')).find(el => 
        el.innerText.toLowerCase().includes('vaciar')
    );
    if (btnVaciar) {
        btnVaciar.addEventListener('click', (e) => {
            e.preventDefault();
            carrito = [];
            guardarCarrito();
            renderizarCarrito();
        });
    }

    // Botón PAGAR (Busca por ID 'btn-pagar' o cualquier botón/enlace que diga 'pagar')
    const btnPagar = document.getElementById('btn-pagar') || 
                     Array.from(document.querySelectorAll('button, a')).find(el => 
                         el.innerText.toLowerCase().includes('pagar')
                     );

    if (btnPagar) {
        btnPagar.addEventListener('click', async (e) => {
            e.preventDefault();

            if (!carrito || carrito.length === 0) {
                alert('El carrito está vacío. Agregá un producto primero.');
                return;
            }

            const inputs = document.querySelectorAll('input, textarea');
            const cliente = {
                nombre: inputs[0]?.value || 'Cliente Test',
                telefono: inputs[1]?.value || '1112345678',
                direccion: inputs[2]?.value || 'Direccion Test'
            };

            btnPagar.innerText = 'Cargando...';
            btnPagar.disabled = true;

            try {
                const response = await fetch('/api/crear-preferencia', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: carrito, cliente: cliente })
                });

                const data = await response.json();

                if (data.init_point) {
                    window.location.href = data.init_point;
                } else {
                    alert('Hubo un problema al generar la preferencia de pago.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Ocurrió un error al conectar con el servidor.');
            } finally {
                btnPagar.innerText = 'PAGAR';
                btnPagar.disabled = false;
            }
        });
    } else {
        console.warn('No se encontró el botón de pagar en el DOM.');
    }
});