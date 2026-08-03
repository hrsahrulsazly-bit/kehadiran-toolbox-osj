(function () {
  if (window.applyPlugin && window.jspdf && window.jspdf.jsPDF) {
    window.applyPlugin(window.jspdf.jsPDF);
  }

  const VIEWS = {
    kehadiran: ViewKehadiran,
    pekerja: ViewPekerja,
    bulanan: ViewBulanan,
    laporan: ViewLaporan
  };

  const viewContainer = document.getElementById("view-container");
  const navButtons = document.querySelectorAll(".nav-btn");

  function showView(name) {
    if (!VIEWS[name]) return;
    navButtons.forEach((b) => b.classList.toggle("active", b.getAttribute("data-view") === name));
    viewContainer.innerHTML = "";
    VIEWS[name].render(viewContainer);
    localStorage.setItem("tbosj_last_view", name);
  }

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.getAttribute("data-view")));
  });

  const lastView = localStorage.getItem("tbosj_last_view");
  showView(lastView && VIEWS[lastView] ? lastView : "kehadiran");
})();
