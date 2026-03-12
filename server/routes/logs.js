const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createOrUpdateLog,
  getLogs,
  getTodayLog,
  deleteLog,
} = require('../controllers/logController');

router.use(auth);

router.post('/', createOrUpdateLog);
router.get('/', getLogs);
router.get('/today', getTodayLog);
router.delete('/:id', deleteLog);

module.exports = router;
