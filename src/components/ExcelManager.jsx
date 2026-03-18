import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../db';
import Toast from './Toast';
import ConfirmModal from './ConfirmModal';

export default function ExcelManager({ expenses, members, onImport }) {
  const fileRef = useRef();
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const getMemberName = (id) => members.find(m => m.id === id)?.name || 'Unknown';

  const exportToExcel = () => {
    if (expenses.length === 0) {
      setToast({ open: true, message: 'No expenses to export', type: 'error' });
      return;
    }

    const rows = expenses.map(exp => ({
      Date: exp.date,
      'Paid By': getMemberName(exp.paidBy),
      Amount: exp.amount,
      'Present Members': exp.presentMemberIds.map(id => getMemberName(id)).join(', '),
      'Present Count': exp.presentMemberIds.length,
    }));

    const membersRows = members.map(m => ({ Name: m.name }));

    const wb = XLSX.utils.book_new();

    const wsExpenses = XLSX.utils.json_to_sheet(rows);
    wsExpenses['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 40 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');

    const wsMembers = XLSX.utils.json_to_sheet(membersRows);
    wsMembers['!cols'] = [{ wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsMembers, 'Members');

    const monthName = new Date().toLocaleString('en', { month: 'long', year: 'numeric' });
    XLSX.writeFile(wb, `SnackTracker_${monthName.replace(' ', '_')}.xlsx`);
    setToast({ open: true, message: 'Excel file downloaded!', type: 'success' });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array' });

        const expSheet = wb.Sheets['Expenses'];
        const memSheet = wb.Sheets['Members'];

        if (!expSheet || !memSheet) {
          setToast({ open: true, message: 'Invalid file. Must have "Expenses" and "Members" sheets.', type: 'error' });
          return;
        }

        const importedExpenses = XLSX.utils.sheet_to_json(expSheet);
        const importedMembers = XLSX.utils.sheet_to_json(memSheet);

        setPendingData({ expenses: importedExpenses, members: importedMembers });
        setConfirmOpen(true);
      } catch {
        setToast({ open: true, message: 'Failed to read Excel file', type: 'error' });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const doImport = async () => {
    setConfirmOpen(false);
    if (!pendingData) return;

    try {
      // Clear existing data
      await db.members.clear();
      await db.expenses.clear();

      // Import members first
      const memberMap = {};
      for (const m of pendingData.members) {
        const id = await db.members.add({ name: m.Name });
        memberMap[m.Name] = id;
      }

      // Import expenses
      for (const row of pendingData.expenses) {
        const presentNames = row['Present Members'].split(',').map(s => s.trim());
        const presentIds = presentNames.map(n => memberMap[n]).filter(Boolean);
        const payerId = memberMap[row['Paid By']];

        if (payerId && presentIds.length > 0) {
          await db.expenses.add({
            date: row.Date,
            paidBy: payerId,
            amount: Number(row.Amount),
            presentMemberIds: presentIds,
          });
        }
      }

      setToast({ open: true, message: `Imported ${pendingData.expenses.length} expenses!`, type: 'success' });
      setPendingData(null);
      onImport();
    } catch {
      setToast({ open: true, message: 'Import failed. Check file format.', type: 'error' });
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Excel Backup & Restore
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={exportToExcel}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to Excel
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import from Excel
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Export saves all data as .xlsx. Import replaces all current data with the file contents.
        </p>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Import Excel Data?"
        message={`This will replace all existing data with ${pendingData?.expenses?.length || 0} expenses and ${pendingData?.members?.length || 0} members from the file.`}
        confirmLabel="Yes, Import"
        onConfirm={doImport}
        onCancel={() => { setConfirmOpen(false); setPendingData(null); }}
        danger={false}
      />

      <Toast {...toast} onClose={() => setToast(prev => ({ ...prev, open: false }))} />
    </>
  );
}
