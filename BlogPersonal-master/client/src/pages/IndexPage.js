import React, { useEffect, useState, useContext } from "react";
import Post from "../Post";
import HeroSlider from "../HeroSlider";
import apiBaseUrl from '../config';
import { UserContext } from "../UserContext";

export default function IndexPage() {
    const [posts, setPosts] = useState([]);
    const [email, setEmail] = useState('');
    const [subMsg, setSubMsg] = useState('');
    const { userInfo } = useContext(UserContext);

    useEffect(() => {
        fetch(`${apiBaseUrl}/post`)
            .then(response => response.json())
            .then(posts => {
                console.log(posts); // Log the posts data
                setPosts(posts);
            })
            .catch(error => console.error('Error fetching posts:', error));
    }, []);

    return (
        <>
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Blog</h1>
                <p className="text-gray-600 mb-6">Helpful tools, thoughtful articles and other findings from the web.</p>
                <form
                  onSubmit={async (e)=>{
                    e.preventDefault();
                    setSubMsg('');
                    if (!email) return;
                    const res = await fetch(`${apiBaseUrl}/subscribe`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email })
                    });
                    setSubMsg(res.ok ? 'Subscribed! 🎉' : 'Failed to subscribe');
                    if (res.ok) {
                      setEmail('');
                      // show a friendly confirmation
                      setSubMsg('Subscribed! You will receive weekly updates. Please check your email to confirm (Buttondown).');
                    }
                  }}
                  className="flex justify-center gap-2 max-w-md mx-auto"
                >
                    <input
                      className="subscribe-input flex-1 px-3 py-2 border border-gray-300 rounded text-black bg-white"
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={e=>setEmail(e.target.value)}
                      required
                    />
                    <button className="subscribe-btn px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" type="submit">Subscribe</button>
                </form>
                {subMsg && <div className="text-sm text-gray-600 mt-2">{subMsg}</div>}
                {/* Engagement prompt removed */}
            </div>
            <HeroSlider />
        </>
    );
}
