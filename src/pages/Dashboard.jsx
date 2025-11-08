import React, { useMemo, useState } from 'react';
import { usePersistentList } from '../hooks/usePersistentList.js';
import { formatCurrency, formatDateTime } from '../utils/formatters.js';
import { usePersistentState } from '../hooks/usePersistentState.js';
import { getMessages } from '../utils/i18n.js';

const toNumber = (value) => Number(value || 0);

function Dashboard() {
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [accounts] = usePersistentList('ktb.accounts');
  const [transactions] = usePersistentList('ktb.transactions');
  const [cashFlowHistory] = usePersistentList('ktb.cashflow');
  const [approvalQueue, setApprovalQueue] = usePersistentList('ktb.approvals');
  const [payrollRuns] = usePersistentList('ktb.payroll');
  const [chequeTasks] = usePersistentList('ktb.cheques');
  const [settings] = usePersistentState('ktb.settings', {});
  const d = getMessages(settings.language).dashboard;

  const totals = useMemo(() => {
    const totalBalance = accounts.reduce((sum, acc) => sum + toNumber(acc.balance), 0);
    const todayIn = accounts.reduce((sum, acc) => sum + toNumber(acc.todayIn), 0);
    const todayOut = accounts.reduce((sum, acc) => sum + toNumber(acc.todayOut), 0);
    return { totalBalance, todayIn, todayOut };
  }, [accounts]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchAccount = selectedAccount === 'all' || tx.accountId === selectedAccount;
      const matchSearch = [tx.type, tx.counterparty, tx.id, tx.reference]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchAccount && matchSearch;
    });
  }, [selectedAccount, searchTerm, transactions]);

  const handleApprove = (id) => {
    setApprovalQueue((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <>
      <header className="toolbar">
        <div>
          <h1>{d.title}</h1>
          <p>{d.subtitle}</p>
        </div>
        <div className="toolbar-actions">
          <button className="ghost">{d.actions.transfer}</button>
          <button className="primary">{d.actions.payroll}</button>
        </div>
      </header>

      <section className="grid stats">
        <article>
          <span>{d.stats.totalBalance}</span>
          <strong>{formatCurrency(totals.totalBalance)}</strong>
          <small>{d.stats.totalBalanceHint.replace('{count}', accounts.length)}</small>
        </article>
        <article>
          <span>{d.stats.inflow}</span>
          <strong>{formatCurrency(totals.todayIn)}</strong>
          <small>{d.stats.inflowHint}</small>
        </article>
        <article>
          <span>{d.stats.outflow}</span>
          <strong>{formatCurrency(totals.todayOut)}</strong>
          <small>{d.stats.outflowHint}</small>
        </article>
        <article>
          <span>{d.stats.approvals}</span>
          <strong>{approvalQueue.length}</strong>
          <small>{d.stats.approvalsHint}</small>
        </article>
      </section>

      <section className="grid content">
        <article className="card accounts">
          <div className="card-header">
            <h2>{d.accounts.title}</h2>
            <div className="tabs">
              <button
                type="button"
                className={selectedAccount === 'all' ? 'active' : ''}
                onClick={() => setSelectedAccount('all')}
              >
                {d.accounts.all}
              </button>
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  className={selectedAccount === acc.id ? 'active' : ''}
                  onClick={() => setSelectedAccount(acc.id)}
                >
                  {acc.name?.split(' ')[0] || 'บัญชี'}
                </button>
              ))}
            </div>
          </div>
          <div className="account-list">
            {accounts.map((acc) => (
              <div className={`account-card ${selectedAccount === acc.id ? 'is-active' : ''}`} key={acc.id}>
                <div>
                  <strong>{acc.name}</strong>
                  <small>{acc.number}</small>
                </div>
                <div className="balance">{formatCurrency(acc.balance)}</div>
                <div className="mini-stats">
                  <span>
                    {d.accounts.inflow} {formatCurrency(acc.todayIn)}
                  </span>
                  <span>
                    {d.accounts.outflow} {formatCurrency(acc.todayOut)}
                  </span>
                </div>
                <p>{acc.status}</p>
              </div>
            ))}
            {!accounts.length && <p className="empty">{d.accounts.empty}</p>}
          </div>
        </article>

        <article className="card chart">
          <div className="card-header">
            <h2>{d.chart.title}</h2>
            <span>{d.chart.unit}</span>
          </div>
          <div className="chart-grid">
            {cashFlowHistory.map((item) => (
              <div className="chart-col" key={item.id ?? item.date}>
                <div className="bar in" style={{ height: `${Number(item.inflow || 0) * 60}px` }} />
                <div className="bar out" style={{ height: `${Number(item.outflow || 0) * 60}px` }} />
                <small>{item.date}</small>
              </div>
            ))}
            {!cashFlowHistory.length && <p className="empty">{d.chart.empty}</p>}
          </div>
          <div className="legend">
            <span className="in">{d.chart.legendIn}</span>
            <span className="out">{d.chart.legendOut}</span>
          </div>
        </article>
      </section>

      <section className="card table">
        <div className="card-header">
          <div>
            <h2>{d.table.title}</h2>
            <p>{d.table.description}</p>
          </div>
          <input type="search" placeholder={d.table.search} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        </div>
        <div className="table-head">
          <span>{d.table.type}</span>
          <span>{d.table.detail}</span>
          <span>{d.table.amount}</span>
          <span>{d.table.status}</span>
          <span>{d.table.time}</span>
        </div>
        {filteredTransactions.map((tx) => (
          <div className="table-row" key={tx.id}>
            <div>
              <strong>{tx.type}</strong>
              <small>{tx.reference || tx.id}</small>
            </div>
            <span>{tx.counterparty}</span>
            <span className={`amount ${tx.amount < 0 ? 'negative' : 'positive'}`}>
              {tx.amount < 0 ? '-' : '+'}
              {formatCurrency(Math.abs(tx.amount))}
            </span>
            <span className="status">{tx.status}</span>
            <small>{tx.timestamp ? formatDateTime(tx.timestamp) : '-'}</small>
          </div>
        ))}
        {!filteredTransactions.length && <p className="empty">{d.table.empty}</p>}
      </section>

      <section className="grid split">
        <article className="card approvals">
          <div className="card-header">
            <h2>{d.approvals.title}</h2>
            <span>{d.approvals.suffix.replace('{count}', approvalQueue.length)}</span>
          </div>
          <div className="approval-list">
            {approvalQueue.map((task) => (
              <div className="approval-card" key={task.id}>
                <div>
                  <p className="badge">{task.level}</p>
                  <strong>{task.title}</strong>
                  <small>{task.detail}</small>
                  <small>{d.approvals.submitted.replace('{name}', task.submittedBy)}</small>
                </div>
                <div className="approval-actions">
                  <button className="ghost" type="button">
                    {d.approvals.view}
                  </button>
                  <button className="primary" type="button" onClick={() => handleApprove(task.id)}>
                    {d.approvals.approve}
                  </button>
                </div>
              </div>
            ))}
            {!approvalQueue.length && <p className="empty">{d.approvals.empty}</p>}
          </div>
        </article>

        <article className="card side">
          <div className="module">
            <div className="card-header">
              <h3>{d.payroll.title}</h3>
            </div>
            {payrollRuns.map((run) => (
              <div className="list-row" key={run.id}>
                <div>
                  <strong>{run.cycle}</strong>
                  <small>{run.employees} พนักงาน</small>
                </div>
                <div>
                  <span className={`pill ${run.status === 'รออนุมัติ' ? 'warning' : ''}`}>{run.status}</span>
                  <small>Cut-off {run.cutOff}</small>
                </div>
              </div>
            ))}
            {!payrollRuns.length && <p className="empty">{d.payroll.empty}</p>}
          </div>

          <div className="module">
            <div className="card-header">
              <h3>{d.cheque.title}</h3>
            </div>
            {chequeTasks.map((task) => (
              <div className="list-row" key={task.id}>
                <div>
                  <strong>{task.action}</strong>
                  <small>{task.detail}</small>
                </div>
                <div>
                  <span className={`pill ${task.status === 'ต้องทำทันที' ? 'danger' : ''}`}>{task.status}</span>
                  <small>{task.due}</small>
                </div>
              </div>
            ))}
            {!chequeTasks.length && <p className="empty">{d.cheque.empty}</p>}
          </div>
        </article>
      </section>
    </>
  );
}

export default Dashboard;
