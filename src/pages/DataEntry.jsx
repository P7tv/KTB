import React, { useMemo, useState } from 'react';
import InlineForm from '../components/InlineForm.jsx';
import OcrUploader from '../components/OcrUploader.jsx';
import { usePersistentList } from '../hooks/usePersistentList.js';
import { usePersistentState } from '../hooks/usePersistentState.js';
import { createId } from '../utils/id.js';
import { formatCurrency } from '../utils/formatters.js';
import { demoSeed, demoData } from '../utils/demoData.js';
import { getMessages } from '../utils/i18n.js';

const toNumber = (value) => Number(value || 0);

function DataEntry() {
  const [accounts, setAccounts] = usePersistentList('ktb.accounts');
  const [transactions, setTransactions] = usePersistentList('ktb.transactions');
  const [cashFlowHistory, setCashFlowHistory] = usePersistentList('ktb.cashflow');
  const [approvalQueue, setApprovalQueue] = usePersistentList('ktb.approvals');
  const [payrollRuns, setPayrollRuns] = usePersistentList('ktb.payroll');
  const [chequeTasks, setChequeTasks] = usePersistentList('ktb.cheques');

  const [ownerInsights, setOwnerInsights] = usePersistentList('ktb.owner.insights');
  const [ownerDistributions, setOwnerDistributions] = usePersistentList('ktb.owner.distributions');
  const [ownerMeetings, setOwnerMeetings] = usePersistentList('ktb.owner.meetings');
  const [ownerTodos, setOwnerTodos] = usePersistentList('ktb.owner.todos');
  const [ownerDocuments, setOwnerDocuments] = usePersistentList('ktb.owner.documents');
  const [ownerAlerts, setOwnerAlerts] = usePersistentList('ktb.owner.alerts');
  const [ownerStrategies, setOwnerStrategies] = usePersistentList('ktb.owner.strategies');
  const [aiGoals, setAiGoals] = usePersistentList('ktb.ai.goals');
  const [aiAdvisors, setAiAdvisors] = usePersistentList('ktb.ai.advisors');
  const [aiNotes, setAiNotes] = usePersistentList('ktb.ai.notes');
  const [investOpportunities, setInvestOpportunities] = usePersistentList('ktb.invest.opportunities');
  const [transactionSeed, setTransactionSeed] = useState({});
  const [documentSeed, setDocumentSeed] = useState({});
  const envGeminiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').replace(/['"]/g, '').trim();
  const [settings] = usePersistentState('ktb.settings', {});
  const t = getMessages(settings.language);
  const [geminiKey, setGeminiKey] = usePersistentState('ktb.ai.apiKey', envGeminiKey);
  const effectiveGeminiKey = envGeminiKey || geminiKey;
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');

  const accountFields = useMemo(
    () => [
      { name: 'name', label: 'ชื่อบัญชี', required: true },
      { name: 'number', label: 'เลขบัญชี', required: true },
      { name: 'balance', label: 'ยอดคงเหลือ', type: 'number', step: '0.01' },
      { name: 'todayIn', label: 'เงินเข้า (วันนี้)', type: 'number', step: '0.01' },
      { name: 'todayOut', label: 'เงินออก (วันนี้)', type: 'number', step: '0.01' },
      {
        name: 'status',
        label: 'สถานะ',
        type: 'select',
        defaultValue: 'พร้อมใช้งาน',
        options: [
          { value: 'พร้อมใช้งาน', label: 'พร้อมใช้งาน' },
          { value: 'กันสำรอง', label: 'กันสำรอง' },
          { value: 'ระงับชั่วคราว', label: 'ระงับชั่วคราว' },
        ],
      },
    ],
    []
  );

  const cashflowFields = useMemo(
    () => [
      { name: 'date', label: 'วันที่ (แสดงบนแกน)', required: true, placeholder: 'เช่น 15 มี.ค.' },
      { name: 'inflow', label: 'เงินเข้า (ล้านบาท)', type: 'number', step: '0.01', required: true },
      { name: 'outflow', label: 'เงินออก (ล้านบาท)', type: 'number', step: '0.01', required: true },
    ],
    []
  );

  const transactionFields = useMemo(
    () => [
      { name: 'type', label: 'ประเภท', required: true },
      { name: 'counterparty', label: 'คู่ค้า/คำอธิบาย', required: true },
      { name: 'amount', label: 'จำนวนเงิน (ใส่ค่าลบเมื่อต้องการค่าใช้จ่าย)', type: 'number', step: '0.01', required: true },
      {
        name: 'accountId',
        label: 'เลือกบัญชี',
        type: 'select',
        required: true,
        options: accounts.map((acc) => ({ value: acc.id, label: acc.name || acc.number || acc.id })),
      },
      {
        name: 'status',
        label: 'สถานะ',
        type: 'select',
        defaultValue: 'รอดำเนินการ',
        options: [
          { value: 'รอดำเนินการ', label: 'รอดำเนินการ' },
          { value: 'อนุมัติแล้ว', label: 'อนุมัติแล้ว' },
          { value: 'ชำระเรียบร้อย', label: 'ชำระเรียบร้อย' },
        ],
      },
      { name: 'timestamp', label: 'เวลา', type: 'datetime-local' },
      { name: 'reference', label: 'Reference (ถ้ามี)' },
    ],
    [accounts]
  );

  const approvalFields = useMemo(
    () => [
      { name: 'title', label: 'หัวข้อ', required: true },
      { name: 'detail', label: 'รายละเอียด', required: true },
      { name: 'submittedBy', label: 'ผู้ส่งคำขอ', required: true },
      { name: 'level', label: 'ลำดับการอนุมัติ', required: true, placeholder: 'เช่น L1, CFO' },
    ],
    []
  );

  const payrollFields = useMemo(
    () => [
      { name: 'cycle', label: 'รอบจ่าย', required: true, placeholder: 'เช่น รอบ 30 มี.ค.' },
      { name: 'employees', label: 'จำนวนพนักงาน', type: 'number', required: true },
      { name: 'status', label: 'สถานะ', required: true, placeholder: 'เช่น รออนุมัติ' },
      { name: 'cutOff', label: 'Cut-off', required: true, placeholder: 'เช่น 28 มี.ค. 18:00' },
    ],
    []
  );

  const chequeFields = useMemo(
    () => [
      { name: 'action', label: 'งานเช็ค', required: true, placeholder: 'เช่น ออกเช็ค' },
      { name: 'detail', label: 'รายละเอียด', required: true },
      { name: 'status', label: 'สถานะ', required: true },
      { name: 'due', label: 'ครบกำหนด/กำกับ', required: true },
    ],
    []
  );

  const insightFields = useMemo(
    () => [
      { name: 'label', label: 'หัวข้อ', required: true },
      {
        name: 'type',
        label: 'ประเภทข้อมูล',
        type: 'select',
        required: true,
        options: [
          { value: 'currency', label: 'จำนวนเงิน' },
          { value: 'count', label: 'จำนวนรายการ' },
          { value: 'text', label: 'ข้อความ' },
        ],
      },
      { name: 'value', label: 'ค่า', required: true },
      { name: 'helper', label: 'ข้อความอธิบาย' },
    ],
    []
  );

  const distributionFields = useMemo(
    () => [
      { name: 'title', label: 'ชื่อรายการ', required: true },
      { name: 'amount', label: 'จำนวนเงิน', type: 'number', required: true },
      { name: 'schedule', label: 'กำหนดการ', required: true },
      {
        name: 'status',
        label: 'สถานะ',
        type: 'select',
        required: true,
        options: [
          { value: 'พร้อมจ่าย', label: 'พร้อมจ่าย' },
          { value: 'ต้องอนุมัติ', label: 'ต้องอนุมัติ' },
          { value: 'เตือน', label: 'เตือน' },
        ],
      },
    ],
    []
  );

  const meetingFields = useMemo(
    () => [
      { name: 'title', label: 'หัวข้อ', required: true },
      { name: 'time', label: 'เวลา', required: true, placeholder: 'เช่น 10:30' },
      { name: 'channel', label: 'ช่องทาง', required: true, placeholder: 'On-site, Video Call' },
      { name: 'participants', label: 'ผู้เข้าร่วม', required: true },
    ],
    []
  );

  const todoFields = useMemo(
    () => [
      { name: 'title', label: 'งานที่ต้องทำ', required: true },
      { name: 'due', label: 'กำหนด', required: true },
      {
        name: 'priority',
        label: 'ความสำคัญ',
        type: 'select',
        required: true,
        options: [
          { value: 'high', label: 'สูง' },
          { value: 'medium', label: 'กลาง' },
          { value: 'low', label: 'ต่ำ' },
        ],
      },
    ],
    []
  );

  const documentFields = useMemo(
    () => [
      { name: 'title', label: 'ชื่อเอกสาร', required: true },
      {
        name: 'status',
        label: 'สถานะ',
        type: 'select',
        defaultValue: 'รอลงนาม',
        options: [
          { value: 'รอลงนาม', label: 'รอลงนาม' },
          { value: 'รอตรวจทาน', label: 'รอตรวจทาน' },
          { value: 'เสร็จแล้ว', label: 'เสร็จแล้ว' },
        ],
      },
      { name: 'updated', label: 'อัปเดตล่าสุด', required: true, placeholder: 'เช่น 13 มี.ค.' },
    ],
    []
  );

  const alertFields = useMemo(
    () => [
      { name: 'title', label: 'หัวข้อแจ้งเตือน', required: true },
      { name: 'detail', label: 'รายละเอียด', required: true },
      {
        name: 'tone',
        label: 'ประเภท',
        type: 'select',
        required: true,
        options: [
          { value: 'warning', label: 'Warning' },
          { value: 'info', label: 'Info' },
        ],
      },
    ],
    []
  );

  const strategyFields = useMemo(
    () => [
      {
        name: 'type',
        label: 'หมวดกลยุทธ์',
        type: 'select',
        required: true,
        options: [
          { value: 'succession', label: 'Succession & Continuity Planning' },
          { value: 'taxInvestment', label: 'Tax Optimized Investment' },
          { value: 'liquidity', label: 'Liquidity Support' },
          { value: 'personalAdvisory', label: 'Personal Advisory Relationship' },
        ],
      },
      { name: 'objective', label: 'เป้าหมาย', required: true },
      { name: 'owner', label: 'ผู้รับผิดชอบ/ที่ปรึกษา', placeholder: 'เช่น Private Banker' },
      { name: 'targetDate', label: 'กำหนดดำเนินการ', type: 'date' },
      {
        name: 'status',
        label: 'สถานะ',
        type: 'select',
        defaultValue: 'วางแผน',
        options: [
          { value: 'วางแผน', label: 'วางแผน' },
          { value: 'กำลังดำเนินการ', label: 'กำลังดำเนินการ' },
          { value: 'เสร็จแล้ว', label: 'เสร็จแล้ว' },
        ],
      },
    ],
    []
  );

  const goalFields = useMemo(
    () => [
      { name: 'name', label: 'ชื่อเป้าหมาย', required: true },
      { name: 'initialAmount', label: 'เงินตั้งต้น (บาท)', type: 'number', step: '0.01', required: true },
      { name: 'monthlyContribution', label: 'เติมเงินต่อเดือน (บาท)', type: 'number', step: '0.01' },
      { name: 'horizon', label: 'ระยะเวลา (ปี)', type: 'number', required: true },
      { name: 'objective', label: 'เป้าหมาย/รายละเอียด', required: true },
    ],
    []
  );

  const advisorFields = useMemo(
    () => [
      { name: 'name', label: 'ชื่อที่ปรึกษา', required: true },
      {
        name: 'industry',
        label: 'อุตสาหกรรมเชี่ยวชาญ',
        type: 'select',
        required: true,
        options: [
          { value: 'manufacturing', label: 'Manufacturing' },
          { value: 'tech', label: 'Technology' },
          { value: 'family', label: 'Family Business' },
          { value: 'services', label: 'Services' },
        ],
      },
      { name: 'expertise', label: 'ความถนัด', required: true },
      { name: 'region', label: 'ภูมิภาค', placeholder: 'เช่น Bangkok' },
    ],
    []
  );

  const noteFields = useMemo(
    () => [
      { name: 'label', label: 'ชื่อโน้ต/แหล่งข้อมูล', required: true },
      { name: 'source', label: 'แหล่งที่มา (URL/องค์กร)' },
      { name: 'detail', label: 'รายละเอียด', type: 'textarea', required: true },
    ],
    []
  );

  const investFields = useMemo(
    () => [
      { name: 'name', label: 'ชื่อโครงการลงทุน', required: true },
      {
        name: 'category',
        label: 'ประเภท',
        type: 'select',
        required: true,
        options: [
          { value: 'mutualFund', label: 'กองทุนรวม' },
          { value: 'stock', label: 'หุ้น' },
          { value: 'gold', label: 'ทองคำ' },
          { value: 'machine', label: 'เครื่องจักร/อุปกรณ์' },
          { value: 'expansion', label: 'ขยายสาขา' },
          { value: 'hiring', label: 'จ้างพนักงาน' },
          { value: 'upgrade', label: 'อัปเกรดระบบ' },
        ],
      },
      { name: 'amount', label: 'งบประมาณ (บาท)', type: 'number', required: true },
      {
        name: 'priority',
        label: 'ความสำคัญ',
        type: 'select',
        required: true,
        options: [
          { value: 'high', label: 'สูง' },
          { value: 'medium', label: 'กลาง' },
          { value: 'low', label: 'ต่ำ' },
        ],
      },
      { name: 'targetDate', label: 'กำหนดดำเนินการ', type: 'date' },
      { name: 'notes', label: 'หมายเหตุเพิ่มเติม', type: 'textarea' },
    ],
    []
  );

  const handleTransactionOcr = (items) => {
    if (!items.length) return;
    const fullText = items.map((item) => item.content).join('\n').trim();
    if (!fullText) return;
    const lines = fullText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const amountMatch = fullText.replace(/,/g, '').match(/(\d+\.\d+|\d+)/g);
    const amount = amountMatch ? amountMatch[amountMatch.length - 1] : '';
    setTransactionSeed({
      counterparty: lines[0] || '',
      reference: fullText.slice(0, 500),
      amount,
    });
  };

  const handleDocumentOcr = (items) => {
    if (!items.length) return;
    const fullText = items.map((item) => item.content).join('\n').trim();
    if (!fullText) return;
    const lines = fullText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    setDocumentSeed({
      title: lines[0] || 'เอกสารจาก OCR',
      status: 'รอตรวจทาน',
      updated: new Date().toLocaleDateString('th-TH'),
    });
  };

  const promptGeminiDemo = () => `You are generating mock operational data for a Thai SME manufacturing company. Respond with **JSON only** using the exact structure shown below. Keep text in Thai, keep numbers as numbers (no commas), and ensure arrays have rich realistic data (>=5 accounts, >=50 transactions over several days, >=10 combined approvals/payroll/cheques, >=5 strategies). Include timestamps in ISO format with +07:00. 

Example (truncated):
{
  "ktb.accounts": [
    { "id": "acc-main", "name": "บัญชีกลาง", "number": "123-456789-0", "balance": 8450000, "todayIn": 540000, "todayOut": 320000, "status": "พร้อมใช้งาน" },
    { "id": "acc-payroll", "name": "บัญชีเงินเดือน", "number": "234-567890-1", "balance": 2950000, "todayIn": 0, "todayOut": 1250000, "status": "กันสำรอง" }
  ],
  "ktb.transactions": [
    { "id": "tx-0001", "type": "Payroll", "counterparty": "พนักงาน 48 คน", "amount": -1250000, "accountId": "acc-payroll", "status": "ชำระเรียบร้อย", "timestamp": "2025-03-15T09:00:00+07:00", "reference": "Payroll-Mar15" }
  ],
  ... (include keys: ktb.cashflow, ktb.approvals, ktb.payroll, ktb.cheques, ktb.owner.insights, ktb.owner.distributions, ktb.owner.meetings, ktb.owner.todos, ktb.owner.documents, ktb.owner.alerts, ktb.owner.strategies, ktb.ai.goals, ktb.ai.advisors, ktb.ai.notes)
}

Now generate a full dataset following that structure with the quantity requirements.`;

  const generateDemoWithGemini = async () => {
    if (!effectiveGeminiKey) {
      setDemoError('กรุณาตั้งค่า Gemini API Key ก่อน');
      return;
    }
    setDemoError('');
    setDemoLoading(true);
    try {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + effectiveGeminiKey,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: promptGeminiDemo() }] }] }),
        }
      );
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'ไม่สามารถเรียก Gemini ได้');
      }
      const result = await response.json();
      const content = result.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n');
      if (!content) throw new Error('ไม่พบข้อมูลที่ Gemini ตอบกลับ');
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      const jsonText = jsonStart >= 0 ? content.slice(jsonStart, jsonEnd + 1) : content;
      const parsed = JSON.parse(jsonText);
      Object.entries(demoData).forEach(([key, fallback]) => {
        const nextValue = Array.isArray(parsed[key]) ? parsed[key] : fallback;
        localStorage.setItem(key, JSON.stringify(nextValue));
      });
      window.location.reload();
    } catch (err) {
      setDemoError(err.message || 'ไม่สามารถสร้างข้อมูลตัวอย่างได้');
    } finally {
      setDemoLoading(false);
    }
  };

  const clearAllData = () => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('ktb.'))
      .forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  };

  return (
    <div className="data-entry">
      <header className="toolbar data-toolbar">
        <div>
          <h1>ศูนย์จัดการข้อมูล</h1>
          <p>กรอก ปรับ และลบข้อมูลที่จะถูกนำไปแสดงใน Dashboard และมุมมองเจ้าของ</p>
        </div>
        <div className="toolbar-actions data-toolbar-actions">
            {!envGeminiKey && (
              <input
                type="password"
                placeholder="Gemini API Key"
                value={geminiKey}
                onChange={(event) => setGeminiKey(event.target.value)}
              />
            )}
            <button
              className="ghost"
              type="button"
              onClick={() => {
                demoSeed();
                window.location.reload();
              }}
            >
              {t.buttons.loadDemo}
            </button>
            <button className="primary" type="button" disabled={demoLoading} onClick={generateDemoWithGemini}>
              {demoLoading ? 'กำลังสร้างด้วย Gemini...' : t.buttons.demoGemini}
            </button>
            <button className="ghost" type="button" onClick={clearAllData}>
              {t.buttons.clearData}
            </button>
          </div>
      </header>
      {demoError && <p className="error-text">{demoError}</p>}

      <div className="data-grid">
        <section className="card data-section">
          <div className="section-header">
            <h2>กลยุทธ์การสืบทอดและการเงินส่วนตัว</h2>
            <p>ติดตามแผน Succession, การลงทุน, สภาพคล่อง และทีมที่ปรึกษาส่วนตัว</p>
          </div>
          <div className="list-simple">
            {ownerStrategies.map((strategy) => (
              <div className="list-simple-row" key={strategy.id}>
                <div>
                  <strong>{strategy.objective}</strong>
                  <small>{strategy.owner || '-'}</small>
                </div>
                <div className="list-simple-meta">
                  <span className="pill">{strategy.status}</span>
                  <small>{strategy.targetDate || '-'}</small>
                  <button type="button" className="ghost small" onClick={() => setOwnerStrategies((prev) => prev.filter((item) => item.id !== strategy.id))}>
                    ลบ
                  </button>
                </div>
              </div>
            ))}
            {!ownerStrategies.length && <p className="empty">ยังไม่มีกลยุทธ์</p>}
          </div>
          <InlineForm
            fields={strategyFields}
            submitLabel="เพิ่มกลยุทธ์"
            onSubmit={(values) => {
              setOwnerStrategies((prev) => [
                ...prev,
                {
                  id: createId(),
                  type: values.type,
                  objective: values.objective,
                  owner: values.owner,
                  targetDate: values.targetDate,
                  status: values.status,
                },
              ]);
            }}
          />
        </section>

        <section className="card data-section">
          <div className="section-header">
            <h2>AI Projection Goals</h2>
            <p>ระบุเป้าหมายทางการเงินเพื่อให้ AI คำนวณและฉายภาพอนาคต</p>
          </div>
          <div className="list-simple">
            {aiGoals.map((goal) => (
              <div className="list-simple-row" key={goal.id}>
                <div>
                  <strong>{goal.name}</strong>
                  <small>
                    เริ่ม {formatCurrency(goal.initialAmount)} | เติม {formatCurrency(goal.monthlyContribution || 0)} / เดือน
                  </small>
                </div>
                <div className="list-simple-meta">
                  <span>{goal.horizon} ปี</span>
                  <button type="button" className="ghost small" onClick={() => setAiGoals((prev) => prev.filter((item) => item.id !== goal.id))}>
                    ลบ
                  </button>
                </div>
              </div>
            ))}
            {!aiGoals.length && <p className="empty">ยังไม่มีเป้าหมาย AI</p>}
          </div>
          <InlineForm
            fields={goalFields}
            submitLabel="เพิ่มเป้าหมาย"
            onSubmit={(values) => {
              setAiGoals((prev) => [
                ...prev,
                {
                  id: createId(),
                  name: values.name,
                  initialAmount: toNumber(values.initialAmount),
                  monthlyContribution: toNumber(values.monthlyContribution),
                  horizon: Number(values.horizon || 0),
                  objective: values.objective,
                },
              ]);
            }}
          />
        </section>

        <section className="card data-section">
          <div className="section-header">
            <h2>Advisor Directory</h2>
            <p>เพิ่มรายชื่อที่ปรึกษาเพื่อให้ระบบจับคู่กับเป้าหมายตามอุตสาหกรรม</p>
          </div>
          <div className="list-simple">
            {aiAdvisors.map((advisor) => (
              <div className="list-simple-row" key={advisor.id}>
                <div>
                  <strong>{advisor.name}</strong>
                  <small>
                    {advisor.industry} • {advisor.expertise}
                  </small>
                </div>
                <div className="list-simple-meta">
                  <span>{advisor.region || '-'}</span>
                  <button type="button" className="ghost small" onClick={() => setAiAdvisors((prev) => prev.filter((item) => item.id !== advisor.id))}>
                    ลบ
                  </button>
                </div>
              </div>
            ))}
            {!aiAdvisors.length && <p className="empty">ยังไม่มีรายชื่อที่ปรึกษา</p>}
          </div>
          <InlineForm
            fields={advisorFields}
            submitLabel="เพิ่มที่ปรึกษา"
            onSubmit={(values) => {
              setAiAdvisors((prev) => [
                ...prev,
                { id: createId(), name: values.name, industry: values.industry, expertise: values.expertise, region: values.region },
              ]);
            }}
          />
        </section>

        <section className="card data-section">
          <div className="section-header">
            <h2>Investment Opportunities</h2>
            <p>ระบุแผนการลงทุนทั้งด้านการเงินและขยายธุรกิจ</p>
          </div>
          <div className="list-simple">
            {investOpportunities.map((op) => (
              <div className="list-simple-row" key={op.id}>
                <div>
                  <strong>{op.name}</strong>
                  <small>
                    {op.category} • {op.notes || '-'}
                  </small>
                </div>
                <div className="list-simple-meta">
                  <span>{formatCurrency(op.amount)}</span>
                  <span className={`pill ${op.priority === 'high' ? 'danger' : op.priority === 'medium' ? 'warning' : ''}`}>{op.priority}</span>
                  <button type="button" className="ghost small" onClick={() => setInvestOpportunities((prev) => prev.filter((item) => item.id !== op.id))}>
                    ลบ
                  </button>
                </div>
              </div>
            ))}
            {!investOpportunities.length && <p className="empty">ยังไม่ได้เพิ่มแผนการลงทุน</p>}
          </div>
          <InlineForm
            fields={investFields}
            submitLabel="เพิ่มแผนลงทุน"
            onSubmit={(values) => {
              setInvestOpportunities((prev) => [
                ...prev,
                {
                  id: createId(),
                  name: values.name,
                  category: values.category,
                  amount: toNumber(values.amount),
                  priority: values.priority,
                  targetDate: values.targetDate,
                  notes: values.notes,
                },
              ]);
            }}
          />
        </section>

        <section className="card data-section">
          <div className="section-header">
            <h2>External Data Notes</h2>
            <p>บันทึกข้อมูลภายนอกเพื่อให้ AI ใช้ประกอบการวิเคราะห์</p>
          </div>
          <div className="list-simple">
            {aiNotes.map((note) => (
              <div className="list-simple-row" key={note.id}>
                <div>
                  <strong>{note.label}</strong>
                  <small>{note.source || '-'}</small>
                </div>
                <div className="list-simple-meta">
                  <button type="button" className="ghost small" onClick={() => setAiNotes((prev) => prev.filter((item) => item.id !== note.id))}>
                    ลบ
                  </button>
                </div>
              </div>
            ))}
            {!aiNotes.length && <p className="empty">ยังไม่มีโน้ตข้อมูลภายนอก</p>}
          </div>
          <InlineForm
            fields={noteFields}
            submitLabel="เพิ่มโน้ต"
            onSubmit={(values) => {
              setAiNotes((prev) => [
                ...prev,
                { id: createId(), label: values.label, source: values.source, detail: values.detail },
              ]);
            }}
          />
        </section>

        <section className="card data-section">
          <div className="section-header">
            <h2>บัญชี</h2>
            <p>ข้อมูลบัญชีจะไปแสดงในภาพรวมและใช้เป็นตัวเลือกในหน้าธุรกรรม</p>
          </div>
          <div className="list-simple">
            {accounts.map((acc) => (
              <div className="list-simple-row" key={acc.id}>
                <div>
                  <strong>{acc.name}</strong>
                  <small>{acc.number}</small>
                </div>
                <div className="list-simple-meta">
                  <span>{formatCurrency(acc.balance)}</span>
                  <button type="button" className="ghost small" onClick={() => setAccounts((prev) => prev.filter((item) => item.id !== acc.id))}>
                    ลบ
                  </button>
                </div>
              </div>
            ))}
            {!accounts.length && <p className="empty">ยังไม่มีบัญชี</p>}
          </div>
          <InlineForm
            fields={accountFields}
            submitLabel="เพิ่มบัญชี"
            onSubmit={(values) => {
              setAccounts((prev) => [
                ...prev,
                {
                  id: createId(),
                  name: values.name,
                  number: values.number,
                  balance: toNumber(values.balance),
                  todayIn: toNumber(values.todayIn),
                  todayOut: toNumber(values.todayOut),
                  status: values.status || 'พร้อมใช้งาน',
                },
              ]);
            }}
          />
        </section>

        <section className="card data-section">
          <div className="section-header">
            <h2>Cash Flow (7 วัน)</h2>
            <p>กำหนดตัวเลขสำหรับกราฟในภาพรวม</p>
          </div>
          <div className="list-simple">
            {cashFlowHistory.map((row) => (
              <div className="list-simple-row" key={row.id}>
                <div>
                  <strong>{row.date}</strong>
                  <small>เข้า {row.inflow}M • ออก {row.outflow}M</small>
                </div>
                <button type="button" className="ghost small" onClick={() => setCashFlowHistory((prev) => prev.filter((item) => item.id !== row.id))}>
                  ลบ
                </button>
              </div>
            ))}
            {!cashFlowHistory.length && <p className="empty">ยังไม่มีข้อมูล Cash Flow</p>}
          </div>
          <InlineForm
            fields={cashflowFields}
            submitLabel="เพิ่มข้อมูล Cash Flow"
            onSubmit={(values) => {
              setCashFlowHistory((prev) => [
                ...prev,
                { id: createId(), date: values.date, inflow: toNumber(values.inflow), outflow: toNumber(values.outflow) },
              ]);
            }}
          />
        </section>

        <section className="card data-section">
          <div className="section-header">
            <h2>ธุรกรรม</h2>
            <p>ควบคุมรายการที่แสดงในตารางธุรกรรมล่าสุด</p>
          </div>
          <div className="list-simple">
            {transactions.map((tx) => (
              <div className="list-simple-row" key={tx.id}>
                <div>
                  <strong>{tx.type}</strong>
                  <small>{tx.counterparty}</small>
                </div>
                <div className="list-simple-meta">
                  <span className={`amount ${tx.amount < 0 ? 'negative' : 'positive'}`}>
                    {tx.amount < 0 ? '-' : '+'}
                    {formatCurrency(Math.abs(tx.amount))}
                  </span>
                  <button type="button" className="ghost small" onClick={() => setTransactions((prev) => prev.filter((item) => item.id !== tx.id))}>
                    ลบ
                  </button>
                </div>
              </div>
            ))}
            {!transactions.length && <p className="empty">ยังไม่มีธุรกรรม</p>}
          </div>
          <OcrUploader title="OCR ใบเสร็จ (ธุรกรรม)" helper="อัปโหลดบิลหรือใบเสร็จเพื่อคัดลอกข้อความมากรอกฟอร์ม" onExtract={handleTransactionOcr} />
          <InlineForm
            fields={transactionFields}
            seed={transactionSeed}
            submitLabel="เพิ่มธุรกรรม"
            onSubmit={(values) => {
              setTransactions((prev) => [
                ...prev,
                {
                  id: createId(),
                  type: values.type,
                  counterparty: values.counterparty,
                  amount: toNumber(values.amount),
                  accountId: values.accountId,
                  status: values.status || 'รอดำเนินการ',
                  timestamp: values.timestamp || new Date().toISOString(),
                  reference: values.reference,
                },
              ]);
              setTransactionSeed({});
            }}
          />
        </section>

        <section className="card data-section">
          <div className="section-header">
            <h2>งานอนุมัติ / Payroll / เช็ค</h2>
            <p>เวิร์กโฟลว์สำหรับทีมการเงิน</p>
          </div>
          <div className="data-section-grid">
            <div>
              <h3>งานอนุมัติ</h3>
              <div className="list-simple">
                {approvalQueue.map((task) => (
                  <div className="list-simple-row" key={task.id}>
                    <div>
                      <strong>{task.title}</strong>
                      <small>{task.detail}</small>
                    </div>
                    <button type="button" className="ghost small" onClick={() => setApprovalQueue((prev) => prev.filter((item) => item.id !== task.id))}>
                      ลบ
                    </button>
                  </div>
                ))}
                {!approvalQueue.length && <p className="empty">ยังไม่มีงาน</p>}
              </div>
              <InlineForm
                fields={approvalFields}
                submitLabel="เพิ่มงานอนุมัติ"
                onSubmit={(values) => {
                  setApprovalQueue((prev) => [
                    ...prev,
                    { id: createId(), title: values.title, detail: values.detail, submittedBy: values.submittedBy, level: values.level },
                  ]);
                }}
              />
            </div>

            <div>
              <h3>Payroll</h3>
              <div className="list-simple">
                {payrollRuns.map((run) => (
                  <div className="list-simple-row" key={run.id}>
                    <div>
                      <strong>{run.cycle}</strong>
                      <small>{run.employees} พนักงาน • {run.status}</small>
                    </div>
                    <button type="button" className="ghost small" onClick={() => setPayrollRuns((prev) => prev.filter((item) => item.id !== run.id))}>
                      ลบ
                    </button>
                  </div>
                ))}
                {!payrollRuns.length && <p className="empty">ยังไม่มีรอบจ่าย</p>}
              </div>
              <InlineForm
                fields={payrollFields}
                submitLabel="เพิ่ม Payroll"
                onSubmit={(values) => {
                  setPayrollRuns((prev) => [
                    ...prev,
                    {
                      id: createId(),
                      cycle: values.cycle,
                      employees: toNumber(values.employees),
                      status: values.status,
                      cutOff: values.cutOff,
                    },
                  ]);
                }}
              />
            </div>

            <div>
              <h3>งานเช็ค</h3>
              <div className="list-simple">
                {chequeTasks.map((task) => (
                  <div className="list-simple-row" key={task.id}>
                    <div>
                      <strong>{task.action}</strong>
                      <small>{task.detail}</small>
                    </div>
                    <button type="button" className="ghost small" onClick={() => setChequeTasks((prev) => prev.filter((item) => item.id !== task.id))}>
                      ลบ
                    </button>
                  </div>
                ))}
                {!chequeTasks.length && <p className="empty">ยังไม่มีงานเช็ค</p>}
              </div>
              <InlineForm
                fields={chequeFields}
                submitLabel="เพิ่มงานเช็ค"
                onSubmit={(values) => {
                  setChequeTasks((prev) => [
                    ...prev,
                    {
                      id: createId(),
                      action: values.action,
                      detail: values.detail,
                      status: values.status,
                      due: values.due,
                    },
                  ]);
                }}
              />
            </div>
          </div>
        </section>

        <section className="card data-section">
          <div className="section-header">
            <h2>Insight เจ้าของ</h2>
            <p>การ์ดไฮไลต์ในหน้ามุมมองเจ้าของ</p>
          </div>
          <div className="list-simple">
            {ownerInsights.map((item) => (
              <div className="list-simple-row" key={item.id}>
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.helper}</small>
                </div>
                <button type="button" className="ghost small" onClick={() => setOwnerInsights((prev) => prev.filter((insight) => insight.id !== item.id))}>
                  ลบ
                </button>
              </div>
            ))}
            {!ownerInsights.length && <p className="empty">ยังไม่มี Insight</p>}
          </div>
          <InlineForm
            fields={insightFields}
            submitLabel="เพิ่ม Insight"
            onSubmit={(values) => {
              setOwnerInsights((prev) => [
                ...prev,
                { id: createId(), label: values.label, type: values.type, value: values.value, helper: values.helper },
              ]);
            }}
          />
        </section>

        <section className="card data-section">
          <div className="section-header">
            <h2>การเบิก/กระจายเงิน</h2>
          </div>
          <div className="list-simple">
            {ownerDistributions.map((dist) => (
              <div className="list-simple-row" key={dist.id}>
                <div>
                  <strong>{dist.title}</strong>
                  <small>{dist.schedule}</small>
                </div>
                <button type="button" className="ghost small" onClick={() => setOwnerDistributions((prev) => prev.filter((item) => item.id !== dist.id))}>
                  ลบ
                </button>
              </div>
            ))}
            {!ownerDistributions.length && <p className="empty">ยังไม่มีรายการเบิก</p>}
          </div>
          <InlineForm
            fields={distributionFields}
            submitLabel="เพิ่มรายการ"
            onSubmit={(values) => {
              setOwnerDistributions((prev) => [
                ...prev,
                {
                  id: createId(),
                  title: values.title,
                  amount: toNumber(values.amount),
                  schedule: values.schedule,
                  status: values.status,
                },
              ]);
            }}
          />
        </section>

        <section className="card data-section">
          <div className="section-header">
            <h2>นัดหมาย & งานเจ้าของ</h2>
          </div>
          <div className="data-section-grid">
            <div>
              <h3>นัดหมาย</h3>
              <div className="list-simple">
                {ownerMeetings.map((meeting) => (
                  <div className="list-simple-row" key={meeting.id}>
                    <div>
                      <strong>{meeting.title}</strong>
                      <small>{meeting.channel} • {meeting.time}</small>
                    </div>
                    <button type="button" className="ghost small" onClick={() => setOwnerMeetings((prev) => prev.filter((item) => item.id !== meeting.id))}>
                      ลบ
                    </button>
                  </div>
                ))}
                {!ownerMeetings.length && <p className="empty">ยังไม่มีนัดหมาย</p>}
              </div>
              <InlineForm
                fields={meetingFields}
                submitLabel="เพิ่มนัดหมาย"
                onSubmit={(values) => {
                  setOwnerMeetings((prev) => [
                    ...prev,
                    { id: createId(), title: values.title, time: values.time, channel: values.channel, participants: values.participants },
                  ]);
                }}
              />
            </div>

            <div>
              <h3>สิ่งที่ต้องทำ</h3>
              <div className="list-simple">
                {ownerTodos.map((todo) => (
                  <div className="list-simple-row" key={todo.id}>
                    <div>
                      <strong>{todo.title}</strong>
                      <small>{todo.due} • {todo.priority}</small>
                    </div>
                    <button type="button" className="ghost small" onClick={() => setOwnerTodos((prev) => prev.filter((item) => item.id !== todo.id))}>
                      ลบ
                    </button>
                  </div>
                ))}
                {!ownerTodos.length && <p className="empty">ยังไม่มีงาน</p>}
              </div>
              <InlineForm
                fields={todoFields}
                submitLabel="เพิ่มงาน"
                onSubmit={(values) => {
                  setOwnerTodos((prev) => [
                    ...prev,
                    { id: createId(), title: values.title, due: values.due, priority: values.priority, done: false },
                  ]);
                }}
              />
            </div>
          </div>
        </section>

        <section className="card data-section">
          <div className="section-header">
            <h2>เอกสาร & การแจ้งเตือน</h2>
          </div>
          <div className="data-section-grid">
            <div>
              <h3>เอกสาร</h3>
              <div className="list-simple">
                {ownerDocuments.map((doc) => (
                  <div className="list-simple-row" key={doc.id}>
                    <div>
                      <strong>{doc.title}</strong>
                      <small>{doc.updated}</small>
                    </div>
                    <button type="button" className="ghost small" onClick={() => setOwnerDocuments((prev) => prev.filter((item) => item.id !== doc.id))}>
                      ลบ
                    </button>
                  </div>
                ))}
                {!ownerDocuments.length && <p className="empty">ยังไม่มีเอกสาร</p>}
              </div>
              <OcrUploader title="OCR เอกสาร" helper="สแกนสัญญาหรือเอกสารทางธุรกิจเพื่อดึงข้อความ" onExtract={handleDocumentOcr} />
              <InlineForm
                fields={documentFields}
                seed={documentSeed}
                submitLabel="เพิ่มเอกสาร"
                onSubmit={(values) => {
                  setOwnerDocuments((prev) => [
                    ...prev,
                    { id: createId(), title: values.title, status: values.status, updated: values.updated },
                  ]);
                  setDocumentSeed({});
                }}
              />
            </div>

            <div>
              <h3>การแจ้งเตือน</h3>
              <div className="list-simple">
                {ownerAlerts.map((alert) => (
                  <div className="list-simple-row" key={alert.id}>
                    <div>
                      <strong>{alert.title}</strong>
                      <small>{alert.detail}</small>
                    </div>
                    <button type="button" className="ghost small" onClick={() => setOwnerAlerts((prev) => prev.filter((item) => item.id !== alert.id))}>
                      ลบ
                    </button>
                  </div>
                ))}
                {!ownerAlerts.length && <p className="empty">ยังไม่มีการแจ้งเตือน</p>}
              </div>
              <InlineForm
                fields={alertFields}
                submitLabel="เพิ่มแจ้งเตือน"
                onSubmit={(values) => {
                  setOwnerAlerts((prev) => [
                    ...prev,
                    { id: createId(), title: values.title, detail: values.detail, tone: values.tone },
                  ]);
                }}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DataEntry;
