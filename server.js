import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 1. DATOS DE MERCADO PAGO Y TELEGRAM
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const TELEGRAM_BOT_TOKEN = '8966386944:AAH8OTZoT7V-ZGS9WHNtW99NjtCBj0iiZYE';
const TELEGRAM_CHAT_ID = '7691781211';

// URL del Backend en Render (para Webhooks de Mercado Pago)
const URL_PUBLICA_SERVER = 'https://matecito.onrender.com';

// URL del Frontend en Netlify (OFICIAL)
const URL_FRONTEND = 'https://matecico.netlify.app';

// Configuración del cliente de Mercado Pago en modo producción explícito
const client = new MercadoPagoConfig({ 
    accessToken: MP_ACCESS_TOKEN,
    options: { timeout: 5000 }
});

// 2. ENVÍO DE MENSAJES A TELEGRAM
async function enviarNotificacionTelegram(mensaje) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: mensaje,
                parse_mode: 'HTML'
            })
        });
        const resData = await res.json();
        if (!resData.ok) {
            console.error('Error de Telegram API:', resData.description);
        } else {
            console.log('Notificación enviada con éxito a Telegram');
        }
    } catch (error) {
        console.error('Error al enviar mensaje a Telegram:', error);
    }
}

// 3. RUTA PARA CREAR PREFERENCIA Y NOTIFICAR
app.post('/api/crear-preferencia', async (req, res) => {
    try {
        const { items, cliente, cupon } = req.body;

        // --- CHIVATO PARA DEPURAR ---
        console.log("----------------------------------------");
        console.log("CUPÓN RECIBIDO EN EL SERVIDOR:", cupon);
        console.log("ITEMS RECIBIDOS:", items);
        console.log("----------------------------------------");

        // NORMALIZAR PRODUCTOS Y APLICAR DESCUENTO DE CUPÓN
        const itemsFormateados = (items || []).map(item => {
            let precioUnitario = Number(item.unit_price || item.precio || 0);

            // Validar cupón MATE95 (99% de descuento según tu vista previa)
            if (cupon && cupon.trim().toUpperCase() === 'MATE95') {
                precioUnitario = precioUnitario * 0.01; 
            }

            return {
                id: String(item.id || '1'),
                title: String(item.title || item.nombre || 'Producto MateCico'),
                unit_price: Number(precioUnitario.toFixed(2)),
                quantity: Number(item.quantity || item.cantidad || 1),
                currency_id: 'ARS'
            };
        });

        // Calcular total y lista
        const total = itemsFormateados.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
        const listaProd = itemsFormateados.map(item => `- ${item.title} x${item.quantity} ($${item.unit_price})`).join('\n');

        // Determinar método de entrega (Retiro o Envío)
        const metodoEntrega = cliente?.metodo || 'envio';
        let textoMetodo = metodoEntrega === 'retiro' 
            ? '🏪 <b>RETIRO EN LOCAL (H. Yrigoyen 710)</b>' 
            : `🚚 <b>ENVÍO A DOMICILIO</b>\n📍 <b>Dirección:</b> ${cliente?.direccion || 'No especificada'}, ${cliente?.localidad || ''}`;

        // Mensaje limpio para Telegram (refleja el total con descuento)
        let avisoTelegram = `🛒 <b>¡NUEVO PEDIDO INICIADO!</b> 🛒\n\n` +
            `👤 <b>Cliente:</b> ${cliente?.nombre || 'No especificado'}\n` +
            `📞 <b>Teléfono:</b> ${cliente?.telefono || 'No especificado'}\n` +
            `📦 <b>Método:</b> ${textoMetodo}\n`;
        
        if (cupon) {
            avisoTelegram += `🎟️ <b>Cupón Aplicado:</b> ${cupon.toUpperCase()}\n`;
        }

        avisoTelegram += `💵 <b>Total:</b> $${total}\n\n` +
            `📦 <b>Productos:</b>\n${listaProd}`;
        
        await enviarNotificacionTelegram(avisoTelegram);

        const preference = new Preference(client);

        const response = await preference.create({
            body: {
                items: itemsFormateados,
                back_urls: {
                    success: `${URL_FRONTEND}/comprobante.html`,
                    failure: `${URL_FRONTEND}/carrito.html`,
                    pending: `${URL_FRONTEND}/carrito.html`
                },
                auto_return: 'approved',
                notification_url: `${URL_PUBLICA_SERVER}/api/webhook-mp`,
                metadata: {
                    cliente_nombre: cliente?.nombre || 'No especificado',
                    cliente_telefono: cliente?.telefono || 'No especificado',
                    metodo_entrega: metodoEntrega,
                    cliente_direccion: cliente?.direccion || 'No especificada',
                    cliente_localidad: cliente?.localidad || 'No especificada',
                    cupon_usado: cupon || 'Ninguno'
                }
            }
        });

        res.json({ id: response.id, init_point: response.init_point });
    } catch (error) {
        console.error('Error al crear preferencia:', error);
        res.status(500).json({ error: 'Error al generar el pago' });
    }
});

// 4. WEBHOOK PARA PAGOS APROBADOS
app.post('/api/webhook-mp', async (req, res) => {
    try {
        const { type, data } = req.body;

        if (type === 'payment' || req.query.type === 'payment') {
            const paymentId = data?.id || req.query['data.id'];

            if (paymentId) {
                const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
                });

                if (response.ok) {
                    const paymentData = await response.json();

                    if (paymentData.status === 'approved') {
                        const metadata = paymentData.metadata || {};
                        const items = paymentData.additional_info?.items || [];

                        let listaProductos = items.map(item => `- ${item.title} x${item.quantity} ($${item.unit_price})`).join('\n');

                        const metodoEntrega = metadata.metodo_entrega || 'envio';
                        let textoMetodoWebhook = metodoEntrega === 'retiro' 
                            ? '🏪 <b>RETIRO EN LOCAL (H. Yrigoyen 710)</b>' 
                            : `🚚 <b>ENVÍO A DOMICILIO</b>\n📍 <b>Dirección:</b> ${metadata.cliente_direccion || 'N/A'}, ${metadata.cliente_localidad || ''}`;

                        let mensaje = `✅ <b>¡COMPRA PAGADA Y APROBADA!</b> ✅\n\n` +
                            `👤 <b>Cliente:</b> ${metadata.cliente_nombre || 'N/A'}\n` +
                            `📞 <b>Teléfono:</b> ${metadata.cliente_telefono || 'N/A'}\n` +
                            `📦 <b>Método:</b> ${textoMetodoWebhook}\n`;

                        if (metadata.cupon_usado && metadata.cupon_usado !== 'Ninguno') {
                            mensaje += `🎟️ <b>Cupón:</b> ${metadata.cupon_usado}\n`;
                        }

                        mensaje += `💵 <b>Total Pagado:</b> $${paymentData.transaction_amount}\n\n` +
                            `📦 <b>Productos:</b>\n${listaProductos}`;

                        await enviarNotificacionTelegram(mensaje);
                    }
                }
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error procesando Webhook:', error);
        res.sendStatus(500);
    }
});

// 5. INICIAR EL SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de MateCico activo en puerto ${PORT}`);
});