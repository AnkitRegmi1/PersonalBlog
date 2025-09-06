import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import apiBaseUrl from './config';

export default function PostCarousel() {
  const [posts, setPosts] = useState([]);
  const trackRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch(`${apiBaseUrl}/post`)
      .then(r => r.json())
      .then(setPosts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || posts.length === 0) return;

    const start = () => {
      stop();
      timerRef.current = setInterval(() => {
        const cardWidth = track.firstChild ? track.firstChild.getBoundingClientRect().width : 0;
        const gap = parseInt(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '16', 10);
        const step = cardWidth + gap;
        const maxScroll = track.scrollWidth - track.clientWidth;
        let next = track.scrollLeft + step;
        if (next > maxScroll + 10) next = 0;
        track.scrollTo({ left: next, behavior: 'smooth' });
      }, 4000);
    };

    const stop = () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };

    start();
    track.addEventListener('mouseenter', stop);
    track.addEventListener('mouseleave', start);
    return () => {
      stop();
      track.removeEventListener('mouseenter', stop);
      track.removeEventListener('mouseleave', start);
    };
  }, [posts]);

  if (!posts || posts.length < 2) return null;

  return (
    <section className="carousel">
      <div className="carousel-track" ref={trackRef}>
        {posts.map(post => (
          <article key={post._id} className="carousel-card">
            <Link to={`/post/${post._id}`} className="carousel-link">
              <img className="carousel-image" src={`${apiBaseUrl}/${post.cover}`} alt="" />
              <div className="carousel-texts">
                <h3 className="carousel-title">{post.title}</h3>
                <p className="carousel-summary">{post.summary}</p>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}


