import {authRequest,getSession,setSession,clearSession} from '@/lib/supabase';
import {failure} from '@/lib/server';

export async function GET() {
  try {
    const session = await getSession();
    return Response.json({user: session ? {id: session.user.id, email: session.user.email} : null}, {headers: {'Cache-Control': 'no-store'}});
  } catch {
    return failure(new Error('Could not check your session. Please try again.'), 503);
  }
}

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return failure(new Error('Invalid request origin.'), 403);
  
  try {
    const b = await request.json() as any;
    
    if (b.action === 'logout') {
      const session = await getSession();
      if (session) {
        const r = await authRequest('logout', {}, session.token);
        if (!r.ok && r.status !== 401) throw new Error('Could not sign out. Please try again.');
      }
      await clearSession();
      return Response.json({ok: true});
    }

    if (b.action === 'oauthSession') {
      if (!b.access_token || !b.refresh_token) return failure(new Error('Invalid token data.'), 400);
      await setSession({
        access_token: b.access_token,
        refresh_token: b.refresh_token,
        expires_in: b.expires_in || 3600,
      });
      return Response.json({ok: true, authenticated: true});
    }

    if (!['login', 'signup'].includes(b.action) || typeof b.email !== 'string' || !b.email.includes('@') || b.email.length > 254 || typeof b.password !== 'string' || b.password.length < 8 || b.password.length > 128) {
      return failure(new Error('Enter a valid email and a password of 8–128 characters.'), 400);
    }

    if (b.action === 'signup' && (typeof b.username !== 'string' || !b.username.trim() || b.username.length > 60)) {
      return failure(new Error('Choose a username of 1–60 characters.'), 400);
    }

    const path = b.action === 'login' ? 'token?grant_type=password' : `signup?redirect_to=${encodeURIComponent(new URL(request.url).origin)}`;
    const result = await authRequest(path, {
      email: b.email.trim(),
      password: b.password,
      ...(b.action === 'signup' ? {data: {username: b.username.trim()}} : {})
    });
    
    const data = await result.json() as any;

    if (!result.ok) {
      const message = result.status === 429 ? 'Too many attempts. Please wait before trying again.' : b.action === 'login' ? 'Could not sign in. Check your email, password, and email confirmation.' : 'Could not create your account. Please check your details and try again.';
      return failure(new Error(message), result.status === 429 ? 429 : 400);
    }

    if (data.access_token) {
      await setSession(data);
      return Response.json({ok: true, authenticated: true});
    }

    return Response.json({ok: true, confirmationRequired: true, message: 'Check your email to confirm your account, then return here and sign in.'});
  } catch {
    return failure(new Error('The sign-in service is unavailable. Please try again.'), 503);
  }
}
