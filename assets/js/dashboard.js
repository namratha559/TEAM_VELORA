function renderWorkerDashboard(){
  const today = new Date(); today.setHours(0,0,0,0);
  const screenedToday = DB.screenings.filter(s=>s.date>=today.getTime()).length;
  const higherRisk = DB.screenings.filter(s=>s.risk==='high').length;
  const pendingFU = DB.followups.filter(f=>f.status==='Upcoming').length;
  const pendingSync = pendingSyncCount();
  return `
  <div class="stat-grid">
    <div class="stat-card"><div class="stat-num">${screenedToday}</div><div class="stat-label">Patients screened today</div></div>
    <div class="stat-card"><div class="stat-num">${DB.patients.length}</div><div class="stat-label">Total patients</div></div>
    <div class="stat-card risk"><div class="stat-num">${higherRisk}</div><div class="stat-label">Higher-risk cases</div></div>
    <div class="stat-card"><div class="stat-num">${pendingFU}</div><div class="stat-label">Pending follow-ups</div></div>
    <div class="stat-card"><div class="stat-num">${pendingSync}</div><div class="stat-label">Unsynced records</div></div>
  </div>
  <div class="action-grid">
    <button class="action-btn" data-nav="worker-register"><span class="a-icon">➕</span><span class="a-label">New Patient</span></button>
    <button class="action-btn" id="qa-scan"><span class="a-icon">🔳</span><span class="a-label">Scan QR</span></button>
    <button class="action-btn" data-nav="worker-patients"><span class="a-icon">🗂️</span><span class="a-label">Patient Records</span></button>
    <button class="action-btn" data-nav="worker-camp"><span class="a-icon">⛺</span><span class="a-label">Health Camp</span></button>
    <button class="action-btn" data-nav="worker-sync"><span class="a-icon">🔄</span><span class="a-label">Sync Data</span></button>
  </div>
  <div class="card">
    <h3>Recent screenings</h3>
    ${recentScreeningsTable()}
  </div>`;
}
function recentScreeningsTable(){
  const rows = DB.screenings.slice().sort((a,b)=>b.date-a.date).slice(0,6);
  if(!rows.length) return `<div class="empty-state"><span class="e-icon">🗂️</span>No screenings yet. Start with "New Patient".</div>`;
  const navTarget = DB.currentUser.role+'-patient-detail';
  return `<table><thead><tr><th>Patient</th><th>Date</th><th>Risk</th><th>Sync</th></tr></thead><tbody>
    ${rows.map(s=>{const p=getPatient(s.patientId); return `<tr class="clickable" data-nav="${navTarget}" data-id="${s.patientId}">
      <td>${p?p.name:s.patientId}${s.demo?'<span class="demo-flag">DEMO</span>':''}</td><td>${fmtDate(s.date)}</td><td>${riskBadge(s.risk)}</td>
      <td><span class="badge ${s.sync==='SYNCED'?'badge-low':'badge-mod'}">${s.sync}</span></td></tr>`}).join('')}
  </tbody></table>`;
}

/* ===================== PATIENT LIST (shared worker/doctor) ===================== */
