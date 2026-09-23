let DB = {
  lang:'en',
  online:true,
  currentUser:null,
  patients:[],
  screenings:[],
  camps:[],
  activeCampId:null,
  followups:[],
  view:'login',
  detailId:null,
  wizard:null,
};


function toast(msg){
  const el = document.createElement('div');
  el.className='toast'; el.textContent=msg;
  let holder = document.getElementById('toast-holder');
  if(!holder){ holder=document.createElement('div'); holder.id='toast-holder'; document.body.appendChild(holder); }
  holder.appendChild(el);
  setTimeout(()=>el.remove(), 2600);
}
function fmtDate(ts){ return new Date(ts).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }

function go(view, extra){ if(typeof CAM!=='undefined' && CAM.active) stopCameraTracking(); DB.view=view; if(extra) Object.assign(DB, extra); render(); window.scrollTo(0,0); }

/* ===================== AUTH ===================== */

function render(){
  const app = document.getElementById('app');
  if(!DB.currentUser){ app.innerHTML = renderLogin(); attachLoginEvents(); return; }
  app.innerHTML = renderShell();
  attachShellEvents();
}

/* ===================== LOGIN VIEW ===================== */

function navItemsFor(role){
  if(role==='worker') return [
    ['worker-dashboard','📊',t('dashboard')],['worker-patients','👥',t('patients')],
    ['worker-camp','⛺',t('campaigns')],['worker-followups','📅',t('followups')],['worker-sync','🔄',t('sync')],['worker-settings','⚙️',t('settings')]];
  if(role==='doctor') return [
    ['doctor-dashboard','📊',t('dashboard')],['doctor-patients','👥',t('patients')],
    ['doctor-followups','📅',t('followups')],['doctor-analytics','📈','Analytics'],['worker-settings','⚙️',t('settings')]];
  if(role==='admin') return [
    ['admin-dashboard','📊',t('dashboard')],['admin-users','👤','Users'],['admin-camps','⛺',t('campaigns')],
    ['admin-analytics','📈','Analytics'],['worker-settings','⚙️',t('settings')]];
  if(role==='patient') return [
    ['patient-home','🏠','Home'],['patient-qr','🔳','My QR'],['patient-history','🗂️','History'],['patient-guidance','💡','Guidance']];
  return [];
}
function renderShell(){
  const role = DB.currentUser.role;
  const items = navItemsFor(role);
  const isMobileRole = role==='worker' || role==='patient';
  return `
  <div class="shell">
    <div class="sidebar">
      <div class="brand"><div class="brand-mark">S</div><div class="brand-text"><h1 style="color:#fff">SIH</h1><p>${roleTitle(role)}</p></div></div>
      ${items.map(([v,icon,label])=>`<button class="nav-item ${DB.view===v?'active':''}" data-nav="${v}"><span>${icon}</span>${label}</button>`).join('')}
      <div class="sidebar-foot">
        <button class="nav-item" id="logout-btn"><span>↩️</span>Log out</button>
      </div>
    </div>
    <div class="main">
      <div class="topbar">
        <div class="topbar-title"><h2>${viewTitle()}</h2><p>${viewSub()}</p></div>
        <div class="topbar-right">
          ${role==='worker'?`<button class="status-pill ${DB.online?'status-online':'status-offline'}" id="online-toggle"><span class="dot"></span>${DB.online?'Online':'Offline — will sync automatically'}</button>`:''}
          <select class="lang-select" id="lang-select">
            ${LANG_META.map(l=>`<option value="${l.code}" ${DB.lang===l.code?'selected':''}>${l.label}</option>`).join('')}
          </select>
          <div class="userchip"><div class="avatar">${DB.currentUser.name.split(' ').map(w=>w[0]).slice(0,2).join('')}</div>${DB.currentUser.name}</div>
        </div>
      </div>
      <div class="content" id="content">${renderContent()}</div>
    </div>
    ${isMobileRole?renderBottomNav(items):''}
  </div>`;
}
function roleTitle(role){ return {worker:'Healthcare Worker',doctor:'Doctor',admin:'Administrator',patient:'Patient'}[role]; }
function renderBottomNav(items){
  return `<div class="bottom-nav">${items.slice(0,5).map(([v,icon,label])=>`<button class="${DB.view===v?'active':''}" data-nav="${v}"><span class="b-icon">${icon}</span>${label}</button>`).join('')}</div>`;
}
function viewTitle(){
  const map={
    'worker-dashboard':'Dashboard','worker-patients':'Patients','worker-patient-detail':getPatient(DB.detailId)?.name||'Patient',
    'worker-register':'New Patient','worker-camp':'Health Camps','worker-followups':'Follow-ups','worker-sync':'Sync',
    'worker-settings':'Settings','worker-screening':'Screening','worker-result':'Screening Result','worker-report':'Digital Report',
    'doctor-dashboard':'Dashboard','doctor-patients':'Patients','doctor-patient-detail':getPatient(DB.detailId)?.name||'Patient',
    'doctor-followups':'Follow-ups','doctor-analytics':'Analytics',
    'admin-dashboard':'Overview','admin-users':'Users','admin-camps':'Health Camps','admin-analytics':'Analytics',
    'patient-home':'Home','patient-qr':'My QR','patient-history':'Screening History','patient-guidance':'Preventive Guidance','patient-followup':'Follow-up','patient-result':'Screening Result'
  };
  return map[DB.view]||'SIH';
}
function viewSub(){
  if(DB.currentUser.role==='worker') return DB.currentUser.location||'';
  if(DB.view==='worker-screening' && DB.wizard) return `Step ${DB.wizard.step} of 7`;
  return '';
}

