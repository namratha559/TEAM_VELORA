function renderCampPage(){
  const camp = DB.camps.find(c=>c.id===DB.activeCampId);
  return `
  ${camp ? `
  <div class="card">
    <h3>${camp.name} <span class="badge badge-low">Active</span></h3>
    <p style="color:var(--muted);font-size:13px;">${camp.location} · ${fmtDate(camp.date)}</p>
    ${campStats(camp.id)}
    <div class="btn-row"><button class="btn btn-primary btn-sm" data-nav="worker-register">Register patient for camp</button>
    <button class="btn btn-outline btn-sm" id="end-camp">End camp</button></div>
  </div>` : `
  <div class="card" style="max-width:480px;">
    <h3>Create health camp</h3>
    <div class="field"><label>Camp name</label><input id="camp-name" placeholder="e.g. NER Rural Camp"></div>
    <div class="field"><label>Location</label><input id="camp-location"></div>
    <div class="field"><label>Date</label><input id="camp-date" type="date"></div>
    <button class="btn btn-primary" id="start-camp">Start camp</button>
  </div>`}
  <div class="card"><h3>Past camps</h3>
    ${DB.camps.filter(c=>c.id!==DB.activeCampId).length? `<table><thead><tr><th>Name</th><th>Date</th><th>Screened</th></tr></thead><tbody>
      ${DB.camps.filter(c=>c.id!==DB.activeCampId).map(c=>`<tr><td>${c.name}</td><td>${fmtDate(c.date)}</td><td>${DB.patients.filter(p=>p.campId===c.id).length}</td></tr>`).join('')}
    </tbody></table>`:`<div class="empty-state">No past camps.</div>`}
  </div>`;
}
function campStats(campId){
  const camp_patients = DB.patients.filter(p=>p.campId===campId);
  const camp_screenings = DB.screenings.filter(s=>camp_patients.some(p=>p.id===s.patientId));
  const counts = {low:0,moderate:0,high:0};
  camp_screenings.forEach(s=>counts[s.risk]!==undefined && counts[s.risk]++);
  const pending = camp_patients.filter(p=>p.sync==='PENDING').length + camp_screenings.filter(s=>s.sync==='PENDING').length;
  return `<div class="stat-grid" style="margin-top:14px;">
    <div class="stat-card"><div class="stat-num">${camp_patients.length}</div><div class="stat-label">Patients screened</div></div>
    <div class="stat-card"><div class="stat-num">${counts.high}</div><div class="stat-label">Higher risk</div></div>
    <div class="stat-card"><div class="stat-num">${counts.moderate}</div><div class="stat-label">Moderate risk</div></div>
    <div class="stat-card"><div class="stat-num">${counts.low}</div><div class="stat-label">Lower risk</div></div>
    <div class="stat-card"><div class="stat-num">${pending}</div><div class="stat-label">Pending sync</div></div>
  </div>`;
}

/* ===================== FOLLOW-UPS ===================== */
