'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    await queryInterface.bulkInsert('chats', [
      // Conversation between John and Jane
      {
        id: '770e8400-e29b-41d4-a716-446655440001',
        senderId: '550e8400-e29b-41d4-a716-446655440001', // John
        receiverId: '550e8400-e29b-41d4-a716-446655440002', // Jane
        messageText: 'Hey Jane! How are you doing?',
        messageType: 'text',
        isRead: true,
        isDelivered: true,
        isDeleted: false,
        replyToId: null,
        createdAt: threeDaysAgo,
        updatedAt: threeDaysAgo
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440002',
        senderId: '550e8400-e29b-41d4-a716-446655440002', // Jane
        receiverId: '550e8400-e29b-41d4-a716-446655440001', // John
        messageText: 'Hi John! I\'m doing great, thanks for asking. How about you?',
        messageType: 'text',
        isRead: true,
        isDelivered: true,
        isDeleted: false,
        replyToId: null,
        createdAt: threeDaysAgo,
        updatedAt: threeDaysAgo
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440003',
        senderId: '550e8400-e29b-41d4-a716-446655440001', // John
        receiverId: '550e8400-e29b-41d4-a716-446655440002', // Jane
        messageText: 'I\'m doing well too! Are you free for lunch tomorrow?',
        messageType: 'text',
        isRead: false,
        isDelivered: true,
        isDeleted: false,
        replyToId: null,
        createdAt: twoHoursAgo,
        updatedAt: twoHoursAgo
      },
      // Conversation with AI Bot
      {
        id: '770e8400-e29b-41d4-a716-446655440004',
        senderId: '550e8400-e29b-41d4-a716-446655440001', // John
        receiverId: '550e8400-e29b-41d4-a716-446655440003', // AI Bot
        messageText: 'Hello AI! Can you help me with something?',
        messageType: 'text',
        isRead: true,
        isDelivered: true,
        isDeleted: false,
        replyToId: null,
        createdAt: oneHourAgo,
        updatedAt: oneHourAgo
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440005',
        senderId: '550e8400-e29b-41d4-a716-446655440003', // AI Bot
        receiverId: '550e8400-e29b-41d4-a716-446655440001', // John
        messageText: 'Hello! I\'d be happy to help you. What do you need assistance with?',
        messageType: 'text',
        isRead: true,
        isDelivered: true,
        isDeleted: false,
        replyToId: null,
        createdAt: oneHourAgo,
        updatedAt: oneHourAgo
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440006',
        senderId: '550e8400-e29b-41d4-a716-446655440001', // John
        receiverId: '550e8400-e29b-41d4-a716-446655440003', // AI Bot
        messageText: 'I need some advice on React best practices.',
        messageType: 'text',
        isRead: false,
        isDelivered: true,
        isDeleted: false,
        replyToId: null,
        createdAt: now,
        updatedAt: now
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('chats', null, {});
  }
};

