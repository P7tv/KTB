import React, { useMemo, useState } from 'react';
import { usePersistentList } from '../hooks/usePersistentList.js';
import { usePersistentState } from '../hooks/usePersistentState.js';
import { formatCurrency } from '../utils/formatters.js';
import { getMessages } from '../utils/i18n.js';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function callGemini({ apiKey, prompt }) {
  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Gemini API error ${response.status}`);
  }

  const result = await response.json();
  const content = result.candidates?.[0]?.content?.parts || [];
  return content.map((part) => part.text || '').join('\n');
}

const shortcutDefs = [
  { key: 'summary', label: 'สรุปธุรกรรม' },
  { key: 'analyze', label: 'วิเคราะห์ข้อมูล' },
  { key: 'tax', label: 'ภาษี/กฎหมาย' },
  { key: 'projection', label: 'Projection' },
  { key: 'advisor', label: 'จับคู่ที่ปรึกษา' },
];

const escapeHtml = (text) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const markdownToHtml = (text) => {
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/(^|\n)- (.*)/g, '$1• $2');
  html = html.replace(/\n\n/g, '<br/><br/>');
  html = html.replace(/\n/g, '<br/>');
  return html;
};

function AiAssistantWidget() {
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY || '').replace(/['"]/g, '').trim();
  const [apiKey, setApiKey] = usePersistentState('ktb.ai.apiKey', envKey);
  const [settings] = usePersistentState('ktb.settings', {});
  const t = getMessages(settings.language);
  const effectiveKey = envKey || apiKey;

  const [transactions] = usePersistentList('ktb.transactions');
  const [aiGoals] = usePersistentList('ktb.ai.goals');
  const [aiAdvisors] = usePersistentList('ktb.ai.advisors');
  const [aiNotes] = usePersistentList('ktb.ai.notes');

  const latestTransactions = useMemo(() => transactions.slice(-10), [transactions]);
  const defaultGoal = aiGoals[0];

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buildPrompt = (type) => {
    switch (type) {
      case 'summary': {
        const rows = latestTransactions
          .map((tx) => `${tx.timestamp?.slice(0, 10) || '-'} | ${tx.type} | ${tx.counterparty} | ${formatCurrency(tx.amount)}`)
          .join('\n');
        return `You are a financial operations AI assistant. Summarize these transactions in Thai, highlighting inflow/outflow and action items.\n${rows}`;
      }
      case 'analyze': {
        const notes = aiNotes.map((note) => `- ${note.label}: ${note.detail}`).join('\n');
        return `Act as an external intelligence analyst. Using the Thai language, synthesize insights from these notes and suggest opportunities/risks for the SME owner.\n${notes}`;
      }
      case 'tax':
        return 'คุณคือที่ปรึกษาภาษีและกฎหมายธุรกิจไทย ช่วยให้ checklist สั้นๆ สำหรับการบริหารภาษีและความต่อเนื่องของธุรกิจพร้อมข้อควรระวัง';
      case 'projection': {
        const amount = defaultGoal?.initialAmount || 0;
        const monthly = defaultGoal?.monthlyContribution || 0;
        const horizon = defaultGoal?.horizon || 5;
        const objective = defaultGoal?.objective || 'เป้าหมายทั่วไป';
        return `คุณคือที่ปรึกษาการเงิน ช่วยประมาณการเติบโตของเงิน ${amount} บาท โดยลงทุนต่อเนื่อง ${monthly} บาท/เดือน เป็นเวลา ${horizon} ปี ภายใต้ผลตอบแทนคาดการณ์ 6% ต่อปี และสรุปว่าจะช่วย "${objective}" อย่างไร`; 
      }
      case 'advisor': {
        const advisors = aiAdvisors.map((adv) => `${adv.name} | ${adv.industry} | ${adv.expertise}`).join('\n');
        return `Match founders in manufacturing, tech, and family business with advisors below. Respond in Thai with bullet suggestions.\n${advisors}`;
      }
      default:
        return '';
    }
  };

  const sendToGemini = async (text, isShortcut = false) => {
    if (!text.trim()) return;
    if (!effectiveKey) {
      setError('กรุณากรอก Gemini API Key ใน .env หรือช่องตั้งค่า');
      return;
    }
    setError('');
    setLoading(true);
    if (!isShortcut) {
      setMessages((prev) => [...prev, { role: 'user', text }]);
    }
    try {
      const response = await callGemini({ apiKey: effectiveKey, prompt: text });
      setMessages((prev) => [...prev, { role: 'assistant', text: response }]);
    } catch (err) {
      setError(err.message || 'Gemini ตอบกลับไม่ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleShortcut = (key) => {
    const prompt = buildPrompt(key);
    if (!prompt) return;
    setMessages((prev) => [...prev, { role: 'user', text: `[${shortcutDefs.find((s) => s.key === key)?.label}]` }]);
    sendToGemini(prompt, true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    sendToGemini(trimmed);
    setInput('');
  };

  return (
    <div className="ai-widget">
      <button className="ai-widget-fab" type="button" onClick={() => setIsOpen((prev) => !prev)}>
        {isOpen ? '×' : 'AI'}
      </button>
      {isOpen && (
        <div className="ai-widget-panel">
          <header>
            <div>
              <strong>AI Assistant</strong>
              <small>Gemini 2.5</small>
            </div>
            {!envKey && (
              <input type="password" placeholder="API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            )}
          </header>
          <div className="shortcut-row">
            {shortcutDefs.map((shortcut) => (
              <button key={shortcut.key} type="button" onClick={() => handleShortcut(shortcut.key)} disabled={loading}>
                {shortcut.label}
              </button>
            ))}
          </div>
          <div className="ai-widget-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                {msg.role === 'assistant' ? (
                  <p dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.text) }} />
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>
            ))}
            {!messages.length && <p className="empty">เริ่มคุยกับ AI เพื่อให้ช่วยวิเคราะห์การเงิน</p>}
          </div>
          {error && <p className="error-text">{error}</p>}
          <form className="ai-widget-input" onSubmit={handleSubmit}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="พิมพ์คำถามของคุณ..." />
              <button className="primary" type="submit" disabled={loading}>
                {loading ? '...' : t.buttons.submit}
              </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default AiAssistantWidget;
