const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { authenticateToken } = require('../middleware/auth');

// Protected routes
router.post('/submit', authenticateToken, resultController.submitAssessment);
router.get('/my-results', authenticateToken, resultController.getUserResults);
router.get('/assessment/:assessment_id', authenticateToken, resultController.getAssessmentResults);
router.get('/:id', authenticateToken, resultController.getResultDetails);
router.get('/leaderboard/:assessment_id', authenticateToken, resultController.getLeaderboard);
router.delete('/:id', authenticateToken, resultController.deleteResult

);

module.exports = router;

