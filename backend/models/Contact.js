const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Contact = sequelize.define('Contact', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    contactUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    contactName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    contactNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [10, 15]
      }
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isFavorite: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  }, {
    tableName: 'contacts',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'contactUserId']
      }
    ]
  });

  // Associations
  Contact.associate = function(models) {
    // Contact belongs to a user (owner)
    Contact.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'owner'
    });

    // Contact belongs to a user (the actual contact)
    Contact.belongsTo(models.User, {
      foreignKey: 'contactUserId',
      as: 'contactUser'
    });
  };

  return Contact;
};

