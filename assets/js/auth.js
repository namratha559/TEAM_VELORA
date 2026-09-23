let loginRole='worker', loginErr='';
function doLogin(email, password){
  const acc = DEMO_ACCOUNTS.find(a=>a.email===email && a.password===password && a.role===loginRole);
  if(!acc){ loginErr='Incorrect email, password, or role.'; render(); return; }
  loginErr='';
  DB.currentUser = acc;
  const landing = {worker:'worker-dashboard', doctor:'doctor-dashboard', admin:'admin-dashboard', patient:'patient-home'};
  DB.view = landing[acc.role];
  render();
}
function logout(){ if(typeof CAM!=='undefined' && CAM.active) stopCameraTracking(); DB.currentUser=null; DB.view='login'; render(); }

/* ===================== RENDER ROOT ===================== */

function renderLogin(){
  const roles = [
    {k:'worker',icon:'🩺',name:'Healthcare Worker'},
    {k:'doctor',icon:'⚕️',name:'Doctor'},
    {k:'patient',icon:'🙂',name:'Patient'},
    {k:'admin',icon:'🛠️',name:'Admin'},
  ];
  return `
  <div class="login-wrap">
    <div class="login-card">
      <div class="brand">
        <div class="brand-mark">S</div>
        <div class="brand-text"><h1>SIH</h1><p>AI-assisted Osteoarthritis Screening</p></div>
      </div>
      <div class="role-grid">
        ${roles.map(r=>`<button class="role-btn ${loginRole===r.k?'active':''}" data-role="${r.k}">
          <span class="r-icon">${r.icon}</span><span class="r-name">${r.name}</span>
        </button>`).join('')}
      </div>
      ${loginErr?`<div class="err">${loginErr}</div>`:''}
      <div class="field"><label>Email</label><input id="login-email" placeholder="you@sih.demo"></div>
      <div class="field"><label>Password</label><input id="login-pass" type="password" placeholder="••••••••"></div>
      <button class="btn btn-primary btn-block" id="login-submit">Log in</button>
      <p class="hint">Demo account for this role: <strong>${DEMO_ACCOUNTS.find(a=>a.role===loginRole).email}</strong> / demo123</p>
    </div>
  </div>`;
}
function attachLoginEvents(){
  document.querySelectorAll('.role-btn').forEach(b=>b.onclick=()=>{ loginRole=b.dataset.role; loginErr=''; render(); });
  document.getElementById('login-submit').onclick=()=>{
    doLogin(document.getElementById('login-email').value.trim(), document.getElementById('login-pass').value.trim());
  };
  document.getElementById('login-email').value = DEMO_ACCOUNTS.find(a=>a.role===loginRole).email;
  document.getElementById('login-pass').value = 'demo123';
}

/* ===================== SHELL ===================== */
