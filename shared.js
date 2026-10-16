/*
 * CafeShare - Shared navigation, theme and UI helpers
 * Split from the original single-file prototype for maintainability.
 * Behaviour is intentionally preserved unless noted in the existing code.
 */

/* ---------- shared chrome ---------- */
function topbarHTML(tabs,active){
  const u=curUser();
  const unread=DB.notifications.filter(n=>n.user_id===u.user_id&&!n.read_status).length;
  return `<div class="mobile-topbar">
    <button class="hamburger" title="Menu" onclick="toggleSidebar()">☰</button>
    <span class="logo">Cafe<span>Share</span></span>
    <button class="iconbtn" title="Notifications" onclick="go('notifs')">🔔${unread?`<span class="badge">${unread}</span>`:""}</button>
  </div>
  <div class="sidebar-overlay" id="sidebar-overlay" onclick="closeSidebar()"></div>
  <div class="app-shell">
    <aside class="sidebar" id="sidebar">
      <span class="logo">Cafe<span>Share</span></span>
      <nav class="sidenav">${tabs.map(t=>`<button class="${t.v===active?'active':''}" onclick="go('${t.v}')">${t.l}</button>`).join("")}</nav>
      <div class="sidebar-bottom">
        <button class="iconbtn" title="Notifications" onclick="go('notifs')">🔔${unread?`<span class="badge">${unread}</span>`:""}</button>
        <button class="iconbtn" title="Toggle theme" onclick="toggleTheme()">🌓</button>
        <button class="iconbtn" title="Log out" onclick="doLogout()">⏻</button>
      </div>
    </aside>
    <main class="content"><div class="wrap" id="main"></div></main>
  </div>`;
}
function toggleSidebar(){document.getElementById("sidebar").classList.toggle("open");document.getElementById("sidebar-overlay").classList.toggle("open");}
function closeSidebar(){document.getElementById("sidebar").classList.remove("open");document.getElementById("sidebar-overlay").classList.remove("open");}
function go(v){
  const u=curUser();
  if(u&&u.role==="vendor")vview=v;
  else if(u&&u.role==="admin")aview=v;
  else view=v;
  render();
  window.scrollTo(0,0);
}
function toggleTheme(){const d=document.documentElement.getAttribute("data-theme")==="dark";document.documentElement.setAttribute("data-theme",d?"":"dark");localStorage.setItem("cafeshare_theme",d?"":"dark");}
function bindCommon(){}
if(localStorage.getItem("cafeshare_theme")==="dark")document.documentElement.setAttribute("data-theme","dark");

/* ---------- shared UI / notification helpers ---------- */
function notifyFavouriteWatchers(f,title,message){DB.favourites.filter(x=>x.food_id===f.food_id).forEach(x=>{const st=DB.students.find(s=>s.student_id===x.student_id);if(st)notify(st.user_id,title,message);});}

function barChart(obj,color){const vals=Object.values(obj),max=Math.max(...vals,1);return `<div class="barchart">${Object.entries(obj).map(([k,v])=>`<div style="flex:1;display:flex;flex-direction:column"><div class="bar" data-v="${v}" style="height:${Math.max(v/max*100,3)}%;${color?`background:${color}`:""}"></div><div class="barlabel">${k}</div></div>`).join("")}</div>`;}

function notifsHTML(){
  const u=curUser();
  const list=DB.notifications.filter(n=>n.user_id===u.user_id).sort((a,b)=>b.notification_id-a.notification_id);
  list.forEach(n=>n.read_status=true);saveDB();
  return `<h2 style="margin-bottom:12px">🔔 Notifications</h2><div class="panel" style="padding:0;overflow:hidden">
  ${list.map(n=>`<div class="notifitem ${n.read_status?"":"unread"}"><span>${n.title.includes("stock")||n.title.includes("available")?"✅":n.title.includes("sold")?"🔴":n.title.includes("demand")||n.title.includes("Peak")?"📈":"📢"}</span>
  <div><strong>${n.title}</strong><p class="muted small">${n.message}</p><p class="muted small">${n.created_at}</p></div></div>`).join("")||`<div class="empty">You're all caught up 🎉</div>`}</div>`;
}
