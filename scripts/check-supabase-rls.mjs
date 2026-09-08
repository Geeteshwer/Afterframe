// Run with PGLITE_MODULE pointing to a separately installed @electric-sql/pglite module.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const {PGlite}=await import(process.env.PGLITE_MODULE||'@electric-sql/pglite');
const db=new PGlite();
await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth, public to authenticated; grant execute on function auth.uid() to authenticated;`);
await db.exec(fs.readFileSync(new URL('../supabase/migrations/202609080001_afterframe.sql',import.meta.url),'utf8'));
const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002',c='00000000-0000-4000-8000-000000000003';
for(const [id,name] of [[a,'Alice'],[b,'Bob'],[c,'Carol']])await db.query('insert into auth.users values($1,$2)',[id,JSON.stringify({username:name})]);
async function as(id){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');}
await as(a);const club=(await db.query("select public.create_film_club('Cinema Club') as id")).rows[0].id;const code=(await db.query('select join_code from public.clubs where id=$1',[club])).rows[0].join_code;
await db.query("insert into public.reviews(user_id,movie_id,movie_title) values($1,129,'Spirited Away')",[a]);
await as(b);assert.equal((await db.query('select * from public.reviews')).rows.length,0);
await assert.rejects(db.query('insert into public.memberships values($1,$2)',[club,b]));
await db.query('select public.join_film_club($1)',[code]);assert.equal((await db.query('select * from public.reviews')).rows.length,1);
await db.query("update public.reviews set review_text='Not mine' where user_id=$1",[a]);
assert.equal((await db.query('select review_text from public.reviews')).rows[0].review_text,'');
await assert.rejects(db.query("insert into public.reviews(user_id,movie_id,movie_title) values($1,99,'Forged')",[a]));
await assert.rejects(db.query('insert into public.recommendations(club_id,sender_id,receiver_id,movie_id,movie_title,note) values($1,$2,$3,129,$4,$5)',[club,a,b,'Forged sender','Forbidden']));
await db.query("update public.profiles set username='Forged' where id=$1",[a]);assert.equal((await db.query('select username from public.profiles where id=$1',[a])).rows[0].username,'Alice');
await as(a);await db.query('insert into public.recommendations(club_id,sender_id,receiver_id,movie_id,movie_title,note) values($1,$2,$3,129,$4,$5)',[club,a,b,'Spirited Away','Watch this!']);
await assert.rejects(db.query('insert into public.recommendations(club_id,sender_id,receiver_id,movie_id,movie_title,note) values($1,$2,$3,129,$4,$5)',[club,a,c,'Spirited Away','Cross-club forbidden']));
await db.exec('update public.recommendations set is_read=true');assert.equal((await db.query('select is_read from public.recommendations')).rows[0].is_read,false);
await as(b);await db.exec('update public.recommendations set is_read=true');assert.equal((await db.query('select is_read from public.recommendations')).rows[0].is_read,true);
await assert.rejects(db.exec("update public.recommendations set note='Tampered'"));
await as(c);assert.equal((await db.query('select * from public.profiles')).rows.length,1);assert.equal((await db.query('select * from public.reviews')).rows.length,0);assert.equal((await db.query('select * from public.recommendations')).rows.length,0);
await db.exec('reset role; set role anon');await assert.rejects(db.exec('select * from public.reviews'));
await db.close();console.log('Passed: profile trigger, club creation/join, RLS recursion, shared-club reads, ownership restrictions, forged sender/recipient rejection, read-receipt column permissions, stranger and anonymous isolation.');
