'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('contacts', [
      {
        id: '660e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440001', // John
        contactUserId: '550e8400-e29b-41d4-a716-446655440002', // Jane
        contactName: 'Jane Smith',
        contactNumber: '+1234567890',
        isBlocked: false,
        isFavorite: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440001', // John
        contactUserId: '550e8400-e29b-41d4-a716-446655440003', // AI Bot
        contactName: 'AI Assistant',
        contactNumber: null,
        isBlocked: false,
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440003',
        userId: '550e8400-e29b-41d4-a716-446655440002', // Jane
        contactUserId: '550e8400-e29b-41d4-a716-446655440001', // John
        contactName: 'John Doe',
        contactNumber: '+0987654321',
        isBlocked: false,
        isFavorite: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440004',
        userId: '550e8400-e29b-41d4-a716-446655440001', // John
        contactUserId: '550e8400-e29b-41d4-a716-446655440004', // Alice
        contactName: 'Alice Johnson',
        contactNumber: '+1122334455',
        isBlocked: false,
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440005',
        userId: '550e8400-e29b-41d4-a716-446655440002', // Jane
        contactUserId: '550e8400-e29b-41d4-a716-446655440005', // Bob
        contactName: 'Bob Wilson',
        contactNumber: '+5566778899',
        isBlocked: false,
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('contacts', null, {});
  }
};

