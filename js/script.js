// 1. CARGAR Y GUARDAR CARRITO EN LOCALSTORAGE
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

// 2. RENDERIZAR CATÁLOGO DE PRODUCTOS (INDEX.HTML)
function renderizarCatalogo() {
    const contenedor = document.getElementById('contenedor-productos') || 
                       document.querySelector('.productos-grid') || 
                       document.querySelector('#productos');

    if (contenedor && typeof productos !== 'undefined' && Array.isArray(productos)) {
        contenedor.innerHTML = '';
        productos.forEach(prod => {
            const div = document.createElement('div');
            div.classList.add('producto-card');
            div.innerHTML = `
                <img src="${prod.imagen}" alt="${prod.nombre}">
                <h3>${prod.nombre}</h3>
                <p>$${prod.precio.toLocaleString('es-AR')}</p>
                <button onclick="agregarAlCarrito(${prod.id})">Agregar al Carrito</button>
            `;
            contenedor.appendChild(div);
        });
    }
}

// 3. AGREGAR PRODUCTOS AL CARRITO
function agregarAlCarrito(id) {
    let producto = null;

    if (typeof productos !== 'undefined' && Array.isArray(productos)) {
        producto = productos.find(p => p.id == id);
    }

    if (producto) {
        const existe = carrito.find(item => item.id == id);
        if (existe) {
            existe.quantity = (existe.quantity || 1) + 1;
            existe.cantidad = existe.quantity;
        } else {
            carrito.push({
                id: producto.id,
                title: producto.nombre,
                nombre: producto.nombre,
                unit_price: Number(producto.precio),
                precio: Number(producto.precio),
                imagen: producto.imagen,
                quantity: 1,
                cantidad: 1,
                currency_id: 'ARS'
            });
        }
        guardarCarrito();
        alert(`¡${producto.nombre} agregado al carrito!`);
    }
}
window.agregarAlCarrito = agregarAlCarrito;

// 4. OBTENER O CREAR EL CONTENEDOR DE ITEMS EN CARRITO.HTML
function obtenerContenedorCarrito() {
    let contenedor = document.getElementById('items-carrito') || 
                     document.getElementById('carrito-items') || 
                     document.querySelector('.carrito-items') || 
                     document.querySelector('.lista-carrito');

    if (!contenedor && window.location.pathname.includes('carrito')) {
        const bloqueDatos = document.querySelector('.datos-entrega') || 
                            document.querySelector('form') ||
                            document.querySelector('.col-izquierda') ||
                            document.querySelector('main');

        if (bloqueDatos && bloqueDatos.parentElement) {
            contenedor = document.createElement('div');
            contenedor.id = 'items-carrito';
            contenedor.style.cssText = 'margin-bottom:20px; width:100%;';
            bloqueDatos.parentElement.insertBefore(contenedor, bloqueDatos);
        }
    }
    return contenedor;
}

// 5. DIBUJAR ITEMS Y ACTUALIZAR TOTALES EN CARRITO.HTML
function renderizarCarrito() {
    const contenedor = obtenerContenedorCarrito();
    
    let total = 0;
    carrito.forEach(item => {
        const precio = Number(item.unit_price || item.precio || 0);
        const cant = Number(item.quantity || item.cantidad || 1);
        total += precio * cant;
    });

    actualizarTotales(total);

    if (!contenedor) return;

    if (carrito.length === 0) {
        contenedor.innerHTML = '<div style="background:#1e1e1e; padding:15px; border-radius:8px; text-align:center; color:#ccc; border:1px solid #333;">El carrito está vacío. Agregá productos desde el catálogo.</div>';
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
        div.style.cssText = 'background:#1e1e1e; border:1px solid #333; border-radius:8px; padding:15px; margin-bottom:15px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; color:#fff;';
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px;">
                ${img ? `<img src="${img}" alt="${titulo}" style="width:45px; height:45px; object-fit:cover; border-radius:6px;">` : ''}
                <div>
                    <h4 style="margin:0 0 4px 0; font-size:15px; color:#fff;">${titulo}</h4>
                    <span style="color:#aaa; font-size:13px;">$${precio.toLocaleString('es-AR')}</span>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <button onclick="cambiarCantidad(${index}, -1)" style="background:#333; color:#fff; border:none; padding:3px 8px; border-radius:4px; cursor:pointer;">-</button>
                <span style="font-weight:bold; padding:0 4px;">${cant}</span>
                <button onclick="cambiarCantidad(${index}, 1)" style="background:#333; color:#fff; border:none; padding:3px 8px; border-radius:4px; cursor:pointer;">+</button>
                <strong style="margin:0 8px; font-size:15px; color:#22c55e;">$${subtotal.toLocaleString('es-AR')}</strong>
                <button onclick="eliminarDelCarrito(${index})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:16px;">🗑️</button>
            </div>
        `;
        contenedor.appendChild(div);
    });
}

function cambiarCantidad(index, cambio) {
    if (carrito[index]) {
        let cant = (carrito[index].quantity || carrito[index].cantidad || 1) + cambio;
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

function actualizarTotales(total) {
    const elTotal = document.getElementById('total-lista') || document.querySelector('.total-lista');
    const elTransf = document.getElementById('total-transferencia') || document.querySelector('.total-transferencia');

    if (elTotal) elTotal.innerText = `$${total.toLocaleString('es-AR')}`;
    if (elTransf) elTransf.innerText = `$${Math.round(total * 0.9).toLocaleString('es-AR')}`;
}

window.cambiarCantidad = cambiarCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;

// 6. INICIALIZAR Y MANEJAR EVENTOS
document.addEventListener('DOMContentLoaded', () => {
    renderizarCatalogo();
    renderizarCarrito();

    // Botón Vaciar
    const btnVaciar = Array.from(document.querySelectorAll('button, a')).find(el => el.innerText.toLowerCase().includes('vaciar'));
    if (btnVaciar) {
        btnVaciar.addEventListener('click', (e) => {
            e.preventDefault();
            carrito = [];
            guardarCarrito();
            renderizarCarrito();
        });
    }

    // Botón PAGAR
    const btnPagar = document.getElementById('btn-pagar') || 
                     Array.from(document.querySelectorAll('button, a')).find(el => el.innerText.trim() === 'PAGAR');

    if (btnPagar) {
        btnPagar.addEventListener('click', async (e) => {
            e.preventDefault();

            if (!carrito || carrito.length === 0) {
                alert('El carrito está vacío. Agregá un producto desde el catálogo primero.');
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
                    alert('Hubo un problema al procesar el pago.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Ocurrió un error al conectar con el servidor.');
            } finally {
                btnPagar.innerText = 'PAGAR';
                btnPagar.disabled = false;
            }
        });
    }
});