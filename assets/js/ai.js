function computeAI(w){
  const sym = w.symptoms; let score=0; const ind=[];
  score += sym.pain*3; if(sym.pain>=6) ind.push(`Increased reported pain (${sym.pain}/10)`);
  if(sym.stiffness){score+=6; ind.push('Reported joint stiffness');}
  if(sym.walking){score+=6; ind.push('Difficulty walking');}
  if(sym.stairs){score+=5; ind.push('Difficulty on stairs');}
  if(sym.standing){score+=4; ind.push('Difficulty standing for periods');}
  if(sym.gettingUp){score+=4; ind.push('Difficulty getting up from a chair');}
  if(sym.dailyLimitation){score+=4; ind.push('Daily activities limited by joint pain');}
  if(w.camera.done){
    if(w.camera.rom!=null && w.camera.rom<80){score+=(80-w.camera.rom)*0.6; ind.push(`Reduced estimated knee ROM (${w.camera.rom}°)`);}
    if(w.camera.quality==='Poor') ind.push('Low camera tracking confidence — treat camera indicators cautiously');
  }
  if(w.sensor.done){
    const romAvg=((w.sensor.leftROM||100)+(w.sensor.rightROM||100))/2;
    if(romAvg<90){score+=(90-romAvg)*0.5; ind.push('Reduced knee range of motion (wearable)');}
  }
  const fusion = fuseKneeAngle(w);
  if(fusion && fusion.disagree) ind.push('Sensor disagreement — recalibration recommended');
  let risk='low';
  if(score>=55) risk='high'; else if(score>=28) risk='moderate';
  if(!ind.length) ind.push('No significant risk indicators reported');
  let coverage=1; // clinical always present
  if(w.camera.done) coverage++;
  if(w.sensor.done) coverage+=2; // flex + imu
  return {risk, indicators:ind, score:Math.round(score), coverage, quality:computeDataQuality(w)};
}
function renderAiStep(w){
  const coverageParts = [
    ['Clinical', true],['Camera', w.camera.done],['Flex sensor', w.sensor.done],['IMU', w.sensor.done]
  ];
  const q = computeDataQuality(w);
  return `
  <h3>${t('ai_result')}</h3>
  <p style="color:var(--muted);font-size:13px;">The AI combines whichever data modalities are available. This is a screening aid, not a diagnosis.</p>
  <div class="coverage-row">${coverageParts.map(([l,on])=>`<span class="cov-chip ${on?'on':''}">${l}</span>`).join('')}</div>
  <p style="margin-top:10px;font-size:12.5px;">${t('data_quality')}: Camera <span class="q-badge ${q.camera==='Good'?'good':q.camera==='Fair'?'fair':'poor'}">${q.camera}</span>
    Wearable <span class="q-badge ${q.wearable==='Good'?'good':'poor'}">${q.wearable}</span>
    Calibration <span class="q-badge ${q.calibration==='Good'?'good':q.calibration==='Fair'?'fair':'poor'}">${q.calibration}</span>
    Questionnaire <span class="q-badge good">${q.questionnaire}</span></p>
  ${w.ai ? `
    <div class="risk-banner ${w.ai.risk}" style="margin-top:16px;">
      <div class="rb-title">${riskLabel(w.ai.risk)}</div>
      <div class="rb-sub">Data coverage: ${w.ai.coverage}/4 modalities</div>
    </div>
    <h4 style="margin-top:14px;">Contributing indicators</h4>
    <ul class="indicator-list">${w.ai.indicators.map(i=>`<li>✓ ${i}</li>`).join('')}</ul>
    <p style="color:var(--muted);font-size:12px;margin-top:10px;">Model version: sih-screen-v0.1-prototype · Generated ${new Date().toLocaleString()}</p>
    <p style="color:var(--high);font-size:12.5px;margin-top:8px;font-weight:600;">${t('ai_disclaimer')}</p>
  ` : `<button class="btn btn-primary" style="margin-top:16px;" id="run-ai">Run AI Screening</button>
    ${!q.sufficient?`<p style="color:var(--high);font-size:12.5px;margin-top:8px;">${t('insufficient')}</p>`:''}`}`;
}
