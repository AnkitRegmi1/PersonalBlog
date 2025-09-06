
import {useState} from 'react';
import apiBaseUrl from '../config';
import { Navigate } from 'react-router-dom';

export default function RegisterPage(){
    const[password,setPassword] = useState('');
    const[email,setEmail] = useState('');
    const[redirect,setRedirect] = useState(false);
    async function register(ev){
        ev.preventDefault();
        const res = await fetch(`${apiBaseUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (res.ok) setRedirect(true); else alert(await res.text());
    }
    if (redirect) return <Navigate to="/login" />
    return(
        <form className ="register" onSubmit={register}>
        <h1>Register</h1>
        <input type ="email" placeholder="email" value={email} onChange ={ev => setEmail(ev.target.value)} />
        <input type ="password" placeholder="password" value={password} onChange ={ev => setPassword(ev.target.value)} />
        <button> Register</button>
        </form>
    );
}