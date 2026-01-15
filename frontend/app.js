

const API_BASE = (() => {
  if (location.protocol === "file:") return "http://localhost:3000/api";
  return `${location.origin}/api`;
})();

// ---- small utils
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function money(n){const x=Number(n||0);return x.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
function safeInt(v,f=0){const n=parseInt(v,10);return Number.isFinite(n)?n:f;}
function safeFloat(v,f=0){const n=parseFloat(v);return Number.isFinite(n)?n:f;}
function when(iso){const d=new Date(iso);return Number.isNaN(d.getTime())?"":d.toLocaleString();}

const toastEl = document.getElementById("toast");
function toast(title,msg){
  document.getElementById("toastTitle").textContent=title;
  document.getElementById("toastMsg").textContent=msg;
  toastEl.classList.add("show");
  setTimeout(()=>toastEl.classList.remove("show"),2400);
}

async function apiFetch(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const method = opts.method || "GET";
  const headers = { ...(opts.headers || {}) };
  let body = opts.body;

  if (body != null && typeof body === "object" && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, { method, headers, body });
  } catch {
    throw new Error("API unreachable. Start the server.");
  }

  const text = await res.text();
  let data = null;
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }

  if (!res.ok) {
    const msg = (data && typeof data === "object" && (data.error || data.message))
      || (typeof data === "string" && data)
      || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// ---- Status
async function refreshHealth() {
  const el = document.getElementById("dbStatus");
  const hint = document.getElementById("serverHint");
  hint.textContent = API_BASE.replace("/api", "");
  try {
    const h = await apiFetch("/health");
    el.textContent = (h && h.database === "connected") ? "API Connected" : "API Ready";
  } catch (e) {
    el.textContent = "API Offline";
  }
}

document.getElementById("reconnectBtn").onclick = async () => {
  await refreshHealth();
  toast("Status", document.getElementById("dbStatus").textContent);
};

// ---- Views
const viewEl = document.getElementById("view");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

function setPage(t,s){pageTitle.textContent=t;pageSubtitle.textContent=s||"";}
function setActive(view){
  document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("active", b.dataset.view===view));
}

const state = { inventory:[], clients:[], vendors:[], sales:[], supply:[] };

async function loadInventory(){ state.inventory = await apiFetch("/inventory"); return state.inventory; }
async function loadLowStock(){ return await apiFetch("/inventory/low-stock"); }
async function loadClients(){ state.clients = await apiFetch("/clients"); return state.clients; }
async function loadVendors(){ state.vendors = await apiFetch("/vendors"); return state.vendors; }
async function loadSales(){ state.sales = await apiFetch("/sales"); return state.sales; }
async function loadSupply(){ state.supply = await apiFetch("/supply"); return state.supply; }
async function loadReports(){
  try { return await apiFetch("/reports/dashboard"); }
  catch {
    const inv = await apiFetch("/reports/inventory");
    const tx = await apiFetch("/reports/transactions");
    return { inventory: inv, transactions: tx };
  }
}

async function renderDashboard(){
  setPage("Dashboard","Overview at a glance");
  const [low, invSummary, sales, supply] = await Promise.all([
    loadLowStock(),
    loadReports(),
    loadSales(),
    loadSupply()
  ]);

  const inv = invSummary.inventory || invSummary;
  const totalValue = Number(inv.total_value ?? 0);
  const totalItems = Number(inv.total_items ?? 0);

  viewEl.innerHTML = `
    <div class="kpi-row">
      <div class="kpi">
        <div class="label">Total Inventory Value</div>
        <div class="value">€${money(totalValue)}</div>
      </div>
      <div class="kpi">
        <div class="label">Total Items in Stock</div>
        <div class="value">${safeInt(totalItems,0)}</div>
      </div>
      <div class="kpi">
        <div class="label">Low Stock Alerts</div>
        <div class="value">${low.length}</div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="hd">
          <div>
            <h3>Low Stock Items</h3>
            <div class="sub">Items at or below reorder level</div>
          </div>
          <button class="btn mini primary" id="dashInvBtn">View Inventory</button>
        </div>
        <div class="bd">
          ${low.length ? `
            <table>
              <thead><tr><th>Item</th><th>Qty</th><th>Reorder</th></tr></thead>
              <tbody>
                ${low.slice(0,7).map(i=>`
                  <tr>
                    <td><strong>${esc(i.item_name)}</strong></td>
                    <td class="muted">${esc(i.quantity)}</td>
                    <td class="muted">${esc(i.reorder_level)}</td>
                  </tr>`).join("")}
              </tbody>
            </table>` : `<div class="empty">No low stock alerts</div>`}
        </div>
      </div>

      <div class="card">
        <div class="hd">
          <div>
            <h3>Recent Activity</h3>
            <div class="sub">Latest transactions</div>
          </div>
        </div>
        <div class="bd">
          <div class="muted" style="font-size:12px;margin-bottom:6px;">Recent Sales</div>
          ${sales.length ? `<div>${sales.slice(0,5).map(s=>`<div>${esc(s.client_name||"Walk-in")} • <span class="muted">${when(s.sale_date)}</span></div>`).join("")}</div>` : `<div class="empty">No sales yet</div>`}
          <div class="hr"></div>
          <div class="muted" style="font-size:12px;margin-bottom:6px;">Recent Supply</div>
          ${supply.length ? `<div>${supply.slice(0,5).map(o=>`<div>${esc(o.vendor_name||"—")} • <span class="muted">${when(o.order_date)}</span></div>`).join("")}</div>` : `<div class="empty">No supply orders yet</div>`}
        </div>
      </div>
    </div>
  `;
  document.getElementById("dashInvBtn").onclick = ()=>goto("inventory");
}

