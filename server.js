import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const app = express();
app.set('trust proxy', 1); // Render está detrás de un proxy; necesario para ver la IP real

app.use(cors());
app.use(express.json());

// 1. DATOS DE MERCADO PAGO Y TELEGRAM (se leen de las variables de entorno de Render)
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// URL del Backend en Render (para Webhooks de Mercado Pago)
const URL_PUBLICA_SERVER = 'https://matecito.onrender.com';

// URL del Frontend en Netlify (OFICIAL)
const URL_FRONTEND = 'https://matecico.netlify.app';

// Configuración del cliente de Mercado Pago en modo producción explícito
const client = new MercadoPagoConfig({ 
    accessToken: MP_ACCESS_TOKEN,
    options: { timeout: 5000 }
});

// 1.b CUPONES PRIVADOS (viven solo en Render, en la variable de entorno CUPONES)
const CUPONES = {};
try {
    const crudo = JSON.parse(process.env.CUPONES || '{}');
    for (const [codigo, pct] of Object.entries(crudo)) {
        const n = Number(pct);
        if (n >= 0 && n <= 100) CUPONES[codigo.trim().toUpperCase()] = n;
    }
} catch (e) {
    console.error('La variable CUPONES no es un JSON válido. No habrá cupones activos.');
}

function buscarCupon(codigoIngresado) {
    const codigo = String(codigoIngresado || '').trim().toUpperCase();
    if (!codigo || !(codigo in CUPONES)) return null;
    return { codigo, factor: 1 - CUPONES[codigo] / 100 };
}

const intentosCupon = new Map();
function limitarIntentos(req, res, next) {
    const ahora = Date.now();
    const recientes = (intentosCupon.get(req.ip) || []).filter(t => ahora - t < 60000);
    if (recientes.length >= 10) {
        return res.status(429).json({ valido: false, mensaje: 'Demasiados intentos. Probá en un minuto.' });
    }
    recientes.push(ahora);
    intentosCupon.set(req.ip, recientes);
    next();
}

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

// 2.b RUTA PARA VALIDAR UN CUPÓN
app.post('/api/validar-cupon', limitarIntentos, (req, res) => {
    const cuponInfo = buscarCupon(req.body?.codigo);
    if (!cuponInfo) return res.json({ valido: false, mensaje: 'Código inválido' });
    res.json({ valido: true, codigo: cuponInfo.codigo, factor: cuponInfo.factor });
});

// 2.c RUTA PARA COTIZAR ENVÍOS (Correo Argentino / Zonas Fijas)
app.post('/api/cotizar-envio', (req, res) => {
    try {
        const { cpDestino, pesoKg } = req.body;
        
        if (!cpDestino) {
            return res.status(400).json({ valido: false, message: 'Falta el código postal' });
        }

        let costoBase = 13000; // Tarifa estándar
        
        // Si el CP empieza con 1 (CABA / GBA cercano)
        if (cpDestino.startsWith('1')) {
            costoBase = 10500;
        } 
        // Si el CP es del sur lejano (ej: Tierra del Fuego como 9410)
        else if (cpDestino.startsWith('9')) {
            costoBase = 18000;
        }

        // Si el paquete pesa más de 1.2 kg, sumamos un plus por excedente
        let plusPeso = 0;
        if (pesoKg && pesoKg > 1.2) {
            const exceso = pesoKg - 1.2;
            plusPeso = Math.ceil(exceso) * 3000;
        }

        const costoTotalEnvio = costoBase + plusPeso;

        return res.json({ valido: true, costo: costoTotalEnvio });

    } catch (error) {
        console.error("Error en cotización de envío:", error);
        return res.status(500).json({ valido: false, message: 'Error interno al cotizar el envío' });
    }
});

// 3. RUTA PARA CREAR PREFERENCIA Y NOTIFICAR
app.post('/api/crear-preferencia', async (req, res) => {
    try {
        const { items, cliente, cupon, envio } = req.body;
        const costoEnvio = Number(envio || 0);

        const cuponInfo = buscarCupon(cupon);

        const itemsFormateados = (items || []).map(item => {
            let precioUnitario = Number(item.unit_price || item.precio || 0);

            if (cuponInfo) {
                precioUnitario = precioUnitario * cuponInfo.factor;
            }

            return {
                id: String(item.id || '1'),
                title: String(item.title || item.nombre || 'Producto MateCico'),
                unit_price: Number(precioUnitario.toFixed(2)),
                quantity: Number(item.quantity || item.cantidad || 1),
                currency_id: 'ARS'
            };
        });

        if (costoEnvio > 0) {
            itemsFormateados.push({
                id: 'envio',
                title: 'Costo de Envío a Domicilio',
                unit_price: Number(costoEnvio.toFixed(2)),
                quantity: 1,
                currency_id: 'ARS'
            });
        }

        const total = itemsFormateados.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
        const listaProd = itemsFormateados.map(item => `- ${item.title} x${item.quantity} ($${item.unit_price})`).join('\n');

        const metodoEntrega = cliente?.metodo || 'envio';
        let textoMetodo = metodoEntrega === 'retiro' 
            ? '🏪 <b>RETIRO EN LOCAL (H. Yrigoyen 710)</b>' 
            : `🚚 <b>ENVÍO A DOMICILIO</b>\n📍 <b>Dirección:</b> ${cliente?.direccion || 'No especificada'}, ${cliente?.localidad || ''}\n💵 <b>Costo de Envío:</b> $${costoEnvio}`;

        let avisoTelegram = `🛒 <b>¡NUEVO PEDIDO INICIADO!</b> 🛒\n\n` +
            `👤 <b>Cliente:</b> ${cliente?.nombre || 'No especificado'}\n` +
            `📞 <b>Teléfono:</b> ${cliente?.telefono || 'No especificado'}\n` +
            `📦 <b>Método:</b> ${textoMetodo}\n`;
        
        if (cuponInfo) {
            avisoTelegram += `🎟️ <b>Cupón Aplicado:</b> ${cuponInfo.codigo}\n`;
        }

        avisoTelegram += `💵 <b>Total (Incluyendo envío):</b> $${total}\n\n` +
            `📦 <b>Conceptos:</b>\n${listaProd}`;
        
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
                    costo_envio: costoEnvio,
                    cupon_usado: cuponInfo ? cuponInfo.codigo : 'Ninguno'
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
                            : `🚚 <b>ENVÍO A DOMICILIO</b>\n📍 <b>Dirección:</b> ${metadata.cliente_direccion || 'N/A'}, ${metadata.cliente_localidad || ''}\n💵 <b>Costo de Envío:</b> $${metadata.costo_envio || 0}`;

                        let mensaje = `✅ <b>¡COMPRA PAGADA Y APROBADA!</b> ✅\n\n` +
                            `👤 <b>Cliente:</b> ${metadata.cliente_nombre || 'N/A'}\n` +
                            `📞 <b>Teléfono:</b> ${metadata.cliente_telefono || 'N/A'}\n` +
                            `📦 <b>Método:</b> ${textoMetodoWebhook}\n`;

                        if (metadata.cupon_usado && metadata.cupon_usado !== 'Ninguno') {
                            mensaje += `🎟️ <b>Cupón:</b> ${metadata.cupon_usado}\n`;
                        }

                        mensaje += `💵 <b>Total Pagado:</b> $${paymentData.transaction_amount}\n\n` +
                            `📦 <b>Conceptos:</b>\n${listaProductos}`;

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