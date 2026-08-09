exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    try {
        const body = JSON.parse(event.body);
        const prompt = body.prompt;
        const systemInstruction = body.systemInstruction;

        // 1. 從 Netlify 伺服器讀取金鑰
        const apiKey = process.env.GEMINI_API_KEY;
        
        // 【防呆機制】：如果伺服器真的沒讀到金鑰，直接回傳白話文錯誤給前端
        if (!apiKey || apiKey.trim() === "" || apiKey === "undefined") {
            return {
                statusCode: 200, 
                body: JSON.stringify({ error: "Netlify 伺服器讀不到金鑰！請檢查 Environment variables 是否有多餘空白或引號，並確認 Scope 有包含 Functions。" })
            };
        }

        // 2. 這裡也要確保使用最新且穩定的模型名稱 (gemini-flash-latest)
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey.trim()}`;

        const payload = { contents: [{ parts: [{ text: prompt }] }] };
        if (systemInstruction) {
            // Google REST API 要求的標準命名為 system_instruction
            payload.system_instruction = { parts: [{ text: systemInstruction }] };
        }

        // 3. 發送請求給 Google
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // 如果 Google API 報錯，直接把錯誤細節往回傳
        if (!response.ok) {
             return {
                 statusCode: 200,
                 body: JSON.stringify({ error: data.error })
             };
        }

        // 成功取得 AI 回覆
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };
    } catch (error) {
        return { 
            statusCode: 200, 
            body: JSON.stringify({ error: "轉接站執行失敗: " + error.message }) 
        };
    }
};
