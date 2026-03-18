import { useState } from 'react';
import * as api from '../api/sheets';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';

export default function ManageMembers({ members, onUpdate }) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' });

  const addMember = async () => {
    const name = newName.trim();
    if (!name) return;
    await api.addMember(name);
    setNewName('');
    setToast({ open: true, message: `${name} added to team!`, type: 'success' });
    onUpdate();
  };

  const startEdit = (member) => {
    setEditingId(member.id);
    setEditName(member.name);
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    await api.updateMember(editingId, editName.trim());
    setEditingId(null);
    setEditName('');
    setToast({ open: true, message: 'Member updated!', type: 'success' });
    onUpdate();
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    await api.deleteMember(confirmDelete.id);
    setConfirmDelete(null);
    setToast({ open: true, message: `${confirmDelete.name} removed from team`, type: 'info' });
    onUpdate();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Team Members</h2>

        <div className="space-y-3">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              {editingId === m.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveEdit()}
                    className="flex-1 px-3 py-1.5 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    autoFocus
                  />
                  <button onClick={saveEdit} className="text-sm px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 cursor-pointer">
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-sm px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 cursor-pointer">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 bg-orange-400 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-gray-700 font-medium">{m.name}</span>
                  <button onClick={() => startEdit(m)} className="text-sm text-orange-500 hover:text-orange-700 cursor-pointer">
                    Edit
                  </button>
                  <button onClick={() => setConfirmDelete(m)} className="text-sm text-red-400 hover:text-red-600 cursor-pointer">
                    Delete
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addMember()}
            placeholder="New member name"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            onClick={addMember}
            className="px-5 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors cursor-pointer"
          >
            Add Member
          </button>
        </div>
      </div>

      <ConfirmModal
        open={!!confirmDelete}
        title="Delete Member?"
        message={`Remove "${confirmDelete?.name}" from the team? Their expense history will remain.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(null)}
      />

      <Toast {...toast} onClose={() => setToast(prev => ({ ...prev, open: false }))} />
    </div>
  );
}
