const listings = [
  {id:1,title:"Wash & Fold Laundry",category:"Laundry",price:"₹70",unit:"/ kg",desc:"Pickup from Block B gate · Same-day",distance:"0.4 km",emoji:"🧺",photo:"laundry-photo",rating:"4.9",seller:"Ananya Mehta",verified:true,saved:true},
  {id:2,title:"Midnight Sandwiches",category:"Food",price:"₹45",unit:"",desc:"Fresh sandwiches · 11 PM – 2 AM",distance:"0.7 km",emoji:"🥪",photo:"food-photo",rating:"4.8",seller:"Kabir's Kitchen",verified:true,saved:true},
  {id:3,title:"DBMS Complete Notes",category:"Study stuff",price:"₹30",unit:"",desc:"Sem 5 · handwritten + PDF",distance:"0.2 km",emoji:"📚",photo:"notes-photo",rating:"5.0",seller:"Rahul S.",verified:true,saved:false},
  {id:4,title:"Sony WH-1000XM4",category:"Electronics",price:"₹8,500",unit:"",desc:"Excellent condition · 1 year old",distance:"1.1 km",emoji:"🎧",photo:"purple-photo",rating:"4.7",seller:"Arjun P.",verified:true,saved:true},
  {id:5,title:"Room near Main Gate",category:"Rentals",price:"₹5,500",unit:"/ month",desc:"Single room · Wi-Fi included",distance:"0.9 km",emoji:"🛏️",photo:"blue-photo",rating:"4.8",seller:"Megha R.",verified:true,saved:false},
  {id:6,title:"Python Lab Help",category:"Services",price:"₹150",unit:"/ hour",desc:"1:1 doubt solving · online/offline",distance:"0.3 km",emoji:"💻",photo:"green-photo",rating:"4.9",seller:"Dev A.",verified:true,saved:true},
  {id:7,title:"Cycling Buddy Rental",category:"Rentals",price:"₹80",unit:"/ day",desc:"Good condition · lock included",distance:"1.3 km",emoji:"🚲",photo:"orange-photo",rating:"4.6",seller:"Nikhil",verified:false,saved:false},
  {id:8,title:"Hostel Tiffin Service",category:"Food",price:"₹1,800",unit:"/ month",desc:"Home-style dinner · Mon–Sat",distance:"0.8 km",emoji:"🍱",photo:"food2-photo",rating:"4.9",seller:"Asha's Kitchen",verified:true,saved:false}
];

const photoClasses = ["laundry-photo","food-photo","notes-photo","purple-photo","blue-photo","green-photo","orange-photo","food2-photo"];

function card(l){
  return `<article class="listing-card" data-title="${l.title.toLowerCase()}">
    <div class="listing-photo ${l.photo}">${l.emoji}<button class="heart" data-save="${l.id}">${l.saved ? "♥":"♡"}</button></div>
    <div class="listing-body">
      <div class="verified-line">${l.verified ? "✓ VERIFIED SELLER":"SELLER"} · ${l.rating} ★</div>
      <h3>${l.title}</h3><p>${l.desc}</p>
      <div class="listing-meta"><strong>${l.price}<small>${l.unit}</small></strong><span>⌖ ${l.distance}</span></div>
    </div>
  </article>`;
}

function renderListings(target="listingGrid", filter=""){
  const el=document.getElementById(target);
  if(!el)return;
  const data=filter ? listings.filter(x => (x.title+" "+x.category+" "+x.desc).toLowerCase().includes(filter.toLowerCase())) : listings;
  el.innerHTML=data.map(card).join("");
  bindHearts();
}

function bindHearts(){
  document.querySelectorAll("[data-save]").forEach(btn=>{
    btn.onclick=e=>{
      e.stopPropagation();
      const item=listings.find(x=>x.id==btn.dataset.save);
      item.saved=!item.saved;
      btn.textContent=item.saved?"♥":"♡";
      showToast(item.saved?"Saved to your shortlist":"Removed from saved");
    };
  });
}

