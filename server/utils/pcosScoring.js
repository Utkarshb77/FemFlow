/**
 * PCOS Risk Scoring Algorithm
 *
 * Scores based on:
 * 1. Cycle irregularity (0-30 points)
 * 2. Symptom frequency (0-40 points)
 * 3. Lifestyle factors (0-30 points)
 *
 * Total: 0-100
 * Low: 0-30 | Moderate: 31-60 | High: 61-100
 *
 * DISCLAIMER: This is NOT a medical diagnosis tool.
 */

const { getCycleIrregularity } = require('./cyclePrediction');

const PCOS_SYMPTOMS = [
  'acne',
  'hair_loss',
  'weight_gain',
  'mood_swings',
  'fatigue',
  'insomnia',
  'anxiety',
  'depression',
  'bloating',
  'cravings',
];

function calculateCycleScore(cycles) {
  const { stdDev, isIrregular, cycleLengths } = getCycleIrregularity(cycles);

  let score = 0;

  // High standard deviation = more irregular
  if (stdDev > 10) score += 30;
  else if (stdDev > 7) score += 20;
  else if (stdDev > 4) score += 10;
  else score += 0;

  // Very long or short cycles
  if (cycleLengths && cycleLengths.length > 0) {
    const avg = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
    if (avg > 35 || avg < 21) score = Math.min(30, score + 10);
  }

  return score;
}

function calculateSymptomScore(dailyLogs) {
  if (!dailyLogs || dailyLogs.length === 0) return 0;

  const symptomCounts = {};
  PCOS_SYMPTOMS.forEach((s) => (symptomCounts[s] = 0));

  dailyLogs.forEach((log) => {
    if (log.symptoms) {
      log.symptoms.forEach((s) => {
        if (PCOS_SYMPTOMS.includes(s)) {
          symptomCounts[s]++;
        }
      });
    }
  });

  const totalDays = dailyLogs.length;
  let score = 0;

  // For each PCOS-related symptom, check frequency
  Object.entries(symptomCounts).forEach(([symptom, count]) => {
    const frequency = count / totalDays;
    if (frequency > 0.5) score += 6; // >50% of days
    else if (frequency > 0.3) score += 4; // >30% of days
    else if (frequency > 0.1) score += 2; // >10% of days
  });

  return Math.min(40, score);
}

function calculateLifestyleScore(dailyLogs) {
  if (!dailyLogs || dailyLogs.length === 0) return 0;

  let score = 0;
  const totalDays = dailyLogs.length;

  // Sleep analysis
  const sleepLogs = dailyLogs.filter((l) => l.sleepHours != null);
  if (sleepLogs.length > 0) {
    const avgSleep = sleepLogs.reduce((a, b) => a + b.sleepHours, 0) / sleepLogs.length;
    if (avgSleep < 6) score += 10;
    else if (avgSleep < 7) score += 5;
  }

  // Exercise analysis
  const exerciseLogs = dailyLogs.filter((l) => l.exerciseMinutes != null);
  if (exerciseLogs.length > 0) {
    const avgExercise =
      exerciseLogs.reduce((a, b) => a + b.exerciseMinutes, 0) / exerciseLogs.length;
    if (avgExercise < 15) score += 10;
    else if (avgExercise < 30) score += 5;
  }

  // Stress analysis
  const stressLogs = dailyLogs.filter((l) => l.stressLevel != null);
  if (stressLogs.length > 0) {
    const avgStress = stressLogs.reduce((a, b) => a + b.stressLevel, 0) / stressLogs.length;
    if (avgStress > 4) score += 10;
    else if (avgStress > 3) score += 5;
  }

  // Diet analysis
  let unhealthyDietDays = 0;
  dailyLogs.forEach((log) => {
    if (log.diet) {
      const unhealthy = log.diet.filter((d) =>
        ['high_sugar', 'high_fat', 'processed_food', 'skipped_meal'].includes(d)
      );
      if (unhealthy.length >= 2) unhealthyDietDays++;
    }
  });
  const dietRatio = unhealthyDietDays / totalDays;
  if (dietRatio > 0.5) score += 10;
  else if (dietRatio > 0.3) score += 5;

  return Math.min(30, score);
}

function getPCOSRiskScore(cycles, dailyLogs) {
  const cycleScore = calculateCycleScore(cycles);
  const symptomScore = calculateSymptomScore(dailyLogs);
  const lifestyleScore = calculateLifestyleScore(dailyLogs);
  const totalScore = cycleScore + symptomScore + lifestyleScore;

  let riskLevel, color;
  if (totalScore <= 30) {
    riskLevel = 'Low';
    color = '#4CAF50';
  } else if (totalScore <= 60) {
    riskLevel = 'Moderate';
    color = '#FF9800';
  } else {
    riskLevel = 'High';
    color = '#F44336';
  }

  // Generate personalized tips
  const tips = [];
  if (cycleScore > 15) {
    tips.push('Your cycle appears irregular. Consider consulting a gynecologist for evaluation.');
  }
  if (symptomScore > 20) {
    tips.push(
      'You frequently experience PCOS-related symptoms. Tracking patterns can help your doctor with diagnosis.'
    );
  }
  if (lifestyleScore > 15) {
    tips.push(
      'Improving sleep, exercise, and diet habits can significantly help manage PCOS symptoms.'
    );
  }
  if (totalScore <= 30) {
    tips.push('Your indicators look good! Keep maintaining healthy habits.');
  }

  return {
    totalScore,
    riskLevel,
    color,
    breakdown: {
      cycleRegularity: { score: cycleScore, max: 30 },
      symptoms: { score: symptomScore, max: 40 },
      lifestyle: { score: lifestyleScore, max: 30 },
    },
    tips,
    disclaimer:
      'This is an informational tool only and NOT a medical diagnosis. Please consult a healthcare professional for proper evaluation.',
  };
}

module.exports = { getPCOSRiskScore };
