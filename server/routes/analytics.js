const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getPCOSScore, getSummary, getAISuggestions } = require('../controllers/analyticsController');

router.use(auth);

router.get('/pcos-score', getPCOSScore);
router.get('/summary', getSummary);
router.get('/ai-suggestions', getAISuggestions);

module.exports = router;
