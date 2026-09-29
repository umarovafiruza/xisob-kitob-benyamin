/**
 * ====================================================================
 * OILAVIY XARAJATLAR TRACKER - MOBILE APP JAVASCRIPT KODI (VANILLA JS)
 * ====================================================================
 * Ushbu dastur quyidagi asosiy imkoniyatlarni o'z ichiga oladi:
 * 1. Oyma-oy hisobot va oylarni almashtirish (Sentabr 2026, Avgust...)
 * 2. Budjetga pul kiritish (Kirim / Daromad) va Chiqim (Xarajat) tizimi
 * 3. Ota-onalar uchun tezkor shablon tugmalari
 * 4. Mobil pastki navigatsiya (Bottom Navigation Bar)
 * 5. LocalStorage ma'lumotlar saqlanishi
 */

// 1. O'zgarmaslar va asosiy sozlamalar
const STORAGE_KEY = "family_expenses_tracker_data";
const BUDGET_STORAGE_KEY = "family_budget_data";
const DEFAULT_BUDGET = 5000000; // Standart oylik reja: 5 000 000 so'm

// O'zbekcha oylar ro'yxati
const UZBEK_MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
];

// Xarajat kategoriyalari
const EXPENSE_CATEGORIES = [
  { name: "Oziq-ovqat", key: "oziq-ovqat" },
  { name: "Ta'lim", key: "talim" },
  { name: "Transport", key: "transport" },
  { name: "Kommunal", key: "kommunal" },
  { name: "Kredit/Qarz", key: "kredit" },
  { name: "Boshqa", key: "boshqa" }
];

// Kirim (Daromad) kategoriyalari
const INCOME_CATEGORIES = [
  { name: "Oylik maosh", key: "maosh" },
  { name: "Pensiya", key: "pensiya" },
  { name: "Qo‘shimcha daromad", key: "daromad" },
  { name: "Savdo/Biznes", key: "savdo" },
  { name: "Sovg‘a/Yordam", key: "yordam" },
  { name: "Boshqa", key: "boshqa" }
];

// DOM: Navigatsiya va sahifalar
const navItems = document.querySelectorAll(".nav-item");
const tabPages = document.querySelectorAll(".app-tab-page");
const btnSeeAllHistory = document.getElementById("btnSeeAllHistory");
const btnShortcutAdd = document.getElementById("btnShortcutAdd");
const btnQuickIncome = document.getElementById("btnQuickIncome");

// DOM: Oylik navigatsiya
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");
const currentMonthNameEl = document.getElementById("currentMonthName");
const currentMonthBadgeEl = document.getElementById("currentMonthBadge");

// DOM: Budjet va Dashboard elementlari
const budgetAmountEl = document.getElementById("budgetAmount");
const budgetIncomeSubEl = document.getElementById("budgetIncomeSub");
const totalAmountEl = document.getElementById("totalAmount");
const totalCountEl = document.getElementById("totalCount");
const balanceAmountEl = document.getElementById("balanceAmount");
const balanceCardEl = document.getElementById("balanceCard");
const balanceFooterEl = document.getElementById("balanceFooter");
const budgetStatusBadgeEl = document.getElementById("budgetStatusBadge");
const budgetProgressBarEl = document.getElementById("budgetProgressBar");
const budgetProgressTextEl = document.getElementById("budgetProgressText");
const categoriesGridEl = document.getElementById("categoriesGrid");
const recentListPreviewEl = document.getElementById("recentListPreview");

// DOM: Yozuv qo'shish formasi
const typeExpenseBtn = document.getElementById("typeExpenseBtn");
const typeIncomeBtn = document.getElementById("typeIncomeBtn");
const formPageTitle = document.getElementById("formPageTitle");
const formPageSub = document.getElementById("formPageSub");
const expenseTemplates = document.getElementById("expenseTemplates");
const incomeTemplates = document.getElementById("incomeTemplates");

