const API_URL = import.meta.env.VITE_SHEETS_API_URL;

async function call(action, payload = {}) {
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  url.searchParams.set('payload', JSON.stringify(payload));
  const res = await fetch(url.toString());
  return res.json();
}

export async function getMembers() {
  return call('getMembers');
}

export async function getExpenses() {
  const expenses = await call('getExpenses');
  return expenses.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

export async function addMember(name) {
  return call('addMember', { name });
}

export async function updateMember(id, name) {
  return call('updateMember', { id, name });
}

export async function deleteMember(id) {
  return call('deleteMember', { id });
}

export async function addExpense(data) {
  return call('addExpense', { data });
}

export async function deleteExpense(id) {
  return call('deleteExpense', { id });
}

export async function importData(members, expenses) {
  return call('importData', { members, expenses });
}
