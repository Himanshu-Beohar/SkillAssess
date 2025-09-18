const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

// User registration validation
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name is required'),
  handleValidationErrors
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Assessment creation validation
const validateAssessment = [
  body('title')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Title must be at least 5 characters long'),
  body('description')
    .optional()
    .trim(),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('is_premium')
    .isBoolean()
    .withMessage('is_premium must be a boolean'),
  handleValidationErrors
];

// Payment validation
const validatePayment = [
  body('assessment_id')
    .isInt({ min: 1 })
    .withMessage('Valid assessment ID is required'),
  // body('amount')
  //   .isFloat({ min: 0 })
  //   .withMessage('Valid amount is required'),
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateAssessment,
  validatePayment,
  handleValidationErrors
};