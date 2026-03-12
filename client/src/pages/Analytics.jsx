import { useState, useEffect } from 'react';
import { getSummary, getPCOSScore, getCycles, getLogs } from '../services/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const MOOD_COLORS = {
  great: '#4CAF50', good: '#8BC34A', okay: '#FFC107', bad: '#FF9800', terrible: '#F44336',
};

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [pcosScore, setPcosScore] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    Promise.all([
      getSummary(),
      getPCOSScore(),
      getCycles(),
      getLogs(ninetyDaysAgo.toISOString()),
    ])
      .then(([sumRes, pcosRes, cycleRes, logRes]) => {
        setSummary(sumRes.data);
        setPcosScore(pcosRes.data);
        setCycles(cycleRes.data);
        setLogs(logRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading analytics...</div>;

  // Cycle length trend
  const cycleLengthData = cycles
    .filter((c) => c.cycleLength)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .map((c, i) => ({
      cycle: `Cycle ${i + 1}`,
      length: c.cycleLength,
      date: new Date(c.startDate).toLocaleDateString(),
    }));

  // Symptom frequency
  const symptomData = summary?.symptomFrequency
    ? Object.entries(summary.symptomFrequency)
        .map(([name, count]) => ({ name: name.replace(/_/g, ' '), count }))
        .sort((a, b) => b.count - a.count)
    : [];

  // Mood distribution
  const moodData = summary?.moodDistribution
    ? Object.entries(summary.moodDistribution).map(([name, value]) => ({
        name, value, color: MOOD_COLORS[name],
      }))
    : [];

  // Mood trend over time
  const moodMap = { terrible: 1, bad: 2, okay: 3, good: 4, great: 5 };
  const moodTrend = [...logs]
    .filter((l) => l.mood)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-30)
    .map((l) => ({
      date: new Date(l.date).toLocaleDateString(),
      mood: moodMap[l.mood] || 0,
      label: l.mood,
    }));

  // Sleep trend
  const sleepTrend = [...logs]
    .filter((l) => l.sleepHours != null)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-30)
    .map((l) => ({
      date: new Date(l.date).toLocaleDateString(),
      hours: l.sleepHours,
    }));

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Analytics</h1>
        <p className="subtitle">Insights from your health data</p>
      </div>

      <div className="analytics-grid">
        {/* PCOS Score Detail */}
        {pcosScore && (
          <div className="card pcos-detail-card">
            <h3>PCOS Risk Assessment</h3>
            <div className="pcos-header">
              <div className="pcos-score-big" style={{ color: pcosScore.color }}>
                {pcosScore.totalScore}/100
              </div>
              <div className="risk-badge" style={{ backgroundColor: pcosScore.color }}>
                {pcosScore.riskLevel}
              </div>
            </div>
            <div className="score-bars">
              <div className="score-bar-item">
                <div className="score-bar-header">
                  <span>Cycle Regularity</span>
                  <span>{pcosScore.breakdown.cycleRegularity.score}/{pcosScore.breakdown.cycleRegularity.max}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${(pcosScore.breakdown.cycleRegularity.score / pcosScore.breakdown.cycleRegularity.max) * 100}%`,
                    backgroundColor: pcosScore.color,
                  }} />
                </div>
              </div>
              <div className="score-bar-item">
                <div className="score-bar-header">
                  <span>Symptom Frequency</span>
                  <span>{pcosScore.breakdown.symptoms.score}/{pcosScore.breakdown.symptoms.max}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${(pcosScore.breakdown.symptoms.score / pcosScore.breakdown.symptoms.max) * 100}%`,
                    backgroundColor: pcosScore.color,
                  }} />
                </div>
              </div>
              <div className="score-bar-item">
                <div className="score-bar-header">
                  <span>Lifestyle Factors</span>
                  <span>{pcosScore.breakdown.lifestyle.score}/{pcosScore.breakdown.lifestyle.max}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${(pcosScore.breakdown.lifestyle.score / pcosScore.breakdown.lifestyle.max) * 100}%`,
                    backgroundColor: pcosScore.color,
                  }} />
                </div>
              </div>
            </div>
            {pcosScore.tips.length > 0 && (
              <div className="tips-section">
                <h4>Recommendations</h4>
                <ul>{pcosScore.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
              </div>
            )}
            <p className="disclaimer">{pcosScore.disclaimer}</p>
          </div>
        )}

        {/* Cycle Length Trend */}
        {cycleLengthData.length > 1 && (
          <div className="card chart-card">
            <h3>Cycle Length Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cycleLengthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cycle" />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload?.length) {
                    return (
                      <div className="custom-tooltip">
                        <p>{payload[0].payload.date}</p>
                        <p><strong>{payload[0].value} days</strong></p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Line type="monotone" dataKey="length" stroke="#e91e8a" strokeWidth={2} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Symptom Frequency */}
        {symptomData.length > 0 && (
          <div className="card chart-card">
            <h3>Symptom Frequency (30 days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={symptomData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#e91e8a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Mood Distribution */}
        {moodData.length > 0 && (
          <div className="card chart-card">
            <h3>Mood Distribution (30 days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={moodData} cx="50%" cy="50%" innerRadius={60} outerRadius={110} dataKey="value" label>
                  {moodData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Mood Trend */}
        {moodTrend.length > 2 && (
          <div className="card chart-card">
            <h3>Mood Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={moodTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]}
                  tickFormatter={(v) => ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Great'][v]} />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload?.length) {
                    return (
                      <div className="custom-tooltip">
                        <p>{payload[0].payload.date}</p>
                        <p><strong>{payload[0].payload.label}</strong></p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Line type="monotone" dataKey="mood" stroke="#9C27B0" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Sleep Trend */}
        {sleepTrend.length > 2 && (
          <div className="card chart-card">
            <h3>Sleep Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sleepTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                <YAxis domain={[0, 12]} />
                <Tooltip />
                <Bar dataKey="hours" fill="#3F51B5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
