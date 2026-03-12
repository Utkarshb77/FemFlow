const DailyLog = require('../models/DailyLog');

// POST /api/logs
exports.createOrUpdateLog = async (req, res) => {
  try {
    const { date, mood, symptoms, sleepHours, waterIntake, exerciseMinutes, stressLevel, diet, weight, notes } = req.body;

    const logDate = new Date(date);
    logDate.setHours(0, 0, 0, 0);

    const log = await DailyLog.findOneAndUpdate(
      { userId: req.user._id, date: logDate },
      {
        userId: req.user._id,
        date: logDate,
        mood,
        symptoms,
        sleepHours,
        waterIntake,
        exerciseMinutes,
        stressLevel,
        diet,
        weight,
        notes,
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(log);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/logs
exports.getLogs = async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = { userId: req.user._id };

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    const logs = await DailyLog.find(query).sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/logs/today
exports.getTodayLog = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const log = await DailyLog.findOne({ userId: req.user._id, date: today });
    res.json(log || {});
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/logs/:id
exports.deleteLog = async (req, res) => {
  try {
    const log = await DailyLog.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!log) return res.status(404).json({ message: 'Log not found' });
    res.json({ message: 'Log deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
