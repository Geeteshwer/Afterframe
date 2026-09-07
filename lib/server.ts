import {env} from 'cloudflare:workers';
export function database(){if(!env.DB)throw new Error('Database is unavailable. Please try again shortly.');return env.DB;}
export function secret(name:string):string|undefined{return (env as unknown as Record<string,string>)[name]}
export function failure(error:unknown,status=400){return Response.json({error:error instanceof Error?error.message:'Something went wrong. Please try again.'},{status})}
