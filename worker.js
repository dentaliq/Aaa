addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event.env));
});

async function handleRequest(request, env) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    const contentType = request.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
        return new Response('Unsupported Media Type', { status: 415, headers: corsHeaders });
    }

    try {
        const data = await request.json();

        const BOT_TOKEN = env.BOT_TOKEN;
        const CHAT_ID = env.CHAT_ID;

        if (!BOT_TOKEN || !CHAT_ID) {
            return new Response('Missing BOT_TOKEN or CHAT_ID', { status: 500, headers: corsHeaders });
        }

        const messageText = `<b>رسالة جديدة من الموقع:</b>\n\n` +
            `<b>الاسم:</b> ${data.name}\n` +
            `<b>البريد الإلكتروني:</b> ${data.email}\n` +
            `<b>الرسالة:</b>\n${data.message}`;

        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const telegramResponse = await fetch(telegramUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: messageText,
                parse_mode: 'HTML'
            }),
        });

        if (!telegramResponse.ok) {
            const errorData = await telegramResponse.text();
            throw new Error(`Telegram API Error: ${telegramResponse.status} - ${errorData}`);
        }

        return new Response(JSON.stringify({ success: true, message: 'Message sent successfully.' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });

    } catch (error) {
        console.error('Error handling request:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }
}
