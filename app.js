/**
 * ===================================================================
 * BUDGETKU - CLIENT JAVASCRIPT APPLICATION CORE
 * ===================================================================
 */

// 1. STATE MANAGEMENT & CACHE KEYS
const STORAGE_KEYS = {
  GAS_URL: 'budgetku_gas_url',
  THEME: 'budgetku_theme',
  MASKED: 'budgetku_is_masked',
  CACHE_DATA: 'budgetku_cached_data',
  PENDING_SYNC: 'budgetku_pending_sync'
};

// State Aplikasi
let state = {
  gasUrl: localStorage.getItem(STORAGE_KEYS.GAS_URL) || '',
  theme: localStorage.getItem(STORAGE_KEYS.THEME) || 'dark',
  isMasked: localStorage.getItem(STORAGE_KEYS.MASKED) === 'true',
  currentTab: 'home',
  currentMonth: new Date().toISOString().substring(0, 7),
  historyFilterType: 'All',
  historySearchQuery: '',
  addModalType: 'Expense',
  selectedCategoryId: '',
  
  // Data utama
  data: {
    netWorth: 3250000,
    monthIncome: 5000000,
    monthExpense: 1750000,
    monthSavings: 3250000,
    weeklyExpense: 320000,
    currentWeekRange: { start: '2026-10-12', end: '2026-10-18' },
    wallets: [
      { wallet_name: 'Tunai', current_balance: 500000, icon: '💵', color: '#10B981' },
      { wallet_name: 'BCA', current_balance: 2500000, icon: '🏦', color: '#3B82F6' },
      { wallet_name: 'GoPay', current_balance: 150000, icon: '📱', color: '#06B6D4' },
      { wallet_name: 'ShopeePay', current_balance: 100000, icon: '🛍️', color: '#F97316' }
    ],
    categories: [
      { category_id: 'CAT-01', category_name: 'Makanan & Minuman', type: 'Expense', macro_group: 'Needs', icon: '🍔' },
      { category_id: 'CAT-02', category_name: 'Transportasi & Bensin', type: 'Expense', macro_group: 'Needs', icon: '🛵' },
      { category_id: 'CAT-03', category_name: 'Belanja Bulanan', type: 'Expense', macro_group: 'Needs', icon: '🛒' },
      { category_id: 'CAT-04', category_name: 'Tagihan & Utilitas', type: 'Expense', macro_group: 'Needs', icon: '⚡' },
      { category_id: 'CAT-05', category_name: 'Hiburan & Jajan', type: 'Expense', macro_group: 'Wants', icon: '☕' },
      { category_id: 'CAT-06', category_name: 'Hobi & Olahraga', type: 'Expense', macro_group: 'Wants', icon: '⚽' },
      { category_id: 'CAT-07', category_name: 'Tabungan & Investasi', type: 'Expense', macro_group: 'Savings', icon: '📈' },
      { category_id: 'CAT-08', category_name: 'Gaji Pokok', type: 'Income', macro_group: 'None', icon: '💰' },
      { category_id: 'CAT-09', category_name: 'Freelance & Bonus', type: 'Income', macro_group: 'None', icon: '🎁' }
    ],
    macroBreakdown: {
      needs: 1150000,
      wants: 450000,
      savings: 150000
    },
    budgets: [
      { category_name: 'Makanan & Minuman', monthly_limit: 1500000, weekly_limit: 375000, spent_month: 750000, percent_spent: 50 },
      { category_name: 'Transportasi & Bensin', monthly_limit: 400000, weekly_limit: 100000, spent_month: 200000, percent_spent: 50 },
      { category_name: 'Hiburan & Jajan', monthly_limit: 500000, weekly_limit: 125000, spent_month: 450000, percent_spent: 90 }
    ],
    recurringBills: [
      { bill_id: 'BILL-01', bill_name: 'WiFi Indihome', amount: 350000, due_day: 10, category: 'Tagihan & Utilitas', wallet_default: 'BCA', is_active: true },
      { bill_id: 'BILL-02', bill_name: 'Spotify & Netflix', amount: 55000, due_day: 15, category: 'Hiburan & Jajan', wallet_default: 'GoPay', is_active: true },
      { bill_id: 'BILL-03', bill_name: 'Listrik Token PLN', amount: 200000, due_day: 20, category: 'Tagihan & Utilitas', wallet_default: 'BCA', is_active: true }
    ],
    recentTransactions: [
      { id: 'TX-01', date: '2026-10-18', type: 'Expense', amount: 35000, category: 'Makanan & Minuman', macro_type: 'Needs (50%)', wallet_from: 'GoPay', notes: 'Makan siang ayam geprek' },
      { id: 'TX-02', date: '2026-10-17', type: 'Expense', amount: 25000, category: 'Transportasi & Bensin', macro_type: 'Needs (50%)', wallet_from: 'Tunai', notes: 'Bensin Pertamax' },
      { id: 'TX-03', date: '2026-10-16', type: 'Expense', amount: 45000, category: 'Hiburan & Jajan', macro_type: 'Wants (30%)', wallet_from: 'GoPay', notes: 'Kopi Kenangan' },
      { id: 'TX-04', date: '2026-10-15', type: 'Transfer', amount: 200000, category: 'Transfer Antar Dompet', macro_type: 'None', wallet_from: 'BCA', wallet_to: 'GoPay', notes: 'Top up GoPay' },
      { id: 'TX-05', date: '2026-10-01', type: 'Income', amount: 5000000, category: 'Gaji Pokok', macro_type: 'None', wallet_from: 'BCA', notes: 'Gaji Bulanan' }
    ]
  }
};

