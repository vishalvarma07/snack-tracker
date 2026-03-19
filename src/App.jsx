import { useState, useEffect } from 'react';
import * as api from './api/sheets';
import Login from './components/Login';
import ManageMembers from './components/ManageMembers';
import AddExpense from './components/AddExpense';
import ExpenseList from './components/ExpenseList';
import MonthlySummary from './components/MonthlySummary';
import ExcelManager from './components/ExcelManager';
import Loader from './components/Loader';

const COMPANY_DAILY_BUDGET = 500;

const TABS = [
  { id: 'add', label: 'Add Expense', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
  { id: 'history', label: 'History', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { id: 'summary', label: 'Summary', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'data', label: 'Data', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
  { id: 'members', label: 'Members', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
];

function App() {
  const [loggedIn, setLoggedIn] = useState(() => sessionStorage.getItem('snack_auth') === 'true');
  const [activeTab, setActiveTab] = useState('add');
  const [members, setMembers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('st_members') || '[]'); } catch { return []; }
  });
  const [expenses, setExpenses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('st_expenses') || '[]'); } catch { return []; }
  });
  const [loading, setLoading] = useState(false);

  const loadData = async ({ silent = false } = {}) => {
    if (!silent) {
      const hasCache = members.length > 0 || expenses.length > 0;
      if (!hasCache) setLoading(true);
    }
    try {
      const m = await api.getMembers();
      const e = await api.getExpenses();
      setMembers(m);
      setExpenses(e);
      localStorage.setItem('st_members', JSON.stringify(m));
      localStorage.setItem('st_expenses', JSON.stringify(e));
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const refreshData = () => loadData({ silent: true });

  useEffect(() => {
    if (loggedIn) loadData();
  }, [loggedIn]);

  const handleLogout = () => {
    sessionStorage.removeItem('snack_auth');
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Snack Tracker
            </h1>
            <p className="text-orange-100 text-sm mt-1">
              Daily budget: <span className="font-semibold text-white">{COMPANY_DAILY_BUDGET}</span> from company
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-10 border-b border-orange-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading && <Loader message="Fetching data..." />}
        {!loading && activeTab === 'add' && (
          <AddExpense
            members={members}
            budget={COMPANY_DAILY_BUDGET}
            onSaved={refreshData}
          />
        )}
        {!loading && activeTab === 'history' && (
          <ExpenseList
            expenses={expenses}
            members={members}
            budget={COMPANY_DAILY_BUDGET}
            onDelete={refreshData}
          />
        )}
        {!loading && activeTab === 'summary' && (
          <MonthlySummary
            expenses={expenses}
            members={members}
            budget={COMPANY_DAILY_BUDGET}
          />
        )}
        {!loading && activeTab === 'data' && (
          <ExcelManager
            expenses={expenses}
            members={members}
            onImport={refreshData}
          />
        )}
        {!loading && activeTab === 'members' && (
          <ManageMembers members={members} onUpdate={refreshData} />
        )}
      </main>
    </div>
  );
}

export default App;
