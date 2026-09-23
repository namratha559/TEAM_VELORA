const CAM_TESTS = {
  flex:{label:'Knee Flexion/Extension', instr:'Place the phone so your full body is visible, about 2 metres away. Stand straight, then slowly bend and straighten the knee.'},
  sts:{label:'Sit-to-Stand', instr:'Place the phone so your full body and a chair are visible. Sit, then stand up and sit back down at a normal pace.'},
  gait:{label:'Walking / Gait', instr:'Place the phone so it can see you walk toward it for a few steps. Walk forward normally.'}
};
function renderCameraStep(w){
  const c = w.camera;
  if(c.done){
    return `
    <h3>${t('cam_title')}</h3>
    <div class="sim-box">
      <div class="sim-status"><span class="ok">Camera ✓</span><span class="ok">Pose detected ✓</span><span class="ok">Analysis complete ✓</span></div>
      <div class="metric-grid">
        <div class="metric"><div class="m-val">${c.minAngle!=null?c.minAngle+'°':'—'}</div><div class="m-lbl">Min angle</div></div>
        <div class="metric"><div class="m-val">${c.maxAngle!=null?c.maxAngle+'°':'—'}</div><div class="m-lbl">Max flexion</div></div>
        <div class="metric"><div class="m-val">${c.rom!=null?c.rom+'°':'—'}</div><div class="m-lbl">Estimated ROM</div></div>
        <div class="metric"><div class="m-val">${c.reps||0}</div><div class="m-lbl">Repetitions</div></div>
        <div class="metric"><div class="m-val">${c.avgConfidence!=null?c.avgConfidence+'%':'—'}</div><div class="m-lbl">Camera confidence</div></div>
        <div class="metric"><div class="m-val">${c.symmetry!=null?c.symmetry+'%':'N/A'}</div><div class="m-lbl">Movement symmetry</div></div>
      </div>
      <p style="margin-top:12px;">Data quality: <span class="q-badge ${c.quality==='Good'?'good':c.quality==='Fair'?'fair':'poor'}">${c.quality||'—'}</span></p>
      <button class="btn btn-outline btn-sm" style="margin-top:10px;" id="camera-retake">Retake test</button>
    </div>
    <p style="font-size:12px;color:var(--muted);margin-top:10px;">Estimated from on-device pose tracking. Not a clinical-grade measurement.</p>`;
  }
  return `
  <h3>${t('cam_title')} ${voiceBtns(CAM_TESTS[c.testType].instr)}</h3>
  <div class="test-tabs">${Object.entries(CAM_TESTS).map(([k,v])=>`<div class="test-tab ${c.testType===k?'active':''}" data-cam-test="${k}">${v.label}</div>`).join('')}</div>
  <p style="color:var(--muted);font-size:13px;">${CAM_TESTS[c.testType].instr} Raw video is never stored — only movement features are extracted, on-device.</p>
  <div class="sim-box" id="cam-box">
    <button class="btn btn-primary" id="camera-run">${t('cam_start')}</button>
    <div id="cam-error"></div>
  </div>`;
}
/* ===================== CAMERA POSE ENGINE (Parts 3-6, 9-10) ===================== */
/* Real getUserMedia + MediaPipe Pose Landmarker. No fabricated values: if the camera or
   model cannot load, we show t('cam_unavailable') and do not produce a result. */
let CAM = {stream:null, video:null, canvas:null, ctx:null, landmarker:null, raf:null, active:false,
  angleBuf:[], confBuf:[], flexed:false, startTs:0};
