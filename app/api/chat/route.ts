import {secret, failure} from '@/lib/server';
import {getSession} from '@/lib/supabase';
import {generateReply, validateMessages} from '@/lib/gemini';
import {catalogMovie} from '@/lib/catalog';

/**
 * Use a fast Gemini call to extract movie titles from the reply text.
 * This is far more reliable than regex since Gemini can understand context.
 */
async function extractMovies(text: string, key: string): Promise<{title: string; year: number}[]> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent`, {
      method: 'POST',
      headers: {'x-goog-api-key': key, 'Content-Type': 'application/json'},
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        systemInstruction: {parts:[{text: 'Extract movie recommendations from the text. Return a JSON array of objects with "title" (string) and "year" (number). Only include movies being recommended, not movies the user mentioned. If no movies are recommended, return an empty array []. Return ONLY the JSON array, no other text.'}]},
        contents: [{role: 'user', parts: [{text}]}],
        generationConfig: {maxOutputTokens: 512, temperature: 0, responseMimeType: 'application/json'},
      }),
    });
    if (!response.ok) return [];
    const data = await response.json() as any;
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m: any) => typeof m.title === 'string' && typeof m.year === 'number' && m.year >= 1920 && m.year <= 2030)
      .slice(0, 5);
  } catch {
    return [];
  }
}

/** Search TMDB for a single movie. Try with year first, fallback without. */
async function searchTMDB(title: string, year: number, token: string): Promise<any | null> {
  try {
    // First try with year for precision
    const url = new URL('https://api.themoviedb.org/3/search/movie');
    url.searchParams.set('query', title);
    url.searchParams.set('year', String(year));
    url.searchParams.set('language', 'en-US');
    url.searchParams.set('page', '1');
    url.searchParams.set('include_adult', 'false');
    const res = await fetch(url, {
      headers: {Authorization: `Bearer ${token}`},
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json() as any;
      if (data.results?.[0]) return catalogMovie(data.results[0]);
      // Year was too strict — retry without year
      url.searchParams.delete('year');
      const res2 = await fetch(url, {
        headers: {Authorization: `Bearer ${token}`},
        signal: AbortSignal.timeout(4000),
      });
      if (res2.ok) {
        const data2 = await res2.json() as any;
        if (data2.results?.[0]) return catalogMovie(data2.results[0]);
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Remove [[...]] markers from the visible text (in case Gemini uses them) */
function cleanText(text: string): string {
  return text.replace(/\[\[(.+?)\s*\(\d{4}\)\]\]/g, '$1').trim();
}

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return failure(new Error('Invalid request origin.'),403);
  if (!await getSession()) return failure(new Error('Sign in to talk with the Projectionist.'),401);
  let messages;
  try { messages = validateMessages((await request.json() as {messages?: unknown}).messages); }
  catch (error) { return failure(error,400); }
  const key = secret('GEMINI_API_KEY');
  if (!key) return Response.json({error:'The Projectionist is waiting for its Gemini connection. You can explore the curated shelves meanwhile.',setup:true},{status:503});
  try {
    const rawText = await generateReply(key, secret('GEMINI_MODEL') || 'gemini-3.5-flash-lite', messages);

    // Extract movie references using a fast Gemini JSON extraction
    const refs = await extractMovies(rawText, key);

    const token = secret('TMDB_READ_TOKEN');
    const movies: any[] = [];

    if (refs.length > 0 && token) {
      // All TMDB lookups run in parallel with a global 6s timeout
      const tmdbRace = Promise.all(refs.map(ref => searchTMDB(ref.title, ref.year, token)));
      const deadline = new Promise<null[]>(resolve => setTimeout(() => resolve(refs.map(() => null)), 6000));
      const results = await Promise.race([tmdbRace, deadline]);
      for (const m of results) { if (m) movies.push(m); }
    }

    return Response.json({text: cleanText(rawText), movies});
  } catch (error) {
    if (error instanceof Error && ['TimeoutError','AbortError'].includes(error.name)) return failure(new Error('The Projectionist took too long to reply. Please try again.'),504);
    return failure(error,502);
  }
}
