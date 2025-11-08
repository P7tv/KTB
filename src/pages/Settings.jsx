import React from 'react';
import { usePersistentState } from '../hooks/usePersistentState.js';

const defaultSettings = {
  notifications: true,
  autoApprovePayroll: false,
  language: 'th',
  theme: 'light',
  email: '',
  aiLanguage: 'th',
};

function Settings() {
  const [settings, setSettings] = usePersistentState('ktb.settings', defaultSettings);

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    setSettings((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const clearAllData = () => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('ktb.'))
      .forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  };

  return (
    <div className="settings-page">
      <header className="toolbar">
        <div>
          <h1>การตั้งค่า</h1>
          <p>ปรับค่าการแจ้งเตือน การอนุมัติอัตโนมัติ และภาษาอินเทอร์เฟซ</p>
        </div>
      </header>

      <section className="card settings-section">
        <h2>การแจ้งเตือน</h2>
        <label className="setting-row">
          <div>
            <strong>รับการแจ้งเตือนผ่านอีเมล</strong>
            <small>ระบบจะแจ้งเตือนเมื่อมีงานรออนุมัติหรือเงินเข้าออกสำคัญ</small>
          </div>
          <input type="checkbox" name="notifications" checked={settings.notifications} onChange={handleChange} />
        </label>
        <label className="setting-row">
          <div>
            <strong>อีเมลสำหรับแจ้งเตือน</strong>
            <small>ปล่อยว่างหากไม่ต้องการรับอีเมล</small>
          </div>
          <input type="email" name="email" value={settings.email} onChange={handleChange} placeholder="you@business.com" />
        </label>
      </section>

      <section className="card settings-section">
        <h2>Workflow</h2>
        <label className="setting-row">
          <div>
            <strong>อนุมัติ Payroll อัตโนมัติเมื่อครบเงื่อนไข</strong>
            <small>หากเปิดใช้งานจะอนุมัติรอบที่ผู้อนุมัติครบตามลำดับ</small>
          </div>
          <input type="checkbox" name="autoApprovePayroll" checked={settings.autoApprovePayroll} onChange={handleChange} />
        </label>
      </section>

      <section className="card settings-section">
        <h2>รูปแบบการใช้งาน</h2>
        <label className="setting-row">
          <div>
            <strong>ภาษา</strong>
          </div>
          <select name="language" value={settings.language} onChange={handleChange}>
            <option value="th">ไทย</option>
            <option value="en">English</option>
          </select>
        </label>
        <label className="setting-row">
          <div>
            <strong>ธีม</strong>
          </div>
          <select name="theme" value={settings.theme} onChange={handleChange}>
            <option value="light">Light</option>
            <option value="dark">Dark (beta)</option>
          </select>
        </label>
        <label className="setting-row">
          <div>
            <strong>ภาษา AI Assistant</strong>
            <small>ใช้กำหนดภาษาที่ Gemini ตอบกลับ</small>
          </div>
          <select name="aiLanguage" value={settings.aiLanguage} onChange={handleChange}>
            <option value="th">ไทย</option>
            <option value="en">English</option>
          </select>
        </label>
      </section>

      <section className="card settings-section">
        <h2>ข้อมูลและความปลอดภัย</h2>
        <label className="setting-row">
          <div>
            <strong>ล้างข้อมูลทั้งหมด</strong>
            <small>ลบข้อมูลที่เก็บไว้ในเครื่อง (accounts, transactions, AI, ฯลฯ)</small>
          </div>
          <button className="ghost" type="button" onClick={clearAllData}>
            ล้างข้อมูล local
          </button>
        </label>
      </section>
    </div>
  );
}

export default Settings;
