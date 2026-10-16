/*
 * CafeShare - Authentication and account registration
 * Split from the original single-file prototype for maintainability.
 * Behaviour is intentionally preserved unless noted in the existing code.
 */

/* ==================== APP SHELL & AUTH ==================== */
let view="home", exploreQ="", filters={price:"",diet:"",avail:"",wait:""},sortBy="pop", compareSet=new Set(), meal=[], mealBudget=10, allowOver=false;
function setSession(s){session=s;if(s)sessionStorage.setItem("cafeshare_session",JSON.stringify(s));else sessionStorage.removeItem("cafeshare_session");}
function curUser(){return session?DB.users.find(u=>u.user_id===session.user_id):null;}
function curStudent(){const u=curUser();return u?DB.students.find(s=>s.user_id===u.user_id):null;}

function render(){
  const app=document.getElementById("app");
  if(!session){app.innerHTML=loginHTML();bindLogin();return;}
  const u=curUser();
  if(u.role==="student")renderStudent(app);
  else if(u.role==="vendor")renderVendor(app);
  else renderAdmin(app);
  bindCommon();
}
function loginHTML(){return `
<div class="loginwrap"><div class="loginbox">
  <span class="logo">Cafe<span>Share</span></span>
  <p class="muted small" style="text-align:center;margin-bottom:18px">Smarter Choices. Less Waste. Better Campus Dining.</p>
  <div class="rolepick" id="rolepick">
    <button data-r="student" class="on">🎓 Student</button>
    <button data-r="vendor">🍳 Vendor</button>
    <button data-r="admin">🛡️ Admin</button>
  </div>
  <div class="field"><label>Email</label><input id="li-email" placeholder="you@cafeshare.my"></div>
  <div class="field"><label>Password</label><input id="li-pass" type="password" placeholder="••••••••"></div>
  <button class="btn-brand" style="width:100%" onclick="doLogin()">Log in</button>
  <p class="muted small" style="margin-top:14px;text-align:center">Demo accounts — student@cafeshare.my / student123 · vendor@cafeshare.my / vendor123 · admin@cafeshare.my / admin123</p>
  <p class="small" style="margin-top:10px;text-align:center">No account? <a href="#" style="color:var(--brand);font-weight:700" onclick="registerForm();return false">Register</a></p>
</div></div>`;}
let loginRole="student";
function bindLogin(){
  document.querySelectorAll("#rolepick button").forEach(b=>b.onclick=()=>{loginRole=b.dataset.r;document.querySelectorAll("#rolepick button").forEach(x=>x.classList.toggle("on",x===b));});
}
function doLogin(){
  const e=document.getElementById("li-email").value.trim().toLowerCase(),p=document.getElementById("li-pass").value;
  const u=DB.users.find(x=>x.email.toLowerCase()===e&&x.password===p&&x.role===loginRole);
  if(!u){toast("Invalid credentials for "+loginRole+" role.");return;}
  if(u.role==="student"){const st=DB.students.find(s=>s.user_id===u.user_id);if(st&&st.status==="suspended"){toast("This student account is suspended. Please contact the CafeShare administrator.");return;}}
  if(u.role==="vendor"){
    const v=DB.vendors.find(v=>v.user_id===u.user_id);
    if(v&&v.status!=="approved"){
      const msg=v.status==="rejected"?"Your vendor application was rejected"+(v.rejection_reason?": "+v.rejection_reason:"")+".":v.status==="deactivated"?"This vendor account has been deactivated by the administrator.":"Your stall is pending admin approval.";
      toast(msg);return;
    }
  }
  setSession({user_id:u.user_id,role:u.role});view="home";render();toast("Welcome back, "+u.name.split(" ")[0]+"!");
}
function doLogout(){setSession(null);render();}
let registerRole="student";
function registerForm(){
  registerRole=(loginRole==="vendor")?"vendor":"student";
  document.getElementById("app").innerHTML=`<div class="loginwrap"><div class="loginbox">
  <span class="logo">Cafe<span>Share</span></span>
  <h2 style="text-align:center;margin:8px 0 4px">Create your account</h2>
  <p class="muted small" style="text-align:center;margin-bottom:16px">Choose the type of CafeShare account you want to register.</p>
  <div class="field"><label>I am a:</label>
    <div class="rolepick" id="register-rolepick">
      <button type="button" data-r="student" class="${registerRole==="student"?'on':''}" onclick="setRegisterRole('student')">🎓 Student</button>
      <button type="button" data-r="vendor" class="${registerRole==="vendor"?'on':''}" onclick="setRegisterRole('vendor')">🍳 Cafeteria Vendor</button>
    </div>
  </div>
  <div class="field"><label>Full name</label><input id="rg-name" placeholder="Your full name"></div>
  <div class="field"><label>Email</label><input id="rg-email" type="email" placeholder="you@cafeshare.my"></div>
  <div class="field"><label>Password (min 6 chars)</label><input id="rg-pass" type="password" placeholder="••••••••"></div>
  <div id="register-extra-fields">${registerExtraFieldsHTML()}</div>
  <button class="btn-brand" id="register-submit" style="width:100%" onclick="doRegister()">${registerRole==="vendor"?'Register as Vendor':'Register as Student'}</button>
  <p class="muted small" id="register-note" style="margin-top:10px;text-align:center">${registerRole==="vendor"?'Vendor accounts require admin approval before login.':'Student accounts can log in immediately after registration.'}</p>
  <p class="small" style="margin-top:12px;text-align:center"><a href="#" style="color:var(--muted)" onclick="render();return false">← Back to login</a></p>
  </div></div>`;
}
function registerExtraFieldsHTML(){
  return registerRole==="vendor"?`
    <div class="field"><label>Stall name</label><input id="rg-stall" placeholder="e.g. Uncle Lim's Rice Corner"></div>
    <div class="field"><label>Stall location</label><input id="rg-location" placeholder="e.g. Main Cafeteria, Block A"></div>
    <div class="field"><label>Cuisine / food type</label><input id="rg-cuisine" placeholder="e.g. Chinese • Economy Rice"></div>
    <div class="field"><label>Contact number</label><input id="rg-contact" placeholder="e.g. +6012-3456789"></div>
    <div class="field"><label>Short stall description <span class="muted">(optional)</span></label><textarea id="rg-desc" rows="2" placeholder="Briefly describe your stall and food"></textarea></div>`:"";
}
function setRegisterRole(role){
  if(role!=="student"&&role!=="vendor")return;
  registerRole=role;
  document.querySelectorAll("#register-rolepick button").forEach(b=>b.classList.toggle("on",b.dataset.r===role));
  const extra=document.getElementById("register-extra-fields");
  if(extra)extra.innerHTML=registerExtraFieldsHTML();
  const submit=document.getElementById("register-submit");
  if(submit)submit.textContent=role==="vendor"?"Register as Vendor":"Register as Student";
  const note=document.getElementById("register-note");
  if(note)note.textContent=role==="vendor"?"Vendor accounts require admin approval before login.":"Student accounts can log in immediately after registration.";
}
function doRegister(){
  const name=document.getElementById("rg-name").value.trim(),email=document.getElementById("rg-email").value.trim(),pass=document.getElementById("rg-pass").value;
  if(!name||!email.toLowerCase().endsWith("@cafeshare.my")||pass.length<6){toast("Please use a valid @cafeshare.my email and a password of at least 6 characters.");return;}
  if(registerRole==="vendor"){
    const stall=document.getElementById("rg-stall"),loc=document.getElementById("rg-location"),cuisine=document.getElementById("rg-cuisine");
    if(!stall||!stall.value.trim()||!loc||!loc.value.trim()||!cuisine||!cuisine.value.trim()){toast("Please enter your stall name, location and cuisine / food type.");return;}
  }
  if(DB.users.some(u=>u.email.toLowerCase()===email.toLowerCase())){toast("Email already registered.");return;}
  const uid=nid(DB.users,"user_id");
  DB.users.push({user_id:uid,name,email,password:pass,role:registerRole,created_at:new Date().toISOString().slice(0,10)});
  if(registerRole==="student"){
    DB.students.push({student_id:nid(DB.students,"student_id"),user_id:uid,preferences:"none",budget:10,status:"active"});
  }else{
    const stallName=document.getElementById("rg-stall").value.trim(),location=document.getElementById("rg-location").value.trim(),cuisine=document.getElementById("rg-cuisine").value.trim(),contact=document.getElementById("rg-contact").value.trim(),description=document.getElementById("rg-desc").value.trim();
    DB.vendors.push({vendor_id:nid(DB.vendors,"vendor_id"),user_id:uid,stall_name:stallName,location,description,contact,status:"pending",wait:10,cuisine,is_open:false,rejection_reason:""});
    notify(3,"New vendor registration",name+" registered "+stallName+" pending approval.");
  }
  saveDB();
  loginRole=registerRole;
  toast(registerRole==="vendor"?"Vendor account created! Wait for admin approval before logging in.":"Student account created! You can log in now.");
  render();
}
