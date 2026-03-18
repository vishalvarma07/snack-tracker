import Dexie from 'dexie';

export const db = new Dexie('SnackTrackerDB');

db.version(1).stores({
  members: '++id, name',
  expenses: '++id, date, paidBy, amount',
});

// Seed default members if empty
export async function seedMembers(names) {
  const count = await db.members.count();
  if (count === 0) {
    await db.members.bulkAdd(names.map(name => ({ name })));
  }
}
