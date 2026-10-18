/**
 * ===================================================================
 * BUDGETKU - GOOGLE APPS SCRIPT BACKEND API
 * ===================================================================
 * Database: Google Spreadsheet
 * Sheets: Transactions, Wallets, Categories, Budgets, RecurringBills
 * ===================================================================
 */

// 1. SETUP OTOMATIS SPREADSHEET
// Jalankan fungsi ini sekali di Apps Script editor untuk membuat semua sheet & data awal otomatis
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Sheet Transactions
  let sTransactions = ss.getSheetByName("Transactions");
  if (!sTransactions) {
    sTransactions = ss.insertSheet("Transactions");
    sTransactions.appendRow([
      "id", "date", "type", "amount", "category", "macro_type", 
      "wallet_from", "wallet_to", "notes", "user_id", "created_at"
    ]);
    sTransactions.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#3B82F6").setFontColor("#FFFFFF");
    sTransactions.setFrozenRows(1);
  }

  // 2. Sheet Wallets
  let sWallets = ss.getSheetByName("Wallets");
  if (!sWallets) {
    sWallets = ss.insertSheet("Wallets");
    sWallets.appendRow(["wallet_id", "wallet_name", "initial_balance", "icon", "color"]);
    sWallets.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#10B981").setFontColor("#FFFFFF");
    sWallets.setFrozenRows(1);
    
    // Data default dompet
    sWallets.appendRow(["W-01", "Tunai", 500000, "💵", "#10B981"]);
    sWallets.appendRow(["W-02", "BCA", 2500000, "🏦", "#3B82F6"]);
    sWallets.appendRow(["W-03", "GoPay", 150000, "📱", "#06B6D4"]);
    sWallets.appendRow(["W-04", "ShopeePay", 100000, "🛍️", "#F97316"]);
  }

  // 3. Sheet Categories
  let sCategories = ss.getSheetByName("Categories");
  if (!sCategories) {
    sCategories = ss.insertSheet("Categories");
    sCategories.appendRow(["category_id", "category_name", "type", "macro_group", "icon"]);
    sCategories.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#8B5CF6").setFontColor("#FFFFFF");
    sCategories.setFrozenRows(1);

    // Kategori default
    const defaultCats = [
      ["CAT-01", "Makanan & Minuman", "Expense", "Needs", "🍔"],
      ["CAT-02", "Transportasi & Bensin", "Expense", "Needs", "🛵"],
      ["CAT-03", "Belanja Bulanan", "Expense", "Needs", "🛒"],
      ["CAT-04", "Tagihan & Utilitas", "Expense", "Needs", "⚡"],
      ["CAT-05", "Hiburan & Jajan", "Expense", "Wants", "☕"],
      ["CAT-06", "Hobi & Belanja Online", "Expense", "Wants", "🛍️"],
      ["CAT-07", "Kesehatan & Obat", "Expense", "Needs", "💊"],
      ["CAT-08", "Tabungan & Investasi", "Expense", "Savings", "📈"],
      ["CAT-09", "Gaji Pokok", "Income", "None", "💰"],
      ["CAT-10", "Freelance / Bonus", "Income", "None", "🎁"]
    ];
    defaultCats.forEach(row => sCategories.appendRow(row));
  }

  // 4. Sheet Budgets
  let sBudgets = ss.getSheetByName("Budgets");
  if (!sBudgets) {
    sBudgets = ss.insertSheet("Budgets");
    sBudgets.appendRow(["category_name", "monthly_limit", "weekly_limit", "period"]);
    sBudgets.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#EC4899").setFontColor("#FFFFFF");
    sBudgets.setFrozenRows(1);

    const now = new Date();
    const curPeriod = Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM");
    sBudgets.appendRow(["Makanan & Minuman", 1500000, 375000, curPeriod]);
    sBudgets.appendRow(["Transportasi & Bensin", 400000, 100000, curPeriod]);
    sBudgets.appendRow(["Hiburan & Jajan", 500000, 125000, curPeriod]);
  }

  // 5. Sheet RecurringBills
  let sBills = ss.getSheetByName("RecurringBills");
  if (!sBills) {
    sBills = ss.insertSheet("RecurringBills");
    sBills.appendRow(["bill_id", "bill_name", "amount", "due_day", "category", "wallet_default", "is_active"]);
    sBills.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#F59E0B").setFontColor("#FFFFFF");
    sBills.setFrozenRows(1);

    sBills.appendRow(["BILL-01", "WiFi & Internet", 350000, 10, "Tagihan & Utilitas", "BCA", true]);
    sBills.appendRow(["BILL-02", "Langganan Spotify / Netflix", 55000, 15, "Hiburan & Jajan", "GoPay", true]);
    sBills.appendRow(["BILL-03", "Listrik Bulanan", 200000, 20, "Tagihan & Utilitas", "BCA", true]);
  }

  // Hapus Sheet1 default jika ada
  const defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  return "Setup Database BudgetKu Berhasil! Seluruh sheet dan data awal telah terisi.";
}

