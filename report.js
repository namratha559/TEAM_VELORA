let viewingScreeningId=null;
function renderResultPage(ctx){
  const s = DB.screenings.find(x=>x.id===viewingScreeningId) || latestScreening(DB.currentUser.patientId||DB.detailId);
  if(!s) return `<div class="empty-state">No screening result available.</div>`;
  const p = getPatient(s.patientId);
  return `
  <div class="risk-banner ${s.risk}"><div class="rb-title">${riskLabel(s.risk)}</div><div class="rb-sub">${p.name} · ${fmtDate(s.date)}</div></div>
  <div class="card">
    <h3>Assessment summary</h3>
    <div class="metric-grid">
      <div class="metric"><div class="m-val">${s.symptoms.pain}/10</div><div class="m-lbl">Pain</div></div>
      <div class="metric"><div class="m-val">${s.camera?.symmetry||'—'}%</div><div class="m-lbl">Symmetry</div></div>
      <div class="metric"><div class="m-val">${s.sensor?.leftROM||'—'}°</div><div class="m-lbl">Left ROM</div></div>
      <div class="metric"><div class="m-val">${s.coverage}/4</div><div class="m-lbl">Data coverage</div></div>
    </div>
  </div>
  <div class="card"><h3>Key indicators</h3><ul class="indicator-list">${s.indicators.map(i=>`<li>✓ ${i}</li>`).join('')}</ul></div>
  <div class="card"><h3>Next step</h3><p style="font-size:14px;">Consider professional clinical evaluation. This is a screening result, not a diagnosis.</p></div>
  <div class="btn-row"><button class="btn btn-primary" id="gen-report-btn" data-sid="${s.id}">Generate report</button></div>`;
}
function renderReportPage(ctx){
  const s = DB.screenings.find(x=>x.id===viewingScreeningId);
  const p = getPatient(s.patientId);
  return `
  <div class="report-block">
    <div class="brand" style="margin-bottom:18px;"><div class="brand-mark">S</div><div class="brand-text"><h2>SIH Screening Report</h2><p>OA Screening Summary</p></div></div>
    <div class="rline"><span>Patient</span><strong>${p.name}</strong></div>
    <div class="rline"><span>Patient ID</span><strong>${p.id}</strong></div>
    <div class="rline"><span>Screening date</span><strong>${fmtDate(s.date)}</strong></div>
    <div class="rline"><span>Pain (0–10)</span><strong>${s.symptoms.pain}</strong></div>
    <div class="rline"><span>Camera symmetry</span><strong>${s.camera?.symmetry||'Not tested'}${s.camera?.symmetry?'%':''}</strong></div>
    <div class="rline"><span>Flex ROM (L/R)</span><strong>${s.sensor?.leftROM||'—'}° / ${s.sensor?.rightROM||'—'}°</strong></div>
    <div class="rline"><span>AI screening risk</span><strong>${riskLabel(s.risk)}</strong></div>
    <div class="rline"><span>Data coverage</span><strong>${s.coverage}/4 modalities</strong></div>
    <h3 style="margin-top:16px;">Contributing indicators</h3>
    <ul class="indicator-list">${s.indicators.map(i=>`<li>${i}</li>`).join('')}</ul>
    <div class="disclaimer">This report provides AI-assisted screening information and does not replace professional medical diagnosis.</div>
    <div class="btn-row"><button class="btn btn-primary btn-sm" onclick="window.print()">Print / Save PDF</button></div>
  </div>`;
}

/* ===================== DOCTOR ===================== */
