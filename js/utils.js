const Utils = (() => {
  const HARI_MS = ["AHAD", "ISNIN", "SELASA", "RABU", "KHAMIS", "JUMAAT", "SABTU"];
  const BULAN_MS = [
    "Januari", "Februari", "Mac", "April", "Mei", "Jun",
    "Julai", "Ogos", "September", "Oktober", "November", "Disember"
  ];

  function todayStr() {
    return formatDateInput(new Date());
  }

  function formatDateInput(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function parseDateStr(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function hariFromDateStr(dateStr) {
    return HARI_MS[parseDateStr(dateStr).getDay()];
  }

  function displayDate(dateStr) {
    const d = parseDateStr(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  }

  function currentYearMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  function displayYearMonth(yearMonth) {
    const [y, m] = yearMonth.split("-").map(Number);
    return `${BULAN_MS[m - 1]} ${y}`;
  }

  function dayOnly(dateStr) {
    return parseInt(dateStr.split("-")[2], 10);
  }

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function filterEmployees(employees, { search, kumpulan }) {
    let list = employees;
    if (kumpulan && kumpulan !== "SEMUA") {
      list = list.filter((e) => e.kumpulan === kumpulan);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (e) => e.nama.toLowerCase().includes(q) || (e.jawatan || "").toLowerCase().includes(q)
      );
    }
    return list;
  }

  let toastTimer = null;
  function showToast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
  }

  function openModal(innerHtml) {
    const root = document.getElementById("modal-root");
    root.innerHTML = `<div class="modal-overlay" id="modal-overlay"><div class="modal-sheet">${innerHtml}</div></div>`;
    const overlay = document.getElementById("modal-overlay");
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  function closeModal() {
    document.getElementById("modal-root").innerHTML = "";
  }

  function debounce(fn, wait) {
    let t = null;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  return {
    HARI_MS, BULAN_MS,
    todayStr, formatDateInput, parseDateStr, hariFromDateStr, displayDate,
    currentYearMonth, displayYearMonth, dayOnly,
    escapeHtml, filterEmployees,
    showToast, openModal, closeModal, debounce, downloadBlob
  };
})();
