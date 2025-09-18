const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { query } = require('../config/database');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

const authController = {
  async register(req, res) {
    try {
      const { email, password, name } = req.body;

      const user = await User.create({ email, password, name });
      
      const token = generateToken(user.id);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            created_at: user.created_at
          },
          token
        }
      });
    } catch (error) {
      if (error.message === 'User already exists with this email') {
        return res.status(409).json({
          success: false,
          error: 'User already exists with this email'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Registration failed'
      });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      const isPasswordValid = await User.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      const token = generateToken(user.id);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            created_at: user.created_at
          },
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Login failed'
      });
    }
  },

  async getProfile(req, res) {
    try {
      res.json({
        success: true,
        data: {
          user: req.user
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch profile'
      });
    }
  },

  async updateProfile(req, res) {
    try {
      const { name, email } = req.body;
      const userId = req.user.id;

      // Check if email is already taken by another user
      if (email && email !== req.user.email) {
        const existingUser = await User.findByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(409).json({
            success: false,
            error: 'Email already taken'
          });
        }
      }

      const updatedUser = await User.updateProfile(userId, { name, email });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  },

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      const user = await User.findByEmail(req.user.email);
      const isCurrentPasswordValid = await User.comparePassword(currentPassword, user.password);

      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      await query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedNewPassword, userId]
      );

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to change password'
      });
    }
  }
};

module.exports = authController;