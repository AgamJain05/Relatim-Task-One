const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  sendMessage,
  getConversations,
  getMessages,
  deleteMessage
} = require('../controllers/chatController');

const router = express.Router();

// Validation middleware
const sendMessageValidation = [
  body('receiverId')
    .isUUID()
    .withMessage('Receiver ID must be a valid UUID'),
  body('messageText')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message text must be between 1 and 1000 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'file', 'audio'])
    .withMessage('Message type must be one of: text, image, file, audio'),
  body('replyToId')
    .optional()
    .isUUID()
    .withMessage('Reply to ID must be a valid UUID')
];

const getMessagesValidation = [
  param('userId')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const deleteMessageValidation = [
  param('messageId')
    .isUUID()
    .withMessage('Message ID must be a valid UUID')
];

// Apply authentication to all routes
router.use(authenticateToken);

// Routes
router.post('/messages', sendMessageValidation, sendMessage);
router.get('/conversations', getConversations);
router.get('/messages/:userId', getMessagesValidation, getMessages);
router.delete('/messages/:messageId', deleteMessageValidation, deleteMessage);

module.exports = router;

