
import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import rateLimit from "express-rate-limit";

const router = Router();

const limiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
});

router.use(limiter);

const apiKey = process.env.GEMINI_API_KEY;

const ai = apiKey
    ? new GoogleGenAI({ apiKey })
    : null;

const prompts = {
    nutrition: `
You are MaatriCare's general food and wellness education assistant.
Offer general, non-clinical food education, meal-planning ideas,
hydration habits, and culturally relevant examples.

Do not give pregnancy-specific medical advice, diagnose conditions,
recommend supplements or doses, prescribe diets for medical conditions,
or claim that a food is safe for every pregnancy.
For pregnancy-specific dietary questions, recommend consulting a
qualified doctor or registered dietitian.
Be clear, kind, concise, and honest about uncertainty.
`,

    mental: `
You are MaatriCare's general emotional-wellbeing support assistant.
Respond with empathy, active listening, simple grounding exercises,
gentle breathing exercises, and journaling ideas.

Do not diagnose, provide psychotherapy, recommend medication,
or claim to replace a mental-health professional.
For persistent distress, encourage speaking with a qualified
mental-health professional or healthcare provider.
If the user may be in immediate danger or may harm themselves,
prioritize immediate human support and local emergency services.
Do not imply that this chat can monitor or dispatch help.
`,
};

router.post("/assistant", async (req, res) => {
    try {
        if (!ai) {
            return res.status(503).json({
                error: "AI service is not configured.",
            });
        }

        const { mode, message } = req.body ?? {};

        if (!["nutrition", "mental"].includes(mode)) {
            return res.status(400).json({
                error: "Mode must be nutrition or mental.",
            });
        }

        if (
            typeof message !== "string" ||
            !message.trim() ||
            message.length > 1500
        ) {
            return res.status(400).json({
                error: "Enter a message of up to 1500 characters.",
            });
        }

        const result = await ai.models.generateContent({
            model:
                process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
            contents: message.trim(),
            config: {
                systemInstruction: prompts[mode],
                maxOutputTokens: 400,
                temperature: 0.4,
            },
        });

        return res.json({
            reply:
                result.text ||
                "I couldn't prepare a response. Please try again.",
            mode,
            disclaimer:
                "General wellbeing information only, not medical advice.",
        });
    } catch (error) {
        // Do not log the user's message or API key.
        console.error("MaatriCare AI request failed.");

        return res.status(502).json({
            error: "The assistant is temporarily unavailable.",
        });
    }
});

export default router;
