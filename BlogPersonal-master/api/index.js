const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const Subscriber = require('./models/Subscriber');
const Verification = require('./models/Verification');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const cron = require('node-cron');
// Clerk removed

const uploadMiddleware = multer({ dest: 'uploads/' });

const salt = bcrypt.genSaltSync(10);
const secret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Email transport (configure for production)
const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || undefined,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
});

app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

// Database connection (supports in-memory Mongo for local dev if no URI is provided)
async function connectDatabase() {
    let mongoUri = process.env.MONGODB_URI;
    if (!mongoUri || mongoUri.trim() === '') {
        try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mem = await MongoMemoryServer.create();
            mongoUri = mem.getUri();
            console.log('Using in-memory MongoDB instance');
        } catch (err) {
            console.error('Failed to start in-memory MongoDB. Provide MONGODB_URI in .env.', err);
            throw err;
        }
    }
    console.log('Connecting to MongoDB:', mongoUri.replace(/:[^@]*@/, ':*****@'));
    await mongoose.connect(mongoUri, { dbName: process.env.MONGODB_DB || undefined });
    console.log('MongoDB connected');
}

// Cloudinary config
if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

// Registration: single-step (email + password). First user becomes admin; afterwards disabled.
app.post('/register', async (req, res) => {
    try {
        const { password, email } = req.body;
        if (!password || !email) {
            return res.status(400).json('password and email are required');
        }
        const normalizedEmail = String(email).trim().toLowerCase();
        // Allow registration only if there is NO admin yet
        const hasAdmin = await User.exists({ role: 'admin' });
        if (hasAdmin) {
            return res.status(403).json('Registration is disabled');
        }
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) return res.status(400).json('User already exists');
        const passwordHash = bcrypt.hashSync(password, salt);
        const role = 'admin';
        const username = normalizedEmail.split('@')[0];
        const userDoc = await User.create({ username, password: passwordHash, email: normalizedEmail, role });
        return res.json({ id: userDoc._id, email: userDoc.email, role: userDoc.role });
    } catch (e) {
        console.error(e);
        res.status(500).json('Failed to register');
    }
});

// Step 2: verify code and create user
// Legacy endpoints off
app.post('/register/request-code', async (req, res) => res.status(410).json('Registration via code disabled'));
app.post('/register/verify', async (req, res) => res.status(410).json('Registration via code disabled'));

app.post('/login', async (req, res) => {
    const { password, email } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const userDoc = await User.findOne({ email: normalizedEmail });

    if (!userDoc) {
        return res.status(400).json('incorrect email or password');
    }

    const passOk = bcrypt.compareSync(password, userDoc.password);

    if (passOk) {
        // If admin exists, require email for admin login only.
        // Email already used for login
        
        const isProduction = process.env.NODE_ENV === 'production';
        jwt.sign({ email: userDoc.email, id: userDoc._id, role: userDoc.role }, secret, {}, (err, token) => {
            if (err) throw err;
            res
                .cookie('token', token, {
                    httpOnly: true,
                    sameSite: isProduction ? 'none' : 'lax',
                    secure: isProduction,
                })
                .json({ id: userDoc._id, email: userDoc.email, role: userDoc.role });
        });
    } else {
        res.status(400).json('incorrect email or password');
    }
});

app.get('/profile', (req, res) => {
    const { token } = req.cookies;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    jwt.verify(token, secret, {}, (err, info) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        res.json(info);
    });
});

app.post('/logout', (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    res
        .cookie('token', '', {
            httpOnly: true,
            sameSite: isProduction ? 'none' : 'lax',
            secure: isProduction,
            expires: new Date(0),
        })
        .json('logged out');
});

// Clerk attach removed