// 2. HTTP GET REQUEST HANDLER
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getInitData";
    const month = (e && e.parameter && e.parameter.month) ? e.parameter.month : Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM");

    let result = {};

    if (action === "getInitData") {
      result = getInitialData();
    } else if (action === "getDashboard") {
      result = getDashboardData(month);
    } else if (action === "getTransactions") {
      result = getTransactions(month);
    } else {
      result = { error: "Unknown action" };
    }

    return createJsonResponse({ success: true, data: result });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

// 3. HTTP POST REQUEST HANDLER
function doPost(e) {
  try {
    let postData;
    if (e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    } else {
      postData = e.parameter;
    }

    const action = postData.action;
    let result = {};

    if (action === "addTransaction") {
      result = addTransaction(postData.data);
    } else if (action === "transferFunds") {
      result = transferFunds(postData.data);
    } else if (action === "deleteTransaction") {
      result = deleteTransaction(postData.id);
    } else if (action === "editTransaction") {
      result = editTransaction(postData.id, postData.data);
    } else if (action === "payRecurringBill") {
      result = payRecurringBill(postData.billId, postData.date, postData.wallet);
    } else if (action === "saveBudget") {
      result = saveBudget(postData.data);
    } else {
      result = { error: "Unknown POST action: " + action };
    }

    return createJsonResponse({ success: true, data: result });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

// 4. HELPER JSON RESPONSE
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// 5. BUSINESS LOGIC FUNCTIONS

function getInitialData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Ambil Wallets
  const sWallets = ss.getSheetByName("Wallets");
  const wallets = sWallets ? sheetToObjects(sWallets) : [];

  // Ambil Categories
  const sCategories = ss.getSheetByName("Categories");
  const categories = sCategories ? sheetToObjects(sCategories) : [];

  // Ambil RecurringBills
  const sBills = ss.getSheetByName("RecurringBills");
  const bills = sBills ? sheetToObjects(sBills) : [];

  return {
    wallets: wallets,
    categories: categories,
    recurringBills: bills
  };
}

function getDashboardData(month) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sTx = ss.getSheetByName("Transactions");
  const sWallets = ss.getSheetByName("Wallets");
  const sBudgets = ss.getSheetByName("Budgets");
  const sBills = ss.getSheetByName("RecurringBills");

  const allTx = sTx ? sheetToObjects(sTx) : [];
  const wallets = sWallets ? sheetToObjects(sWallets) : [];
  const budgets = sBudgets ? sheetToObjects(sBudgets) : [];
  const bills = sBills ? sheetToObjects(sBills) : [];

  // Hitung Saldo Tiap Dompet (Initial Balance + Pemasukan - Pengeluaran + Transfer Masuk - Transfer Keluar)
  const walletBalances = {};
  wallets.forEach(w => {
    walletBalances[w.wallet_name] = Number(w.initial_balance) || 0;
  });

  let totalIncomeMonth = 0;
  let totalExpenseMonth = 0;
  let categoryExpenseMonth = {};
  let macroBreakdown = {
    needs: 0,
    wants: 0,
    savings: 0
  };

  // Tanggal awal dan akhir minggu berjalan
  const now = new Date();
  const curWeekRange = getCurrentWeekRange();

  let weeklyExpense = 0;

  allTx.forEach(tx => {
    const amt = Number(tx.amount) || 0;
    const txDateStr = String(tx.date).substring(0, 10);
    const isCurrentMonth = txDateStr.startsWith(month);

    // Hitung perubahan saldo dompet (sepanjang waktu)
    if (tx.type === "Income") {
      if (walletBalances[tx.wallet_from] !== undefined) {
        walletBalances[tx.wallet_from] += amt;
      }
    } else if (tx.type === "Expense") {
      if (walletBalances[tx.wallet_from] !== undefined) {
        walletBalances[tx.wallet_from] -= amt;
      }
    } else if (tx.type === "Transfer") {
      if (walletBalances[tx.wallet_from] !== undefined) {
        walletBalances[tx.wallet_from] -= amt;
      }
      if (walletBalances[tx.wallet_to] !== undefined) {
        walletBalances[tx.wallet_to] += amt;
      }
    }

    // Hitung ringkasan khusus bulan yang diminta
    if (isCurrentMonth) {
      if (tx.type === "Income") {
        totalIncomeMonth += amt;
      } else if (tx.type === "Expense") {
        totalExpenseMonth += amt;

        // Per kategori
        const cat = tx.category || "Lainnya";
        categoryExpenseMonth[cat] = (categoryExpenseMonth[cat] || 0) + amt;

        // Makro 50/30/20
        const macro = String(tx.macro_type || "");
        if (macro.indexOf("Needs") !== -1) {
          macroBreakdown.needs += amt;
        } else if (macro.indexOf("Wants") !== -1) {
          macroBreakdown.wants += amt;
        } else if (macro.indexOf("Savings") !== -1) {
          macroBreakdown.savings += amt;
        }
      }
    }

    // Cek pengeluaran minggu berjalan
    if (tx.type === "Expense" && txDateStr >= curWeekRange.start && txDateStr <= curWeekRange.end) {
      weeklyExpense += amt;
    }
  });

  // Hitung Total Net Worth (Akumulasi semua dompet)
  let totalNetWorth = 0;
  const walletsWithCalculatedBalance = wallets.map(w => {
    const currentBal = walletBalances[w.wallet_name] || 0;
    totalNetWorth += currentBal;
    return {
      ...w,
      current_balance: currentBal
    };
  });

  // Filter Budgets untuk periode bulan ini
  const monthBudgets = budgets.filter(b => !b.period || b.period === month).map(b => {
    const spent = categoryExpenseMonth[b.category_name] || 0;
    return {
      category_name: b.category_name,
      monthly_limit: Number(b.monthly_limit) || 0,
      weekly_limit: Number(b.weekly_limit) || 0,
      spent_month: spent,
      percent_spent: b.monthly_limit > 0 ? Math.round((spent / b.monthly_limit) * 100) : 0
    };
  });

  // 10 Transaksi Terakhir (urut descending berdasarkan tanggal dan ID)
  const sortedTx = [...allTx].sort((a, b) => {
    const dateComp = String(b.date).localeCompare(String(a.date));
    return dateComp !== 0 ? dateComp : String(b.id).localeCompare(String(a.id));
  });
  const recentTransactions = sortedTx.slice(0, 10);

  return {
    netWorth: totalNetWorth,
    monthIncome: totalIncomeMonth,
    monthExpense: totalExpenseMonth,
    monthSavings: totalIncomeMonth - totalExpenseMonth,
    weeklyExpense: weeklyExpense,
    currentWeekRange: curWeekRange,
    wallets: walletsWithCalculatedBalance,
    macroBreakdown: macroBreakdown,
    categoryExpenses: categoryExpenseMonth,
    budgets: monthBudgets,
    recurringBills: bills,
    recentTransactions: recentTransactions
  };
}

