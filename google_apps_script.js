/**
 * =========================================================================
 * EXPENSEFLOW - GOOGLE APPS SCRIPT 2-WAY SYNC WEBHOOK
 * =========================================================================
 *
 * HOW TO INSTALL IN GOOGLE SHEETS:
 * 1. Open your Google Sheet (e.g. Company_Expense_Master_Template_MonthWise).
 * 2. Click "Extensions" > "Apps Script".
 * 3. Delete any default code in Code.gs, paste this entire file, and click "Save" (disk icon).
 * 4. Click "Deploy" > "New deployment".
 * 5. Select type: "Web app".
 * 6. Set Description: "ExpenseFlow Sync Webhook".
 * 7. Set "Execute as": "Me" (your Google account).
 * 8. Set "Who has access": "Anyone" (allows website to write and read from any PC).
 * 9. Click "Deploy", approve permissions, and copy the Web App URL!
 * 10. Paste the Web App URL into the ExpenseFlow website under "Excel & Sheet Sync".
 * =========================================================================
 */

const HEADERS = [
  'Date',
  'Day',
  'Office / Branch',
  'Type',
  'Category / Source',
  'Item / Expense Title',
  'Description / Particulars',
  'Vendor / Payer',
  'Payment Mode',
  'Inflow (+) (INR)',
  'Outflow (-) (INR)',
  'Running Balance (INR)',
  'Status',
  'Reference / Notes'
];

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

function getMonthSheetName(isoDateStr) {
  // isoDateStr = "YYYY-MM-DD"
  const parts = isoDateStr.split('-');
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthName = MONTH_NAMES[monthIdx] || 'Nov';
  return `${monthName}-${year}`;
}

function getDayOfWeek(isoDateStr) {
  const d = new Date(isoDateStr + 'T00:00:00');
  return DAY_NAMES[d.getDay()] || '';
}

function getOrCreateMonthSheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(HEADERS);
    // Format header row: bold, background color, frozen top row
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#0052ff');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);

    // Auto-fit column widths
    for (let c = 1; c <= HEADERS.length; c++) {
      sheet.setColumnWidth(c, 140);
    }
    sheet.setColumnWidth(6, 220); // Title
    sheet.setColumnWidth(7, 240); // Description
  }
  return sheet;
}

/**
 * Handles GET requests: Reads all transactions across all month sheets
 * Called automatically by the website on startup from any PC!
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    const allRecords = [];

    sheets.forEach(sheet => {
      const name = sheet.getName();
      // Skip non-month sheets like Summary or Template
      if (name === 'Summary' || name === 'Month_Template' || name.toLowerCase().includes('template')) {
        return;
      }

      const values = sheet.getDataRange().getValues();
      if (!values || values.length <= 1) return;

      // Dedicated handler for Water Tracker tab (gid: 1279840244)
      if (name.toLowerCase().includes('water')) {
        const pricePerJug = 30;
        for (let r = 1; r < values.length; r++) {
          const row = values[r];
          if (!row[0] || String(row[0]).toLowerCase().includes('total')) continue;
          let dateStr = row[0];
          if (dateStr instanceof Date) {
            const y = dateStr.getFullYear();
            const m = String(dateStr.getMonth() + 1).padStart(2, '0');
            const d = String(dateStr.getDate()).padStart(2, '0');
            dateStr = `${y}-${m}-${d}`;
          }
          const count = Number(row[2]) || 0;
          if (count > 0) {
            allRecords.push({
              date: String(dateStr),
              day: String(row[1] || ''),
              officeName: 'Elegance Office',
              type: 'Expense',
              categoryOrSource: 'Drinking Water Supply',
              title: 'Drinking Water (' + count + (count === 1 ? ' Jug' : ' Jugs') + ')',
              description: 'Daily drinking water supply for Elegance Office (' + String(row[1] || 'Daily') + ')',
              vendorOrPayer: 'Drinking Water Supply',
              paymentMode: 'Cash',
              inflow: 0,
              outflow: count * pricePerJug,
              runningBalance: 0,
              status: 'Completed',
              notes: 'Water jug delivery',
              sheetName: name
            });
          }
        }
        return;
      }

      // First row is headers
      for (let r = 1; r < values.length; r++) {
        const row = values[r];
        if (!row[0] || String(row[0]).toLowerCase() === 'totals') continue;

        let dateStr = row[0];
        if (dateStr instanceof Date) {
          const y = dateStr.getFullYear();
          const m = String(dateStr.getMonth() + 1).padStart(2, '0');
          const d = String(dateStr.getDate()).padStart(2, '0');
          dateStr = `${y}-${m}-${d}`;
        }

        allRecords.push({
          date: String(dateStr),
          day: String(row[1] || ''),
          officeName: String(row[2] || 'Elegance Office'),
          type: String(row[3] || 'Expense'),
          categoryOrSource: String(row[4] || ''),
          title: String(row[5] || ''),
          description: String(row[6] || ''),
          vendorOrPayer: String(row[7] || ''),
          paymentMode: String(row[8] || 'Cash'),
          inflow: Number(row[9]) || 0,
          outflow: Number(row[10]) || 0,
          runningBalance: Number(row[11]) || 0,
          status: String(row[12] || 'Completed'),
          notes: String(row[13] || ''),
          sheetName: name
        });
      }
    });

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      totalRecords: allRecords.length,
      records: allRecords
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles POST requests: Appends or updates records from any PC website!
 */
function doPost(e) {
  try {
    const rawData = e.postData.contents;
    const body = JSON.parse(rawData);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const action = body.action || 'addRecord';
    const rec = body.record || body;

    const isoDate = rec.date || rec.expenseDate || rec.transactionDate;
    if (!isoDate) {
      throw new Error("Missing date in record payload");
    }

    const sheetName = getMonthSheetName(isoDate);
    const sheet = getOrCreateMonthSheet(ss, sheetName);

    const day = rec.day || getDayOfWeek(isoDate);
    const office = rec.officeName || 'Elegance Office';
    const type = rec.type || (rec.inflow > 0 ? 'Fund Inflow' : 'Expense');
    const category = rec.categoryName || rec.category || (type === 'Fund Inflow' ? 'Company Fund / Deposit' : 'General');
    const title = rec.expenseTitle || rec.title || rec.description || 'Office Record';
    const description = rec.description || '';
    const vendorOrPayer = rec.vendor || rec.receivedFrom || rec.vendorOrPayer || 'Local Vendor';
    const paymentMode = rec.paymentMode || 'Cash';
    const inflow = Number(rec.inflow || (type === 'Fund Inflow' ? rec.amount : 0)) || 0;
    const outflow = Number(rec.outflow || (type === 'Expense' ? rec.amount : 0)) || 0;
    const status = rec.status || (rec.isVoid ? 'Void' : 'Completed');
    const notes = rec.notes || rec.referenceNumber || rec.voucherNo || '';

    // Append row
    sheet.appendRow([
      isoDate,
      day,
      office,
      type,
      category,
      title,
      description,
      vendorOrPayer,
      paymentMode,
      inflow > 0 ? inflow : '',
      outflow > 0 ? outflow : '',
      '', // Running Balance formula or auto
      status,
      notes
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: `Record successfully added to Google Sheet tab [${sheetName}]`,
      sheet: sheetName,
      date: isoDate
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
