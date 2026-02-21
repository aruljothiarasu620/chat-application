# Chatter — Real-time Chat Application

A full-stack real-time chat app built with **React**, **Node.js/Express**, **Socket.io**, and **SQLite**.

## Features
- ✅ User registration & login (JWT authentication)
- ✅ Real-time messaging via Socket.io WebSockets
- ✅ One-to-one direct conversations
- ✅ Typing indicators
- ✅ Persistent message history (SQLite)
- ✅ Beautiful dark-mode UI

---

## Prerequisites
- Node.js ≥ 18

---

## Step 1: Set Up Database (Automatic)

The application now uses **SQLite**, so no manual database installation is required! The database file (`database.sqlite`) will be created automatically in the `chat-backend` directory when you start the server.

---

## Step 2: Configure Backend Environment

Edit `chat-backend/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword   # ← change this
DB_NAME=chat_app
JWT_SECRET=supersecretjwtkey_changeme_in_production   # ← change this
PORT=5000
```

---

## Step 3: Start the Backend

```bash
cd chat-backend
npm run dev     # uses nodemon for auto-reload
# or
npm start       # plain node
```

The API will be available at `http://localhost:5000`.

---

## Step 4: Start the Frontend

```bash
cd chat-frontend
npm run dev
```

The UI will open at `http://localhost:5173`.

---

## Project Structure

```
chat app/
├── chat-backend/
│   ├── server.js          # Entry point — Express + Socket.io
│   ├── db.js              # MySQL connection pool
│   ├── schema.sql         # Database schema
│   ├── .env               # Environment variables
│   ├── routes/
│   │   ├── auth.js        # POST /api/auth/register & /login
│   │   ├── conversations.js
│   │   └── messages.js
│   ├── middleware/
│   │   └── auth.js        # JWT verification middleware
│   └── socket/
│       └── index.js       # Socket.io event handlers
└── chat-frontend/
    └── src/
        ├── App.jsx
        ├── api/axios.js   # Axios instance with auto-token
        ├── context/AuthContext.jsx
        ├── sockets/socket.js
        └── components/
            ├── Login.jsx
            ├── Signup.jsx
            ├── ConversationList.jsx
            ├── ChatWindow.jsx
            └── MessageInput.jsx
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/conversations` | ✅ | List my conversations |
| POST | `/api/conversations` | ✅ | Start new conversation |
| GET | `/api/conversations/:id/messages` | ✅ | Get messages |
| POST | `/api/messages` | ✅ | Send a message |

## Socket.io Events

| Event (client → server) | Description |
|--------------------------|-------------|
| `joinConversation` | Join a conversation room |
| `leaveConversation` | Leave a conversation room |
| `typing` | Emit while typing |
| `stopTyping` | Emit when typing stops |

| Event (server → client) | Description |
|--------------------------|-------------|
| `newMessage` | Broadcasted when a message is sent |
| `userTyping` | Another user is typing |
| `userStoppedTyping` | User stopped typing |
