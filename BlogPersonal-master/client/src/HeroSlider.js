import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import apiBaseUrl from './config';

export default function HeroSlider() {
  const [posts, setPosts] = useState([]);
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch(`${apiBaseUrl}/post`)
      .then(r => r.json())
      .then(list => setPosts(list || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (posts.length) setIdx(0); // show latest first when posts load
    if (timerRef.current) clearInterval(timerRef.current);
    if (posts.length) {
      timerRef.current = setInterval(() => {
        setIdx(i => (i + 1) % posts.length);
      }, 4500);
    }
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [posts]);

  if (!posts.length) return null;
  const post = posts[idx];

  return (
    <section className="hero-slider">
      <article className="hero-card">
        <div className="hero-nav">
          <button className="hero-arrow" onClick={() => setIdx(i => (i - 1 + posts.length) % posts.length)} aria-label="Previous">‹</button>
          <button className="hero-arrow" onClick={() => setIdx(i => (i + 1) % posts.length)} aria-label="Next">›</button>
        </div>
        <Link to={`/post/${post._id}`} className="hero-link">
          <img src={post.cover?.startsWith('http') ? post.cover : `${apiBaseUrl}/${post.cover}`} alt="" className="hero-image" />
          <div className="hero-texts">
            <h3 className="hero-title">{post.title}</h3>
            <p className="hero-summary">{post.summary}</p>
          </div>
        </Link>
      </article>
    </section>
  );
}


