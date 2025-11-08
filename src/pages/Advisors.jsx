import React, { useState } from 'react';
import { usePersistentState } from '../hooks/usePersistentState.js';
import { usePersistentList } from '../hooks/usePersistentList.js';
import { getMessages } from '../utils/i18n.js';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function askGemini({ apiKey, prompt }) {
  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || `Gemini error ${response.status}`);
  }
  const result = await response.json();
  return result.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n') || '';
}

function Advisors() {
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY || '').replace(/['"]/g, '').trim();
  const [apiKey, setApiKey] = usePersistentState('ktb.ai.apiKey', envKey);
  const [settings] = usePersistentState('ktb.settings', {});
  const advisors = usePersistentList('ktb.ai.advisors')[0];
  const t = getMessages(settings.language);

  const [legalInput, setLegalInput] = useState('');
  const [taxInput, setTaxInput] = useState('');
  const [legalOutput, setLegalOutput] = useState('');
  const [taxOutput, setTaxOutput] = useState('');
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  const basePrompt = (type, text) => {
    const language = settings.aiLanguage === 'en' ? 'English' : 'Thai';
    const advisorLines = advisors.map((adv) => `${adv.name} (${adv.industry}) - ${adv.expertise}`).join('\n');
    return `You are a ${type} advisor for Thai SME owners. Reply in ${language}. Use the advisor roster below when giving recommendations. Provide concise bullet advice (legal compliance, tax efficiency, next steps).\nAdvisors:\n${advisorLines}\nUSER QUESTION:\n${text}`;
  };

  const handleAsk = async (type) => {
    const question = type === 'legal' ? legalInput : taxInput;
    if (!question.trim()) return;
    const key = envKey || apiKey;
    if (!key) {
      setError('กรุณาตั้งค่า Gemini API Key ก่อน');
      return;
    }
    setError('');
    setLoading(type);
    try {
      const reply = await askGemini({ apiKey: key, prompt: basePrompt(type, question) });
      if (type === 'legal') setLegalOutput(reply);
      else setTaxOutput(reply);
    } catch (err) {
      setError(err.message || 'Gemini ไม่สามารถตอบได้');
    } finally {
      setLoading('');
    }
  };

  return (
    <div className="advisors-page">
      <header className="toolbar">
        <div>
          <h1>Expert Advisory Agents</h1>
          <p>รับคำปรึกษาจาก AI ที่จำลองบทบาท Legal & Tax Partner</p>
        </div>
      </header>

      {!envKey && (
        <section className="card settings-section">
          <div className="setting-row">
            <div>
              <strong>Gemini API Key</strong>
              <small>กรอกครั้งเดียวเพื่อให้ AI ทำงาน</small>
            </div>
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="AIza..." />
          </div>
        </section>
      )}

      {error && <p className="error-text">{error}</p>}

      <section className="grid split advisor-grid">
        <article className="card">
          <h2>Legal experts agent</h2>
          <p>Advisory on legal, efficient ways to grow capital</p>
          <textarea value={legalInput} onChange={(e) => setLegalInput(e.target.value)} placeholder="Describe your legal question..." />
          <button className="primary" type="button" disabled={loading === 'legal'} onClick={() => handleAsk('legal')}>
            {loading === 'legal' ? 'Consulting...' : t.buttons.createWithGemini}
          </button>
          {legalOutput && <textarea readOnly value={legalOutput} />}
        </article>

        <article className="card">
          <h2>Tax expert agent</h2>
          <p>Manage taxes efficiently with customized checklists</p>
          <textarea value={taxInput} onChange={(e) => setTaxInput(e.target.value)} placeholder="Describe your tax scenario..." />
          <button className="primary" type="button" disabled={loading === 'tax'} onClick={() => handleAsk('tax')}>
            {loading === 'tax' ? 'Consulting...' : t.buttons.createWithGemini}
          </button>
          {taxOutput && <textarea readOnly value={taxOutput} />}
        </article>
      </section>
    </div>
  );
}

export default Advisors;