/* ===================== CONTENT ROUTER ===================== */
function renderContent(){
  switch(DB.view){
    case 'worker-dashboard': return renderWorkerDashboard();
    case 'worker-patients': return renderPatientList('worker');
    case 'worker-patient-detail': return renderPatientDetail('worker');
    case 'worker-register': return renderRegisterForm();
    case 'worker-qr-generated': return renderQrGenerated();
    case 'worker-camp': return renderCampPage();
    case 'worker-followups': return renderFollowupsPage('worker');
    case 'worker-sync': return renderSyncPage();
    case 'worker-settings': return renderSettingsPage();
    case 'worker-screening': return renderWizard();
    case 'worker-result': return renderResultPage('worker');
    case 'worker-report': return renderReportPage('worker');

    case 'doctor-dashboard': return renderDoctorDashboard();
    case 'doctor-patients': return renderPatientList('doctor');
    case 'doctor-patient-detail': return renderPatientDetail('doctor');
    case 'doctor-followups': return renderFollowupsPage('doctor');
    case 'doctor-analytics': return renderAnalytics();
    case 'doctor-report': return renderReportPage('doctor');

    case 'admin-dashboard': return renderAdminDashboard();
    case 'admin-users': return renderAdminUsers();
    case 'admin-camps': return renderAdminCamps();
    case 'admin-analytics': return renderAnalytics();

    case 'patient-home': return renderPatientHome();
    case 'patient-qr': return renderPatientQr();
    case 'patient-history': return renderPatientHistory();
    case 'patient-guidance': return renderGuidance();
    case 'patient-followup': return renderPatientFollowup();
    case 'patient-result': return renderResultPage('patient');
    case 'patient-report': return renderReportPage('patient');

    default: return '<div class="empty-state">View not found.</div>';
  }
}

/* ===================== WORKER: DASHBOARD ===================== */

function renderSettingsPage(){
  return `<div class="card" style="max-width:420px;">
    <h3>Settings</h3>
    <div class="field"><label>Language</label>
      <select id="settings-lang">
        ${LANG_META.map(l=>`<option value="${l.code}" ${DB.lang===l.code?'selected':''}>${l.label}</option>`).join('')}
      </select>
    </div>
    <p style="color:var(--muted);font-size:12.5px;">Signed in as ${DB.currentUser.name} (${DB.currentUser.role})</p>
  </div>`;
}

/* ===================== SCREENING WIZARD ===================== */

function openModal(html){
  const back=document.createElement('div'); back.className='modal-back'; back.id='dyn-modal';
  back.innerHTML=`<div class="modal">${html}</div>`;
  back.onclick=(e)=>{ if(e.target===back) closeModal(); };
  document.body.appendChild(back);
}
function closeModal(){ const m=document.getElementById('dyn-modal'); if(m) m.remove(); }


