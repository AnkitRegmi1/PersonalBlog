import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import 'react-quill/dist/quill.snow.css';
import Editor from "../Editor";
import apiBaseUrl from '../config';



export default function CreatePost() {
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [content, setContent] = useState('');
    const [files, setFiles] = useState(null);
    const [video, setVideo] = useState(null);
    const [redirect, setRedirect] = useState(false);

    async function createNewPost(ev) {
        ev.preventDefault();
        const data = new FormData();
        data.set('title', title);
        data.set('summary', summary);
        data.set('content', content);
        if (files && files.length > 0) {
            data.set('file', files[0]);
        }
        if (video && video.length > 0) {
            data.set('video', video[0]);
        }

        const response = await fetch(`${apiBaseUrl}/post`, {
            method: 'POST',
            body: data,
            credentials: 'include',
        });

        if (response.ok) {
            setRedirect(true);
        } else {
            const errorData = await response.json();
            console.error('Error creating post:', errorData);
        }
    }

    if (redirect) {
        return <Navigate to="/" />;
    }

    return (
        <form onSubmit={createNewPost}>
            <input type="text" placeholder="Title" value={title} onChange={ev => setTitle(ev.target.value)} />
            <input type="text" placeholder="Summary" value={summary} onChange={ev => setSummary(ev.target.value)} />
            <div style={{marginTop:'6px'}}>
              <label style={{display:'block', marginBottom:4}}>Cover Image</label>
              <input type="file" accept="image/*" onChange={ev => setFiles(ev.target.files)} />
            </div>
            <div style={{marginTop:'6px'}}>
              <label style={{display:'block', marginBottom:4}}>Video (optional)</label>
              <input type="file" accept="video/*" onChange={ev => setVideo(ev.target.files)} />
            </div>
           <Editor value = {content} onChange={setContent}/>
            <button style={{ marginTop: '5px' }}>Create Post</button>
        </form>
    );
}
