import React, { useMemo, useState } from 'react';
import { usePersistentList } from '../hooks/usePersistentList.js';

function Payroll() {
  const [payrollRuns, setPayrollRuns] = usePersistentList('ktb.payroll');
  const [selectedId, setSelectedId] = useState(null);

  const stats = useMemo(() => {
    const pending = payrollRuns.filter((run) => run.status === 'รออนุมัติ').length;
    const preparing = payrollRuns.filter((run) => run.status !== 'รออนุมัติ').length;
    const employees = payrollRuns.reduce((sum, run) => sum + Number(run.employees || 0), 0);
    return { pending, preparing, employees };
  }, [payrollRuns]);

  const selectedRun = payrollRuns.find((run) => run.id === selectedId) || payrollRuns[0];

  const updateRun = (id, updater) => {
    setPayrollRuns((prev) => prev.map((run) => (run.id === id ? { ...run, ...updater(run) } : run)));
  };

  return (
    <div className="payroll-page">
      <header className="toolbar">
        <div>
          <h1>รอบจ่ายเงินเดือน</h1>
          <p>ติดตามสถานะการจ่ายเงินเดือนและอนุมัติรอบที่ค้างอยู่</p>
        </div>
      </header>

      <section className="grid stats">
        <article>
          <span>รอบทั้งหมด</span>
          <strong>{payrollRuns.length}</strong>
        </article>
        <article>
          <span>รออนุมัติ</span>
          <strong>{stats.pending}</strong>
        </article>
        <article>
          <span>กำลังเตรียม</span>
          <strong>{stats.preparing}</strong>
        </article>
        <article>
          <span>พนักงานรวม</span>
          <strong>{stats.employees}</strong>
        </article>
      </section>

      <section className="grid split payroll-layout">
        <article className="card table scrollable">
          <div className="table-head">
            <span>รอบ</span>
            <span>พนักงาน</span>
            <span>สถานะ</span>
            <span>Cut-off</span>
          </div>
          {payrollRuns.map((run) => (
            <button
              type="button"
              className={`table-row selectable ${selectedRun?.id === run.id ? 'is-active' : ''}`}
              key={run.id}
              onClick={() => setSelectedId(run.id)}
            >
              <div>
                <strong>{run.cycle}</strong>
                <small>{run.id}</small>
              </div>
              <span>{run.employees} คน</span>
              <span className={`pill ${run.status === 'รออนุมัติ' ? 'warning' : ''}`}>{run.status}</span>
              <small>{run.cutOff}</small>
            </button>
          ))}
          {!payrollRuns.length && <p className="empty">ยังไม่มีรอบจ่ายเงินเดือน - เพิ่มจาก Data Entry</p>}
        </article>

        <article className="card detail-panel">
          {selectedRun ? (
            <>
              <header>
                <h2>{selectedRun.cycle}</h2>
                <span className={`pill ${selectedRun.status === 'รออนุมัติ' ? 'warning' : ''}`}>{selectedRun.status}</span>
              </header>
              <dl>
                <div>
                  <dt>จำนวนพนักงาน</dt>
                  <dd>{selectedRun.employees} คน</dd>
                </div>
                <div>
                  <dt>Cut-off</dt>
                  <dd>{selectedRun.cutOff}</dd>
                </div>
              </dl>
              <div className="detail-actions">
                <button
                  className="primary"
                  type="button"
                  onClick={() =>
                    updateRun(selectedRun.id, () => ({
                      status: 'รอจ่ายจริง',
                    }))
                  }
                >
                  ยืนยันรอบนี้
                </button>
                <button
                  className="ghost"
                  type="button"
                  onClick={() =>
                    updateRun(selectedRun.id, (run) => ({
                      status: run.status === 'รออนุมัติ' ? 'ยกเลิก' : 'รออนุมัติ',
                    }))
                  }
                >
                  สลับสถานะ
                </button>
              </div>
            </>
          ) : (
            <p className="empty">เลือก Payroll เพื่อดูรายละเอียด</p>
          )}
        </article>
      </section>
    </div>
  );
}

export default Payroll;