function attachShellEvents(){
  document.querySelectorAll('[data-nav]').forEach(el=>{
    el.onclick = (e)=>{
      const v = el.dataset.nav; const id = el.dataset.id;
      const extra = id ? {detailId:id} : {};
      go(v, extra);
    };
  });
  const logoutBtn=document.getElementById('logout-btn'); if(logoutBtn) logoutBtn.onclick=logout;
  const onlineToggle=document.getElementById('online-toggle');
  if(onlineToggle) onlineToggle.onclick=()=>{ DB.online=!DB.online; toast(DB.online?'Back online.':'Offline mode enabled. Your work is saved locally.'); render(); };
  const langSel=document.getElementById('lang-select')||document.getElementById('settings-lang');
  if(langSel) langSel.onchange=(e)=>{ DB.lang=e.target.value; saveDB(); render(); };

  // Dashboard quick actions
  const qaScan=document.getElementById('qa-scan'); if(qaScan) qaScan.onclick=openScanModal;

  // Registration
  const rfSubmit=document.getElementById('rf-submit'); if(rfSubmit) rfSubmit.onclick=submitRegistration;

  // QR generated page
  renderQrIfNeeded();
  const qrDownload=document.getElementById('qr-download');
  if(qrDownload) qrDownload.onclick=()=>{
    const canvas=document.querySelector('#qr-canvas canvas');
    if(canvas){ const a=document.createElement('a'); a.href=canvas.toDataURL(); a.download=(DB.detailId||'patient')+'-qr.png'; a.click(); }
  };
  const startNow=document.getElementById('start-screening-now'); if(startNow) startNow.onclick=()=>startScreening(DB.detailId);

  // Patient list search
  const psearch=document.getElementById('patient-search');
  if(psearch){ psearch.oninput=(e)=>{ patientSearch=e.target.value; render(); }; setTimeout(()=>{psearch.focus(); psearch.selectionStart=psearch.value.length;},0); }

  // Patient detail actions
  const pdStart=document.getElementById('pd-start-screening'); if(pdStart) pdStart.onclick=()=>startScreening(DB.detailId);
  const pdFu=document.getElementById('pd-schedule-fu'); if(pdFu) pdFu.onclick=()=>openFollowupModal(DB.detailId);
  const pdNote=document.getElementById('pd-add-note'); if(pdNote) pdNote.onclick=openNoteModal;
  const pdRefer=document.getElementById('pd-refer'); if(pdRefer) pdRefer.onclick=openReferModal;
  document.querySelectorAll('[data-view-report]').forEach(b=>b.onclick=()=>{ viewingScreeningId=b.dataset.viewReport; go(DB.currentUser.role+'-report'); });

  // Camp
  const startCamp=document.getElementById('start-camp'); if(startCamp) startCamp.onclick=()=>{
    const name=document.getElementById('camp-name').value.trim()||'Health Camp';
    const location=document.getElementById('camp-location').value.trim();
    const date=document.getElementById('camp-date').value ? new Date(document.getElementById('camp-date').value).getTime() : Date.now();
    const id='CAMP-'+(DB.camps.length+1);
    DB.camps.push({id,name,location,date}); DB.activeCampId=id; saveDB(); toast('Camp started.'); render();
  };
  const endCamp=document.getElementById('end-camp'); if(endCamp) endCamp.onclick=()=>{ DB.activeCampId=null; saveDB(); toast('Camp ended.'); render(); };

  // Follow-ups complete
  document.querySelectorAll('[data-complete-fu]').forEach(b=>b.onclick=()=>{
    const f=DB.followups.find(x=>x.id===b.dataset.completeFu); if(f){ f.status='Completed'; saveDB(); render(); }
  });

  // Sync
  const syncBtn=document.getElementById('sync-now'); if(syncBtn) syncBtn.onclick=syncNow;

  // Wizard
  const wizNext=document.getElementById('wiz-next'); if(wizNext) wizNext.onclick=wizardNext;
  const wizBack=document.getElementById('wiz-back'); if(wizBack) wizBack.onclick=wizardBack;
  attachWizardStepEvents();

  // Result / report
  const genReport=document.getElementById('gen-report-btn'); if(genReport) genReport.onclick=()=>{ viewingScreeningId=genReport.dataset.sid; go(DB.currentUser.role+'-report'); };
  const phResult=document.getElementById('ph-result'); if(phResult) phResult.onclick=()=>{
    const ls=latestScreening(DB.currentUser.patientId); if(ls){ viewingScreeningId=ls.id; go('patient-result'); } else toast('No screening on record yet.');
  };

  // patient QR
  renderQrIfNeeded();

}

function initModalDelegation(){
  document.body.addEventListener('click', function(e){
    if(e.target.id==='manual-pid-go'){ const v=document.getElementById('manual-pid').value.trim(); if(v){ stopCameraScan(); closeModal(); routeToPatientOrNotFound(v);} }
    if(e.target.id==='save-note'){ const txt=document.getElementById('note-text').value.trim(); if(txt){ const ls=latestScreening(DB.detailId); if(ls){ ls.notes=ls.notes||[]; ls.notes.push(txt); saveDB(); } closeModal(); render(); toast('Note saved.'); } }
    if(e.target.id==='save-refer'){ const txt=document.getElementById('refer-text').value.trim(); if(txt){ const ls=latestScreening(DB.detailId); if(ls){ ls.referral=txt; saveDB(); } closeModal(); render(); toast('Referral saved.'); } }
    if(e.target.id==='fu-save'){
      const pid=e.target.dataset.pid; const date=document.getElementById('fu-date').value; const reason=document.getElementById('fu-reason').value.trim();
      if(date && reason){ DB.followups.push({id:'FU-'+(DB.followups.length+1), patientId:pid, date:new Date(date).getTime(), reason, status:'Upcoming', notes:''}); saveDB(); closeModal(); render(); toast('Follow-up scheduled.'); }
    }
  });
}

/* ===================== INIT ===================== */
initModalDelegation();
loadDB();
