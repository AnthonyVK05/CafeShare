/*
 * CafeShare - Admin module
 * Split from the original single-file prototype for maintainability.
 * Behaviour is intentionally preserved unless noted in the existing code.
 */

/* ==================== ADMIN ==================== */
let aview="adash";
function adminTabs(){return [{v:"adash",l:"Dashboard"},{v:"astudents",l:"Students"},{v:"avendors",l:"Vendors"},{v:"afood",l:"Categories"},{v:"aactivity",l:"Analytics"},{v:"aann",l:"Announcements"}];}
function renderAdmin(app){
  app.innerHTML=topbarHTML(adminTabs(),aview);
  const m=document.getElementById("main");
  if(aview==="adash")m.innerHTML=adashHTML();
  else if(aview==="astudents"){m.innerHTML=astudentsHTML();drawAdminStudents();}
  else if(aview==="avendors")m.innerHTML=avendorsHTML();
  else if(aview==="afood")m.innerHTML=afoodHTML();
  else if(aview==="aactivity")m.innerHTML=aactivityHTML();
  else if(aview==="aann")m.innerHTML=aannHTML();
  else if(aview==="notifs")m.innerHTML=notifsHTML();
}
function ago(v){aview=v;render();}
function adashHTML(){
  const pending=DB.vendors.filter(v=>v.status==="pending").length;
  return `<h2 style="margin-bottom:12px">🛡️ Admin Dashboard</h2>
  <div class="statrow">
    <div class="stat"><div class="num">${DB.users.filter(u=>u.role==="student").length}</div><div class="muted small">Students</div></div>
    <div class="stat"><div class="num">${DB.vendors.length}</div><div class="muted small">Vendors (${pending} pending)</div></div>
    <div class="stat"><div class="num">${DB.foodItems.length}</div><div class="muted small">Food items</div></div>
    <div class="stat"><div class="num">${DB.orders.length}</div><div class="muted small">Total orders</div></div>
    <div class="stat"><div class="num">${DB.orders.filter(o=>o.status==="collected"||o.sale_recorded).reduce((s,o)=>s+o.total_amount,0).toFixed(2)}</div><div class="muted small">Collected revenue (RM)</div></div>
  </div>
  ${pending?`<div class="panel" style="border-left:4px solid var(--amber);margin-bottom:16px"><h3>⏳ Vendors awaiting approval</h3>
  ${DB.vendors.filter(v=>v.status==="pending").map(v=>{const u=DB.users.find(u=>u.user_id===v.user_id);return `<div class="kpi"><span><strong>${v.stall_name}</strong><br><span class="muted small">${u?u.name+" · ":""}${v.location} · ${v.cuisine||"Cuisine not set"}</span></span><span><button class="btn-green btn-sm" onclick="approveVendor(${v.vendor_id})">Approve</button> <button class="btn-ghost btn-sm" onclick="ago('avendors')">Details</button></span></div>`;}).join("")}</div>`:""}
  <div class="panel"><h3>Latest activity</h3>
  ${DB.orders.slice(-5).reverse().map(o=>`<div class="kpi"><span>Order #${o.order_id} · ${vName(o.vendor_id)}</span><span>${fmt(o.total_amount)} · ${orderBadge(o.status)}</span></div>`).join("")}
  ${DB.ratings.map(r=>{const u=DB.users.find(u=>u.user_id===DB.students.find(s=>s.student_id===r.student_id)?.user_id);const f=DB.foodItems.find(f=>f.food_id===r.food_id);
  return `<div class="kpi"><span>⭐ ${r.rating}/5 by ${u?u.name:"student"}${f?" on "+f.name:""}</span><span class="muted small">“${r.comment}”</span></div>`;}).join("")}</div>`;
}
function approveVendor(vid){const v=DB.vendors.find(x=>x.vendor_id===vid);if(!v)return;v.status="approved";v.rejection_reason="";v.is_open=true;if(v.user_id)notify(v.user_id,"Stall approved ✅","Your stall "+v.stall_name+" is now approved. You can log in and open/close the stall from your dashboard.");saveDB();render();toast(v.stall_name+" approved");}
function rejectVendor(vid){const v=DB.vendors.find(x=>x.vendor_id===vid);if(!v)return;const reason=prompt("Reason for rejecting this vendor application:","Please provide more stall information");if(reason===null)return;v.status="rejected";v.rejection_reason=reason.trim()||"Application requirements were not met";v.is_open=false;if(v.user_id)notify(v.user_id,"Vendor application rejected",v.stall_name+" was not approved. Reason: "+v.rejection_reason);saveDB();render();toast(v.stall_name+" rejected");}
function toggleVendorActivation(vid){const v=DB.vendors.find(x=>x.vendor_id===vid);if(!v)return;v.status=v.status==="approved"?"deactivated":"approved";v.is_open=v.status==="approved";if(v.user_id)notify(v.user_id,v.status==="approved"?"Vendor account reactivated":"Vendor account deactivated",v.status==="approved"?"Your CafeShare vendor account is active again.":"Your CafeShare vendor account was deactivated by the administrator.");saveDB();render();}
function astudentsHTML(){
  return `<h2 style="margin-bottom:4px">🎓 Manage Students</h2><p class="muted small" style="margin-bottom:12px">Suspend an account without deleting its profile or order history. Suspended students cannot log in until reactivated.</p>
  <div class="panel" style="margin-bottom:12px"><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="as-search" placeholder="Search name or email…" style="flex:1;min-width:200px" oninput="drawAdminStudents()"><select id="as-status" style="width:auto" onchange="drawAdminStudents()"><option value="">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option></select></div></div>
  <div class="panel" style="padding:0;overflow:hidden"><div id="as-table" style="overflow-x:auto"></div></div>`;
}
function drawAdminStudents(){
  const box=document.getElementById("as-table");if(!box)return;const q=(document.getElementById("as-search")?.value||"").toLowerCase(),status=document.getElementById("as-status")?.value||"";
  const list=DB.students.filter(st=>{const u=DB.users.find(x=>x.user_id===st.user_id);return u&&(!q||(u.name+" "+u.email).toLowerCase().includes(q))&&(!status||st.status===status);});
  box.innerHTML=`<table><tr><th>Name</th><th>Email</th><th>Joined</th><th>Preference</th><th>Orders</th><th>Status</th><th></th></tr>${list.map(st=>{const u=DB.users.find(x=>x.user_id===st.user_id),oc=DB.orders.filter(o=>o.student_id===st.student_id).length;return `<tr><td><strong>${u.name}</strong></td><td class="muted">${u.email}</td><td>${u.created_at||"—"}</td><td>${st.preferences}</td><td>${oc}</td><td><span class="statuschip ${st.status==="suspended"?"st-so":"st-av"}">${st.status}</span></td><td><button class="${st.status==="suspended"?"btn-green":"btn-red"} btn-sm" onclick="toggleStudentStatus(${st.student_id})">${st.status==="suspended"?"Reactivate":"Suspend"}</button></td></tr>`;}).join("")||`<tr><td colspan="7" class="empty">No students match the current filter.</td></tr>`}</table>`;
}
function toggleStudentStatus(sid){const st=DB.students.find(s=>s.student_id===sid);if(!st)return;st.status=st.status==="suspended"?"active":"suspended";if(st.user_id)notify(st.user_id,st.status==="suspended"?"Account suspended":"Account reactivated",st.status==="suspended"?"Your CafeShare student account has been suspended. Contact the administrator if you need help.":"Your CafeShare student account is active again.");saveDB();drawAdminStudents();toast("Student account "+st.status);}
function avendorsHTML(){
  const order={pending:0,rejected:1,approved:2,deactivated:3};const list=[...DB.vendors].sort((a,b)=>(order[a.status]??9)-(order[b.status]??9));
  return `<h2 style="margin-bottom:4px">🍳 Manage Vendors</h2><p class="muted small" style="margin-bottom:12px">Review vendor registration details before approval and keep rejected/deactivated records instead of deleting them.</p>
  <div class="detailwrap">${list.map(v=>{const u=DB.users.find(x=>x.user_id===v.user_id),items=DB.foodItems.filter(f=>f.vendor_id===v.vendor_id).length,statusClass=v.status==="approved"?"st-av":v.status==="pending"?"st-li":"st-so";return `<div class="panel"><div class="sechead"><div><h3>${v.stall_name}</h3><span class="statuschip ${statusClass}">${v.status}</span></div><strong>${items} item${items===1?"":"s"}</strong></div><div class="kpi"><span>Owner</span><strong>${u?u.name:"Demo / system stall"}</strong></div><div class="kpi"><span>Email</span><span>${u?u.email:"—"}</span></div><div class="kpi"><span>Location</span><span>${v.location||"—"}</span></div><div class="kpi"><span>Cuisine / type</span><span>${v.cuisine||"—"}</span></div><div class="kpi"><span>Contact</span><span>${v.contact||"—"}</span></div><div class="kpi"><span>Wait time</span><span>${v.wait||0} min</span></div>${v.description?`<p class="small" style="margin-top:10px">${v.description}</p>`:""}${v.status==="rejected"&&v.rejection_reason?`<p class="small" style="color:var(--red);margin-top:8px"><strong>Rejection reason:</strong> ${v.rejection_reason}</p>`:""}<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">${v.status==="pending"?`<button class="btn-green btn-sm" onclick="approveVendor(${v.vendor_id})">Approve</button><button class="btn-red btn-sm" onclick="rejectVendor(${v.vendor_id})">Reject</button>`:v.status==="rejected"?`<button class="btn-green btn-sm" onclick="approveVendor(${v.vendor_id})">Approve after review</button>`:`<button class="${v.status==="approved"?"btn-red":"btn-green"} btn-sm" onclick="toggleVendorActivation(${v.vendor_id})">${v.status==="approved"?"Deactivate":"Reactivate"}</button>`}</div></div>`;}).join("")}</div>`;
}
function afoodHTML(){
  const counts={};getCategories().forEach(c=>counts[c]=DB.foodItems.filter(f=>f.category===c).length);
  return `<h2 style="margin-bottom:4px">🍽️ Manage Categories</h2><p class="muted small" style="margin-bottom:12px">Categories created here are immediately used by Student browsing and Vendor menu forms.</p><div class="detailwrap">
  <div class="panel"><h3>Category management</h3><div style="display:flex;gap:8px;margin:10px 0 14px"><input id="ac-new" placeholder="New category name"><button class="btn-brand" onclick="addCategory()">Add</button></div>${getCategories().map(c=>`<div class="kpi"><span>${categoryIcon(c)} <strong>${c}</strong> <span class="muted small">· ${counts[c]||0} item${counts[c]===1?"":"s"}</span></span><span><button class="btn-ghost btn-sm" onclick="renameCategory('${c.replace(/'/g,"\'")}')">Rename</button> <button class="btn-red btn-sm" onclick="deleteCategory('${c.replace(/'/g,"\'")}')">Delete</button></span></div>`).join("")}</div>
  <div class="panel"><h3>Items per category</h3><div style="margin-top:12px">${barChart(counts)}</div></div></div>
  <div class="panel" style="margin-top:16px;overflow-x:auto"><h3 style="margin-bottom:8px">All food items</h3><table><tr><th>Item</th><th>Vendor</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th></tr>${DB.foodItems.map(f=>`<tr><td>${f.icon} ${f.name}</td><td class="muted">${vName(f.vendor_id)}</td><td>${f.category}</td><td>${fmt(f.price)}</td><td>${f.stock_qty||0}</td><td><span class="statuschip ${availMeta(f.availability)[1]}">${availMeta(f.availability)[0]}</span></td></tr>`).join("")}</table></div>`;
}
function addCategory(){const el=document.getElementById("ac-new"),name=(el?.value||"").trim();if(!name){toast("Enter a category name first.");return;}if(getCategories().some(c=>c.toLowerCase()===name.toLowerCase())){toast("That category already exists.");return;}DB.categories.push(name);saveDB();render();toast(name+" category added");}
function renameCategory(oldName){const name=prompt("Rename category:",oldName);if(name===null)return;const clean=name.trim();if(!clean||clean===oldName)return;if(getCategories().some(c=>c.toLowerCase()===clean.toLowerCase())){toast("That category already exists.");return;}const i=DB.categories.indexOf(oldName);if(i>=0)DB.categories[i]=clean;DB.foodItems.filter(f=>f.category===oldName).forEach(f=>f.category=clean);saveDB();render();toast(oldName+" renamed to "+clean);}
function deleteCategory(name){const used=DB.foodItems.filter(f=>f.category===name).length;if(used){toast("Cannot delete "+name+" because "+used+" food item"+(used===1?" uses":"s use")+" it. Rename or move those items first.");return;}if(!confirm("Delete the "+name+" category?"))return;DB.categories=DB.categories.filter(c=>c!==name);saveDB();render();toast(name+" category deleted");}

function aactivityHTML(){
  const byHour={};Object.entries(DB.hourlyDemand).forEach(([h,n])=>byHour[h+":00"]=n);
  return `<h2 style="margin-bottom:12px">📈 Platform Analytics</h2>
  <div class="statrow">
    <div class="stat"><div class="num">${DB.orders.reduce((s,o)=>s+o.total_amount,0).toFixed(2)}</div><div class="muted small">GMV (RM)</div></div>
    <div class="stat"><div class="num">${(DB.orders.reduce((s,o)=>s+o.total_amount,0)/Math.max(DB.orders.length,1)).toFixed(2)}</div><div class="muted small">Avg order (RM)</div></div>
    <div class="stat"><div class="num">${DB.foodItems.filter(f=>f.availability==="soldout").length}</div><div class="muted small">Sold out now</div></div>
    <div class="stat"><div class="num">${DB.notifications.length}</div><div class="muted small">Notifications sent</div></div>
  </div>
  <div class="detailwrap">
    <div class="panel"><h3>Campus demand by hour</h3><div style="margin-top:10px">${barChart(byHour)}</div></div>
    <div class="panel"><h3>🗑 Food waste estimate</h3>
      <p class="small" style="margin-top:8px">Real-time availability updates have helped vendors cut estimated over-preparation by <strong style="color:var(--green)">~22%</strong> this month.</p>
      <div class="kpi"><span>Estimated portions saved from waste</span><strong>≈ 85</strong></div>
      <div class="kpi"><span>Most-wasted category (historical)</span><strong>Rice</strong></div>
      <div class="kpi"><span>Vendors using prep insights</span><strong>${DB.vendors.filter(v=>v.status==="approved").length} / ${DB.vendors.length}</strong></div>
      <p class="muted small" style="margin-top:8px">ℹ️ Estimates derived from sales vs. availability data. Not audited figures.</p></div>
  </div>`;
}
function aannHTML(){
  return `<h2 style="margin-bottom:12px">📣 Announcements</h2>
  <div class="panel" style="max-width:560px;margin-bottom:16px">
    <div style="display:flex;gap:8px"><input id="aa-text" placeholder="e.g. Cafeteria closed this Sunday for cleaning"><button class="btn-brand" onclick="postAdminAnn()">Broadcast</button></div>
  </div>
  <div class="panel">${DB.announcements.map((a,i)=>`<div class="kpi"><span>${a}</span><button class="btn-red btn-sm" onclick="DB.announcements.splice(${i},1);saveDB();render()">✕</button></div>`).join("")||`<p class="muted small">No announcements.</p>`}</div>`;
}
function postAdminAnn(){const t=document.getElementById("aa-text").value.trim();if(!t){toast("Write a message first.");return;}DB.announcements.unshift(t);DB.users.forEach(u=>notify(u.user_id,"📢 Campus announcement",t));saveDB();render();toast("Broadcast sent to all users");}
