/**
 * ===================================================================
 * BUDGETKU - CLIENT JAVASCRIPT APPLICATION CORE (v1.1)
 * ===================================================================
 */

// 1. STATE MANAGEMENT & CACHE KEYS
const STORAGE_KEYS = {
  GAS_URL: 'budgetku_gas_url',
  THEME: 'budgetku_theme',
  MASKED: 'budgetku_is_masked',
  CACHE_DATA: 'budgetku_cached_data'
};

let categoryChart = null;
let toastTimeout = null;

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
  
  data: {
    netWorth: 0,
    monthIncome: 0,
    monthExpense: 0,
    monthSavings: 0,
    weeklyExpense: 0,
    currentWeekRange: { start: '2026-10-12', end: '2026-10-18' },
    wallets: [
      { wallet_name: 'Tunai', current_balance: 0, icon: '💵', color: '#10B981' },
      { wallet_name: 'BCA', current_balance: 0, icon: '🏦', color: '#3B82F6' },
      { wallet_name: 'GoPay', current_balance: 0, icon: '📱', color: '#06B6D4' },
      { wallet_name: 'ShopeePay', current_balance: 0, icon: '🛍️', color: '#F97316' }
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
      needs: 0,
      wants: 0,
      savings: 0
    },
    budgets: [
      { category_name: 'Makanan & Minuman', monthly_limit: 1500000, weekly_limit: 375000, spent_month: 0, percent_spent: 0 },
      { category_name: 'Transportasi & Bensin', monthly_limit: 400000, weekly_limit: 100000, spent_month: 0, percent_spent: 0 },
      { category_name: 'Hiburan & Jajan', monthly_limit: 500000, weekly_limit: 125000, spent_month: 0, percent_spent: 0 }
    ],
    recurringBills: [
      { bill_id: 'BILL-01', bill_name: 'WiFi Indihome', amount: 350000, due_day: 10, category: 'Tagihan & Utilitas', wallet_default: 'BCA', is_active: true },
      { bill_id: 'BILL-02', bill_name: 'Spotify & Netflix', amount: 55000, due_day: 15, category: 'Hiburan & Jajan', wallet_default: 'GoPay', is_active: true },
      { bill_id: 'BILL-03', bill_name: 'Listrik Token PLN', amount: 200000, due_day: 20, category: 'Tagihan & Utilitas', wallet_default: 'BCA', is_active: true }
    ],
    recentTransactions: []
  }
};

// 2. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  initTheme();
  initEyeMask();
  initGasUrlInput();
  
  const monthInput = document.getElementById('filter-history-month');
  if (monthInput) monthInput.value = state.currentMonth;

  const addDateInput = document.getElementById('input-add-date');
  if (addDateInput) addDateInput.value = new Date().toISOString().substring(0, 10);

  const cached = localStorage.getItem(STORAGE_KEYS.CACHE_DATA);
  if (cached) {
    try {
      state.data = JSON.parse(cached);
    } catch(e) {}
  }

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

  renderAll();

  if (state.gasUrl) {
    fetchDashboard();
  }

  // Auto-sync setiap kali user membuka kembali tab atau membuka HP
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.gasUrl) {
      fetchDashboard();
    }
  });
});

async function refreshData() {
  const icon = document.getElementById('refresh-icon');
  if (icon) icon.classList.add('animate-spin');
  showToast('Menyinkronkan data dari Google Sheets...', 'info');

  await fetchDashboard();

  setTimeout(() => {
    if (icon) icon.classList.remove('animate-spin');
    showToast('Data berhasil disinkronkan!');
  }, 600);
}

