const ViewBulanan = (() => {
  const state = { yearMonth: Utils.currentYearMonth(), search: "", kumpulan: "SEMUA" };

  function render(container) {
    container.innerHTML = `
      <div class="card">
        <div class="field-row" style="margin-bottom:0;">
          <label>Pilih Bulan</label>
          <input type="month" id="bl-month" class="input" value="${state.yearMonth}">
        </div>
      </div>
      <div class="controls-row">
        <input type="text" id="bl-search" class="input" placeholder="🔍 Cari nama..." value="${Utils.escapeHtml(state.search)}">
        <select id="bl-kumpulan" class="input">
          <option value="SEMUA">Semua Kumpulan</option>
          <option value="STAFF">Staff</option>
          <option value="PEMANDU">Pemandu</option>
        </select>
      </div>
      <div id="bl-content"></div>
    `;

    const monthInput = container.querySelector("#bl-month");
    const searchInput = container.querySelector("#bl-search");
    const kumpulanSelect = container.querySelector("#bl-kumpulan");
    kumpulanSelect.value = state.kumpulan;

    monthInput.addEventListener("change", () => {
      state.yearMonth = monthInput.value || Utils.currentYearMonth();
      renderContent(container);
    });
    searchInput.addEventListener("input", Utils.debounce(() => {
      state.search = searchInput.value;
      renderContent(container);
    }, 200));
    kumpulanSelect.addEventListener("change", () => {
      state.kumpulan = kumpulanSelect.value;
      renderContent(container);
    });

    renderContent(container);
  }

  function renderContent(container) {
    const contentEl = container.querySelector("#bl-content");
    const dates = Store.getDatesInMonth(state.yearMonth);

    if (dates.length === 0) {
      contentEl.innerHTML = `<div class="empty-state"><span class="icon">📭</span>Tiada rekod kehadiran untuk ${Utils.displayYearMonth(state.yearMonth)}.</div>`;
      return;
    }

    const employees = Utils.filterEmployees(Store.getActiveEmployees(), {
      search: state.search, kumpulan: state.kumpulan
    });
    const attendance = Store.getAttendance();

    function recordFor(empId, date) {
      return attendance.find((a) => a.employeeId === empId && a.date === date);
    }

    let totalHadir = 0, totalTidak = 0;

    const rows = employees.map((e) => {
      let hadir = 0, tidak = 0;
      const cells = dates.map((d) => {
        const rec = recordFor(e.id, d);
        if (rec && rec.status === "HADIR") { hadir++; return { d, cls: "cell-h", label: "H", rec }; }
        if (rec && rec.status === "TIDAK HADIR") { tidak++; return { d, cls: "cell-t", label: "T", rec }; }
        return { d, cls: "cell-empty", label: "-", rec: null };
      });
      totalHadir += hadir;
      totalTidak += tidak;
      const totalRecorded = hadir + tidak;
      const pct = totalRecorded ? Math.round((hadir / totalRecorded) * 100) : 0;
      return { emp: e, cells, hadir, tidak, pct };
    });

    contentEl.innerHTML = `
      <div class="stat-row">
        <div class="stat-box"><div class="num">${dates.length}</div><div class="lbl">Hari Perjumpaan</div></div>
        <div class="stat-box"><div class="num">${totalHadir}</div><div class="lbl">Jumlah Hadir</div></div>
        <div class="stat-box"><div class="num">${totalTidak}</div><div class="lbl">Jumlah Tidak Hadir</div></div>
      </div>
      <div class="table-scroll">
        <table class="grid-table">
          <thead>
            <tr>
              <th class="name-col">Nama</th>
              ${dates.map((d) => `<th title="${Utils.displayDate(d)}${Store.getLokasi(d) ? " - " + Store.getLokasi(d) : ""}">${Utils.dayOnly(d)}</th>`).join("")}
              <th>Hadir</th>
              <th>Tidak</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((r) => `
              <tr>
                <td class="name-col">${Utils.escapeHtml(r.emp.nama)}<br><span style="color:var(--text-muted);font-weight:400;">${Utils.escapeHtml(r.emp.jawatan || "")}</span></td>
                ${r.cells.map((c) => `<td class="${c.cls}" data-emp="${r.emp.id}" data-date="${c.d}">${c.label}</td>`).join("")}
                <td>${r.hadir}</td>
                <td>${r.tidak}</td>
                <td>${r.pct}%</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    contentEl.querySelectorAll("td.cell-h, td.cell-t").forEach((cell) => {
      cell.addEventListener("click", () => {
        const empId = cell.getAttribute("data-emp");
        const date = cell.getAttribute("data-date");
        const emp = employees.find((e) => e.id === empId);
        const rec = recordFor(empId, date);
        showDetail(emp, date, rec);
      });
    });
  }

  function showDetail(emp, date, rec) {
    const statusLabel = rec && rec.status ? rec.status : "Tiada rekod";
    const statusColor = rec && rec.status === "HADIR" ? "var(--green)" : rec && rec.status === "TIDAK HADIR" ? "var(--red)" : "var(--text-muted)";
    Utils.openModal(`
      <h3>${Utils.escapeHtml(emp.nama)}</h3>
      <div class="field-row"><label>Jawatan</label>${Utils.escapeHtml(emp.jawatan || "-")}</div>
      <div class="field-row"><label>Tarikh</label>${Utils.displayDate(date)} (${Utils.hariFromDateStr(date)})</div>
      <div class="field-row"><label>Lokasi</label>${Utils.escapeHtml(Store.getLokasi(date) || "-")}</div>
      <div class="field-row"><label>Status</label><span style="color:${statusColor};font-weight:700;">${statusLabel}</span></div>
      <div class="field-row"><label>Catatan</label>${Utils.escapeHtml((rec && rec.catatan) || "-")}</div>
      <div class="modal-close-row">
        <button class="btn btn-primary" id="modal-close-btn">Tutup</button>
      </div>
    `);
    document.getElementById("modal-close-btn").addEventListener("click", Utils.closeModal);
  }

  return { render };
})();
