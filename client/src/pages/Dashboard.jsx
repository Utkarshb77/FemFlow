import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSummary, getPCOSScore, getCyclePrediction, getAISuggestions } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const MOOD_COLORS = {
  great: '#4CAF50',
  good: '#8BC34A',
  okay: '#FFC107',
  bad: '#FF9800',
  terrible: '#F44336',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [pcosScore, setPcosScore] = useState(null);
  const [cyclePrediction, setCyclePrediction] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSummary(), getPCOSScore(), getCyclePrediction(), getAISuggestions()])
      .then(([sumRes, pcosRes, cycleRes, aiRes]) => {
        setSummary(sumRes.data);
        setPcosScore(pcosRes.data);
        setCyclePrediction(cycleRes.data);
        setAiSuggestions(aiRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  const prediction = summary?.prediction;
  const symptomData = summary?.symptomFrequency
    ? Object.entries(summary.symptomFrequency)
        .map(([name, count]) => ({ name: name.replace(/_/g, ' '), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
    : [];

  const moodData = summary?.moodDistribution
    ? Object.entries(summary.moodDistribution).map(([name, value]) => ({
        name,
        value,
        color: MOOD_COLORS[name] || '#999',
      }))
    : [];

  // Motivational line from Gemini
  const motivationalLine = cyclePrediction?.motivationalLine || summary?.motivationalLine;
  const aiInsights = cyclePrediction?.aiInsights;

  return (
    <div className="dashboard">
      {/* Gemini Motivational Line Banner */}
      {motivationalLine && (
        <div className="motivational-banner">
          <p>{motivationalLine}</p>
        </div>
      )}

      <div className="page-header">
        <h1>Welcome back, {user.name}!</h1>
        <p className="subtitle">Here&apos;s your health overview</p>
      </div>

      {/* AI Daily Affirmation */}
      {aiSuggestions?.dailyAffirmation && (
        <div className="card affirmation-card">
          <p className="affirmation-text">{aiSuggestions.dailyAffirmation}</p>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Cycle Countdown Card */}
        <div className="card cycle-countdown">
          <h3>Next Period</h3>
          {prediction ? (
            <>
              <div className="countdown-number">{prediction.daysUntilPeriod}</div>
              <p className="countdown-label">days away</p>
              <div className="cycle-info">
                <span>Cycle Day: {prediction.cycleDay}</span>
                <span>Avg Length: {prediction.avgCycleLength} days</span>
              </div>
              <div className="prediction-dates">
                <p>Expected: {new Date(prediction.nextPeriodStart).toLocaleDateString()}</p>
                <p>Ovulation: {new Date(prediction.ovulationDate).toLocaleDateString()}</p>
              </div>
              {/* Gemini AI Phase Insight */}
              {aiInsights?.phaseInfo && (
                <div className="ai-insight-box">
                  <p className="ai-phase">{aiInsights.phaseInfo}</p>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>Log your first period to get predictions</p>
              <Link to="/cycles" className="btn-secondary">Log Period</Link>
            </div>
          )}
        </div>

        {/* PCOS Risk Card */}
        <div className="card pcos-card">
          <h3>PCOS Risk Indicator</h3>
          {pcosScore ? (
            <>
              <div className="pcos-score" style={{ color: pcosScore.color }}>
                <span className="score-number">{pcosScore.totalScore}</span>
                <span className="score-max">/100</span>
              </div>
              <div className="risk-level" style={{ backgroundColor: pcosScore.color }}>
                {pcosScore.riskLevel} Risk
              </div>
              <div className="pcos-breakdown">
                <div className="breakdown-item">
                  <span>Cycle Regularity</span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(pcosScore.breakdown.cycleRegularity.score / 30) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="breakdown-item">
                  <span>Symptoms</span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(pcosScore.breakdown.symptoms.score / 40) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="breakdown-item">
                  <span>Lifestyle</span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(pcosScore.breakdown.lifestyle.score / 30) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="disclaimer">{pcosScore.disclaimer}</p>
            </>
          ) : (
            <p>Not enough data yet</p>
          )}
        </div>

        {/* Lifestyle Stats Card */}
        <div className="card lifestyle-card">
          <h3>Lifestyle Averages (30 days)</h3>
          {summary?.lifestyle ? (
            <div className="lifestyle-grid">
              <div className="stat-item">
                <span className="stat-icon">😴</span>
                <span className="stat-value">{summary.lifestyle.avgSleep ?? '--'}h</span>
                <span className="stat-label">Sleep</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">💧</span>
                <span className="stat-value">{summary.lifestyle.avgWater ?? '--'}</span>
                <span className="stat-label">Water (glasses)</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🏃‍♀️</span>
                <span className="stat-value">{summary.lifestyle.avgExercise ?? '--'}min</span>
                <span className="stat-label">Exercise</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">😰</span>
                <span className="stat-value">{summary.lifestyle.avgStress ?? '--'}/5</span>
                <span className="stat-label">Stress</span>
              </div>
            </div>
          ) : (
            <p>Start logging daily habits to see averages</p>
          )}
        </div>

        {/* AI Suggestions */}
        {aiSuggestions?.suggestions?.length > 0 && (
          <div className="card ai-suggestions-card">
            <h3>AI Suggestions</h3>
            {aiSuggestions.greeting && (
              <p className="ai-greeting">{aiSuggestions.greeting}</p>
            )}
            {aiSuggestions.overallAssessment && (
              <p className="ai-assessment">{aiSuggestions.overallAssessment}</p>
            )}
            <div className="suggestion-list">
              {aiSuggestions.suggestions.map((s, i) => (
                <div key={i} className={`suggestion-item priority-${s.priority}`}>
                  <span className="suggestion-icon">{s.icon}</span>
                  <div>
                    <strong>{s.title}</strong>
                    <span className={`priority-badge ${s.priority}`}>{s.priority}</span>
                    <p>{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {aiSuggestions.disclaimer && (
              <p className="disclaimer">{aiSuggestions.disclaimer}</p>
            )}
          </div>
        )}

        {/* PCOS Tips */}
        {pcosScore?.tips?.length > 0 && (
          <div className="card tips-card">
            <h3>PCOS Tips</h3>
            <ul className="tips-list">
              {pcosScore.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Symptom Chart */}
        {symptomData.length > 0 && (
          <div className="card chart-card">
            <h3>Top Symptoms (30 days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={symptomData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#e91e8a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Mood Chart */}
        {moodData.length > 0 && (
          <div className="card chart-card">
            <h3>Mood Distribution (30 days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={moodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {moodData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/log" className="action-btn">📝 Log Today</Link>
        <Link to="/cycles" className="action-btn">🩸 Log Period</Link>
        <Link to="/analytics" className="action-btn">📊 View Analytics</Link>
      </div>
    </div>
  );
}