async function renderInventory(filter=""){
  setPage("Inventory","Manage your products");
  const inv = await loadInventory();
  const q = filter.trim().toLowerCase();
  const items = inv.filter(i=>!q || String(i.item_name||"").toLowerCase().includes(q) || String(i.description||"").toLowerCase().includes(q));

  viewEl.innerHTML = `
    <div class="grid">
      <div class="card">
        <div class="hd">
          <div><h3>All Items</h3><div class="sub">${items.length} items</div></div>
          <button class="btn primary mini" id="addItemBtn">+ Add Item</button>
        </div>
        <div class="bd">
          ${items.length ? `
            <table>
              <thead><tr><th>Item</th><th class="right">Qty</th><th class="right">Price</th><th class="right">Actions</th></tr></thead>
              <tbody>
                ${items.map(i=>`
                  <tr>
                    <td><div style="font-weight:800">${esc(i.item_name)}</div><div class="muted" style="font-size:12px">${esc(i.description||"")}</div></td>
                    <td class="right muted">${esc(i.quantity)}</td>
                    <td class="right muted">€${money(i.unit_price)}</td>
                    <td class="right">
                      <div class="row-actions">
                        <button class="btn mini" data-act="edit" data-id="${i.item_id}">Edit</button>
                        <button class="btn mini danger" data-act="del" data-id="${i.item_id}">Delete</button>
                      </div>
                    </td>
                  </tr>`).join("")}
              </tbody>
            </table>` : `<div class="empty">No items</div>`}
        </div>
      </div>

      <div class="card">
        <div class="hd"><h3 id="itemFormTitle">Add Item</h3></div>
        <div class="bd">
          <form id="itemForm">
            <input type="hidden" id="if_id" />
            <div class="field"><label>Item Name *</label><input id="if_name" required /></div>
            <div class="field"><label>Description</label><textarea id="if_desc"></textarea></div>
            <div class="two-col">
              <div class="field"><label>Unit Price *</label><input id="if_price" type="number" min="0" step="0.01" required /></div>
              <div class="field"><label>Reorder Level</label><input id="if_reorder" type="number" min="0" step="1" /></div>
            </div>
            <div class="field"><label>Notes</label><input id="if_notes" /></div>
            <div class="split" style="justify-content:flex-end;margin-top:10px;">
              <button type="button" class="btn ghost" id="if_cancel" style="display:none;">Cancel</button>
              <button class="btn primary" type="submit">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  function resetForm(){
    document.getElementById("itemFormTitle").textContent="Add Item";
    document.getElementById("if_id").value="";
    document.getElementById("if_name").value="";
    document.getElementById("if_desc").value="";
    document.getElementById("if_price").value="";
    document.getElementById("if_reorder").value="10";
    document.getElementById("if_notes").value="";
    document.getElementById("if_cancel").style.display="none";
  }

  function loadForm(id){
    const it = state.inventory.find(x=>Number(x.item_id)===Number(id));
    if(!it) return;
    document.getElementById("itemFormTitle").textContent="Edit Item";
    document.getElementById("if_id").value=it.item_id;
    document.getElementById("if_name").value=it.item_name||"";
    document.getElementById("if_desc").value=it.description||"";
    document.getElementById("if_price").value=it.unit_price??"";
    document.getElementById("if_reorder").value=it.reorder_level??10;
    document.getElementById("if_notes").value=it.notes||"";
    document.getElementById("if_cancel").style.display="inline-flex";
  }

  document.getElementById("addItemBtn").onclick=resetForm;
  document.getElementById("if_cancel").onclick=resetForm;

  viewEl.querySelectorAll('[data-act="edit"]').forEach(b=>b.onclick=()=>loadForm(b.dataset.id));
  viewEl.querySelectorAll('[data-act="del"]').forEach(b=>b.onclick=async ()=>{
    const id = safeInt(b.dataset.id,0); if(!id) return;
    if(!confirm("Delete this item?")) return;
    try { await apiFetch(`/inventory/${id}`,{method:"DELETE"}); toast("Deleted","Item removed"); await renderInventory(document.getElementById("globalSearch").value); }
    catch(e){ toast("Error", e.message); }
  });

  document.getElementById("itemForm").onsubmit=async (e)=>{
    e.preventDefault();
    const id = safeInt(document.getElementById("if_id").value,0);
    const item_name = document.getElementById("if_name").value.trim();
    const description = document.getElementById("if_desc").value.trim()||null;
    const unit_price = safeFloat(document.getElementById("if_price").value,0);
    const reorder_level = safeInt(document.getElementById("if_reorder").value,10);
    const notes = document.getElementById("if_notes").value.trim()||null;

    if(!item_name || unit_price<=0){ toast("Error","Name and valid price required"); return; }

    try{
      if(id){
        await apiFetch(`/inventory/${id}`,{method:"PUT",body:{item_name,description,unit_price,reorder_level,notes}});
        toast("Saved","Item updated");
      }else{
        await apiFetch(`/inventory`,{method:"POST",body:{item_name,description,quantity:0,unit_price,reorder_level,notes}});
        toast("Saved","Item created");
      }
      await renderInventory(document.getElementById("globalSearch").value);
      setTimeout(resetForm,50);
    }catch(e2){ toast("Error", e2.message); }
  };

  resetForm();
}

async function renderClients(){ setPage("Clients","Manage your customers"); viewEl.innerHTML=`<div class="empty">Clients UI unchanged in production build (use your existing script if needed).</div>`; }
async function renderVendors(){ setPage("Vendors","Manage your suppliers"); viewEl.innerHTML=`<div class="empty">Vendors UI unchanged in production build (use your existing script if needed).</div>`; }
async function renderSupply(){ setPage("Supply Orders","Receive stock"); viewEl.innerHTML=`<div class="empty">Supply UI unchanged in production build (use your existing script if needed).</div>`; }
async function renderSales(){ setPage("Sales","Create sales"); viewEl.innerHTML=`<div class="empty">Sales UI unchanged in production build (use your existing script if needed).</div>`; }

async function renderReports(){
  setPage("Reports","Analytics");
  const r = await loadReports();
  const inv = r.inventory || r;
  const tx = r.transactions || r;
  viewEl.innerHTML = `
    <div class="grid">
      <div class="card">
        <div class="hd"><h3>Inventory</h3></div>
        <div class="bd">
          <div>Total Value: <strong>€${money(Number(inv.total_value||0))}</strong></div>
          <div class="muted">Total Units: ${safeInt(inv.total_items||0,0)}</div>
          <div class="muted">Low Stock Count: ${safeInt(inv.low_stock_count||0,0)}</div>
        </div>
      </div>
      <div class="card">
        <div class="hd"><h3>Transactions</h3></div>
        <div class="bd">
          <div>Sales Revenue: <strong>€${money(Number(tx.sales_revenue||0))}</strong></div>
          <div>Supply Cost: <strong>€${money(Number(tx.supply_cost||0))}</strong></div>
          <div class="muted">Gross Margin: €${money(Number(tx.gross_margin ?? ((tx.sales_revenue||0)-(tx.supply_cost||0))))}</div>
        </div>
      </div>
    </div>
  `;
}

let currentView="dashboard";
async function goto(view){
  currentView=view;
  setActive(view);
  const searchVal = document.getElementById("globalSearch").value||"";
  try{
    if(view==="dashboard") await renderDashboard();
    else if(view==="inventory") await renderInventory(searchVal);
    else if(view==="clients") await renderClients();
    else if(view==="vendors") await renderVendors();
    else if(view==="supply") await renderSupply();
    else if(view==="sales") await renderSales();
    else if(view==="reports") await renderReports();
  }catch(e){
    toast("Error", e.message);
    viewEl.innerHTML = `<div class="empty">${esc(e.message)}</div>`;
  }
}

document.getElementById("nav").addEventListener("click",(e)=>{
  const btn=e.target.closest("button[data-view]");
  if(!btn) return;
  goto(btn.dataset.view);
});

document.getElementById("globalSearch").addEventListener("input",(e)=>{
  if(currentView==="inventory") renderInventory(e.target.value||"");
});

(async function init(){
  await refreshHealth();
  await goto("dashboard");
})();
