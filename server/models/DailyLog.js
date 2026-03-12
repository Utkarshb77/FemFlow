const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    mood: {
      type: String,
      enum: ['great', 'good', 'okay', 'bad', 'terrible'],
    },
    symptoms: [
      {
        type: String,
        enum: [
          'cramps',
          'bloating',
          'headache',
          'backache',
          'acne',
          'fatigue',
          'nausea',
          'breast_tenderness',
          'mood_swings',
          'insomnia',
          'hot_flashes',
          'dizziness',
          'hair_loss',
          'weight_gain',
          'cravings',
          'anxiety',
          'depression',
        ],
      },
    ],
    sleepHours: {
      type: Number,
      min: 0,
      max: 24,
    },
    waterIntake: {
      type: Number, // glasses
      min: 0,
    },
    exerciseMinutes: {
      type: Number,
      min: 0,
    },
    stressLevel: {
      type: Number,
      min: 1,
      max: 5,
    },
    diet: [
      {
        type: String,
        enum: [
          'balanced',
          'high_sugar',
          'high_fat',
          'processed_food',
          'fruits_veggies',
          'dairy',
          'caffeine',
          'alcohol',
          'skipped_meal',
        ],
      },
    ],
    weight: {
      type: Number, // kg
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Ensure one log per user per day
dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);
