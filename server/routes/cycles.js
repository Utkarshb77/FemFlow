const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createCycle,
  getCycles,
  updateCycle,
  deleteCycle,
  getPrediction,
} = require('../controllers/cycleController');

router.use(auth);

router.post('/', createCycle);
router.get('/', getCycles);
router.get('/predict', getPrediction);
router.put('/:id', updateCycle);
router.delete('/:id', deleteCycle);

module.exports = router;
