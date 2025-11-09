import React from 'react';
import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import OwnerConsole from './pages/OwnerConsole.jsx';
import Transactions from './pages/Transactions.jsx';
import Payroll from './pages/Payroll.jsx';
import Cheque from './pages/Cheque.jsx';
import Investments from './pages/Investments.jsx';
import Advisors from './pages/Advisors.jsx';
import DataEntry from './pages/DataEntry.jsx';
import TaxPlanner from './pages/TaxPlanner.jsx';
import Settings from './pages/Settings.jsx';
import AiAssistantWidget from './components/AiAssistantWidget.jsx';
import { usePersistentState } from './hooks/usePersistentState.js';
import { getMessages } from './utils/i18n.js';
import { demoData, demoSeed } from './utils/demoData.js';

const DEMO_FLAG_KEY = 'ktb.demo.initialized';
let demoChecked = false;

function ensureDemoData() {
  if (demoChecked || typeof window === 'undefined') return;
  demoChecked = true;
  try {
    const alreadyInitialized = window.localStorage.getItem(DEMO_FLAG_KEY) === 'true';
    const hasAnyDataset = Object.keys(demoData).some((key) => !!window.localStorage.getItem(key));
    if (!alreadyInitialized || !hasAnyDataset) {
      demoSeed();
      window.localStorage.setItem(DEMO_FLAG_KEY, 'true');
    }
  } catch (error) {
    console.error('Auto demo seeding failed', error);
  }
}

function App() {
  ensureDemoData();
  const [settings] = usePersistentState('ktb.settings', {});
  const t = getMessages(settings.language);

  const navItems = [
    { label: t.menu.overview, to: '/' },
    { label: t.menu.owner, to: '/owner' },
    { label: t.menu.transactions, to: '/transactions' },
    { label: t.menu.payroll, to: '/payroll' },
    { label: t.menu.cheque, to: '/cheque' },
    { label: t.menu.invest, to: '/invest' },
    { label: t.menu.advisors, to: '/advisors' },
    { label: t.menu.tax, to: '/tax' },
    { label: t.menu.dataEntry, to: '/data' },
    { label: t.menu.settings, to: '/settings' },
  ];
  return (
    <BrowserRouter>
      <div className="workspace">
        <aside className="nav-shell">
          <div className="brand">
            <span className="dot" />
            <div>
              <strong>Krungthai BUSINESS</strong>
              <small>Cash Management</small>
            </div>
          </div>
          <nav>
            <p>เมนูหลัก</p>
            <ul>
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="profile">
            <strong>ณัฐวุฒิ อ.</strong>
            <span>Owner & CFO</span>
          </div>
        </aside>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/owner" element={<OwnerConsole />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/cheque" element={<Cheque />} />
            <Route path="/invest" element={<Investments />} />
            <Route path="/advisors" element={<Advisors />} />
            <Route path="/tax" element={<TaxPlanner />} />
            <Route path="/data" element={<DataEntry />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <AiAssistantWidget />
    </BrowserRouter>
  );
}

export default App;
