const ViewPekerja = (() => {
  const state = { search: "", kumpulan: "SEMUA" };

  function render(container) {
    container.innerHTML = `
      <div class="controls-row">
        <input type="text" id="pk-search" class="input" placeholder="🔍 Cari nama / jawatan..." value="${Utils.escapeHtml(state.search)}">
        <select id="pk-kumpulan" class="input">
          <option value="SEMUA">Semua Kumpulan</option>
          <option value="STAFF">Staff</option>
          <option value="PEMANDU">Pemandu</option>
        </select>
      </div>
      <button class="btn btn-primary btn-block" id="pk-add-btn" style="margin-bottom:12px;">+ Tambah Pekerja</button>
      <div id="pk-list"></div>
    `;

    const searchInput = container.querySelector("#pk-search");
    const kumpulanSelect = container.querySelector("#pk-kumpulan");
    kumpulanSelect.value = state.kumpulan;

    searchInput.addEventListener("input", Utils.debounce(() => {
      state.search = searchInput.value;
      renderList(container);
    }, 200));
    kumpulanSelect.addEventListener("change", () => {
      state.kumpulan = kumpulanSelect.value;
      renderList(container);
    });
    container.querySelector("#pk-add-btn").addEventListener("click", () => openAddModal(container));

    renderList(container);
  }

  function renderList(container) {
    const employees = Utils.filterEmployees(Store.getEmployees(), {
      search: state.search, kumpulan: state.kumpulan
    });
    const listEl = container.querySelector("#pk-list");

    if (employees.length === 0) {
      listEl.innerHTML = `<div class="empty-state"><span class="icon">👤</span>Tiada pekerja dijumpai.</div>`;
      return;
    }

    const groups = [
      { key: "STAFF", label: "Staff" },
      { key: "PEMANDU", label: "Pemandu" }
    ];

    let html = "";
    groups.forEach((g) => {
      const groupEmployees = employees.filter((e) => e.kumpulan === g.key);
      if (groupEmployees.length === 0) return;
      html += `<div class="group-header">${g.label} (${groupEmployees.length})</div>`;
      html += groupEmployees.map((e, idx) => `
        <div class="pekerja-row" data-emp-id="${e.id}">
          <div class="bil">${idx + 1}</div>
          <div class="info">
            <div class="nama">${Utils.escapeHtml(e.nama)}</div>
            <div class="jawatan">${Utils.escapeHtml(e.jawatan || "-")}</div>
          </div>
          <button class="icon-btn del-btn" title="Padam">🗑️</button>
        </div>
      `).join("");
    });
    listEl.innerHTML = html;

    listEl.querySelectorAll(".del-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = btn.closest(".pekerja-row");
        const empId = row.getAttribute("data-emp-id");
        const emp = Store.getEmployees().find((e) => e.id === empId);
        if (!emp) return;
        if (confirm(`Padam pekerja "${emp.nama}"?\nRekod kehadiran pekerja ini juga akan dipadam.`)) {
          Store.deleteEmployee(empId);
          renderList(container);
          Utils.showToast("Pekerja dipadam");
        }
      });
    });
  }

  function openAddModal(container) {
    Utils.openModal(`
      <h3>Tambah Pekerja</h3>
      <div class="field-row">
        <label>Nama Penuh</label>
        <input type="text" id="new-nama" class="input" placeholder="Contoh: AHMAD BIN ALI">
      </div>
      <div class="field-row">
        <label>Jawatan</label>
        <input type="text" id="new-jawatan" class="input" placeholder="Contoh: PENYELIA">
      </div>
      <div class="field-row">
        <label>Kumpulan</label>
        <select id="new-kumpulan" class="input">
          <option value="STAFF">Staff</option>
          <option value="PEMANDU">Pemandu</option>
        </select>
      </div>
      <div class="modal-close-row">
        <button class="btn" id="modal-cancel">Batal</button>
        <button class="btn btn-primary" id="modal-save">Simpan</button>
      </div>
    `);
    document.getElementById("modal-cancel").addEventListener("click", Utils.closeModal);
    document.getElementById("modal-save").addEventListener("click", () => {
      const nama = document.getElementById("new-nama").value.trim();
      const jawatan = document.getElementById("new-jawatan").value.trim();
      const kumpulan = document.getElementById("new-kumpulan").value;
      if (!nama) {
        Utils.showToast("Sila isi nama pekerja");
        return;
      }
      Store.addEmployee({ nama, jawatan, kumpulan });
      Utils.closeModal();
      renderList(container);
      Utils.showToast("Pekerja ditambah");
    });
  }

  return { render };
})();