// 2. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  // PWA Service Worker Registration
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  initTheme();
  initEyeMask();
  initGasUrlInput();
  
  // Set default filter month
  const monthInput = document.getElementById('filter-history-month');
  if (monthInput) monthInput.value = state.currentMonth;

  const addDateInput = document.getElementById('input-add-date');
  if (addDateInput) addDateInput.value = new Date().toISOString().substring(0, 10);

  // Ambil cache data lokal jika ada
  const cached = localStorage.getItem(STORAGE_KEYS.CACHE_DATA);
  if (cached) {
    try {
      state.data = JSON.parse(cached);
    } catch(e) {}
  }

  // Setup Event Listeners
  document.getElementById('btn-toggle-theme').addEventListener('click', toggleTheme);
  document.getElementById('btn-toggle-eye').addEventListener('click', toggleEye);
  
  if (monthInput) {
    monthInput.addEventListener('change', (e) => {
      state.currentMonth = e.target.value;
      fetchDashboard();
    });
  }

  const searchInput = document.getElementById('search-history-query');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.historySearchQuery = e.target.value.toLowerCase();
      renderHistory();
    });
  }

  // Render awal
  renderAll();

  // Jika URL GAS ada, muat data dari Google Sheets secara live
  if (state.gasUrl) {
    fetchDashboard();
  }
});

// 3. THEME & EYE MASK MANAGERS
function initTheme() {
  if (state.theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.getElementById('theme-icon').className = 'ph ph-sun';
  } else {
    document.documentElement.classList.remove('dark');
    document.getElementById('theme-icon').className = 'ph ph-moon';
  }
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
  initTheme();
}

function initEyeMask() {
  applyEyeMask();
}

function toggleEye() {
  state.isMasked = !state.isMasked;
  localStorage.setItem(STORAGE_KEYS.MASKED, state.isMasked);
  applyEyeMask();
}

function applyEyeMask() {
  const eyeIcon = document.getElementById('eye-icon');
  if (state.isMasked) {
    eyeIcon.className = 'ph ph-eye-slash text-amber-500';
    document.querySelectorAll('.masked-value').forEach(el => {
      el.setAttribute('data-original', el.innerText);
      el.innerText = 'Rp •••••••';
    });
  } else {
    eyeIcon.className = 'ph ph-eye text-slate-600 dark:text-slate-300';
    renderAll();
  }
}

function initGasUrlInput() {
  const input = document.getElementById('input-gas-url');
  if (input) input.value = state.gasUrl;
  updateStatusBadge();
}

