/*
 * CafeShare - Vendor module
 * Split from the original single-file prototype for maintainability.
 * Behaviour is intentionally preserved unless noted in the existing code.
 */

/* ==================== VENDOR ==================== */
let vview="dash", editFoodId=null;
function myVendor(){const u=curUser();return DB.vendors.find(v=>v.user_id===u.user_id);}
function vendorTabs(){return [
  {v:"dash",l:"Dashboard"},{v:"menu",l:"Menu"},{v:"orders",l:"Orders"},
  {v:"insights",l:"Preparation Insights"},{v:"reviews",l:"Reviews"}
];}
function renderVendor(app){
  app.innerHTML=topbarHTML(vendorTabs(),vview);
  const m=document.getElementById("main");
  if(vview==="dash")m.innerHTML=vdashHTML();
  else if(vview==="menu"){m.innerHTML=vmenuHTML();bindVMenu(m);}
  else if(vview==="orders")m.innerHTML=vordersHTML();
  else if(vview==="insights")m.innerHTML=vinsightsHTML();
  else if(vview==="reviews")m.innerHTML=vreviewsHTML();
  else if(vview==="notifs")m.innerHTML=notifsHTML();
}
function vgo(v){vview=v;render();}
function vendorOrders(){const v=myVendor();return DB.orders.filter(o=>o.vendor_id===v.vendor_id);}
function vendorRevenue(){return vendorOrders().filter(o=>o.status==="collected"||o.sale_recorded).reduce((s,o)=>s+Number(o.total_amount||0),0);}
function vendorAvgOrder(){const list=vendorOrders().filter(o=>o.status==="collected"||o.sale_recorded);return list.length?vendorRevenue()/list.length:0;}
function vendorOpen(){const v=myVendor();return v.is_open!==false;}
function vdashHTML(){
  const v=myVendor(),mine=DB.foodItems.filter(f=>f.vendor_id===v.vendor_id),orders=vendorOrders();
  const newOrders=orders.filter(o=>o.status==="new").length;
  const accepted=orders.filter(o=>o.status==="accepted").length;
  const preparing=orders.filter(o=>o.status==="preparing").length;
  const ready=orders.filter(o=>o.status==="ready").length;
  const collected=orders.filter(o=>o.status==="collected").length;
  const rejected=orders.filter(o=>o.status==="rejected").length;
  const lowItems=mine.filter(f=>f.availability==="limited");
  const soldOut=mine.filter(f=>f.availability==="soldout");
  const available=mine.filter(f=>f.availability==="available").length;
  const recent=[...orders].sort((a,b)=>b.order_id-a.order_id).slice(0,5);
  const topItem=[...mine].sort((a,b)=>(b.sold||0)-(a.sold||0))[0];
  return `<div class="sechead" style="margin-bottom:6px">
    <div><h2 style="margin-bottom:4px">🍳 Vendor Dashboard</h2><p class="muted small"><strong>${v.stall_name}</strong> · ${v.location}</p></div>
    <button class="${vendorOpen()?"btn-green":"btn-red"}" onclick="toggleVendorOpen()">${vendorOpen()?"● Stall Open":"● Stall Closed"}</button>
  </div>
  <p class="muted small" style="margin-bottom:16px">${vendorOpen()?"Your stall is visible to students. Keep availability and waiting time updated during service.":"Your stall is closed. Students cannot select items from this stall until you reopen it."}</p>

  <div class="statrow">
    <div class="stat"><div class="num">${newOrders}</div><div class="muted small">New orders</div></div>
    <div class="stat"><div class="num">${preparing+accepted}</div><div class="muted small">Accepted / preparing</div></div>
    <div class="stat"><div class="num">${ready}</div><div class="muted small">Ready for pickup</div></div>
    <div class="stat"><div class="num">${fmt(vendorRevenue())}</div><div class="muted small">Collected sales</div></div>
    <div class="stat"><div class="num">${soldOut.length+lowItems.length}</div><div class="muted small">Stock alerts</div></div>
  </div>

  <div class="panel" style="margin-bottom:16px">
    <div class="sechead"><h3>⚡ Quick actions</h3></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn-brand btn-sm" onclick="vgo('menu')">+ Add / edit food</button>
      <button class="btn-ghost btn-sm" onclick="vgo('orders')">🧾 Manage orders (${newOrders+accepted+preparing+ready})</button>
      <button class="btn-ghost btn-sm" onclick="vgo('insights')">💡 Preparation insights</button>
      <button class="btn-ghost btn-sm" onclick="vgo('reviews')">⭐ Reviews</button>
    </div>
  </div>

  <div class="detailwrap">
    <div class="panel">
      <div class="sechead"><h3>📋 Menu status</h3><button class="btn-ghost btn-sm" onclick="vgo('menu')">Manage menu →</button></div>
      <div class="kpi"><span>Available</span><strong style="color:var(--green)">${available}</strong></div>
      <div class="kpi"><span>Almost sold out</span><strong style="color:var(--amber)">${lowItems.length}</strong></div>
      <div class="kpi"><span>Sold out</span><strong style="color:var(--red)">${soldOut.length}</strong></div>
      <div class="kpi"><span>Top item</span><strong>${topItem?topItem.icon+" "+topItem.name:"—"}</strong></div>
      <h3 style="margin-top:18px">⚡ Quick availability</h3>
      ${mine.slice(0,6).map(f=>`<div class="kpi"><span>${f.icon} ${f.name} <span class="muted small">· ${f.stock_qty||0} left</span></span>
      <span style="display:flex;gap:5px">
        <button class="btn-sm ${f.availability==='available'?'btn-green':'btn-ghost'}" onclick="setAvail(${f.food_id},'available')" title="Available">🟢</button>
        <button class="btn-sm ${f.availability==='limited'?'':'btn-ghost'}" style="${f.availability==='limited'?'background:var(--amber);color:#fff':''}" onclick="setAvail(${f.food_id},'limited')" title="Almost sold out">🟡</button>
        <button class="btn-sm ${f.availability==='soldout'?'btn-red':'btn-ghost'}" onclick="setAvail(${f.food_id},'soldout')" title="Sold out">🔴</button>
      </span></div>`).join("")||`<div class="empty">No menu items yet.</div>`}
      ${mine.length>6?`<p class="muted small" style="margin-top:8px">Showing 6 of ${mine.length} items. Use Menu to manage all items.</p>`:""}
    </div>

    <div class="panel">
      <h3>🏪 Stall controls</h3>
      <p class="muted small" style="margin:6px 0 10px">Current estimated waiting time: <strong>${v.wait} minutes</strong></p>
      <div class="chiprow">${[3,5,10,15,20,25].map(w=>`<button class="chip ${v.wait===w?'on':''}" onclick="setWait(${w})">${w} min</button>`).join("")}</div>
      <h3 style="margin-top:20px">📣 Student announcement</h3>
      <div style="display:flex;gap:8px;margin-top:8px"><input id="v-ann" placeholder="e.g. Today's special or temporary update"><button class="btn-brand" onclick="postAnn()">Post</button></div>
      <p class="muted small" style="margin-top:6px">Use announcements for specials, shortages or temporary changes.</p>
      <h3 style="margin-top:18px">🧾 Order summary</h3>
      <div class="kpi"><span>New</span><strong>${newOrders}</strong></div>
      <div class="kpi"><span>Accepted</span><strong>${accepted}</strong></div>
      <div class="kpi"><span>Preparing</span><strong>${preparing}</strong></div>
      <div class="kpi"><span>Ready for pickup</span><strong>${ready}</strong></div>
      <div class="kpi"><span>Collected / Rejected</span><strong>${collected} / ${rejected}</strong></div>
    </div>
  </div>

  <div class="panel" style="margin-top:16px">
    <div class="sechead"><h3>🧾 Recent orders</h3><button class="btn-ghost btn-sm" onclick="vgo('orders')">View all →</button></div>
    ${recent.length?recent.map(o=>vOrderRow(o,true)).join(""):`<div class="empty">No orders yet. New student orders will appear here.</div>`}
  </div>`;
}
function toggleVendorOpen(){const v=myVendor();v.is_open=!vendorOpen();saveDB();render();toast(v.is_open?"Stall is now open":"Stall is now closed");}

