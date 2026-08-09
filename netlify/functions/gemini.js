exports.handler = async function(event, context) {
    // 確保只接收 POST 請求
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        // 解析前端傳來的資料
        const body = JSON.parse(event.body);
        const prompt = body.prompt;
        const systemInstruction = body.systemInstruction;

        // 從 Netlify 環境變數中讀取被保護的金鑰
        const apiKey = process.env.GEMINI_API_KEY;
        
        // 呼叫最穩定的 1.5-flash 模型
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const payload = { contents: [{ parts: [{ text: prompt }] }] };
        if (systemInstruction) {
            payload.system_instruction = { parts: [{ text: systemInstruction }] };
        }

        // 發送請求給 Google
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // 將 Google 的結果回傳給前端
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };
    } catch (error) {
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: error.message }) 
        };
    }
};
