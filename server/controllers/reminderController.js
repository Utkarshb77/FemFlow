const Reminder = require('../models/Reminder');

// POST /api/reminders
exports.createReminder = async (req, res) => {
  try {
    const { type, message, time, days } = req.body;
    const reminder = await Reminder.create({
      userId: req.user._id,
      type,
      message,
      time,
      days,
    });
    res.status(201).json(reminder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/reminders
exports.getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /api/reminders/:id
exports.updateReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/reminders/:id
exports.deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    res.json({ message: 'Reminder deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/reminders/active
exports.getActiveReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({
      userId: req.user._id,
      isActive: true,
    });
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