const expenseForm = document.getElementById("expenseForm");
const entryTypeInput = document.getElementById("entryType");
const expenseAmount = document.getElementById("expenseAmount");
const expenseTitle = document.getElementById("expenseTitle");
const expenseCategory = document.getElementById("expenseCategory");
const expenseDate = document.getElementById("expenseDate");
const submitBtn = document.getElementById("submitBtn");
const submitBtnText = document.getElementById("submitBtnText");
const amountLabel = document.getElementById("amountLabel");
const titleLabel = document.getElementById("titleLabel");

// DOM: Tarix va filtrlar
const expenseListEl = document.getElementById("expenseList");
const emptyStateEl = document.getElementById("emptyState");
const emptyStateText = document.getElementById("emptyStateText");
const clearAllBtn = document.getElementById("clearAllBtn");
const historySubTextEl = document.getElementById("historySubText");
const filterChips = document.querySelectorAll(".filter-chip");

// DOM: Modal va Toast
const budgetModal = document.getElementById("budgetModal");
const openBudgetModalBtn = document.getElementById("openBudgetModalBtn");
const closeBudgetModalBtn = document.getElementById("closeBudgetModalBtn");
const cancelBudgetBtn = document.getElementById("cancelBudgetBtn");
const budgetForm = document.getElementById("budgetForm");
const budgetInput = document.getElementById("budgetInput");
const toastEl = document.getElementById("toastNotification");

// Dastur holati (State)
const today = new Date();
let viewingYear = today.getFullYear();
let viewingMonth = today.getMonth(); // 0-11
let currentFormType = "expense"; // "expense" yoki "income"
let currentFilter = "all";

let transactions = loadTransactions();
let familyBudget = loadBudget();

// ====================================================================
// LOCALSTORAGE BILAN ISHLASH
// ====================================================================

/**
 * LocalStorage xotirasidan yozuvlarni yuklash
 * @returns {Array} Tranzaksiyalar ro'yxati
 */
function loadTransactions() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data !== null) {
      const parsed = JSON.parse(data);
      // Eski formatdagi ma'lumotlarga type: 'expense' qo'shib olish
      return parsed.map(item => ({
        type: item.type || "expense",
        ...item
      }));
    }
    
    // Namunaviy dastlabki ma'lumotlar (Joriy oy uchun)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const initialSamples = [
      {
        id: "sample-1",
        type: "income",
        title: "Oylik maosh",
        amount: 4500000,
        category: "Oylik maosh",
        date: new Date(currentYear, currentMonth, 5, 10, 0).toISOString()
      },
      {
        id: "sample-2",
        type: "expense",
        title: "Haftalik oziq-ovqat bozorligi",
        amount: 420000,
        category: "Oziq-ovqat",
        date: new Date(currentYear, currentMonth, 10, 14, 30).toISOString()
      },
      {
        id: "sample-3",
        type: "expense",
        title: "Kommunal to‘lovlar (Elektr, Gaz)",
        amount: 180000,
        category: "Kommunal",
        date: new Date(currentYear, currentMonth, 15, 11, 20).toISOString()
      },
      {
        id: "sample-4",
        type: "expense",
        title: "Kitoblar va o‘quv qurollari",
        amount: 165000,
        category: "Ta'lim",
        date: new Date(currentYear, currentMonth, 20, 16, 45).toISOString()
      }
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSamples));
    return initialSamples;
  } catch (error) {
    console.error("LocalStorage ma'lumotlarini yuklashda xatolik:", error);
    return [];
  }
}

/**
 * Yozuvlarni LocalStorage-ga saqlash
 */
function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error("LocalStorage-ga yozishda xatolik:", error);
  }
}

/**
 * Oila budjetini LocalStorage-dan o'qib olish
 * @returns {number}
 */
