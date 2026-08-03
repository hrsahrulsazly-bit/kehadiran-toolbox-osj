// Lapisan data — semua kekal dalam localStorage peranti ini.
const Store = (() => {
  const KEY_EMPLOYEES = "tbosj_employees_v1";
  const KEY_ATTENDANCE = "tbosj_attendance_v1";

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "id_" + Date.now() + "_" + Math.random().toString(16).slice(2);
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error("Gagal baca storan:", key, e);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function ensureSeeded() {
    if (localStorage.getItem(KEY_EMPLOYEES) === null) {
      const seeded = (window.SEED_EMPLOYEES || []).map((e) => ({
        id: uid(),
        nama: e.nama,
        jawatan: e.jawatan,
        kumpulan: e.kumpulan || "STAFF",
        aktif: true
      }));
      writeJSON(KEY_EMPLOYEES, seeded);
    }
    if (localStorage.getItem(KEY_ATTENDANCE) === null) {
      writeJSON(KEY_ATTENDANCE, []);
    }
  }

  // ---------- Employees ----------
  function getEmployees() {
    return readJSON(KEY_EMPLOYEES, []);
  }

  function getActiveEmployees() {
    return getEmployees().filter((e) => e.aktif !== false);
  }

  function addEmployee({ nama, jawatan, kumpulan }) {
    const employees = getEmployees();
    const emp = {
      id: uid(),
      nama: nama.trim(),
      jawatan: (jawatan || "").trim(),
      kumpulan: kumpulan === "PEMANDU" ? "PEMANDU" : "STAFF",
      aktif: true
    };
    employees.push(emp);
    writeJSON(KEY_EMPLOYEES, employees);
    return emp;
  }

  function deleteEmployee(id) {
    const employees = getEmployees().filter((e) => e.id !== id);
    writeJSON(KEY_EMPLOYEES, employees);
    // Buang juga rekod kehadiran pekerja berkenaan.
    const attendance = getAttendance().filter((a) => a.employeeId !== id);
    writeJSON(KEY_ATTENDANCE, attendance);
  }

  // ---------- Attendance ----------
  function getAttendance() {
    return readJSON(KEY_ATTENDANCE, []);
  }

  function getAttendanceForDate(dateStr) {
    return getAttendance().filter((a) => a.date === dateStr);
  }

  function getAttendanceRecord(employeeId, dateStr) {
    return getAttendance().find((a) => a.employeeId === employeeId && a.date === dateStr);
  }

  function upsertAttendance({ employeeId, date, status, catatan }) {
    const attendance = getAttendance();
    let rec = attendance.find((a) => a.employeeId === employeeId && a.date === date);
    if (!rec) {
      rec = { id: uid(), employeeId, date, status: "", catatan: "" };
      attendance.push(rec);
    }
    if (status !== undefined) rec.status = status;
    if (catatan !== undefined) rec.catatan = catatan;
    writeJSON(KEY_ATTENDANCE, attendance);
    return rec;
  }

  function getDatesInMonth(yearMonth) {
    // yearMonth: "YYYY-MM" -> senarai tarikh unik (ada rekod) dlm bulan tsb, tersusun.
    const all = getAttendance().filter((a) => a.date && a.date.startsWith(yearMonth));
    const dates = Array.from(new Set(all.map((a) => a.date)));
    dates.sort();
    return dates;
  }

  return {
    uid,
    ensureSeeded,
    getEmployees,
    getActiveEmployees,
    addEmployee,
    deleteEmployee,
    getAttendance,
    getAttendanceForDate,
    getAttendanceRecord,
    upsertAttendance,
    getDatesInMonth
  };
})();

Store.ensureSeeded();