function updateStatusBadge() {
  const badge = document.getElementById('btn-status-badge');
  const txt = document.getElementById('txt-conn-status');
  if (state.gasUrl) {
    badge.className = 'flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40';
    txt.innerText = 'Google Sheets Connected';
  } else {
    badge.className = 'flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40';
    txt.innerText = 'Demo Mode';
  }
}

// 4. API GOOGLE APPS SCRIPT SYNC
async function fetchDashboard() {
  if (!state.gasUrl) return;

  updateLoading(true);
  try {
    const res = await fetch(`${state.gasUrl}?action=getDashboard&month=${state.currentMonth}`);
    const json = await res.json();
    if (json.success && json.data) {
      state.data = { ...state.data, ...json.data };
      localStorage.setItem(STORAGE_KEYS.CACHE_DATA, JSON.stringify(state.data));
      renderAll();
    }
  } catch (err) {
    console.warn('Gagal memuat dari Google Sheets, menggunakan cache lokal:', err);
  } finally {
    updateLoading(false);
  }
}

async function postToGas(action, payload) {
  if (!state.gasUrl) {
    // Simulasi offline/demo
    return { success: true, message: 'Disimpan di mode demo lokal' };
  }

  updateLoading(true);
  try {
    const res = await fetch(state.gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, ...payload })
    });
    const result = await res.json();
    return result;
  } catch (err) {
    console.error('Error POST GAS:', err);
    throw err;
  } finally {
    updateLoading(false);
  }
}

function updateLoading(isLoading) {
  const badge = document.getElementById('txt-conn-status');
  if (!badge) return;
  if (isLoading) {
    badge.innerText = 'Menyinkronkan...';
  } else {
    updateStatusBadge();
  }
}

// 5. VIEW NAVIGATION (TABS)
function switchTab(tabName) {
  state.currentTab = tabName;

  const tabs = ['home', 'history', 'analytics', 'bills', 'settings'];
  tabs.forEach(t => {
    const view = document.getElementById(`view-${t}`);
    if (view) {
      if (t === tabName) {
        view.classList.remove('hidden');
      } else {
        view.classList.add('hidden');
      }
    }
  });

  // Update Nav button styles
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const target = btn.getAttribute('data-tab');
    if (target === tabName) {
      btn.className = 'nav-btn flex flex-col items-center gap-1 w-14 text-blue-600 dark:text-blue-400 font-bold';
    } else {
      btn.className = 'nav-btn flex flex-col items-center gap-1 w-14 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200';
    }
  });

  // Trigger spesifik per tab
  if (tabName === 'history') renderHistory();
  if (tabName === 'analytics') renderBudgets();
  if (tabName === 'bills') renderBills();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 6. RENDER LOGIC
function renderAll() {
  renderHome();
  renderHistory();
  renderBudgets();
  renderBills();
}

