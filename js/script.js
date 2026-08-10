document.addEventListener('DOMContentLoaded', () => {
    if (typeof productos !== 'undefined') {
        renderizarProductos(productos);

        const inputBuscar = document.getElementById('input-buscar');
        if (inputBuscar) {
            inputBuscar.addEventListener('input', (e) => {
                const texto = e.target.value.toLowerCase().trim();
                const filtrados = productos.filter(p => 
                    p.nombre.toLowerCase().includes(texto) || p.descripcion.toLowerCase().includes(texto)
                );
                renderizarProductos(filtrados);
            });
        }
    } else {
        console.error("El array de productos no está definido. Asegúrate de incluir productos.js antes de script.js.");
    }
});

function renderizarProductos(lista) {
    const grid = document.getElementById('grid-productos');
    if (!grid) return;

    if (lista.length === 0) {
        grid.innerHTML = '<p style="color: #aaa; grid-column: 1/-1; text-align: center; padding: 40px; font-size: 1.1rem;">No se encontraron productos que coincidan con tu búsqueda.</p>';
        return;
    }

    grid.innerHTML = lista.map(p => `
        <div class="card-producto" onclick="verDetalle(${p.id})">
            <img src="${p.imagen}" alt="${p.nombre}" class="card-img" onerror="this.src='img/placeholder.jpg'">
            <div class="card-body">
                <h3 class="card-title">${p.nombre}</h3>
                <p class="card-desc">${p.descripcion}</p>
                <span class="card-price">$${p.precio.toLocaleString('es-AR')}</span>
                <button type="button" class="btn-agregar" onclick="event.stopPropagation(); agregarAlCarrito(${p.id})">Agregar al Carrito</button>
            </div>
        </div>
    `).join('');
}

function verDetalle(id) {
    window.location.href = `producto.html?id=${id}`;
}

function agregarAlCarrito(id) {
    const productoSeleccionado = productos.find(p => p.id === id);
    if (!productoSeleccionado) return;

    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const index = carrito.findIndex(item => item.id === id);

    if (index !== -1) {
        carrito[index].cantidad += 1;
    } else {
        carrito.push({ ...productoSeleccionado, cantidad: 1 });
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));
    mostrarNotificacion(`¡${productoSeleccionado.nombre} agregado al carrito!`);
}

function mostrarNotificacion(mensaje) {
    let notif = document.getElementById('notificacion-flotante');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'notificacion-flotante';
        notif.style.cssText = "position: fixed; bottom: 20px; right: 20px; background-color: #25d366; color: #000; padding: 12px 20px; border-radius: 6px; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 1000; transition: opacity 0.3s ease;";
        document.body.appendChild(notif);
    }
    notif.innerText = mensaje;
    notif.style.opacity = '1';
    setTimeout(() => {
        notif.style.opacity = '0';
    }, 2500);
}