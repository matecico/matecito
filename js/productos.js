document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    let id = parseInt(params.get('id'));

    // Si no hay ID en la URL, por defecto mostramos el producto 1 para que nunca quede vacío
    if (!id || isNaN(id)) {
        id = 1;
    }

    const productos = [
      {
        id: 1,
        nombre: "Set Matero Completo Premium",
        precio: 55275,
        imagen: "img/comboset.png",
        descripcion: "Mate Imperial Deluxe con interior de acero inoxidable, canasta de cuerina negra, termo media manija gris, set de latas negras y bombilla pico de loro."
      },
      {
        id: 2,
        nombre: "Mate Imperial Interior Calabaza",
        precio: 32000,
        imagen: "img/matecalabaza.png",
        descripcion: "Virola de alpaca, interior de calabaza, cuero negro clásico y base reforzada."
      },
      {
        id: 3,
        nombre: "Mate Imperial Negro",
        precio: 25000,
        imagen: "img/mateimperial.png",
        descripcion: "Virola de acero, interior de acero inoxidable, cuero negro y base reforzada."
      },
      {
        id: 4,
        nombre: "Termo de Acero Inoxidable 1L",
        precio: 20000,
        imagen: "img/termo.png",
        descripcion: "Termo de 1L con media manija, pico cebador y color gris."
      },
      {
        id: 5,
        nombre: "Peluche MateCico",
        precio: 20000,
        imagen: "img/peluche.png",
        descripcion: "Peluche de mate de 15 cm, especial para regalos."
      },
      {
        id: 6,
        nombre: "Canasta Matera",
        precio: 10000,
        imagen: "img/canasta.png",
        descripcion: "Canasta matera con división interna, cuero grueso color negro."
      },
      {
        id: 7,
        nombre: "Set Yerbera y Azucarera",
        precio: 6500,
        imagen: "img/yerbera.png",
        descripcion: "Juego de latas con pico vertedor anti-derrame."
      },
      {
        id: 8,
        nombre: "Bombilla Pico de Loro",
        precio: 4500,
        imagen: "img/bombilla.png",
        descripcion: "Bombilla pico de loro de acero inoxidable."
      }
    ];

    const producto = productos.find(p => p.id === id) || productos[0];
    const contenedor = document.getElementById('detalle-producto');

    if (!contenedor) {
        console.error("No se encontró el elemento #detalle-producto en el HTML.");
        return;
    }

    const precioTarjetaBase = Math.round(producto.precio * 1.08);

    contenedor.innerHTML = `
        <div style="display: flex; flex-wrap: wrap; gap: 40px; align-items: flex-start; justify-content: center;">
            <img src="${producto.imagen}" alt="${producto.nombre}" style="width: 100%; max-width: 450px; height: 350px; object-fit: cover; border-radius: 8px; background-color: #2a2a2a;" onerror="this.src='img/placeholder.jpg'">
            
            <div style="flex: 1; min-width: 280px; display: flex; flex-direction: column; gap: 15px;">
                <h1 style="font-size: 2rem; color: #ffffff;">${producto.nombre}</h1>
                <p style="color: #aaaaaa; font-size: 0.95rem; line-height: 1.4;">${producto.descripcion}</p>
                
                <div style="display: flex; flex-direction: column; gap: 6px; background: #1e1e1e; padding: 15px; border-radius: 8px; border: 1px solid #2a2a2a;">
                    <div style="font-size: 1.3rem; font-weight: bold; color: #25d366;">
                        $<span id="precio-trans-dinamico">${producto.precio.toLocaleString('es-AR')}</span> 
                        <span style="font-size: 0.75rem; color: #aaa; font-weight: normal;">(Transf. vía WhatsApp)</span>
                    </div>
                    <div style="font-size: 1.1rem; font-weight: bold; color: #ffd700;">
                        $<span id="precio-tarj-dinamico">${precioTarjetaBase.toLocaleString('es-AR')}</span> 
                        <span style="font-size: 0.75rem; color: #aaa; font-weight: normal;">(Débito / Crédito)</span>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 15px; margin-top: 5px;">
                    <span style="font-weight: bold; color: #ccc;">Cantidad:</span>
                    <div style="display: flex; align-items: center; background: #1e1e1e; border: 1px solid #333; border-radius: 5px; overflow: hidden;">
                        <button id="btn-menos" style="background: none; border: none; color: white; padding: 8px 15px; cursor: pointer; font-size: 1rem;">-</button>
                        <span id="cantidad-input" style="padding: 0 10px; font-weight: bold; color: white;">1</span>
                        <button id="btn-mas" style="background: none; border: none; color: white; padding: 8px 15px; cursor: pointer; font-size: 1rem;">+</button>
                    </div>
                </div>

                <button id="btn-agregar-detalle" style="background-color: #25d366; color: #121212; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 1rem; margin-top: 10px;">Agregar al Carrito</button>
                <a href="index.html" style="color: #25d366; text-align: center; font-size: 0.9rem; margin-top: 5px; text-decoration: underline;">Volver al Catálogo</a>
            </div>
        </div>

        <div style="margin-top: 60px;">
            <h2 style="font-size: 1.5rem; margin-bottom: 20px; border-left: 4px solid #25d366; padding-left: 15px; color: #fff;">Productos Recomendados</h2>
            <div id="grid-recomendados" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px;"></div>
        </div>
    `;

    let cantidadActual = 1;
    const spanCantidad = document.getElementById('cantidad-input');
    const spanTrans = document.getElementById('precio-trans-dinamico');
    const spanTarj = document.getElementById('precio-tarj-dinamico');

    document.getElementById('btn-menos').addEventListener('click', () => {
        if (cantidadActual > 1) {
            cantidadActual--;
            actualizarVistaCantidad();
        }
    });

    document.getElementById('btn-mas').addEventListener('click', () => {
        cantidadActual++;
        actualizarVistaCantidad();
    });

    function actualizarVistaCantidad() {
        spanCantidad.innerText = cantidadActual;
        spanTrans.innerText = (producto.precio * cantidadActual).toLocaleString('es-AR');
        spanTarj.innerText = (precioTarjetaBase * cantidadActual).toLocaleString('es-AR');
    }

    document.getElementById('btn-agregar-detalle').addEventListener('click', () => {
        let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
        const index = carrito.findIndex(x => x.id === producto.id);
        
        if (index !== -1) {
            carrito[index].cantidad += cantidadActual;
        } else {
            carrito.push({ ...producto, cantidad: cantidadActual });
        }
        
        localStorage.setItem('carrito', JSON.stringify(carrito));
        alert(`¡Agregado ${cantidadActual} unidad(es) al carrito!`);
    });

    const recomendados = productos.filter(p => p.id !== producto.id).slice(0, 4);
    const gridRec = document.getElementById('grid-recomendados');
    if (gridRec) {
        gridRec.innerHTML = recomendados.map(p => {
            const precioTarjetaRec = Math.round(p.precio * 1.08);
            return `
                <div onclick="window.location.href='producto.html?id=${p.id}'" style="background-color: #1e1e1e; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between;">
                    <img src="${p.imagen}" alt="${p.nombre}" style="width: 100%; height: 140px; object-fit: cover; background: #2a2a2a;" onerror="this.src='img/placeholder.jpg'">
                    <div style="padding: 12px; display: flex; flex-direction: column; gap: 6px;">
                        <h4 style="font-size: 0.95rem; color: #fff; font-weight: bold;">${p.nombre}</h4>
                        <div style="display: flex; flex-direction: column; gap: 2px;">
                            <span style="font-size: 0.95rem; font-weight: bold; color: #25d366;">$${p.precio.toLocaleString('es-AR')} <span style="font-size: 0.65rem; color: #aaa;">(Transf.)</span></span>
                            <span style="font-size: 0.85rem; font-weight: bold; color: #ffd700;">$${precioTarjetaRec.toLocaleString('es-AR')} <span style="font-size: 0.65rem; color: #aaa;">(Tarjeta)</span></span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
});