const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const db = require('./models');
const errorHandler = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');
const { verifyToken } = require('./utils/jwtUtils');

// Import routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const contactRoutes = require('./routes/contact');

const app = express();
const server = createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

// Socket.io configuration
const io = new Server(server, {
  cors: corsOptions
});

// Rate limiting (disabled for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased limit for development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// app.use('/api/', limiter); // Disabled for development

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp Clone API is running!',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/contacts', contactRoutes);

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = verifyToken(token);
    const user = await db.User.findByPk(decoded.userId);
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user.id;
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.io connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`User ${socket.user.name} connected`);
  
  // Store user connection
  connectedUsers.set(socket.userId, socket.id);
  
  // Update user online status
  socket.user.update({ isOnline: true, lastSeen: new Date() });
  
  // Broadcast user online status to all users (including self)
  io.emit('user_online', {
    userId: socket.userId,
    isOnline: true
  });

  // Join user to their own room for private messages
  socket.join(socket.userId);

  // Handle new message
  socket.on('send_message', async (data) => {
    try {
      const { receiverId, messageText, messageType = 'text', replyToId } = data;
      
      // Create message in database
      const message = await db.Chat.create({
        senderId: socket.userId,
        receiverId,
        messageText,
        messageType,
        replyToId,
        isDelivered: true
      });

      // Fetch message with details
      const messageWithDetails = await db.Chat.findByPk(message.id, {
        include: [
          {
            model: db.User,
            as: 'sender',
            attributes: ['id', 'name', 'email', 'profilePicture']
          },
          {
            model: db.User,
            as: 'receiver',
            attributes: ['id', 'name', 'email', 'profilePicture']
          },
          {
            model: db.Chat,
            as: 'replyTo',
            include: [
              {
                model: db.User,
                as: 'sender',
                attributes: ['id', 'name']
              }
            ]
          }
        ]
      });

      // Send to receiver if they're online
      const receiverSocketId = connectedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('new_message', messageWithDetails);
        
        // Mark as delivered
        await message.update({ isDelivered: true });
      }

      // Send confirmation back to sender
      socket.emit('message_sent', messageWithDetails);
      
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', {
        error: 'Failed to send message'
      });
    }
  });

  // Handle message read status
  socket.on('mark_as_read', async (data) => {
    try {
      const { messageId } = data;
      
      const message = await db.Chat.findByPk(messageId);
      if (message && message.receiverId === socket.userId) {
        await message.update({ isRead: true });
        
        // Notify sender
        const senderSocketId = connectedUsers.get(message.senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('message_read', {
            messageId,
            readBy: socket.userId
          });
        }
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { receiverId, isTyping } = data;
    const receiverSocketId = connectedUsers.get(receiverId);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', {
        userId: socket.userId,
        isTyping
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log(`User ${socket.user.name} disconnected`);
    
    // Remove from connected users
    connectedUsers.delete(socket.userId);
    
    // Update user offline status
    await socket.user.update({ 
      isOnline: false, 
      lastSeen: new Date() 
    });
    
    // Broadcast user offline status to all users
    io.emit('user_offline', {
      userId: socket.userId,
      isOnline: false,
      lastSeen: new Date()
    });
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Database connection and server startup
const startServer = async () => {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync database models
    if (process.env.NODE_ENV === 'development') {
      await db.sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized.');
    }
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📡 WebSocket server is ready for connections`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await db.sequelize.close();
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await db.sequelize.close();
  server.close(() => {
    console.log('HTTP server closed');
  });
});

startServer();

module.exports = { app, server, io };