// 3. TOAST NOTIFICATION SYSTEM
function showToast(message, type = 'success') {
  const box = document.getElementById('toast-box');
  const inner = document.getElementById('toast-inner');
  const icon = document.getElementById('toast-icon');
  const msg = document.getElementById('toast-msg');

  if (!box) return;

  msg.innerText = message;
  if (type === 'success') {
    icon.innerText = '✅';
    inner.className = 'flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl bg-slate-900 text-white text-xs font-semibold border border-emerald-500/50';
  } else if (type === 'error') {
    icon.innerText = '⚠️';
    inner.className = 'flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl bg-slate-900 text-white text-xs font-semibold border border-rose-500/50';
  } else {
    icon.innerText = 'ℹ️';
    inner.className = 'flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl bg-slate-900 text-white text-xs font-semibold border border-blue-500/50';
  }

  box.classList.remove('opacity-0', '-translate-y-4');
  box.classList.add('opacity-100', 'translate-y-0');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    box.classList.remove('opacity-100', 'translate-y-0');
    box.classList.add('opacity-0', '-translate-y-4');
  }, 2800);
}

// 4. THEME & EYE MASK
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
  if (state.currentTab === 'analytics') {
    renderCategoryChart();
  }
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
    txt.innerText = 'Sheets Connected';
  } else {
    badge.className = 'flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40';
    txt.innerText = 'Demo Mode';
  }
}

// 5. API GOOGLE APPS SCRIPT
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
    console.warn('Gagal memuat dari Google Sheets:', err);
  } finally {
    updateLoading(false);
  }
}

async function postToGas(action, payload) {
  if (!state.gasUrl) {
    return { success: true, message: 'Disimpan di mode demo lokal' };
  }

  updateLoading(true);
  try {
    const res = await fetch(state.gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, ...payload })
    });
    return await res.json();
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

