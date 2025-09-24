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
      console.error('Error creating assessment:', error);
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
      console.error('Error fetching assessments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch assessments'
      });
    }
  },

  async startAssessment(req, res) {
    try {
      const { id } = req.params; // assessmentId
      const userId = req.user.id;

      console.log(`Starting assessment ${id} for user ${userId}`);

      // 1. Fetch assessment details
      const assessment = await Assessment.findById(id);
      if (!assessment) {
        console.error(`Assessment not found: ${id}`);
        return res.status(404).json({
          success: false,
          error: 'Assessment not found'
        });
      }

      console.log(`Assessment found: ${assessment.title}, Premium: ${assessment.is_premium}`);

      // 2. Premium assessments → check payment + attempts
      if (assessment.is_premium) {
        console.log('Checking premium access...');
        const hasAccess = await Payment.verifyUserAccess(userId, id);
        
        if (!hasAccess) {
          console.log(`User ${userId} does not have access to premium assessment ${id}`);
          return res.status(403).json({
            success: false,
            error: 'Payment required to access this assessment'
          });
        }

        console.log('User has premium access, checking attempts...');

        // Find latest user_assessment record
        const result = await query(
          `SELECT * FROM user_assessments
          WHERE user_id=$1 AND assessment_id=$2 AND has_access=true
          ORDER BY purchased_at DESC LIMIT 1`,
          [userId, id]
        );

        if (result.rows.length === 0) {
          console.log(`No user_assessment record found for user ${userId}, assessment ${id}`);
          return res.status(403).json({
            success: false,
            error: 'You must purchase this assessment first.'
          });
        }

        const userAssessment = result.rows[0];
        const maxAttempts = 3; // fixed cap
        const attemptsUsed = userAssessment.attempts_used || 0;

        console.log(`Attempts used: ${attemptsUsed}, Max attempts: ${maxAttempts}`);

        if (attemptsUsed >= maxAttempts) {
          console.log(`Max attempts reached for user ${userId}, assessment ${id}`);
          return res.status(403).json({
            success: false,
            error: `Max attempts (${maxAttempts}) reached. Please repurchase this assessment.`
          });
        }

        // ✅ FIXED: Remove updated_at column from the query
        console.log(`Incrementing attempts from ${attemptsUsed} to ${attemptsUsed + 1}`);
        await query(
          `UPDATE user_assessments
          SET attempts_used = attempts_used + 1
          WHERE id=$1`,
          [userAssessment.id]
        );
      } else {
        console.log('Free assessment - no access checks needed');
      }

      // 3. Get randomized questions based on difficulty distribution
      console.log('Fetching questions with difficulty distribution...');
      const questions = await Assessment.getQuestionsWithDifficulty(
        id,
        assessment.num_questions || 10 // default to 10 if not set
      );

      if (questions.length === 0) {
        console.error(`No questions available for assessment ${id}`);
        return res.status(400).json({
          success: false,
          error: 'No questions available for this assessment'
        });
      }

      console.log(`Found ${questions.length} questions for assessment`);

      // 4. Format question options (ensure JSON is parsed)
      const formattedQuestions = questions.map(q => ({
        id: q.id,
        assessment_id: q.assessment_id,
        question_text: q.question_text,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        correct_answer: q.correct_answer,
        d_level: q.d_level || 1,
        created_at: q.created_at,
        updated_at: q.updated_at
      }));

      // 5. Success response
      console.log('Sending success response for assessment start');
      res.json({
        success: true,
        data: {
          assessment: {
            id: assessment.id,
            title: assessment.title,
            description: assessment.description,
            price: assessment.price,
            is_premium: assessment.is_premium,
            time_limit: assessment.time_limit,
            num_questions: assessment.num_questions,
            created_by: assessment.created_by,
            created_at: assessment.created_at,
            updated_at: assessment.updated_at
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

      console.log(`Getting assessment ${id} for user ${userId}`);

      const assessment = await Assessment.findById(id);
      if (!assessment) {
        return res.status(404).json({
          success: false,
          error: 'Assessment not found'
        });
      }

      // Check if assessment is premium and user has access
      let hasAccess = true;
      if (assessment.is_premium && userId) {
        hasAccess = await Payment.verifyUserAccess(userId, id);
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
          questions: assessment.is_premium && !hasAccess ? [] : questions,
          has_access: !assessment.is_premium || hasAccess
        }
      });
    } catch (error) {
      console.error('Error fetching assessment:', error);
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
      console.error('Error updating assessment:', error);
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
      console.error('Error deleting assessment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete assessment'
      });
    }
  },

  async addQuestion(req, res) {
    try {
      const { assessment_id } = req.params;
      const { question_text, options, correct_answer, d_level } = req.body;

      const question = await Question.create({
        assessment_id,
        question_text,
        options,
        correct_answer,
        d_level: d_level || 1
      });

      res.status(201).json({
        success: true,
        message: 'Question added successfully',
        data: {
          question
        }
      });
    } catch (error) {
      console.error('Error adding question:', error);
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
      console.error('Error fetching user assessments:', error);
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

      console.log(`Getting instructions for assessment ${id} for user ${userId}`);

      // 1. Fetch assessment
      const assessment = await Assessment.findById(id);
      if (!assessment) {
        console.error(`Assessment not found: ${id}`);
        return res.status(404).json({
          success: false,
          error: 'Assessment not found',
        });
      }

      console.log(`Assessment found: ${assessment.title}`);

      let hasAccess = !assessment.is_premium; // Free assessments always accessible
      let attemptsUsed = 0;
      let maxAttempts = assessment.is_premium ? 3 : null;
      let attemptsLeft = maxAttempts; // default = all left

      if (assessment.is_premium) {
        console.log('Premium assessment - checking access and attempts');
        
        // 2. Check if user has purchased access
        const purchase = await UserAssessment.findByUserAndAssessment(userId, id);
        if (purchase && purchase.has_access) {
          hasAccess = true;

          // 3. Get attempts used directly from user_assessments
          attemptsUsed = purchase.attempts_used || 0;
          attemptsLeft = maxAttempts - attemptsUsed;

          // Prevent negative numbers if something goes wrong
          if (attemptsLeft < 0) attemptsLeft = 0;
          
          console.log(`Premium access: attemptsUsed=${attemptsUsed}, attemptsLeft=${attemptsLeft}`);
        } else {
          console.log('No premium access found');
        }
      } else {
        console.log('Free assessment - full access granted');
      }

      // Prepare response data
      const responseData = {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        price: assessment.price,
        is_premium: assessment.is_premium,
        time_limit: assessment.time_limit,
        num_questions: assessment.num_questions,
        created_by: assessment.created_by,
        created_at: assessment.created_at,
        updated_at: assessment.updated_at,
        hasAccess,
        attemptsUsed,
        maxAttempts,
        attemptsLeft
      };

      console.log('Sending instructions response:', responseData);

      res.json({
        success: true,
        data: responseData,
      });
    } catch (err) {
      console.error('Error fetching assessment instructions:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch assessment instructions',
      });
    }
  },

  // New method to handle assessment violations
  async logViolation(req, res) {
    try {
      const { id } = req.params; // assessmentId
      const userId = req.user.id;
      const { code, message, timestamp, violations } = req.body;

      console.log(`Violation logged for assessment ${id}, user ${userId}:`, {
        code, message, violations
      });

      // Log violation to database (you might want to create a violations table)
      await query(
        `INSERT INTO assessment_violations (user_id, assessment_id, violation_code, violation_message, violation_count, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, id, code, message, violations, new Date(timestamp)]
      );

      res.json({
        success: true,
        message: 'Violation logged successfully'
      });
    } catch (error) {
      console.error('Error logging violation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to log violation'
      });
    }
  },

  // New method to handle auto-submit due to violations
  async autoSubmitAssessment(req, res) {
    try {
      const { id } = req.params; // assessmentId
      const userId = req.user.id;
      const { reason, violations } = req.body;

      console.log(`Auto-submitting assessment ${id} for user ${userId}:`, {
        reason, violations
      });

      // Create a result record indicating auto-submission due to violations
      await query(
        `INSERT INTO results (user_id, assessment_id, score, total_questions, correct_answers, time_taken, submitted_at, auto_submitted, violation_reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [userId, id, 0, 0, 0, 0, new Date(), true, reason]
      );

      res.json({
        success: true,
        message: 'Assessment auto-submitted due to violations'
      });
    } catch (error) {
      console.error('Error auto-submitting assessment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to auto-submit assessment'
      });
    }
  }

};

module.exports = assessmentController;