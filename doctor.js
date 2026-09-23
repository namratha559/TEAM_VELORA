function renderDoctorDashboard(){
  const higherRisk = DB.screenings.filter(s=>s.risk==='high').length;
  const today = new Date(); today.setHours(0,0,0,0);
  const todays = DB.screenings.filter(s=>s.date>=today.getTime()).length;
  const pendingFU = DB.followups.filter(f=>f.status==='Upcoming').length;
  return `
  <div class="stat-grid">
    <div class="stat-card"><div class="stat-num">${DB.patients.length}</div><div class="stat-label">Total patients</div></div>
    <div class="stat-card"><div class="stat-num">${todays}</div><div class="stat-label">Today's screenings</div></div>
    <div class="stat-card risk"><div class="stat-num">${higherRisk}</div><div class="stat-label">Higher-risk cases</div></div>
    <div class="stat-card"><div class="stat-num">${pendingFU}</div><div class="stat-label">Follow-ups due</div></div>
  </div>
  <div class="card"><h3>Recently screened patients</h3>${recentScreeningsTable()}</div>`;
}

/* ===================== ADMIN ===================== */

function openNoteModal(){
  openModal(`<h3>Add clinical note</h3><div class="field"><textarea id="note-text" rows="4" placeholder="Enter clinical observation..."></textarea></div>
    <div class="btn-row"><button class="btn btn-primary btn-sm" id="save-note">Save note</button><button class="btn btn-outline btn-sm" onclick="closeModal()">Cancel</button></div>`);
}
function openReferModal(){
  openModal(`<h3>Add referral recommendation</h3><div class="field"><textarea id="refer-text" rows="3" placeholder="e.g. Refer to orthopedic specialist for imaging."></textarea></div>
    <div class="btn-row"><button class="btn btn-primary btn-sm" id="save-refer">Save referral</button><button class="btn btn-outline btn-sm" onclick="closeModal()">Cancel</button></div>`);
}
