import type { Metadata } from 'next';
import HomeClient from '../../home-client';
import { secret } from '@/lib/server';
import { movies } from '@/lib/movies';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> | { id: string } }): Promise<Metadata> {
  const p = await params;
  
  const token = secret('TMDB_READ_TOKEN');
  if (token) {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/movie/${p.id}?language=en-US`, {
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
  } else {
    const localMovie = movies.find(m => m.id.toString() === p.id);
    if (localMovie) {
       return {
          title: `${localMovie.title} — Afterframe`,
          description: localMovie.overview || 'Join the film club to see what people think.',
          openGraph: {
            title: `${localMovie.title} — Afterframe`,
            description: localMovie.overview || 'Join the film club to see what people think.',
            images: localMovie.poster ? [localMovie.poster] : []
          }
        };
    }
  }
  
  return {
    title: 'Afterframe — Find your next favourite film',
    description: 'Discover films, review the theatre experience, and share recommendations with your film people.'
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const p = await params;
  return <HomeClient initialMovieId={p.id} />;
}
