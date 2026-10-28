import express from 'express'; // Use import if your project uses ES modules

const router = express.Router();

router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Server missing GEMINI_API_KEY in environment variables' });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: `You are MaatriCare's clinical and supportive AI health companion for maternal and postpartum care. Keep answers professional, empathetic, concise, and medically safe. User query: ${message}`
                            }
                        ]
                    }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to communicate with Gemini API');
        }

        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I am here to help you navigate your health dashboard. How can I assist you today?";

        res.json({ reply: aiReply });
    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate AI response' });
    }
});

// CHANGE THIS LINE FROM module.exports TO export default:
export default router;