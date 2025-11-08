import React, { useMemo } from 'react';
import { createInvestmentPlan, summarizeCategory } from '../utils/investmentPlanner.js';
import { formatCurrency } from '../utils/formatters.js';

function InvestmentAssistantPanel({ accounts, opportunities }) {
  const plan = useMemo(() => createInvestmentPlan(accounts, opportunities), [accounts, opportunities]);

  return (
    <section className="card investment-panel">
      <div className="section-header">
        <h2>Agentic Investment Planner</h2>
        <p>ระบบช่วยเลือกบัญชีที่เหมาะสมสำหรับการลงทุนทั้งด้านการเงินและในกิจการ</p>
      </div>
      {!plan.allocations.length && <p className="empty">ยังไม่มีข้อมูลเพียงพอ (เพิ่มบัญชีและแผนลงทุน)</p>}
      {plan.allocations.map((item) => (
        <article key={item.opportunity} className="allocation-card">
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
        </article>
      ))}
      <p className="notes">{plan.notes}</p>
    </section>
  );
}

export default InvestmentAssistantPanel;
