import { useState } from 'react';
import { db } from '../db';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';

export default function ExpenseList({ expenses, members, budget, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' });

  const getMemberName = (id) => members.find(m => m.id === id)?.name || 'Unknown';

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    await db.expenses.delete(confirmDelete);
    setConfirmDelete(null);
    setToast({ open: true, message: 'Expense deleted', type: 'info' });
    onDelete();
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-10 text-center">
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-8 h-8 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm">No expenses recorded yet.</p>
        <p className="text-gray-300 text-xs mt-1">Start by adding an expense from the Add Expense tab.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Expense History</h2>
          <span className="text-xs text-gray-400">{expenses.length} entries</span>
        </div>
        {expenses.map(exp => {
          const extra = Math.max(0, exp.amount - budget);
          const presentCount = exp.presentMemberIds.length;
          const perHead = presentCount > 0 ? extra / presentCount : 0;

          return (
            <div key={exp.id} className="bg-white rounded-xl shadow-sm border border-orange-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-400 font-medium">{formatDate(exp.date)}</div>
                  <div className="mt-1 text-sm">
                    <span className="font-semibold text-gray-800">{getMemberName(exp.paidBy)}</span>
                    <span className="text-gray-500"> paid </span>
                    <span className="font-bold text-gray-900">{exp.amount.toFixed(2)}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    {presentCount} present: {exp.presentMemberIds.map(id => getMemberName(id)).join(', ')}
                  </div>
                </div>
                <div className="text-right">
                  {extra > 0 ? (
                    <div>
                      <span className="inline-block px-2 py-0.5 bg-red-50 text-red-500 rounded text-xs font-medium">
                        +{extra.toFixed(2)} over
                      </span>
                      <div className="text-xs text-gray-400 mt-1">{perHead.toFixed(2)}/person</div>
                    </div>
                  ) : (
                    <span className="inline-block px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs font-medium">
                      Within budget
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => setConfirmDelete(exp.id)}
                  className="text-xs text-red-300 hover:text-red-500 cursor-pointer transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        open={!!confirmDelete}
        title="Delete Expense?"
        message="This will permanently remove this expense entry. This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(null)}
      />

      <Toast {...toast} onClose={() => setToast(prev => ({ ...prev, open: false }))} />
    </>
  );
}
