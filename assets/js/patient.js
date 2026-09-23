function nextPatientId(){
  const n = DB.patients.length+1;
  return 'SIH-OA-' + String(n).padStart(6,'0');
}
function getPatient(id){ return DB.patients.find(p=>p.id===id); }
function patientScreenings(id){ return DB.screenings.filter(s=>s.patientId===id).sort((a,b)=>b.date-a.date); }
function latestScreening(id){ const s = patientScreenings(id); return s[0]||null; }

let patientSearch='';
function renderPatientList(ctx){
  const list = DB.patients.filter(p=> p.name.toLowerCase().includes(patientSearch.toLowerCase()) || p.id.toLowerCase().includes(patientSearch.toLowerCase()));
  return `
  <div class="card">
    <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
      <input id="patient-search" placeholder="Search by name or Patient ID" style="flex:1;min-width:200px;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;" value="${patientSearch}">
      ${ctx==='worker'?`<button class="btn btn-primary" data-nav="worker-register">+ New Patient</button>`:''}
    </div>
    ${list.length?`<table><thead><tr><th>Patient ID</th><th>Name</th><th>Age</th><th>Location</th><th>Last Screening</th><th>Risk</th></tr></thead><tbody>
      ${list.map(p=>{const ls=latestScreening(p.id); return `<tr class="clickable" data-nav="${ctx}-patient-detail" data-id="${p.id}">
        <td>${p.id}</td><td>${p.name}${p.demo?'<span class="demo-flag">DEMO</span>':''}</td><td>${p.age}</td><td>${p.village}, ${p.district}</td>
        <td>${ls?fmtDate(ls.date):'—'}</td><td>${riskBadge(ls?.risk)}</td></tr>`}).join('')}
    </tbody></table>`:`<div class="empty-state"><span class="e-icon">👥</span>No patients found.</div>`}
  </div>`;
}

/* ===================== REGISTRATION ===================== */
function renderRegisterForm(){
  return `
  <div class="card" style="max-width:640px;">
    <h3>Register new patient</h3>
    <div class="field"><label>Full name</label><input id="rf-name"></div>
    <div style="display:flex;gap:12px;">
      <div class="field" style="flex:1"><label>Age</label><input id="rf-age" type="number" min="1"></div>
      <div class="field" style="flex:1"><label>Sex</label><select id="rf-sex"><option>Female</option><option>Male</option><option>Other</option></select></div>
    </div>
    <div class="field"><label>Phone number</label><input id="rf-phone"></div>
    <div style="display:flex;gap:12px;">
      <div class="field" style="flex:1"><label>Village</label><input id="rf-village"></div>
      <div class="field" style="flex:1"><label>District</label><input id="rf-district"></div>
    </div>
    <div class="field"><label>Occupation</label><input id="rf-occ"></div>
    <div class="field"><label>Relevant medical / joint history</label><textarea id="rf-hist" rows="2"></textarea></div>
    <div class="field"><label><input type="checkbox" id="rf-consent" checked style="width:auto;margin-right:8px;">Patient consents to screening and secure data storage</label></div>
    <div class="btn-row"><button class="btn btn-primary" id="rf-submit">Register & generate QR</button></div>
  </div>`;
}
function submitRegistration(){
  const name = document.getElementById('rf-name').value.trim();
  if(!name){ toast('Please enter the patient name.'); return; }
  const id = nextPatientId();
  const patient = {
    id, name, age:+document.getElementById('rf-age').value||0, sex:document.getElementById('rf-sex').value,
    phone:document.getElementById('rf-phone').value, village:document.getElementById('rf-village').value,
    district:document.getElementById('rf-district').value, occupation:document.getElementById('rf-occ').value,
    history:document.getElementById('rf-hist').value, createdAt:Date.now(),
    sync: DB.online?'SYNCED':'PENDING', campId:DB.activeCampId, demo:false
  };
  DB.patients.push(patient); saveDB();
  toast(`Patient ${id} registered.`);
  go('worker-qr-generated', {detailId:id});
}