// 6. VIEW NAVIGATION (TABS)
function switchTab(tabName) {
  state.currentTab = tabName;

  const tabs = ['home', 'history', 'analytics', 'bills', 'settings'];
  tabs.forEach(t => {
    const view = document.getElementById(`view-${t}`);
    if (view) {
      if (t === tabName) view.classList.remove('hidden');
      else view.classList.add('hidden');
    }
  });

  document.querySelectorAll('.nav-btn').forEach(btn => {
    const target = btn.getAttribute('data-tab');
    if (target === tabName) {
      btn.className = 'nav-btn flex flex-col items-center gap-1 w-14 text-blue-600 dark:text-blue-400 font-bold';
    } else {
      btn.className = 'nav-btn flex flex-col items-center gap-1 w-14 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200';
    }
  });

  if (tabName === 'history') renderHistory();
  if (tabName === 'analytics') {
    renderBudgets();
    renderCategoryChart();
  }
  if (tabName === 'bills') renderBills();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 7. RENDER LOGIC
function renderAll() {
  renderHome();
  renderHistory();
  renderBudgets();
  renderBills();
  if (state.currentTab === 'analytics') {
    renderCategoryChart();
  }
}

function formatRupiah(num) {
  if (num === undefined || num === null) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

function renderHome() {
  const d = state.data;
  
  const elNetWorth = document.getElementById('val-net-worth');
  if (elNetWorth) elNetWorth.innerText = state.isMasked ? 'Rp •••••••' : formatRupiah(d.netWorth);

  const elMonthIncome = document.getElementById('val-month-income');
  if (elMonthIncome) elMonthIncome.innerText = state.isMasked ? 'Rp •••••••' : '+' + formatRupiah(d.monthIncome);

  const elMonthExpense = document.getElementById('val-month-expense');
  if (elMonthExpense) elMonthExpense.innerText = state.isMasked ? 'Rp •••••••' : '-' + formatRupiah(d.monthExpense);

  const elWallets = document.getElementById('wallets-carousel');
  if (elWallets) {
    elWallets.innerHTML = d.wallets.map(w => `
      <div onclick="openEditWalletModal('${w.wallet_name}', ${w.current_balance})" class="flex-shrink-0 w-36 p-3 rounded-2xl bg-white dark:bg-darkcard border border-slate-200/80 dark:border-darkborder/50 shadow-sm cursor-pointer active:scale-95 transition-all hover:border-emerald-500">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xl">${w.icon || '💼'}</span>
          <span class="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-0.5"><i class="ph-bold ph-pencil-simple"></i> Ubah</span>
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

  // Weekly Budget Spotlight - Hitung dinamis dari total batas mingguan di sheet Budgets
  const calculatedWeeklyTarget = (d.budgets || []).reduce((acc, curr) => acc + (Number(curr.weekly_limit) || 0), 0);
  const weeklyTarget = calculatedWeeklyTarget;
  const weeklySpent = d.weeklyExpense || 0;
  const weeklyRemain = Math.max(0, weeklyTarget - weeklySpent);
  const weeklyPct = weeklyTarget > 0 ? Math.min(100, Math.round((weeklySpent / weeklyTarget) * 100)) : 0;

  const elWeeklySpent = document.getElementById('val-weekly-spent');
  if (elWeeklySpent) {
    elWeeklySpent.innerText = state.isMasked ? 'Rp •••••' : `${formatRupiah(weeklySpent)} / ${formatRupiah(weeklyTarget)}`;
  }
  
  const elWeeklyRemain = document.getElementById('val-weekly-remaining');
  if (elWeeklyRemain) {
    elWeeklyRemain.innerText = state.isMasked ? 'Rp •••••' : formatRupiah(weeklyRemain);
  }

  const barWeekly = document.getElementById('bar-weekly-spent');
  if (barWeekly) {
    barWeekly.style.width = `${weeklyPct}%`;
    if (weeklyTarget === 0) {
      barWeekly.className = 'h-full bg-slate-300 dark:bg-slate-700 transition-all duration-300';
    } else if (weeklyPct > 90) {
      barWeekly.className = 'h-full bg-rose-500 transition-all duration-300';
    } else if (weeklyPct > 75) {
      barWeekly.className = 'h-full bg-amber-500 transition-all duration-300';
    } else {
      barWeekly.className = 'h-full bg-emerald-500 transition-all duration-300';
    }
  }

  const badgeWeekStatus = document.getElementById('badge-week-status');
  if (badgeWeekStatus) {
    if (weeklyTarget === 0) {
      badgeWeekStatus.innerText = 'Belum Diatur';
      badgeWeekStatus.className = 'text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-bold';
    } else {
      badgeWeekStatus.innerText = weeklyPct > 100 ? 'Over Budget' : weeklyPct > 80 ? 'Hati-hati' : 'Aman';
      badgeWeekStatus.className = weeklyPct > 100 
        ? 'text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold'
        : weeklyPct > 80
        ? 'text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold'
        : 'text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold';
    }
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
        <div class="flex items-center justify-end gap-2 mt-0.5">
          <button onclick="openEditModal('${t.id}')" class="text-[10px] font-semibold text-blue-500 hover:underline">
            Edit
          </button>
          <span class="text-slate-300 dark:text-slate-700 text-[10px]">&bull;</span>
          <button onclick="deleteTx('${t.id}')" class="text-[10px] font-semibold text-slate-400 hover:text-rose-500 transition-colors">
            Hapus
          </button>
        </div>
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

function exportToCSV() {
  const txs = state.data.recentTransactions || [];
  if (txs.length === 0) {
    showToast('Tidak ada transaksi untuk diekspor', 'error');
    return;
  }

  const headers = ['ID', 'Tanggal', 'Tipe', 'Nominal', 'Kategori', 'Grup 50/30/20', 'Dompet Asal', 'Dompet Tujuan', 'Catatan'];
  const rows = txs.map(t => [
    t.id,
    t.date,
    t.type,
    t.amount,
    `"${(t.category || '').replace(/"/g, '""')}"`,
    `"${(t.macro_type || '').replace(/"/g, '""')}"`,
    `"${(t.wallet_from || '').replace(/"/g, '""')}"`,
    `"${(t.wallet_to || '').replace(/"/g, '""')}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `BudgetKu_Transaksi_${state.currentMonth}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('File CSV berhasil diunduh!');
}

// 8. DONUT CHART FOR ANALYTICS
function renderCategoryChart() {
  const canvas = document.getElementById('chart-donut-categories');
  if (!canvas || typeof Chart === 'undefined') return;

  const expenses = state.data.recentTransactions.filter(t => t.type === 'Expense');
  const catTotals = {};

  expenses.forEach(e => {
    const cat = e.category || 'Lainnya';
    catTotals[cat] = (catTotals[cat] || 0) + Number(e.amount);
  });

  const labels = Object.keys(catTotals);
  const data = Object.values(catTotals);

  if (labels.length === 0) {
    labels.push('Makanan & Minuman', 'Transportasi', 'Hiburan');
    data.push(750000, 200000, 450000);
  }

  const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#64748B'];

  if (categoryChart) {
    categoryChart.destroy();
  }

  const isDark = document.documentElement.classList.contains('dark');

  categoryChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            font: { size: 10, family: '"Plus Jakarta Sans"' },
            color: isDark ? '#94A3B8' : '#475569'
          }
        }
      },
      cutout: '70%'
    }
  });
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
          <span>Bulan: <b>${formatRupiah(b.monthly_limit)}</b> (Minggu: ${formatRupiah(b.weekly_limit)})</span>
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

