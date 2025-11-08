import React from 'react';
import { usePersistentList } from '../hooks/usePersistentList.js';
import { formatCurrency } from '../utils/formatters.js';
import InvestmentAssistantPanel from '../components/InvestmentAssistantPanel.jsx';

const formatValue = (item) => {
  if (item.type === 'currency') return formatCurrency(item.value);
  if (item.type === 'count') return `${item.value} รายการ`;
  return item.value;
};

function OwnerConsole() {
  const [ownerInsights] = usePersistentList('ktb.owner.insights');
  const [ownerDistributions] = usePersistentList('ktb.owner.distributions');
  const [ownerMeetings] = usePersistentList('ktb.owner.meetings');
  const [ownerTodos, setOwnerTodos] = usePersistentList('ktb.owner.todos');
  const [ownerDocuments, setOwnerDocuments] = usePersistentList('ktb.owner.documents');
  const [ownerAlerts, setOwnerAlerts] = usePersistentList('ktb.owner.alerts');
  const [ownerStrategies] = usePersistentList('ktb.owner.strategies');
  const [accounts] = usePersistentList('ktb.accounts');
  const [investOpportunities] = usePersistentList('ktb.invest.opportunities');

  const availableForOwner = ownerDistributions.reduce(
    (acc, item) => {
      if (item.status === 'พร้อมจ่าย') acc.ready += Number(item.amount || 0);
      else acc.waiting += Number(item.amount || 0);
      return acc;
    },
    { ready: 0, waiting: 0 }
  );

  return (
    <>
      <header className="toolbar">
        <div>
          <h1>มุมมองเจ้าของกิจการ</h1>
          <p>บริหารการเบิกเงิน ตารางงาน และเอกสารสำคัญได้ที่นี่</p>
        </div>
        <div className="toolbar-actions">
          <button className="ghost">เพิ่มคำขอเบิกเงิน</button>
          <button className="primary">สร้างคำสั่งอนุมัติ</button>
        </div>
      </header>

      <section className="grid stats owner-insights">
        {ownerInsights.map((insight) => (
          <article key={insight.id}>
            <span>{insight.label}</span>
            <strong>{formatValue(insight)}</strong>
            <small>{insight.helper}</small>
          </article>
        ))}
        {!ownerInsights.length && <p className="empty">ยังไม่มีข้อมูล Insight - เพิ่มจากหน้า Data Entry</p>}
      </section>

      <section className="grid content owner-grid">
        <article className="card distributions">
          <div className="card-header">
            <div>
              <h2>รายการเบิก/กระจายเงิน</h2>
              <p>
                พร้อมจ่าย {formatCurrency(availableForOwner.ready)} | รออนุมัติ {formatCurrency(availableForOwner.waiting)}
              </p>
            </div>
          </div>
          <div className="distribution-list">
            {ownerDistributions.map((dist) => (
              <div className="distribution-row" key={dist.id}>
                <div>
                  <strong>{dist.title}</strong>
                  <small>{dist.schedule}</small>
                </div>
                <div>
                  <span className="amount positive">{formatCurrency(dist.amount)}</span>
                  <span className={`pill ${dist.status === 'ต้องอนุมัติ' ? 'warning' : dist.status === 'เตือน' ? 'danger' : ''}`}>
                    {dist.status}
                  </span>
                </div>
              </div>
            ))}
            {!ownerDistributions.length && <p className="empty">ยังไม่มีคำขอเบิกเงิน</p>}
          </div>
        </article>

        <article className="card meetings">
          <div className="card-header">
            <h2>ปฏิทินวันนี้</h2>
            <span>{ownerMeetings.length} นัดหมาย</span>
          </div>
          <div className="meeting-list">
            {ownerMeetings.map((meeting) => (
              <div className="meeting-card" key={meeting.id}>
                <div>
                  <strong>{meeting.title}</strong>
                  <small>{meeting.participants}</small>
                </div>
                <div className="meeting-meta">
                  <span className="pill">{meeting.channel}</span>
                  <strong>{meeting.time}</strong>
                </div>
              </div>
            ))}
            {!ownerMeetings.length && <p className="empty">ยังไม่มีนัดหมาย</p>}
          </div>
        </article>
      </section>

      <section className="card advisory">
        <div className="section-header">
          <h2>Succession & Advisory Blueprint</h2>
          <p>วางแผนสืบทอด การลงทุน ภาษี สภาพคล่อง และความสัมพันธ์กับที่ปรึกษาส่วนตัว</p>
        </div>
        <div className="advisory-grid">
          {[
            {
              key: 'succession',
              title: 'Succession & Continuity',
              detail: 'โครงสร้างการโอนกิจการให้ทายาทพร้อมประกันความต่อเนื่องและสิทธิ์ลงนาม',
            },
            {
              key: 'taxInvestment',
              title: 'Tax-Optimized Investment',
              detail: 'ออกแบบพอร์ตการลงทุนให้เติบโตโดยถูกต้องตามกฎหมายและใช้ประโยชน์จากสิทธิภาษี',
            },
            {
              key: 'liquidity',
              title: 'Liquidity Support',
              detail: 'วงเงินสภาพคล่องระยะสั้นเพื่อรองรับ Payroll และ Cash-Flow Gap',
            },
            {
              key: 'personalAdvisory',
              title: 'Personal Advisory Relationship',
              detail: 'ทีม Private Banker และผู้เชี่ยวชาญที่คอยให้คำแนะนำเฉพาะธุรกิจ',
            },
          ].map((item) => (
            <article key={item.key}>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
              <small>
                {ownerStrategies.filter((strategy) => strategy.type === item.key).length} กลยุทธ์ที่บันทึกไว้
              </small>
            </article>
          ))}
        </div>
        <div className="strategy-list">
          {ownerStrategies.map((strategy) => (
            <div className="strategy-card" key={strategy.id}>
              <div>
                <strong>{strategy.objective}</strong>
                <small>{strategy.owner || '-'}</small>
              </div>
              <div className="strategy-meta">
                <span className="pill">{strategy.status}</span>
                <small>{strategy.targetDate || '-'}</small>
              </div>
            </div>
          ))}
          {!ownerStrategies.length && <p className="empty">ยังไม่มีกลยุทธ์ เพิ่มได้ที่หน้า Data Entry</p>}
        </div>
      </section>

      <InvestmentAssistantPanel accounts={accounts} opportunities={investOpportunities} />

      <section className="grid split owner-split">
        <article className="card tasks">
          <div className="card-header">
            <h2>สิ่งที่เจ้าของต้องทำ</h2>
            <span>{ownerTodos.filter((item) => !item.done).length} รายการค้าง</span>
          </div>
          <div className="todo-list">
            {ownerTodos.map((todo) => (
              <label className={`todo-item ${todo.done ? 'done' : ''}`} key={todo.id}>
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() =>
                    setOwnerTodos((prev) => prev.map((item) => (item.id === todo.id ? { ...item, done: !item.done } : item)))
                  }
                />
                <div>
                  <strong>{todo.title}</strong>
                  <small>{todo.due}</small>
                </div>
                <span className={`pill ${todo.priority === 'high' ? 'danger' : todo.priority === 'medium' ? 'warning' : ''}`}>
                  {todo.priority}
                </span>
              </label>
            ))}
            {!ownerTodos.length && <p className="empty">ยังไม่มีงาน</p>}
          </div>
        </article>

        <article className="card documents">
          <div className="card-header">
            <h2>เอกสารที่ต้องเซ็น</h2>
            <span>{ownerDocuments.filter((doc) => doc.status !== 'เสร็จแล้ว').length} ฉบับ</span>
          </div>
          <div className="document-list">
            {ownerDocuments.map((doc) => (
              <div className="document-row" key={doc.id}>
                <div>
                  <strong>{doc.title}</strong>
                  <small>อัปเดต {doc.updated}</small>
                </div>
                <div className="document-actions">
                  <span className="pill">{doc.status}</span>
                  {doc.status !== 'เสร็จแล้ว' && (
                    <button
                      className="primary small"
                      onClick={() => setOwnerDocuments((prev) => prev.map((item) => (item.id === doc.id ? { ...item, status: 'เสร็จแล้ว' } : item)))}
                    >
                      เซ็นแล้ว
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!ownerDocuments.length && <p className="empty">ยังไม่มีเอกสาร</p>}
          </div>
        </article>
      </section>

      <section className="card alerts">
        <div className="card-header">
          <h2>การแจ้งเตือน</h2>
        </div>
        <div className="alert-list">
          {ownerAlerts.map((alert) => (
            <div className={`alert-card ${alert.tone}`} key={alert.id}>
              <strong>{alert.title}</strong>
              <p>{alert.detail}</p>
              <button className="ghost small" type="button" onClick={() => setOwnerAlerts((prev) => prev.filter((item) => item.id !== alert.id))}>
                ลบ
              </button>
            </div>
          ))}
          {!ownerAlerts.length && <p className="empty">ยังไม่มีแจ้งเตือน</p>}
        </div>
      </section>
    </>
  );
}

export default OwnerConsole;
