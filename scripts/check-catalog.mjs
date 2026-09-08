import assert from 'node:assert/strict';
import {catalogUrl,catalogMovie} from '../lib/catalog.ts';
let url=catalogUrl('','Romance',2);assert.equal(url.pathname,'/3/discover/movie');assert.equal(url.searchParams.get('with_genres'),'10749');assert.equal(url.searchParams.get('page'),'2');
url=catalogUrl('Past Lives','Sci-Fi',1);assert.equal(url.pathname,'/3/search/movie');assert.equal(url.searchParams.get('query'),'Past Lives');assert.equal(url.searchParams.has('with_genres'),false);
assert.equal(catalogUrl('','All films',Infinity).searchParams.get('page'),'500');
assert.equal(catalogUrl('','All films',-3).searchParams.get('page'),'1');
const film=catalogMovie({id:1,title:'Example',genre_ids:[18,10749],release_date:'2023-01-01'});assert.deepEqual(film.genres,['Romance','Drama']);assert.equal(film.poster,'');
console.log('Passed: full-catalog genre query, search precedence, pagination bounds, multi-genre movies and missing posters.');
