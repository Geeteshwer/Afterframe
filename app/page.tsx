import type { Metadata } from 'next';
import HomeClient from './home-client';
import { secret } from '@/lib/server';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ movie?: string, club?: string }> | { movie?: string, club?: string } }): Promise<Metadata> {
  const sp = await searchParams;
  
  if (sp?.movie) {
    const token = secret('TMDB_READ_TOKEN');
    if (token) {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/movie/${sp.movie}?language=en-US`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const m = await res.json() as any;
          return {
            title: `${m.title} — Afterframe`,
            description: m.overview || 'Join the film club to see what people think.',
            openGraph: {
              title: `${m.title} — Afterframe`,
              description: m.overview || 'Join the film club to see what people think.',
              images: m.poster_path ? [`https://image.tmdb.org/t/p/w500${m.poster_path}`] : []
            }
          };
        }
      } catch (e) {}
    }
  }
  
  if (sp?.club) {
    return {
      title: `Join the Film Club — Afterframe`,
      description: `You've been invited to a film club. Tap to join!`,
      openGraph: {
        title: `Join the Film Club`,
        description: `You've been invited to a film club. Tap to join!`
      }
    };
  }

  return {
    title: 'Afterframe — Find your next favourite film',
    description: 'Discover films, review the theatre experience, and share recommendations with your film people.'
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ movie?: string, club?: string }> | { movie?: string, club?: string } }) {
  const sp = await searchParams;
  return <HomeClient initialMovieId={sp?.movie} initialClubCode={sp?.club} />;
}
