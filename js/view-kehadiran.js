const ViewKehadiran = (() => {
  const state = { date: Utils.todayStr(), search: "", kumpulan: "SEMUA" };

  function render(container) {
    container.innerHTML = `
      <div class="card">
        <div class="controls-row">
          <div class="field-row" style="margin-bottom:0;">
            <label>Tarikh Perjumpaan</label>
            <input type="date" id="att-date" class="input" value="${state.date}">
          </div>
        </div>
        <div class="field-row" style="margin-bottom:0;">
          <label>Lokasi Perjumpaan</label>
          <input type="text" id="att-lokasi" class="input" placeholder="Taip lokasi (contoh: Tapak Kerja PLUS KM12)">
        </div>
        <div class="report-meta" id="att-hari-label"></div>
      </div>

      <div class="summary-bar" id="att-summary"></div>

      <div class="controls-row">
        <input type="text" id="att-search" class="input" placeholder="🔍 Cari nama / jawatan..." value="${Utils.escapeHtml(state.search)}">
        <select id="att-kumpulan" class="input">
          <option value="SEMUA">Semua Kumpulan</option>
          <option value="STAFF">Staff</option>
          <option value="PEMANDU">Pemandu</option>
        </select>
      </div>

      <div id="att-list"></div>
    `;

    const dateInput = container.querySelector("#att-date");
    const lokasiInput = container.querySelector("#att-lokasi");
    const searchInput = container.querySelector("#att-search");
    const kumpulanSelect = container.querySelector("#att-kumpulan");
    kumpulanSelect.value = state.kumpulan;
    lokasiInput.value = Store.getLokasi(state.date);

    dateInput.addEventListener("change", () => {
      state.date = dateInput.value || Utils.todayStr();
      lokasiInput.value = Store.getLokasi(state.date);
      renderDynamic(container);
    });
    lokasiInput.addEventListener("input", Utils.debounce(() => {
      Store.setLokasi(state.date, lokasiInput.value);
      Utils.showToast("Lokasi disimpan");
    }, 500));
    searchInput.addEventListener("input", Utils.debounce(() => {
      state.search = searchInput.value;
      renderList(container);
    }, 200));
    kumpulanSelect.addEventListener("change", () => {
      state.kumpulan = kumpulanSelect.value;
      renderList(container);
    });

    renderDynamic(container);
  }

  function renderDynamic(container) {
    container.querySelector("#att-hari-label").textContent =
      `Hari: ${Utils.hariFromDateStr(state.date)}  •  ${Utils.displayDate(state.date)}`;
    renderSummary(container);
    renderList(container);
  }

  function renderSummary(container) {
    const employees = Store.getActiveEmployees();
    const records = Store.getAttendanceForDate(state.date);
    const byEmp = new Map(records.map((r) => [r.employeeId, r]));
    let hadir = 0, tidak = 0;
    employees.forEach((e) => {
      const r = byEmp.get(e.id);
      if (r && r.status === "HADIR") hadir++;
      else if (r && r.status === "TIDAK HADIR") tidak++;
    });
    const belum = employees.length - hadir - tidak;
    container.querySelector("#att-summary").innerHTML = `
      <div class="summary-chip chip-green"><span class="num">${hadir}</span>Hadir</div>
      <div class="summary-chip chip-red"><span class="num">${tidak}</span>Tidak Hadir</div>
      <div class="summary-chip chip-gray"><span class="num">${belum}</span>Belum Ditanda</div>
    `;
  }

  function renderList(container) {
    const employees = Utils.filterEmployees(Store.getActiveEmployees(), {
      search: state.search, kumpulan: state.kumpulan
    });
    const listEl = container.querySelector("#att-list");

    if (employees.length === 0) {
      listEl.innerHTML = `<div class="empty-state"><span class="icon">🔎</span>Tiada pekerja dijumpai.</div>`;
      return;
    }

    listEl.innerHTML = employees.map((e) => {
      const rec = Store.getAttendanceRecord(e.id, state.date);
      const status = rec ? rec.status : "";
      const catatan = rec ? rec.catatan : "";
      return `
        <div class="emp-card" data-emp-id="${e.id}">
          <div class="emp-card-head">
            <div>
              <div class="emp-name">${Utils.escapeHtml(e.nama)}</div>
              <span class="emp-role">${Utils.escapeHtml(e.jawatan || e.kumpulan)}</span>
            </div>
          </div>
          <div class="status-toggle">
            <button type="button" class="status-btn hadir ${status === "HADIR" ? "active" : ""}" data-status="HADIR">HADIR</button>
            <button type="button" class="status-btn tidak ${status === "TIDAK HADIR" ? "active" : ""}" data-status="TIDAK HADIR">TIDAK HADIR</button>
          </div>
          <div class="field-row" style="margin:8px 0 0;">
            <textarea class="input catatan-input" rows="1" placeholder="Catatan (taip secara manual, jika ada)">${Utils.escapeHtml(catatan)}</textarea>
          </div>
        </div>
      `;
    }).join("");

    listEl.querySelectorAll(".emp-card").forEach((card) => {
      const empId = card.getAttribute("data-emp-id");

      card.querySelectorAll(".status-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const isActive = btn.classList.contains("active");
          const finalStatus = isActive ? "" : btn.getAttribute("data-status");
          Store.upsertAttendance({ employeeId: empId, date: state.date, status: finalStatus });
          card.querySelectorAll(".status-btn").forEach((b) => b.classList.remove("active"));
          if (finalStatus) btn.classList.add("active");
          renderSummary(container);
          Utils.showToast("Disimpan");
        });
      });

      const catatanEl = card.querySelector(".catatan-input");
      catatanEl.addEventListener("input", Utils.debounce(() => {
        Store.upsertAttendance({ employeeId: empId, date: state.date, catatan: catatanEl.value });
        Utils.showToast("Catatan disimpan");
      }, 500));
    });
  }

  return { render };
})();
