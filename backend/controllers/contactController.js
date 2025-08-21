const { Contact, User } = require('../models');
const { Op } = require('sequelize');

const addContact = async (req, res, next) => {
  try {
    const { contactUserId, contactName, contactNumber } = req.body;
    const userId = req.user.id;

    // Allow users to add themselves for self-messaging

    // Check if contact user exists
    const contactUser = await User.findByPk(contactUserId);
    if (!contactUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if contact already exists
    const existingContact = await Contact.findOne({
      where: {
        userId,
        contactUserId
      }
    });

    if (existingContact) {
      return res.status(400).json({
        success: false,
        message: 'Contact already exists'
      });
    }

    // Create contact
    const contact = await Contact.create({
      userId,
      contactUserId,
      contactName: contactName || contactUser.name,
      contactNumber: contactNumber && contactNumber.trim() !== '' ? contactNumber : null
    });

    // Fetch contact with user details
    const contactWithDetails = await Contact.findByPk(contact.id, {
      include: [
        {
          model: User,
          as: 'contactUser',
          attributes: ['id', 'name', 'email', 'profilePicture', 'isOnline', 'lastSeen']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Contact added successfully',
      data: {
        contact: contactWithDetails
      }
    });
  } catch (error) {
    next(error);
  }
};

const getContacts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { userId };
    
    if (search) {
      whereClause.contactName = {
        [Op.iLike]: `%${search}%`
      };
    }

    const contacts = await Contact.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'contactUser',
          attributes: ['id', 'name', 'email', 'profilePicture', 'isOnline', 'lastSeen']
        }
      ],
      order: [['contactName', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        contacts: contacts.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: contacts.count,
          totalPages: Math.ceil(contacts.count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateContact = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const { contactName, contactNumber, isFavorite, isBlocked } = req.body;
    const userId = req.user.id;

    const contact = await Contact.findOne({
      where: {
        id: contactId,
        userId
      }
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    const updatedContact = await contact.update({
      ...(contactName && { contactName }),
      ...(contactNumber && { contactNumber }),
      ...(typeof isFavorite === 'boolean' && { isFavorite }),
      ...(typeof isBlocked === 'boolean' && { isBlocked })
    });

    // Fetch updated contact with user details
    const contactWithDetails = await Contact.findByPk(updatedContact.id, {
      include: [
        {
          model: User,
          as: 'contactUser',
          attributes: ['id', 'name', 'email', 'profilePicture', 'isOnline', 'lastSeen']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: {
        contact: contactWithDetails
      }
    });
  } catch (error) {
    next(error);
  }
};

const deleteContact = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const userId = req.user.id;

    const contact = await Contact.findOne({
      where: {
        id: contactId,
        userId
      }
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    await contact.destroy();

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;

    console.log('=== SEARCH DEBUG ===');
    console.log('Search query:', query);
    console.log('Current user ID:', userId);
    console.log('Current user:', req.user.name, req.user.email);

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const users = await User.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { email: { [Op.iLike]: `%${query}%` } }
        ]
      },
      attributes: ['id', 'name', 'email', 'profilePicture', 'isOnline', 'lastSeen'],
      limit: 10
    });

    console.log('Found users:', users.length);
    users.forEach(u => console.log('- ' + u.name + ' (' + u.email + ')'));
    console.log('==================');

    res.json({
      success: true,
      data: {
        users
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addContact,
  getContacts,
  updateContact,
  deleteContact,
  searchUsers
};
