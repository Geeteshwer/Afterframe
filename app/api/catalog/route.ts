import {movies} from '@/lib/movies';
import {secret,failure} from '@/lib/server';
import {catalogUrl,catalogMovie} from '@/lib/catalog';
export async function GET(request:Request){
 const url=new URL(request.url),q=(url.searchParams.get('q')||'').slice(0,200),genre=url.searchParams.get('genre')||'All films',page=Number(url.searchParams.get('page'))||1;
 const token=secret('TMDB_READ_TOKEN');
 if(!token)return Response.json({movies:movies.filter(m=>`${m.title} ${m.genre}`.toLowerCase().includes(q.toLowerCase())&&(q||genre==='All films'||m.genre===genre)),mode:'curated',pages:1});
 try{const res=await fetch(catalogUrl(q,genre,page),{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(15000)});if(!res.ok)throw new Error('Movie search is temporarily unavailable. Please try again.');const data=await res.json() as any;return Response.json({mode:'live',pages:Math.max(1,Math.min(data.total_pages||1,500)),movies:data.results.map(catalogMovie)});}catch(e){return failure(new Error('Movie search is temporarily unavailable. Please try again.'),502)}
}
