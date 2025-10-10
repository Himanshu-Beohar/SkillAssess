const path = require('path');
const fs = require('fs');
const Result = require('../models/Result');
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const UserAnswer = require('../models/UserAnswer');
const emailService = require('../utils/emailService');
const certificateService = require('../utils/certificateService'); // ✅ Updated path
const { query } = require('../config/database'); // ✅ Added for database queries

const resultController = {
  // 🔹 1. Submit Assessment
  // async submitAssessment(req, res) {
  //   try {
  //     const { assessment_id, answers, time_taken } = req.body;
  //     const userId = req.user.id;

  //     const assessment = await Assessment.findById(assessment_id);
  //     if (!assessment) {
  //       return res.status(404).json({
  //         success: false,
  //         error: 'Assessment not found'
  //       });
  //     }

  //     // Calculate score
  //     let score = 0;
  //     const results = [];
  //     const questionIds = answers.map(a => a.question_id);
  //     const shownQuestions = await Question.findByIds(questionIds);

  //     answers.forEach(answer => {
  //       const question = shownQuestions.find(q => q.id === answer.question_id);
  //       if (question) {
  //         const isCorrect = question.correct_answer === answer.selected_answer;
  //         if (isCorrect) score++;

  //         results.push({
  //           question_id: question.id,
  //           question_text: question.question_text,
  //           selected_answer: answer.selected_answer,
  //           correct_answer: question.correct_answer,
  //           is_correct: isCorrect,
  //           options: typeof question.options === 'string'
  //             ? JSON.parse(question.options)
  //             : question.options
  //         });
  //       }
  //     });

  //     const total_questions = answers.length;
  //     const percentage = Math.round((score / total_questions) * 100);
  //     const status = percentage >= 60 ? 'pass' : 'fail';

  //     const previousAttempts = await Result.countByUserAndAssessment(userId, assessment_id);
  //     const attempt_number = previousAttempts + 1;

  //     const feedback = status === 'pass'
  //       ? 'Great job! You passed this assessment. Keep learning and aim higher!'
  //       : 'You didn\'t pass this time. Review the questions and try again soon.';

  //     // ✅ UPDATED: Generate certificate if passed (using new pattern)
  //     let certificate_url = null;
  //     if (status === 'pass') {
  //       try {
  //         certificate_url = await certificateService.generateCertificate({
  //           user: req.user,
  //           assessment,
  //           result: {
  //             percentage,
  //             attempt_number
  //           },
  //           completionDate: result.completed_at // ✅ Pass completion date
  //         });
  //         console.log(`✅ Certificate generated: ${certificate_url}`);
  //       } catch (err) {
  //         console.error('❌ Certificate generation failed:', err);
  //         // Don't fail the whole submission if certificate fails
  //       }
  //     } else {
  //       console.log('📝 Score below passing threshold, no certificate generated');
  //     }

  //     const resultData = {
  //       user_id: userId,
  //       assessment_id,
  //       score,
  //       total_questions,
  //       time_taken: time_taken || 0,
  //       status,
  //       percentage,
  //       attempt_number,
  //       certificate_url,
  //       feedback
  //     };

  //     const result = await Result.create(resultData);

  //     await Promise.all(results.map(async (r) => {
  //       await UserAnswer.create({
  //         result_id: result.id,
  //         question_id: r.question_id,
  //         selected_answer: r.selected_answer,
  //         is_correct: r.is_correct
  //       });
  //     }));

  //     try {
  //       const user = req.user;
  //       await emailService.sendAssessmentResult(user, assessment, {
  //         score,
  //         total: total_questions,
  //         percentage,
  //         status,
  //         certificate_url
  //       });
  //     } catch (emailErr) {
  //       console.error("⚠️ Failed to send assessment result email:", emailErr);
  //     }

  //     res.json({
  //       success: true,
  //       message: 'Assessment submitted successfully',
  //       data: {
  //         result: {
  //           id: result.id,
  //           score,
  //           total_questions,
  //           percentage,
  //           status,
  //           attempt_number,
  //           feedback,
  //           certificate_url,
  //           time_taken: result.time_taken,
  //           completed_at: result.completed_at
  //         },
  //         detailed_results: results
  //       }
  //     });

  //   } catch (error) {
  //     console.error('❌ Assessment submission error:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: 'Failed to submit assessment'
  //     });
  //   }
  // },

  // 🔹 1. Submit Assessment
  async submitAssessment(req, res) {
    try {
      const { assessment_id, answers, time_taken } = req.body;
      const userId = req.user.id;

      const assessment = await Assessment.findById(assessment_id);
      if (!assessment) {
        return res.status(404).json({
          success: false,
          error: 'Assessment not found'
        });
      }

      // Calculate score
      let score = 0;
      const results = [];
      const questionIds = answers.map(a => a.question_id);
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

      const total_questions = answers.length;
      const percentage = Math.round((score / total_questions) * 100);
      const status = percentage >= 60 ? 'pass' : 'fail';

      const previousAttempts = await Result.countByUserAndAssessment(userId, assessment_id);
      const attempt_number = previousAttempts + 1;

      const feedback = status === 'pass'
        ? 'Great job! You passed this assessment. Keep learning and aim higher!'
        : 'You didn\'t pass this time. Review the questions and try again soon.';

      // ✅ FIXED: Generate certificate if passed (MOVE THIS AFTER result is created)
      let certificate_url = null;

      // First create the result record
      const resultData = {
        user_id: userId,
        assessment_id,
        score,
        total_questions,
        time_taken: time_taken || 0,
        status,
        percentage,
        attempt_number,
        certificate_url, // initially null
        feedback
      };

      const result = await Result.create(resultData);

      // ✅ NOW generate certificate after result is created
      if (status === 'pass') {
        try {
          certificate_url = await certificateService.generateCertificate({
            user: req.user,
            assessment,
            result: {
              percentage,
              attempt_number
            },
            completionDate: result.completed_at // ✅ Use the actual completion date
          });
          console.log(`✅ Certificate generated: ${certificate_url}`);

          // Update the result with certificate URL
          await query(
            `UPDATE results SET certificate_url = $1 WHERE id = $2`,
            [certificate_url, result.id]
          );

        } catch (err) {
          console.error('❌ Certificate generation failed:', err);
          // Don't fail the whole submission if certificate fails
        }
      } else {
        console.log('📝 Score below passing threshold, no certificate generated');
      }

      await Promise.all(results.map(async (r) => {
        await UserAnswer.create({
          result_id: result.id,
          question_id: r.question_id,
          selected_answer: r.selected_answer,
          is_correct: r.is_correct
        });
      }));

      try {
        const user = req.user;
        await emailService.sendAssessmentResult(user, assessment, {
          score,
          total: total_questions,
          percentage,
          status,
          certificate_url
        });
      } catch (emailErr) {
        console.error("⚠️ Failed to send assessment result email:", emailErr);
      }

      // Return the final result with updated certificate_url
      res.json({
        success: true,
        message: 'Assessment submitted successfully',
        data: {
          result: {
            id: result.id,
            score,
            total_questions,
            percentage,
            status,
            attempt_number,
            feedback,
            certificate_url, // This will be the updated URL if certificate was generated
            time_taken: result.time_taken,
            completed_at: result.completed_at
          },
          detailed_results: results
        }
      });

    } catch (error) {
      console.error('❌ Assessment submission error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit assessment'
      });
    }
  },

  // 🔹 2. Get User Results
  async getUserResults(req, res) {
    try {
      const userId = req.user.id;
      const results = await Result.findByUserId(userId);

      res.json({
        success: true,
        data: { results, count: results.length }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch results' });
    }
  },

  // 🔹 3. Get Assessment Results
  async getAssessmentResults(req, res) {
    try {
      const { assessment_id } = req.params;
      const userId = req.user.id;

      const assessment = await Assessment.findById(assessment_id);
      if (!assessment) {
        return res.status(404).json({ success: false, error: 'Assessment not found' });
      }

      if (assessment.created_by !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only assessment creator can view all results.'
        });
      }

      const results = await Result.findByAssessmentId(assessment_id);

      res.json({
        success: true,
        data: { results, count: results.length }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch assessment results' });
    }
  },

  // 🔹 4. Get Result Details
  async getResultDetails(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await Result.findUserAssessmentResult(userId, id);
      if (!result) {
        return res.status(404).json({ success: false, error: 'Result not found' });
      }

      res.json({ success: true, data: { result } });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch result details' });
    }
  },

  // 🔹 5. Get Leaderboard
  async getLeaderboard(req, res) {
    try {
      const { assessment_id } = req.params;
      const limit = parseInt(req.query.limit) || 10;

      const assessment = await Assessment.findById(assessment_id);
      if (!assessment) {
        return res.status(404).json({ success: false, error: 'Assessment not found' });
      }

      const leaderboard = await Result.getLeaderboard(assessment_id, limit);
      res.json({
        success: true,
        data: {
          assessment: { id: assessment.id, title: assessment.title },
          leaderboard,
          count: leaderboard.length
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
    }
  },

  // 🔹 6. Delete Result
  async deleteResult(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await Result.findUserAssessmentResult(userId, id);
      if (!result) {
        return res.status(404).json({ success: false, error: 'Result not found' });
      }

      await Result.delete(id);

      res.json({ success: true, message: 'Result deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete result' });
    }
  },

  // 🔹 7. Get Result by ID
  async getResult(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await Result.findById(id);
      if (!result) {
        return res.status(404).json({ success: false, error: 'Result not found' });
      }

      if (result.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. This result does not belong to you.'
        });
      }

      let detailedResults = [];
      try {
        const userAnswers = await UserAnswer.findByResultId(id);
        if (userAnswers?.length) {
          const questionIds = userAnswers.map(ans => ans.question_id);
          const questions = await Question.findByIds(questionIds);

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
      res.status(500).json({ success: false, error: 'Failed to fetch result' });
    }
  },

  // ✅ UPDATED: Certificate download with regeneration
  async downloadCertificate(req, res) {
    try {
      const { result_id } = req.params;
      const userId = req.user.id;

      console.log(`📄 Certificate download requested - Result ID: ${result_id}, User ID: ${userId}`);

      const result = await Result.findById(result_id);
      if (!result) {
        return res.status(404).json({ 
          success: false, 
          error: 'Result not found' 
        });
      }

      if (result.user_id !== userId) {
        return res.status(403).json({ 
          success: false, 
          error: 'Unauthorized access to this certificate' 
        });
      }

      if (!result.certificate_url) {
        return res.status(400).json({ 
          success: false, 
          error: 'Certificate not generated for this result' 
        });
      }

      console.log('📁 Certificate URL from DB:', result.certificate_url);

      // ✅ NEW: Ensure certificate exists before downloading
      try {
        const assessment = await Assessment.findById(result.assessment_id);
        const userResult = await query('SELECT name FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0] || { name: 'Student' };

        const certificateUrl = await certificateService.ensureCertificateExists({
          user: {
            id: userId,
            name: user.name
          },
          assessment: {
            id: assessment.id,
            title: assessment.title
          },
          result: {
            percentage: result.percentage
          },
          certificateUrl: result.certificate_url,
          completionDate: result.completed_at // ✅ Pass completion date
        });

        console.log(`✅ Certificate verified: ${certificateUrl}`);
        
        // Update database if URL changed
        if (certificateUrl !== result.certificate_url) {
          await query(
            `UPDATE results SET certificate_url = $1 WHERE id = $2`,
            [certificateUrl, result_id]
          );
          console.log('✅ Updated certificate URL in database');
        }
      } catch (certError) {
        console.error('⚠️ Certificate verification failed, proceeding with download:', certError);
        // Continue with download even if verification fails
      }

      // Extract filename from certificate_url
      const filename = path.basename(result.certificate_url);
      console.log('📄 Certificate filename:', filename);

      // Build absolute path to certificate file
      const CERT_DIR = path.resolve(__dirname, '../../certificates');
      const certPath = path.join(CERT_DIR, filename);
      
      console.log('📁 Looking for certificate at:', certPath);
      console.log('📁 Certificate directory exists:', fs.existsSync(CERT_DIR));

      if (!fs.existsSync(certPath)) {
        console.error('❌ Certificate file not found at path:', certPath);
        
        if (fs.existsSync(CERT_DIR)) {
          const files = fs.readdirSync(CERT_DIR);
          console.log('📂 Available certificate files:', files);
        }
        
        return res.status(404).json({ 
          success: false, 
          error: 'Certificate file not found. Please try regenerating the certificate.' 
        });
      }

      const stats = fs.statSync(certPath);
      if (stats.size === 0) {
        console.error('❌ Certificate file is empty');
        return res.status(500).json({ 
          success: false, 
          error: 'Certificate file is corrupted' 
        });
      }

      console.log(`✅ Certificate found - Size: ${stats.size} bytes`);

      // res.setHeader('Content-Type', 'application/pdf');
      // //res.setHeader('Content-Disposition', `attachment; filename="certificate_${result_id}.pdf"`);

      // // Extract the correct filename from certificate_url
      // const fullFilename = path.basename(result.certificate_url);
      // res.setHeader('Content-Disposition', `attachment; filename="${fullFilename}"`);
      // res.setHeader('Content-Length', stats.size);
      // res.setHeader('Cache-Control', 'no-cache');

      // ✅ Use the filename from certificate_url
      const downloadName = path.basename(result.certificate_url);

      // Set safe content disposition with UTF-8 support
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`
      );
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Content-Length', stats.size);
      console.log('🎯 Sending Content-Disposition:', res.getHeader('Content-Disposition'));


      const fileStream = fs.createReadStream(certPath);
      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        console.error('❌ Error streaming certificate:', error);
        if (!res.headersSent) {
          res.status(500).json({ 
            success: false, 
            error: 'Error streaming certificate file' 
          });
        }
      });

    } catch (error) {
      console.error('❌ Certificate download error:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          error: 'Failed to download certificate' 
        });
      }
    }
  },

  // ✅ NEW: Regenerate certificate if missing
  async regenerateCertificate(req, res) {
    try {
      const { result_id } = req.params;
      const userId = req.user.id;

      console.log(`🔄 Regenerating certificate for result: ${result_id}, user: ${userId}`);

      // 1. Get result with assessment details
      const result = await Result.findById(result_id);
      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Result not found'
        });
      }

      if (result.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to this result'
        });
      }

      // 2. Only regenerate for passing results
      if (result.percentage < 60) {
        return res.status(400).json({
          success: false,
          error: 'Certificate only available for passing results (60% or higher)'
        });
      }

      // 3. Get assessment details
      const assessment = await Assessment.findById(result.assessment_id);
      if (!assessment) {
        return res.status(404).json({
          success: false,
          error: 'Assessment not found'
        });
      }

      // 4. Get user details
      const userResult = await query('SELECT name, email FROM users WHERE id = $1', [userId]);
      const user = userResult.rows[0] || { name: 'Student', email: '' };

      // 5. Use ensureCertificateExists to check and regenerate if needed
      const certificateUrl = await certificateService.ensureCertificateExists({
        user: {
          id: userId,
          name: user.name
        },
        assessment: {
          id: assessment.id,
          title: assessment.title
        },
        result: {
          percentage: result.percentage
        },
        certificateUrl: result.certificate_url,
        completionDate: result.completed_at // ✅ Pass completion date
      });

      // 6. Update certificate URL in database if it changed
      if (certificateUrl !== result.certificate_url) {
        await query(
          `UPDATE results SET certificate_url = $1 WHERE id = $2`,
          [certificateUrl, result_id]
        );
        console.log(`✅ Updated certificate URL in database: ${certificateUrl}`);
      }

      res.json({
        success: true,
        data: {
          certificate_url: certificateUrl,
          message: certificateUrl === result.certificate_url ? 
            'Certificate verified and available' : 
            'Certificate regenerated successfully'
        }
      });

    } catch (error) {
      console.error('❌ Certificate regeneration error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to regenerate certificate'
      });
    }
  },

  // ✅ UPDATED: Direct file serving by filename (for testing) with regeneration
  async serveCertificateByFilename(req, res) {
    try {
      const { filename } = req.params;
      
      console.log('📄 Direct certificate request for:', filename);

      const CERT_DIR = path.resolve(__dirname, '../../certificates');
      const certPath = path.join(CERT_DIR, filename);
      
      console.log('📁 Looking for certificate at:', certPath);

      if (!fs.existsSync(certPath)) {
        console.error('❌ Certificate file not found at path:', certPath);
        
        // Try to extract info from filename to regenerate
        const filenameMatch = filename.match(/certificate_(\d+)_(\d+)_(\d+)\.pdf/);
        if (filenameMatch) {
          const userId = parseInt(filenameMatch[1]);
          const assessmentId = parseInt(filenameMatch[2]);
          const timestamp = filenameMatch[3];
          
          console.log(`🔄 Attempting to regenerate from filename: user=${userId}, assessment=${assessmentId}`);
          
          // You could add regeneration logic here if needed
        }
        
        return res.status(404).send('Certificate file not found');
      }

      const stats = fs.statSync(certPath);
      if (stats.size === 0) {
        console.error('❌ Certificate file is empty');
        return res.status(500).send('Certificate file is corrupted');
      }

      console.log(`✅ Certificate found - Size: ${stats.size} bytes`);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', 'no-cache');

      const fileStream = fs.createReadStream(certPath);
      fileStream.pipe(res);

    } catch (error) {
      console.error('❌ Certificate serve error:', error);
      res.status(500).send('Failed to serve certificate');
    }
  }
};

module.exports = resultController;