function setAvail(fid,st){
  const f=DB.foodItems.find(x=>x.food_id===fid&&x.vendor_id===myVendor().vendor_id);if(!f)return;const wasOut=f.stock_qty<=0;
  if(st==="soldout")f.stock_qty=0;else if(st==="limited")f.stock_qty=Math.min(Math.max(f.stock_qty||0,1),5);else f.stock_qty=Math.max(f.stock_qty||0,10);
  syncStockAvailability(f);
  if(f.stock_qty<=0&&!wasOut)notifyFavouriteWatchers(f,"Sold out 😢",f.name+" at "+vName(f.vendor_id)+" just sold out.");
  if(f.stock_qty>0&&wasOut)notifyFavouriteWatchers(f,"Favourite back in stock! ✅",f.name+" at "+vName(f.vendor_id)+" is available again.");
  saveDB();render();toast(f.name+" → "+availMeta(f.availability)[0]+" ("+f.stock_qty+" left)");
}
function updateStock(fid){const f=DB.foodItems.find(x=>x.food_id===fid&&x.vendor_id===myVendor().vendor_id),el=document.getElementById("vm-stock-"+fid);if(!f||!el)return;const wasOut=f.stock_qty<=0;f.stock_qty=Math.max(0,parseInt(el.value)||0);syncStockAvailability(f);if(f.stock_qty<=0&&!wasOut)notifyFavouriteWatchers(f,"Sold out 😢",f.name+" at "+vName(f.vendor_id)+" just sold out.");if(f.stock_qty>0&&wasOut)notifyFavouriteWatchers(f,"Favourite back in stock! ✅",f.name+" at "+vName(f.vendor_id)+" is available again.");saveDB();render();toast(f.name+" stock updated to "+f.stock_qty);}
function adjustStock(fid,delta){const f=DB.foodItems.find(x=>x.food_id===fid&&x.vendor_id===myVendor().vendor_id);if(!f)return;const wasOut=f.stock_qty<=0;f.stock_qty=Math.max(0,(f.stock_qty||0)+delta);syncStockAvailability(f);if(f.stock_qty<=0&&!wasOut)notifyFavouriteWatchers(f,"Sold out 😢",f.name+" at "+vName(f.vendor_id)+" just sold out.");if(f.stock_qty>0&&wasOut)notifyFavouriteWatchers(f,"Favourite back in stock! ✅",f.name+" at "+vName(f.vendor_id)+" is available again.");saveDB();render();toast(f.name+" stock: "+f.stock_qty);}

