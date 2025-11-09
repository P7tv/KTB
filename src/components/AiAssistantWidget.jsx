import React, { useMemo, useState } from 'react';
import { usePersistentList } from '../hooks/usePersistentList.js';
import { usePersistentState } from '../hooks/usePersistentState.js';
import { formatCurrency } from '../utils/formatters.js';
import { getMessages } from '../utils/i18n.js';

const GEMINI_MODEL = 'gemini-2.0-flash-lite';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MAX_MEMORY_ITEMS = 12;

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
  const assistantLanguage = settings.aiLanguage === 'en' ? 'English' : 'Thai';

  const [transactions] = usePersistentList('ktb.transactions');
  const [accounts] = usePersistentList('ktb.accounts');
  const [approvals] = usePersistentList('ktb.approvals');
  const [payrollRuns] = usePersistentList('ktb.payroll');
  const [chequeTasks] = usePersistentList('ktb.cheques');
  const [aiGoals] = usePersistentList('ktb.ai.goals');
  const [aiAdvisors] = usePersistentList('ktb.ai.advisors');
  const [aiNotes] = usePersistentList('ktb.ai.notes');
  const [investOpportunities] = usePersistentList('ktb.invest.opportunities');
  const [memory, setMemory] = usePersistentList('ktb.ai.memory', []);

  const latestTransactions = useMemo(() => transactions.slice(-10), [transactions]);
  const defaultGoal = aiGoals[0];

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toKeywords = (...words) =>
    words
      .filter(Boolean)
      .map((word) => word.toString().toLowerCase())
      .filter(Boolean);

  const knowledgeBase = useMemo(() => {
    const entries = [];

    accounts.forEach((acc) => {
      entries.push({
        id: `account-${acc.id}`,
        text: `บัญชี ${acc.name || acc.number}: ยอดคงเหลือ ${formatCurrency(acc.balance || 0)} เงินเข้า ${formatCurrency(acc.todayIn || 0)} เงินออก ${formatCurrency(acc.todayOut || 0)} สถานะ ${acc.status || '-'}`,
        keywords: toKeywords(acc.name, acc.number, acc.status, 'account'),
      });
    });

    transactions.slice(-25).forEach((tx) => {
      entries.push({
        id: `transaction-${tx.id}`,
        text: `ธุรกรรม ${tx.type || '-'} กับ ${tx.counterparty || '-'} จำนวน ${formatCurrency(tx.amount || 0)} สถานะ ${tx.status || '-'} บัญชี ${tx.accountId || '-'}`,
        keywords: toKeywords(tx.type, tx.counterparty, tx.accountId, tx.status, 'transaction'),
      });
    });

    approvals.forEach((item) => {
      entries.push({
        id: `approval-${item.id}`,
        text: `คำขออนุมัติ ${item.title}: ${item.detail} ระดับ ${item.level}`,
        keywords: toKeywords(item.title, item.level, item.submittedBy, 'approval'),
      });
    });

    payrollRuns.forEach((run) => {
      entries.push({
        id: `payroll-${run.id}`,
        text: `Payroll ${run.cycle} พนักงาน ${run.employees} คน สถานะ ${run.status}`,
        keywords: toKeywords(run.cycle, run.status, 'payroll'),
      });
    });

    chequeTasks.forEach((task) => {
      entries.push({
        id: `cheque-${task.id}`,
        text: `งานเช็ค ${task.action}: ${task.detail} สถานะ ${task.status} ครบกำหนด ${task.due}`,
        keywords: toKeywords(task.action, task.status, 'cheque'),
      });
    });

    investOpportunities.forEach((op) => {
      entries.push({
        id: `invest-${op.id}`,
        text: `โครงการลงทุน ${op.name} (${op.category}) งบ ${formatCurrency(op.amount || 0)} ความสำคัญ ${op.priority || '-'}`,
        keywords: toKeywords(op.name, op.category, op.priority, 'investment'),
      });
    });

    aiNotes.forEach((note) => {
      entries.push({
        id: `note-${note.id}`,
        text: `บันทึกข่าวกรอง ${note.label}: ${note.detail}`,
        keywords: toKeywords(note.label, note.source, 'note'),
      });
    });

    if (!entries.length && accounts.length) {
      entries.push({
        id: 'summary',
        text: 'ข้อมูลลูกค้ามีบัญชี กระแสเงินสด รายการอนุมัติ และโครงการลงทุน',
        keywords: ['summary'],
      });
    }

    return entries;
  }, [accounts, transactions, approvals, payrollRuns, chequeTasks, investOpportunities, aiNotes]);

  const retrieveKnowledge = (query) => {
    const lower = (query || '').toLowerCase();
    if (!lower.trim()) return [];
    const tokens = lower.split(/\W+/).filter(Boolean);
    const relevant = knowledgeBase
      .map((entry) => {
        const score = entry.keywords.reduce((total, keyword) => {
          if (!keyword) return total;
          if (tokens.includes(keyword)) return total + 3;
          if (lower.includes(keyword)) return total + 1;
          return total;
        }, 0);
        return { entry, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((item) => item.entry.text);

    if (relevant.length) return relevant;
    return knowledgeBase.slice(0, 2).map((entry) => entry.text);
  };

  const appendChainOfThought = (prompt) =>
    `${prompt}\n\nThink through the answer step-by-step (chain of thought) internally. Respond only with the final summary in ${assistantLanguage}, using concise bullets or short paragraphs without revealing the hidden reasoning.`;

  const buildPrompt = (type) => {
    switch (type) {
      case 'summary': {
        const rows = latestTransactions
          .map((tx) => `${tx.timestamp?.slice(0, 10) || '-'} | ${tx.type} | ${tx.counterparty} | ${formatCurrency(tx.amount)}`)
          .join('\n');
        return `You are a financial operations AI assistant. Summarize these transactions in ${assistantLanguage}, highlighting inflow/outflow and action items.\n${rows}`;
      }
      case 'analyze': {
        const notes = aiNotes.map((note) => `- ${note.label}: ${note.detail}`).join('\n');
        return `Act as an external intelligence analyst. Using ${assistantLanguage}, synthesize insights from these notes and suggest opportunities/risks for the SME owner.\n${notes}`;
      }
      case 'tax':
        return assistantLanguage === 'English'
          ? 'You are a Thai tax & legal advisor. Provide a short checklist for tax management and business continuity with key cautions.'
          : 'คุณคือที่ปรึกษาภาษีและกฎหมายธุรกิจไทย ช่วยให้ checklist สั้นๆ สำหรับการบริหารภาษีและความต่อเนื่องของธุรกิจพร้อมข้อควรระวัง';
      case 'projection': {
        const amount = defaultGoal?.initialAmount || 0;
        const monthly = defaultGoal?.monthlyContribution || 0;
        const horizon = defaultGoal?.horizon || 5;
        const objective = defaultGoal?.objective || 'เป้าหมายทั่วไป';
        if (assistantLanguage === 'English') {
          return `You are a financial advisor. Estimate how ${formatCurrency(amount)} growing with monthly ${formatCurrency(monthly)} for ${horizon} years at 6% annual return will support "${objective}". Provide a concise narrative in English.`;
        }
        return `คุณคือที่ปรึกษาการเงิน ช่วยประมาณการเติบโตของเงิน ${formatCurrency(amount)} โดยลงทุนต่อเนื่อง ${formatCurrency(monthly)} ต่อเดือน เป็นเวลา ${horizon} ปี ภายใต้ผลตอบแทนคาดการณ์ 6% ต่อปี และสรุปว่าจะช่วย "${objective}" อย่างไร`;
      }
      case 'advisor': {
        const advisors = aiAdvisors.map((adv) => `${adv.name} | ${adv.industry} | ${adv.expertise}`).join('\n');
        return `Match founders in manufacturing, tech, and family business with advisors below. Respond in ${assistantLanguage} with bullet suggestions.\n${advisors}`;
      }
      default:
        return '';
    }
  };

  const sendToGemini = async (text, isShortcut = false, queryOverride = '') => {
    const visibleText = text.trim();
    if (!visibleText) return;
    if (!effectiveKey) {
      setError('กรุณากรอก Gemini API Key ใน .env หรือช่องตั้งค่า');
      return;
    }
    setError('');
    setLoading(true);
    if (!isShortcut) {
      setMessages((prev) => [...prev, { role: 'user', text: visibleText }]);
    }
    const memoryContext = memory
      .slice(-6)
      .map((entry) => `${entry.role === 'assistant' ? 'AI' : 'User'}: ${entry.text}`)
      .join('\n');
    const ragSnippets = retrieveKnowledge(queryOverride || visibleText);
    const contextParts = [];
    if (ragSnippets.length) {
      contextParts.push(`Business data context:\n${ragSnippets.map((snippet) => `- ${snippet}`).join('\n')}`);
    }
    if (memoryContext) {
      contextParts.push(`Recent memory:\n${memoryContext}`);
    }
    const contextualPrompt = [contextParts.join('\n\n'), `Task:\n${visibleText}`].filter(Boolean).join('\n\n');
    try {
      const response = await callGemini({ apiKey: effectiveKey, prompt: appendChainOfThought(contextualPrompt || visibleText) });
      setMessages((prev) => [...prev, { role: 'assistant', text: response }]);
      setMemory((prev) => {
        const next = [...prev, { id: `mem-${Date.now()}-u`, role: 'user', text: visibleText }, { id: `mem-${Date.now()}-a`, role: 'assistant', text: response }];
        return next.slice(-MAX_MEMORY_ITEMS);
      });
    } catch (err) {
      setError(err.message || 'Gemini ตอบกลับไม่ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleShortcut = (key) => {
    const prompt = buildPrompt(key);
    if (!prompt) return;
    const label = shortcutDefs.find((s) => s.key === key)?.label || key;
    setMessages((prev) => [...prev, { role: 'user', text: `[${label}]` }]);
    sendToGemini(prompt, true, label);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    sendToGemini(trimmed, false, trimmed);
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
              <small>{GEMINI_MODEL}</small>
            </div>
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
