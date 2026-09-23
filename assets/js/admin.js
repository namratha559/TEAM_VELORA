function renderAdminDashboard(){
  const riskCounts={low:0,moderate:0,high:0};
  DB.screenings.forEach(s=>riskCounts[s.risk]!==undefined && riskCounts[s.risk]++);
  const total = DB.screenings.length||1;
  return `
  <div class="stat-grid">
    <div class="stat-card"><div class="stat-num">${DB.patients.length}</div><div class="stat-label">Total patients</div></div>
    <div class="stat-card"><div class="stat-num">${DB.screenings.length}</div><div class="stat-label">Total screenings</div></div>
    <div class="stat-card risk"><div class="stat-num">${Math.round(riskCounts.high/total*100)}%</div><div class="stat-label">Higher-risk share</div></div>
    <div class="stat-card"><div class="stat-num">${DB.camps.length}</div><div class="stat-label">Health camps</div></div>
    <div class="stat-card"><div class="stat-num">${pendingSyncCount()}</div><div class="stat-label">Pending sync</div></div>
  </div>
  <div class="card"><h3>Risk distribution</h3>${riskBars(riskCounts,total)}</div>
  <div class="card"><h3>District distribution</h3>${districtTable()}</div>`;
}
function riskBars(counts,total){
  const rows=[['Lower','low',counts.low],['Moderate','moderate',counts.moderate],['Higher','high',counts.high]];
  const colorVar={low:'var(--low)',moderate:'var(--mod)',high:'var(--high)'};
  return rows.map(([label,key,val])=>`<div style="margin-bottom:10px;">
    <div style="display:flex;justify-content:space-between;font-size:12.5px;"><span>${label}</span><span>${val} (${Math.round(val/total*100)}%)</span></div>
    <div class="bar-track"><div class="bar-fill" style="width:${val/total*100}%;background:${colorVar[key]}"></div></div>
  </div>`).join('');
}
function districtTable(){
  const byDistrict={};
  DB.patients.forEach(p=>{ byDistrict[p.district||'Unspecified']=(byDistrict[p.district||'Unspecified']||0)+1; });
  const rows=Object.entries(byDistrict);
  if(!rows.length) return `<div class="empty-state">No location data yet.</div>`;
  return `<table><thead><tr><th>District</th><th>Patients</th></tr></thead><tbody>${rows.map(([d,c])=>`<tr><td>${d}</td><td>${c}</td></tr>`).join('')}</tbody></table>`;
}
function renderAdminUsers(){
  return `<div class="card"><h3>Healthcare workers</h3><table><thead><tr><th>Name</th><th>Location</th></tr></thead><tbody>
    <tr><td>Anjali Bora</td><td>NER Rural PHC, Assam</td></tr></tbody></table></div>
  <div class="card"><h3>Doctors</h3><table><thead><tr><th>Name</th></tr></thead><tbody><tr><td>Dr. Kabir Sen</td></tr></tbody></table></div>`;
}
function renderAdminCamps(){
  if(!DB.camps.length) return `<div class="empty-state"><span class="e-icon">⛺</span>No health camps recorded yet.</div>`;
  return `<div class="card"><h3>All health camps</h3><table><thead><tr><th>Name</th><th>Location</th><th>Date</th><th>Patients</th></tr></thead><tbody>
    ${DB.camps.map(c=>`<tr><td>${c.name}</td><td>${c.location}</td><td>${fmtDate(c.date)}</td><td>${DB.patients.filter(p=>p.campId===c.id).length}</td></tr>`).join('')}
  </tbody></table></div>`;
}
function renderAnalytics(){
  const riskCounts={low:0,moderate:0,high:0};
  DB.screenings.forEach(s=>riskCounts[s.risk]!==undefined && riskCounts[s.risk]++);
  const total = DB.screenings.length||1;
  // fake weekly trend derived from actual screening dates bucketed loosely, padded with plausible shape
  const trend = weeklyTrend();
  const max = Math.max(...trend.map(t=>t.v),1);
  return `
  <div class="card"><h3>Risk distribution</h3>${riskBars(riskCounts,total)}</div>
  <div class="card"><h3>Screening trend</h3>
    <div class="trend-row">${trend.map(t=>`<div class="trend-bar" style="height:${Math.max(6,t.v/max*80)}px;"><span>${t.v}</span></div>`).join('')}</div>
    <div class="chart-legend">${trend.map(t=>`<div class="lg-item">${t.label}</div>`).join('')}</div>
  </div>
  <div class="card"><h3>District distribution</h3>${districtTable()}</div>`;
}
function weeklyTrend(){
  const now=Date.now(); const weeks=[];
  for(let i=3;i>=0;i--){
    const start=now-(i+1)*7*86400000, end=now-i*7*86400000;
    const v=DB.screenings.filter(s=>s.date>=start && s.date<end).length;
    weeks.push({label:`Wk ${4-i}`, v});
  }
  return weeks;
}

/* ===================== PATIENT VIEWS ===================== */