function setWait(w){myVendor().wait=w;DB.foodItems.filter(f=>f.vendor_id===myVendor().vendor_id).forEach(f=>{if(!f.wait||f.wait<1)f.wait=w;});saveDB();render();notifyStudents("Wait time update",myVendor().stall_name+" wait is now ~"+w+" min.");toast("Waiting time set to "+w+" min");}
function notifyStudents(title,msg){DB.students.forEach(s=>notify(s.user_id,title,msg));saveDB();}
function postAnn(){const t=document.getElementById("v-ann").value.trim();if(!t){toast("Write a message first.");return;}notifyStudents("📢 "+myVendor().stall_name,t);render();toast("Announcement sent to all students");}
/* ---------- vendor menu management ---------- */
function vmenuHTML(){
  const v=myVendor(),mine=DB.foodItems.filter(f=>f.vendor_id===v.vendor_id),e=editFoodId?DB.foodItems.find(f=>f.food_id===editFoodId):null;
  return `<h2 style="margin-bottom:4px">📋 Menu Management</h2>
  <p class="muted small" style="margin-bottom:12px">Add, edit and update food information that students see on CafeShare.</p>
  <div class="detailwrap">
    <div class="panel">
      <h3>${e?"✏️ Edit item":"➕ Add food item"}</h3>
      <div class="field" style="margin-top:10px"><label>Food name</label><input id="mf-name" value="${e?e.name:""}" placeholder="e.g. Nasi Goreng Kampung"></div>
      <div class="field"><label>Description</label><input id="mf-desc" value="${e?e.desc:""}" placeholder="Short description of the food"></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <div class="field" style="flex:1;min-width:110px"><label>Price (RM)</label><input id="mf-price" type="number" step="0.5" min="0.5" value="${e?e.price:""}"></div>
        <div class="field" style="flex:1;min-width:110px"><label>Wait (min)</label><input id="mf-wait" type="number" min="0" max="60" value="${e?e.wait:8}"></div>
        <div class="field" style="flex:1;min-width:110px"><label>Stock / portions</label><input id="mf-stock" type="number" min="0" value="${e?e.stock_qty:20}"></div>
        <div class="field" style="flex:1;min-width:110px"><label>Category</label><select id="mf-cat">${getCategories().map(c=>`<option ${e&&e.category===c?"selected":""}>${c}</option>`).join("")}</select></div>
      </div>
      <div class="field"><label>Icon (emoji)</label><input id="mf-icon" maxlength="4" value="${e?e.icon:"🍽️"}"></div>
      <div class="field"><label>Dietary tags</label><div class="chiprow" id="mf-tags">${["halal","vegetarian"].map(t=>`<button type="button" class="chip ${e&&e.tags.includes(t)?"on":""}" data-t="${t}">${t}</button>`).join("")}</div></div>
      <div style="display:flex;gap:8px"><button class="btn-brand" onclick="saveFood()">${e?"Save changes":"Add item"}</button>${e?`<button class="btn-ghost" onclick="editFoodId=null;vgo('menu')">Cancel</button>`:""}</div>
    </div>
    <div class="panel">
      <div class="sechead"><h3>Your items (${mine.length})</h3></div>
      <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap"><input id="vm-search" placeholder="Search your menu…" style="flex:1;min-width:180px" oninput="drawVendorMenu()"><select id="vm-status" style="width:auto" onchange="drawVendorMenu()"><option value="">All statuses</option><option value="available">Available</option><option value="limited">Almost sold out</option><option value="soldout">Sold out</option></select></div>
      <div id="vm-table"></div>
    </div>
  </div>`;
}
function bindVMenu(m){m.querySelectorAll("#mf-tags .chip").forEach(c=>c.onclick=()=>c.classList.toggle("on"));drawVendorMenu();}
function drawVendorMenu(){
  const v=myVendor(),q=(document.getElementById("vm-search")?.value||"").toLowerCase(),st=document.getElementById("vm-status")?.value||"";
  const mine=DB.foodItems.filter(f=>f.vendor_id===v.vendor_id&&(!q||f.name.toLowerCase().includes(q)||f.category.toLowerCase().includes(q))&&(!st||f.availability===st));
  const box=document.getElementById("vm-table");if(!box)return;
  box.innerHTML=`<div style="overflow-x:auto"><table><tr><th>Item</th><th>Price</th><th>Status</th><th>Stock</th><th>Sold</th><th></th></tr>${mine.map(f=>`<tr><td>${f.icon} <strong>${f.name}</strong><br><span class="muted small">${f.category} · ⏱ ${f.wait}m</span></td><td>${fmt(f.price)}</td><td><span class="statuschip ${availMeta(f.availability)[1]}">${availMeta(f.availability)[0]}</span></td><td><div style="display:flex;gap:5px;align-items:center;min-width:170px"><button class="btn-ghost btn-sm" onclick="adjustStock(${f.food_id},-1)">−</button><input id="vm-stock-${f.food_id}" type="number" min="0" value="${f.stock_qty||0}" style="width:66px;padding:5px 7px"><button class="btn-ghost btn-sm" onclick="adjustStock(${f.food_id},1)">+</button><button class="btn-ghost btn-sm" onclick="updateStock(${f.food_id})">Set</button></div></td><td>${f.sold||0}</td><td style="white-space:nowrap"><button class="btn-ghost btn-sm" onclick="editFoodId=${f.food_id};vgo('menu')">✏️</button> <button class="btn-red btn-sm" onclick="delFood(${f.food_id})">🗑</button></td></tr>`).join("")||`<tr><td colspan="6" class="empty">No menu items match your search.</td></tr>`}</table></div>`;
}
function saveFood(){
  const name=document.getElementById("mf-name").value.trim(),price=parseFloat(document.getElementById("mf-price").value),wait=Math.max(0,parseInt(document.getElementById("mf-wait").value)||8);
  if(!name||!(price>0)){toast("Name and a valid price are required.");return;}
  const tags=[...document.querySelectorAll("#mf-tags .chip.on")].map(c=>c.dataset.t);
  const stock_qty=Math.max(0,parseInt(document.getElementById("mf-stock").value)||0);
  const data={name,desc:document.getElementById("mf-desc").value.trim(),price:+price.toFixed(2),wait,stock_qty,category:document.getElementById("mf-cat").value,icon:document.getElementById("mf-icon").value.trim()||"🍽️",tags};
  const v=myVendor();
  if(editFoodId){const f=DB.foodItems.find(f=>f.food_id===editFoodId&&f.vendor_id===v.vendor_id);if(f){Object.assign(f,data);syncStockAvailability(f);toast("Item updated");}}
  else{const f={food_id:nid(DB.foodItems,"food_id"),vendor_id:v.vendor_id,availability:"available",pop:50,sold:0,...data};syncStockAvailability(f);DB.foodItems.push(f);notifyStudents("New menu item 🎉",v.stall_name+" added "+name+" ("+fmt(price)+").");toast("Item added to menu");}
  editFoodId=null;saveDB();vgo("menu");
}
function delFood(fid){if(!confirm("Delete this item?"))return;const v=myVendor();DB.foodItems=DB.foodItems.filter(f=>!(f.food_id===fid&&f.vendor_id===v.vendor_id));DB.favourites=DB.favourites.filter(x=>x.food_id!==fid);saveDB();vgo("menu");toast("Item deleted");}
/* ---------- vendor orders ---------- */
function vOrderRow(o,compact=false){
  const s=DB.students.find(x=>x.student_id===o.student_id),u=s?DB.users.find(x=>x.user_id===s.user_id):null;
  const items=DB.orderItems.filter(i=>i.order_id===o.order_id).map(i=>{const f=DB.foodItems.find(x=>x.food_id===i.food_id);return f?`${f.icon} ${f.name} ×${i.quantity}`:"Unknown item";}).join(", ");
  let action="";
  if(o.status==="new")action=`<button class="btn-green btn-sm" onclick="orderStatus(${o.order_id},'accepted')">Accept</button> <button class="btn-red btn-sm" onclick="rejectOrder(${o.order_id})">Reject</button>`;
  else if(o.status==="accepted")action=`<button class="btn-blue btn-sm" onclick="orderStatus(${o.order_id},'preparing')">Start preparing</button> <button class="btn-red btn-sm" onclick="rejectOrder(${o.order_id})">Reject</button>`;
  else if(o.status==="preparing")action=`<button class="btn-blue btn-sm" onclick="orderStatus(${o.order_id},'ready')">Mark ready 🔔</button>`;
  else if(o.status==="ready")action=`${orderBadge(o.status)}<br><button class="btn-green btn-sm" style="margin-top:6px" onclick="orderStatus(${o.order_id},'collected')">Mark collected</button>`;
  else action=orderBadge(o.status);
  return `<div class="kpi" style="padding:${compact?"11px 0":"14px"};gap:12px"><span><strong>#${o.order_id} · ${u?u.name:"Student"}</strong> <span class="muted small">· ${o.order_time}</span><br><span class="small">${items||"No items"}</span>${o.status==="rejected"&&o.rejection_reason?`<br><span class="small" style="color:var(--red)">Reason: ${o.rejection_reason}</span>`:""}</span><span style="text-align:right">${fmt(o.total_amount)}<br>${action}</span></div>`;
}
function orderSection(title,list,empty){return `<div class="panel" style="padding:0 16px;margin-bottom:16px"><h3 style="padding:14px 0 6px">${title}</h3>${list.length?list.map(o=>vOrderRow(o)).join(""):`<div class="empty">${empty}</div>`}</div>`;}
function vordersHTML(){
  const list=[...vendorOrders()].sort((a,b)=>b.order_id-a.order_id),fresh=list.filter(o=>o.status==="new"),accepted=list.filter(o=>o.status==="accepted"),preparing=list.filter(o=>o.status==="preparing"),ready=list.filter(o=>o.status==="ready"),done=list.filter(o=>["collected","rejected","cancelled"].includes(o.status));
  return `<h2 style="margin-bottom:4px">🧾 Order Management</h2><p class="muted small" style="margin-bottom:12px">Orders now move through New → Accepted → Preparing → Ready → Collected. Reject an order before preparation if it cannot be fulfilled.</p>
  <div class="statrow"><div class="stat"><div class="num">${fresh.length}</div><div class="muted small">New</div></div><div class="stat"><div class="num">${accepted.length}</div><div class="muted small">Accepted</div></div><div class="stat"><div class="num">${preparing.length}</div><div class="muted small">Preparing</div></div><div class="stat"><div class="num">${ready.length}</div><div class="muted small">Ready</div></div></div>
  ${orderSection("🟠 New orders",fresh,"No new orders waiting for acceptance.")}
  ${orderSection("🔵 Accepted / preparing",[...accepted,...preparing],"No orders are currently being prepared.")}
  ${orderSection("🟡 Ready for pickup",ready,"No orders are waiting for pickup.")}
  ${orderSection("✅ Completed / rejected",done.slice(0,12),"No completed orders yet.")}`;
}
function orderStatus(oid,st){
  const o=DB.orders.find(x=>x.order_id===oid&&x.vendor_id===myVendor().vendor_id);if(!o)return;
  const allowed={new:["accepted","rejected"],accepted:["preparing","rejected"],preparing:["ready"],ready:["collected"]};
  if(!(allowed[o.status]||[]).includes(st)){toast("That order cannot move to this status.");return;}
  o.status=st;const student=DB.students.find(x=>x.student_id===o.student_id);
  const messages={accepted:["Order accepted ✅","Your order #"+o.order_id+" from "+vName(o.vendor_id)+" was accepted."],preparing:["Order is being prepared 👨‍🍳","Your order #"+o.order_id+" is now being prepared."],ready:["Order ready! 🔔","Your order #"+o.order_id+" from "+vName(o.vendor_id)+" is ready for collection."],collected:["Order collected ✅","Order #"+o.order_id+" has been marked collected."]};
  if(st==="collected")recordOrderSale(o);
  if(student&&messages[st])notify(student.user_id,messages[st][0],messages[st][1]);
  saveDB();render();toast("Order #"+o.order_id+" → "+orderStatusMeta(st)[0]);
}
function rejectOrder(oid){
  const o=DB.orders.find(x=>x.order_id===oid&&x.vendor_id===myVendor().vendor_id);if(!o||!["new","accepted"].includes(o.status))return;
  const reason=prompt("Reason for rejecting this order:","Item unavailable");if(reason===null)return;
  o.status="rejected";o.rejection_reason=reason.trim()||"Unable to fulfil this order";restoreOrderStock(o);
  const st=DB.students.find(x=>x.student_id===o.student_id);if(st)notify(st.user_id,"Order rejected","Order #"+o.order_id+" from "+vName(o.vendor_id)+" was rejected. Reason: "+o.rejection_reason);
  saveDB();render();toast("Order rejected and reserved stock restored");
}

