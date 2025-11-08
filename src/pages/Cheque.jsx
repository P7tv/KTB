import React, { useMemo } from 'react';
import { usePersistentList } from '../hooks/usePersistentList.js';

function Cheque() {
  const [chequeTasks, setChequeTasks] = usePersistentList('ktb.cheques');

  const groups = useMemo(() => {
    const map = new Map();
    chequeTasks.forEach((task) => {
      if (!map.has(task.status)) map.set(task.status, []);
      map.get(task.status).push(task);
    });
    return Array.from(map.entries());
  }, [chequeTasks]);

  const advanceTask = (id) => {
    setChequeTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const nextStatus = task.status === 'ต้องทำทันที' ? 'ดำเนินการแล้ว' : 'เก็บถาวร';
        return { ...task, status: nextStatus };
      })
    );
  };

  return (
    <div className="cheque-page">
      <header className="toolbar">
        <div>
          <h1>ศูนย์จัดการเช็ค</h1>
          <p>ติดตามงานออกเช็ค อายัด และปลดอายัดที่กำลังดำเนินการ</p>
        </div>
      </header>

      {chequeTasks.length ? (
        <section className="kanban">
          {groups.map(([status, items]) => (
            <article className="kanban-column card" key={status}>
              <header>
                <h3>{status}</h3>
                <span>{items.length} งาน</span>
              </header>
              <div className="kanban-list">
                {items.map((task) => (
                  <div className="kanban-card" key={task.id}>
                    <strong>{task.action}</strong>
                    <p>{task.detail}</p>
                    <small>{task.due}</small>
                    <button className="ghost small" type="button" onClick={() => advanceTask(task.id)}>
                      ขยับสถานะ
                    </button>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <p className="empty">ยังไม่มีงานเช็ค - เพิ่มจากหน้า Data Entry</p>
      )}
    </div>
  );
}

export default Cheque;
