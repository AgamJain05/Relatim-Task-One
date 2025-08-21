# WhatsApp Clone - Full Stack Messaging Application

A modern, full-stack messaging application built with the MERN stack and PostgreSQL, featuring real-time chat, contact management, and a beautiful WhatsApp-inspired UI.

![Tech Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20PostgreSQL-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Version](https://img.shields.io/badge/Version-1.0.0-orange)

## 🚀 Features

### Core Functionality
- **Real-time Messaging**: Instant messaging with Socket.io
- **User Authentication**: Secure JWT-based login/registration
- **Contact Management**: Add, edit, and organize contacts
- **Message Threads**: Organized conversation history
- **Online Status**: See who's currently online
- **Typing Indicators**: Real-time typing status
- **Modern UI**: WhatsApp-inspired responsive design

### Technical Features
- **REST API**: Comprehensive backend API
- **Real-time WebSocket**: Socket.io for instant messaging
- **Database Migrations**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT tokens with refresh capability
- **State Management**: Zustand for frontend state
- **Form Handling**: React Hook Form with validation
- **Responsive Design**: Mobile-first Tailwind CSS
- **Error Handling**: Comprehensive error management
- **Loading States**: Beautiful loading animations

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Sequelize** - ORM for database operations
- **Socket.io** - Real-time communication
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Frontend
- **React.js** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Zustand** - Client state management
- **React Hook Form** - Form handling
- **Socket.io Client** - Real-time communication
- **Lucide React** - Icon library
- **React Hot Toast** - Notifications

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Nodemon** - Auto-restart server
- **Concurrently** - Run multiple commands

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd whatsapp-clone
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (backend + frontend)
npm run install-all
```

### 3. Database Setup

#### Create PostgreSQL Database
```sql
CREATE DATABASE whatsapp_clone;
CREATE USER whatsapp_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE whatsapp_clone TO whatsapp_user;
```

#### Configure Environment Variables
Create a `.env` file in the `backend` directory:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=whatsapp_clone
DB_USERNAME=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CLIENT_URL=http://localhost:3000
```

Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

#### Run Database Migrations and Seeds
```bash
cd backend
npm run db:setup
```

### 4. Start the Application

#### Development Mode (Both servers)
```bash
# From root directory
npm run dev
```

#### Or start individually:

**Backend Server:**
```bash
cd backend
npm run dev
```

**Frontend Development Server:**
```bash
cd frontend
npm run dev
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/health

## 👥 Demo Accounts

The application comes with pre-seeded demo accounts for testing:

| Email | Password | Description |
|-------|----------|-------------|
| john@example.com | password123 | Demo user with sample conversations |
| jane@example.com | password123 | Demo user with sample conversations |
| ai@bot.com | password123 | AI Bot (placeholder for future AI integration) |
| alice@example.com | password123 | Additional demo user |
| bob@example.com | password123 | Additional demo user |

## 📁 Project Structure

```
whatsapp-clone/
├── backend/                  # Node.js/Express backend
│   ├── config/              # Database and app configuration
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Authentication and error handling
│   ├── models/             # Sequelize database models
│   ├── routes/             # API route definitions
│   ├── seeders/            # Database seed data
│   ├── utils/              # Utility functions
│   └── server.js           # Entry point
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── store/          # State management
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── index.html          # HTML template
├── package.json            # Root package configuration
└── README.md              # Project documentation
```

## 🔄 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Chat Endpoints
- `POST /api/chat/messages` - Send a message
- `GET /api/chat/conversations` - Get user conversations
- `GET /api/chat/messages/:userId` - Get messages with specific user
- `DELETE /api/chat/messages/:messageId` - Delete a message

### Contact Endpoints
- `GET /api/contacts` - Get user contacts
- `POST /api/contacts` - Add new contact
- `PUT /api/contacts/:contactId` - Update contact
- `DELETE /api/contacts/:contactId` - Delete contact
- `GET /api/contacts/search/users` - Search users to add as contacts

### WebSocket Events
- `send_message` - Send a new message
- `new_message` - Receive a new message
- `typing` - Send typing indicator
- `user_typing` - Receive typing indicator
- `user_online` - User came online
- `user_offline` - User went offline

## 🏗️ Architecture & Design Decisions

### Why PostgreSQL with MERN?
- **ACID Compliance**: Ensures data consistency for critical messaging data
- **Complex Relationships**: Better handling of user relationships and message threading
- **Scalability**: PostgreSQL scales well for read-heavy applications
- **Full-text Search**: Built-in search capabilities for messages and contacts
- **JSON Support**: Combines relational structure with NoSQL flexibility

### Real-time Strategy
- **Socket.io**: Provides reliable real-time communication with fallback options
- **Event-driven Architecture**: Clean separation of concerns for real-time features
- **Optimistic Updates**: UI updates immediately with Socket.io confirmation
- **Fallback to REST**: Graceful degradation when WebSocket unavailable

### State Management
- **Zustand**: Lightweight state management for authentication
- **React Query**: Server state management with caching and background updates
- **Local Storage**: Persistent authentication state

### UI/UX Considerations
- **Mobile-first Design**: Responsive layout optimized for mobile devices
- **WhatsApp-inspired**: Familiar UI patterns for better user experience
- **Progressive Loading**: Smooth loading states and skeleton screens
- **Error Boundaries**: Graceful error handling and user feedback

## 🚧 Future Improvements

### Phase 1: Enhanced Messaging
- [ ] **File Attachments**: Support for images, documents, and media
- [ ] **Voice Messages**: Audio recording and playback
- [ ] **Message Reactions**: Emoji reactions to messages
- [ ] **Message Replies**: Thread-like message replies
- [ ] **Message Search**: Full-text search across conversations

### Phase 2: AI Integration
- [ ] **AI Chat Bot**: Intelligent automated responses
- [ ] **Message Suggestions**: AI-powered quick replies
- [ ] **Language Translation**: Real-time message translation
- [ ] **Smart Notifications**: AI-filtered important messages

### Phase 3: Advanced Features
- [ ] **Group Chats**: Multi-user conversations
- [ ] **Video Calls**: WebRTC-based video communication
- [ ] **Message Encryption**: End-to-end encryption
- [ ] **Push Notifications**: Browser and mobile notifications
- [ ] **Message Backup**: Cloud backup and sync

### Phase 4: Scale & Performance
- [ ] **Message Pagination**: Infinite scroll for large conversations
- [ ] **Redis Caching**: Performance optimization
- [ ] **CDN Integration**: Media file delivery optimization
- [ ] **Microservices**: Service decomposition for scalability
- [ ] **Docker Deployment**: Containerized deployment

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

### Test Coverage
- Unit tests for utility functions
- Integration tests for API endpoints
- Component tests for React components
- E2E tests for critical user flows

## 🚀 Deployment

### Environment Setup
1. **Database**: Set up PostgreSQL instance
2. **Environment Variables**: Configure production environment variables
3. **SSL**: Enable HTTPS for production
4. **Domain**: Configure domain and DNS

### Build for Production
```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd backend
npm start
```

### Development Guidelines
- Follow ESLint configuration
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages




