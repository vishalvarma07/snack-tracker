import { useState } from 'react';
import * as api from '../api/sheets';
import SuccessModal from './SuccessModal';

export default function AddExpense({ members, budget, onSaved }) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [paidBy, setPaidBy] = useState('');
  const [amount, setAmount] = useState('');
  const [presentIds, setPresentIds] = useState(members.map(m => m.id));
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Keep presentIds in sync when members change
  if (members.length > 0 && presentIds.length === 0) {
    setPresentIds(members.map(m => m.id));
  }

  const togglePresent = (id) => {
    setPresentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const extraAmount = Math.max(0, Number(amount) - budget);
  const presentCount = presentIds.length;
  const perHeadExtra = presentCount > 0 ? extraAmount / presentCount : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paidBy || !amount || presentCount === 0) return;

    setSaving(true);
    await api.addExpense({
      date,
      paidBy: Number(paidBy),
      amount: Number(amount),
      presentMemberIds: presentIds,
    });
    setSaving(false);
    setAmount('');
    setPaidBy('');
    setPresentIds(members.map(m => m.id));
    setSuccess(true);
    onSaved();
  };

  const getMemberName = (id) => members.find(m => m.id === id)?.name || 'Unknown';

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Today's Expense</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Total Amount Spent</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 650"
                min="1"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">Paid By</label>
            <select
              value={paidBy}
              onChange={e => setPaidBy(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              required
            >
              <option value="">Select who paid</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Who was present? ({presentCount} of {members.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => togglePresent(m.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                    presentIds.includes(m.id)
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-400 line-through'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview */}
        {amount && Number(amount) > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Breakdown Preview</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Total spent</span>
                <span className="font-semibold text-gray-800">{Number(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Company covers</span>
                <span className="font-semibold text-green-600">{budget.toFixed(2)}</span>
              </div>
              {extraAmount > 0 && (
                <>
                  <div className="border-t border-dashed border-gray-200 my-1"></div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Extra amount</span>
                    <span className="font-semibold text-red-500">{extraAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Split among {presentCount} people</span>
                    <span className="font-semibold text-red-500">{perHeadExtra.toFixed(2)} each</span>
                  </div>
                  {paidBy && (
                    <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-amber-800 text-xs">
                        Each present member (except {getMemberName(Number(paidBy))}) owes <strong>{perHeadExtra.toFixed(2)}</strong> to {getMemberName(Number(paidBy))}
                      </p>
                    </div>
                  )}
                </>
              )}
              {extraAmount === 0 && (
                <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-green-700 text-xs">Within budget! No extra split needed.</p>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !paidBy || !amount || presentCount === 0}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save Expense'}
        </button>
      </form>

      <SuccessModal open={success} title="Saved!" message="Expense recorded successfully." onClose={() => setSuccess(false)} />
    </>
  );
}
