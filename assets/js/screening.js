function riskBadge(risk){
  if(!risk) return '<span class="badge badge-neutral">No screening</span>';
  const map={low:['badge-low','Lower Risk'],moderate:['badge-mod','Moderate Risk'],high:['badge-high','Higher Risk']};
  return `<span class="badge ${map[risk][0]}">${map[risk][1]}</span>`;
}
function riskLabel(risk){ return {low:'Lower Screening Risk',moderate:'Moderate Screening Risk',high:'Higher Screening Risk'}[risk]||''; }

function startScreening(patientId){
  DB.wizard = {
    step:1, patientId,
    symptoms:{pain:5,stiffness:false,walking:false,stairs:false,standing:false,sitting:false,gettingUp:false,injury:false, dailyLimitation:false, walkingAid:false},
    camera:{done:false, testType:'flex', calibrated:false, calibrationQuality:null, minAngle:null,maxAngle:null,rom:null,
      reps:0, avgConfidence:null, quality:null, symmetry:null, duration:0}, sensor:{done:false, recording:false},
    clinical:{ comorbidIllness:[], comorbidOther:'', chiefComplaints:[], chiefComplaintsOther:'', rangeOfMotion:'',
      numericalPainRating:0, painMatrix:{walking:'',stairClimbing:'',nocturnal:'',rest:'',weightBearing:''},
      stiffnessMatrix:{morning:'',later:''},
      physicalFunctionDifficulty:{descendStairs:'',ascendStairs:'',riseSitting:'',standing:'',bendFloor:'',walkLevel:'',carInOut:'',shopping:'',sitting:'',squatting:'',sitCrossLegs:'',lyingBed:'',riseBed:'',bathInOut:'',toiletInOut:'',lightDomestic:'',heavyDomestic:''},
      diagnosis:'', oaDiseaseStage:'', previousTreatment:[], previousTreatmentOther:'' }
  };
  go('worker-screening');
}
function wizStepLabel(n){ return ['Patient Information','Symptoms','Mobility','Camera Test','Wearable Sensors','AI Assessment','Report'][n-1]; }
function renderWizard(){
  const w = DB.wizard; const p = getPatient(w.patientId);
  const steps = Array.from({length:7},(_,i)=>i+1);
  return `
  <div class="wizard-steps">${steps.map(s=>`<div class="wz-step ${s<w.step?'done':s===w.step?'current':''}"></div>`).join('')}</div>
  <div class="wz-label">Step ${w.step} of 7 — ${wizStepLabel(w.step)}</div>
  <div class="card">${renderWizardStep(w,p)}</div>
  <div class="wizard-nav">
    <button class="btn btn-outline" id="wiz-back" ${w.step===1?'disabled':''}>Back</button>
    <button class="btn btn-primary" id="wiz-next">${w.step===8?'Finish & Save':'Continue'}</button>
  </div>`;
}
function renderWizardStep(w,p){
  switch(w.step){
    case 1: return `
      <h3>Confirm patient details</h3>
      <table><tbody>
        <tr><td style="color:var(--muted)">Name</td><td>${p.name}</td></tr>
        <tr><td style="color:var(--muted)">Patient ID</td><td>${p.id}</td></tr>
        <tr><td style="color:var(--muted)">Age / Sex</td><td>${p.age} / ${p.sex}</td></tr>
        <tr><td style="color:var(--muted)">History</td><td>${p.history||'—'}</td></tr>
      </tbody></table>`;
    case 2: return `
      <h3>Symptoms <button class="btn-ghost" onclick="speak('Please rate your pain from zero to ten.')">🔊 Play instruction</button></h3>
      <div class="field">
        <label>Pain severity (0 = none, 10 = worst) — currently ${w.symptoms.pain}</label>
        <input type="range" min="0" max="10" value="${w.symptoms.pain}" class="pain-slider" id="sym-pain">
      </div>
      ${ynRow('Joint stiffness, especially in the morning?','stiffness',w)}
      ${ynRow('Difficulty walking?','walking',w)}
      ${ynRow('Difficulty using stairs?','stairs',w)}
      ${ynRow('Difficulty standing for long periods?','standing',w)}
      ${ynRow('Difficulty sitting for long periods?','sitting',w)}
      ${ynRow('Difficulty getting up from a chair?','gettingUp',w)}
      ${ynRow('Any previous joint injury?','injury',w)}
      ${renderClinicalQuestionnaireExtra(w)}`;
    case 3: return `
      <h3>Mobility & daily activity <button class="btn-ghost" onclick="speak('Please walk forward normally.')">🔊 Play instruction</button></h3>
      ${ynRow('Are daily activities limited because of joint pain?','dailyLimitation',w)}
      ${ynRow('Does the patient use a walking aid (stick/support)?','walkingAid',w)}
      <p style="color:var(--muted);font-size:12.5px;margin-top:10px;">These responses combine with the camera and sensor tests to build a fuller movement picture.</p>`;
    case 4: return renderCameraStep(w);
    case 5: return renderSensorStep(w);
    case 6: return renderAiStep(w);
    case 7: return renderReportStep(w);
  }
}
/* ---- Additional clinical questionnaire fields (added) ---- */
function chkGroup(label,options,key,otherKey,w){
  const arr=w.clinical[key];
  return `<div class="q-row" style="flex-direction:column;align-items:flex-start;">
    <div class="q-label">${label}</div>
    <div class="yn-row">${options.map(o=>`<button class="yn-btn ${arr.includes(o)?'selected':''}" data-chk="${key}" data-opt="${o}">${o}</button>`).join('')}</div>
    ${arr.includes('Other')?`<div class="field" style="margin-top:8px;width:100%;"><input id="${otherKey}" placeholder="Specify other" value="${w.clinical[otherKey]||''}"></div>`:''}
  </div>`;
}
function scaleRow(label,key,max,w){
  const val=w.clinical[key];
  return `<div class="q-row" style="flex-direction:column;align-items:flex-start;">
    <div class="q-label">${label} (0 = No pain, ${max} = Unbearable pain)</div>
    <div class="yn-row">${Array.from({length:max+1},(_,i)=>i).map(n=>`<button class="yn-btn ${val===n?'selected':''}" data-scale="${key}" data-val="${n}">${n}</button>`).join('')}</div>
  </div>`;
}
function matrixQuestion(label,rows,cols,key,w){
  const data=w.clinical[key];
  return `<div class="q-row" style="flex-direction:column;align-items:flex-start;">
    <div class="q-label">${label}</div>
    <table class="matrix-table"><thead><tr><th></th>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(([rk,rl])=>`<tr><td>${rl}</td>${cols.map(c=>`<td><input type="radio" name="mx-${key}-${rk}" data-matrix="${key}" data-row="${rk}" value="${c}" ${data[rk]===c?'checked':''}></td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  </div>`;
}
function renderClinicalQuestionnaireExtra(w){
  const c=w.clinical;
  return `
  ${chkGroup('Comorbid Illness',['DM','HT','Thyroid','RA','CVA','CAD','Other'],'comorbidIllness','comorbidOther',w)}
  ${chkGroup('Chief Complaints',['Pain','Swelling','Stiffness','Difficulty in ADL','Other'],'chiefComplaints','chiefComplaintsOther',w)}
  <div class="field"><label>Range of Motion (e.g. Right Knee 10-110)</label><input id="cq-rom" placeholder="Right Knee 10-110" value="${c.rangeOfMotion||''}"></div>
  ${scaleRow('Numerical Pain Rating','numericalPainRating',10,w)}
  ${matrixQuestion('Pain',[['walking','Walking'],['stairClimbing','Stair Climbing'],['nocturnal','Nocturnal'],['rest','Rest'],['weightBearing','Weight bearing']],['None','Slight','Moderate','Very','Extremely'],'painMatrix',w)}
  ${matrixQuestion('Stiffness',[['morning','Morning'],['later','Later']],['None','Slight','Moderate','Very','Extremely'],'stiffnessMatrix',w)}
  ${matrixQuestion('Physical Function Difficulty',[['descendStairs','Descend stairs'],['ascendStairs','Ascend stairs'],['riseSitting','Raise from sitting'],['standing','Standing'],['bendFloor','Bend to floor'],['walkLevel','Walk on level ground'],['carInOut','Get into/out of car'],['shopping','Shopping'],['sitting','Sitting'],['squatting','Squatting'],['sitCrossLegs','Sitting cross legs'],['lyingBed','Lying in bed'],['riseBed','Raising from bed'],['bathInOut','Getting in/out of bath'],['toiletInOut','Getting on/off toilet'],['lightDomestic','Light domestic duty'],['heavyDomestic','Heavy domestic duty']],['None','Slight','Moderate','Very','Extremely'],'physicalFunctionDifficulty',w)}
  <div class="field"><label>Diagnosis (clinical reference only, not AI-derived)</label><input id="cq-diagnosis" placeholder="Clinical diagnosis" value="${c.diagnosis||''}"></div>
  <div class="q-row" style="flex-direction:column;align-items:flex-start;">
    <div class="q-label">Disease Staging of OA — Kellgren Lawrence Staging</div>
    <div class="yn-row">${['1','2','3','4'].map(n=>`<button class="yn-btn ${c.oaDiseaseStage===n?'selected':''}" data-scale="oaDiseaseStage" data-val="${n}">${n}</button>`).join('')}</div>
  </div>
  ${chkGroup('Previous treatment',['None','LA','Steroid injections','Bracing/Splinting','Physiotherapy','Native treatment','Other'],'previousTreatment','previousTreatmentOther',w)}`;
}
function ynRow(label,key,w){
  return `<div class="q-row"><div class="q-label">${label}</div>
    <div class="yn-row">
      <button class="yn-btn ${w.symptoms[key]?'selected':''}" data-yn="${key}" data-val="true">Yes</button>
      <button class="yn-btn ${!w.symptoms[key]?'selected':''}" data-yn="${key}" data-val="false">No</button>
    </div></div>`;
}

function renderReportStep(w){
  const p = getPatient(w.patientId);
  return `
  <h3>Ready to save</h3>
  <p style="color:var(--muted);font-size:13.5px;">Saving will create the digital report for ${p.name} and file it under their patient record${DB.online?'.':' (stored locally, marked pending sync).'}</p>
  ${w.ai?`<div class="risk-banner ${w.ai.risk}"><div class="rb-title">${riskLabel(w.ai.risk)}</div></div>`:''}
  <p style="font-size:12.5px;color:var(--muted);">Click "Finish & Save" to generate the report and return to the patient profile.</p>`;
}

function wizardNext(){
  const w = DB.wizard;
  if(CAM.active) stopCameraTracking();
  if(w.step<7){ w.step++; render(); }
  else{ finishScreening(); }
}
function wizardBack(){ if(CAM.active) stopCameraTracking(); if(DB.wizard.step>1){ DB.wizard.step--; render(); } }
function finishScreening(){
  const w = DB.wizard;
  if(!w.ai) w.ai = computeAI(w);
  const id = 'SCR-' + String(DB.screenings.length+1).padStart(6,'0');
  const record = {
    id, patientId:w.patientId, date:Date.now(), sync: DB.online?'SYNCED':'PENDING', demo:false,
    symptoms:w.symptoms, camera:w.camera, sensor:w.sensor, clinical:w.clinical,
    coverage:w.ai.coverage, risk:w.ai.risk, indicators:w.ai.indicators, notes:[], referral:null
  };
  DB.screenings.push(record); saveDB();
  toast('Screening saved' + (DB.online?'.':' — pending sync.'));
  DB.wizard=null;
  go('worker-patient-detail', {detailId: w.patientId});
}

/* ===================== RESULT / REPORT PAGES (from history) ===================== */

function attachWizardStepEvents(){
  const w=DB.wizard; if(!w) return;
  const painSlider=document.getElementById('sym-pain'); if(painSlider) painSlider.oninput=(e)=>{ w.symptoms.pain=+e.target.value; render(); };
  document.querySelectorAll('[data-yn]').forEach(b=>b.onclick=()=>{ w.symptoms[b.dataset.yn]=b.dataset.val==='true'; render(); });
  document.querySelectorAll('[data-cam-test]').forEach(b=>b.onclick=()=>{ w.camera.testType=b.dataset.camTest; render(); });
  const camRun=document.getElementById('camera-run'); if(camRun) camRun.onclick=()=>startCameraTracking(w);
  const camRetake=document.getElementById('camera-retake'); if(camRetake) camRetake.onclick=()=>{
    const tt=w.camera.testType;
    w.camera={done:false, testType:tt, calibrated:false, calibrationQuality:null, minAngle:null,maxAngle:null,rom:null,
      reps:0, avgConfidence:null, quality:null, symmetry:null, duration:0};
    render();
  };
  const sensConnect=document.getElementById('sensor-connect'); if(sensConnect) sensConnect.onclick=()=>{
    toast('No ESP32 device found nearby. Try "Use Demo Sensor" instead.');
  };
  const sensDemo=document.getElementById('sensor-demo'); if(sensDemo) sensDemo.onclick=()=>{
    w.sensor.connected=true; w.sensor.demo=true; w.sensor.battery=Math.round(70+Math.random()*25);
    tickSensorValues(w); render();
  };
  const sensStart=document.getElementById('sensor-start'); if(sensStart) sensStart.onclick=()=>{
    w.sensor.recording=true; render();
    let ticks=0;
    const iv=setInterval(()=>{ tickSensorValues(w); ticks++; if(document.getElementById('sensor-stop')) render(); if(ticks>20 || !w.sensor.recording){ clearInterval(iv); } }, 600);
    w._sensorInterval=iv;
  };
  const sensStop=document.getElementById('sensor-stop'); if(sensStop) sensStop.onclick=()=>{
    w.sensor.recording=false; w.sensor.done=true; if(w._sensorInterval) clearInterval(w._sensorInterval); render();
  };
  const sensCal=document.getElementById('sensor-calibrate'); if(sensCal) sensCal.onclick=()=>{ toast('Sensor calibrated.'); };
  const runAi=document.getElementById('run-ai'); if(runAi) runAi.onclick=()=>{ w.ai=computeAI(w); render(); };
  // New clinical questionnaire fields
  document.querySelectorAll('[data-chk]').forEach(b=>b.onclick=()=>{
    const key=b.dataset.chk, opt=b.dataset.opt, arr=w.clinical[key], i=arr.indexOf(opt);
    if(i>-1) arr.splice(i,1); else arr.push(opt); render();
  });
  document.querySelectorAll('[data-scale]').forEach(b=>b.onclick=()=>{
    const key=b.dataset.scale; w.clinical[key]= key==='oaDiseaseStage' ? b.dataset.val : +b.dataset.val; render();
  });
  document.querySelectorAll('[data-matrix]').forEach(r=>r.onchange=(e)=>{ w.clinical[e.target.dataset.matrix][e.target.dataset.row]=e.target.value; });
  const cqRom=document.getElementById('cq-rom'); if(cqRom) cqRom.oninput=(e)=>{ w.clinical.rangeOfMotion=e.target.value; };
  const cqDiag=document.getElementById('cq-diagnosis'); if(cqDiag) cqDiag.oninput=(e)=>{ w.clinical.diagnosis=e.target.value; };
  const cqComOther=document.getElementById('comorbidOther'); if(cqComOther) cqComOther.oninput=(e)=>{ w.clinical.comorbidOther=e.target.value; };
  const cqCompOther=document.getElementById('chiefComplaintsOther'); if(cqCompOther) cqCompOther.oninput=(e)=>{ w.clinical.chiefComplaintsOther=e.target.value; };
  const cqPrevOther=document.getElementById('previousTreatmentOther'); if(cqPrevOther) cqPrevOther.oninput=(e)=>{ w.clinical.previousTreatmentOther=e.target.value; };
}
