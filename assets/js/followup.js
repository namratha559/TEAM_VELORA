function renderFollowupsPage(ctx){
  const upcoming = DB.followups.filter(f=>f.status==='Upcoming');
  const overdue = upcoming.filter(f=>f.date<Date.now());
  const completed = DB.followups.filter(f=>f.status==='Completed');
  const group = (title, arr)=>`<div class="card"><h3>${title}</h3>${arr.length?`<table><thead><tr><th>Patient</th><th>Date</th><th>Reason</th><th></th></tr></thead><tbody>
    ${arr.map(f=>{const p=getPatient(f.patientId); return `<tr><td>${p?p.name:f.patientId}</td><td>${fmtDate(f.date)}</td><td>${f.reason}</td>
      <td>${f.status==='Upcoming'?`<button class="link-btn" data-complete-fu="${f.id}">Mark complete</button>`:''}</td></tr>`}).join('')}
  </tbody></table>`:`<div class="empty-state">None.</div>`}</div>`;
  return group('Overdue follow-ups', overdue) + group('Upcoming follow-ups', upcoming.filter(f=>f.date>=Date.now())) + group('Completed follow-ups', completed);
}

/* ===================== SYNC ===================== */

function openFollowupModal(patientId){
  openModal(`<h3>Schedule follow-up</h3>
    <div class="field"><label>Date</label><input type="date" id="fu-date"></div>
    <div class="field"><label>Reason</label><input id="fu-reason" placeholder="e.g. Re-assess mobility"></div>
    <div class="btn-row"><button class="btn btn-primary btn-sm" id="fu-save" data-pid="${patientId}">Schedule</button><button class="btn btn-outline btn-sm" onclick="closeModal()">Cancel</button></div>`);
}

/* ===================== EVENT WIRING ===================== */