function loadBudget() {
  try {
    const saved = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (saved !== null) {
      const parsed = parseFloat(saved);
      return !isNaN(parsed) && parsed >= 0 ? parsed : DEFAULT_BUDGET;
    }
    localStorage.setItem(BUDGET_STORAGE_KEY, DEFAULT_BUDGET.toString());
    return DEFAULT_BUDGET;
  } catch (error) {
    return DEFAULT_BUDGET;
  }
}

/**
 * Yangilangan budjetni saqlash
 * @param {number} amount 
 */
function saveBudget(amount) {
  try {
    localStorage.setItem(BUDGET_STORAGE_KEY, amount.toString());
  } catch (error) {
    console.error("Budjetni saqlashda xatolik:", error);
  }
}

// ====================================================================
// YORDAMCHI VA FORMATLASH FUNKSIYALARI
// ====================================================================

function formatCurrency(num) {
  if (isNaN(num) || num === null) return "0 so‘m";
  const formatted = Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${formatted} so‘m`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}.${month}, ${hours}:${minutes}`;
}

function getCategoryKey(categoryName) {
  const allCats = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  const found = allCats.find(c => c.name === categoryName);
  return found ? found.key : "boshqa";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function showToast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2200);
}

// ====================================================================
// OYLIK NAVIGATSIYA BOSHQARUVI (MONTH SWITCHER)
// ====================================================================

function updateMonthDisplay() {
  currentMonthNameEl.textContent = `${UZBEK_MONTHS[viewingMonth]} ${viewingYear}`;

  const isCurrentMonth = (viewingYear === today.getFullYear() && viewingMonth === today.getMonth());
  currentMonthBadgeEl.style.display = isCurrentMonth ? "inline-block" : "none";
}

function handlePrevMonth() {
  viewingMonth--;
  if (viewingMonth < 0) {
    viewingMonth = 11;
    viewingYear--;
  }
  updateMonthDisplay();
  updateDashboard();
  renderExpenseList();
}

function handleNextMonth() {
  viewingMonth++;
  if (viewingMonth > 11) {
    viewingMonth = 0;
    viewingYear++;
  }
  updateMonthDisplay();
  updateDashboard();
  renderExpenseList();
}

prevMonthBtn.addEventListener("click", handlePrevMonth);
nextMonthBtn.addEventListener("click", handleNextMonth);

/**
 * Faqat hozir tanlangan oyga tegishli yozuvlarni ajratib olish
 * @returns {Array}
 */
function getViewingMonthTransactions() {
  return transactions.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate.getFullYear() === viewingYear && itemDate.getMonth() === viewingMonth;
  });
}

// ====================================================================
// SAHIFALARNI BOSHQARISH (MOBILE TABS ROUTING)
// ====================================================================

function switchTab(targetTab) {
  navItems.forEach(item => {
    if (item.getAttribute("data-tab") === targetTab) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  tabPages.forEach(page => {
    if (page.id === `tab-${targetTab}`) {
      page.classList.add("active");
    } else {
      page.classList.remove("active");
    }
  });

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (targetTab === "add") {
    // Standart bugungi sanani inputga o'rnatish
    const nowStr = new Date().toISOString().split("T")[0];
    expenseDate.value = nowStr;
    setTimeout(() => expenseAmount.focus(), 150);
  }
}

navItems.forEach(item => {
  item.addEventListener("click", () => {
    const tabName = item.getAttribute("data-tab");
    if (tabName) switchTab(tabName);
  });
});

if (btnSeeAllHistory) {
  btnSeeAllHistory.addEventListener("click", () => switchTab("history"));
}

if (btnShortcutAdd) {
  btnShortcutAdd.addEventListener("click", () => switchTab("add"));
}

// "+ Kirim" tezkor tugmasi bosilganda to'g'ridan-to'g'ri Kirim qo'shish sahifasiga o'tish
if (btnQuickIncome) {
  btnQuickIncome.addEventListener("click", () => {
    setFormType("income");
    switchTab("add");
  });
}

// ====================================================================
// KIRIM / CHIQIM FORMASINI BOSHQARISH
// ====================================================================

function populateCategoryOptions(type) {
  expenseCategory.innerHTML = "";
  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat.name;
    opt.textContent = cat.name;
    expenseCategory.appendChild(opt);
  });
}

