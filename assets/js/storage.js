const DEMO_ACCOUNTS = [
  {email:'worker@sih.demo',password:'demo123',role:'worker',name:'Anjali Bora',location:'NER Rural PHC, Assam'},
  {email:'doctor@sih.demo',password:'demo123',role:'doctor',name:'Dr. Kabir Sen'},
  {email:'admin@sih.demo',password:'demo123',role:'admin',name:'System Admin'},
  {email:'patient@sih.demo',password:'demo123',role:'patient',name:'Ravi Kumar',patientId:'SIH-OA-000001'},
];

function seedIfEmpty(){
  if(DB.patients.length) return;
  const now = Date.now();
  DB.patients.push({
    id:'SIH-OA-000001', name:'Ravi Kumar', age:58, sex:'Male', phone:'98xxxxxx01',
    village:'Sonapur', district:'Kamrup', occupation:'Farmer', history:'Old knee injury (2015)',
    createdAt: now - 86400000*30, sync:'SYNCED', campId:null, demo:true
  });
  DB.patients.push({
    id:'SIH-OA-000002', name:'Meena Devi', age:61, sex:'Female', phone:'98xxxxxx02',
    village:'Barpeta', district:'Barpeta', occupation:'Homemaker', history:'No prior joint issues',
    createdAt: now - 86400000*12, sync:'SYNCED', campId:null, demo:true
  });
  DB.screenings.push({
    id:'SCR-000001', patientId:'SIH-OA-000001', date: now-86400000*5, sync:'SYNCED', demo:true,
    symptoms:{pain:7,stiffness:true,walking:true,stairs:true,standing:true,sitting:false,gettingUp:true,injury:true},
    camera:{done:true, symmetry:78, walkSpeed:0.72, sitToStandTime:14, sitToStandReps:5},
    sensor:{done:true, leftAngle:72, leftROM:91, rightAngle:65, rightROM:83, imuStability:'Reduced'},
    clinical:{}, coverage:4,
    risk:'high', indicators:['Increased reported pain (7/10)','Reduced knee range of motion','Difficulty on stairs and standing','Slower sit-to-stand performance','Movement asymmetry (78%)'],
    notes:[], referral:null
  });
  DB.screenings.push({
    id:'SCR-000002', patientId:'SIH-OA-000002', date: now-86400000*3, sync:'SYNCED', demo:true,
    symptoms:{pain:2,stiffness:false,walking:false,stairs:false,standing:false,sitting:false,gettingUp:false,injury:false},
    camera:{done:true, symmetry:95, walkSpeed:1.1, sitToStandTime:8, sitToStandReps:5},
    sensor:{done:false}, clinical:{}, coverage:2,
    risk:'low', indicators:['Minimal reported pain','Normal movement symmetry'],
    notes:[], referral:null
  });
  DB.followups.push({id:'FU-1', patientId:'SIH-OA-000001', date: now+86400000*10, reason:'Re-assess pain & mobility', status:'Upcoming', notes:''});
}

/* ---------- persistence ---------- */
async function loadDB(){
  try{
    let raw = localStorage.getItem('sih_db_v1');
    if(!raw && window.storage){ const res = await window.storage.get('sih_db_v1'); raw = res && res.value; }
    if(raw){
      const parsed = JSON.parse(raw);
      DB = Object.assign(DB, parsed, {currentUser:null, view:'login', wizard:null, detailId:null});
    }
  }catch(e){ /* no saved state yet */ }
  seedIfEmpty();
  render();
}
let saveChain = Promise.resolve();
function saveDB(){
  // Snapshot state synchronously so a later saveDB() call always carries newer data,
  // then chain writes so a slower earlier write can never overwrite a newer one.
  const {currentUser, view, wizard, detailId, ...persist} = DB;
  const payload = JSON.stringify(persist);
  localStorage.setItem('sih_db_v1', payload); // immediate, synchronous safety net (survives instant refresh)
  saveChain = saveChain.then(async ()=>{
    try{ if(window.storage) await window.storage.set('sih_db_v1', payload); }
    catch(e){ console.error('save failed', e); }
  });
  return saveChain;
}
window.addEventListener('beforeunload', ()=>{
  try{ if(typeof CAM!=='undefined' && CAM.active) stopCameraTracking(); }catch(e){}
  try{ const {currentUser, view, wizard, detailId, ...persist} = DB; localStorage.setItem('sih_db_v1', JSON.stringify(persist)); }catch(e){}
});

/* ---------- helpers ---------- */

function pendingSyncCount(){ return DB.patients.filter(p=>p.sync==='PENDING').length + DB.screenings.filter(s=>s.sync==='PENDING').length; }
/* Voice guidance: supported for en/hi only (Part 2). Falls back to en if a hi voice isn't
   installed on the device. Never auto-speaks continuously — only on explicit play/replay. */

function renderSyncPage(){
  const pendingP = DB.patients.filter(p=>p.sync==='PENDING');
  const pendingS = DB.screenings.filter(s=>s.sync==='PENDING');
  return `
  <div class="card">
    <h3>Sync status</h3>
    <p style="color:var(--muted);font-size:13.5px;">${DB.online?'You are online.':'You are offline. Records are saved locally and will sync automatically once you reconnect.'}</p>
    <div class="stat-grid" style="margin-top:14px;">
      <div class="stat-card"><div class="stat-num">${pendingP.length+pendingS.length}</div><div class="stat-label">Records waiting to sync</div></div>
      <div class="stat-card"><div class="stat-num">${DB.patients.length-pendingP.length+DB.screenings.length-pendingS.length}</div><div class="stat-label">Synced records</div></div>
    </div>
    <button class="btn btn-primary" id="sync-now" ${DB.online?'':'disabled'}>${DB.online?'Sync now':'Cannot sync while offline'}</button>
  </div>`;
}
function syncNow(){
  if(!DB.online){ toast('You are offline. Reconnect to sync.'); return; }
  const n = pendingSyncCount();
  DB.patients.forEach(p=>p.sync='SYNCED');
  DB.screenings.forEach(s=>s.sync='SYNCED');
  saveDB();
  toast(n>0?`${n} record(s) synced successfully.`:'Everything is already synced.');
  render();
}

/* ===================== SETTINGS ===================== */
