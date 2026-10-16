/*
 * CafeShare - Student module
 * Split from the original single-file prototype for maintainability.
 * Behaviour is intentionally preserved unless noted in the existing code.
 */

/* ==================== STUDENT ==================== */
function studentTabs(){return [{v:"home",l:"Home"},{v:"explore",l:"Explore"},{v:"compare",l:"Compare"},{v:"builder",l:"Meal Builder"},{v:"favs",l:"Favourites"},{v:"profile",l:"Profile"}];}
function renderStudent(app){
  app.innerHTML=topbarHTML(studentTabs(),view);
  const m=document.getElementById("main");
  if(view==="home")m.innerHTML=studentHomeHTML();
  else if(view==="explore"){m.innerHTML=exploreHTML();bindExplore();}
  else if(view==="compare")m.innerHTML=compareHTML();
  else if(view==="builder"){m.innerHTML=builderHTML();bindBuilder();}
  else if(view==="favs")m.innerHTML=favsHTML();
  else if(view==="profile")m.innerHTML=profileHTML();
  else if(view==="notifs")m.innerHTML=notifsHTML();
  bindStudentActions(m);
}
function foodCard(f,ctx){
  const vendor=DB.vendors.find(v=>v.vendor_id===f.vendor_id);
  const closed=vendor&&vendor.is_open===false;
  const displayAvailability=closed?"closed":f.availability;
  const [al,,dot]=availMeta(displayAvailability);
  const st=curStudent();
  const fav=st&&DB.favourites.some(x=>x.student_id===st.student_id&&x.food_id===f.food_id);
  return `<div class="card">
    <div class="foodimg" style="background:${catColor[f.category]||"#eee"}">
      ${f.icon}
      <span class="avail ${availMeta(displayAvailability)[1]}">${dot} ${al}</span>
      <button class="fav" data-fav="${f.food_id}">${fav?"❤️":"🤍"}</button>
    </div>
    <div class="cardbody">
      <div class="rowline"><span class="foodname">${f.name}</span><span class="price">${fmt(f.price)}</span></div>
      <span class="muted small">${vName(f.vendor_id)} · ${closed?"Stall closed":"📦 "+(f.stock_qty||0)+" left"} · ⏱ ${displayAvailability==="soldout"||displayAvailability==="closed"?"—":f.wait+" min"} · <span class="pop">🔥 ${f.pop}% popular</span></span>
      <div class="tags">${f.tags.map(t=>`<span class="tag">${t}</span>`).join("")}<span class="tag">${f.category}</span></div>
      <div class="rowline" style="margin-top:auto;padding-top:6px">
        <button class="btn-ghost btn-sm" data-compare="${f.food_id}" ${ctx==="compare"?"disabled":""}>${compareSet.has(f.food_id)?"✓ In compare":"+ Compare"}</button>
        <button class="btn-brand btn-sm" data-addmeal="${f.food_id}" ${f.stock_qty<=0||closed?"disabled style='opacity:.4'":""}>Add to Meal</button>
      </div>
    </div>
  </div>`;
}
function studentHomeHTML(){
  const hour=new Date().getHours();
  const isPeak=hour>=12&&hour<14;
  const available=DB.foodItems.filter(f=>f.availability!=="soldout"&&DB.vendors.find(v=>v.vendor_id===f.vendor_id)?.is_open!==false);
  const quick=available.filter(f=>f.wait<=5);
  const popular=[...available].sort((a,b)=>b.pop-a.pop).slice(0,4);
  const st=curStudent();
  const favs=st?DB.favourites.filter(x=>x.student_id===st.student_id).map(x=>DB.foodItems.find(f=>f.food_id===x.food_id)).filter(Boolean):[];
  return `
  <div class="hero">
    <h1>Hi, ${curUser().name.split(" ")[0]}! 👋</h1>
    <p>${isPeak?"⏰ Peak lunch period — expect longer queues right now.":"Great time to eat — short queues at most stalls."} ${DB.announcements[0]}</p>
    <div class="searchrow"><input id="home-q" placeholder="What are you looking for?" onkeydown="if(event.key==='Enter')homeSearch()"><button class="btn-brand" onclick="homeSearch()">Search</button></div>
  </div>
  <div class="section"><div class="sechead"><h2>🔥 Featured & Popular</h2><button class="btn-ghost btn-sm" onclick="go('explore')">See all →</button></div>
    <div class="grid">${popular.map(f=>foodCard(f)).join("")}</div></div>
  <div class="section"><div class="sechead"><h2>⚡ Quick bites — under 5 min wait</h2></div>
    <div class="grid">${quick.slice(0,4).map(f=>foodCard(f)).join("")||`<div class="empty panel">Nothing under 5 min right now.</div>`}</div></div>
  <div class="section"><div class="sechead"><h2>🍽️ Browse by category</h2></div>
    <div class="chiprow">${getCategories().map(c=>`<button class="chip" onclick="catFilter('${c.replace(/'/g,"\'")}')">${categoryIcon(c)} ${c}</button>`).join("")}</div></div>
  <div class="section"><div class="sechead"><h2>💛 Your favourites back in stock</h2></div>
    <div class="grid">${favs.filter(f=>f&&f.availability!=="soldout").slice(0,4).map(f=>foodCard(f)).join("")||`<div class="empty panel" style="grid-column:1/-1">No favourite food available right now. Tap 🤍 on any food card to save it.</div>`}</div></div>
  <div class="section"><div class="sechead"><h2>🏪 Stall waiting times</h2></div>
    <div class="panel">${DB.vendors.filter(v=>v.status==="approved").sort((a,b)=>a.wait-b.wait).map(v=>{
      const c=v.is_open===false?"var(--red)":v.wait<=5?"var(--green)":v.wait<=15?"var(--amber)":"var(--red)";
      const label=v.is_open===false?"Closed":v.wait+"-min wait";
      return `<div class="kpi"><span><strong>${v.stall_name}</strong> <span class="muted small">· ${v.location}</span></span><span style="color:${c};font-weight:700"><span class="dot" style="background:${c}"></span>${label}</span></div>`;}).join("")}</div></div>`;
}
function homeSearch(){exploreQ=document.getElementById("home-q").value;view="explore";render();}
function catFilter(c){exploreQ=c;view="explore";render();}
function bindStudentActions(root){
  root.querySelectorAll("[data-fav]").forEach(b=>b.onclick=()=>{
    const st=curStudent(),fid=+b.dataset.fav,ex=DB.favourites.find(x=>x.student_id===st.student_id&&x.food_id===fid);
    if(ex)DB.favourites=DB.favourites.filter(x=>x!==ex);else DB.favourites.push({favourite_id:nid(DB.favourites,"favourite_id"),student_id:st.student_id,food_id:fid});
    saveDB();toast(ex?"Removed from favourites":"Saved to favourites ❤️");render();
  });
  root.querySelectorAll("[data-compare]").forEach(b=>b.onclick=()=>{
    const fid=+b.dataset.compare;
    if(compareSet.has(fid))compareSet.delete(fid);
    else{if(compareSet.size>=3){toast("Compare up to 3 items at a time.");return;}compareSet.add(fid);}
    render();
  });
  root.querySelectorAll("[data-addmeal]").forEach(b=>b.onclick=()=>{
    const fid=+b.dataset.addmeal,f=DB.foodItems.find(x=>x.food_id===fid);
    const v=DB.vendors.find(v=>v.vendor_id===f.vendor_id);
    if(!f||f.stock_qty<=0||v?.is_open===false){toast("That item is currently unavailable.");return;}
    const already=meal.filter(x=>x===fid).length;if(already>=f.stock_qty){toast("Only "+f.stock_qty+" portion"+(f.stock_qty===1?" is":"s are")+" available.");return;}
    meal.push(fid);toast(f.name+" added to your meal 🍽️");render();
  });
}

/* ---------- Explore: search + filters + sort (live) ---------- */
function exploreHTML(){
  return `
  <div class="panel" style="margin-bottom:16px">
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <input id="ex-q" placeholder="Search food, stall or category…" value="${exploreQ.replace(/"/g,"&quot;")}" style="flex:2;min-width:200px">
      <select id="ex-sort" class="inline">
        <option value="pop">Most popular</option><option value="plow">Lowest price</option>
        <option value="phigh">Highest price</option><option value="wait">Shortest waiting time</option>
      </select>
    </div>
    <div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:12px">
      <div><label>Price</label><div class="chiprow" data-g="price">
        <button class="chip" data-v="">Any</button><button class="chip" data-v="u5">Under RM5</button>
        <button class="chip" data-v="510">RM5–10</button><button class="chip" data-v="1015">RM10–15</button>
        <input type="number" id="ex-custom" placeholder="Custom max RM" style="width:130px;margin-left:4px"></div></div>
      <div><label>Dietary</label><div class="chiprow" data-g="diet">
        <button class="chip" data-v="">Any</button><button class="chip" data-v="vegetarian">Vegetarian</button><button class="chip" data-v="halal">Halal</button></div></div>
      <div><label>Availability</label><div class="chiprow" data-g="avail">
        <button class="chip" data-v="">Any</button><button class="chip" data-v="available">Available</button>
        <button class="chip" data-v="limited">Almost sold out</button><button class="chip" data-v="soldout">Sold out</button></div></div>
      <div><label>Waiting time</label><div class="chiprow" data-g="wait">
        <button class="chip" data-v="">Any</button><button class="chip" data-v="w5">Under 5 min</button>
        <button class="chip" data-v="w510">5–10 min</button><button class="chip" data-v="w1020">10–20 min</button>
        <button class="chip" data-v="w20">20+ min</button></div></div>
    </div>
  </div>
  <p class="muted small" id="ex-count"></p>
  <div class="grid" id="ex-grid"></div>`;
}
function bindExplore(){
  const q=document.getElementById("ex-q");q.addEventListener("input",()=>{exploreQ=q.value;drawResults();});
  const s=document.getElementById("ex-sort");s.value=sortBy;s.addEventListener("change",()=>{sortBy=s.value;drawResults();});
  const c=document.getElementById("ex-custom");c.addEventListener("input",()=>{filters.custom=c.value?parseFloat(c.value):null;drawResults();});
  document.querySelectorAll(".chiprow[data-g]").forEach(g=>g.querySelectorAll(".chip").forEach(ch=>ch.onclick=()=>{
    g.querySelectorAll(".chip").forEach(x=>x.classList.remove("on"));ch.classList.add("on");
    filters[g.dataset.g]=ch.dataset.v;drawResults();
  }));
  document.querySelectorAll(`.chiprow[data-g] .chip[data-v="${filters.price}"]`).forEach(x=>x.classList.add("on"));
  drawResults();
}
function drawResults(){
  const q=(exploreQ||"").toLowerCase();
  let list=DB.foodItems.filter(f=>{
    if(DB.vendors.find(v=>v.vendor_id===f.vendor_id)?.is_open===false)return false;
    if(q&&!(f.name.toLowerCase().includes(q)||vName(f.vendor_id).toLowerCase().includes(q)||f.category.toLowerCase().includes(q)))return false;
    if(filters.price==="u5"&&f.price>=5)return false;
    if(filters.price==="510"&&(f.price<5||f.price>10))return false;
    if(filters.price==="1015"&&(f.price<10||f.price>15))return false;
    if(filters.custom&&f.price>filters.custom)return false;
    if(filters.diet&&!f.tags.includes(filters.diet))return false;
    if(filters.avail&&f.availability!==filters.avail)return false;
    if(filters.wait==="w5"&&f.wait>=5)return false;
    if(filters.wait==="w510"&&(f.wait<5||f.wait>10))return false;
    if(filters.wait==="w1020"&&(f.wait<10||f.wait>20))return false;
    if(filters.wait==="w20"&&f.wait<20)return false;
    return true;
  });
  if(sortBy==="plow")list.sort((a,b)=>a.price-b.price);
  else if(sortBy==="phigh")list.sort((a,b)=>b.price-a.price);
  else if(sortBy==="wait")list.sort((a,b)=>a.wait-b.wait);
  else list.sort((a,b)=>b.pop-a.pop);
  document.getElementById("ex-count").textContent=list.length+" item"+(list.length===1?"":"s")+" found";
  document.getElementById("ex-grid").innerHTML=list.map(f=>foodCard(f)).join("")||`<div class="empty panel" style="grid-column:1/-1">No food matches your filters. Try widening the search.</div>`;
  bindStudentActions(document.getElementById("ex-grid"));
}
/* ---------- Compare ---------- */
function compareHTML(){
  const items=[...compareSet].map(id=>DB.foodItems.find(f=>f.food_id===id)).filter(Boolean);
  let html=`<h2 style="margin-bottom:12px">⚖️ Compare Food</h2>`;
  if(items.length<2)html+=`<div class="empty panel">Select 2–3 food items using the “+ Compare” button on food cards, then come back here.<br><br><button class="btn-brand" onclick="go('explore')">Browse food →</button></div>`;
  else{
    const rows=[["Price",f=>fmt(f.price)],["Vendor / Stall",f=>vName(f.vendor_id)],["Availability",f=>availMeta(f.availability)[0]],
      ["Stock remaining",f=>(f.stock_qty||0)+" portion"+((f.stock_qty||0)===1?"":"s")],["Waiting time",f=>f.availability==="soldout"?"—":f.wait+" min"],["Category",f=>f.category],
      ["Dietary",f=>f.tags.join(", ")||"—"],["Popularity",f=>"🔥 "+f.pop+"%"],["Recorded sold",f=>f.sold+" portions"]];
    html+=`<div class="panel" style="overflow-x:auto"><table><tr><th></th>${items.map(f=>`<th>${f.icon} ${f.name}</th>`).join("")}</tr>
      ${rows.map(([l,fn])=>`<tr><td><strong>${l}</strong></td>${items.map(f=>`<td>${fn(f)}</td>`).join("")}</tr>`).join("")}
      <tr><td></td>${items.map(f=>{const v=DB.vendors.find(v=>v.vendor_id===f.vendor_id);return `<td><button class="btn-ghost btn-sm" data-addmeal="${f.food_id}" ${f.stock_qty<=0||v?.is_open===false?"disabled":""}>Add to Meal</button></td>`;}).join("")}</tr>
    </table><p class="muted small" style="margin-top:10px">Prices and availability update live as vendors change them.</p></div>
    <button class="btn-ghost btn-sm" style="margin-top:10px" onclick="compareSet.clear();render()">Clear comparison</button>`;
  }
  const all=[...DB.foodItems].sort((a,b)=>b.pop-a.pop).slice(0,8);
  html+=`<h3 style="margin:20px 0 10px">Tap to add to comparison:</h3><div class="chiprow">${all.map(f=>`<button class="chip ${compareSet.has(f.food_id)?'on':''}" onclick="toggleCompare(${f.food_id})">${f.icon} ${f.name} · ${fmt(f.price)}</button>`).join("")}</div>`;
  return html;
}
function toggleCompare(id){if(compareSet.has(id))compareSet.delete(id);else{if(compareSet.size>=3){toast("Compare up to 3 items.");return;}compareSet.add(id);}render();}
/* ---------- Meal Builder ---------- */
function builderHTML(){
  const items=meal.map(id=>DB.foodItems.find(f=>f.food_id===id)).filter(Boolean);
  const total=items.reduce((s,f)=>s+f.price,0);
  const maxWait=items.length?Math.max(...items.map(f=>f.wait)):0;
  const over=!allowOver&&total>mealBudget;
  return `<h2 style="margin-bottom:12px">🍱 Build My Meal</h2>
  <div class="detailwrap">
    <div class="panel">
      <label>My Budget (RM)</label>
      <div style="display:flex;gap:10px;margin-bottom:14px"><input type="number" id="mb-budget" value="${mealBudget}" min="1" step="0.5" style="max-width:140px">
      <button class="btn-brand" onclick="setBudget()">Set</button></div>
      <label style="margin-top:6px">Current meal (${items.length} item${items.length===1?"":"s"})</label>
      ${items.length?items.map((f,i)=>`<div class="kpi"><span>${f.icon} ${f.name} <span class="muted small">· ${vName(f.vendor_id)}</span></span>
        <span>${fmt(f.price)} <button class="btn-ghost btn-sm" onclick="meal.splice(${i},1);render()">✕</button></span></div>`).join(""):`<p class="muted small">Empty — add items from Explore or Compare.</p>`}
      <div class="mealtotal"><span>Total</span><span class="${over?"over":""}">${fmt(total)}</span></div>
      <div class="kpi"><span>Remaining budget</span><span class="${over?"":""}" style="font-weight:700;color:${over?'var(--red)':'var(--green)'}">${over?"− "+fmt(total-mealBudget):fmt(mealBudget-total)}</span></div>
      ${items.length?`<div class="kpi"><span>Estimated total wait</span><span>⏱ ~${maxWait} min (parallel prep)</span></div>`:""}
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        <button class="btn-green" ${over||!items.length?"disabled style='opacity:.4'":""} onclick="placeOrder(${total.toFixed(2)})">✅ Place order</button>
        <button class="btn-ghost" onclick="findMeal()">🔀 Find Another Meal</button>
        <button class="btn-ghost" onclick="meal=[];render()">Clear</button></div>
      <label style="margin-top:12px;display:flex;gap:8px;align-items:center"><input type="checkbox" id="mb-over" ${allowOver?"checked":""} style="width:auto" onchange="allowOver=this.checked;render()"> Allow going slightly over budget</label>
      ${over?`<p class="small" style="color:var(--red);margin-top:8px">⚠️ Over budget by ${fmt(total-mealBudget)}. Remove items or allow over-budget.</p>`:""}
    </div>
    <div class="panel">
      <h3>Suggested add-ons within budget</h3>
      <p class="muted small" style="margin:6px 0 10px">Drinks, snacks & sides that still fit your remaining ${fmt(Math.max(mealBudget-total,0))}.</p>
      <div class="grid" style="grid-template-columns:1fr 1fr">${DB.foodItems.filter(f=>["Drinks","Snacks","Desserts"].includes(f.category)&&f.stock_qty>0&&DB.vendors.find(v=>v.vendor_id===f.vendor_id)?.is_open!==false&&f.price<=Math.max(mealBudget-total,0)).slice(0,4).map(f=>`<div class="card"><div class="foodimg" style="height:70px;font-size:1.8rem;background:${catColor[f.category]}">${f.icon}</div><div class="cardbody"><div class="rowline"><span class="foodname" style="font-size:.9rem">${f.name}</span><span class="price">${fmt(f.price)}</span></div><button class="btn-ghost btn-sm" data-addmeal="${f.food_id}">+ Add</button></div></div>`).join("")||`<p class="muted small">No small items fit the remaining budget.</p>`}</div>
    </div>
  </div>`;
}
function bindBuilder(){bindStudentActions(document.getElementById("main"));}
function setBudget(){const v=parseFloat(document.getElementById("mb-budget").value);if(v>0){mealBudget=v;render();}}
function findMeal(){
  const mains=DB.foodItems.filter(f=>["Rice","Noodles","Chicken"].includes(f.category)&&f.stock_qty>0&&DB.vendors.find(v=>v.vendor_id===f.vendor_id)?.is_open!==false);
  const sides=DB.foodItems.filter(f=>["Drinks","Snacks","Desserts","Vegetarian"].includes(f.category)&&f.stock_qty>0&&DB.vendors.find(v=>v.vendor_id===f.vendor_id)?.is_open!==false);
  const cap=allowOver?mealBudget+2:mealBudget;
  for(let i=0;i<400;i++){
    const m=mains[Math.floor(Math.random()*mains.length)],s=sides[Math.floor(Math.random()*sides.length)];
    if(m.price+s.price<=cap){meal=[m.food_id,s.food_id];render();toast("Found a combo under "+fmt(cap)+"!");return;}
  }
  toast("Couldn't find a combo under "+fmt(cap)+". Try raising the budget.");
}
function placeOrder(total){
  const st=curStudent();const items=meal.map(id=>DB.foodItems.find(f=>f.food_id===id)).filter(Boolean);
  if(!items.length){toast("Add at least one item before placing an order.");return;}
  const qtyByFood={};items.forEach(f=>qtyByFood[f.food_id]=(qtyByFood[f.food_id]||0)+1);
  for(const [fid,qty] of Object.entries(qtyByFood)){
    const f=DB.foodItems.find(x=>x.food_id===+fid),v=f?DB.vendors.find(x=>x.vendor_id===f.vendor_id):null;
    if(!f||v?.is_open===false||f.stock_qty<qty){toast((f?f.name:"An item")+" no longer has enough stock. Please update your meal.");render();return;}
  }
  const vids=[...new Set(items.map(f=>f.vendor_id))];
  vids.forEach(vid=>{
    const vendorItems=items.filter(f=>f.vendor_id===vid),vendorTotal=vendorItems.reduce((sum,f)=>sum+Number(f.price||0),0),oid=nid(DB.orders,"order_id");
    DB.orders.push({order_id:oid,student_id:st.student_id,vendor_id:vid,total_amount:+vendorTotal.toFixed(2),status:"new",order_time:new Date().toLocaleString("en-MY",{hour12:false}),sale_recorded:false,stock_restored:false,rejection_reason:""});
    const grouped={};vendorItems.forEach(f=>{grouped[f.food_id]=(grouped[f.food_id]||0)+1;});
    Object.entries(grouped).forEach(([fid,qty])=>{const f=DB.foodItems.find(x=>x.food_id===+fid);DB.orderItems.push({order_item_id:nid(DB.orderItems,"order_item_id"),order_id:oid,food_id:f.food_id,quantity:qty,price:f.price});});
    const vendor=DB.vendors.find(v=>v.vendor_id===vid),vu=vendor?DB.users.find(u=>u.user_id===vendor.user_id):null;
    if(vu)notify(vu.user_id,"New order awaiting acceptance",curUser().name+" placed order #"+oid+" ("+fmt(vendorTotal)+").");
  });
  Object.entries(qtyByFood).forEach(([fid,qty])=>{const f=DB.foodItems.find(x=>x.food_id===+fid),wasOut=f.stock_qty<=0;f.stock_qty=Math.max(0,f.stock_qty-qty);syncStockAvailability(f);if(f.stock_qty<=0&&!wasOut&&typeof notifyFavouriteWatchers==="function")notifyFavouriteWatchers(f,"Sold out 😢",f.name+" at "+vName(f.vendor_id)+" just sold out.");});
  notify(curUser().user_id,"Order placed 🎉","Your order was sent to the vendor and is waiting for acceptance.");
  meal=[];saveDB();toast("Order placed! The vendor will accept it shortly.");view="profile";render();
}

/* ---------- Favourites / Profile / Notifications ---------- */
function favsHTML(){
  const st=curStudent();
  const favs=DB.favourites.filter(x=>x.student_id===st.student_id).map(x=>DB.foodItems.find(f=>f.food_id===x.food_id)).filter(Boolean);
  return `<h2 style="margin-bottom:12px">💛 Favourites</h2>
  <div class="grid">${favs.map(f=>foodCard(f)).join("")||`<div class="empty panel" style="grid-column:1/-1">No favourites yet. Tap 🤍 on any food card to save it here — we'll notify you when it's back in stock.</div>`}</div>`;
}
function profileHTML(){
  const u=curUser(),st=curStudent();
  const myOrders=DB.orders.filter(o=>o.student_id===st.student_id).sort((a,b)=>b.order_id-a.order_id);
  return `<h2 style="margin-bottom:12px">👤 Profile</h2>
  <div class="detailwrap">
    <div class="panel">
      <h3>${u.name}</h3><p class="muted small">${u.email} · Student · Joined ${u.created_at}</p>
      <div class="field" style="margin-top:14px"><label>Default meal budget (RM)</label>
      <div style="display:flex;gap:8px"><input type="number" id="pf-budget" value="${st.budget}" min="1"><button class="btn-brand" onclick="saveBudget()">Save</button></div></div>
      <div class="field"><label>Dietary preference</label>
      <select id="pf-pref"><option value="none" ${st.preferences==="none"?"selected":""}>No specific preference</option>
      <option value="halal" ${st.preferences==="halal"?"selected":""}>Halal</option>
      <option value="vegetarian" ${st.preferences==="vegetarian"?"selected":""}>Vegetarian</option></select></div>
      <button class="btn-ghost" onclick="saveBudget()">Update preferences</button>
    </div>
    <div class="panel">
      <h3>Order history</h3>
      ${myOrders.length?myOrders.map(o=>{const items=DB.orderItems.filter(i=>i.order_id===o.order_id).map(i=>{const f=DB.foodItems.find(x=>x.food_id===i.food_id);return f?f.name+" ×"+i.quantity:"";}).join(", ");
      return `<div class="kpi"><span><strong>#${o.order_id} · ${vName(o.vendor_id)}</strong><br><span class="muted small">${items} · ${o.order_time}</span>${o.status==="rejected"&&o.rejection_reason?`<br><span class="small" style="color:var(--red)">Reason: ${o.rejection_reason}</span>`:""}</span>
      <span style="text-align:right">${fmt(o.total_amount)}<br>${orderBadge(o.status)}${o.status==="ready"?`<br><button class="btn-green btn-sm" style="margin-top:6px" onclick="studentCollectOrder(${o.order_id})">Collected</button>`:""}</span></div>`;}).join(""):`<p class="muted small" style="margin-top:8px">No orders yet. Build a meal and place your first order!</p>`}
    </div>
  </div>`;
}

function saveBudget(){const st=curStudent();st.budget=parseFloat(document.getElementById("pf-budget").value)||st.budget;st.preferences=document.getElementById("pf-pref").value;saveDB();toast("Profile updated");}
function studentCollectOrder(oid){const st=curStudent(),o=DB.orders.find(o=>o.order_id===oid&&o.student_id===st.student_id&&o.status==="ready");if(!o)return;o.status="collected";recordOrderSale(o);saveDB();render();toast("Order collected. Enjoy your meal! 🍽️");}
function collectAll(){const st=curStudent();DB.orders.filter(o=>o.student_id===st.student_id&&o.status==="ready").forEach(o=>{o.status="collected";recordOrderSale(o);});saveDB();render();toast("Enjoy your meal! 🍽️");}