function getTransactions(month) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sTx = ss.getSheetByName("Transactions");
  if (!sTx) return [];

  const allTx = sheetToObjects(sTx);
  const filtered = month 
    ? allTx.filter(t => String(t.date).substring(0, 7) === month)
    : allTx;

  return filtered.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function addTransaction(txData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sTx = ss.getSheetByName("Transactions");
  if (!sTx) throw new Error("Sheet Transactions tidak ditemukan!");

  const id = "TX-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd-HHmmss") + "-" + Math.floor(Math.random() * 1000);
  const nowStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

  sTx.appendRow([
    id,
    txData.date,
    txData.type,
    Number(txData.amount),
    txData.category || "",
    txData.macro_type || "None",
    txData.wallet_from || "",
    txData.wallet_to || "",
    txData.notes || "",
    txData.user_id || "user_primary",
    nowStr
  ]);

  return { id: id, message: "Transaksi berhasil dicatat" };
}

function transferFunds(data) {
  return addTransaction({
    date: data.date,
    type: "Transfer",
    amount: data.amount,
    category: "Transfer Antar Dompet",
    macro_type: "None",
    wallet_from: data.from,
    wallet_to: data.to,
    notes: data.notes || "Pindah Saldo",
    user_id: data.user_id || "user_primary"
  });
}

