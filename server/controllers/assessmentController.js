const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const Payment = require('../models/Payment');
const { query } = require('../config/database');
const UserAssessment = require('../models/UserAssessment');
const Result = require('../models/Result');

const assessmentController = {
  async createAssessment(req, res) {
    try {
      const { title, description, price, is_premium, questions } = req.body;
      const userId = req.user.id;

      const assessmentData = {
        title,
        description,
        price: price || 0,
        is_premium: is_premium || false,
        created_by: userId
      };

      const assessment = await Assessment.create(assessmentData);

      // Add questions if provided
      if (questions && Array.isArray(questions)) {
        for (const questionData of questions) {
          await Question.create({
            assessment_id: assessment.id,
            question_text: questionData.question_text,
            options: questionData.options,
            correct_answer: questionData.correct_answer
          });
        }
      }

      const assessmentWithQuestions = await Assessment.findById(assessment.id);
      const assessmentQuestions = await Question.findByAssessmentId(assessment.id);

      res.status(201).json({
        success: true,
        message: 'Assessment created successfully',
        data: {
          assessment: assessmentWithQuestions,
          questions: assessmentQuestions
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create assessment'
      });
    }
  },

  async getAllAssessments(req, res) {
    try {
      const assessments = await Assessment.findAll();
      
      res.json({
        success: true,
        data: {
          assessments,
          count: assessments.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch assessments'
      });
    }
  },

  // async startAssessment(req, res) {
  //   try {
  //     const { id } = req.params; // assessmentId
  //     const userId = req.user.id;

  //     // 1. Fetch assessment details
  //     const assessment = await Assessment.findById(id);
  //     if (!assessment) {
  //       return res.status(404).json({
  //         success: false,
  //         error: 'Assessment not found'
  //       });
  //     }

  //     // 2. Premium assessments → check payment + attempts
  //     if (assessment.is_premium) {
  //       const hasAccess = await Payment.verifyUserAccess(userId, id);
  //       if (!hasAccess) {
  //         return res.status(403).json({
  //           success: false,
  //           error: 'Payment required to access this assessment'
  //         });
  //       }

  //       // Find latest user_assessment record
  //       const result = await query(
  //         `SELECT * FROM user_assessments
  //         WHERE user_id=$1 AND assessment_id=$2 AND has_access=true
  //         ORDER BY purchased_at DESC LIMIT 1`,
  //         [userId, id]
  //       );

  //       if (result.rows.length === 0) {
  //         return res.status(403).json({
  //           success: false,
  //           error: 'You must purchase this assessment first.'
  //         });
  //       }

  //       const userAssessment = result.rows[0];
  //       const maxAttempts = 3; // fixed cap
  //       const attemptsUsed = userAssessment.attempts_used || 0;

  //       if (attemptsUsed >= maxAttempts) {
  //         return res.status(403).json({
  //           success: false,
  //           error: `Max attempts (${maxAttempts}) reached. Please repurchase this assessment.`
  //         });
  //       }

  //       // Increment attempts_used immediately
  //       await query(
  //         `UPDATE user_assessments
  //         SET attempts_used = attempts_used + 1
  //         WHERE id=$1`,
  //         [userAssessment.id]
  //       );
  //     }

  //     // 3. Get randomized questions based on difficulty distribution
  //     const questions = await Assessment.getQuestionsWithDifficulty(
  //       id,
  //       assessment.num_questions
  //     );

  //     if (questions.length === 0) {
  //       return res.status(400).json({
  //         success: false,
  //         error: 'No questions available for this assessment'
  //       });
  //     }

  //     // 4. Format question options (ensure JSON is parsed)
  //     const formattedQuestions = questions.map(q => ({
  //       ...q,
  //       options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
  //     }));

  //     // 5. Success response
  //     res.json({
  //       success: true,
  //       data: {
  //         assessment: {
  //           ...assessment,
  //           time_limit: assessment.time_limit
  //         },
  //         questions: formattedQuestions,
  //         time_limit: assessment.time_limit * 60 // convert minutes → seconds
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Error starting assessment:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: 'Failed to start assessment'
  //     });
  //   }
  // },

  async startAssessment(req, res) {
    try {
      const { id } = req.params; // assessmentId
      const userId = req.user.id;

      // 1. Fetch assessment details
      const assessment = await Assessment.findById(id);
      if (!assessment) {
        return res.status(404).json({
          success: false,
          error: 'Assessment not found'
        });
      }

      // 2. Premium assessments → check payment + attempts
      if (assessment.is_premium) {
        const hasAccess = await Payment.verifyUserAccess(userId, id);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            error: 'Payment required to access this assessment'
          });
        }

        // Find latest user_assessment record
        const result = await query(
          `SELECT * FROM user_assessments
          WHERE user_id=$1 AND assessment_id=$2 AND has_access=true
          ORDER BY purchased_at DESC LIMIT 1`,
          [userId, id]
        );

        if (result.rows.length === 0) {
          return res.status(403).json({
            success: false,
            error: 'You must purchase this assessment first.'
          });
        }

        const userAssessment = result.rows[0];
        const maxAttempts = 3; // fixed cap
        const attemptsUsed = userAssessment.attempts_used || 0;

        if (attemptsUsed >= maxAttempts) {
          return res.status(403).json({
            success: false,
            error: `Max attempts (${maxAttempts}) reached. Please repurchase this assessment.`
          });
        }

        // ✅ Increment attempts_used immediately
        await query(
          `UPDATE user_assessments
          SET attempts_used = attempts_used + 1
          WHERE id=$1`,
          [userAssessment.id]
        );
      }

      // 3. Get randomized questions based on difficulty distribution
      const questions = await Assessment.getQuestionsWithDifficulty(
        id,
        assessment.num_questions
      );

      if (questions.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No questions available for this assessment'
        });
      }

      // 4. Format question options (ensure JSON is parsed)
      const formattedQuestions = questions.map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      }));

      // 5. Success response
      res.json({
        success: true,
        data: {
          assessment: {
            ...assessment,
            time_limit: assessment.time_limit
          },
          questions: formattedQuestions,
          time_limit: assessment.time_limit * 60 // convert minutes → seconds
        }
      });
    } catch (error) {
      console.error('Error starting assessment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start assessment'
      });
    }
  },


  async getAssessment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const assessment = await Assessment.findById(id);
      if (!assessment) {
        return res.status(404).json({
          success: false,
          error: 'Assessment not found'
        });
      }

      // Check if assessment is premium and user has access
      if (assessment.is_premium && userId) {
        const hasAccess = await Payment.verifyUserAccess(userId, id);
        if (!hasAccess) {
          return res.json({
            success: true,
            data: {
              assessment,
              has_access: false,
              message: 'Premium assessment - payment required'
            }
          });
        }
      }

      const questions = await Question.findByAssessmentId(id);

      res.json({
        success: true,
        data: {
          assessment,
          questions: assessment.is_premium && !userId ? [] : questions,
          has_access: !assessment.is_premium || !!userId
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch assessment'
      });
    }
  },

  async updateAssessment(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const assessment = await Assessment.update(id, updates);

      res.json({
        success: true,
        message: 'Assessment updated successfully',
        data: {
          assessment
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update assessment'
      });
    }
  },

  async deleteAssessment(req, res) {
    try {
      const { id } = req.params;

      await Assessment.delete(id);

      res.json({
        success: true,
        message: 'Assessment deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete assessment'
      });
    }
  },

  async addQuestion(req, res) {
    try {
      const { assessment_id } = req.params;
      const { question_text, options, correct_answer } = req.body;

      const question = await Question.create({
        assessment_id,
        question_text,
        options,
        correct_answer
      });

      res.status(201).json({
        success: true,
        message: 'Question added successfully',
        data: {
          question
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to add question'
      });
    }
  },

  async getUserAssessments(req, res) {
    try {
      const userId = req.user.id;
      const assessments = await Assessment.findByUserId(userId);

      res.json({
        success: true,
        data: {
          assessments,
          count: assessments.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user assessments'
      });
    }
  },

  async getAssessmentInstructions(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // 1. Fetch assessment
      const assessment = await Assessment.findById(id);
      if (!assessment) {
        return res.status(404).json({
          success: false,
          error: 'Assessment not found',
        });
      }

      let hasAccess = !assessment.is_premium; // Free assessments always accessible
      let attemptsUsed = 0;
      let maxAttempts = assessment.is_premium ? 3 : null;
      let attemptsLeft = maxAttempts; // default = all left

      if (assessment.is_premium) {
        // 2. Check if user has purchased access
        const purchase = await UserAssessment.findByUserAndAssessment(userId, id);
        if (purchase && purchase.has_access) {
          hasAccess = true;

          // 3. Get attempts used directly from user_assessments
          attemptsUsed = purchase.attempts_used || 0;
          attemptsLeft = maxAttempts - attemptsUsed;

          // Prevent negative numbers if something goes wrong
          if (attemptsLeft < 0) attemptsLeft = 0;
        }
      }

      res.json({
        success: true,
        data: {
          ...assessment,
          hasAccess,
          attemptsUsed,
          maxAttempts,
          attemptsLeft
        },
      });
    } catch (err) {
      console.error('Error fetching assessment instructions:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch assessment instructions',
      });
    }
  }

};

module.exports = assessmentController;