import assert from 'node:assert/strict';
const origin='http://localhost:3001';
const movie={id:693134,title:'Dune: Part Two',year:2024,genre:'Sci-Fi',poster:'',overview:'Test'};
async function api(user,path,body,otherOrigin=origin){const headers={'origin':otherOrigin,'content-type':'application/json'};if(user){headers.cookie='__sites_local_auth=1';}const r=await fetch(origin+path,{headers,method:body?'POST':'GET',body:body?JSON.stringify(body):undefined});const text=await r.text();let data;try{data=JSON.parse(text)}catch{data={error:text}}return {status:r.status,data};}
assert.equal((await api(null,'/api/social',{action:'join'})).status,401);
assert.equal((await api('alice','/api/social',{action:'join'},'https://other.test')).status,403);
for(const name of ['alice'])assert.equal((await api(name,'/api/social',{action:'join',name})).status,200);
assert.equal((await api('alice','/api/social',{action:'save',movie})).status,200);
assert.equal((await api('alice','/api/social')).data.saved.length,1);
assert.equal((await api(null,'/api/social')).data.saved.length,0);
assert.equal((await api('alice','/api/social')).data.user.name,'alice');
assert.equal((await api('alice','/api/social',{action:'review',movie,body:'Local test review',rating:9,verdict:'theatre'})).status,400);
assert.equal((await api('alice','/api/social',{action:'review',movie,body:'Local test review',rating:4,verdict:'theatre'})).status,200);
assert.equal((await api('alice','/api/social',{action:'message',recipient:'test-bob',body:'Local test recommendation',movie})).status,200);
assert.equal((await api('alice','/api/social')).data.messages.length,1);

assert.equal((await api(null,'/api/social')).data.messages.length,0);
assert.equal((await api('alice','/api/social',{action:'save',movie,remove:true})).status,200);
assert.equal((await api('alice','/api/social')).data.saved.length,0);
assert.equal((await api(null,'/api/catalog?q=parasite')).data.movies[0].title,'Parasite');
assert.equal((await api('alice','/api/chat',{messages:[{role:'user',content:'Recommend a movie'}]})).status,503);
console.log('Passed: authentication, cross-origin checks, review validation, watchlist persistence and isolation, profile persistence, anonymous message privacy, catalog search, missing LLM key state.');
