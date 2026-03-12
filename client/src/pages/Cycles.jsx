import { useState, useEffect } from 'react';
import { getCycles, createCycle, deleteCycle, getCyclePrediction } from '../services/api';
import { FiTrash2, FiPlus } from 'react-icons/fi';

export default function Cycles() {
  const [cycles, setCycles] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    flow: 'medium',
    notes: '',
  });

  const fetchData = async () => {
    try {
      const [cycleRes, predRes] = await Promise.all([getCycles(), getCyclePrediction()]);
      setCycles(cycleRes.data);
      setPrediction(predRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCycle(form);
      setForm({ startDate: '', endDate: '', flow: 'medium', notes: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error logging period');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this cycle record?')) {
      await deleteCycle(id);
      fetchData();
    }
  };

  if (loading) return <div className="loading">Loading cycles...</div>;

  return (
    <div className="cycles-page">
      {/* Gemini Motivational Line */}
      {prediction?.motivationalLine && (
        <div className="motivational-banner">
          <p>{prediction.motivationalLine}</p>
        </div>
      )}

      <div className="page-header">
        <h1>Cycle Tracking</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <FiPlus /> Log Period
        </button>
      </div>

      {/* Prediction Card */}
      {prediction && !prediction.message && (
        <div className="card prediction-card">
          <h3>Cycle Predictions (Powered by Gemini AI)</h3>
          <div className="prediction-grid">
            <div className="pred-item">
              <span className="pred-label">Next Period</span>
              <span className="pred-value">
                {new Date(prediction.nextPeriodStart).toLocaleDateString()}
              </span>
              <span className="pred-sub">{prediction.daysUntilPeriod} days away</span>
            </div>
            <div className="pred-item">
              <span className="pred-label">Ovulation</span>
              <span className="pred-value">
                {new Date(prediction.ovulationDate).toLocaleDateString()}
              </span>
            </div>
            <div className="pred-item">
              <span className="pred-label">Fertile Window</span>
              <span className="pred-value">
                {new Date(prediction.fertileWindow.start).toLocaleDateString()} -{' '}
                {new Date(prediction.fertileWindow.end).toLocaleDateString()}
              </span>
            </div>
            <div className="pred-item">
              <span className="pred-label">Avg Cycle Length</span>
              <span className="pred-value">{prediction.avgCycleLength} days</span>
            </div>
          </div>

          {/* Gemini AI Insights */}
          {prediction.aiInsights && (
            <div className="ai-insights-section">
              <h4>AI Insights</h4>
              <div className="ai-tips-list">
                {prediction.aiInsights.phaseInfo && (
                  <div className="ai-tip-item">
                    <span className="ai-tip-icon">🌙</span>
                    <div>
                      <strong>Current Phase</strong>
                      <p>{prediction.aiInsights.phaseInfo}</p>
                    </div>
                  </div>
                )}
                {prediction.aiInsights.bodyTip && (
                  <div className="ai-tip-item">
                    <span className="ai-tip-icon">🧬</span>
                    <div>
                      <strong>Body Tip</strong>
                      <p>{prediction.aiInsights.bodyTip}</p>
                    </div>
                  </div>
                )}
                {prediction.aiInsights.wellnessTip && (
                  <div className="ai-tip-item">
                    <span className="ai-tip-icon">💆‍♀️</span>
                    <div>
                      <strong>Wellness Tip</strong>
                      <p>{prediction.aiInsights.wellnessTip}</p>
                    </div>
                  </div>
                )}
                {prediction.aiInsights.prediction_note && (
                  <div className="ai-tip-item">
                    <span className="ai-tip-icon">📊</span>
                    <div>
                      <strong>Prediction Note</strong>
                      <p>{prediction.aiInsights.prediction_note}</p>
                    </div>
                  </div>
                )}
              </div>
              {prediction.aiInsights.encouragement && (
                <div className="ai-encouragement">{prediction.aiInsights.encouragement}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Log Form */}
      {showForm && (
        <div className="card form-card">
          <h3>Log New Period</h3>
          <form onSubmit={handleSubmit} className="cycle-form">
            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Flow</label>
                <select
                  value={form.flow}
                  onChange={(e) => setForm({ ...form, flow: e.target.value })}
                >
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any notes about this cycle..."
                rows={2}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Save</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cycle History */}
      <div className="card">
        <h3>Cycle History</h3>
        {cycles.length === 0 ? (
          <p className="empty-state">No cycles logged yet. Start by logging your period above.</p>
        ) : (
          <div className="cycle-list">
            {cycles.map((cycle) => (
              <div key={cycle._id} className="cycle-item">
                <div className="cycle-dates">
                  <span className="date-start">
                    {new Date(cycle.startDate).toLocaleDateString()}
                  </span>
                  {cycle.endDate && (
                    <>
                      <span className="date-arrow">→</span>
                      <span className="date-end">
                        {new Date(cycle.endDate).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
                <div className="cycle-meta">
                  <span className={`flow-badge flow-${cycle.flow}`}>{cycle.flow}</span>
                  {cycle.periodLength && <span>{cycle.periodLength} days</span>}
                  {cycle.cycleLength && (
                    <span className="cycle-length">Cycle: {cycle.cycleLength} days</span>
                  )}
                </div>
                <button className="btn-icon" onClick={() => handleDelete(cycle._id)}>
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
