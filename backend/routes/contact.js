const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  addContact,
  getContacts,
  updateContact,
  deleteContact,
  searchUsers
} = require('../controllers/contactController');

const router = express.Router();

// Validation middleware
const addContactValidation = [
  body('contactUserId')
    .isUUID()
    .withMessage('Contact user ID must be a valid UUID'),
  body('contactName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Contact name must be between 1 and 50 characters'),
  body('contactNumber')
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Contact number must be between 10 and 15 characters')
];

const updateContactValidation = [
  param('contactId')
    .isUUID()
    .withMessage('Contact ID must be a valid UUID'),
  body('contactName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Contact name must be between 1 and 50 characters'),
  body('contactNumber')
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Contact number must be between 10 and 15 characters'),
  body('isFavorite')
    .optional()
    .isBoolean()
    .withMessage('isFavorite must be a boolean'),
  body('isBlocked')
    .optional()
    .isBoolean()
    .withMessage('isBlocked must be a boolean')
];

const deleteContactValidation = [
  param('contactId')
    .isUUID()
    .withMessage('Contact ID must be a valid UUID')
];

const searchUsersValidation = [
  query('query')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters long')
];

const getContactsValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search term must be at least 1 character long'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Apply authentication to all routes
router.use(authenticateToken);

// Routes
router.post('/', addContactValidation, addContact);
router.get('/', getContactsValidation, getContacts);
router.put('/:contactId', updateContactValidation, updateContact);
router.delete('/:contactId', deleteContactValidation, deleteContact);
router.get('/search/users', searchUsersValidation, searchUsers);

module.exports = router;

