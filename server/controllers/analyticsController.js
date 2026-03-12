const CycleLog = require('../models/CycleLog');
const DailyLog = require('../models/DailyLog');
const { getPCOSRiskScore } = require('../utils/pcosScoring');
const { predictNextCycle, getCycleIrregularity } = require('../utils/cyclePrediction');
const { getHealthSuggestions, getMotivationalLine } = require('../utils/geminiService');

// GET /api/analytics/pcos-score
exports.getPCOSScore = async (req, res) => {
  try {
    const cycles = await CycleLog.find({ userId: req.user._id }).sort({ startDate: -1 });

    // Get last 90 days of daily logs
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const dailyLogs = await DailyLog.find({
      userId: req.user._id,
      date: { $gte: ninetyDaysAgo },
    });

    const result = getPCOSRiskScore(cycles, dailyLogs);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/analytics/summary
exports.getSummary = async (req, res) => {
  try {
    const cycles = await CycleLog.find({ userId: req.user._id }).sort({ startDate: -1 });

    // Last 30 days of logs
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLogs = await DailyLog.find({
      userId: req.user._id,
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: -1 });

    // Cycle prediction
    const prediction = predictNextCycle(cycles);
    const irregularity = getCycleIrregularity(cycles);

    // Symptom frequency (last 30 days)
    const symptomCounts = {};
    recentLogs.forEach((log) => {
      if (log.symptoms) {
        log.symptoms.forEach((s) => {
          symptomCounts[s] = (symptomCounts[s] || 0) + 1;
        });
      }
    });

    // Mood distribution (last 30 days)
    const moodCounts = {};
    recentLogs.forEach((log) => {
      if (log.mood) {
        moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1;
      }
    });

    // Lifestyle averages (last 30 days)
    const logsWithSleep = recentLogs.filter((l) => l.sleepHours != null);
    const logsWithWater = recentLogs.filter((l) => l.waterIntake != null);
    const logsWithExercise = recentLogs.filter((l) => l.exerciseMinutes != null);
    const logsWithStress = recentLogs.filter((l) => l.stressLevel != null);

    const lifestyle = {
      avgSleep: logsWithSleep.length
        ? Math.round((logsWithSleep.reduce((a, b) => a + b.sleepHours, 0) / logsWithSleep.length) * 10) / 10
        : null,
      avgWater: logsWithWater.length
        ? Math.round((logsWithWater.reduce((a, b) => a + b.waterIntake, 0) / logsWithWater.length) * 10) / 10
        : null,
      avgExercise: logsWithExercise.length
        ? Math.round(logsWithExercise.reduce((a, b) => a + b.exerciseMinutes, 0) / logsWithExercise.length)
        : null,
      avgStress: logsWithStress.length
        ? Math.round((logsWithStress.reduce((a, b) => a + b.stressLevel, 0) / logsWithStress.length) * 10) / 10
        : null,
    };

    // Get motivational line
    const motivationalLine = await getMotivationalLine(
      req.user.name,
      prediction?.cycleDay,
      prediction?.daysUntilPeriod
    );

    res.json({
      totalCycles: cycles.length,
      prediction,
      irregularity,
      symptomFrequency: symptomCounts,
      moodDistribution: moodCounts,
      lifestyle,
      recentLogsCount: recentLogs.length,
      motivationalLine,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/analytics/ai-suggestions
exports.getAISuggestions = async (req, res) => {
  try {
    const cycles = await CycleLog.find({ userId: req.user._id }).sort({ startDate: -1 });

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const dailyLogs = await DailyLog.find({
      userId: req.user._id,
      date: { $gte: ninetyDaysAgo },
    });

    // Get PCOS score
    const pcosResult = getPCOSRiskScore(cycles, dailyLogs);
    const irregularity = getCycleIrregularity(cycles);

    // Get top symptoms
    const symptomCounts = {};
    dailyLogs.forEach((log) => {
      if (log.symptoms) {
        log.symptoms.forEach((s) => {
          symptomCounts[s] = (symptomCounts[s] || 0) + 1;
        });
      }
    });
    const topSymptoms = Object.entries(symptomCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name]) => name.replace(/_/g, ' '))
      .join(', ');

    // Get diet patterns
    const dietCounts = {};
    dailyLogs.forEach((log) => {
      if (log.diet) {
        log.diet.forEach((d) => {
          dietCounts[d] = (dietCounts[d] || 0) + 1;
        });
      }
    });
    const dietPatterns = Object.entries(dietCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([name]) => name.replace(/_/g, ' '))
      .join(', ');

    // Lifestyle averages
    const logsWithSleep = dailyLogs.filter((l) => l.sleepHours != null);
    const logsWithWater = dailyLogs.filter((l) => l.waterIntake != null);
    const logsWithExercise = dailyLogs.filter((l) => l.exerciseMinutes != null);
    const logsWithStress = dailyLogs.filter((l) => l.stressLevel != null);

    const suggestions = await getHealthSuggestions({
      pcosScore: pcosResult.totalScore,
      riskLevel: pcosResult.riskLevel,
      cycleIrregularity: irregularity.isIrregular
        ? `Irregular (std dev: ${irregularity.stdDev} days)`
        : `Regular (std dev: ${irregularity.stdDev} days)`,
      avgSleep: logsWithSleep.length
        ? (logsWithSleep.reduce((a, b) => a + b.sleepHours, 0) / logsWithSleep.length).toFixed(1)
        : null,
      avgWater: logsWithWater.length
        ? (logsWithWater.reduce((a, b) => a + b.waterIntake, 0) / logsWithWater.length).toFixed(1)
        : null,
      avgExercise: logsWithExercise.length
        ? Math.round(logsWithExercise.reduce((a, b) => a + b.exerciseMinutes, 0) / logsWithExercise.length)
        : null,
      avgStress: logsWithStress.length
        ? (logsWithStress.reduce((a, b) => a + b.stressLevel, 0) / logsWithStress.length).toFixed(1)
        : null,
      topSymptoms,
      dietPatterns,
    });

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