async function ensurePoseModel(){
  if(CAM.landmarker) return CAM.landmarker;
  const vis = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14');
  const fileset = await vis.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
  CAM.landmarker = await vis.PoseLandmarker.createFromOptions(fileset, {
    baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task', delegate:'GPU'},
    runningMode:'VIDEO', numPoses:1
  });
  return CAM.landmarker;
}
function angleBetween(a,b,c){
  const ab={x:a.x-b.x,y:a.y-b.y}, cb={x:c.x-b.x,y:c.y-b.y};
  const dot=ab.x*cb.x+ab.y*cb.y, magA=Math.hypot(ab.x,ab.y), magC=Math.hypot(cb.x,cb.y);
  if(magA<1e-6||magC<1e-6) return null;
  const cos=Math.min(1,Math.max(-1,dot/(magA*magC)));
  return Math.round(Math.acos(cos)*180/Math.PI);
}
async function startCameraTracking(w){
  const box=document.getElementById('cam-box');
  box.innerHTML = `<p style="font-size:12.5px;color:var(--muted);">Loading camera & pose model…</p>`;
  try{
    CAM.stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'}, audio:false});
  }catch(e){
    box.innerHTML = `<div class="cam-warn">${t('cam_unavailable')}</div>`; return;
  }
  try{ await ensurePoseModel(); }
  catch(e){
    CAM.stream.getTracks().forEach(tr=>tr.stop());
    box.innerHTML = `<div class="cam-warn">${t('cam_unavailable')}</div>`; return;
  }
  box.innerHTML = `<div class="cam-wrap"><video id="cam-video" autoplay playsinline muted></video><canvas id="cam-overlay"></canvas></div>
    <div class="cam-live">
      <div>${t('live_angle')}<b id="lv-angle">—</b></div>
      <div>${t('live_move')}<b id="lv-move">—</b></div>
      <div>${t('live_maxflex')}<b id="lv-max">—</b></div>
      <div>${t('live_rom')}<b id="lv-rom">—</b></div>
      <div>${t('live_conf')}<b id="lv-conf">—</b></div>
    </div>
    <div class="btn-row" style="justify-content:center;margin-top:12px;">
      <button class="btn btn-primary btn-sm" id="camera-finish">Finish test</button>
      <button class="btn btn-outline btn-sm" id="camera-cancel">Cancel</button>
    </div>`;
  CAM.video = document.getElementById('cam-video');
  CAM.video.srcObject = CAM.stream;
  CAM.canvas = document.getElementById('cam-overlay'); CAM.ctx = CAM.canvas.getContext('2d');
  await new Promise(res=>{ CAM.video.onloadedmetadata=()=>{ CAM.canvas.width=CAM.video.videoWidth; CAM.canvas.height=CAM.video.videoHeight; res(); }; });
  CAM.active=true; CAM.angleBuf=[]; CAM.confBuf=[]; CAM.flexed=false; CAM.startTs=performance.now();
  w.camera.minAngle=null; w.camera.maxAngle=null; w.camera.reps=0;
  poseLoop(w);
  document.getElementById('camera-finish').onclick=()=>finishCameraTest(w);
  document.getElementById('camera-cancel').onclick=()=>{ stopCameraTracking(); render(); };
}
function poseLoop(w){
  if(!CAM.active) return;
  const now = performance.now();
  let result;
  try{ result = CAM.landmarker.detectForVideo(CAM.video, now); }catch(e){ result=null; }
  if(result && result.landmarks && result.landmarks.length){
    const lm = result.landmarks[0];
    const visR=((lm[24].visibility||0)+(lm[26].visibility||0)+(lm[28].visibility||0))/3;
    const visL=((lm[23].visibility||0)+(lm[25].visibility||0)+(lm[27].visibility||0))/3;
    const right = visR>=visL;
    const hip=right?lm[24]:lm[23], knee=right?lm[26]:lm[25], ankle=right?lm[28]:lm[27];
    const raw = angleBetween(hip,knee,ankle);
    const conf = Math.round(Math.max(visR,visL)*100);
    if(raw!=null){
      CAM.angleBuf.push(raw); if(CAM.angleBuf.length>6) CAM.angleBuf.shift();
      const smoothed = Math.round(CAM.angleBuf.reduce((a,b)=>a+b,0)/CAM.angleBuf.length);
      CAM.confBuf.push(conf); if(CAM.confBuf.length>30) CAM.confBuf.shift();
      if(w.camera.minAngle==null||smoothed<w.camera.minAngle) w.camera.minAngle=smoothed;
      if(w.camera.maxAngle==null||smoothed>w.camera.maxAngle) w.camera.maxAngle=smoothed;
      // simple flex/extend rep counter for the knee test
      if(smoothed<110) CAM.flexed=true;
      else if(smoothed>155 && CAM.flexed){ w.camera.reps++; CAM.flexed=false; }
      const el=id=>document.getElementById(id);
      if(el('lv-angle')) el('lv-angle').textContent=smoothed+'°';
      if(el('lv-move')) el('lv-move').textContent = CAM.flexed?'FLEXION':'EXTENSION';
      if(el('lv-max')) el('lv-max').textContent=(w.camera.maxAngle||smoothed)+'°';
      if(el('lv-rom')) el('lv-rom').textContent=((w.camera.maxAngle||smoothed)-(w.camera.minAngle||smoothed))+'°';
      if(el('lv-conf')) el('lv-conf').textContent=conf+'%';
    }
    drawOverlay(lm, right);
  }
  CAM.raf = requestAnimationFrame(()=>poseLoop(w));
}
function drawOverlay(lm, right){
  const ctx=CAM.ctx, W=CAM.canvas.width, H=CAM.canvas.height;
  ctx.clearRect(0,0,W,H);
  const idx = right?[24,26,28]:[23,25,27];
  const pts = idx.map(i=>({x:lm[i].x*W,y:lm[i].y*H}));
  ctx.strokeStyle='#28E0A0'; ctx.lineWidth=4; ctx.beginPath();
  ctx.moveTo(pts[0].x,pts[0].y); ctx.lineTo(pts[1].x,pts[1].y); ctx.lineTo(pts[2].x,pts[2].y); ctx.stroke();
  ctx.fillStyle='#ffffff'; pts.forEach(p=>{ ctx.beginPath(); ctx.arc(p.x,p.y,6,0,7); ctx.fill(); });
}
function stopCameraTracking(){
  CAM.active=false;
  if(CAM.raf) cancelAnimationFrame(CAM.raf);
  if(CAM.stream) CAM.stream.getTracks().forEach(tr=>tr.stop());
  CAM.stream=null; CAM.video=null;
}
function finishCameraTest(w){
  const c=w.camera;
  const duration = Math.round((performance.now()-CAM.startTs)/100)/10;
  const avgConf = CAM.confBuf.length? Math.round(CAM.confBuf.reduce((a,b)=>a+b,0)/CAM.confBuf.length) : 0;
  stopCameraTracking();
  c.rom = (c.maxAngle!=null && c.minAngle!=null) ? (c.maxAngle-c.minAngle) : null;
  c.avgConfidence = avgConf; c.duration = duration;
  c.symmetry = null; // single-limb camera test: left/right symmetry not measurable here
  c.calibrated = true; c.calibrationQuality = avgConf;
  c.quality = (avgConf>=75 && c.rom!=null && c.reps>=1) ? 'Good' : (avgConf>=45 ? 'Fair' : 'Poor');
  c.done = (c.rom!=null); // only mark complete if real measurements were captured
  if(!c.done){ toast(t('insufficient')); }
  else { toast('Camera test complete.'); speak(t('cam_done')); }
  render();
}
