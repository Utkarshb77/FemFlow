import { useState, useEffect } from 'react';
import { getCycles, createCycle, updateCycle, deleteCycle, getCyclePrediction } from '../services/api';
import { FiTrash2, FiDroplet, FiCheck } from 'react-icons/fi';

const FLOW_OPTIONS = [
  { value: 'spotting', label: 'Spotting', emoji: '💧', color: '#a5d6a7' },
  { value: 'light', label: 'Light', emoji: '🩸', color: '#81c784' },
  { value: 'medium', label: 'Medium', emoji: '🩸🩸', color: '#ffb74d' },
  { value: 'heavy', label: 'Heavy', emoji: '🩸🩸🩸', color: '#e57373' },
];

export default function Cycles() {
  const [cycles, setCycles] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todayLogged, setTodayLogged] = useState(false);
  const [activeCycle, setActiveCycle] = useState(null);

  const fetchData = async () => {
    try {
      const [cycleRes, predRes] = await Promise.all([getCycles(), getCyclePrediction()]);
      setCycles(cycleRes.data);
      setPrediction(predRes.data);
      
      // Check if there's an active period (no end date) or if today is already logged
      const today = new Date().toISOString().split('T')[0];
      const active = cycleRes.data.find(c => !c.endDate);
      setActiveCycle(active || null);
      
      if (active) {
        const startDate = new Date(active.startDate).toISOString().split('T')[0];
        setTodayLogged(startDate === today);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogFlow = async (flow) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (activeCycle) {
        // Update existing active cycle with today's flow
        await updateCycle(activeCycle._id, { 
          flow,
          dailyFlows: [...(activeCycle.dailyFlows || []), { date: today, flow }]
        });
      } else {
        // Start a new period
        await createCycle({ startDate: today, flow });
      }
      
      setTodayLogged(true);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error logging flow');
    }
  };

  const handleEndPeriod = async () => {
    if (!activeCycle) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      await updateCycle(activeCycle._id, { endDate: today });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error ending period');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this cycle record?')) {
      await deleteCycle(id);
      fetchData();
    }
  };

  if (loading) return <div className="loading">Loading cycles...</div>;

  // Show only last 5 periods
  const recentCycles = cycles.slice(0, 5);

  return (
    <div className="cycles-page">
      {/* Motivational Line */}
      {prediction?.motivationalLine && (
        <div className="motivational-banner">
          <p>{prediction.motivationalLine}</p>
        </div>
      )}

      <div className="page-header">
        <h1>Cycle Tracking</h1>
      </div>

      {/* Daily Flow Tracker */}
      <div className="card daily-flow-card">
        <h3>
          <FiDroplet /> {activeCycle ? "Log Today's Flow" : "Start Period"}
        </h3>
        
        {activeCycle && (
          <p className="period-status">
            🔴 Period started on {new Date(activeCycle.startDate).toLocaleDateString()}
            {activeCycle.dailyFlows?.length > 0 && ` • Day ${activeCycle.dailyFlows.length + 1}`}
          </p>
        )}

        <div className="flow-picker">
          {FLOW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`flow-btn ${todayLogged ? 'disabled' : ''}`}
              style={{ '--flow-color': opt.color }}
              onClick={() => !todayLogged && handleLogFlow(opt.value)}
              disabled={todayLogged}
            >
              <span className="flow-emoji">{opt.emoji}</span>
              <span className="flow-label">{opt.label}</span>
            </button>
          ))}
        </div>

        {todayLogged && (
          <p className="logged-message">
            <FiCheck /> Today's flow has been logged!
          </p>
        )}

        {activeCycle && (
          <button 
            className="btn-secondary end-period-btn" 
            onClick={handleEndPeriod}
          >
            End Period
          </button>
        )}
      </div>

      {/* Prediction Card */}
      {prediction && !prediction.message && (
        <div className="card prediction-card">
          <h3>Cycle Predictions</h3>
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
              <span className="pred-label">Avg Cycle</span>
              <span className="pred-value">{prediction.avgCycleLength} days</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Periods - Last 5 */}
      <div className="card">
        <h3>Recent Periods (Last 5)</h3>
        {recentCycles.length === 0 ? (
          <p className="empty-state">No periods logged yet. Start tracking above!</p>
        ) : (
          <div className="cycle-list">
            {recentCycles.map((cycle) => (
              <div key={cycle._id} className={`cycle-item ${!cycle.endDate ? 'active' : ''}`}>
                <div className="cycle-dates">
                  <span className="date-start">
                    {new Date(cycle.startDate).toLocaleDateString()}
                  </span>
                  {cycle.endDate ? (
                    <>
                      <span className="date-arrow">→</span>
                      <span className="date-end">
                        {new Date(cycle.endDate).toLocaleDateString()}
                      </span>
                    </>
                  ) : (
                    <span className="ongoing-badge">Ongoing</span>
                  )}
                </div>
                <div className="cycle-meta">
                  <span className={`flow-badge flow-${cycle.flow}`}>{cycle.flow}</span>
                  {cycle.periodLength && <span>{cycle.periodLength} days</span>}
                  {cycle.cycleLength && (
                    <span className="cycle-length">Cycle: {cycle.cycleLength}d</span>
                  )}
                </div>
                <button className="btn-icon danger" onClick={() => handleDelete(cycle._id)}>
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
