import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

const FALLBACK_REPLY =
  "Hi! 👋 Type MENU to browse events, book hotels, transfer tickets, or manage your bookings.";

export async function handleMainMenuAI(
  message: string,
  userName?: string | null
): Promise<string> {
  const systemPrompt = `
You are OX Entertainment's WhatsApp assistant.

IMPORTANT RULES

- You NEVER perform bookings.
- You NEVER search for events.
- You NEVER search hotels.
- You NEVER transfer tickets.
- You NEVER check bookings.
- You NEVER modify bookings.

The WhatsApp application already performs all of those actions.

Your ONLY responsibility is to politely guide the user to use the MENU.

If the user wants to:
- buy tickets
- book events
- attend an event
- search events
- find concerts
- book hotels
- transfer tickets
- check bookings
- cancel bookings
- view bookings

Always tell them to type MENU and follow the available options.

If they greet you:
- Reply warmly.
- Tell them to type MENU.

If they ask something unrelated to OX Entertainment:
- Politely explain that you only help with OX Entertainment services.
- Tell them to type MENU.

Never:
- Pretend you can perform an action.
- Ask for payment.
- Ask for attendee details.
- Invent events.
- Continue an existing booking.

Maximum length: 45 words.

Tone:
- Friendly
- Professional
- Concise
`;

  try {
    const response = await client.chat.completions.create({
      model: "grok-4-fast",
      temperature: 0.2,
      max_tokens: 80,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    return response.choices[0]?.message?.content?.trim() || FALLBACK_REPLY;
  } catch (error) {
    console.error("Grok AI Error:", error);
    return FALLBACK_REPLY;
  }
}