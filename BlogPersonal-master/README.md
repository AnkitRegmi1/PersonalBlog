# Personal Blog Project

A full-stack blog application built with React and Node.js/Express, originally from The Odin Project.

## Features

- User authentication (register/login)
- Create, edit, and delete blog posts
- Image upload for post covers
- Rich text editor for post content
- Responsive design

## Tech Stack

- **Frontend**: React, React Router, React Quill (rich text editor)
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Authentication**: JWT with cookies
- **File Upload**: Multer
- **Styling**: CSS

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd BlogPersonal-master
   ```

2. **Set up the backend:**
   ```bash
   cd api
   npm install
   ```

3. **Set up the frontend:**
   ```bash
   cd ../client
   npm install
   ```

4. **Configure environment variables:**
   
   Copy `api/env.example` to `api/.env` and update the values:
   ```bash
   cd api
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```
   MONGODB_URI=mongodb://localhost:27017/blog
   JWT_SECRET=your-super-secret-jwt-key
   CLIENT_URL=http://localhost:3000
   PORT=4000
   ```

### Running the Application

1. **Start the backend server:**
   ```bash
   cd api
   npm run dev
   ```
   The API will run on http://localhost:4000

2. **Start the frontend (in a new terminal):**
   ```bash
   cd client
   npm start
   ```
   The app will open at http://localhost:3000

## Database Setup

### Option 1: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use `mongodb://localhost:27017/blog` in your `.env` file

### Option 2: MongoDB Atlas (Recommended for production)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in your `.env` file

## Deployment

### Backend (Vercel)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Frontend (Netlify/Vercel)
1. Build the frontend: `npm run build`
2. Deploy the `build` folder to Netlify or Vercel
3. Update `CLIENT_URL` in backend environment variables

## Project Structure

```
BlogPersonal-master/
├── api/                 # Backend API
│   ├── models/         # MongoDB models
│   ├── uploads/        # Uploaded images
│   ├── index.js        # Main server file
│   └── package.json    # Backend dependencies
├── client/             # React frontend
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── App.js      # Main app component
│   │   └── ...
│   └── package.json    # Frontend dependencies
└── README.md
```

## API Endpoints

- `POST /register` - User registration
- `POST /login` - User login
- `GET /profile` - Get user profile
- `POST /logout` - User logout
- `POST /post` - Create new post
- `PUT /post` - Update post
- `GET /post` - Get all posts
- `GET /post/:id` - Get single post

## Contributing

Feel free to fork this project and submit pull requests for any improvements!

## License

This project is open source and available under the [MIT License](LICENSE).
