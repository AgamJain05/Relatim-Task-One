const { Chat, User } = require('../models');
const { Op } = require('sequelize');

const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, messageText, messageType = 'text', replyToId } = req.body;
    const senderId = req.user.id;

    // Check if receiver exists
    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Create message
    const message = await Chat.create({
      senderId,
      receiverId,
      messageText,
      messageType,
      replyToId,
      isDelivered: true
    });

    // Fetch message with sender and receiver info
    const messageWithDetails = await Chat.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email', 'profilePicture']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'name', 'email', 'profilePicture']
        },
        {
          model: Chat,
          as: 'replyTo',
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message: messageWithDetails
      }
    });
  } catch (error) {
    next(error);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get all conversations for the user
    const conversations = await Chat.findAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ],
        isDeleted: false
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email', 'profilePicture', 'isOnline', 'lastSeen']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'name', 'email', 'profilePicture', 'isOnline', 'lastSeen']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Group conversations by participants
    const conversationMap = new Map();
    
    conversations.forEach(message => {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      const otherUser = message.senderId === userId ? message.receiver : message.sender;
      
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          user: otherUser,
          lastMessage: message,
          unreadCount: 0
        });
      }
    });

    // Count unread messages for each conversation
    for (const [otherUserId, conversation] of conversationMap) {
      const unreadCount = await Chat.count({
        where: {
          senderId: otherUserId,
          receiverId: userId,
          isRead: false,
          isDeleted: false
        }
      });
      conversation.unreadCount = unreadCount;
    }

    const conversationList = Array.from(conversationMap.values());

    res.json({
      success: true,
      data: {
        conversations: conversationList,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: conversationList.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const { userId: otherUserId } = req.params;
    const currentUserId = req.user.id;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Get messages between current user and other user
    const messages = await Chat.findAll({
      where: {
        [Op.or]: [
          {
            senderId: currentUserId,
            receiverId: otherUserId
          },
          {
            senderId: otherUserId,
            receiverId: currentUserId
          }
        ],
        isDeleted: false
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email', 'profilePicture']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'name', 'email', 'profilePicture']
        },
        {
          model: Chat,
          as: 'replyTo',
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Mark messages as read
    await Chat.update(
      { isRead: true },
      {
        where: {
          senderId: otherUserId,
          receiverId: currentUserId,
          isRead: false
        }
      }
    );

    const totalMessages = await Chat.count({
      where: {
        [Op.or]: [
          {
            senderId: currentUserId,
            receiverId: otherUserId
          },
          {
            senderId: otherUserId,
            receiverId: currentUserId
          }
        ],
        isDeleted: false
      }
    });

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalMessages,
          totalPages: Math.ceil(totalMessages / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Chat.findOne({
      where: {
        id: messageId,
        senderId: userId
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or you are not authorized to delete it'
      });
    }

    await message.update({ isDeleted: true });

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getConversations,
  getMessages,
  deleteMessage
};