function setFormType(type) {
  currentFormType = type;
  entryTypeInput.value = type;

  if (type === "expense") {
    typeExpenseBtn.classList.add("active");
    typeIncomeBtn.classList.remove("active");

    formPageTitle.textContent = "Yangi xarajat kiritish";
    formPageSub.textContent = "Oila sarf-xarajati tafsilotlarini kiriting";
    amountLabel.textContent = "Xarajat summasi";
    titleLabel.textContent = "Xarajat nomi yoki maqsadi";
    expenseTitle.placeholder = "Masalan: Bozorlik, Go'sht, Dorilar...";
    submitBtnText.textContent = "+ Xarajatni saqlash";
    submitBtn.classList.remove("btn-income-mode");

    expenseTemplates.style.display = "block";
    incomeTemplates.style.display = "none";
    populateCategoryOptions("expense");
  } else {
    typeIncomeBtn.classList.add("active");
    typeExpenseBtn.classList.remove("active");

    formPageTitle.textContent = "Budjetga pul kiritish (Kirim)";
    formPageSub.textContent = "Oylik maosh, pensiya yoki boshqa daromadni kiritish";
    amountLabel.textContent = "Kirim summasi";
    titleLabel.textContent = "Daromad manbasi yoki nomi";
    expenseTitle.placeholder = "Masalan: Oylik maosh, Pensiya, Mukofot...";
    submitBtnText.textContent = "+ Budjetga qo‘shish";
    submitBtn.classList.add("btn-income-mode");

    incomeTemplates.style.display = "block";
    expenseTemplates.style.display = "none";
    populateCategoryOptions("income");
  }
}

typeExpenseBtn.addEventListener("click", () => setFormType("expense"));
typeIncomeBtn.addEventListener("click", () => setFormType("income"));

// Ota-onalar uchun tezkor shablon tugmachalarini bosish hodisasi
document.querySelectorAll(".template-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    const chipTitle = chip.getAttribute("data-title");
    const chipCat = chip.getAttribute("data-cat");

    if (chipTitle) expenseTitle.value = chipTitle;
    if (chipCat) expenseCategory.value = chipCat;

    expenseAmount.focus();
    showToast(`Tanlandi: ${chipTitle}`);
  });
});

// ====================================================================
// MA'LUMOTLARNI CHIZISH (DASHBOARD & SUMMARY)
// ====================================================================

