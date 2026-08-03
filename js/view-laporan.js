const ViewLaporan = (() => {
  const state = { mode: "HARIAN", date: Utils.todayStr(), yearMonth: Utils.currentYearMonth() };

  function render(container) {
    container.innerHTML = `
      <div class="seg-control" style="margin-bottom:12px;">
        <button data-mode="HARIAN" class="${state.mode === "HARIAN" ? "active" : ""}">Laporan Harian</button>
        <button data-mode="BULANAN" class="${state.mode === "BULANAN" ? "active" : ""}">Laporan Bulanan</button>
      </div>
      <div class="card" id="lp-picker"></div>
      <div class="card" id="lp-preview"></div>
      <div class="controls-row">
        <button class="btn btn-primary" id="lp-export-pdf">📄 Muat Turun PDF</button>
        <button class="btn btn-accent" id="lp-export-xlsx">📊 Muat Turun Excel</button>
      </div>
    `;

    container.querySelectorAll(".seg-control button").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.mode = btn.getAttribute("data-mode");
        render(container);
      });
    });

    container.querySelector("#lp-export-pdf").addEventListener("click", () => exportPDF());
    container.querySelector("#lp-export-xlsx").addEventListener("click", () => exportExcel());

    renderPicker(container);
    renderPreview(container);
  }

  function renderPicker(container) {
    const pickerEl = container.querySelector("#lp-picker");
    if (state.mode === "HARIAN") {
      pickerEl.innerHTML = `
        <div class="field-row" style="margin-bottom:0;">
          <label>Pilih Tarikh Perjumpaan</label>
          <input type="date" id="lp-date" class="input" value="${state.date}">
        </div>
      `;
      pickerEl.querySelector("#lp-date").addEventListener("change", (e) => {
        state.date = e.target.value || Utils.todayStr();
        renderPreview(container);
      });
    } else {
      pickerEl.innerHTML = `
        <div class="field-row" style="margin-bottom:0;">
          <label>Pilih Bulan</label>
          <input type="month" id="lp-month" class="input" value="${state.yearMonth}">
        </div>
      `;
      pickerEl.querySelector("#lp-month").addEventListener("change", (e) => {
        state.yearMonth = e.target.value || Utils.currentYearMonth();
        renderPreview(container);
      });
    }
  }

  function getHarianData(date) {
    const employees = Store.getActiveEmployees();
    const attendance = Store.getAttendanceForDate(date);
    const byEmp = new Map(attendance.map((a) => [a.employeeId, a]));
    return employees.map((e, idx) => {
      const rec = byEmp.get(e.id);
      return {
        bil: idx + 1,
        jawatan: e.jawatan || "",
        nama: e.nama,
        hadir: rec && rec.status === "HADIR" ? "/" : "",
        tidakHadir: rec && rec.status === "TIDAK HADIR" ? "/" : "",
        catatan: (rec && rec.catatan) || ""
      };
    });
  }

  function getBulananData(yearMonth) {
    const dates = Store.getDatesInMonth(yearMonth);
    const employees = Store.getActiveEmployees();
    const attendance = Store.getAttendance();
    const rows = employees.map((e, idx) => {
      let hadir = 0, tidak = 0;
      dates.forEach((d) => {
        const rec = attendance.find((a) => a.employeeId === e.id && a.date === d);
        if (rec && rec.status === "HADIR") hadir++;
        else if (rec && rec.status === "TIDAK HADIR") tidak++;
      });
      const recorded = hadir + tidak;
      const pct = recorded ? Math.round((hadir / recorded) * 100) : 0;
      return { bil: idx + 1, jawatan: e.jawatan || "", nama: e.nama, hadir, tidak, pct };
    });
    return { dates, rows };
  }

  function renderPreview(container) {
    const previewEl = container.querySelector("#lp-preview");
    if (state.mode === "HARIAN") {
      const data = getHarianData(state.date);
      previewEl.innerHTML = `
        <div class="report-title">PERJUMPAAN TOOLBOX OPERASI SUBANG JAYA 2026</div>
        <div class="report-meta">HARI: <b>${Utils.hariFromDateStr(state.date)}</b> &nbsp;•&nbsp; TARIKH: <b>${Utils.displayDate(state.date)}</b></div>
        <div class="table-scroll">
          <table class="report-table">
            <thead><tr><th>BIL</th><th>JAWATAN</th><th>NAMA</th><th>HADIR</th><th>TIDAK HADIR</th><th>CATATAN</th></tr></thead>
            <tbody>
              ${data.map((r) => `
                <tr>
                  <td>${r.bil}</td><td>${Utils.escapeHtml(r.jawatan)}</td><td>${Utils.escapeHtml(r.nama)}</td>
                  <td style="text-align:center;">${r.hadir}</td><td style="text-align:center;">${r.tidakHadir}</td>
                  <td>${Utils.escapeHtml(r.catatan)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    } else {
      const { dates, rows } = getBulananData(state.yearMonth);
      previewEl.innerHTML = `
        <div class="report-title">LAPORAN KEHADIRAN BULANAN</div>
        <div class="report-meta">BULAN: <b>${Utils.displayYearMonth(state.yearMonth)}</b> &nbsp;•&nbsp; HARI PERJUMPAAN: <b>${dates.length}</b></div>
        ${dates.length === 0 ? `<div class="empty-state"><span class="icon">📭</span>Tiada rekod untuk bulan ini.</div>` : `
        <div class="table-scroll">
          <table class="report-table">
            <thead><tr><th>BIL</th><th>JAWATAN</th><th>NAMA</th><th>JUMLAH HADIR</th><th>JUMLAH TIDAK HADIR</th><th>% KEHADIRAN</th></tr></thead>
            <tbody>
              ${rows.map((r) => `
                <tr>
                  <td>${r.bil}</td><td>${Utils.escapeHtml(r.jawatan)}</td><td>${Utils.escapeHtml(r.nama)}</td>
                  <td style="text-align:center;">${r.hadir}</td><td style="text-align:center;">${r.tidak}</td>
                  <td style="text-align:center;">${r.pct}%</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>`}
      `;
    }
  }

  function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    if (state.mode === "HARIAN") {
      const data = getHarianData(state.date);
      doc.setFontSize(13);
      doc.text("PERJUMPAAN TOOLBOX OPERASI SUBANG JAYA 2026", 105, 15, { align: "center" });
      doc.setFontSize(10);
      doc.text(`HARI: ${Utils.hariFromDateStr(state.date)}    TARIKH: ${Utils.displayDate(state.date)}`, 14, 23);
      doc.autoTable({
        startY: 28,
        head: [["BIL", "JAWATAN", "NAMA", "HADIR", "TIDAK HADIR", "CATATAN"]],
        body: data.map((r) => [r.bil, r.jawatan, r.nama, r.hadir, r.tidakHadir, r.catatan]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [18, 57, 92] },
        columnStyles: { 0: { cellWidth: 10 }, 3: { cellWidth: 16, halign: "center" }, 4: { cellWidth: 20, halign: "center" } }
      });
      doc.save(`Kehadiran_Harian_${state.date}.pdf`);
    } else {
      const { dates, rows } = getBulananData(state.yearMonth);
      doc.setFontSize(13);
      doc.text("LAPORAN KEHADIRAN BULANAN", 105, 15, { align: "center" });
      doc.setFontSize(10);
      doc.text(`BULAN: ${Utils.displayYearMonth(state.yearMonth)}    HARI PERJUMPAAN: ${dates.length}`, 14, 23);
      doc.autoTable({
        startY: 28,
        head: [["BIL", "JAWATAN", "NAMA", "JUMLAH HADIR", "JUMLAH TIDAK HADIR", "% KEHADIRAN"]],
        body: rows.map((r) => [r.bil, r.jawatan, r.nama, r.hadir, r.tidak, r.pct + "%"]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [18, 57, 92] }
      });
      doc.save(`Kehadiran_Bulanan_${state.yearMonth}.pdf`);
    }
    Utils.showToast("PDF dimuat turun");
  }

  function exportExcel() {
    const wb = XLSX.utils.book_new();
    if (state.mode === "HARIAN") {
      const data = getHarianData(state.date);
      const aoa = [
        ["PERJUMPAAN TOOLBOX OPERASI SUBANG JAYA 2026"],
        [],
        ["HARI", Utils.hariFromDateStr(state.date)],
        ["DATE", Utils.displayDate(state.date)],
        [],
        ["BIL", "JAWATAN", "NAMA", "HADIR", "TIDAK HADIR", "CATATAN"],
        ...data.map((r) => [r.bil, r.jawatan, r.nama, r.hadir, r.tidakHadir, r.catatan])
      ];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = [{ wch: 5 }, { wch: 20 }, { wch: 32 }, { wch: 8 }, { wch: 12 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, ws, "Kehadiran");
      XLSX.writeFile(wb, `Kehadiran_Harian_${state.date}.xlsx`);
    } else {
      const { dates, rows } = getBulananData(state.yearMonth);
      const aoa = [
        ["LAPORAN KEHADIRAN BULANAN"],
        ["BULAN", Utils.displayYearMonth(state.yearMonth)],
        ["HARI PERJUMPAAN", dates.length],
        [],
        ["BIL", "JAWATAN", "NAMA", "JUMLAH HADIR", "JUMLAH TIDAK HADIR", "% KEHADIRAN"],
        ...rows.map((r) => [r.bil, r.jawatan, r.nama, r.hadir, r.tidak, r.pct + "%"])
      ];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = [{ wch: 5 }, { wch: 20 }, { wch: 32 }, { wch: 14 }, { wch: 16 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, ws, "Ringkasan Bulanan");
      XLSX.writeFile(wb, `Kehadiran_Bulanan_${state.yearMonth}.xlsx`);
    }
    Utils.showToast("Excel dimuat turun");
  }

  return { render };
})();
