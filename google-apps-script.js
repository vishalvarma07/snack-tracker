// ============================================================
// Google Apps Script — deploy this as a Web App
// ============================================================
// 1. Open your Google Sheet → Extensions → Apps Script
// 2. Delete existing code, paste this entire file
// 3. Deploy → New Deployment → Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 4. Copy the deployment URL and paste it in .env as VITE_SHEETS_API_URL
// ============================================================

var SHEET_ID = '1FuMFTjNj4Q2i8UOjfMU8-UudXAXI7YrUI_E_O4hyjy8';

function getSheet(name) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === 'Members') {
      sheet.appendRow(['id', 'name']);
    } else if (name === 'Expenses') {
      sheet.appendRow(['id', 'date', 'paidBy', 'amount', 'presentMemberIds']);
    }
  }
  return sheet;
}

function getNextId(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return 1;
  var maxId = 0;
  for (var i = 1; i < data.length; i++) {
    var id = Number(data[i][0]);
    if (id > maxId) maxId = id;
  }
  return maxId + 1;
}

function sheetToJson(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  return rows;
}

function findRowIndex(sheet, id) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === Number(id)) return i + 1;
  }
  return -1;
}

// ---- Handlers ----

function handleGetMembers() {
  var sheet = getSheet('Members');
  return sheetToJson(sheet).map(function(r) {
    return { id: Number(r.id), name: String(r.name) };
  });
}

function handleGetExpenses() {
  var sheet = getSheet('Expenses');
  return sheetToJson(sheet).map(function(r) {
    return {
      id: Number(r.id),
      date: String(r.date),
      paidBy: Number(r.paidBy),
      amount: Number(r.amount),
      presentMemberIds: String(r.presentMemberIds).split(',').map(Number).filter(function(n) { return !isNaN(n); }),
    };
  });
}

function handleAddMember(payload) {
  var sheet = getSheet('Members');
  var id = getNextId(sheet);
  sheet.appendRow([id, payload.name]);
  return { id: id, name: payload.name };
}

function handleUpdateMember(payload) {
  var sheet = getSheet('Members');
  var rowIdx = findRowIndex(sheet, payload.id);
  if (rowIdx === -1) return null;
  sheet.getRange(rowIdx, 2).setValue(payload.name);
  return { id: Number(payload.id), name: payload.name };
}

function handleDeleteMember(payload) {
  var sheet = getSheet('Members');
  var rowIdx = findRowIndex(sheet, payload.id);
  if (rowIdx === -1) return false;
  sheet.deleteRow(rowIdx);
  return true;
}

function handleAddExpense(payload) {
  var sheet = getSheet('Expenses');
  var id = getNextId(sheet);
  var data = payload.data;
  sheet.appendRow([id, data.date, data.paidBy, data.amount, data.presentMemberIds.join(',')]);
  return { id: id, date: data.date, paidBy: data.paidBy, amount: data.amount, presentMemberIds: data.presentMemberIds };
}

function handleDeleteExpense(payload) {
  var sheet = getSheet('Expenses');
  var rowIdx = findRowIndex(sheet, payload.id);
  if (rowIdx === -1) return false;
  sheet.deleteRow(rowIdx);
  return true;
}

function handleImportData(payload) {
  var mSheet = getSheet('Members');
  var eSheet = getSheet('Expenses');

  if (mSheet.getLastRow() > 1) {
    mSheet.deleteRows(2, mSheet.getLastRow() - 1);
  }
  if (eSheet.getLastRow() > 1) {
    eSheet.deleteRows(2, eSheet.getLastRow() - 1);
  }

  var memberMap = {};
  for (var i = 0; i < payload.members.length; i++) {
    var m = payload.members[i];
    var mid = getNextId(mSheet);
    mSheet.appendRow([mid, m.name]);
    memberMap[m.name] = mid;
  }

  for (var j = 0; j < payload.expenses.length; j++) {
    var exp = payload.expenses[j];
    var eid = getNextId(eSheet);
    var payerId = typeof exp.paidBy === 'string' ? (memberMap[exp.paidBy] || exp.paidBy) : exp.paidBy;
    var presentIds = exp.presentMemberIds.map(function(pm) {
      return typeof pm === 'string' ? (memberMap[pm] || pm) : pm;
    });
    eSheet.appendRow([eid, exp.date, payerId, exp.amount, presentIds.join(',')]);
  }

  return true;
}

// ---- Web App Entry Point (GET only — avoids CORS issues) ----

function doGet(e) {
  var action = e.parameter.action;
  var payload = e.parameter.payload ? JSON.parse(e.parameter.payload) : {};
  var result;

  try {
    switch (action) {
      case 'getMembers':
        result = handleGetMembers();
        break;
      case 'getExpenses':
        result = handleGetExpenses();
        break;
      case 'addMember':
        result = handleAddMember(payload);
        break;
      case 'updateMember':
        result = handleUpdateMember(payload);
        break;
      case 'deleteMember':
        result = handleDeleteMember(payload);
        break;
      case 'addExpense':
        result = handleAddExpense(payload);
        break;
      case 'deleteExpense':
        result = handleDeleteExpense(payload);
        break;
      case 'importData':
        result = handleImportData(payload);
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { error: err.message };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
