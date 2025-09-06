import { Link } from "react-router-dom";
import { useState, useEffect, useContext } from 'react';
import { UserContext } from "./UserContext";
import apiBaseUrl from './config';

export default function Header() {
    const { userInfo, setUserInfo } = useContext(UserContext);
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        fetch(`${apiBaseUrl}/profile`, { credentials: 'include' })
            .then(r => r.ok ? r.json() : null)
            .then(info => { if (info) setUserInfo(info); })
            .catch(() => {});
    }, []);

    // On initial load, if cookie-based session exists, populate userInfo
    useEffect(() => {
        const saved = localStorage.getItem('theme');
        const initial = saved === 'dark' ? 'dark' : 'light';
        setTheme(initial);
        document.body.classList.toggle('dark', initial === 'dark');
    }, []);

    function toggleTheme(){
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('theme', next);
        document.body.classList.toggle('dark', next === 'dark');
    }

    function logout() {
        fetch(`${apiBaseUrl}/logout`, {
            credentials: 'include',
            method: 'POST'
        })
        .then(() => {
            setUserInfo(null);
        })
        .catch(error => {
            console.error('Logout failed:', error);
        });
    }

    // Ensure username is defined before accessing it
    const username = userInfo?.email;
    const isAdmin = userInfo?.role === 'admin';

    return (
        <header>
            <Link to="/" className="logo">AR</Link>
            <nav style={{marginTop:'10px', display:'flex', gap:'16px'}}>
                <Link to="/">Home</Link>
                <Link to="/lists">Lists</Link>
                {isAdmin && <Link to="/create">New Post</Link>}
                <button
                  onClick={toggleTheme}
                  className="theme-toggle"
                  aria-label={theme==='dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >{theme==='dark' ? '☀️' : '🌙'}</button>
                {username && <a onClick={logout} style={{marginLeft:'auto'}}>Logout</a>}
            </nav>
        </header>
    );
}
