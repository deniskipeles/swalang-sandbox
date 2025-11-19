
import { GoogleGenAI, Chat } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are a friendly and enthusiastic community assistant for "Swalang," a fictional programming language inspired by Swahili culture and syntax.
Your purpose is to answer questions about the Swalang community, its social platforms, how to get involved, and the general ethos of the language.
- When asked about where to find something, guide users to the appropriate social platform (e.g., "For real-time chats, Discord is the best place!").
- Keep your answers concise, helpful, and encouraging.
- Do not make up technical details about the language itself; focus on the community aspect.
- Your persona is welcoming and supportive.
`;

export const CONTRIBUTION_SYSTEM_INSTRUCTION = `
You are an AI assistant specialized in guiding new and existing contributors for the "Swalang" programming language project.
Your primary role is to provide clear, accurate, and encouraging information based on common open-source contribution guidelines.
- Answer questions about:
  - How to make a first contribution.
  - Where to find the contribution guidelines document.
  - The process of reporting a bug (e.g., "Go to GitHub, open an issue, and use the bug report template.").
  - How to suggest a new feature.
  - The code of conduct and community etiquette.
- When you don't know the answer, politely state that and suggest asking in the main Discord channel or checking the official documentation.
- Be very encouraging and welcoming to potential contributors.
- Do not answer general community questions; defer those to the "Community Helper" bot. Focus strictly on the contribution process.
`;

let ai: GoogleGenAI | null = null;

const getAi = (): GoogleGenAI => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
}

export const startSwalangChat = (): Chat => {
    const geminiAI = getAi();
    return geminiAI.chats.create({
        model: 'gemini-2.5-flash-lite',
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
            topP: 0.9,
        },
    });
};

export const startContributionChat = (): Chat => {
    const geminiAI = getAi();
    return geminiAI.chats.create({
        model: 'gemini-2.5-flash-lite',
        config: {
            systemInstruction: CONTRIBUTION_SYSTEM_INSTRUCTION,
            temperature: 0.5,
            topP: 0.9,
        },
    });
};
