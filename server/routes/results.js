// const express = require('express');
// const router = express.Router();
// const resultController = require('../controllers/resultController');
// const { authenticateToken } = require('../middleware/auth');

// // Protected routes
// router.post('/submit', authenticateToken, resultController.submitAssessment);
// router.get('/my-results', authenticateToken, resultController.getUserResults);
// router.get('/assessment/:assessment_id', authenticateToken, resultController.getAssessmentResults);
// router.get('/leaderboard/:assessment_id', authenticateToken, resultController.getLeaderboard);
// router.delete('/:id', authenticateToken, resultController.deleteResult);

// // Get specific result by ID
// router.get('/:id', authenticateToken, resultController.getResult);

// // ✅ FIXED: Certificate download routes
// router.get('/:result_id/certificate', authenticateToken, resultController.downloadCertificate);

// // ✅ NEW: Direct certificate access (for testing)
// router.get('/certificate-file/:filename', resultController.serveCertificateByFilename);

// module.exports = router;

const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { authenticateToken } = require('../middleware/auth');

// Protected routes
router.post('/submit', authenticateToken, resultController.submitAssessment);
router.get('/my-results', authenticateToken, resultController.getUserResults);
router.get('/assessment/:assessment_id', authenticateToken, resultController.getAssessmentResults);
router.get('/leaderboard/:assessment_id', authenticateToken, resultController.getLeaderboard);
router.delete('/:id', authenticateToken, resultController.deleteResult);

// Get specific result by ID
router.get('/:id', authenticateToken, resultController.getResult);

// ✅ Certificate routes
router.get('/:result_id/certificate', authenticateToken, resultController.downloadCertificate);
router.post('/:result_id/certificate/regenerate', authenticateToken, resultController.regenerateCertificate); // ✅ NEW

// ✅ Direct certificate access (for testing)
router.get('/certificate-file/:filename', resultController.serveCertificateByFilename);

module.exports = router;