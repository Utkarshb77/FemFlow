const Reminder = require('../models/Reminder');

const DAYS_MAP = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
};

async function checkReminders() {
  try {
    const now = new Date();
    const currentDay = DAYS_MAP[now.getDay()];
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHour}:00`; // check on the hour since cron runs hourly

    const reminders = await Reminder.find({
      isActive: true,
      time: currentTime,
      days: currentDay,
    });

    for (const reminder of reminders) {
      // Mark as triggered
      reminder.lastTriggered = now;
      await reminder.save();
      console.log(`Reminder triggered: ${reminder.message} for user ${reminder.userId}`);
    }

    return reminders;
  } catch (error) {
    console.error('Error checking reminders:', error);
    return [];
  }
}

module.exports = { checkReminders };
