'use client';
import {useState} from 'react';
import {Tabs,TabsList,TabsTrigger} from '@/components/ui/tabs';

export function AuthForm({onAuthenticated}:{onAuthenticated:()=>Promise<void>}) {
  const [mode,setMode]=useState('login');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [username,setUsername]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');

  return (
    <div className="stack">
      <Tabs value={mode} onValueChange={v=>{setMode(String(v));setMessage('')}}>
        <TabsList>
          <TabsTrigger value="login">Sign in</TabsTrigger>
          <TabsTrigger value="signup">Create account</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="stack" style={{marginTop: '1rem'}}>
        <a href="/api/auth/google" className="lime" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', background: '#fff', color: '#000'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </a>
        
        <div style={{display: 'flex', alignItems: 'center', margin: '1rem 0', opacity: 0.5}}>
          <div style={{flex: 1, height: '1px', background: 'currentColor'}}></div>
          <span style={{padding: '0 1rem', fontSize: '0.85rem'}}>or with email</span>
          <div style={{flex: 1, height: '1px', background: 'currentColor'}}></div>
        </div>
      </div>

      <form className="stack" onSubmit={async e=>{
        e.preventDefault();
        setBusy(true);
        setMessage('');
        try{
          const r=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:mode,email,password,username})});
          const d=await r.json() as any;
          if(!r.ok)throw new Error(d.error);
          setPassword('');
          if(d.authenticated)await onAuthenticated();
          else {setMessage(d.message);setMode('login');}
        }catch(e){
          setMessage((e as Error).message)
        }finally{
          setBusy(false)
        }
      }}>
        {mode==='signup'&&<label>Username<input required maxLength={60} autoComplete="nickname" value={username} onChange={e=>setUsername(e.target.value)}/></label>}
        <label>Email<input required type="email" maxLength={254} autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
        <label>Password<input required type="password" minLength={8} maxLength={128} autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label>
        <button className="lime" disabled={busy}>{busy?'Please wait…':mode==='login'?'Sign in':'Create account'}</button>
      </form>
      
      {message&&<p role="status">{message}</p>}
      <p className="optional-hint">Sign in to save films and connect with your club. New accounts may need email confirmation.</p>
    </div>
  );
}
