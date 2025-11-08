import React, { useEffect, useMemo, useState } from 'react';
import { usePersistentList } from '../hooks/usePersistentList.js';
import { usePersistentState } from '../hooks/usePersistentState.js';
import { createInvestmentPlan, summarizeCategory } from '../utils/investmentPlanner.js';
import ForecastChart from '../components/ForecastChart.jsx';
import { formatCurrency } from '../utils/formatters.js';
import { getMessages } from '../utils/i18n.js';

const DEFAULT_RETURN = 0.06;

function buildProjection(goal, rate = DEFAULT_RETURN) {
  if (!goal) return [];
  const years = goal.horizon || 5;
  const annualContribution = (goal.monthlyContribution || 0) * 12;
  const points = [];
  let balance = goal.initialAmount || 0;
  for (let year = 1; year <= years; year++) {
    balance = balance * (1 + rate) + annualContribution;
    points.push({ label: `Y${year}`, value: Math.round(balance) });
  }
  return points;
}

function Investments() {
  const [accounts] = usePersistentList('ktb.accounts');
  const [investOpportunities] = usePersistentList('ktb.invest.opportunities');
  const [aiGoals] = usePersistentList('ktb.ai.goals');
  const envGeminiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').replace(/['"]/g, '').trim();
  const [geminiKey, setGeminiKey] = usePersistentState('ktb.ai.apiKey', envGeminiKey);
  const effectiveKey = envGeminiKey || geminiKey;
  const plan = useMemo(() => createInvestmentPlan(accounts, investOpportunities), [accounts, investOpportunities]);
  const [settings] = usePersistentState('ktb.settings', {});
  const t = getMessages(settings.language);
  const [selectedGoalId, setSelectedGoalId] = useState(aiGoals[0]?.id || '');
  const selectedGoal = aiGoals.find((goal) => goal.id === selectedGoalId) || aiGoals[0];
  const [chartPoints, setChartPoints] = useState(buildProjection(selectedGoal));
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState('');

  useEffect(() => {
    setChartPoints(buildProjection(selectedGoal));
  }, [selectedGoal?.id]);

  const forecastPrompt = () => {
    if (!selectedGoal) return '';
    const targetLanguage = settings.aiLanguage === 'en' ? 'English' : 'Thai';
    return `You are a financial planner. Given this goal data: name=${selectedGoal.name}, initial=${selectedGoal.initialAmount}, monthly=${selectedGoal.monthlyContribution}, horizon=${selectedGoal.horizon} years. Respond in ${targetLanguage}. Return JSON array only, like [{"label":"Y1","value":12345},...], showing projected balance each year using realistic SME investment assumptions (consider mix of deposits, emergency fund redeployment, business reinvestment). No prose.`;
  };

  const runGeminiForecast = async () => {
    if (!selectedGoal) return;
    if (!effectiveKey) {
      setForecastError('กรุณาตั้งค่า Gemini API Key ก่อน');
      return;
    }
    setForecastError('');
    setForecastLoading(true);
    try {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + effectiveKey,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: forecastPrompt() }] }] }),
        }
      );
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Gemini error');
      }
      const result = await response.json();
      const content = result.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n') || '';
      const jsonStart = content.indexOf('[');
      const jsonEnd = content.lastIndexOf(']');
      const jsonText = jsonStart >= 0 ? content.slice(jsonStart, jsonEnd + 1) : content;
      const parsed = JSON.parse(jsonText);
      setChartPoints(Array.isArray(parsed) && parsed.length ? parsed : buildProjection(selectedGoal));
    } catch (err) {
      setForecastError(err.message || 'ไม่สามารถสร้าง Forecast ได้');
      setChartPoints(buildProjection(selectedGoal));
    } finally {
      setForecastLoading(false);
    }
  };

  const totalAvailable = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalPlanned = investOpportunities.reduce((sum, op) => sum + Number(op.amount || 0), 0);

  return (
    <div className="investment-page">
      <header className="toolbar">
        <div>
          <h1>Investment Control Center</h1>
          <p>จัดสรรเงินระหว่างการลงทุนภายนอกและในกิจการ พร้อมดูการ forecast</p>
        </div>
      </header>

      <section className="grid stats">
        <article>
          <span>สภาพคล่องรวม</span>
          <strong>{formatCurrency(totalAvailable)}</strong>
          <small>บัญชีทั้งหมด {accounts.length} บัญชี</small>
        </article>
        <article>
          <span>งบแผนลงทุน</span>
          <strong>{formatCurrency(totalPlanned)}</strong>
          <small>{investOpportunities.length} โครงการ</small>
        </article>
        <article>
          <span>จำนวนแผนสำคัญ (Priority High)</span>
          <strong>{investOpportunities.filter((op) => op.priority === 'high').length}</strong>
        </article>
      </section>

      <section className="grid split investment-grid">
        <article className="card">
          <h2>Agentic Allocation</h2>
          <p>{plan.notes}</p>
          {plan.allocations.map((item) => (
            <div className="allocation-card" key={item.opportunity}>
              <header>
                <div>
                  <strong>{item.opportunity}</strong>
                  <small>{summarizeCategory(item.category)} • {item.priority}</small>
                </div>
                <span>
                  {formatCurrency(item.fulfilled)} / {formatCurrency(item.requested)}
                </span>
              </header>
              <ul>
                {item.contribution.map((contrib) => (
                  <li key={contrib.accountId}>
                    {contrib.name}: {formatCurrency(contrib.amount)}
                  </li>
                ))}
              </ul>
              {item.remaining > 0 && <small>ยังขาด {formatCurrency(item.remaining)} เพื่อปิดแผนนี้</small>}
            </div>
          ))}
          {!plan.allocations.length && <p className="empty">ยังไม่มีแผนให้จัดสรร</p>}
        </article>

        <article className="card">
          <h2>Forecast / Visualization</h2>
          <div className="projection-form">
            <select value={selectedGoal?.id || ''} onChange={(e) => setSelectedGoalId(e.target.value)}>
              {aiGoals.map((goal) => (
                <option value={goal.id} key={goal.id}>
                  {goal.name}
                </option>
              ))}
            </select>
            {selectedGoal && (
              <small>
                เงินตั้งต้น {formatCurrency(selectedGoal.initialAmount || 0)} | ออมต่อเดือน {formatCurrency(selectedGoal.monthlyContribution || 0)} | {selectedGoal.horizon} ปี
              </small>
            )}
            {!envGeminiKey && (
              <input type="password" placeholder="Gemini API Key" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} />
            )}
          <button className="primary" type="button" disabled={forecastLoading} onClick={runGeminiForecast}>
            {forecastLoading ? 'กำลังเรียก Gemini...' : t.buttons.createWithGemini}
          </button>
            {forecastError && <p className="error-text">{forecastError}</p>}
          </div>
          <ForecastChart points={chartPoints} />
        </article>
      </section>

      <section className="card">
        <h2>รายละเอียดโครงการลงทุน</h2>
        <div className="investment-table">
          <div className="table-head">
            <span>ชื่อ</span>
            <span>ประเภท</span>
            <span>งบประมาณ</span>
            <span>ความสำคัญ</span>
            <span>กำหนด</span>
          </div>
          {investOpportunities.map((op) => (
            <div className="table-row" key={op.id}>
              <strong>{op.name}</strong>
              <span>{summarizeCategory(op.category)}</span>
              <span>{formatCurrency(op.amount)}</span>
              <span className={`pill ${op.priority === 'high' ? 'danger' : op.priority === 'medium' ? 'warning' : ''}`}>{op.priority}</span>
              <small>{op.targetDate || '-'}</small>
            </div>
          ))}
          {!investOpportunities.length && <p className="empty">ยังไม่มีข้อมูล</p>}
        </div>
      </section>
    </div>
  );
}

export default Investments;
