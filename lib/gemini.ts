export type ChatMessage = { role: 'user' | 'assistant'; content: string };

const instructions = 'You are the Projectionist, a warm, thoughtful movie companion. Recommend 2-3 real movies with their release year and a specific reason matching the mood. Ask one useful follow-up when needed. Discuss cinema naturally and respond in the language the user uses. Do not spoil plots unless explicitly requested. Distinguish film quality from whether the theatrical experience is worth the ticket. Do not claim current showtimes or streaming availability without live data. Keep replies under 250 words. Use plain text without Markdown formatting.';

export function validateMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 20 || value.some(m => !m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || !m.content.trim() || m.content.length > 3000) || value.at(-1).role !== 'user') {
    throw new Error('Please send a message of up to 3,000 characters.');
  }
  return value.map(m => ({role:m.role, content:m.content.trim()}));
}

export async function generateReply(key: string, model: string, messages: ChatMessage[], fetcher: typeof fetch = fetch): Promise<string> {
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) throw new Error('The Projectionist’s model connection needs attention.');
  const response = await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: {'x-goog-api-key':key, 'Content-Type':'application/json'},
    signal: AbortSignal.timeout(45000),
    body: JSON.stringify({
      systemInstruction: {parts:[{text:instructions}]},
      contents: messages.map(m => ({role:m.role === 'assistant' ? 'model' : 'user', parts:[{text:m.content}]})),
      generationConfig: {maxOutputTokens:2048, temperature:0.8},
    }),
  });
  if (!response.ok) {
    if (response.status === 503) throw new Error('Gemini is experiencing high demand. Please try again in a moment.');
    if (response.status === 429) throw new Error('The Projectionist has reached its Gemini usage limit. Please try again later.');
    if ([400,401,403].includes(response.status)) throw new Error('The Projectionist’s Gemini connection needs attention. Please contact the site owner.');
    if (response.status === 404) throw new Error('The configured Gemini model is unavailable. Please contact the site owner.');
    throw new Error('The Projectionist could not reach Gemini. Please try again.');
  }
  const data = await response.json() as {candidates?: {content?: {parts?: {text?: string; thought?: boolean}[]}; finishReason?: string}[]};
  const text = data.candidates?.[0]?.content?.parts?.filter(part => !part.thought && typeof part.text === 'string').map(part => part.text).join('\n').trim();
  if (!text) throw new Error('Gemini did not return a reply. Try rephrasing your request.');
  return text;
}