/* ---------- analytics + insights ---------- */

function vinsightsHTML(){
  const v=myVendor(),mine=DB.foodItems.filter(f=>f.vendor_id===v.vendor_id),orders=vendorOrders().filter(o=>o.status!=="rejected"),hot=[...mine].sort((a,b)=>(b.sold||0)-(a.sold||0))[0];
  const cold=[...mine].sort((a,b)=>(a.sold||0)-(b.sold||0))[0],stockRisk=[...mine].filter(f=>f.stock_qty<=5).sort((a,b)=>(b.sold||0)-(a.sold||0));
  const hourCounts={};orders.forEach(o=>{const m=String(o.order_time||"").match(/(?:^|\s)(\d{1,2}):(\d{2})/);if(m){const h=+m[1];hourCounts[h]=(hourCounts[h]||0)+1;}});
  const peakEntry=Object.entries(hourCounts).sort((a,b)=>b[1]-a[1])[0],peakHour=peakEntry?+peakEntry[0]:null,peakLabel=peakHour===null?"Not enough order data yet":`${String(peakHour).padStart(2,"0")}:00 – ${String((peakHour+1)%24).padStart(2,"0")}:00`;
  const dailyEstimate=hot?Math.max(1,Math.ceil((hot.sold||0)/30*1.15)):0;
  return `<h2 style="margin-bottom:4px">💡 Preparation Insights</h2><p class="muted small" style="margin-bottom:12px">Recommendations use recorded item sales, current stock and your own order times.</p>
  <div class="panel" style="border-left:4px solid var(--green);margin-bottom:16px"><h3>Recommended action</h3><p style="margin-top:6px">${hot?`<strong>${hot.name}</strong> is your highest-selling item (${hot.sold||0} recorded sold). Current stock is <strong>${hot.stock_qty||0}</strong>. A simple next-service estimate is about <strong>${dailyEstimate} portions</strong>; adjust this using your actual stall experience.`:`Add menu and order data to start generating preparation recommendations.`}</p><p class="muted small" style="margin-top:8px">These are prototype estimates, not guaranteed forecasts.</p></div>
  <div class="detailwrap"><div class="panel"><h3>🔥 High-demand items</h3>${[...mine].sort((a,b)=>(b.sold||0)-(a.sold||0)).slice(0,3).map(f=>`<div class="kpi"><span>${f.icon} ${f.name}</span><span>${f.sold||0} sold · 📦 ${f.stock_qty||0} left</span></div>`).join("")||`<div class="empty">No items yet.</div>`}<h3 style="margin-top:16px">❄️ Lower-demand items</h3>${[...mine].sort((a,b)=>(a.sold||0)-(b.sold||0)).slice(0,2).map(f=>`<div class="kpi"><span>${f.icon} ${f.name}</span><span>${f.sold||0} sold</span></div>`).join("")}</div>
  <div class="panel"><h3>⏰ Peak order period</h3><div class="kpi"><span><strong>${peakLabel}</strong><br><span class="muted small">Calculated from this vendor's recorded orders</span></span><span>${peakEntry?peakEntry[1]+" order"+(peakEntry[1]==1?"":"s"):"—"}</span></div><h3 style="margin-top:16px">📦 Stock attention</h3>${stockRisk.length?stockRisk.slice(0,5).map(f=>`<div class="kpi"><span>${f.icon} ${f.name}</span><strong style="color:${f.stock_qty<=0?'var(--red)':'var(--amber)'}">${f.stock_qty||0} left</strong></div>`).join(""):`<p class="small muted" style="margin-top:6px">No items are currently low on stock.</p>`}<h3 style="margin-top:16px">📌 Next step</h3><p class="small muted" style="margin-top:6px">Keep stock quantities and order statuses updated. The insight becomes more useful as CafeShare records more real orders.</p></div></div>`;
}

