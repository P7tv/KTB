import React, { useMemo, useState } from 'react';
import { usePersistentList } from '../hooks/usePersistentList.js';
import { formatCurrency, formatDateTime } from '../utils/formatters.js';

const toNumber = (value) => Number(value || 0);

function Transactions() {
  const [accounts] = usePersistentList('ktb.accounts');
  const [transactions, setTransactions] = usePersistentList('ktb.transactions');
  const [filters, setFilters] = useState({ account: 'all', status: 'all', search: '' });
  const [selectedId, setSelectedId] = useState(null);

  const filteredItems = useMemo(() => {
    return transactions.filter((tx) => {
      const matchAccount = filters.account === 'all' || tx.accountId === filters.account;
      const matchStatus = filters.status === 'all' || (tx.status || '').toLowerCase() === filters.status;
      const matchSearch = [tx.type, tx.counterparty, tx.reference]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(filters.search.toLowerCase()));
      return matchAccount && matchStatus && matchSearch;
    });
  }, [transactions, filters]);

  const totals = useMemo(() => {
    const income = filteredItems.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
    const expense = filteredItems.filter((tx) => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0);
    return { income, expense };
  }, [filteredItems]);

  const selectedTx = filteredItems.find((tx) => tx.id === selectedId) || filteredItems[0];

  const updateTransaction = (id, updater) => {
    setTransactions((prev) => prev.map((tx) => (tx.id === id ? { ...tx, ...updater(tx) } : tx)));
  };

  return (
    <div className="transactions-page">
      <header className="toolbar">
        <div>
          <h1>ธุรกรรมทั้งหมด</h1>
          <p>ดูรายการ รับ/จ่าย ทั้งหมด พร้อมสรุปตามบัญชีและสถานะ</p>
        </div>
      </header>

      <section className="filter-bar card">
        <label>
          <span>บัญชี</span>
          <select value={filters.account} onChange={(event) => setFilters((prev) => ({ ...prev, account: event.target.value }))}>
            <option value="all">ทั้งหมด</option>
            {accounts.map((acc) => (
              <option value={acc.id} key={acc.id}>
                {acc.name || acc.number}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>สถานะ</span>
          <select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
            <option value="all">ทั้งหมด</option>
            {Array.from(new Set(transactions.map((tx) => (tx.status || '').toLowerCase()).filter(Boolean))).map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="search">
          <span>ค้นหา</span>
          <input value={filters.search} onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))} placeholder="ค้นหาด้วยคู่ค้า/Reference" />
        </label>
      </section>

      <section className="grid stats">
        <article>
          <span>รายการทั้งหมด</span>
          <strong>{filteredItems.length}</strong>
          <small>จาก {transactions.length} รายการ</small>
        </article>
        <article>
          <span>เงินเข้า</span>
          <strong>{formatCurrency(totals.income)}</strong>
          <small>เฉพาะรายการที่กรองอยู่</small>
        </article>
        <article>
          <span>เงินออก</span>
          <strong>{formatCurrency(Math.abs(totals.expense))}</strong>
          <small>ค่าใช้จ่าย/จ่ายออก</small>
        </article>
        <article>
          <span>กระทบยอดแล้ว</span>
          <strong>{transactions.filter((tx) => tx.reconciled).length}</strong>
          <small>รวมทุกบัญชี</small>
        </article>
      </section>

      <section className="grid split transactions-layout">
        <article className="card table scrollable">
          <div className="table-head">
            <span>ประเภท</span>
            <span>คู่ค้า</span>
            <span>จำนวนเงิน</span>
            <span>สถานะ</span>
            <span>เวลา</span>
          </div>
          {filteredItems.map((tx) => (
            <button
              type="button"
              className={`table-row selectable ${selectedTx?.id === tx.id ? 'is-active' : ''}`}
              key={tx.id}
              onClick={() => setSelectedId(tx.id)}
            >
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
            </button>
          ))}
          {!filteredItems.length && <p className="empty">ยังไม่มีธุรกรรมที่ตรงกับเงื่อนไข</p>}
        </article>

        <article className="card detail-panel">
          {selectedTx ? (
            <>
              <header>
                <h2>{selectedTx.type}</h2>
                <span className={`pill ${selectedTx.amount < 0 ? 'danger' : 'positive'}`}>{selectedTx.status || 'ไม่ระบุ'}</span>
              </header>
              <dl>
                <div>
                  <dt>คู่ค้า</dt>
                  <dd>{selectedTx.counterparty}</dd>
                </div>
                <div>
                  <dt>จำนวนเงิน</dt>
                  <dd className={`amount ${selectedTx.amount < 0 ? 'negative' : 'positive'}`}>
                    {selectedTx.amount < 0 ? '-' : '+'}
                    {formatCurrency(Math.abs(selectedTx.amount))}
                  </dd>
                </div>
                <div>
                  <dt>บัญชี</dt>
                  <dd>{accounts.find((acc) => acc.id === selectedTx.accountId)?.name || 'ไม่ระบุ'}</dd>
                </div>
                <div>
                  <dt>เวลาบันทึก</dt>
                  <dd>{selectedTx.timestamp ? formatDateTime(selectedTx.timestamp) : '-'}</dd>
                </div>
                <div>
                  <dt>Reference</dt>
                  <dd>{selectedTx.reference || '-'}</dd>
                </div>
              </dl>
              <div className="detail-actions">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedTx.reconciled)}
                    onChange={(event) => updateTransaction(selectedTx.id, () => ({ reconciled: event.target.checked }))}
                  />
                  <span>กระทบยอดแล้ว</span>
                </label>
                <button
                  className="ghost"
                  type="button"
                  onClick={() =>
                    updateTransaction(selectedTx.id, (tx) => ({
                      status: tx.amount < 0 ? 'ชำระเรียบร้อย' : 'รับเงินแล้ว',
                    }))
                  }
                >
                  ตั้งค่าสถานะสำเร็จ
                </button>
              </div>
            </>
          ) : (
            <p className="empty">เลือกธุรกรรมเพื่อดูรายละเอียด</p>
          )}
        </article>
      </section>
    </div>
  );
}

export default Transactions;
