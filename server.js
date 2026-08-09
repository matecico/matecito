import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Permite servir tus archivos HTML directamente desde la raíz

// 1. DATOS DE MERCADO PAGO Y TELEGRAM
const MP_ACCESS_TOKEN = 'APP_USR-1754797691994307-080810-e339511cbe3a9b0c843f612d56f1bb76-3601405030';
const TELEGRAM_BOT_TOKEN = '8966386944:AAH8OTZoT7V-ZGS9WHNtW99NjtCBj0iiZYE';
const TELEGRAM_CHAT_ID = '7691781211';
const URL_PUBLICA_SERVER = 'https://matecito.onrender.com';

const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

// 2. ENVÍO DE MENSAJES A TELEGRAM
async function enviarNotificacionTelegram(mensaje) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: mensaje,
                parse_mode: 'HTML'
            })
        });
        console.log('Notificación enviada a Telegram');
    } catch (error) {
        console.error('Error al enviar mensaje a Telegram:', error);
    }
}

// 3. RUTA PARA CREAR LA PREFERENCIA DE PAGO Y NOTIFICAR COMPRA
app.post('/api/crear-preferencia', async (req, res) => {
    try {
        const { items, cliente } = req.body;

        // Calcular total
        const total = items.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
        const listaProd = items.map(item => `- ${item.title} x${item.quantity} ($${item.unit_price})`).join('\n');

        // Mensaje directo a Telegram APENAS hacen clic en pagar
        const avisoTelegram = `🛒 <b>¡NUEVO PEDIDO INICIADO!</b> 🛒\n\n` +
            `👤 <b>Cliente:</b> ${cliente?.nombre || 'No especificado'}\n` +
            `📍 <b>Dirección:</b> ${cliente?.direccion || 'No especificada'}\n` +
            `📞 <b>Teléfono:</b> ${cliente?.telefono || 'No especificado'}\n` +
            `💵 <b>Total:</b> $${total}\n\n` +
            `📦 <b>Productos:</b>\n${listaProd}`;
        
        await enviarNotificacionTelegram(avisoTelegram);

        const preference = new Preference(client);

        const response = await preference.create({
            body: {
                items: items,
                back_urls: {
                    success: `${URL_PUBLICA_SERVER}/index.html`,
                    failure: `${URL_PUBLICA_SERVER}/carrito.html`,
                    pending: `${URL_PUBLICA_SERVER}/carrito.html`
                },
                auto_return: 'approved',
                notification_url: `${URL_PUBLICA_SERVER}/api/webhook-mp`,
                metadata: {
                    cliente_nombre: cliente?.nombre || 'No especificado',
                    cliente_direccion: cliente?.direccion || 'No especificada',
                    cliente_telefono: cliente?.telefono || 'No especificado'
                }
            }
        });

        res.json({ id: response.id, init_point: response.init_point });
    } catch (error) {
        console.error('Error al crear preferencia:', error);
        res.status(500).json({ error: 'Error al generar el pago' });
    }
});

// 4. WEBHOOK PARA RECIBIR NOTIFICACIONES DE MERCADO PAGO
app.post('/api/webhook-mp', async (req, res) => {
    try {
        const { type, data } = req.body;

        if (type === 'payment' || req.query.type === 'payment') {
            const paymentId = data?.id || req.query['data.id'];

            if (paymentId) {
                const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                    headers: {
                        Authorization: `Bearer ${MP_ACCESS_TOKEN}`
                    }
                });

                if (response.ok) {
                    const paymentData = await response.json();

                    if (paymentData.status === 'approved') {
                        const metadata = paymentData.metadata || {};
                        const items = paymentData.additional_info?.items || [];

                        let listaProductos = items.map(item => `- ${item.title} x${item.quantity} ($${item.unit_price})`).join('\n');

                        const mensaje = `✅ <b>¡COMPRA PAGADA Y APROBADA!</b> ✅\n\n` +
                            `👤 <b>Cliente:</b> ${metadata.cliente_nombre || 'N/A'}\n` +
                            `📍 <b>Dirección:</b> ${metadata.cliente_direccion || 'N/A'}\n` +
                            `📞 <b>Teléfono:</b> ${metadata.cliente_telefono || 'N/A'}\n` +
                            `💵 <b>Total Pagado:</b> $${paymentData.transaction_amount}\n\n` +
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