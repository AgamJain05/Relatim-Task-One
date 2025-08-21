'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('chats', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      senderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      receiverId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      messageText: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      messageType: {
        type: Sequelize.ENUM('text', 'image', 'file', 'audio'),
        defaultValue: 'text'
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      isDelivered: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      replyToId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'chats',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      }
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('chats', {
      fields: ['senderId', 'receiverId'],
      name: 'chats_sender_receiver_idx'
    });

    await queryInterface.addIndex('chats', {
      fields: ['createdAt'],
      name: 'chats_created_at_idx'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('chats');
  }
};