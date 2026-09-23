function renderQrGenerated(){
  const p = getPatient(DB.detailId);
  return `
  <div class="card" style="max-width:420px;text-align:center;">
    <h3>Patient registered</h3>
    <p style="color:var(--muted);font-size:13.5px;">${p.name} · ${p.id}</p>
    <div class="qr-box"><div id="qr-canvas"></div></div>
    <div class="btn-row" style="justify-content:center;">
      <button class="btn btn-outline btn-sm" id="qr-download">Download QR</button>
      <button class="btn btn-outline btn-sm" onclick="window.print()">Print</button>
    </div>
    <div class="btn-row" style="justify-content:center;">
      <button class="btn btn-primary" id="start-screening-now">Start screening now</button>
      <button class="btn btn-ghost" data-nav="worker-patients">Back to patients</button>
    </div>
  </div>`;
}

/* ===================== PATIENT DETAIL ===================== */

function openScanModal(){
  openModal(`
    <h3>Scan patient QR</h3>
    <video id="qr-video" autoplay playsinline></video>
    <canvas id="qr-canvas-hidden" class="hidden"></canvas>
    <p id="scan-status" style="font-size:12.5px;color:var(--muted);margin:10px 0;">Point the camera at the patient's QR code.</p>
    <div class="field"><label>Or enter Patient ID manually</label><input id="manual-pid" placeholder="SIH-OA-000001"></div>
    <div class="btn-row"><button class="btn btn-primary btn-sm" id="manual-pid-go">Find patient</button><button class="btn btn-outline btn-sm" onclick="closeModal()">Cancel</button></div>
  `);
  startCameraScan();
}
let scanStream=null, scanRAF=null;
function startCameraScan(){
  const video=document.getElementById('qr-video');
  navigator.mediaDevices?.getUserMedia({video:{facingMode:'environment'}}).then(stream=>{
    scanStream=stream; video.srcObject=stream;
    const canvas=document.getElementById('qr-canvas-hidden'); const ctx=canvas.getContext('2d');
    const tick=()=>{
      if(!document.getElementById('qr-video')) return;
      if(video.readyState===video.HAVE_ENOUGH_DATA){
        canvas.width=video.videoWidth; canvas.height=video.videoHeight;
        ctx.drawImage(video,0,0,canvas.width,canvas.height);
        const img=ctx.getImageData(0,0,canvas.width,canvas.height);
        const code = window.jsQR ? jsQR(img.data,img.width,img.height) : null;
        if(code){ handleScanResult(code.data); return; }
      }
      scanRAF=requestAnimationFrame(tick);
    };
    scanRAF=requestAnimationFrame(tick);
  }).catch(()=>{
    document.getElementById('scan-status').textContent='Camera unavailable — enter the Patient ID manually below.';
  });
}
function stopCameraScan(){
  if(scanRAF) cancelAnimationFrame(scanRAF);
  if(scanStream){ scanStream.getTracks().forEach(t=>t.stop()); scanStream=null; }
}
function handleScanResult(pid){
  stopCameraScan(); closeModal();
  routeToPatientOrNotFound(pid.trim());
}
function routeToPatientOrNotFound(pid){
  const p=getPatient(pid);
  const ctxRole = DB.currentUser.role==='doctor'?'doctor':'worker';
  if(p){ go(ctxRole+'-patient-detail', {detailId:p.id}); toast(`Patient ${p.id} found.`); }
  else{ toast('Patient record not found.'); go('worker-register'); }
}


function renderQrIfNeeded(){
  const holder=document.getElementById('qr-canvas');
  if(holder && window.QRCode){
    holder.innerHTML='';
    const pid = DB.currentUser.role==='patient' ? DB.currentUser.patientId : DB.detailId;
    new QRCode(holder, {text:pid, width:170, height:170, colorDark:'#0F5142', colorLight:'#ffffff'});
  }
}
