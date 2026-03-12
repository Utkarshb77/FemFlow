const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['period', 'medication', 'hydration', 'exercise', 'sleep', 'custom'],
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Reminder message is required'],
      trim: true,
    },
    time: {
      type: String, // HH:mm format
      required: true,
    },
    days: [
      {
        type: String,
        enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastTriggered: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reminder', reminderSchema);
