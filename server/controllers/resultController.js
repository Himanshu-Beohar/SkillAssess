const Result = require('../models/Result');
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const Payment = require('../models/Payment');
const UserAnswer = require('../models/UserAnswer');

const resultController = {
  // async submitAssessment(req, res) {
  //   try {
  //     const { assessment_id, answers, time_taken } = req.body;
  //     const userId = req.user.id;

  //     // Check if assessment exists
  //     const assessment = await Assessment.findById(assessment_id);
  //     if (!assessment) {
  //       return res.status(404).json({
  //         success: false,
  //         error: 'Assessment not found'
  //       });
  //     }

  //     // Check access for premium assessments
  //     if (assessment.is_premium) {
  //       const hasAccess = await Payment.verifyUserAccess(userId, assessment_id);
  //       if (!hasAccess) {
  //         return res.status(403).json({
  //           success: false,
  //           error: 'Payment required to access this assessment'
  //         });
  //       }
  //     }

  //     // Get all questions for the assessment
  //     const questions = await Question.findByAssessmentId(assessment_id);
      
  //     // Calculate score
  //     let score = 0;
  //     const results = [];

  //     for (const answer of answers) {
  //       const question = questions.find(q => q.id === answer.question_id);
  //       if (question) {
  //         const isCorrect = question.correct_answer === answer.selected_answer;
  //         if (isCorrect) score++;
          
  //         results.push({
  //           question_id: question.id,
  //           question_text: question.question_text,
  //           selected_answer: answer.selected_answer,
  //           correct_answer: question.correct_answer,
  //           is_correct: isCorrect,
  //           options: question.options
  //         });
  //       }
  //     }

  //     // Calculate percentage
  //     const percentage = Math.round((score / questions.length) * 100);

  //     // Save result
  //     const resultData = {
  //       user_id: userId,
  //       assessment_id,
  //       score,
  //       total_questions: questions.length,
  //       time_taken: time_taken || 0
  //     };

  //     const result = await Result.create(resultData);

  //     res.json({
  //       success: true,
  //       message: 'Assessment submitted successfully',
  //       data: {
  //         result: {
  //           id: result.id,
  //           score,
  //           total_questions: questions.length,
  //           percentage,
  //           time_taken: result.time_taken,
  //           completed_at: result.completed_at
  //         },
  //         detailed_results: results
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Assessment submission error:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: 'Failed to submit assessment'
  //     });
  //   }
  // },

  async submitAssessment(req, res) {
    try {
        const { assessment_id, answers, time_taken } = req.body;
        const userId = req.user.id;

        // Get the assessment to check total questions
        const assessment = await Assessment.findById(assessment_id);
        if (!assessment) {
            return res.status(404).json({
                success: false,
                error: 'Assessment not found'
            });
        }

        // Calculate score based on the questions that were actually presented
        let score = 0;
        const results = [];
        const questionIds = answers.map(a => a.question_id);

        // Get all the questions that were actually shown to the user
        const shownQuestions = await Question.findByIds(questionIds);

        answers.forEach(answer => {
            const question = shownQuestions.find(q => q.id === answer.question_id);
            if (question) {
                const isCorrect = question.correct_answer === answer.selected_answer;
                if (isCorrect) score++;
                
                results.push({
                    question_id: question.id,
                    question_text: question.question_text,
                    selected_answer: answer.selected_answer,
                    correct_answer: question.correct_answer,
                    is_correct: isCorrect,
                    options: typeof question.options === 'string' 
                        ? JSON.parse(question.options) 
                        : question.options
                });
            }
        });

        // Use the actual number of questions shown, not total in database
        const total_questions = answers.length;

        // Save result
        const resultData = {
            user_id: userId,
            assessment_id,
            score,
            total_questions,
            time_taken: time_taken || 0
        };

        const result = await Result.create(resultData);

        // Save individual answers
        await Promise.all(results.map(async (resultDetail, index) => {
            await UserAnswer.create({
                result_id: result.id,
                question_id: resultDetail.question_id,
                selected_answer: resultDetail.selected_answer,
                is_correct: resultDetail.is_correct
            });
        }));

        res.json({
            success: true,
            message: 'Assessment submitted successfully',
            data: {
                result: {
                    id: result.id,
                    score,
                    total_questions,
                    percentage: Math.round((score / total_questions) * 100),
                    time_taken: result.time_taken,
                    completed_at: result.completed_at
                },
                detailed_results: results
            }
        });

    } catch (error) {
        console.error('Assessment submission error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit assessment'
        });
    }
  },

  async getUserResults(req, res) {
    try {
      const userId = req.user.id;
      const results = await Result.findByUserId(userId);

      res.json({
        success: true,
        data: {
          results,
          count: results.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch results'
      });
    }
  },

  async getAssessmentResults(req, res) {
    try {
      const { assessment_id } = req.params;
      const userId = req.user.id;

      // Check if user created this assessment or has access
      const assessment = await Assessment.findById(assessment_id);
      if (!assessment) {
        return res.status(404).json({
          success: false,
          error: 'Assessment not found'
        });
      }

      // Only allow assessment creator to see all results
      if (assessment.created_by !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only assessment creator can view all results.'
        });
      }

      const results = await Result.findByAssessmentId(assessment_id);

      res.json({
        success: true,
        data: {
          results,
          count: results.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch assessment results'
      });
    }
  },

  async getResultDetails(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Get result with assessment details
      const result = await Result.findUserAssessmentResult(userId, id);
      
      if (!result) {
        console.log("Looking for result1:", id);
        console.log("DB returned:", result);
        console.log("Token user ID:", req.user.id);
        return res.status(404).json({
          success: false,
          error: 'Result not found'
        });
      }

      res.json({
        success: true,
        data: {
          result
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch result details'
      });
    }
  },

  async getLeaderboard(req, res) {
    try {
      const { assessment_id } = req.params;
      const limit = parseInt(req.query.limit) || 10;

      const assessment = await Assessment.findById(assessment_id);
      if (!assessment) {
        return res.status(404).json({
          success: false,
          error: 'Assessment not found'
        });
      }

      const leaderboard = await Result.getLeaderboard(assessment_id, limit);

      res.json({
        success: true,
        data: {
          assessment: {
            id: assessment.id,
            title: assessment.title
          },
          leaderboard,
          count: leaderboard.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch leaderboard'
      });
    }
  },

  async deleteResult(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify ownership before deletion
      const result = await Result.findUserAssessmentResult(userId, id);
      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Result not found'
        });
      }

      await Result.delete(id);

      res.json({
        success: true,
        message: 'Result deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete result'
      });
    }
  },

  async getResult(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        console.log('Fetching result:', id, 'for user:', userId);

        // Get the result
        const result = await Result.findById(id);
        
        if (!result) {
            console.log("Looking for result2:", id);
            console.log("DB returned:", result);
            console.log("Token user ID:", req.user.id);
            return res.status(404).json({
                success: false,
                error: 'Result not found'
            });
        }

        // Check if the result belongs to the current user
        if (result.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. This result does not belong to you.'
            });
        }

        // Get detailed answers if available
        let detailedResults = [];
        try {
            // Try to get user answers if the table exists
            const userAnswers = await UserAnswer.findByResultId(id);
            if (userAnswers && userAnswers.length > 0) {
                // Get question details for each answer
                // detailedResults = await Promise.all(
                //     userAnswers.map(async (userAnswer) => {
                //         const question = await Question.findById(userAnswer.question_id);
                //         return {
                //             question_id: userAnswer.question_id,
                //             question_text: question ? question.question_text : 'Question not found',
                //             selected_answer: userAnswer.selected_answer,
                //             correct_answer: question ? question.correct_answer : -1,
                //             is_correct: userAnswer.is_correct,
                //             options: question ? (typeof question.options === 'string' 
                //                 ? JSON.parse(question.options) 
                //                 : question.options) : []
                //         };
                //     })
                // );
                // Fetch all question IDs in one go
                const questionIds = userAnswers.map(ans => ans.question_id);
                const questions = await Question.findByIds(questionIds);

                // Build a map for quick lookup
                const questionMap = {};
                questions.forEach(q => {
                  questionMap[q.id] = {
                    ...q,
                    options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
                  };
                });

                detailedResults = userAnswers.map(userAnswer => {
                  const question = questionMap[userAnswer.question_id];
                  return {
                    question_id: userAnswer.question_id,
                    question_text: question ? question.question_text : 'Question not found',
                    selected_answer: userAnswer.selected_answer,
                    correct_answer: question ? question.correct_answer : -1,
                    is_correct: userAnswer.is_correct,
                    options: question ? question.options : []
                  };
                });

            }
        } catch (error) {
            console.log('Could not fetch detailed answers:', error.message);
            // Continue without detailed results if table doesn't exist
        }

        res.json({
            success: true,
            data: {
                result: {
                    id: result.id,
                    score: result.score,
                    total_questions: result.total_questions,
                    percentage: Math.round((result.score / result.total_questions) * 100),
                    time_taken: result.time_taken,
                    completed_at: result.completed_at,
                    assessment_title: result.assessment_title || 'Assessment'
                },
                detailed_results: detailedResults
            }
        });

    } catch (error) {
        console.error('Error fetching result:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch result'
        });
    }
  }
};

module.exports = resultController;