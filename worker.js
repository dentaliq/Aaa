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

        // تحقق من وجود متغيرات البيئة
        if (!env.BOT_TOKEN || !env.CHAT_ID) {
            return new Response(JSON.stringify({ error: 'Missing BOT_TOKEN or CHAT_ID' }), { status: 500, headers: corsHeaders });
        }
        
        const BOT_TOKEN = env.BOT_TOKEN;
        const CHAT_ID = env.CHAT_ID;

        // بناء رسالة تيليجرام بشكل ديناميكي
        let messageText = '<b>رسالة جديدة من الموقع:</b>\n\n';

        // قراءة كل حقل وقيمته من البيانات المرسلة
        for (const key in data) {
            // تحويل اسم الحقل ليكون أكثر وضوحاً في الرسالة
            const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            messageText += `<b>${formattedKey}:</b> ${data[key]}\n`;
        }
        
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
