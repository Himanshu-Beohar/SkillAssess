// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const { query } = require('../config/database');
// const bcrypt = require('bcryptjs');

// const generateToken = (userId) => {
//   return jwt.sign({ userId }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRE
//   });
// };

// const emailService = require('../utils/emailService');

// exports.register = async (req, res) => {
//   try {
//     const user = await User.create(req.body);

//     // 🚀 Send welcome email
//     await emailService.sendWelcomeEmail(user);

//     res.json({ success: true, user });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

// const emailService = require('../utils/emailService');

// exports.forgotPassword = async (req, res) => {
//   try {
//     const user = await User.findOne({ email: req.body.email });
//     if (!user) {
//       return res.status(404).json({ success: false, error: 'User not found' });
//     }

//     const resetToken = generateResetToken(user); // implement as you already have

//     // 🚀 Send password reset email
//     await emailService.sendPasswordResetEmail(user, resetToken);

//     res.json({ success: true, message: 'Reset email sent' });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };


// const authController = {
//   async register(req, res) {
//     try {
//       const { email, password, name } = req.body;

//       const user = await User.create({ email, password, name });
      
//       const token = generateToken(user.id);

//       res.status(201).json({
//         success: true,
//         message: 'User registered successfully',
//         data: {
//           user: {
//             id: user.id,
//             email: user.email,
//             name: user.name,
//             created_at: user.created_at
//           },
//           token
//         }
//       });
//     } catch (error) {
//       if (error.message === 'User already exists with this email') {
//         return res.status(409).json({
//           success: false,
//           error: 'User already exists with this email'
//         });
//       }

//       res.status(500).json({
//         success: false,
//         error: 'Registration failed'
//       });
//     }
//   },

//   async login(req, res) {
//     try {
//       const { email, password } = req.body;

//       const user = await User.findByEmail(email);
//       if (!user) {
//         return res.status(401).json({
//           success: false,
//           error: 'Invalid credentials'
//         });
//       }

//       const isPasswordValid = await User.comparePassword(password, user.password);
//       if (!isPasswordValid) {
//         return res.status(401).json({
//           success: false,
//           error: 'Invalid credentials'
//         });
//       }

//       const token = generateToken(user.id);

//       res.json({
//         success: true,
//         message: 'Login successful',
//         data: {
//           user: {
//             id: user.id,
//             email: user.email,
//             name: user.name,
//             created_at: user.created_at
//           },
//           token
//         }
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         error: 'Login failed'
//       });
//     }
//   },

//   async getProfile(req, res) {
//     try {
//       res.json({
//         success: true,
//         data: {
//           user: req.user
//         }
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         error: 'Failed to fetch profile'
//       });
//     }
//   },

//   async updateProfile(req, res) {
//     try {
//       const { name, email } = req.body;
//       const userId = req.user.id;

//       // Check if email is already taken by another user
//       if (email && email !== req.user.email) {
//         const existingUser = await User.findByEmail(email);
//         if (existingUser && existingUser.id !== userId) {
//           return res.status(409).json({
//             success: false,
//             error: 'Email already taken'
//           });
//         }
//       }

//       const updatedUser = await User.updateProfile(userId, { name, email });

//       res.json({
//         success: true,
//         message: 'Profile updated successfully',
//         data: {
//           user: updatedUser
//         }
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         error: 'Failed to update profile'
//       });
//     }
//   },

//   async changePassword(req, res) {
//     try {
//       const { currentPassword, newPassword } = req.body;
//       const userId = req.user.id;

//       // 1. Fetch user by ID (safer than email from token)
//       const user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           error: 'User not found'
//         });
//       }

//       // 2. Compare current password
//       const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
//       if (!isCurrentPasswordValid) {
//         return res.status(401).json({
//           success: false,
//           error: 'Current password is incorrect'
//         });
//       }

//       // 3. Hash new password
//       const saltRounds = 10;
//       const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

//       // 4. Update password in DB
//       await query(
//         'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
//         [hashedNewPassword, userId]
//       );