function updateDashboard() {
  const monthItems = getViewingMonthTransactions();

  // 1. Shu oydagi jami xarajatlar va jami kirimlar
  const monthExpenses = monthItems
    .filter(i => i.type === "expense")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const monthIncomes = monthItems
    .filter(i => i.type === "income")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const expenseCount = monthItems.filter(i => i.type === "expense").length;

  // 2. Oila budjeti: Asosiy reja + Shu oydagi barcha qo'shilgan kirimlar
  const effectiveBudget = familyBudget + monthIncomes;
  const balance = effectiveBudget - monthExpenses;

  budgetAmountEl.textContent = formatCurrency(effectiveBudget);
  budgetIncomeSubEl.textContent = `Reja: ${formatCurrency(familyBudget)} | +Kirim: ${formatCurrency(monthIncomes)}`;

  totalAmountEl.textContent = formatCurrency(monthExpenses);
  totalCountEl.textContent = `${expenseCount} ta chiqim`;

  // 3. Qoldiq mablag'
  if (balance < 0) {
    const deficit = Math.abs(balance);
    balanceAmountEl.textContent = `-${formatCurrency(deficit)}`;
    balanceAmountEl.className = "summary-card-value text-danger";
    balanceCardEl.classList.add("danger-balance");
    balanceFooterEl.textContent = "Budjet chegarasidan oshdi!";
  } else {
    balanceAmountEl.textContent = formatCurrency(balance);
    balanceAmountEl.className = "summary-card-value text-success";
    balanceCardEl.classList.remove("danger-balance");
    balanceFooterEl.textContent = "Hamyondagi sof qoldiq";
  }

  // 4. Progress bar
  const percentUsed = effectiveBudget > 0 ? (monthExpenses / effectiveBudget) * 100 : (monthExpenses > 0 ? 100 : 0);
  const roundedPercent = Math.round(percentUsed);
  const barWidth = Math.min(Math.max(roundedPercent, 0), 100);

  budgetProgressBarEl.style.width = `${barWidth}%`;
  budgetProgressTextEl.textContent = `${roundedPercent}% sarflandi`;

  if (percentUsed >= 100) {
    budgetStatusBadgeEl.textContent = "Oshib ketdi";
    budgetStatusBadgeEl.className = "badge-status status-danger";
    budgetProgressBarEl.className = "progress-fill fill-danger";
  } else if (percentUsed >= 75) {
    budgetStatusBadgeEl.textContent = "Diqqat";
    budgetStatusBadgeEl.className = "badge-status status-warning";
    budgetProgressBarEl.className = "progress-fill fill-warning";
  } else {
    budgetStatusBadgeEl.textContent = "Me'yorda";
    budgetStatusBadgeEl.className = "badge-status status-safe";
    budgetProgressBarEl.className = "progress-fill";
  }

  // 5. Kategoriyalar sarhisobi (Shu oydagi xarajatlar bo'yicha)
  const categoryTotals = {};
  EXPENSE_CATEGORIES.forEach(c => { categoryTotals[c.name] = 0; });

  monthItems.filter(i => i.type === "expense").forEach(item => {
    if (categoryTotals.hasOwnProperty(item.category)) {
      categoryTotals[item.category] += Number(item.amount);
    } else {
      categoryTotals["Boshqa"] = (categoryTotals["Boshqa"] || 0) + Number(item.amount);
    }
  });

  categoriesGridEl.innerHTML = "";
  EXPENSE_CATEGORIES.forEach(cat => {
    const amount = categoryTotals[cat.name] || 0;
    const percentage = monthExpenses > 0 ? Math.round((amount / monthExpenses) * 100) : 0;

    const card = document.createElement("div");
    card.className = "cat-card";
    card.innerHTML = `
      <div class="cat-card-header">
        <span class="cat-name">${cat.name}</span>
        <span class="cat-dot dot-${cat.key}"></span>
      </div>
      <div class="cat-amount">${formatCurrency(amount)}</div>
      <div class="cat-percent">${percentage}% ulush</div>
    `;
    categoriesGridEl.appendChild(card);
  });

  // 6. So'nggi yozuvlar qisqa bloki
  renderRecentPreview(monthItems);
}

function renderRecentPreview(monthItems) {
  if (!recentListPreviewEl) return;
  recentListPreviewEl.innerHTML = "";

  const recentThree = monthItems.slice(0, 3);

  if (recentThree.length === 0) {
    recentListPreviewEl.innerHTML = `
      <li style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 8px 0;">
        Ushbu oyda hali xarajatlar yo‘q
      </li>
    `;
    return;
  }

  recentThree.forEach(item => {
    const li = document.createElement("li");
    li.className = "recent-item";

    const isIncome = item.type === "income";
    const amountClass = isIncome ? "recent-amount recent-amount-income" : "recent-amount";
    const prefix = isIncome ? "+ " : "";

    li.innerHTML = `
      <div class="recent-item-info">
        <span class="recent-title">${isIncome ? "🟢 " : ""}${escapeHtml(item.title)}</span>
        <span class="recent-cat">${item.category} • ${formatDate(item.date)}</span>
      </div>
      <span class="${amountClass}">${prefix}${formatCurrency(item.amount)}</span>
    `;
    recentListPreviewEl.appendChild(li);
  });
}

