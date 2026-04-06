import { useState, useEffect } from 'react';
import { createOrUpdateLog, getTodayLog } from '../services/api';

const SYMPTOMS = [
  'cramps', 'bloating', 'headache', 'backache', 'acne', 'fatigue',
  'nausea', 'breast_tenderness', 'mood_swings', 'insomnia',
  'hot_flashes', 'dizziness', 'hair_loss', 'weight_gain', 'cravings',
  'anxiety', 'depression',
];

const MOODS = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'bad', emoji: '😟', label: 'Bad' },
  { value: 'terrible', emoji: '😢', label: 'Terrible' },
];

const DIET_OPTIONS = [
  'balanced', 'high_sugar', 'high_fat', 'processed_food',
  'fruits_veggies', 'dairy', 'caffeine', 'alcohol', 'skipped_meal',
];

export default function DailyLog() {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    mood: '',
    symptoms: [],
    sleepHours: '',
    waterIntake: '',
    exerciseMinutes: '',
    stressLevel: 3,
    diet: [],
    weight: '',
    notes: '',
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTodayLog()
      .then((res) => {
        if (res.data && res.data._id) {
          setForm({
            date: new Date().toISOString().split('T')[0],
            mood: res.data.mood || '',
            symptoms: res.data.symptoms || [],
            sleepHours: res.data.sleepHours ?? '',
            waterIntake: res.data.waterIntake ?? '',
            exerciseMinutes: res.data.exerciseMinutes ?? '',
            stressLevel: res.data.stressLevel ?? 3,
            diet: res.data.diet || [],
            weight: res.data.weight ?? '',
            notes: res.data.notes || '',
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleSymptom = (symptom) => {
    setForm((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom],
    }));
  };

  const toggleDiet = (item) => {
    setForm((prev) => ({
      ...prev,
      diet: prev.diet.includes(item)
        ? prev.diet.filter((d) => d !== item)
        : [...prev.diet, item],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        sleepHours: form.sleepHours !== '' ? Number(form.sleepHours) : undefined,
        waterIntake: form.waterIntake !== '' ? Number(form.waterIntake) : undefined,
        exerciseMinutes: form.exerciseMinutes !== '' ? Number(form.exerciseMinutes) : undefined,
        weight: form.weight !== '' ? Number(form.weight) : undefined,
        stressLevel: Number(form.stressLevel),
      };
      await createOrUpdateLog(payload);
      setSaved(true);
      // Reset form after saving
      setForm({
        date: new Date().toISOString().split('T')[0],
        mood: '',
        symptoms: [],
        sleepHours: '',
        waterIntake: '',
        exerciseMinutes: '',
        stressLevel: 3,
        diet: [],
        weight: '',
        notes: '',
      });
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving log');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="daily-log-page">
      <div className="page-header">
        <h1>Daily Log</h1>
        <p className="subtitle">How are you feeling today?</p>
      </div>

      {saved && <div className="success-message">Log saved successfully! ✓</div>}

      <form onSubmit={handleSubmit} className="daily-log-form">
        {/* Today's Date Display */}
        <div className="card today-date-card">
          <h3>📅 {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</h3>
        </div>

        {/* Mood */}
        <div className="card">
          <h3>Mood</h3>
          <div className="mood-picker">
            {MOODS.map((mood) => (
              <button
                key={mood.value}
                type="button"
                className={`mood-btn ${form.mood === mood.value ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, mood: mood.value })}
              >
                <span className="mood-emoji">{mood.emoji}</span>
                <span className="mood-label">{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Symptoms */}
        <div className="card">
          <h3>Symptoms</h3>
          <div className="tag-grid">
            {SYMPTOMS.map((symptom) => (
              <button
                key={symptom}
                type="button"
                className={`tag-btn ${form.symptoms.includes(symptom) ? 'selected' : ''}`}
                onClick={() => toggleSymptom(symptom)}
              >
                {symptom.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Lifestyle */}
        <div className="card">
          <h3>Lifestyle</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Sleep (hours)</label>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={form.sleepHours}
                onChange={(e) => setForm({ ...form, sleepHours: e.target.value })}
                placeholder="e.g. 7.5"
              />
            </div>
            <div className="form-group">
              <label>Water (glasses)</label>
              <input
                type="number"
                min="0"
                value={form.waterIntake}
                onChange={(e) => setForm({ ...form, waterIntake: e.target.value })}
                placeholder="e.g. 8"
              />
            </div>
            <div className="form-group">
              <label>Exercise (minutes)</label>
              <input
                type="number"
                min="0"
                value={form.exerciseMinutes}
                onChange={(e) => setForm({ ...form, exerciseMinutes: e.target.value })}
                placeholder="e.g. 30"
              />
            </div>
            <div className="form-group">
              <label>Weight (kg)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Stress Level */}
          <div className="form-group stress-group">
            <label>Stress Level: {form.stressLevel}/5</label>
            <input
              type="range"
              min="1"
              max="5"
              value={form.stressLevel}
              onChange={(e) => setForm({ ...form, stressLevel: e.target.value })}
              className="stress-slider"
            />
            <div className="stress-labels">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>

        {/* Diet */}
        <div className="card">
          <h3>Diet</h3>
          <div className="tag-grid">
            {DIET_OPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                className={`tag-btn ${form.diet.includes(item) ? 'selected' : ''}`}
                onClick={() => toggleDiet(item)}
              >
                {item.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h3>Notes</h3>
          <div className="form-group">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Anything else you want to note..."
              rows={4}
            />
          </div>
        </div>

        <button type="submit" className="btn-primary btn-save-log">
          Save Log
        </button>
      </form>
    </div>
  );
}