//       res.json({
//         success: true,
//         message: 'Password changed successfully'
//       });
//     } catch (error) {
//       console.error('Error changing password:', error);
//       res.status(500).json({
//         success: false,
//         error: 'Failed to change password'
//       });
//     }
//   }

// };

// module.exports = authController;


const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const emailService = require('../utils/emailService');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

const authController = {
  // Register new user
  async register(req, res) {
    try {
      const { email, password, name } = req.body;

      const user = await User.create({ email, password, name });
      const token = generateToken(user.id);

      // 🚀 Send welcome email
      await emailService.sendWelcomeEmail(user);

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

  // Login
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

  // Get profile
  // async getProfile(req, res) {
  //   try {
  //     res.json({
  //       success: true,
  //       data: {
  //         user: req.user
  //       }
  //     });
  //   } catch (error) {
  //     res.status(500).json({
  //       success: false,
  //       error: 'Failed to fetch profile'
  //     });
  //   }
  // },


  // async getProfile(req, res) {
  //   try {
  //     const userId = req.user.id;

  //     // ✅ Fetch fresh data from the database (so it's always up-to-date)
  //     const user = await User.findById(userId);

  //     if (!user) {
  //       return res.status(404).json({
  //         success: false,
  //         error: "User not found"
  //       });
  //     }

  //     // ✅ If 'skills' is stored as JSON string, parse it:
  //     if (typeof user.skills === "string") {
  //       try {
  //         user.skills = JSON.parse(user.skills);
  //       } catch (e) {
  //         user.skills = [];
  //       }
  //     }

  //     res.json({
  //       success: true,
  //       data: {
  //         user: {
  //           id: user.id,
  //           name: user.name,
  //           email: user.email,
  //           gender: user.gender,
  //           phone: user.phone,
  //           dob: user.dob,
  //           city: user.city,
  //           country: user.country,
  //           qualification: user.qualification,
  //           college: user.college,
  //           occupation: user.occupation,
  //           experience: user.experience,
  //           skills: user.skills || [],
  //           goal: user.goal,
  //           created_at: user.created_at,
  //           updated_at: user.updated_at
  //         }
  //       }
  //     });
  //   } catch (error) {
  //     console.error("getProfile error:", error);
  //     res.status(500).json({
  //       success: false,
  //       error: "Failed to fetch profile"
  //     });
  //   }
  // },

  async getProfile(req, res) {
    try {
      const userId = req.user.id; // user ID from token/session

      // ✅ Always fetch fresh data from DB with TO_CHAR formatting
      const user = await User.findById(userId);

      // ✅ Make sure skills is parsed
      if (typeof user.skills === "string") {
        try {
          user.skills = JSON.parse(user.skills);
        } catch (e) {
          user.skills = [];
        }
      }

      res.json({
        success: true,
        data: {
          user
        }
      });
    } catch (error) {
      console.error("getProfile error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch profile"
      });
    }
  },


  // // Update profile
  // async updateProfile(req, res) {
  //   try {
  //     const { name, email } = req.body;
  //     const userId = req.user.id;

  //     if (email && email !== req.user.email) {
  //       const existingUser = await User.findByEmail(email);
  //       if (existingUser && existingUser.id !== userId) {
  //         return res.status(409).json({
  //           success: false,
  //           error: 'Email already taken'
  //         });
  //       }
  //     }

  //     const updatedUser = await User.updateProfile(userId, { name, email });

  //     res.json({
  //       success: true,
  //       message: 'Profile updated successfully',
  //       data: {
  //         user: updatedUser
  //       }
  //     });
  //   } catch (error) {
  //     res.status(500).json({
  //       success: false,
  //       error: 'Failed to update profile'
  //     });
  //   }
  // },


  // ✅ Update profile controller - safe version
  async updateProfile(req, res) {
    try {
      let {
        name,
        gender,
        phone,
        dob,
        city,
        country,
        qualification,
        college,
        occupation,
        experience,
        skills,
        goal
      } = req.body;

      const userId = req.user.id;

      // 🛠️ Sanitize date: convert empty string to null
      if (!dob || dob.trim() === "") {
        dob = null;
      }

      // 🛠️ Sanitize skills: ensure it's always an array
      if (typeof skills === "string") {
        try {
          skills = JSON.parse(skills);
        } catch (e) {
          skills = [];
        }
      }
      if (!Array.isArray(skills)) {
        skills = [];
      }

      // 🛠️ Build the update data object
      const updateData = {
        name,
        gender,
        phone,
        dob, // ✅ Now always valid: either 'YYYY-MM-DD' or null
        city,
        country,
        qualification,
        college,
        occupation,
        experience,
        skills, // ✅ Always an array
        goal
      };

      // ✅ Call your model to update the user
      const updatedUser = await User.updateProfile(userId, updateData);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser
        }
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  },



  // Change password
  // async changePassword(req, res) {
  //   try {
  //     const { currentPassword, newPassword } = req.body;
  //     const userId = req.user.id;

  //     const user = await User.findById(userId);
  //     if (!user) {
  //       return res.status(404).json({
  //         success: false,
  //         error: 'User not found'
  //       });
  //     }

  //     const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  //     if (!isCurrentPasswordValid) {
  //       return res.status(401).json({
  //         success: false,
  //         error: 'Current password is incorrect'
  //       });
  //     }

  //     const saltRounds = 10;
  //     const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  //     await query(
  //       'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
  //       [hashedNewPassword, userId]
  //     );

  //     // ✅ Send confirmation email
  //     try {
  //       await emailService.sendEmail({
  //         to: [user.email, process.env.SUPPORT_EMAIL],
  //         subject: '🔒 Your password was changed',
  //         html: `
  //           <p>Hi ${user.name || ''},</p>
  //           <p>This is a confirmation that your password was changed successfully on <strong>${new Date().toLocaleString()}</strong>.</p>
  //           <p>If you didn’t make this change, please contact support immediately.</p>
  //         `
  //       });
  //     } catch (err) {
  //       console.error("⚠️ Failed to send password change email:", err);
  //     }

  //     res.json({
  //       success: true,
  //       message: 'Password changed successfully'
  //     });
  //   } catch (error) {
  //     console.error('Error changing password:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: 'Failed to change password'
  //     });
  //   }
  // },

  async changePassword(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // ✅ Fetch user from DB
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // ✅ Check current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    // ✅ Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // ✅ Update password
    await query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashedNewPassword, userId]);

    // ✅ Send confirmation email (optional)
    try {
      await emailService.sendEmail({
        to: [user.email, process.env.SUPPORT_EMAIL],
        subject: '🔒 Your password was changed',
        html: `
          <p>Hi ${user.name || ''},</p>
          <p>This is a confirmation that your password was changed successfully on <strong>${new Date().toLocaleString()}</strong>.</p>
          <p>If you didn’t make this change, please contact support immediately.</p>
        `
      });
    } catch (err) {
      console.error("⚠️ Failed to send password change email:", err);
    }

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('❌ Error changing password:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to change password' });
  }
},


  // Forgot password
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findByEmail(email); // use your model method
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = await bcrypt.hash(resetToken, 10);

      // Save hashed token + expiry in DB
      await query(
        `UPDATE users SET reset_token=$1, reset_token_expiry=NOW() + INTERVAL '1 hour' WHERE id=$2`,
        [resetTokenHash, user.id]
      );

      // Send reset email
      await emailService.sendPasswordResetEmail(user, resetToken);

      res.json({ success: true, message: 'Reset email sent' });
    } catch (err) {
      console.error("Forgot password error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
      }

      // Find user with valid reset_token
      const result = await query(`SELECT * FROM users WHERE reset_token IS NOT NULL AND reset_token_expiry > NOW()`);
      const user = result.rows.find((row) => bcrypt.compareSync(token, row.reset_token));

      if (!user) {
        return res.status(400).json({ success: false, error: 'Invalid or expired token' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password + clear reset fields
      await query(
        `UPDATE users SET password=$1, reset_token=NULL, reset_token_expiry=NULL, updated_at=NOW() WHERE id=$2`,
        [hashedPassword, user.id]
      );

      res.json({ success: true, message: 'Password reset successful' });
    } catch (err) {
      console.error("Reset password error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

};

module.exports = authController;
