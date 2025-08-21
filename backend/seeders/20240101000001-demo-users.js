'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    await queryInterface.bulkInsert('users', [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'John Doe',
        email: 'john@example.com',
        password: hashedPassword,
        profilePicture: 'https://via.placeholder.com/150?text=JD',
        isOnline: false,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: hashedPassword,
        profilePicture: 'https://via.placeholder.com/150?text=JS',
        isOnline: false,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'AI Bot',
        email: 'ai@bot.com',
        password: hashedPassword,
        profilePicture: 'https://via.placeholder.com/150?text=AI',
        isOnline: true,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: hashedPassword,
        profilePicture: 'https://via.placeholder.com/150?text=AJ',
        isOnline: false,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: 'Bob Wilson',
        email: 'bob@example.com',
        password: hashedPassword,
        profilePicture: 'https://via.placeholder.com/150?text=BW',
        isOnline: false,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};

