const CycleLog = require('../models/CycleLog');
const { predictNextCycle, calculateAverageCycleLength, getCycleIrregularity } = require('../utils/cyclePrediction');
const { getAICyclePrediction, getMotivationalLine } = require('../utils/geminiService');

// POST /api/cycles
exports.createCycle = async (req, res) => {
  try {
    const { startDate, endDate, flow, notes } = req.body;

    // Calculate cycle length from previous cycle
    const lastCycle = await CycleLog.findOne({ userId: req.user._id }).sort({ startDate: -1 });
    let cycleLength = null;
    if (lastCycle) {
      cycleLength = Math.round(
        (new Date(startDate) - new Date(lastCycle.startDate)) / (1000 * 60 * 60 * 24)
      );
      // Update previous cycle's cycleLength
      lastCycle.cycleLength = cycleLength;
      await lastCycle.save();
    }

    const cycle = await CycleLog.create({
      userId: req.user._id,
      startDate,
      endDate,
      flow,
      notes,
    });

    res.status(201).json(cycle);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/cycles
exports.getCycles = async (req, res) => {
  try {
    const cycles = await CycleLog.find({ userId: req.user._id }).sort({ startDate: -1 });
    res.json(cycles);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /api/cycles/:id
exports.updateCycle = async (req, res) => {
  try {
    const cycle = await CycleLog.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!cycle) return res.status(404).json({ message: 'Cycle not found' });
    res.json(cycle);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/cycles/:id
exports.deleteCycle = async (req, res) => {
  try {
    const cycle = await CycleLog.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!cycle) return res.status(404).json({ message: 'Cycle not found' });
    res.json({ message: 'Cycle deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/cycles/predict
exports.getPrediction = async (req, res) => {
  try {
    const cycles = await CycleLog.find({ userId: req.user._id }).sort({ startDate: -1 });
    const prediction = predictNextCycle(cycles);

    if (!prediction) {
      const motivationalLine = await getMotivationalLine(req.user.name);
      return res.json({
        message: 'Log at least one period to get predictions',
        prediction: null,
        motivationalLine,
      });
    }

    // Get Gemini AI insights in parallel
    const irregularity = getCycleIrregularity(cycles);
    const [aiInsights, motivationalLine] = await Promise.all([
      getAICyclePrediction({
        ...prediction,
        cycleLengths: irregularity.cycleLengths,
      }),
      getMotivationalLine(req.user.name, prediction.cycleDay, prediction.daysUntilPeriod),
    ]);

    res.json({
      ...prediction,
      motivationalLine,
      aiInsights,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
