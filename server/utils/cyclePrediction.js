/**
 * Cycle Prediction Algorithm
 * - Uses last 3-6 cycles to calculate average cycle length
 * - Predicts next period, fertile window, and ovulation
 */

function calculateAverageCycleLength(cycles) {
  if (!cycles || cycles.length < 2) return 28; // default

  // Sort by start date ascending
  const sorted = [...cycles].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  const cycleLengths = [];
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round(
      (new Date(sorted[i].startDate) - new Date(sorted[i - 1].startDate)) / (1000 * 60 * 60 * 24)
    );
    if (diff > 15 && diff < 60) {
      // reasonable cycle length
      cycleLengths.push(diff);
    }
  }

  if (cycleLengths.length === 0) return 28;

  // Use last 6 cycles max
  const recent = cycleLengths.slice(-6);
  return Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);
}

function calculateAveragePeriodLength(cycles) {
  const withPeriodLength = cycles.filter((c) => c.periodLength && c.periodLength > 0);
  if (withPeriodLength.length === 0) return 5;

  const recent = withPeriodLength.slice(-6);
  return Math.round(recent.reduce((a, b) => a + b.periodLength, 0) / recent.length);
}

function predictNextCycle(cycles) {
  if (!cycles || cycles.length === 0) {
    return null;
  }

  const sorted = [...cycles].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  const lastPeriod = sorted[0];
  const avgCycleLength = calculateAverageCycleLength(cycles);
  const avgPeriodLength = calculateAveragePeriodLength(cycles);

  const lastStart = new Date(lastPeriod.startDate);

  // Next period start
  const nextPeriodStart = new Date(lastStart);
  nextPeriodStart.setDate(nextPeriodStart.getDate() + avgCycleLength);

  // Next period end (estimated)
  const nextPeriodEnd = new Date(nextPeriodStart);
  nextPeriodEnd.setDate(nextPeriodEnd.getDate() + avgPeriodLength - 1);

  // Ovulation: typically 14 days before next period
  const ovulationDate = new Date(nextPeriodStart);
  ovulationDate.setDate(ovulationDate.getDate() - 14);

  // Fertile window: 5 days before ovulation + ovulation day
  const fertileStart = new Date(ovulationDate);
  fertileStart.setDate(fertileStart.getDate() - 5);
  const fertileEnd = new Date(ovulationDate);
  fertileEnd.setDate(fertileEnd.getDate() + 1);

  // Days until next period
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilPeriod = Math.ceil((nextPeriodStart - today) / (1000 * 60 * 60 * 24));

  return {
    avgCycleLength,
    avgPeriodLength,
    lastPeriodStart: lastPeriod.startDate,
    nextPeriodStart,
    nextPeriodEnd,
    ovulationDate,
    fertileWindow: {
      start: fertileStart,
      end: fertileEnd,
    },
    daysUntilPeriod: Math.max(0, daysUntilPeriod),
    cycleDay: avgCycleLength - Math.max(0, daysUntilPeriod) + 1,
  };
}

function getCycleIrregularity(cycles) {
  if (!cycles || cycles.length < 3) return { stdDev: 0, isIrregular: false };

  const sorted = [...cycles].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  const lengths = [];
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round(
      (new Date(sorted[i].startDate) - new Date(sorted[i - 1].startDate)) / (1000 * 60 * 60 * 24)
    );
    if (diff > 15 && diff < 60) lengths.push(diff);
  }

  if (lengths.length < 2) return { stdDev: 0, isIrregular: false };

  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  return {
    stdDev: Math.round(stdDev * 10) / 10,
    isIrregular: stdDev > 7, // >7 days std dev = irregular
    cycleLengths: lengths,
    mean: Math.round(mean),
  };
}

module.exports = {
  calculateAverageCycleLength,
  calculateAveragePeriodLength,
  predictNextCycle,
  getCycleIrregularity,
};
