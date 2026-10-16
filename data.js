/*
 * CafeShare - Data, storage and common data helpers
 * Split from the original single-file prototype for maintainability.
 * Behaviour is intentionally preserved unless noted in the existing code.
 */

/* ==================== DATA LAYER (simulated backend + persistence) ==================== */
const DB_KEY="cafeshare_db_v1";
const seedDB=()=>({
  users:[
    {user_id:1,name:"Aina Rahman",email:"student@cafeshare.my",password:"student123",role:"student",created_at:"2026-01-05"},
    {user_id:2,name:"Uncle Lim",email:"vendor@cafeshare.my",password:"vendor123",role:"vendor",created_at:"2025-12-01"},
    {user_id:3,name:"Dr. Farah (Admin)",email:"admin@cafeshare.my",password:"admin123",role:"admin",created_at:"2025-11-20"},
    {user_id:4,name:"Mei Ling",email:"meiling@student.my",password:"pass123",role:"student",created_at:"2026-02-11"}
  ],
  students:[
    {student_id:1,user_id:1,preferences:"halal",budget:10,status:"active"},
    {student_id:2,user_id:4,preferences:"none",budget:8,status:"active"}
  ],
  vendors:[
    {vendor_id:1,user_id:0,stall_name:"Warung Kak Nita",location:"Main Cafeteria, Block A",description:"Halal Malay favourites, freshly cooked daily.",contact:"+6012-3456789",status:"approved",wait:10,cuisine:"Halal • Malay"},
    {vendor_id:2,user_id:2,stall_name:"Uncle Lim's Rice Corner",location:"Main Cafeteria, Block A",description:"Chinese-style economy rice and noodles.",contact:"+6013-9876543",status:"approved",wait:5,cuisine:"Chinese"},
    {vendor_id:3,user_id:0,stall_name:"Campus Juice Bar",location:"Library Foyer",description:"Fresh juices, smoothies and light snacks.",contact:"+6017-5551212",status:"approved",wait:3,cuisine:"Drinks & Snacks"},
    {vendor_id:4,user_id:0,stall_name:"Ana's Dessert House",location:"Student Centre, Level 2",description:"Local kuih, cakes and iced desserts.",contact:"+6019-2223344",status:"pending",wait:12,cuisine:"Desserts"}
  ],
  categories:["Rice","Noodles","Chicken","Vegetarian","Drinks","Snacks","Desserts"],
  foodItems:[
    {food_id:1,vendor_id:1,name:"Nasi Ayam Goreng",desc:"Fried chicken rice with sambal & soup",category:"Rice",price:6.00,icon:"🍗",tags:["halal"],availability:"available",wait:8,pop:94,sold:132},
    {food_id:2,vendor_id:1,name:"Mee Goreng Mamak",desc:"Spicy mamak-style fried noodles",category:"Noodles",price:5.50,icon:"🍜",tags:["halal"],availability:"available",wait:10,pop:88,sold:118},
    {food_id:3,vendor_id:1,name:"Nasi Lemak Biasa",desc:"Coconut rice, egg, peanuts & sambal",category:"Rice",price:4.50,icon:"🍚",tags:["halal","vegetarian"],availability:"limited",wait:6,pop:91,sold:125},
    {food_id:4,vendor_id:1,name:"Air Teh O Ais",desc:"Iced tea, sweetened",category:"Drinks",price:2.00,icon:"🧋",tags:["halal","vegetarian"],availability:"available",wait:2,pop:76,sold:96},
    {food_id:5,vendor_id:2,name:"Economy Rice (3 dishes)",desc:"Rice + 3 dishes of your choice",category:"Rice",price:7.00,icon:"🍛",tags:[],availability:"available",wait:5,pop:90,sold:121},
    {food_id:6,vendor_id:2,name:"Wantan Mee",desc:"Springy noodles with char siew & wantan",category:"Noodles",price:6.50,icon:"🍝",tags:[],availability:"available",wait:7,pop:85,sold:104},
    {food_id:7,vendor_id:2,name:"Stir-fried Mixed Veg",desc:"Seasonal vegetables, garlic style",category:"Vegetarian",price:5.00,icon:"🥬",tags:["vegetarian"],availability:"available",wait:4,pop:64,sold:58},
    {food_id:8,vendor_id:2,name:"Curry Puff (2 pcs)",desc:"Flaky curry puffs, potato filling",category:"Snacks",price:3.00,icon:"🥟",tags:["vegetarian"],availability:"soldout",wait:0,pop:70,sold:82},
    {food_id:9,vendor_id:3,name:"Fresh Orange Juice",desc:"Squeezed to order, no sugar added",category:"Drinks",price:4.00,icon:"🍊",tags:["vegetarian"],availability:"available",wait:3,pop:82,sold:90},
    {food_id:10,vendor_id:3,name:"Banana Smoothie",desc:"Banana, milk & honey blend",category:"Drinks",price:5.00,icon:"🍌",tags:["vegetarian"],availability:"available",wait:4,pop:71,sold:66},
    {food_id:11,vendor_id:3,name:"Sandwich Combo",desc:"Egg sandwich + orange juice",category:"Snacks",price:6.00,icon:"🥪",tags:["vegetarian"],availability:"limited",wait:5,pop:68,sold:54},
    {food_id:12,vendor_id:4,name:"Kuih Lapis (3 pcs)",desc:"Layered colourful kuih, steamed fresh",category:"Desserts",price:3.50,icon:"🍰",tags:["vegetarian"],availability:"available",wait:6,pop:74,sold:71},
    {food_id:13,vendor_id:4,name:"ABC Special",desc:"Shaved ice with red beans & corn",category:"Desserts",price:4.50,icon:"🍧",tags:["vegetarian"],availability:"available",wait:8,pop:80,sold:77},
    {food_id:14,vendor_id:1,name:"Ayam Percik Set",desc:"Grilled percik chicken + rice + ulam",category:"Chicken",price:8.50,icon:"🍖",tags:["halal"],availability:"available",wait:12,pop:86,sold:95},
    {food_id:15,vendor_id:2,name:"Chicken Rice",desc:"Poached chicken, fragrant rice & soup",category:"Chicken",price:6.00,icon:"🐔",tags:[],availability:"available",wait:8,pop:95,sold:140},
    {food_id:16,vendor_id:3,name:"Iced Matcha Latte",desc:"Matcha with fresh milk over ice",category:"Drinks",price:5.50,icon:"🍵",tags:["vegetarian"],availability:"available",wait:3,pop:79,sold:63}
  ],
  favourites:[{favourite_id:1,student_id:1,food_id:15},{favourite_id:2,student_id:1,food_id:9}],
  ratings:[{rating_id:1,student_id:1,vendor_id:2,food_id:15,rating:5,comment:"Juicy chicken, always fresh!"}],
  orders:[{order_id:1,student_id:1,vendor_id:2,total_amount:11.00,status:"collected",order_time:"2026-09-17 12:34"}],
  orderItems:[{order_item_id:1,order_id:1,food_id:15,quantity:1,price:6.00},{order_item_id:2,order_id:1,food_id:4,quantity:1,price:2.00}],
  hourlyDemand:{9:22,10:35,11:58,12:126,13:142,14:48,15:30,16:26,17:44,18:66},
  notifications:[
    {notification_id:1,user_id:1,title:"Favourite back in stock!",message:"Chicken Rice at Uncle Lim's is available again.",read_status:false,created_at:"2026-09-18 08:15"},
    {notification_id:2,user_id:1,title:"Menu update",message:"Campus Juice Bar added Iced Matcha Latte.",read_status:false,created_at:"2026-09-17 16:40"},
    {notification_id:3,user_id:2,title:"High demand alert",message:"Peak period detected: 12–1 PM. Demand is 3.2× average.",read_status:false,created_at:"2026-09-18 11:55"}
  ],
  announcements:["Welcome back! New stall opening soon at Student Centre.","Cafeteria closed for cleaning this Sunday 3–5 PM."]
});
function loadDB(){try{const d=JSON.parse(localStorage.getItem(DB_KEY));if(d&&d.foodItems)return d;}catch(e){}const s=seedDB();localStorage.setItem(DB_KEY,JSON.stringify(s));return s;}
function saveDB(){localStorage.setItem(DB_KEY,JSON.stringify(DB));}
let DB=loadDB();
const DEFAULT_CATEGORIES=["Rice","Noodles","Chicken","Vegetarian","Drinks","Snacks","Desserts"];
if(!Array.isArray(DB.categories)||!DB.categories.length)DB.categories=[...DEFAULT_CATEGORIES];
DB.students.forEach(st=>{if(!st.status)st.status="active";});
DB.vendors.forEach(v=>{
  if(typeof v.is_open!=="boolean")v.is_open=true;
  if(!v.hours)v.hours="10:00 AM – 8:00 PM";
  if(typeof v.rejection_reason!=="string")v.rejection_reason="";
});
DB.foodItems.forEach(f=>{
  if(!Number.isFinite(Number(f.stock_qty)))f.stock_qty=f.availability==="soldout"?0:f.availability==="limited"?5:20;
  f.stock_qty=Math.max(0,parseInt(f.stock_qty)||0);
  f.availability=f.stock_qty<=0?"soldout":f.stock_qty<=5?"limited":"available";
});
DB.orders.forEach(o=>{if(typeof o.sale_recorded!=="boolean")o.sale_recorded=o.status==="collected";});
// Keep the demo vendor account connected to Uncle Lim's Rice Corner, even for older saved prototype data.
const demoVendorUser=DB.users.find(u=>u.email==="vendor@cafeshare.my");
if(demoVendorUser){
  const uncle=DB.vendors.find(v=>v.stall_name==="Uncle Lim's Rice Corner");
  const warung=DB.vendors.find(v=>v.stall_name==="Warung Kak Nita");
  if(uncle&&warung&&warung.user_id===demoVendorUser.user_id&&uncle.user_id===0){
    warung.user_id=0;
    uncle.user_id=demoVendorUser.user_id;
  }
}
saveDB();
let session=JSON.parse(sessionStorage.getItem("cafeshare_session")||"null");
const nextId=arr=>arr.length?Math.max(...arr.map(x=>x[x.constructor===Array?0:0]))+1:(()=>{let m=0;arr.forEach(x=>m=Math.max(m,x[Object.keys(x)[0]]));return m+1;})();
const nid=(arr,pk)=>arr.reduce((m,x)=>Math.max(m,x[pk]),0)+1;
const fmt=n=>"RM "+n.toFixed(2);
const vName=id=>{const v=DB.vendors.find(v=>v.vendor_id===id);return v?v.stall_name:"—";};
const catColor={Rice:"#fff1e4",Noodles:"#e0f2fe",Drinks:"#dcfce7",Snacks:"#fef9c3",Desserts:"#fce7f3",Vegetarian:"#d1fae5",Chicken:"#fee2e2"};
const categoryIcons={Rice:"🍚",Noodles:"🍜",Chicken:"🍗",Vegetarian:"🥬",Drinks:"🧃",Snacks:"🍿",Desserts:"🍰"};
const getCategories=()=>DB.categories;
const categoryIcon=c=>categoryIcons[c]||"🍽️";
function availMeta(a){return a==="closed"?["Stall closed","st-so","⚫"]:a==="available"?["Available","st-av","🟢"]:a==="limited"?["Almost sold out","st-li","🟡"]:["Sold out","st-so","🔴"];}
function syncStockAvailability(f){if(!f)return;f.stock_qty=Math.max(0,parseInt(f.stock_qty)||0);f.availability=f.stock_qty<=0?"soldout":f.stock_qty<=5?"limited":"available";}
function orderStatusMeta(st){return ({new:["New order","var(--amber)"],accepted:["Accepted","var(--blue)"],preparing:["Preparing","var(--purple)"],ready:["Ready for pickup","var(--amber)"],collected:["Collected ✓","var(--green)"],rejected:["Rejected","var(--red)"],cancelled:["Cancelled","var(--red)"]})[st]||[st||"Unknown","var(--muted)"]; }
function orderBadge(st){const m=orderStatusMeta(st);return `<span class="statuschip" style="background:${m[1]}">${m[0]}</span>`;}
function recordOrderSale(o){
  if(!o||o.sale_recorded)return;
  DB.orderItems.filter(i=>i.order_id===o.order_id).forEach(i=>{const f=DB.foodItems.find(x=>x.food_id===i.food_id);if(f){f.sold=(f.sold||0)+(i.quantity||1);f.pop=Math.min(99,(f.pop||50)+1);}});
  o.sale_recorded=true;
}
function restoreOrderStock(o){
  if(!o||o.stock_restored)return;
  DB.orderItems.filter(i=>i.order_id===o.order_id).forEach(i=>{const f=DB.foodItems.find(x=>x.food_id===i.food_id);if(f){const wasOut=f.stock_qty<=0;f.stock_qty=(f.stock_qty||0)+(i.quantity||1);syncStockAvailability(f);if(wasOut&&f.stock_qty>0&&typeof notifyFavouriteWatchers==="function")notifyFavouriteWatchers(f,"Favourite back in stock! ✅",f.name+" at "+vName(f.vendor_id)+" is available again.");}});
  o.stock_restored=true;
}
function toast(msg){const t=document.createElement("div");t.className="toast";t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2400);}
function notify(user_id,title,message){DB.notifications.push({notification_id:nid(DB.notifications,"notification_id"),user_id,title,message,read_status:false,created_at:new Date().toLocaleString("en-MY",{hour12:false})});saveDB();}
