

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

async function exportWorkbook(){
  const btn = document.getElementById("exportBtn");
  if(btn){ btn.disabled = true; btn.textContent = "Exporting..."; }
  try{
    const res = await fetch(`${API_BASE}/export/xlsx`);
    if(!res.ok) throw new Error(`Export failed (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-export-${new Date().toISOString().replace(/[:.]/g,"-")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Exported","Workbook downloaded");
  }catch(e){
    toast("Error", e.message || "Export failed");
  }finally{
    if(btn){ btn.disabled = false; btn.textContent = "Export Excel"; }
  }
}

// ---- Status
async function refreshHealth() {
  const el = document.getElementById("dbStatus");
  const hint = document.getElementById("serverHint");
  if (hint) hint.textContent = API_BASE.replace("/api", "");
  try {
    const h = await apiFetch("/health");
    if (el) el.textContent = (h && h.database === "connected") ? "API Connected" : "API Ready";
  } catch (e) {
    if (el) el.textContent = "API Offline";
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

const state = { inventory:[], clients:[], vendors:[], sales:[], saleDetails:[], supply:[], supplyDetails:[] };

async function loadInventory(){ state.inventory = await apiFetch("/inventory"); return state.inventory; }
async function loadLowStock(){ return await apiFetch("/inventory/low-stock"); }
async function loadClients(){ state.clients = await apiFetch("/clients"); return state.clients; }
async function loadVendors(){ state.vendors = await apiFetch("/vendors"); return state.vendors; }
async function loadSales(){ state.sales = await apiFetch("/sales"); return state.sales; }
async function loadSaleDetails(){ state.saleDetails = await apiFetch("/sales/details"); return state.saleDetails; }
async function loadSupply(){ state.supply = await apiFetch("/supply"); return state.supply; }
async function loadSupplyDetails(){ state.supplyDetails = await apiFetch("/supply/details"); return state.supplyDetails; }
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

async function renderClients(){
  setPage("Clients","Manage your customers");
  const clients = await loadClients();
  viewEl.innerHTML = `
    <div class="grid">
      <div class="card">
        <div class="hd">
          <div><h3>Clients</h3><div class="sub">${clients.length} clients</div></div>
          <button class="btn mini" id="refreshClients">Refresh</button>
        </div>
        <div class="bd">
          ${clients.length ? `
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th class="right">Actions</th></tr></thead>
              <tbody>
                ${clients.map(c=>`
                  <tr>
                    <td><strong>${esc(c.client_name)}</strong><div class="muted" style="font-size:12px">${esc(c.address||"")}</div></td>
                    <td class="muted">${esc(c.email||"")}</td>
                    <td class="muted">${esc(c.phone||"")}</td>
                    <td class="right">
                      <div class="row-actions">
                        <button class="btn mini" data-act="edit" data-id="${c.client_id}">Edit</button>
                        <button class="btn mini danger" data-act="del" data-id="${c.client_id}">Delete</button>
                      </div>
                    </td>
                  </tr>`).join("")}
              </tbody>
            </table>` : `<div class="empty">No clients yet</div>`}
        </div>
      </div>

      <div class="card">
        <div class="hd"><h3 id="clientFormTitle">Add Client</h3></div>
        <div class="bd">
          <form id="clientForm">
            <input type="hidden" id="cf_id" />
            <div class="field"><label>Name *</label><input id="cf_name" required /></div>
            <div class="field"><label>Email</label><input id="cf_email" type="email" /></div>
            <div class="two-col">
              <div class="field"><label>Phone</label><input id="cf_phone" /></div>
              <div class="field"><label>Address</label><input id="cf_addr" /></div>
            </div>
            <div class="field"><label>Notes</label><textarea id="cf_notes"></textarea></div>
            <div class="split" style="justify-content:flex-end;margin-top:10px;">
              <button type="button" class="btn ghost" id="cf_cancel" style="display:none;">Cancel</button>
              <button class="btn primary" type="submit">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  function resetForm(){
    document.getElementById("clientFormTitle").textContent="Add Client";
    document.getElementById("cf_id").value="";
    document.getElementById("cf_name").value="";
    document.getElementById("cf_email").value="";
    document.getElementById("cf_phone").value="";
    document.getElementById("cf_addr").value="";
    document.getElementById("cf_notes").value="";
    document.getElementById("cf_cancel").style.display="none";
  }
  function loadForm(id){
    const c = state.clients.find(x=>Number(x.client_id)===Number(id));
    if(!c) return;
    document.getElementById("clientFormTitle").textContent="Edit Client";
    document.getElementById("cf_id").value=c.client_id;
    document.getElementById("cf_name").value=c.client_name||"";
    document.getElementById("cf_email").value=c.email||"";
    document.getElementById("cf_phone").value=c.phone||"";
    document.getElementById("cf_addr").value=c.address||"";
    document.getElementById("cf_notes").value=c.notes||"";
    document.getElementById("cf_cancel").style.display="inline-flex";
  }

  document.getElementById("refreshClients").onclick=()=>renderClients();
  document.getElementById("cf_cancel").onclick=resetForm;

  document.getElementById("clientForm").onsubmit=async (e)=>{
    e.preventDefault();
    const id = safeInt(document.getElementById("cf_id").value,0);
    const client_name = document.getElementById("cf_name").value.trim();
    const email = document.getElementById("cf_email").value.trim()||null;
    const phone = document.getElementById("cf_phone").value.trim()||null;
    const address = document.getElementById("cf_addr").value.trim()||null;
    const notes = document.getElementById("cf_notes").value.trim()||null;
    if(!client_name){ toast("Error","Name required"); return; }
    try{
      if(id){ await apiFetch(`/clients/${id}`,{method:"PUT",body:{client_name,email,phone,address,notes}}); toast("Saved","Client updated"); }
      else { await apiFetch(`/clients`,{method:"POST",body:{client_name,email,phone,address,notes}}); toast("Saved","Client created"); }
      await renderClients();
    }catch(e2){ toast("Error", e2.message); }
  };

  viewEl.querySelectorAll('[data-act="edit"]').forEach(b=>b.onclick=()=>loadForm(b.dataset.id));
  viewEl.querySelectorAll('[data-act="del"]').forEach(b=>b.onclick=async ()=>{
    const id = safeInt(b.dataset.id,0); if(!id) return;
    if(!confirm("Delete this client?")) return;
    try{ await apiFetch(`/clients/${id}`,{method:"DELETE"}); toast("Deleted","Client removed"); await renderClients(); }
    catch(e3){ toast("Error", e3.message); }
  });

  resetForm();
}

async function renderVendors(){
  setPage("Vendors","Manage your suppliers");
  const vendors = await loadVendors();
  viewEl.innerHTML = `
    <div class="grid">
      <div class="card">
        <div class="hd">
          <div><h3>Vendors</h3><div class="sub">${vendors.length} vendors</div></div>
          <button class="btn mini" id="refreshVendors">Refresh</button>
        </div>
        <div class="bd">
          ${vendors.length ? `
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th class="right">Actions</th></tr></thead>
              <tbody>
                ${vendors.map(v=>`
                  <tr>
                    <td><strong>${esc(v.vendor_name)}</strong><div class="muted" style="font-size:12px">${esc(v.address||"")}</div></td>
                    <td class="muted">${esc(v.email||"")}</td>
                    <td class="muted">${esc(v.phone||"")}</td>
                    <td class="right">
                      <div class="row-actions">
                        <button class="btn mini" data-act="edit" data-id="${v.vendor_id}">Edit</button>
                        <button class="btn mini danger" data-act="del" data-id="${v.vendor_id}">Delete</button>
                      </div>
                    </td>
                  </tr>`).join("")}
              </tbody>
            </table>` : `<div class="empty">No vendors yet</div>`}
        </div>
      </div>

      <div class="card">
        <div class="hd"><h3 id="vendorFormTitle">Add Vendor</h3></div>
        <div class="bd">
          <form id="vendorForm">
            <input type="hidden" id="vf_id" />
            <div class="field"><label>Name *</label><input id="vf_name" required /></div>
            <div class="field"><label>Email</label><input id="vf_email" type="email" /></div>
            <div class="two-col">
              <div class="field"><label>Phone</label><input id="vf_phone" /></div>
              <div class="field"><label>Address</label><input id="vf_addr" /></div>
            </div>
            <div class="field"><label>Notes</label><textarea id="vf_notes"></textarea></div>
            <div class="split" style="justify-content:flex-end;margin-top:10px;">
              <button type="button" class="btn ghost" id="vf_cancel" style="display:none;">Cancel</button>
              <button class="btn primary" type="submit">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  function resetForm(){
    document.getElementById("vendorFormTitle").textContent="Add Vendor";
    document.getElementById("vf_id").value="";
    document.getElementById("vf_name").value="";
    document.getElementById("vf_email").value="";
    document.getElementById("vf_phone").value="";
    document.getElementById("vf_addr").value="";
    document.getElementById("vf_notes").value="";
    document.getElementById("vf_cancel").style.display="none";
  }
  function loadForm(id){
    const v = state.vendors.find(x=>Number(x.vendor_id)===Number(id));
    if(!v) return;
    document.getElementById("vendorFormTitle").textContent="Edit Vendor";
    document.getElementById("vf_id").value=v.vendor_id;
    document.getElementById("vf_name").value=v.vendor_name||"";
    document.getElementById("vf_email").value=v.email||"";
    document.getElementById("vf_phone").value=v.phone||"";
    document.getElementById("vf_addr").value=v.address||"";
    document.getElementById("vf_notes").value=v.notes||"";
    document.getElementById("vf_cancel").style.display="inline-flex";
  }

  document.getElementById("refreshVendors").onclick=()=>renderVendors();
  document.getElementById("vf_cancel").onclick=resetForm;

  document.getElementById("vendorForm").onsubmit=async (e)=>{
    e.preventDefault();
    const id = safeInt(document.getElementById("vf_id").value,0);
    const vendor_name = document.getElementById("vf_name").value.trim();
    const email = document.getElementById("vf_email").value.trim()||null;
    const phone = document.getElementById("vf_phone").value.trim()||null;
    const address = document.getElementById("vf_addr").value.trim()||null;
    const notes = document.getElementById("vf_notes").value.trim()||null;
    if(!vendor_name){ toast("Error","Name required"); return; }
    try{
      if(id){ await apiFetch(`/vendors/${id}`,{method:"PUT",body:{vendor_name,email,phone,address,notes}}); toast("Saved","Vendor updated"); }
      else { await apiFetch(`/vendors`,{method:"POST",body:{vendor_name,email,phone,address,notes}}); toast("Saved","Vendor created"); }
      await renderVendors();
    }catch(e2){ toast("Error", e2.message); }
  };

  viewEl.querySelectorAll('[data-act="edit"]').forEach(b=>b.onclick=()=>loadForm(b.dataset.id));
  viewEl.querySelectorAll('[data-act="del"]').forEach(b=>b.onclick=async ()=>{
    const id = safeInt(b.dataset.id,0); if(!id) return;
    if(!confirm("Delete this vendor?")) return;
    try{ await apiFetch(`/vendors/${id}`,{method:"DELETE"}); toast("Deleted","Vendor removed"); await renderVendors(); }
    catch(e3){ toast("Error", e3.message); }
  });

  resetForm();
}

async function renderSales(){
  setPage("Sales","Create sales");
  const [sales, saleDetails, clients, inventory] = await Promise.all([
    loadSales(),
    loadSaleDetails(),
    loadClients(),
    loadInventory()
  ]);
  const invMap = Object.fromEntries(inventory.map(i=>[i.item_id,i]));
  viewEl.innerHTML = `
    <div class="grid">
      <div class="card">
        <div class="hd">
          <div><h3>Sales</h3><div class="sub">${sales.length} records</div></div>
          <button class="btn mini" id="refreshSales">Refresh</button>
        </div>
        <div class="bd">
          ${sales.length ? `
            <table>
              <thead><tr><th>Sale</th><th>Client</th><th>Date</th><th class="right">Actions</th></tr></thead>
              <tbody>
                ${sales.map(s=>`
                  <tr>
                    <td><strong>#${esc(s.sale_id)}</strong><div class="muted" style="font-size:12px">${esc(s.sale_notes||"")}</div></td>
                    <td class="muted">${esc(s.client_name||"Walk-in")}</td>
                    <td class="muted">${when(s.sale_date)}</td>
                    <td class="right">
                      <div class="row-actions">
                        <button class="btn mini danger" data-act="del" data-id="${s.sale_id}">Delete</button>
                      </div>
                    </td>
                  </tr>`).join("")}
              </tbody>
            </table>` : `<div class="empty">No sales yet</div>`}
          <div class="hr"></div>
          <div class="muted" style="font-size:12px;margin-bottom:6px;">Recent line items</div>
          ${saleDetails.length ? `
            <table>
              <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Client</th></tr></thead>
              <tbody>
                ${saleDetails.slice(0,6).map(d=>`
                  <tr>
                    <td>${esc(d.item_name)}</td>
                    <td class="muted">${esc(d.quantity)}</td>
                    <td class="muted">€${money(d.unit_price)}</td>
                    <td class="muted">${esc(d.client_name||"Walk-in")}</td>
                  </tr>`).join("")}
              </tbody>
            </table>` : `<div class="empty">No sale items</div>`}
        </div>
      </div>

      <div class="card">
        <div class="hd"><h3>New Sale</h3></div>
        <div class="bd">
          <form id="saleForm">
            <div class="field">
              <label>Client</label>
              <select id="sale_client">
                <option value="">Walk-in / none</option>
                ${clients.map(c=>`<option value="${c.client_id}">${esc(c.client_name)}</option>`).join("")}
              </select>
            </div>
            <div class="field"><label>Notes</label><textarea id="sale_notes"></textarea></div>
            <div class="field"><label>Items *</label></div>
            <div class="line-items" id="saleItems"></div>
            <button type="button" class="btn mini" id="saleAddItem">+ Add Item</button>
            <div class="split" style="justify-content:flex-end;margin-top:12px;">
              <button class="btn primary" type="submit">Save Sale</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  const saleItemsEl = document.getElementById("saleItems");
  function addSaleRow(itemId="", qty=1, price=""){
    const row = document.createElement("div");
    row.className="li";
    row.innerHTML = `
      <div class="field">
        <label>Item *</label>
        <select class="li-item">
          <option value="">Select item</option>
          ${inventory.map(i=>`<option value="${i.item_id}" ${Number(itemId)===Number(i.item_id)?"selected":""}>${esc(i.item_name)}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>Qty *</label>
        <input type="number" class="li-qty" min="1" value="${qty}" />
      </div>
      <div class="field">
        <label>Price *</label>
        <input type="number" class="li-price" min="0" step="0.01" value="${price||""}" />
      </div>
      <button type="button" class="btn mini danger remove">✕</button>
    `;
    saleItemsEl.appendChild(row);
    const select = row.querySelector(".li-item");
    const priceInput = row.querySelector(".li-price");
    select.addEventListener("change",()=>{
      const it = invMap[Number(select.value)];
      if(it && !priceInput.value){ priceInput.value = it.unit_price ?? ""; }
    });
    row.querySelector(".remove").onclick = ()=>row.remove();
  }

  document.getElementById("saleAddItem").onclick=()=>addSaleRow();
  addSaleRow();

  document.getElementById("saleForm").onsubmit=async (e)=>{
    e.preventDefault();
    const client_id = safeInt(document.getElementById("sale_client").value,0) || null;
    const notes = document.getElementById("sale_notes").value.trim()||null;
    const items = [...saleItemsEl.querySelectorAll(".li")].map(row=>{
      const item_id = safeInt(row.querySelector(".li-item").value,0);
      const quantity = safeInt(row.querySelector(".li-qty").value,0);
      const unit_price = safeFloat(row.querySelector(".li-price").value,0);
      return { item_id, quantity, unit_price, notes:null };
    }).filter(x=>x.item_id && x.quantity>0 && x.unit_price>0);
    if(!items.length){ toast("Error","Add at least one valid item"); return; }
    try{
      await apiFetch(`/sales`,{method:"POST",body:{client_id, notes, items}});
      toast("Saved","Sale created");
      await loadInventory();
      await renderSales();
    }catch(e2){ toast("Error", e2.message); }
  };

  viewEl.querySelectorAll('[data-act="del"]').forEach(b=>b.onclick=async ()=>{
    const id = safeInt(b.dataset.id,0); if(!id) return;
    if(!confirm("Delete this sale?")) return;
    try{ await apiFetch(`/sales/${id}`,{method:"DELETE"}); toast("Deleted","Sale removed"); await loadInventory(); await renderSales(); }
    catch(e3){ toast("Error", e3.message); }
  });

  document.getElementById("refreshSales").onclick=()=>renderSales();
}

async function renderSupply(){
  setPage("Supply Orders","Receive stock");
  const [orders, supplyDetails, vendors, inventory] = await Promise.all([
    loadSupply(),
    loadSupplyDetails(),
    loadVendors(),
    loadInventory()
  ]);
  const invMap = Object.fromEntries(inventory.map(i=>[i.item_id,i]));

  viewEl.innerHTML = `
    <div class="grid">
      <div class="card">
        <div class="hd">
          <div><h3>Supply Orders</h3><div class="sub">${orders.length} records</div></div>
          <button class="btn mini" id="refreshSupply">Refresh</button>
        </div>
        <div class="bd">
          ${orders.length ? `
            <table>
              <thead><tr><th>Order</th><th>Vendor</th><th>Date</th><th class="right">Actions</th></tr></thead>
              <tbody>
                ${orders.map(o=>`
                  <tr>
                    <td><strong>#${esc(o.supply_order_id)}</strong><div class="muted" style="font-size:12px">${esc(o.order_notes||"")}</div></td>
                    <td class="muted">${esc(o.vendor_name||"Unassigned")}</td>
                    <td class="muted">${when(o.order_date)}</td>
                    <td class="right">
                      <div class="row-actions">
                        <button class="btn mini danger" data-act="del" data-id="${o.supply_order_id}">Delete</button>
                      </div>
                    </td>
                  </tr>`).join("")}
              </tbody>
            </table>` : `<div class="empty">No supply orders yet</div>`}
          <div class="hr"></div>
          <div class="muted" style="font-size:12px;margin-bottom:6px;">Recent items</div>
          ${supplyDetails.length ? `
            <table>
              <thead><tr><th>Item</th><th>Qty</th><th>Cost</th><th>Vendor</th></tr></thead>
              <tbody>
                ${supplyDetails.slice(0,6).map(d=>`
                  <tr>
                    <td>${esc(d.item_name)}</td>
                    <td class="muted">${esc(d.quantity)}</td>
                    <td class="muted">€${money(d.cost_price)}</td>
                    <td class="muted">${esc(d.vendor_name||"Unassigned")}</td>
                  </tr>`).join("")}
              </tbody>
            </table>` : `<div class="empty">No supply items</div>`}
        </div>
      </div>

      <div class="card">
        <div class="hd"><h3>New Supply Order</h3></div>
        <div class="bd">
          <form id="supplyForm">
            <div class="field">
              <label>Vendor</label>
              <select id="sup_vendor">
                <option value="">Unassigned</option>
                ${vendors.map(v=>`<option value="${v.vendor_id}">${esc(v.vendor_name)}</option>`).join("")}
              </select>
            </div>
            <div class="field"><label>Notes</label><textarea id="sup_notes"></textarea></div>
            <div class="field"><label>Items *</label></div>
            <div class="line-items" id="supItems"></div>
            <button type="button" class="btn mini" id="supAddItem">+ Add Item</button>
            <div class="split" style="justify-content:flex-end;margin-top:12px;">
              <button class="btn primary" type="submit">Save Supply</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  const supItemsEl = document.getElementById("supItems");
  function addSupplyRow(itemId="", qty=1, cost=""){
    const row = document.createElement("div");
    row.className="li";
    row.innerHTML = `
      <div class="field">
        <label>Item *</label>
        <select class="li-item">
          <option value="">Select item</option>
          ${inventory.map(i=>`<option value="${i.item_id}" ${Number(itemId)===Number(i.item_id)?"selected":""}>${esc(i.item_name)}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>Qty *</label>
        <input type="number" class="li-qty" min="1" value="${qty}" />
      </div>
      <div class="field">
        <label>Cost *</label>
        <input type="number" class="li-price" min="0" step="0.01" value="${cost||""}" />
      </div>
      <button type="button" class="btn mini danger remove">✕</button>
    `;
    supItemsEl.appendChild(row);
    const select = row.querySelector(".li-item");
    const costInput = row.querySelector(".li-price");
    select.addEventListener("change",()=>{
      const it = invMap[Number(select.value)];
      if(it && !costInput.value){ costInput.value = it.unit_price ?? ""; }
    });
    row.querySelector(".remove").onclick = ()=>row.remove();
  }

  document.getElementById("supAddItem").onclick=()=>addSupplyRow();
  addSupplyRow();

  document.getElementById("supplyForm").onsubmit=async (e)=>{
    e.preventDefault();
    const vendor_id = safeInt(document.getElementById("sup_vendor").value,0) || null;
    const notes = document.getElementById("sup_notes").value.trim()||null;
    const items = [...supItemsEl.querySelectorAll(".li")].map(row=>{
      const item_id = safeInt(row.querySelector(".li-item").value,0);
      const quantity = safeInt(row.querySelector(".li-qty").value,0);
      const cost_price = safeFloat(row.querySelector(".li-price").value,0);
      return { item_id, quantity, cost_price, notes:null };
    }).filter(x=>x.item_id && x.quantity>0 && x.cost_price>0);
    if(!items.length){ toast("Error","Add at least one valid item"); return; }
    try{
      await apiFetch(`/supply`,{method:"POST",body:{vendor_id, notes, items}});
      toast("Saved","Supply order created");
      await loadInventory();
      await renderSupply();
    }catch(e2){ toast("Error", e2.message); }
  };

  viewEl.querySelectorAll('[data-act="del"]').forEach(b=>b.onclick=async ()=>{
    const id = safeInt(b.dataset.id,0); if(!id) return;
    if(!confirm("Delete this supply order?")) return;
    try{ await apiFetch(`/supply/${id}`,{method:"DELETE"}); toast("Deleted","Supply order removed"); await loadInventory(); await renderSupply(); }
    catch(e3){ toast("Error", e3.message); }
  });

  document.getElementById("refreshSupply").onclick=()=>renderSupply();
}

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

const exportBtn = document.getElementById("exportBtn");
if(exportBtn) exportBtn.onclick = exportWorkbook;

document.getElementById("globalSearch").addEventListener("input",(e)=>{
  if(currentView==="inventory") renderInventory(e.target.value||"");
});

(async function init(){
  await refreshHealth();
  await goto("dashboard");
})();
