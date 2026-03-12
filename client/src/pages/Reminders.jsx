import { useState, useEffect } from 'react';
import {
  getReminders, createReminder, updateReminder, deleteReminder,
} from '../services/api';
import { FiTrash2, FiPlus, FiBell, FiBellOff } from 'react-icons/fi';

const REMINDER_TYPES = [
  { value: 'period', label: 'Period', icon: '🩸' },
  { value: 'medication', label: 'Medication', icon: '💊' },
  { value: 'hydration', label: 'Hydration', icon: '💧' },
  { value: 'exercise', label: 'Exercise', icon: '🏃‍♀️' },
  { value: 'sleep', label: 'Sleep', icon: '😴' },
  { value: 'custom', label: 'Custom', icon: '📝' },
];

const DAYS = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
];

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifPermission, setNotifPermission] = useState('default');
  const [form, setForm] = useState({
    type: 'hydration',
    message: '',
    time: '09:00',
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
  });

  useEffect(() => {
    fetchReminders();
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const fetchReminders = async () => {
    try {
      const res = await getReminders();
      setReminders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const requestNotifPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createReminder(form);
      setForm({ type: 'hydration', message: '', time: '09:00', days: ['mon', 'tue', 'wed', 'thu', 'fri'] });
      setShowForm(false);
      fetchReminders();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating reminder');
    }
  };

  const toggleActive = async (reminder) => {
    await updateReminder(reminder._id, { isActive: !reminder.isActive });
    fetchReminders();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this reminder?')) {
      await deleteReminder(id);
      fetchReminders();
    }
  };

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  if (loading) return <div className="loading">Loading reminders...</div>;

  return (
    <div className="reminders-page">
      <div className="page-header">
        <h1>Reminders</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <FiPlus /> New Reminder
        </button>
      </div>

      {/* Notification Permission */}
      {notifPermission !== 'granted' && (
        <div className="card notification-banner">
          <p>Enable browser notifications to receive reminder alerts</p>
          <button className="btn-secondary" onClick={requestNotifPermission}>
            Enable Notifications
          </button>
        </div>
      )}

      {/* New Reminder Form */}
      {showForm && (
        <div className="card form-card">
          <h3>Create Reminder</h3>
          <form onSubmit={handleSubmit} className="reminder-form">
            <div className="form-group">
              <label>Type</label>
              <div className="type-picker">
                {REMINDER_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={`type-btn ${form.type === t.value ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, type: t.value })}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Message</label>
              <input
                type="text"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="e.g. Drink water!"
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Time</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Days</label>
              <div className="day-picker">
                {DAYS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    className={`day-btn ${form.days.includes(d.value) ? 'selected' : ''}`}
                    onClick={() => toggleDay(d.value)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Create</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reminders List */}
      <div className="reminder-list">
        {reminders.length === 0 ? (
          <div className="card empty-state">
            <p>No reminders yet. Create one to stay on track!</p>
          </div>
        ) : (
          reminders.map((r) => (
            <div key={r._id} className={`card reminder-item ${!r.isActive ? 'inactive' : ''}`}>
              <div className="reminder-header">
                <span className="reminder-icon">
                  {REMINDER_TYPES.find((t) => t.value === r.type)?.icon || '📝'}
                </span>
                <div className="reminder-info">
                  <h4>{r.message}</h4>
                  <div className="reminder-meta">
                    <span className="reminder-time">{r.time}</span>
                    <span className="reminder-days">
                      {r.days.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="reminder-actions">
                <button
                  className={`btn-icon ${r.isActive ? 'active' : ''}`}
                  onClick={() => toggleActive(r)}
                  title={r.isActive ? 'Disable' : 'Enable'}
                >
                  {r.isActive ? <FiBell /> : <FiBellOff />}
                </button>
                <button className="btn-icon danger" onClick={() => handleDelete(r._id)}>
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
