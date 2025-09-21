const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validateAssessment } = require('../middleware/validation');

// Public routes
router.get('/', optionalAuth, assessmentController.getAllAssessments);
router.get('/:id', optionalAuth, assessmentController.getAssessment);

// Protected routes
router.post('/', authenticateToken, validateAssessment, assessmentController.createAssessment);
router.put('/:id', authenticateToken, assessmentController.updateAssessment);
router.delete('/:id', authenticateToken, assessmentController.deleteAssessment);
router.post('/:assessment_id/questions', authenticateToken, assessmentController.addQuestion);
router.get('/user/my-assessments', authenticateToken, assessmentController.getUserAssessments);
router.get('/:id/start', authenticateToken, assessmentController.startAssessment);
// Get instructions for a specific assessment (protected)
//router.get('/:id/instructions', authenticateToken, assessmentController.getInstructions);
router.get('/:id/instructions', authenticateToken, assessmentController.getAssessmentInstructions);


module.exports = router;