// ====================================================================
// TARIX VA RO'YXATNI CHIZISH (HISTORY)
// ====================================================================

function renderExpenseList() {
  expenseListEl.innerHTML = "";
  const monthItems = getViewingMonthTransactions();

  // Filtr mezonlari
  let filtered = monthItems;
  if (currentFilter === "only-expenses") {
    filtered = monthItems.filter(i => i.type === "expense");
  } else if (currentFilter === "only-incomes") {
    filtered = monthItems.filter(i => i.type === "income");
  } else if (currentFilter.startsWith("cat-")) {
    const catName = currentFilter.replace("cat-", "");
    filtered = monthItems.filter(i => i.category === catName);
  }

  const monthLabel = `${UZBEK_MONTHS[viewingMonth]} ${viewingYear}`;
  historySubTextEl.textContent = `${monthLabel}: ${filtered.length} ta yozuv`;

  if (filtered.length === 0) {
    emptyStateEl.style.display = "block";
    emptyStateText.textContent = `${monthLabel} oyi uchun mos yozuvlar topilmadi.`;
    clearAllBtn.style.display = "none";
    return;
  }

  emptyStateEl.style.display = "none";
  clearAllBtn.style.display = "inline-block";

  filtered.forEach(item => {
    const li = document.createElement("li");
    const isIncome = item.type === "income";
    li.className = isIncome ? "expense-item item-income" : "expense-item";

    const catKey = getCategoryKey(item.category);
    const badgeClass = isIncome ? "item-badge item-badge-income" : `item-badge cat-badge-${catKey}`;
    const amountClass = isIncome ? "item-amount item-amount-income" : "item-amount";
    const prefix = isIncome ? "+" : "";

    li.innerHTML = `
      <div class="item-left">
        <span class="${badgeClass}">
          ${isIncome ? "KIRIM" : item.category}
        </span>
        <div class="item-details">
          <span class="item-title">${escapeHtml(item.title)}</span>
          <span class="item-date">${formatDate(item.date)}</span>
        </div>
      </div>
      <div class="item-right">
        <span class="${amountClass}">${prefix}${formatCurrency(item.amount)}</span>
        <button 
          type="button" 
          class="btn-delete" 
          title="O‘chirish"
          data-id="${item.id}"
          aria-label="Yozuvni o‘chirish"
        >
          ✕
        </button>
      </div>
    `;

    expenseListEl.appendChild(li);
  });
}

// ====================================================================
// YOZUV QO'SHISH VA O'CHIRISH
// ====================================================================

function handleAddTransaction(event) {
  event.preventDefault();

  const titleVal = expenseTitle.value.trim();
  const amountVal = parseFloat(expenseAmount.value);
  const categoryVal = expenseCategory.value;
  const dateVal = expenseDate.value;

  if (isNaN(amountVal) || amountVal <= 0) {
    showToast("Iltimos, to‘g‘ri summa kiriting!");
    expenseAmount.focus();
    return;
  }

  if (!titleVal) {
    showToast(currentFormType === "income" ? "Iltimos, daromad manbasini kiriting!" : "Iltimos, xarajat nomini kiriting!");
    expenseTitle.focus();
    return;
  }

  // Tanlangan sana yoki hozirgi vaqt
  let finalDate = new Date();
  if (dateVal) {
    const pickedDate = new Date(dateVal);
    if (!isNaN(pickedDate.getTime())) {
      finalDate = pickedDate;
      // Hozirgi soat va daqiqani saqlab qolish
      finalDate.setHours(today.getHours(), today.getMinutes());
    }
  }

  const newEntry = {
    id: Date.now().toString(),
    type: currentFormType,
    title: titleVal,
    amount: amountVal,
    category: categoryVal,
    date: finalDate.toISOString()
  };

  transactions.unshift(newEntry);
  saveTransactions();

  // Agar kiritilgan sana hozirgi ko'rib turilgan oy bo'lmasa, o'sha oyga o'tkazish
  viewingYear = finalDate.getFullYear();
  viewingMonth = finalDate.getMonth();
  updateMonthDisplay();

  updateDashboard();
  renderExpenseList();

  // Formani tozalash
  expenseForm.reset();
  setFormType(currentFormType); // Qayta reset qilinganda kategoriyani to'g'ri tiklash

  showToast(currentFormType === "income" ? "Kirim qo‘shildi! 🟢" : "Xarajat saqlandi! ✓");

  setTimeout(() => {
    switchTab("dashboard");
  }, 400);
}

