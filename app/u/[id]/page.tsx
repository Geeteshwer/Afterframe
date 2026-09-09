import type { Metadata } from 'next';
import { supabaseConfig } from '@/lib/supabase';
import { Globe, ArrowUpRight, Film, Heart } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> | { id: string } }): Promise<Metadata> {
  const p = await params;
  try {
    const { url, key } = supabaseConfig();
    const res = await fetch(`${url}/rest/v1/profiles?id=eq.${p.id}&select=username,avatar_url`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` } // using anon key
    });
    if (res.ok) {
      const data = await res.json() as any[];
      if (data.length > 0) {
        return {
          title: `${data[0].username}'s Film Shelf — Afterframe`,
          description: `Check out the films ${data[0].username} has been watching and reviewing on Afterframe.`,
          openGraph: {
            title: `${data[0].username}'s Film Shelf`,
            description: `Check out the films ${data[0].username} has been watching and reviewing on Afterframe.`,
            images: data[0].avatar_url ? [data[0].avatar_url] : []
          }
        };
      }
    }
  } catch (e) {}
  
  return {
    title: 'User Profile — Afterframe',
    description: 'Check out this film shelf on Afterframe.'
  };
}

const verdictLabel: Record<string, string> = { theatre: 'Theatre-worthy', home: 'Better at home', either: 'Either screen' };

export default async function UserProfile({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const p = await params;
  const { url, key } = supabaseConfig();
  
  let profile = null;
  let reviews = [];
  
  try {
    const profileRes = await fetch(`${url}/rest/v1/profiles?id=eq.${p.id}&select=username,avatar_url`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 60 }
    });
    if (profileRes.ok) {
      const data = await profileRes.json() as any[];
      if (data.length > 0) profile = data[0];
    }

    const reviewsRes = await fetch(`${url}/rest/v1/reviews?user_id=eq.${p.id}&is_public=eq.true&order=created_at.desc&limit=100`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 60 }
    });
    if (reviewsRes.ok) {
      reviews = await reviewsRes.json() as any[];
    }
  } catch (e) {}

  if (!profile) {
    return (
      <main className="page" style={{ textAlign: 'center', paddingTop: '10vh' }}>
        <div className="empty">
          <Globe size={32} />
          <div>
            <h3>Profile not found</h3>
            <p>This user may not exist or their profile is private.</p>
            <Link href="/" className="lime" style={{ display: 'inline-flex', marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--lime)', color: 'var(--bg)', borderRadius: '99px', textDecoration: 'none' }}>Go to homepage <ArrowUpRight size={17}/></Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <header className="topbar">
        <Link className="brand" href="/">afterframe</Link>
        <div style={{ marginLeft: 'auto' }}>
          <Link href="/" style={{ color: 'var(--lime)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Write a review <ArrowUpRight size={16}/>
          </Link>
        </div>
      </header>
      
      <div className="page" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem' }} />
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--card)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: '1rem', border: '1px solid var(--border)' }}>
              {profile.username[0]}
            </div>
          )}
          <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>{profile.username}'s <em>Shelf.</em></h1>
          <p style={{ color: 'var(--text-muted)' }}>{reviews.length} public reviews on Afterframe</p>
        </div>

        <section className="community-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '600px', margin: '0 auto' }}>
          {reviews.length === 0 ? (
            <div className="empty">
              <Film size={28} />
              <div>
                <h3>No public reviews</h3>
                <p>This user hasn't shared any reviews publicly yet.</p>
              </div>
            </div>
          ) : (
            reviews.map((r: any) => {
              const m = r.movie || {};
              return (
                <article className="review" key={r.id}>
                  <div className="review-top">
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <Link href={`/m/${m.id}`} className="review-film" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
                    {m.title} <ArrowUpRight size={15}/>
                  </Link>
                  <div className="review-rating">
                    {r.rating > 0 && '★'.repeat(r.rating)} 
                    {r.liked && <Heart size={16} fill="currentColor" aria-label="Liked"/>}
                    {r.screen_verdict && <span className="verdict">{verdictLabel[r.screen_verdict] || r.screen_verdict}</span>}
                  </div>
                  {r.review_text && <p>{r.review_text}</p>}
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
