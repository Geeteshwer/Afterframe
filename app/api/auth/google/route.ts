import {supabaseConfig} from '@/lib/supabase';

export async function GET(request: Request) {
  const {url} = supabaseConfig();
  const origin = new URL(request.url).origin;
  
  // By default, Supabase implicit OAuth redirects to the site URL with a hash fragment.
  return Response.redirect(`${url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(origin)}`, 302);
}