function deleteTransaction(id) {
  transactions = transactions.filter(item => item.id !== id);
  saveTransactions();
  updateDashboard();
  renderExpenseList();
  showToast("Yozuv o‘chirildi");
}

function handleClearAllCurrentMonth() {
  const monthItems = getViewingMonthTransactions();
  if (monthItems.length === 0) return;

  const monthLabel = `${UZBEK_MONTHS[viewingMonth]} ${viewingYear}`;
  const isConfirmed = confirm(`${monthLabel} oyi uchun kiritilgan barcha yozuvlarni tozalashni xohlaysizmi?`);

  if (isConfirmed) {
    const idsToRemove = new Set(monthItems.map(i => i.id));
    transactions = transactions.filter(i => !idsToRemove.has(i.id));
    saveTransactions();
    updateDashboard();
    renderExpenseList();
    showToast(`${monthLabel} yozuvlari tozalandi`);
  }
}

// Hodisalarni ulash
expenseForm.addEventListener("submit", handleAddTransaction);
clearAllBtn.addEventListener("click", handleClearAllCurrentMonth);

expenseListEl.addEventListener("click", (e) => {
  const deleteBtn = e.target.closest(".btn-delete");
  if (deleteBtn) {
    const id = deleteBtn.getAttribute("data-id");
    if (id) deleteTransaction(id);
  }
});

// Tarixdagi filtr tugmalari
filterChips.forEach(chip => {
  chip.addEventListener("click", () => {
    filterChips.forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    currentFilter = chip.getAttribute("data-filter") || "all";
    renderExpenseList();
  });
});

// ====================================================================
// BUDJET MODALINI BOSHQARISH
// ====================================================================

function setupBudgetModal() {
  const openButtons = document.querySelectorAll("#openBudgetModalBtn");
  
  openButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      budgetInput.value = familyBudget;
      budgetModal.showModal();
      budgetInput.focus();
    });
  });

  if (closeBudgetModalBtn) {
    closeBudgetModalBtn.addEventListener("click", () => budgetModal.close());
  }

  if (cancelBudgetBtn) {
    cancelBudgetBtn.addEventListener("click", () => budgetModal.close());
  }

  budgetModal.addEventListener("click", (e) => {
    const rect = budgetModal.getBoundingClientRect();
    const isInDialog = (
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width
    );
    if (!isInDialog) {
      budgetModal.close();
    }
  });

  if (budgetForm) {
    budgetForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const newBudget = parseFloat(budgetInput.value);

      if (isNaN(newBudget) || newBudget < 0) {
        showToast("To‘g‘ri summa kiriting!");
        return;
      }

      familyBudget = newBudget;
      saveBudget(familyBudget);
      updateDashboard();
      budgetModal.close();
      showToast("Oylik reja saqlandi! ✓");
    });
  }
}

// ====================================================================
// DASTURNI DASTLABKI ISHGA TUSHIRISH (INIT)
// ====================================================================

setupBudgetModal();
setFormType("expense");
updateMonthDisplay();
updateDashboard();
renderExpenseList();