// 9. QUICK ADD TRANSACTION
function openAddModal() {
  const modal = document.getElementById('modal-add');
  modal.classList.remove('hidden');

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
    showToast('Masukkan nominal yang valid!', 'error');
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

  const targetWallet = state.data.wallets.find(w => w.wallet_name === wallet);
  if (targetWallet) {
    if (state.addModalType === 'Expense') targetWallet.current_balance -= amount;
    else targetWallet.current_balance += amount;
  }

  closeAddModal();
  renderAll();
  showToast('Transaksi berhasil disimpan!');

  try {
    await postToGas('addTransaction', { data: txData });
  } catch(e) {}
}

// 10. EDIT TRANSACTION
function openEditModal(id) {
  const tx = state.data.recentTransactions.find(t => t.id === id);
  if (!tx) return;

  document.getElementById('edit-tx-id').value = tx.id;
  document.getElementById('edit-tx-date').value = tx.date;
  document.getElementById('edit-tx-amount').value = tx.amount;
  document.getElementById('edit-tx-notes').value = tx.notes || '';

  const wSel = document.getElementById('edit-tx-wallet');
  wSel.innerHTML = state.data.wallets.map(w => `
    <option value="${w.wallet_name}" ${w.wallet_name === tx.wallet_from ? 'selected' : ''}>${w.icon || '💼'} ${w.wallet_name}</option>
  `).join('');

  const cSel = document.getElementById('edit-tx-category');
  cSel.innerHTML = state.data.categories.map(c => `
    <option value="${c.category_name}" ${c.category_name === tx.category ? 'selected' : ''}>${c.icon || '🏷️'} ${c.category_name}</option>
  `).join('');

  document.getElementById('modal-edit-tx').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('modal-edit-tx').classList.add('hidden');
}

async function submitEditTransaction() {
  const id = document.getElementById('edit-tx-id').value;
  const date = document.getElementById('edit-tx-date').value;
  const amount = Number(document.getElementById('edit-tx-amount').value);
  const wallet = document.getElementById('edit-tx-wallet').value;
  const category = document.getElementById('edit-tx-category').value;
  const notes = document.getElementById('edit-tx-notes').value;

  if (!amount || amount <= 0) {
    showToast('Nominal harus lebih dari 0', 'error');
    return;
  }

  const tx = state.data.recentTransactions.find(t => t.id === id);
  if (tx) {
    tx.date = date;
    tx.amount = amount;
    tx.wallet_from = wallet;
    tx.category = category;
    tx.notes = notes;
  }

  closeEditModal();
  renderAll();
  showToast('Transaksi berhasil diperbarui!');

  try {
    await postToGas('editTransaction', { id: id, data: { date, amount, wallet_from: wallet, category, notes } });
  } catch(e) {}
}