function renderPatientDetail(ctx){
  const p = getPatient(DB.detailId);
  if(!p) return `<div class="empty-state">Patient not found.</div>`;
  const history = patientScreenings(p.id);
  const ls = history[0];
  const fus = DB.followups.filter(f=>f.patientId===p.id);
  return `
  <div class="card">
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:14px;">
      <div>
        <h3>${p.name} ${p.demo?'<span class="demo-flag">DEMO</span>':''}</h3>
        <p style="color:var(--muted);font-size:13px;margin:0;">${p.id} · ${p.age} yrs · ${p.sex} · ${p.village}, ${p.district}</p>
      </div>
      <div>${riskBadge(ls?.risk)}</div>
    </div>
    <div class="btn-row">
      ${ctx==='worker'?`<button class="btn btn-primary btn-sm" id="pd-start-screening">Start New Screening</button>`:''}
      <button class="btn btn-outline btn-sm" id="pd-schedule-fu">Schedule Follow-up</button>
      ${ctx==='doctor'?`<button class="btn btn-outline btn-sm" id="pd-add-note">Add Clinical Note</button><button class="btn btn-outline btn-sm" id="pd-refer">Add Referral</button>`:''}
    </div>
  </div>
  <div class="card">
    <h3>Screening history</h3>
    ${history.length?`<table><thead><tr><th>Date</th><th>Risk</th><th>Coverage</th><th>Sync</th><th></th></tr></thead><tbody>
      ${history.map(s=>`<tr><td>${fmtDate(s.date)}</td><td>${riskBadge(s.risk)}</td><td>${s.coverage}/4</td><td>${s.sync}</td>
        <td><button class="link-btn" data-view-report="${s.id}">View report</button></td></tr>`).join('')}
    </tbody></table>`:`<div class="empty-state">No screenings recorded yet.</div>`}
  </div>
  ${ctx==='doctor' && ls ? renderClinicalNotes(ls):''}
  <div class="card">
    <h3>Follow-ups</h3>
    ${fus.length?`<table><thead><tr><th>Date</th><th>Reason</th><th>Status</th></tr></thead><tbody>
      ${fus.map(f=>`<tr><td>${fmtDate(f.date)}</td><td>${f.reason}</td><td><span class="badge badge-neutral">${f.status}</span></td></tr>`).join('')}
    </tbody></table>`:`<div class="empty-state">No follow-ups scheduled.</div>`}
  </div>`;
}
function renderClinicalNotes(s){
  return `<div class="card"><h3>Clinical notes</h3>
    ${s.notes && s.notes.length ? `<ul class="indicator-list">${s.notes.map(n=>`<li>📝 ${n}</li>`).join('')}</ul>` : `<div class="empty-state">No notes yet.</div>`}
    ${s.referral?`<p style="margin-top:10px;font-size:13.5px;"><strong>Referral:</strong> ${s.referral}</p>`:''}
  </div>`;
}

/* ===================== HEALTH CAMP ===================== */

function myPatient(){ return getPatient(DB.currentUser.patientId); }
function renderPatientHome(){
  const p = myPatient(); const ls = latestScreening(p.id);
  return `
  <div class="card">
    <h3>Hello, ${p.name.split(' ')[0]}</h3>
    ${ls ? `<div class="risk-banner ${ls.risk}" style="margin-top:12px;"><div class="rb-title">${riskLabel(ls.risk)}</div><div class="rb-sub">Last screened ${fmtDate(ls.date)}</div></div>`
      : `<div class="empty-state">No screening on record yet.</div>`}
  </div>
  <div class="action-grid">
    <button class="action-btn" id="ph-result"><span class="a-icon">📄</span><span class="a-label">View Result</span></button>
    <button class="action-btn" data-nav="patient-history"><span class="a-icon">🗂️</span><span class="a-label">My Reports</span></button>
    <button class="action-btn" data-nav="patient-followup"><span class="a-icon">📅</span><span class="a-label">Follow-up</span></button>
    <button class="action-btn" data-nav="patient-qr"><span class="a-icon">🔳</span><span class="a-label">My QR</span></button>
    <button class="action-btn" data-nav="patient-guidance"><span class="a-icon">💡</span><span class="a-label">Guidance</span></button>
  </div>`;
}
function renderPatientQr(){
  const p = myPatient();
  return `<div class="card" style="max-width:380px;text-align:center;">
    <h3>${p.name}</h3><p style="color:var(--muted);font-size:13px;">${p.id}</p>
    <div class="qr-box"><div id="qr-canvas"></div></div>
    <p style="font-size:12.5px;color:var(--muted);">Show this QR to your healthcare worker or doctor.</p>
  </div>`;
}
function renderPatientHistory(){
  const p = myPatient(); const hist = patientScreenings(p.id);
  return `<div class="card"><h3>Screening history</h3>
    ${hist.length? `<table><thead><tr><th>Date</th><th>Risk</th><th></th></tr></thead><tbody>
      ${hist.map(s=>`<tr><td>${fmtDate(s.date)}</td><td>${riskBadge(s.risk)}</td><td><button class="link-btn" data-view-report="${s.id}">View report</button></td></tr>`).join('')}
    </tbody></table>` : `<div class="empty-state">No screenings yet.</div>`}
  </div>`;
}
function renderPatientFollowup(){
  const p = myPatient(); const fus = DB.followups.filter(f=>f.patientId===p.id);
  return `<div class="card"><h3>Your follow-ups</h3>
    ${fus.length? `<table><thead><tr><th>Date</th><th>Reason</th><th>Status</th></tr></thead><tbody>
      ${fus.map(f=>`<tr><td>${fmtDate(f.date)}</td><td>${f.reason}</td><td><span class="badge badge-neutral">${f.status}</span></td></tr>`).join('')}
    </tbody></table>` : `<div class="empty-state">No follow-ups scheduled.</div>`}
  </div>`;
}
function renderGuidance(){
  const tips = [
    'Maintain appropriate physical activity for your ability level.',
    'Avoid prolonged inactivity — gentle movement helps joints.',
    'Maintain a healthy body weight to reduce joint load.',
    'Seek professional evaluation for persistent or worsening symptoms.',
    'Follow any clinical advice given by your doctor.'
  ];
  return `<div class="card"><h3>Preventive guidance</h3><ul class="indicator-list">${tips.map(t=>`<li>💡 ${t}</li>`).join('')}</ul>
    <p style="font-size:12px;color:var(--muted);margin-top:8px;">General education only — this does not replace medical advice or treatment.</p></div>`;
}

/* ===================== MODALS: Camera(sim run)/Sensor/QR/Scan/Notes/Followup ===================== */
