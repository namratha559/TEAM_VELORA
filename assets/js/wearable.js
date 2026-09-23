function renderSensorStep(w){
  const s = w.sensor;
  return `
  <h3>Wearable sensors — Flex + IMU</h3>
  <p style="color:var(--muted);font-size:13px;">Connect the ESP32 wearable over Bluetooth, or use the demo sensor if hardware is unavailable.</p>
  <div class="sim-box">
    ${!s.connected ? `
      <p style="font-size:13.5px;color:var(--muted);">ESP32: <strong>Disconnected</strong></p>
      <div class="btn-row" style="justify-content:center;">
        <button class="btn btn-outline btn-sm" id="sensor-connect">Connect device</button>
        <button class="btn btn-primary btn-sm" id="sensor-demo">Use Demo Sensor</button>
      </div>` : `
      <p style="font-size:13.5px;"><span class="badge badge-low">Connected</span> ${s.demo?'<span class="demo-flag">DEMO SENSOR</span>':''} · Battery ${s.battery||'87'}%</p>
      <div class="metric-grid">
        <div class="metric"><div class="m-val">${s.leftAngle||'—'}°</div><div class="m-lbl">Left knee angle</div></div>
        <div class="metric"><div class="m-val">${s.leftROM||'—'}°</div><div class="m-lbl">Left ROM</div></div>
        <div class="metric"><div class="m-val">${s.rightAngle||'—'}°</div><div class="m-lbl">Right knee angle</div></div>
        <div class="metric"><div class="m-val">${s.rightROM||'—'}°</div><div class="m-lbl">Right ROM</div></div>
      </div>
      <p style="font-size:12.5px;color:var(--muted);margin-top:12px;">IMU movement summary: <strong>${s.imuStability||'Normal'}</strong></p>
      <div class="btn-row" style="justify-content:center;">
        ${!s.recording ? `<button class="btn btn-primary btn-sm" id="sensor-start">Start recording</button>` : `<button class="btn btn-outline btn-sm" id="sensor-stop">Stop recording</button>`}
        <button class="btn btn-ghost btn-sm" id="sensor-calibrate">Calibrate</button>
      </div>
      ${s.done?`<p style="color:var(--low);font-size:12.5px;margin-top:8px;">✓ Recording captured.</p>`:''}
    `}
  </div>
  <p style="font-size:12px;color:var(--muted);margin-top:10px;">Sensor values are prototype measurements and are not clinically validated.</p>`;
}
/* Part 10 — data quality gate: checked before AI is allowed to run confidently. */
function computeDataQuality(w){
  const camOk = w.camera.done && w.camera.quality!=='Poor';
  const sensOk = w.sensor.done;
  const q = {
    camera: !w.camera.done?'Not tested':w.camera.quality,
    wearable: sensOk?'Good':'Not tested',
    calibration: w.camera.calibrated? (w.camera.calibrationQuality>=70?'Good':'Fair') : 'Not calibrated',
    questionnaire: 'Complete',
    sufficient: true
  };
  q.sufficient = !(w.camera.done && !camOk); // if camera was attempted but poor quality, flag insufficient
  return q;
}
/* Part 8 — confidence-weighted sensor fusion (camera + flex/IMU demo stream). Not a plain average:
   each modality's estimate is weighted by its own confidence score. */
function fuseKneeAngle(w){
  const sources=[];
  if(w.camera.done && w.camera.maxAngle!=null) sources.push({val:w.camera.maxAngle, conf:(w.camera.avgConfidence||50)/100});
  if(w.sensor.done && w.sensor.leftAngle) sources.push({val:w.sensor.leftAngle, conf:0.75});
  if(!sources.length) return null;
  const wsum = sources.reduce((a,s)=>a+s.conf,0);
  const fused = sources.reduce((a,s)=>a+s.val*s.conf,0)/wsum;
  const disagreement = sources.length>1 ? Math.abs(sources[0].val-sources[1].val) : 0;
  return {angle:Math.round(fused), disagree: disagreement>20};
}

function tickSensorValues(w){
  w.sensor.leftAngle = 60+Math.round(Math.random()*25);
  w.sensor.leftROM = 75+Math.round(Math.random()*25);
  w.sensor.rightAngle = 60+Math.round(Math.random()*25);
  w.sensor.rightROM = 75+Math.round(Math.random()*25);
  w.sensor.imuStability = w.sensor.leftROM<85 ? 'Reduced' : 'Normal';
}

