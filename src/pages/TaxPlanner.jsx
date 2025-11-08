import React, { useMemo, useState } from 'react';
import { usePersistentList } from '../hooks/usePersistentList.js';
import { summarizeTax } from '../utils/taxCalculator.js';
import { formatCurrency } from '../utils/formatters.js';

function TaxPlanner() {
  const [transactions] = usePersistentList('ktb.transactions');
  const summary = useMemo(() => summarizeTax(transactions), [transactions]);
  const [rate, setRate] = useState(0.2);
  const dynamicTax = Math.max(summary.profit * rate, 0);

  return (
    <div className="tax-page">
      <header className="toolbar">
        <div>
          <h1>Tax & Legal Control</h1>
          <p>วิเคราะห์รายรับรายจ่าย เพื่อคาดประมาณภาษีนิติบุคคลและ VAT</p>
        </div>
      </header>

      <section className="grid stats">
        <article>
          <span>รายได้รวม</span>
          <strong>{formatCurrency(summary.totalIncome)}</strong>
        </article>
        <article>
          <span>ค่าใช้จ่ายรวม</span>
          <strong>{formatCurrency(summary.totalExpense)}</strong>
        </article>
        <article>
          <span>กำไรเบื้องต้น</span>
          <strong>{formatCurrency(summary.profit)}</strong>
        </article>
      </section>

      <section className="grid split tax-grid">
        <article className="card">
          <h2>Corporate Income Tax</h2>
          <label className="setting-row">
            <div>
              <strong>Tax Rate</strong>
              <small>ค่าปกติ 20% (0.2)</small>
            </div>
            <input type="number" step="0.01" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
          </label>
          <p>ประมาณการภาษีนิติบุคคล: {formatCurrency(dynamicTax)}</p>
        </article>

        <article className="card">
          <h2>Value Added Tax (VAT)</h2>
          <p>Output VAT: {formatCurrency(summary.vatDue)}</p>
          <p>Input VAT Credit: {formatCurrency(summary.vatCredit)}</p>
          <strong>สุทธิ: {formatCurrency(summary.netVat)}</strong>
        </article>
      </section>

      <section className="card">
        <h2>รายการอ้างอิง</h2>
        <div className="table-head">
          <span>ประเภท</span>
          <span>คู่ค้า</span>
          <span>จำนวนเงิน</span>
          <span>เวลา</span>
        </div>
        {transactions.map((tx) => (
          <div className="table-row" key={tx.id}>
            <strong>{tx.type}</strong>
            <span>{tx.counterparty}</span>
            <span className={`amount ${tx.amount < 0 ? 'negative' : 'positive'}`}>
              {tx.amount < 0 ? '-' : '+'}
              {formatCurrency(Math.abs(tx.amount))}
            </span>
            <small>{tx.timestamp || '-'}</small>
          </div>
        ))}
        {!transactions.length && <p className="empty">ยังไม่มีธุรกรรม</p>}
      </section>
    </div>
  );
}

export default TaxPlanner;