function formatRupiah(num) {
  if (num === undefined || num === null) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

function renderHome() {
  const d = state.data;
  
  // Net Worth Card
  const elNetWorth = document.getElementById('val-net-worth');
  if (elNetWorth) elNetWorth.innerText = state.isMasked ? 'Rp •••••••' : formatRupiah(d.netWorth);

  const elMonthIncome = document.getElementById('val-month-income');
  if (elMonthIncome) elMonthIncome.innerText = state.isMasked ? 'Rp •••••••' : '+' + formatRupiah(d.monthIncome);

  const elMonthExpense = document.getElementById('val-month-expense');
  if (elMonthExpense) elMonthExpense.innerText = state.isMasked ? 'Rp •••••••' : '-' + formatRupiah(d.monthExpense);

  // Wallets Carousel
  const elWallets = document.getElementById('wallets-carousel');
  if (elWallets) {
    elWallets.innerHTML = d.wallets.map(w => `
      <div class="flex-shrink-0 w-36 p-3 rounded-2xl bg-white dark:bg-darkcard border border-slate-200/80 dark:border-darkborder/50 shadow-sm">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xl">${w.icon || '💼'}</span>
          <span class="w-2 h-2 rounded-full" style="background-color: ${w.color || '#3B82F6'}"></span>
        </div>
        <p class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">${w.wallet_name}</p>
        <p class="text-xs font-bold text-slate-800 dark:text-slate-100 masked-value truncate">
          ${state.isMasked ? 'Rp •••••' : formatRupiah(w.current_balance)}
        </p>
      </div>
    `).join('');
  }

  // 50/30/20 Breakdown
  const totalExpense = d.monthExpense || 1;
  const needsPct = Math.min(100, Math.round(((d.macroBreakdown?.needs || 0) / totalExpense) * 100));
  const wantsPct = Math.min(100, Math.round(((d.macroBreakdown?.wants || 0) / totalExpense) * 100));
  const savingsPct = Math.min(100, Math.round(((d.macroBreakdown?.savings || 0) / totalExpense) * 100));

  const elMacroNeeds = document.getElementById('val-macro-needs');
  if (elMacroNeeds) elMacroNeeds.innerText = state.isMasked ? 'Rp •••••' : formatRupiah(d.macroBreakdown?.needs || 0);
  const barNeeds = document.getElementById('bar-macro-needs');
  if (barNeeds) barNeeds.style.width = `${needsPct}%`;

  const elMacroWants = document.getElementById('val-macro-wants');
  if (elMacroWants) elMacroWants.innerText = state.isMasked ? 'Rp •••••' : formatRupiah(d.macroBreakdown?.wants || 0);
  const barWants = document.getElementById('bar-macro-wants');
  if (barWants) barWants.style.width = `${wantsPct}%`;

  const elMacroSavings = document.getElementById('val-macro-savings');
  if (elMacroSavings) elMacroSavings.innerText = state.isMasked ? 'Rp •••••' : formatRupiah(d.macroBreakdown?.savings || 0);
  const barSavings = document.getElementById('bar-macro-savings');
  if (barSavings) barSavings.style.width = `${savingsPct}%`;

  // Weekly Budget Spotlight
  const weeklyTarget = 600000;
  const weeklySpent = d.weeklyExpense || 0;
  const weeklyRemain = Math.max(0, weeklyTarget - weeklySpent);
  const weeklyPct = Math.min(100, Math.round((weeklySpent / weeklyTarget) * 100));

  const elWeeklySpent = document.getElementById('val-weekly-spent');
  if (elWeeklySpent) elWeeklySpent.innerText = state.isMasked ? 'Rp •••••' : `${formatRupiah(weeklySpent)} / ${formatRupiah(weeklyTarget)}`;
  
  const elWeeklyRemain = document.getElementById('val-weekly-remaining');
  if (elWeeklyRemain) elWeeklyRemain.innerText = state.isMasked ? 'Rp •••••' : formatRupiah(weeklyRemain);

  const barWeekly = document.getElementById('bar-weekly-spent');
  if (barWeekly) {
    barWeekly.style.width = `${weeklyPct}%`;
    if (weeklyPct > 90) barWeekly.className = 'h-full bg-rose-500 transition-all duration-300';
    else if (weeklyPct > 75) barWeekly.className = 'h-full bg-amber-500 transition-all duration-300';
    else barWeekly.className = 'h-full bg-emerald-500 transition-all duration-300';
  }

  const badgeWeekStatus = document.getElementById('badge-week-status');
  if (badgeWeekStatus) {
    badgeWeekStatus.innerText = weeklyPct > 100 ? 'Over Budget' : weeklyPct > 80 ? 'Hati-hati' : 'Aman';
    badgeWeekStatus.className = weeklyPct > 100 
      ? 'text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold'
      : weeklyPct > 80
      ? 'text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold'
      : 'text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold';
  }

  // Quick Upcoming Bills
  const elQuickBills = document.getElementById('quick-bills-list');
  if (elQuickBills) {
    const activeBills = d.recurringBills.filter(b => b.is_active).slice(0, 2);
    if (activeBills.length === 0) {
      elQuickBills.innerHTML = '<p class="text-xs text-slate-400">Tidak ada tagihan bulan ini.</p>';
    } else {
      elQuickBills.innerHTML = activeBills.map(b => `
        <div class="flex items-center justify-between p-2 rounded-xl bg-white/70 dark:bg-darkcard/70 border border-amber-200/40 dark:border-amber-900/20">
          <div class="flex items-center gap-2">
            <span class="text-base">🔔</span>
            <div>
              <p class="text-xs font-bold text-slate-800 dark:text-slate-200">${b.bill_name}</p>
              <p class="text-[10px] text-slate-500">Tiap tgl ${b.due_day} &bull; ${b.wallet_default}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-xs font-extrabold text-amber-700 dark:text-amber-300">${formatRupiah(b.amount)}</p>
            <button onclick="payBillDirect('${b.bill_id}')" class="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline">Bayar</button>
          </div>
        </div>
      `).join('');
    }
  }

  // Recent Transactions List
  const elRecentTx = document.getElementById('recent-transactions-list');
  if (elRecentTx) {
    const txs = d.recentTransactions.slice(0, 5);
    if (txs.length === 0) {
      elRecentTx.innerHTML = '<p class="text-center py-4 text-xs text-slate-400">Belum ada transaksi.</p>';
    } else {
      elRecentTx.innerHTML = txs.map(t => renderTxItem(t)).join('');
    }
  }
}

function renderTxItem(t) {
  const isExp = t.type === 'Expense';
  const isInc = t.type === 'Income';
  const isTrf = t.type === 'Transfer';

  const badgeColor = isExp ? 'text-rose-600 dark:text-rose-400' : isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400';
  const prefix = isExp ? '-' : isInc ? '+' : '';
  const icon = isExp ? '🍔' : isInc ? '💰' : '🔄';

  return `
    <div class="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-darkcard border border-slate-200/70 dark:border-darkborder/40 shadow-sm">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-lg">
          ${icon}
        </div>
        <div>
          <p class="text-xs font-bold text-slate-800 dark:text-slate-100">${t.category || t.notes || 'Transaksi'}</p>
          <p class="text-[10px] text-slate-500 dark:text-slate-400">${t.date} &bull; ${t.wallet_from || ''} ${t.wallet_to ? ' &rarr; ' + t.wallet_to : ''}</p>
        </div>
      </div>
      <div class="text-right">
        <p class="text-xs font-extrabold ${badgeColor} masked-value">${prefix}${formatRupiah(t.amount)}</p>
        <button onclick="deleteTx('${t.id}')" class="text-[10px] text-slate-400 hover:text-rose-500 transition-colors">
          Hapus
        </button>
      </div>
    </div>
  `;
}

function renderHistory() {
  const container = document.getElementById('full-history-list');
  if (!container) return;

  let list = state.data.recentTransactions;
  if (state.historyFilterType !== 'All') {
    list = list.filter(t => t.type === state.historyFilterType);
  }

  if (state.historySearchQuery) {
    list = list.filter(t => 
      (t.notes || '').toLowerCase().includes(state.historySearchQuery) ||
      (t.category || '').toLowerCase().includes(state.historySearchQuery) ||
      (t.wallet_from || '').toLowerCase().includes(state.historySearchQuery)
    );
  }

  if (list.length === 0) {
    container.innerHTML = '<p class="text-center py-8 text-xs text-slate-400">Tidak ada riwayat transaksi yang cocok.</p>';
    return;
  }

  container.innerHTML = list.map(t => renderTxItem(t)).join('');
}

function setHistoryFilter(type) {
  state.historyFilterType = type;
  document.querySelectorAll('.history-chip').forEach(btn => {
    if (btn.getAttribute('data-type') === type) {
      btn.className = 'history-chip px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap bg-blue-600 text-white';
    } else {
      btn.className = 'history-chip px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap bg-slate-100 dark:bg-darkcard text-slate-600 dark:text-slate-300';
    }
  });
  renderHistory();
}

function renderBudgets() {
  const container = document.getElementById('budgets-category-list');
  if (!container) return;

  const budgets = state.data.budgets || [];
  if (budgets.length === 0) {
    container.innerHTML = '<p class="text-center py-6 text-xs text-slate-400">Belum ada pengaturan budget kategori.</p>';
    return;
  }

  container.innerHTML = budgets.map(b => {
    const pct = b.percent_spent || Math.round((b.spent_month / (b.monthly_limit || 1)) * 100);
    const colorClass = pct > 90 ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500';
    const statusText = pct > 100 ? 'Over Budget' : pct > 80 ? 'Hati-hati' : 'Aman';

    return `
      <div class="p-4 rounded-2xl bg-white dark:bg-darkcard border border-slate-200/80 dark:border-darkborder/50 shadow-sm space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-800 dark:text-slate-200">${b.category_name}</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${pct > 100 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}">
            ${statusText} (${pct}%)
          </span>
        </div>

        <div class="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div class="h-full ${colorClass} transition-all duration-300" style="width: ${Math.min(100, pct)}%"></div>
        </div>

        <div class="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
          <span>Terpakai: <b class="text-slate-800 dark:text-slate-200">${formatRupiah(b.spent_month)}</b></span>
          <span>Batas: <b>${formatRupiah(b.monthly_limit)}</b></span>
        </div>
      </div>
    `;
  }).join('');
}

function renderBills() {
  const container = document.getElementById('full-bills-list');
  if (!container) return;

  const bills = state.data.recurringBills || [];
  if (bills.length === 0) {
    container.innerHTML = '<p class="text-center py-6 text-xs text-slate-400">Belum ada tagihan terdaftar.</p>';
    return;
  }

  container.innerHTML = bills.map(b => `
    <div class="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-darkcard border border-slate-200/80 dark:border-darkborder/50 shadow-sm">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl">
          🔔
        </div>
        <div>
          <p class="text-xs font-bold text-slate-800 dark:text-slate-100">${b.bill_name}</p>
          <p class="text-[11px] text-slate-500">Jatuh tempo tiap tgl ${b.due_day} &bull; ${b.wallet_default}</p>
        </div>
      </div>
      <div class="text-right">
        <p class="text-xs font-extrabold text-slate-800 dark:text-slate-100">${formatRupiah(b.amount)}</p>
        <button onclick="payBillDirect('${b.bill_id}')" class="mt-1 px-3 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-bold active:scale-95 shadow-sm shadow-blue-500/20">
          Bayar Sekarang
        </button>
      </div>
    </div>
  `).join('');
}

// 7. MODAL ADD LOGIC
function openAddModal() {
  const modal = document.getElementById('modal-add');
  modal.classList.remove('hidden');

  // Populate wallets
  const selectWallet = document.getElementById('select-add-wallet');
  selectWallet.innerHTML = state.data.wallets.map(w => `
    <option value="${w.wallet_name}">${w.icon || '💼'} ${w.wallet_name}</option>
  `).join('');

  setAddType(state.addModalType);
  document.getElementById('input-add-amount').focus();
}

function closeAddModal() {
  document.getElementById('modal-add').classList.add('hidden');
}

function setAddType(type) {
  state.addModalType = type;
  const btnExp = document.getElementById('type-btn-expense');
  const btnInc = document.getElementById('type-btn-income');

  if (type === 'Expense') {
    btnExp.className = 'px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white';
    btnInc.className = 'px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
  } else {
    btnExp.className = 'px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
    btnInc.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white';
  }

  // Populate categories grid
  const grid = document.getElementById('grid-add-categories');
  const filteredCats = state.data.categories.filter(c => c.type === type);
  
  if (filteredCats.length > 0 && !state.selectedCategoryId) {
    state.selectedCategoryId = filteredCats[0].category_id;
  }

  grid.innerHTML = filteredCats.map(c => `
    <button onclick="selectCategory('${c.category_id}')" class="cat-chip p-2 rounded-xl text-center flex flex-col items-center gap-1 border ${state.selectedCategoryId === c.category_id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300' : 'border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'}" data-id="${c.category_id}">
      <span class="text-lg">${c.icon || '🏷️'}</span>
      <span class="text-[10px] font-semibold truncate w-full">${c.category_name}</span>
    </button>
  `).join('');
}

function selectCategory(id) {
  state.selectedCategoryId = id;
  document.querySelectorAll('.cat-chip').forEach(btn => {
    if (btn.getAttribute('data-id') === id) {
      btn.className = 'cat-chip p-2 rounded-xl text-center flex flex-col items-center gap-1 border border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300';
    } else {
      btn.className = 'cat-chip p-2 rounded-xl text-center flex flex-col items-center gap-1 border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300';
    }
  });
}

function addQuickAmount(val) {
  const input = document.getElementById('input-add-amount');
  const current = Number(input.value) || 0;
  input.value = current + val;
}

function resetAmount() {
  document.getElementById('input-add-amount').value = '';
}

async function submitTransaction() {
  const amount = Number(document.getElementById('input-add-amount').value);
  if (!amount || amount <= 0) {
    alert('Masukkan nominal transaksi yang valid!');
    return;
  }

  const date = document.getElementById('input-add-date').value || new Date().toISOString().substring(0, 10);
  const wallet = document.getElementById('select-add-wallet').value;
  const notes = document.getElementById('input-add-notes').value;

  const catObj = state.data.categories.find(c => c.category_id === state.selectedCategoryId) || { category_name: 'Lainnya', macro_group: 'Needs' };
  
  const macroType = catObj.macro_group === 'Needs' ? 'Needs (50%)' 
                  : catObj.macro_group === 'Wants' ? 'Wants (30%)' 
                  : catObj.macro_group === 'Savings' ? 'Savings (20%)' : 'None';

  const txData = {
    id: 'TX-' + Date.now(),
    date: date,
    type: state.addModalType,
    amount: amount,
    category: catObj.category_name,
    macro_type: macroType,
    wallet_from: wallet,
    wallet_to: '',
    notes: notes,
    user_id: 'user_primary'
  };

  // Update State Lokal
  state.data.recentTransactions.unshift(txData);
  if (state.addModalType === 'Expense') {
    state.data.netWorth -= amount;
    state.data.monthExpense += amount;
    state.data.weeklyExpense += amount;
    if (macroType.includes('Needs')) state.data.macroBreakdown.needs += amount;
    if (macroType.includes('Wants')) state.data.macroBreakdown.wants += amount;
    if (macroType.includes('Savings')) state.data.macroBreakdown.savings += amount;
  } else {
    state.data.netWorth += amount;
    state.data.monthIncome += amount;
  }

  // Update saldo wallet
  const targetWallet = state.data.wallets.find(w => w.wallet_name === wallet);
  if (targetWallet) {
    if (state.addModalType === 'Expense') targetWallet.current_balance -= amount;
    else targetWallet.current_balance += amount;
  }

  closeAddModal();
  renderAll();

  // Kirim ke Google Apps Script di background
  try {
    await postToGas('addTransaction', { data: txData });
  } catch(e) {
    console.log('Tersimpan di offline cache');
  }
}

// 8. MODAL TRANSFER LOGIC
function openTransferModal() {
  const modal = document.getElementById('modal-transfer');
  modal.classList.remove('hidden');

  const fromSel = document.getElementById('select-transfer-from');
  const toSel = document.getElementById('select-transfer-to');

  fromSel.innerHTML = state.data.wallets.map(w => `<option value="${w.wallet_name}">${w.icon || '💼'} ${w.wallet_name}</option>`).join('');
  toSel.innerHTML = state.data.wallets.map(w => `<option value="${w.wallet_name}">${w.icon || '💼'} ${w.wallet_name}</option>`).join('');
  
  if (state.data.wallets.length > 1) {
    toSel.selectedIndex = 1;
  }
}

function closeTransferModal() {
  document.getElementById('modal-transfer').classList.add('hidden');
}

async function submitTransfer() {
  const from = document.getElementById('select-transfer-from').value;
  const to = document.getElementById('select-transfer-to').value;
  const amount = Number(document.getElementById('input-transfer-amount').value);
  const notes = document.getElementById('input-transfer-notes').value || 'Pindah Saldo';

  if (!amount || amount <= 0) {
    alert('Masukkan nominal transfer yang valid!');
    return;
  }

  if (from === to) {
    alert('Dompet asal dan tujuan tidak boleh sama!');
    return;
  }

  const txData = {
    id: 'TX-TRF-' + Date.now(),
    date: new Date().toISOString().substring(0, 10),
    type: 'Transfer',
    amount: amount,
    category: 'Transfer Antar Dompet',
    macro_type: 'None',
    wallet_from: from,
    wallet_to: to,
    notes: notes,
    user_id: 'user_primary'
  };

  // Mutasi dompet lokal
  const wFrom = state.data.wallets.find(w => w.wallet_name === from);
  const wTo = state.data.wallets.find(w => w.wallet_name === to);
  if (wFrom) wFrom.current_balance -= amount;
  if (wTo) wTo.current_balance += amount;

  state.data.recentTransactions.unshift(txData);

  closeTransferModal();
  renderAll();

  try {
    await postToGas('transferFunds', { data: txData });
  } catch(e) {
    console.log('Tersimpan di offline cache');
  }
}

// 9. RECURRING BILLS DIRECT PAYMENT
async function payBillDirect(billId) {
  const bill = state.data.recurringBills.find(b => b.bill_id === billId);
  if (!bill) return;

  if (!confirm(`Konfirmasi pembayaran tagihan "${bill.bill_name}" sebesar ${formatRupiah(bill.amount)} menggunakan dompet ${bill.wallet_default}?`)) {
    return;
  }

  const txData = {
    id: 'TX-BILL-' + Date.now(),
    date: new Date().toISOString().substring(0, 10),
    type: 'Expense',
    amount: bill.amount,
    category: bill.category,
    macro_type: 'Needs (50%)',
    wallet_from: bill.wallet_default,
    wallet_to: '',
    notes: 'Bayar Tagihan: ' + bill.bill_name,
    user_id: 'user_primary'
  };

  state.data.recentTransactions.unshift(txData);
  state.data.netWorth -= bill.amount;
  state.data.monthExpense += bill.amount;
  state.data.macroBreakdown.needs += bill.amount;

  const w = state.data.wallets.find(wal => wal.wallet_name === bill.wallet_default);
  if (w) w.current_balance -= bill.amount;

  renderAll();
  alert(`Tagihan "${bill.bill_name}" berhasil dibukukan!`);

  try {
    await postToGas('payRecurringBill', { billId: bill.bill_id, date: txData.date, wallet: bill.wallet_default });
  } catch(e) {}
}

// 10. DELETE TRANSACTION
async function deleteTx(id) {
  if (!confirm('Hapus transaksi ini?')) return;

  state.data.recentTransactions = state.data.recentTransactions.filter(t => t.id !== id);
  renderAll();

  try {
    await postToGas('deleteTransaction', { id: id });
  } catch(e) {}
}

// 11. SETTINGS & GAS CONNECTION TEST
async function saveAndTestGasUrl() {
  const url = document.getElementById('input-gas-url').value.trim();
  if (!url) {
    alert('Masukkan URL Google Apps Script yang valid!');
    return;
  }

  updateLoading(true);
  try {
    const res = await fetch(`${url}?action=getInitData`);
    const json = await res.json();
    if (json.success) {
      state.gasUrl = url;
      localStorage.setItem(STORAGE_KEYS.GAS_URL, url);
      updateStatusBadge();
      alert('Koneksi ke Google Sheets BERHASIL! Data Anda kini tersinkronisasi langsung.');
      fetchDashboard();
    } else {
      throw new Error(json.error || 'Respon Apps Script tidak valid');
    }
  } catch(err) {
    alert('Gagal terhubung ke Google Apps Script!\n\nPastikan:\n1. Saat Deploy, "Who has access" dipilih "Anyone".\n2. Anda sudah menjalankan fungsi setupSheet di Apps Script.\n\nDetail error: ' + err.message);
  } finally {
    updateLoading(false);
  }
}

function resetToDemoData() {
  if (!confirm('Kembalikan ke data demo awal?')) return;
  localStorage.removeItem(STORAGE_KEYS.GAS_URL);
  localStorage.removeItem(STORAGE_KEYS.CACHE_DATA);
  state.gasUrl = '';
  location.reload();
}