// 11. TRANSFER ANTAR DOMPET
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
    showToast('Masukkan nominal transfer!', 'error');
    return;
  }

  if (from === to) {
    showToast('Dompet asal dan tujuan tidak boleh sama!', 'error');
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

  const wFrom = state.data.wallets.find(w => w.wallet_name === from);
  const wTo = state.data.wallets.find(w => w.wallet_name === to);
  if (wFrom) wFrom.current_balance -= amount;
  if (wTo) wTo.current_balance += amount;

  state.data.recentTransactions.unshift(txData);

  closeTransferModal();
  renderAll();
  showToast(`Pindah saldo ${formatRupiah(amount)} sukses!`);

  try {
    await postToGas('transferFunds', { data: txData });
  } catch(e) {}
}

// 12. TAGIHAN RUTIN (BILLS)
function openAddBillModal() {
  const modal = document.getElementById('modal-add-bill');
  modal.classList.remove('hidden');

  const cSel = document.getElementById('bill-select-category');
  cSel.innerHTML = state.data.categories.filter(c => c.type === 'Expense').map(c => `
    <option value="${c.category_name}">${c.icon || '🏷️'} ${c.category_name}</option>
  `).join('');

  const wSel = document.getElementById('bill-select-wallet');
  wSel.innerHTML = state.data.wallets.map(w => `
    <option value="${w.wallet_name}">${w.icon || '💼'} ${w.wallet_name}</option>
  `).join('');
}

function closeAddBillModal() {
  document.getElementById('modal-add-bill').classList.add('hidden');
}

function submitNewBill() {
  const name = document.getElementById('bill-input-name').value.trim();
  const amount = Number(document.getElementById('bill-input-amount').value);
  const dueDay = Number(document.getElementById('bill-input-day').value) || 1;
  const category = document.getElementById('bill-select-category').value;
  const wallet = document.getElementById('bill-select-wallet').value;

  if (!name || !amount) {
    showToast('Lengkapi nama dan nominal tagihan!', 'error');
    return;
  }

  const newBill = {
    bill_id: 'BILL-' + Date.now(),
    bill_name: name,
    amount: amount,
    due_day: dueDay,
    category: category,
    wallet_default: wallet,
    is_active: true
  };

  state.data.recurringBills.push(newBill);
  closeAddBillModal();
  renderBills();
  showToast(`Tagihan "${name}" berhasil ditambahkan!`);
}

async function payBillDirect(billId) {
  const bill = state.data.recurringBills.find(b => b.bill_id === billId);
  if (!bill) return;

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
  showToast(`Tagihan "${bill.bill_name}" lunas dibayar!`);

  try {
    await postToGas('payRecurringBill', { billId: bill.bill_id, date: txData.date, wallet: bill.wallet_default });
  } catch(e) {}
}

// 13. SET BUDGET KATEGORI
function openSetBudgetModal() {
  const modal = document.getElementById('modal-set-budget');
  modal.classList.remove('hidden');

  const cSel = document.getElementById('budget-select-category');
  cSel.innerHTML = state.data.categories.filter(c => c.type === 'Expense').map(c => `
    <option value="${c.category_name}">${c.icon || '🏷️'} ${c.category_name}</option>
  `).join('');
}

function closeSetBudgetModal() {
  document.getElementById('modal-set-budget').classList.add('hidden');
}

async function submitSaveBudget() {
  const category = document.getElementById('budget-select-category').value;
  const monthly = Number(document.getElementById('budget-input-monthly').value);
  let weekly = Number(document.getElementById('budget-input-weekly').value);

  if (!monthly || monthly <= 0) {
    showToast('Masukkan batas bulanan yang valid!', 'error');
    return;
  }

  if (!weekly || weekly <= 0) {
    weekly = Math.round(monthly / 4);
  }

  let existing = state.data.budgets.find(b => b.category_name === category);
  if (existing) {
    existing.monthly_limit = monthly;
    existing.weekly_limit = weekly;
  } else {
    state.data.budgets.push({
      category_name: category,
      monthly_limit: monthly,
      weekly_limit: weekly,
      spent_month: 0,
      percent_spent: 0
    });
  }

  closeSetBudgetModal();
  renderBudgets();
  showToast(`Budget "${category}" berhasil diatur!`);

  try {
    await postToGas('saveBudget', { data: { category_name: category, monthly_limit: monthly, weekly_limit: weekly } });
  } catch(e) {}
}