function showPage(name){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active-page"));
  const page=document.getElementById("page-"+name);
  if(page) page.classList.add("active-page");
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.page===name));
  window.scrollTo({top:0,behavior:"smooth"});
  if(name==="saved"){
    const saved=listings.filter(x=>x.saved);
    document.getElementById("savedGrid").innerHTML=saved.length?saved.map(card).join(""):"<div class='panel'><h3>No saved items yet</h3><p class='muted'>Tap the heart on any listing to save it.</p></div>";
    bindHearts();
  }
}

document.addEventListener("click", e=>{
  const btn=e.target.closest("[data-page]");
  if(btn){showPage(btn.dataset.page);document.querySelector(".sidebar")?.classList.remove("open")}
});

document.getElementById("searchInput").addEventListener("input",e=>{
  const value=e.target.value.trim();
  if(value){
    showPage("home");
    renderListings("listingGrid",value);
  }else renderListings();
});

document.querySelectorAll(".category").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".category").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
  renderListings("listingGrid",btn.querySelector("b").textContent);
}));

document.querySelectorAll(".filter").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
}));

function scrollToMarket(){document.getElementById("market").scrollIntoView({behavior:"smooth"})}
window.scrollToMarket=scrollToMarket;

document.getElementById("mobileMenu").addEventListener("click",()=>document.querySelector(".sidebar").classList.toggle("open"));

const modal=document.getElementById("notificationModal");
document.getElementById("notificationBtn").onclick=()=>modal.classList.remove("hidden");
document.getElementById("closeModal").onclick=()=>modal.classList.add("hidden");
modal.onclick=e=>{if(e.target===modal)modal.classList.add("hidden")};

document.getElementById("publishBtn").onclick=()=>{
  showToast("Listing published!");
  setTimeout(()=>showPage("seller"),800);
};

function showToast(msg){
  const toast=document.getElementById("toast");
  toast.querySelector("strong").textContent=msg;
  toast.classList.add("show");
  clearTimeout(window.__toast);
  window.__toast=setTimeout(()=>toast.classList.remove("show"),2600);
}

document.getElementById("sendMessage").onclick=sendMessage;
document.getElementById("chatInput").addEventListener("keydown",e=>{if(e.key==="Enter")sendMessage()});
function sendMessage(){
  const input=document.getElementById("chatInput"), value=input.value.trim();
  if(!value)return;
  const body=document.getElementById("chatBody");
  const bubble=document.createElement("div");bubble.className="bubble me";bubble.textContent=value;body.appendChild(bubble);input.value="";body.scrollTop=body.scrollHeight;
  setTimeout(()=>{const reply=document.createElement("div");reply.className="bubble other";reply.textContent="Sounds good! Let me know if you want to lock the deal.";body.appendChild(reply);body.scrollTop=body.scrollHeight},900);
}

document.querySelectorAll(".toggle").forEach(t=>t.onclick=()=>t.classList.toggle("on"));

document.querySelectorAll(".quick-replies button").forEach(b=>b.onclick=()=>{document.getElementById("chatInput").value=b.textContent;document.getElementById("chatInput").focus()});

document.querySelectorAll(".conversation").forEach(c=>c.addEventListener("click",()=>{
  document.querySelectorAll(".conversation").forEach(x=>x.classList.remove("active"));c.classList.add("active");
}));

document.getElementById("conversationList").innerHTML=[
  ["AM","Ananya Mehta","Deal confirmed · 4 kg laundry","2m","avatar-purple"],
  ["RS","Rahul S.","Can you send the notes today?","24m","avatar-green"],
  ["AP","Arjun P.","₹8,000 works for me.","1h","avatar-orange"],
  ["KA","Kabir's Kitchen","Your order is ready.","3h","avatar-purple"]
].map((x,i)=>`<div class="conversation ${i===0?"active":""}"><div class="conv-avatar ${x[4]}">${x[0]}</div><div><strong>${x[1]}</strong><p>${x[2]}</p></div><time>${x[3]}</time></div>`).join("");

renderListings();