function deleteTransaction(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sTx = ss.getSheetByName("Transactions");
  if (!sTx) throw new Error("Sheet Transactions tidak ditemukan!");

  const values = sTx.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sTx.deleteRow(i + 1);
      return { id: id, message: "Transaksi berhasil dihapus" };
    }
  }
  throw new Error("Transaksi dengan ID " + id + " tidak ditemukan!");
}

function editTransaction(id, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sTx = ss.getSheetByName("Transactions");
  if (!sTx) throw new Error("Sheet Transactions tidak ditemukan!");

  const values = sTx.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      const row = i + 1;
      if (data.date) sTx.getRange(row, 2).setValue(data.date);
      if (data.type) sTx.getRange(row, 3).setValue(data.type);
      if (data.amount) sTx.getRange(row, 4).setValue(Number(data.amount));
      if (data.category !== undefined) sTx.getRange(row, 5).setValue(data.category);
      if (data.macro_type !== undefined) sTx.getRange(row, 6).setValue(data.macro_type);
      if (data.wallet_from !== undefined) sTx.getRange(row, 7).setValue(data.wallet_from);
      if (data.wallet_to !== undefined) sTx.getRange(row, 8).setValue(data.wallet_to);
      if (data.notes !== undefined) sTx.getRange(row, 9).setValue(data.notes);
      return { id: id, message: "Transaksi berhasil diperbarui" };
    }
  }
  throw new Error("Transaksi dengan ID " + id + " tidak ditemukan!");
}

function payRecurringBill(billId, date, wallet) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sBills = ss.getSheetByName("RecurringBills");
  if (!sBills) throw new Error("Sheet RecurringBills tidak ditemukan!");

  const bills = sheetToObjects(sBills);
  const bill = bills.find(b => String(b.bill_id) === String(billId));
  if (!bill) throw new Error("Tagihan dengan ID " + billId + " tidak ditemukan!");

  return addTransaction({
    date: date || Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd"),
    type: "Expense",
    amount: bill.amount,
    category: bill.category || "Tagihan & Utilitas",
    macro_type: "Needs (50%)",
    wallet_from: wallet || bill.wallet_default,
    wallet_to: "",
    notes: "Pembayaran Tagihan: " + bill.bill_name,
    user_id: "user_primary"
  });
}

function saveBudget(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sBudgets = ss.getSheetByName("Budgets");
  if (!sBudgets) throw new Error("Sheet Budgets tidak ditemukan!");

  const values = sBudgets.getDataRange().getValues();
  const period = data.period || Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM");

  // Cari apakah budget kategori ini sudah ada
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === data.category_name && values[i][3] === period) {
      sBudgets.getRange(i + 1, 2).setValue(Number(data.monthly_limit));
      sBudgets.getRange(i + 1, 3).setValue(Number(data.weekly_limit || Math.round(data.monthly_limit / 4)));
      return { message: "Budget berhasil diperbarui" };
    }
  }

  // Jika belum ada, tambahkan baris baru
  sBudgets.appendRow([
    data.category_name,
    Number(data.monthly_limit),
    Number(data.weekly_limit || Math.round(data.monthly_limit / 4)),
    period
  ]);
  return { message: "Budget baru berhasil ditambahkan" };
}

// 6. UTILITY FUNCTIONS

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((h, idx) => {
      let val = row[idx];
      // Format tanggal jika objek Date
      if (val instanceof Date) {
        val = Utilities.formatDate(val, "Asia/Jakarta", "yyyy-MM-dd");
      }
      obj[h] = val;
    });
    return obj;
  });
}

function getCurrentWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0 = Minggu, 1 = Senin, ...
  const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
  
  const monday = new Date(now.setDate(diffToMonday));
  const sunday = new Date(now.setDate(diffToMonday + 6));

  return {
    start: Utilities.formatDate(monday, "Asia/Jakarta", "yyyy-MM-dd"),
    end: Utilities.formatDate(sunday, "Asia/Jakarta", "yyyy-MM-dd")
  };
}