// 14. DELETE TRANSACTION
async function deleteTx(id) {
  if (!confirm('Hapus transaksi ini?')) return;

  state.data.recentTransactions = state.data.recentTransactions.filter(t => t.id !== id);
  renderAll();
  showToast('Transaksi dihapus!');

  try {
    await postToGas('deleteTransaction', { id: id });
  } catch(e) {}
}

// 15. SETTINGS & GAS CONNECTION TEST
async function saveAndTestGasUrl() {
  const url = document.getElementById('input-gas-url').value.trim();
  if (!url) {
    showToast('Masukkan URL Apps Script!', 'error');
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
      showToast('Koneksi ke Google Sheets BERHASIL!');
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

// 16. KELOLA SALDO DOMPET & RESET DATA KE 0
function openEditWalletModal(targetName, currentBal) {
  const modal = document.getElementById('modal-edit-wallet');
  if (!modal) return;
  modal.classList.remove('hidden');

  const sel = document.getElementById('wallet-select-target');
  sel.innerHTML = state.data.wallets.map(w => `
    <option value="${w.wallet_name}" ${w.wallet_name === targetName ? 'selected' : ''}>${w.icon || '💼'} ${w.wallet_name}</option>
  `).join('');

  onWalletTargetChange();
  if (currentBal !== undefined) {
    document.getElementById('wallet-input-balance').value = currentBal;
  }
}

function closeEditWalletModal() {
  const modal = document.getElementById('modal-edit-wallet');
  if (modal) modal.classList.add('hidden');
}

function onWalletTargetChange() {
  const sel = document.getElementById('wallet-select-target');
  const input = document.getElementById('wallet-input-balance');
  if (!sel || !input) return;

  const w = state.data.wallets.find(wal => wal.wallet_name === sel.value);
  if (w) {
    input.value = w.current_balance || 0;
  }
}

async function submitEditWallet() {
  const sel = document.getElementById('wallet-select-target');
  const input = document.getElementById('wallet-input-balance');
  const walletName = sel.value;
  const newBal = Number(input.value) || 0;

  const targetWallet = state.data.wallets.find(w => w.wallet_name === walletName);
  if (targetWallet) {
    targetWallet.current_balance = newBal;
  }

  // Hitung ulang Net Worth
  state.data.netWorth = state.data.wallets.reduce((acc, curr) => acc + (Number(curr.current_balance) || 0), 0);

  localStorage.setItem(STORAGE_KEYS.CACHE_DATA, JSON.stringify(state.data));
  closeEditWalletModal();
  renderAll();
  showToast(`Saldo ${walletName} berhasil diatur ke ${formatRupiah(newBal)}!`);

  try {
    await postToGas('updateWalletBalance', { data: { wallet_name: walletName, new_balance: newBal } });
  } catch(e) {}
}

async function resetAllDataToZero() {
  if (!confirm('PERINGATAN: Apakah Anda yakin ingin mengosongkan semua riwayat transaksi dan menyetel semua saldo dompet menjadi Rp 0?')) {
    return;
  }

  // 1. Reset state lokal
  state.data.netWorth = 0;
  state.data.monthIncome = 0;
  state.data.monthExpense = 0;
  state.data.monthSavings = 0;
  state.data.weeklyExpense = 0;
  state.data.macroBreakdown = { needs: 0, wants: 0, savings: 0 };
  state.data.recentTransactions = [];

  state.data.wallets.forEach(w => {
    w.current_balance = 0;
  });

  state.data.budgets.forEach(b => {
    b.spent_month = 0;
    b.percent_spent = 0;
  });

  localStorage.setItem(STORAGE_KEYS.CACHE_DATA, JSON.stringify(state.data));
  renderAll();
  showToast('Semua transaksi & saldo telah direset menjadi Rp 0!');

  // Kirim reset ke Google Sheets
  try {
    await postToGas('resetAllData', {});
  } catch(e) {}
}
