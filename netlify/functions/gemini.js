// Node.js 18+ provides a built-in fetch API, so no external dependency is needed.


exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    try {
        const { payload } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Gemini API Key is not configured on the server.' }),
            };
        }

        // Using Gemini 2.5 Flash on stable v1 endpoint as requested by user's original code
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                statusCode: response.status,
                body: JSON.stringify({
                    error: errorData.error?.message || `Gemini API Error: ${response.status}`,
                }),
            };
        }

        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error('Netlify Function Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error: ' + error.message }),
        };
    }
};
