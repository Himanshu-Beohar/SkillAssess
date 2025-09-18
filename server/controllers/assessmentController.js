const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const Payment = require('../models/Payment');
const { query } = require('../config/database');

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
  }
};

module.exports = assessmentController;