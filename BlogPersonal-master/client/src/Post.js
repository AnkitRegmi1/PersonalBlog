import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import apiBaseUrl from './config';

export default function Post({_id, title, summary, cover, content, createdAt, author }) {
    return (
        <div className="post">
            <div className="image">
              <Link to ={`/post/${_id}`}><img src={cover?.startsWith('http') ? cover : `${apiBaseUrl}/${cover}`} alt="" /></Link>
            </div>
            <div className="texts">
            <Link to = {`/post/${_id}`}><h2>{title}</h2></Link>
                <p className="info">
                    <a href="#" className="author">{author ? author.username : 'Unknown Author'}</a>
                    <time>{format(new Date(createdAt), 'MMM d, yyyy HH:mm ')}</time>
                </p>
                <p className="summary">{summary}</p>
            </div>
        </div>
    );
}
