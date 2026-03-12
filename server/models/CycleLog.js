const mongoose = require('mongoose');

const cycleLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Period start date is required'],
    },
    endDate: {
      type: Date,
    },
    cycleLength: {
      type: Number, // days between this period start and next period start
    },
    periodLength: {
      type: Number, // days of actual bleeding
    },
    flow: {
      type: String,
      enum: ['light', 'medium', 'heavy'],
      default: 'medium',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Auto-calculate period length when endDate is set
cycleLogSchema.pre('save', function (next) {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    this.periodLength = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
  next();
});

module.exports = mongoose.model('CycleLog', cycleLogSchema);
