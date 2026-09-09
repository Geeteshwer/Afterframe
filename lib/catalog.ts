export const genreIds:Record<string,number>={'Sci-Fi':878,Thriller:53,Romance:10749,Comedy:35,Drama:18,Musical:10402};
export function catalogUrl(query:string,genre:string,page:number){
  let path = 'movie/popular';
  if (query) path = 'search/movie';
  else if (genre === 'Now Playing') path = 'movie/now_playing';
  else if (genre === 'Coming Soon') path = 'movie/upcoming';
  else if (genre === 'Available to Stream' || genreIds[genre]) path = 'discover/movie';

  const url=new URL(`https://api.themoviedb.org/3/${path}`);
  url.searchParams.set('language','en-US');
  url.searchParams.set('page',String(Math.max(1,Math.min(500,Math.floor(page)||1))));
  url.searchParams.set('include_adult','false');

  if(genre === 'Now Playing' || genre === 'Coming Soon') {
    url.searchParams.set('region', 'IN');
  }

  if(query) url.searchParams.set('query',query);
  else if(genre === 'Available to Stream') {
    url.searchParams.set('with_watch_monetization_types', 'flatrate|free|ads');
    url.searchParams.set('watch_region', 'IN');
    url.searchParams.set('sort_by', 'popularity.desc');
  }
  else if(genreIds[genre]){
    url.searchParams.set('with_genres',String(genreIds[genre]));
    url.searchParams.set('sort_by','popularity.desc');
  }
  return url;
}
export function catalogMovie(m:any){const genres=Object.entries(genreIds).filter(([,id])=>m.genre_ids?.includes(id)).map(([name])=>name);return {id:m.id,title:m.title,year:Number(m.release_date?.slice(0,4))||0,genre:genres[0]||'Film',genres,poster:m.poster_path?`https://image.tmdb.org/t/p/w500${m.poster_path}`:'',overview:m.overview||''};}
