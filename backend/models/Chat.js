const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Chat = sequelize.define('Chat', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    receiverId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    messageText: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 1000]
      }
    },
    messageType: {
      type: DataTypes.ENUM('text', 'image', 'file', 'audio'),
      defaultValue: 'text'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isDelivered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    replyToId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'chats',
        key: 'id'
      }
    }
  }, {
    tableName: 'chats',
    timestamps: true,
    indexes: [
      {
        fields: ['senderId', 'receiverId']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  // Associations
  Chat.associate = function(models) {
    // Chat belongs to sender
    Chat.belongsTo(models.User, {
      foreignKey: 'senderId',
      as: 'sender'
    });

    // Chat belongs to receiver
    Chat.belongsTo(models.User, {
      foreignKey: 'receiverId',
      as: 'receiver'
    });

    // Self-referencing for replies
    Chat.belongsTo(Chat, {
      foreignKey: 'replyToId',
      as: 'replyTo'
    });

    Chat.hasMany(Chat, {
      foreignKey: 'replyToId',
      as: 'replies'
    });
  };

  return Chat;
};