app.post('/post', uploadMiddleware.fields([{ name: 'file', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
    try {
        let filePath = null;
        let uploadedUrl = null;
        let cloudPublicId = null;
        const imageFile = req.files && req.files.file && req.files.file[0];
        const videoFile = req.files && req.files.video && req.files.video[0];
        if (imageFile) {
            const { originalname, path } = imageFile;
            const parts = originalname.split('.');
            const ext = parts[parts.length - 1];
            filePath = path + '.' + ext;
            fs.renameSync(path, filePath);
            // Normalize for URL usage on Windows
            filePath = filePath.replace(/\\/g, '/');
            if (process.env.CLOUDINARY_CLOUD_NAME) {
                const up = await cloudinary.uploader.upload(filePath, { resource_type: 'auto', folder: 'blog/cover' });
                uploadedUrl = up.secure_url;
                cloudPublicId = up.public_id;
                try { fs.unlinkSync(filePath); } catch {}
            }
        }
        let videoUrlFinal = null;
        if (videoFile) {
            const { originalname, path } = videoFile;
            const parts = originalname.split('.');
            const ext = parts[parts.length - 1];
            const tempVideoPath = path + '.' + ext;
            fs.renameSync(path, tempVideoPath);
            if (process.env.CLOUDINARY_CLOUD_NAME) {
                const upv = await cloudinary.uploader.upload(tempVideoPath, { resource_type: 'video', folder: 'blog/video' });
                videoUrlFinal = upv.secure_url;
                try { fs.unlinkSync(tempVideoPath); } catch {}
            } else {
                // Normalize for URL usage on Windows
                videoUrlFinal = (tempVideoPath || '').replace(/\\/g, '/');
            }
        }

        const { token } = req.cookies;
        jwt.verify(token, secret, {}, async (err, info) => {
            if (err) throw err;
            if (info.role !== 'admin') {
                return res.status(403).json({ error: 'Only admins can create posts' });
            }
            const { title, summary, content } = req.body;
            const postDoc = await Post.create({
                title,
                summary,
                content,
                cover: uploadedUrl || filePath,
                videoUrl: videoUrlFinal || null,
                author: info.id,
                cloudPublicId: cloudPublicId || undefined,
            });
            res.json(postDoc);
        });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/post', uploadMiddleware.fields([{ name: 'file', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
    let newPath = null;
    const imageFile = req.files && req.files.file && req.files.file[0];
    const videoFile = req.files && req.files.video && req.files.video[0];
    if (imageFile) {
        const { originalname, path } = imageFile;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        newPath = path + '.' + ext;
        fs.renameSync(path, newPath);
    }

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err;

        const { id, title, summary, content } = req.body;

        try {
            const postDoc = await Post.findById(id);

            if (!postDoc) {
                return res.status(404).json({ error: 'Post not found' });
            }

            const isAuthor = postDoc.author.equals(info.id);
            if (!isAuthor) {
                return res.status(400).json('You are not the author');
            }
            if (info.role !== 'admin') {
                return res.status(403).json({ error: 'Only admins can edit posts' });
            }

            // Update the post document
            postDoc.title = title;
            postDoc.summary = summary;
            postDoc.content = content;
            if (newPath) {
                let newUrl = newPath;
                if (process.env.CLOUDINARY_CLOUD_NAME) {
                    const up = await cloudinary.uploader.upload(newPath, { resource_type: 'auto', folder: 'blog/cover' });
                    newUrl = up.secure_url;
                    if (postDoc.cloudPublicId) { try { await cloudinary.uploader.destroy(postDoc.cloudPublicId, { resource_type: 'image' }); } catch {} }
                    postDoc.cloudPublicId = up.public_id;
                    try { fs.unlinkSync(newPath); } catch {}
                }
                postDoc.cover = newUrl;
            }
            if (videoFile) {
                const { originalname, path } = videoFile;
                const parts = originalname.split('.');
                const ext = parts[parts.length - 1];
                const tmp = path + '.' + ext;
                fs.renameSync(path, tmp);
                let vurl = tmp;
                if (process.env.CLOUDINARY_CLOUD_NAME) {
                    const upv = await cloudinary.uploader.upload(tmp, { resource_type: 'video', folder: 'blog/video' });
                    vurl = upv.secure_url;
                    try { fs.unlinkSync(tmp); } catch {}
                }
                postDoc.videoUrl = vurl;
            }
            await postDoc.save();

            res.json(postDoc);
        } catch (error) {
            console.error('Error updating post:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
});

// Weekly digest (Monday 09:00 server time)
async function sendWeeklyDigest(posts) {
    const subject = 'Weekly Digest';
    const lines = posts.map(p => `• ${p.title}`).join('\n');
    // Prefer Buttondown if configured
    if (process.env.BUTTONDOWN_API_KEY) {
        try {
            const body = `New posts this week:\n\n${lines}\n\nRead more at ${process.env.CLIENT_URL || 'http://localhost:3000'}`;
            await fetch('https://api.buttondown.email/v1/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${process.env.BUTTONDOWN_API_KEY}`,
                },
                body: JSON.stringify({ subject, body })
            });
            console.log('Digest sent via Buttondown');
            return;
        } catch (e) {
            console.warn('Buttondown digest failed, falling back to SMTP:', e.message);
        }
    }
    // Fallback: SMTP to each subscriber
    if (transporter.options.host || transporter.options.service) {
        const subs = await Subscriber.find();
        const text = `New posts this week:\n\n${lines}\n`;
        for (const s of subs) {
            await transporter.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to: s.email, subject, text });
        }
        console.log('Digest sent to', subs.length, 'subscribers via SMTP');
    }
}

cron.schedule('0 9 * * 1', async () => {
    try {
        const oneWeekAgo = new Date(Date.now() - 7*24*60*60*1000);
        const posts = await Post.find({ createdAt: { $gte: oneWeekAgo } }).sort({ createdAt: -1 });
        if (!posts.length) return;
        await sendWeeklyDigest(posts);
    } catch (e) {
        console.error('Digest error:', e);
    }
});

// Admin trigger digest now
app.post('/admin/digest-now', async (req, res) => {
    try {
        const { token } = req.cookies;
        const info = jwt.verify(token, secret);
        if (info.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const oneWeekAgo = new Date(Date.now() - 7*24*60*60*1000);
        const posts = await Post.find({ createdAt: { $gte: oneWeekAgo } }).sort({ createdAt: -1 });
        if (!posts.length) return res.json({ ok: true, message: 'No new posts' });
        await sendWeeklyDigest(posts);
        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to send digest' });
    }
});




app.get('/post', async (req, res) => {
    res.json(
        await Post.find()
            .populate('author', ['username'])
            .sort({ createdAt: -1 })
            .limit(20)
    );
});

app.get('/post/:id', async (req, res) => {
    const { id } = req.params;
    const postDoc = await Post.findById(id).populate('author',['username']);
    res.json(postDoc);
});

// Delete post (admin or author)
app.delete('/post/:id', async (req, res) => {
    try {
        const { token } = req.cookies;
        const info = jwt.verify(token, secret);
        const { id } = req.params;
        const postDoc = await Post.findById(id);
        if (!postDoc) return res.status(404).json({ error: 'Post not found' });
        const isAuthor = postDoc.author.equals(info.id);
        const isAdmin = info.role === 'admin';
        if (!isAuthor && !isAdmin) return res.status(403).json({ error: 'Forbidden' });
        // Delete media from Cloudinary if present
        try {
            if (process.env.CLOUDINARY_CLOUD_NAME && postDoc.cloudPublicId) {
                await cloudinary.uploader.destroy(postDoc.cloudPublicId, { resource_type: 'image' });
            }
        } catch {}
        await postDoc.deleteOne();
        res.json({ ok: true });
    } catch (e) {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

// Like toggle
// Likes disabled
app.post('/post/:id/like', async (req, res) => {
    res.status(403).json({ error: 'Likes disabled' });
});

// Comments
// Comments disabled
app.get('/post/:id/comments', async (req, res) => {
    res.json([]);
});

app.post('/post/:id/comments', async (req, res) => {
    res.status(403).json({ error: 'Comments disabled' });
});

// Subscriptions
app.post('/subscribe', async (req, res) => {
    const { email } = req.body;
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return res.status(400).json({ error: 'Valid email is required' });
    }
    try {
        const normalizedEmail = email.toLowerCase();
        const existing = await Subscriber.findOne({ email: normalizedEmail });
        if (!existing) {
            await Subscriber.create({ email: normalizedEmail });
        }
        // Buttondown: add subscriber (double opt-in handled by Buttondown)
        if (process.env.BUTTONDOWN_API_KEY) {
            try {
                const bdRes = await fetch('https://api.buttondown.email/v1/subscribers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${process.env.BUTTONDOWN_API_KEY}`,
                    },
                    body: JSON.stringify({ email_address: normalizedEmail })
                });
                if (!bdRes.ok) {
                    const body = await bdRes.text();
                    console.warn('Buttondown subscribe error:', bdRes.status, body);
                }
            } catch (e) {
                console.warn('Buttondown subscribe failed (continuing):', e.message);
            }
        }
        // Send a friendly welcome/confirmation reminder via SMTP (optional)
        try {
            if (transporter.options.host || transporter.options.service) {
                await transporter.sendMail({
                    from: process.env.MAIL_FROM || process.env.SMTP_USER,
                    to: normalizedEmail,
                    subject: 'You’re subscribed to weekly updates',
                    text: 'Thanks for subscribing! If this is your first time, please confirm via the email from Buttondown. You will receive weekly blog updates every Monday.\n\nIf you don\'t see the confirmation, check your spam/promotions folder.'
                });
            }
        } catch (e) { console.warn('SMTP welcome failed:', e.message); }

        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to subscribe' });
    }
});

const PORT = process.env.PORT || 4000;
(async () => {
    try {
        await connectDatabase();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
})();
