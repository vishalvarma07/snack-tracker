import { useState, useMemo } from 'react';

export default function MonthlySummary({ expenses, members, budget }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const getMemberName = (id) => members.find(m => m.id === id)?.name || 'Unknown';

  const monthlyExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const d = new Date(exp.date + 'T00:00:00');
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [expenses, month, year]);

  const summary = useMemo(() => {
    // For each member, track:
    // 1. companyReimbursement: total company should pay them (500 for each day they paid)
    // 2. totalPaid: total amount they actually spent
    // 3. balances: net balance with each other member (positive = they are owed, negative = they owe)

    const memberData = {};
    members.forEach(m => {
      memberData[m.id] = {
        name: m.name,
        companyReimbursement: 0,
        totalPaid: 0,
        daysAsPayer: 0,
        daysPresent: 0,
        owes: {},    // who this member owes and how much
        isOwed: {},  // who owes this member and how much
      };
      members.forEach(other => {
        if (other.id !== m.id) {
          memberData[m.id].owes[other.id] = 0;
          memberData[m.id].isOwed[other.id] = 0;
        }
      });
    });

    monthlyExpenses.forEach(exp => {
      const payerId = exp.paidBy;
      if (!memberData[payerId]) return;

      // Company reimburses the payer
      memberData[payerId].companyReimbursement += budget;
      memberData[payerId].totalPaid += exp.amount;
      memberData[payerId].daysAsPayer += 1;

      // Track presence
      exp.presentMemberIds.forEach(id => {
        if (memberData[id]) {
          memberData[id].daysPresent += 1;
        }
      });

      // Calculate extra split
      const extra = Math.max(0, exp.amount - budget);
      if (extra > 0) {
        const presentCount = exp.presentMemberIds.length;
        const perHead = extra / presentCount;

        // Each present member (except payer) owes the payer their share
        exp.presentMemberIds.forEach(memberId => {
          if (memberId !== payerId && memberData[memberId]) {
            memberData[memberId].owes[payerId] = (memberData[memberId].owes[payerId] || 0) + perHead;
            memberData[payerId].isOwed[memberId] = (memberData[payerId].isOwed[memberId] || 0) + perHead;
          }
        });
      }
    });

    return memberData;
  }, [monthlyExpenses, members, budget]);

  // Calculate simplified settlements (minimize transactions)
  const settlements = useMemo(() => {
    // Calculate net balance for each member
    const netBalance = {};
    members.forEach(m => {
      const data = summary[m.id];
      if (!data) return;
      let totalOwed = 0;
      let totalOwes = 0;
      Object.values(data.isOwed).forEach(v => totalOwed += v);
      Object.values(data.owes).forEach(v => totalOwes += v);
      netBalance[m.id] = totalOwed - totalOwes;
    });

    // Separate into creditors and debtors
    const creditors = [];
    const debtors = [];
    members.forEach(m => {
      const bal = netBalance[m.id] || 0;
      if (bal > 0.01) creditors.push({ id: m.id, amount: bal });
      else if (bal < -0.01) debtors.push({ id: m.id, amount: -bal });
    });

    // Sort descending
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    // Greedy settlement
    const txns = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const pay = Math.min(debtors[i].amount, creditors[j].amount);
      if (pay > 0.01) {
        txns.push({
          from: debtors[i].id,
          to: creditors[j].id,
          amount: Math.round(pay * 100) / 100,
        });
      }
      debtors[i].amount -= pay;
      creditors[j].amount -= pay;
      if (debtors[i].amount < 0.01) i++;
      if (creditors[j].amount < 0.01) j++;
    }

    return txns;
  }, [summary, members]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const totalCompanySpend = Object.values(summary).reduce((s, d) => s + d.companyReimbursement, 0);
  const totalActualSpend = Object.values(summary).reduce((s, d) => s + d.totalPaid, 0);

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-4">
        <div className="flex gap-3 items-center">
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            {months.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{monthlyExpenses.length}</div>
          <div className="text-xs text-gray-400 mt-1">Days Recorded</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{totalCompanySpend.toFixed(0)}</div>
          <div className="text-xs text-gray-400 mt-1">Company Budget</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{totalActualSpend.toFixed(0)}</div>
          <div className="text-xs text-gray-400 mt-1">Actual Spend</div>
        </div>
      </div>

      {monthlyExpenses.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-10 text-center">
          <p className="text-gray-400 text-sm">No expenses for {months[month]} {year}.</p>
        </div>
      )}

      {monthlyExpenses.length > 0 && (
        <>
          {/* Company Reimbursement */}
          <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Company Should Reimburse
            </h3>
            <div className="space-y-3">
              {members.map(m => {
                const data = summary[m.id];
                if (!data || data.daysAsPayer === 0) return null;
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-700">{m.name}</span>
                      <span className="text-xs text-gray-400 ml-2">
                        ({data.daysAsPayer} day{data.daysAsPayer > 1 ? 's' : ''} as payer, paid {data.totalPaid.toFixed(2)} total)
                      </span>
                    </div>
                    <span className="font-bold text-green-600 text-lg">
                      {data.companyReimbursement.toFixed(2)}
                    </span>
                  </div>
                );
              })}
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="font-semibold text-gray-700">Total Company Reimbursement</span>
                <span className="font-bold text-green-600 text-lg">{totalCompanySpend.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Per Member Details */}
          <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Member-wise Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Member</th>
                    <th className="text-center py-2 px-2 text-gray-500 font-medium">Days Present</th>
                    <th className="text-center py-2 px-2 text-gray-500 font-medium">Days Paid</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">Total Paid</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">Company Gives</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">Owes Others</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">Owed by Others</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => {
                    const data = summary[m.id];
                    if (!data) return null;
                    const totalOwes = Object.values(data.owes).reduce((s, v) => s + v, 0);
                    const totalIsOwed = Object.values(data.isOwed).reduce((s, v) => s + v, 0);
                    return (
                      <tr key={m.id} className="border-b border-gray-100 hover:bg-orange-25">
                        <td className="py-2.5 px-2 font-medium text-gray-700">{m.name}</td>
                        <td className="py-2.5 px-2 text-center text-gray-600">{data.daysPresent}</td>
                        <td className="py-2.5 px-2 text-center text-gray-600">{data.daysAsPayer}</td>
                        <td className="py-2.5 px-2 text-right text-gray-800 font-semibold">{data.totalPaid.toFixed(2)}</td>
                        <td className="py-2.5 px-2 text-right text-green-600 font-semibold">{data.companyReimbursement.toFixed(2)}</td>
                        <td className="py-2.5 px-2 text-right text-red-500">{totalOwes > 0 ? totalOwes.toFixed(2) : '-'}</td>
                        <td className="py-2.5 px-2 text-right text-green-600">{totalIsOwed > 0 ? totalIsOwed.toFixed(2) : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Settlements */}
          <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Settlements (Who Pays Whom)
            </h3>
            {settlements.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No settlements needed. Everyone is even!</p>
            ) : (
              <div className="space-y-3">
                {settlements.map((txn, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-green-50 rounded-lg border border-gray-100">
                    <div className="w-8 h-8 bg-red-400 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {getMemberName(txn.from).charAt(0)}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-700">{getMemberName(txn.from)}</span>
                      <span className="text-gray-400 mx-2">pays</span>
                      <span className="font-medium text-gray-700">{getMemberName(txn.to)}</span>
                    </div>
                    <span className="font-bold text-lg text-gray-800">{txn.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Owes Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Detailed Split Breakdown
            </h3>
            <div className="space-y-4">
              {members.map(m => {
                const data = summary[m.id];
                if (!data) return null;
                const owesEntries = Object.entries(data.owes).filter(([, v]) => v > 0.01);
                const owedEntries = Object.entries(data.isOwed).filter(([, v]) => v > 0.01);
                if (owesEntries.length === 0 && owedEntries.length === 0) return null;

                return (
                  <div key={m.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-700 mb-2">{m.name}</div>
                    {owesEntries.length > 0 && (
                      <div className="ml-4 space-y-1">
                        {owesEntries.map(([toId, amt]) => (
                          <div key={toId} className="text-xs text-red-500">
                            Owes {getMemberName(Number(toId))}: {amt.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    )}
                    {owedEntries.length > 0 && (
                      <div className="ml-4 space-y-1">
                        {owedEntries.map(([fromId, amt]) => (
                          <div key={fromId} className="text-xs text-green-600">
                            Owed by {getMemberName(Number(fromId))}: {amt.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
