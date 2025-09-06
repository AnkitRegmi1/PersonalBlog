import React, { useEffect, useState } from 'react';
import apiBaseUrl from '../config';
import { Link } from 'react-router-dom';
import Post from '../Post';

export default function ListsPage(){
  const [posts,setPosts] = useState([]);
  useEffect(()=>{
    fetch(`${apiBaseUrl}/post`).then(r=>r.json()).then(setPosts).catch(()=>{});
  },[]);
  return (
    <div>
      <h2>All Posts</h2>
      <div>
        {posts.length > 0 && posts.map(post => (
          <Post key={post._id} {...post} />
        ))}
      </div>
    </div>
  );
}