/* ---------- vendor reviews ---------- */
function vreviewsHTML(){
  const v=myVendor(),reviews=DB.ratings.filter(r=>r.vendor_id===v.vendor_id),avg=reviews.length?reviews.reduce((s,r)=>s+r.rating,0)/reviews.length:0;
  return `<h2 style="margin-bottom:4px">⭐ Customer Reviews</h2><p class="muted small" style="margin-bottom:12px">See student feedback and respond when needed.</p>
  <div class="statrow"><div class="stat"><div class="num">${reviews.length?avg.toFixed(1):"—"}/5</div><div class="muted small">Average rating</div></div><div class="stat"><div class="num">${reviews.length}</div><div class="muted small">Reviews</div></div></div>
  <div class="panel">${reviews.length?reviews.map(r=>{const s=DB.students.find(x=>x.student_id===r.student_id),u=s?DB.users.find(x=>x.user_id===s.user_id):null,f=DB.foodItems.find(x=>x.food_id===r.food_id);return `<div style="padding:14px 0;border-bottom:1px solid var(--line)"><div class="sechead"><span><strong>${u?u.name:"Student"}</strong> · ⭐ ${r.rating}/5</span><span class="muted small">${f?f.name:"Food item"}</span></div><p class="small">${r.comment||"No written comment."}</p><div style="display:flex;gap:8px;margin-top:8px"><input id="reply-${r.rating_id}" placeholder="Reply to this review…" value="${r.reply||""}"><button class="btn-ghost btn-sm" onclick="saveReviewReply(${r.rating_id})">${r.reply?"Update":"Reply"}</button></div>${r.reply?`<p class="muted small" style="margin-top:6px">Your reply: ${r.reply}</p>`:""}</div>`;}).join(""):`<div class="empty">No reviews yet. Student feedback will appear here.</div>`}</div>`;
}
function saveReviewReply(rid){const r=DB.ratings.find(x=>x.rating_id===rid&&x.vendor_id===myVendor().vendor_id),input=document.getElementById("reply-"+rid);if(!r||!input)return;r.reply=input.value.trim();saveDB();render();toast(r.reply?"Reply saved":"Reply removed");}
