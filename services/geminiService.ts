import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return client;
};

export const generateMechanismExplanation = async (mechanismName: string, currentParams: string) => {
  try {
    const ai = getClient();
    const prompt = `
      You are a senior mechanical engineering professor. 
      Provide a rigorous technical analysis of the ${mechanismName}. 
      
      Current Parameters (mm/deg): ${currentParams}.

      Structure the response in concise Markdown:
      1. **Mechanism Overview**: Technical definition and DOF (Degrees of Freedom).
      2. **Kinematic Analysis**: Explain the motion curves, velocity profiles, and mechanical advantage implications. Mention relevant laws (Grashof, Kennedy's Theorem, etc.).
      3. **Industrial Applications**: Specific real-world use cases.
      4. **Parameter Analysis**: Evaluate the current configuration. Is it in a singular position? Is it optimized?
      
      Keep it professional, dense with info, but under 350 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "## Analysis Unavailable\n\nUnable to connect to the analysis engine. Please verify your API key.";
  }
};

export const chatWithMechanism = async (history: {role: 'user'|'model', content: string}[], newMessage: string) => {
    try {
        const ai = getClient();
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: "You are an expert mechanical engineer assistant. You help users design and analyze complex kinematic linkages. You are precise with mathematical relationships and physics principles."
            },
            history: history.map(h => ({
                role: h.role,
                parts: [{ text: h.content }]
            }))
        });

        const result = await chat.sendMessage({ message: newMessage });
        return result.text;
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        return "Communication error.";
    }
}