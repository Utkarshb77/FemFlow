const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createReminder,
  getReminders,
  updateReminder,
  deleteReminder,
  getActiveReminders,
} = require('../controllers/reminderController');

router.use(auth);

router.post('/', createReminder);
router.get('/', getReminders);
router.get('/active', getActiveReminders);
router.put('/:id', updateReminder);
router.delete('/:id', deleteReminder);

module.exports = router;
