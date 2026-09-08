import {secret, failure} from '@/lib/server';
import {getSession} from '@/lib/supabase';
import {generateReply, validateMessages} from '@/lib/gemini';

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return failure(new Error('Invalid request origin.'),403);
  if (!await getSession()) return failure(new Error('Sign in to talk with the Projectionist.'),401);
  let messages;
  try { messages = validateMessages((await request.json() as {messages?: unknown}).messages); }
  catch (error) { return failure(error,400); }
  const key = secret('GEMINI_API_KEY');
  if (!key) return Response.json({error:'The Projectionist is waiting for its Gemini connection. You can explore the curated shelves meanwhile.',setup:true},{status:503});
  try {
    const text = await generateReply(key, secret('GEMINI_MODEL') || 'gemini-3.5-flash-lite', messages);
    return Response.json({text});
  } catch (error) {
    if (error instanceof Error && ['TimeoutError','AbortError'].includes(error.name)) return failure(new Error('The Projectionist took too long to reply. Please try again.'),504);
    return failure(error,502);
  }
}
