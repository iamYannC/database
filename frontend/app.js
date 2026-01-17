

const API_BASE = (() => {
  if (location.protocol === "file:") return "http://localhost:3000/api";
  return `${location.origin}/api`;
})();

// ---- small utils
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c])); }
function money(n) { const x = Number(n || 0); return x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function safeInt(v, f = 0) { const n = parseInt(v, 10); return Number.isFinite(n) ? n : f; }
function safeFloat(v, f = 0) { const n = parseFloat(v); return Number.isFinite(n) ? n : f; }
function when(iso) { const d = new Date(iso); return Number.isNaN(d.getTime()) ? "" : d.toLocaleString(); }

// Language toggle functionality
function updateLanguage() {
  const lang = i18n.getCurrentLanguage();
  document.documentElement.lang = lang;
  const icon = document.getElementById("langIcon");
  if (icon) {
    if (lang === "en") {
      icon.innerHTML = `
        <rect width="20" height="14" x="0" fill="#0055A4" />
        <rect width="6.67" height="14" x="6.67" fill="#fff" />
        <rect width="6.67" height="14" x="13.33" fill="#EF4135" />
      `;
      icon.setAttribute("viewBox", "0 0 20 14");
    } else {
      icon.innerHTML = `
        <clipPath id="t">
          <path d="M0,0 v30 h60 v-30 z" />
        </clipPath>
        <clipPath id="s">
          <path d="M30,15 h30 v15 z M30,15 v15 h-30 z M30,15 h30 v-15 z M30,15 v-15 h-30 z" />
        </clipPath>
        <g clip-path="url(#t)">
          <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6" />
          <path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#s)" stroke="#c8102e" stroke-width="4" />
          <path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10" />
          <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" stroke-width="6" />
        </g>
      `;
      icon.setAttribute("viewBox", "0 0 60 30");
    }
  }

  const brandTitle = document.querySelector(".brand h1");
  const brandSubtitle = document.querySelector(".brand p");
  if (brandTitle) brandTitle.textContent = t("brand_title");
  if (brandSubtitle) brandSubtitle.textContent = t("brand_subtitle");

  const navIcons = {
    dashboard: "🏠",
    inventory: "📦",
    clients: "👥",
    vendors: "🏭",
    supply: "⬇️",
    sales: "⬆️",
    reports: "📈"
  };
  document.querySelectorAll("#nav button").forEach(btn => {
    const view = btn.dataset.view;
    const iconChar = navIcons[view] || "";
    btn.innerHTML = `<span class="icon">${iconChar}</span>${t(`nav_${view}`)}`;
  });

  const exportBtn = document.getElementById("exportBtn");
  if (exportBtn) {
    // FIX: Update the tooltip only. Do NOT touch textContent (preserves the SVG icon)
    exportBtn.title = t("btn_export");
  }
  const reconnectBtn = document.getElementById("reconnectBtn");
  if (reconnectBtn) reconnectBtn.textContent = t("btn_reconnect");
  const searchInput = document.getElementById("globalSearch");
  if (searchInput) searchInput.placeholder = t("ph_search");

  goto(currentView);
}

const toastEl = document.getElementById("toast");
function toast(title, msg) {
  document.getElementById("toastTitle").textContent = title;
  document.getElementById("toastMsg").textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2400);
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
    throw new Error(t("msg_api_unreachable"));
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

async function exportWorkbook() {
  const btn = document.getElementById("exportBtn");

  // FIX: Just disable the button. Do not overwrite the Icon with text.
  if (btn) { btn.disabled = true; }

  try {
    const res = await fetch(`${API_BASE}/export/xlsx`);
    if (!res.ok) throw new Error(`${t("msg_export_failed")} (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-export-${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast(t("msg_exported"), t("msg_workbook_downloaded"));
  } catch (e) {
    toast(t("msg_error"), e.message || t("msg_export_failed"));
  } finally {
    // FIX: Re-enable only.
    if (btn) { btn.disabled = false; }
  }
}

// ---- Status
async function refreshHealth() {
  const el = document.getElementById("dbStatus");
  const hint = document.getElementById("serverHint");
  if (hint) hint.textContent = API_BASE.replace("/api", "");
  try {
    const h = await apiFetch("/health");
    if (el) el.textContent = (h && h.database === "connected")
      ? t("status_api_connected")
      : t("status_api_ready");
  } catch (e) {
    if (el) el.textContent = t("status_api_offline");
  }
}

document.getElementById("reconnectBtn").onclick = async () => {
  await refreshHealth();
  toast(t("msg_status"), document.getElementById("dbStatus").textContent);
};

// ---- Views
const viewEl = document.getElementById("view");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

function setPage(t, s) { pageTitle.textContent = t; pageSubtitle.textContent = s || ""; }
function setActive(view) {
  document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("active", b.dataset.view === view));
}

const state = { inventory: [], clients: [], vendors: [], sales: [], saleDetails: [], supply: [], supplyDetails: [] };

async function loadInventory() { state.inventory = await apiFetch("/inventory"); return state.inventory; }
async function loadLowStock() { return await apiFetch("/inventory/low-stock"); }
async function loadClients() { state.clients = await apiFetch("/clients"); return state.clients; }
async function loadVendors() { state.vendors = await apiFetch("/vendors"); return state.vendors; }
async function loadSales() { state.sales = await apiFetch("/sales"); return state.sales; }
async function loadSaleDetails() { state.saleDetails = await apiFetch("/sales/details"); return state.saleDetails; }
async function loadSupply() { state.supply = await apiFetch("/supply"); return state.supply; }
async function loadSupplyDetails() { state.supplyDetails = await apiFetch("/supply/details"); return state.supplyDetails; }
async function loadReports() {
  try { return await apiFetch("/reports/dashboard"); }
  catch {
    const inv = await apiFetch("/reports/inventory");
    const tx = await apiFetch("/reports/transactions");
    return { inventory: inv, transactions: tx };
  }
}

async function renderDashboard() {
  setPage(t("dash_title"), t("dash_subtitle"));
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
        <div class="label">${t("dash_total_value")}</div>
        <div class="value">€${money(totalValue)}</div>
      </div>
      <div class="kpi">
        <div class="label">${t("dash_total_items")}</div>
        <div class="value">${safeInt(totalItems, 0)}</div>
      </div>
      <div class="kpi">
        <div class="label">${t("dash_low_stock")}</div>
        <div class="value">${low.length}</div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="hd">
          <div>
            <h3>${t("dash_low_stock_title")}</h3>
            <div class="sub">${t("dash_low_stock_sub")}</div>
          </div>
          <button class="btn mini primary" id="dashInvBtn">${t("dash_view_inventory")}</button>
        </div>
        <div class="bd">
          ${low.length ? `
            <table>
              <thead><tr><th>${t("sal_item")}</th><th>${t("sal_qty")}</th><th>${t("inv_reorder_level")}</th></tr></thead>
              <tbody>
                ${low.slice(0, 7).map(i => `
                  <tr>
                    <td><strong>${esc(i.item_name)}</strong></td>
                    <td class="muted">${esc(i.quantity)}</td>
                    <td class="muted">${esc(i.reorder_level)}</td>
                  </tr>`).join("")}
              </tbody>
            </table>` : `<div class="empty">${t("msg_no_low_stock")}</div>`}
        </div>
      </div>

      <div class="card">
        <div class="hd">
          <div>
            <h3>${t("dash_activity_title")}</h3>
            <div class="sub">${t("dash_activity_sub")}</div>
          </div>
        </div>
        <div class="bd">
          <div class="muted" style="font-size:12px;margin-bottom:6px;">${t("dash_recent_sales")}</div>
          ${sales.length ? `<div>${sales.slice(0, 5).map(s => `<div>${esc(s.client_name || t("dash_walk_in"))} • <span class="muted">${when(s.sale_date)}</span></div>`).join("")}</div>` : `<div class="empty">${t("msg_no_sales")}</div>`}
          <div class="hr"></div>
          <div class="muted" style="font-size:12px;margin-bottom:6px;">${t("dash_recent_supply")}</div>
          ${supply.length ? `<div>${supply.slice(0, 5).map(o => `<div>${esc(o.vendor_name || t("sup_unassigned"))} • <span class="muted">${when(o.order_date)}</span></div>`).join("")}</div>` : `<div class="empty">${t("msg_no_supply")}</div>`}
        </div>
      </div>
    </div>
  `;
  document.getElementById("dashInvBtn").onclick = () => goto("inventory");
}

async function renderInventory(filter = "") {
  setPage(t("inv_title"), t("inv_subtitle"));
  const inv = await loadInventory();
  const q = filter.trim().toLowerCase();
  const items = inv.filter(i => !q || String(i.item_name || "").toLowerCase().includes(q) || String(i.description || "").toLowerCase().includes(q));

  viewEl.innerHTML = `
    <div class="grid">
      <div class="card">
        <div class="hd">
          <div><h3>${t("inv_all_items")}</h3><div class="sub">${items.length} ${t("inv_items_count")}</div></div>
          <button class="btn primary mini" id="addItemBtn">${t("inv_add_item")}</button>
        </div>
        <div class="bd">
          ${items.length ? `
            <table>
              <thead><tr><th>${t("sal_item")}</th><th class="right">${t("inv_quantity")}</th><th class="right">${t("inv_price")}</th><th class="right">${t("inv_actions")}</th></tr></thead>
              <tbody>
                ${items.map(i => `
                  <tr>
                    <td><div style="font-weight:800">${esc(i.item_name)}</div><div class="muted" style="font-size:12px">${esc(i.description || "")}</div></td>
                    <td class="right muted">${esc(i.quantity)}</td>
                    <td class="right muted">€${money(i.unit_price)}</td>
                    <td class="right">
                      <div class="row-actions">
                        <button class="btn mini" data-act="edit" data-id="${i.item_id}">${t("btn_edit")}</button>
                        <button class="btn mini danger" data-act="del" data-id="${i.item_id}">${t("btn_delete")}</button>
                      </div>
                    </td>
                  </tr>`).join("")}
              </tbody>
            </table>` : `<div class="empty">${t("msg_no_items")}</div>`}
        </div>
      </div>

      <div class="card">
        <div class="hd"><h3 id="itemFormTitle">${t("inv_add_item")}</h3></div>
        <div class="bd">
          <form id="itemForm">
            <input type="hidden" id="if_id" />
            <div class="field"><label>${t("inv_item_name")} ${t("field_required")}</label><input id="if_name" required placeholder="${t("ph_item_name")}" /></div>
            <div class="field"><label>${t("inv_description")}</label><textarea id="if_desc" placeholder="${t("ph_description")}"></textarea></div>
            <div class="two-col">
              <div class="field"><label>${t("inv_unit_price")} ${t("field_required")}</label><input id="if_price" type="number" min="0" step="0.01" required placeholder="${t("ph_unit_price")}" /></div>
              <div class="field"><label>${t("inv_reorder_level")}</label><input id="if_reorder" type="number" min="0" step="1" placeholder="${t("ph_reorder")}" /></div>
            </div>
            <div class="field"><label>${t("inv_notes")}</label><input id="if_notes" placeholder="${t("ph_notes")}" /></div>
            <div class="split" style="justify-content:flex-end;margin-top:10px;">
              <button type="button" class="btn ghost" id="if_cancel" style="display:none;">${t("btn_cancel")}</button>
              <button class="btn primary" type="submit">${t("btn_save")}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  function resetForm() {
    document.getElementById("itemFormTitle").textContent = t("inv_add_item");
    document.getElementById("if_id").value = "";
    document.getElementById("if_name").value = "";
    document.getElementById("if_desc").value = "";
    document.getElementById("if_price").value = "";
    document.getElementById("if_reorder").value = "10";
    document.getElementById("if_notes").value = "";
    document.getElementById("if_cancel").style.display = "none";
  }

  function loadForm(id) {
    const it = state.inventory.find(x => Number(x.item_id) === Number(id));
    if (!it) return;
    document.getElementById("itemFormTitle").textContent = t("inv_edit_item");
    document.getElementById("if_id").value = it.item_id;
    document.getElementById("if_name").value = it.item_name || "";
    document.getElementById("if_desc").value = it.description || "";
    document.getElementById("if_price").value = it.unit_price ?? "";
    document.getElementById("if_reorder").value = it.reorder_level ?? 10;
    document.getElementById("if_notes").value = it.notes || "";
    document.getElementById("if_cancel").style.display = "inline-flex";
  }

  document.getElementById("addItemBtn").onclick = resetForm;
  document.getElementById("if_cancel").onclick = resetForm;

  viewEl.querySelectorAll('[data-act="edit"]').forEach(b => b.onclick = () => loadForm(b.dataset.id));
  viewEl.querySelectorAll('[data-act="del"]').forEach(b => b.onclick = async () => {
    const id = safeInt(b.dataset.id, 0); if (!id) return;
    if (!confirm(t("msg_delete_item"))) return;
    try { await apiFetch(`/inventory/${id}`, { method: "DELETE" }); toast(t("msg_deleted"), t("msg_item_removed")); await renderInventory(document.getElementById("globalSearch").value); }
    catch (e) { toast(t("msg_error"), e.message); }
  });

  document.getElementById("itemForm").onsubmit = async (e) => {
    e.preventDefault();
    const id = safeInt(document.getElementById("if_id").value, 0);
    const item_name = document.getElementById("if_name").value.trim();
    const description = document.getElementById("if_desc").value.trim() || null;
    const unit_price = safeFloat(document.getElementById("if_price").value, 0);
    const reorder_level = safeInt(document.getElementById("if_reorder").value, 10);
    const notes = document.getElementById("if_notes").value.trim() || null;

    if (!item_name || unit_price <= 0) { toast(t("msg_error"), t("msg_price_required")); return; }

    try {
      if (id) {
        await apiFetch(`/inventory/${id}`, { method: "PUT", body: { item_name, description, unit_price, reorder_level, notes } });
        toast(t("msg_saved"), t("msg_item_updated"));
      } else {
        await apiFetch(`/inventory`, { method: "POST", body: { item_name, description, quantity: 0, unit_price, reorder_level, notes } });
        toast(t("msg_saved"), t("msg_item_created"));
      }
      await renderInventory(document.getElementById("globalSearch").value);
      setTimeout(resetForm, 50);
    } catch (e2) { toast(t("msg_error"), e2.message); }
  };

  resetForm();
}

async function renderClients() {
  setPage(t("cli_title"), t("cli_subtitle"));
  const clients = await loadClients();
  viewEl.innerHTML = `
    <div class="grid">
      <div class="card">
        <div class="hd">
          <div><h3>${t("cli_title")}</h3><div class="sub">${clients.length} ${t("cli_clients_count")}</div></div>
          <button class="btn mini" id="refreshClients">${t("btn_refresh")}</button>
        </div>
        <div class="bd">
          ${clients.length ? `
            <table>
              <thead><tr><th>${t("cli_name")}</th><th>${t("cli_email")}</th><th>${t("cli_phone")}</th><th class="right">${t("inv_actions")}</th></tr></thead>
              <tbody>
                ${clients.map(c => `
                  <tr>
                    <td><strong>${esc(c.client_name)}</strong><div class="muted" style="font-size:12px">${esc(c.address || "")}</div></td>
                    <td class="muted">${esc(c.email || "")}</td>
                    <td class="muted">${esc(c.phone || "")}</td>
                    <td class="right">
                      <div class="row-actions">
                        <button class="btn mini" data-act="edit" data-id="${c.client_id}">${t("btn_edit")}</button>
                        <button class="btn mini danger" data-act="del" data-id="${c.client_id}">${t("btn_delete")}</button>
                      </div>
                    </td>
                  </tr>`).join("")}
              </tbody>
            </table>` : `<div class="empty">${t("msg_no_clients")}</div>`}
        </div>
      </div>

      <div class="card">
        <div class="hd"><h3 id="clientFormTitle">${t("cli_add_client")}</h3></div>
        <div class="bd">
          <form id="clientForm">
            <input type="hidden" id="cf_id" />
            <div class="field"><label>${t("cli_name")} ${t("field_required")}</label><input id="cf_name" required placeholder="${t("ph_client_name")}" /></div>
            <div class="field"><label>${t("cli_email")}</label><input id="cf_email" type="email" placeholder="${t("ph_email")}" /></div>
            <div class="two-col">
              <div class="field"><label>${t("cli_phone")}</label><input id="cf_phone" placeholder="${t("ph_phone")}" /></div>
              <div class="field"><label>${t("cli_address")}</label><input id="cf_addr" placeholder="${t("ph_address")}" /></div>
            </div>
            <div class="field"><label>${t("cli_notes")}</label><textarea id="cf_notes" placeholder="${t("ph_notes")}"></textarea></div>
            <div class="split" style="justify-content:flex-end;margin-top:10px;">
              <button type="button" class="btn ghost" id="cf_cancel" style="display:none;">${t("btn_cancel")}</button>
              <button class="btn primary" type="submit">${t("btn_save")}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  function resetForm() {
    document.getElementById("clientFormTitle").textContent = t("cli_add_client");
    document.getElementById("cf_id").value = "";
    document.getElementById("cf_name").value = "";
    document.getElementById("cf_email").value = "";
    document.getElementById("cf_phone").value = "";
    document.getElementById("cf_addr").value = "";
    document.getElementById("cf_notes").value = "";
    document.getElementById("cf_cancel").style.display = "none";
  }
  function loadForm(id) {
    const c = state.clients.find(x => Number(x.client_id) === Number(id));
    if (!c) return;
    document.getElementById("clientFormTitle").textContent = t("cli_edit_client");
    document.getElementById("cf_id").value = c.client_id;
    document.getElementById("cf_name").value = c.client_name || "";
    document.getElementById("cf_email").value = c.email || "";
    document.getElementById("cf_phone").value = c.phone || "";
    document.getElementById("cf_addr").value = c.address || "";
    document.getElementById("cf_notes").value = c.notes || "";
    document.getElementById("cf_cancel").style.display = "inline-flex";
  }

  document.getElementById("refreshClients").onclick = () => renderClients();
  document.getElementById("cf_cancel").onclick = resetForm;

  document.getElementById("clientForm").onsubmit = async (e) => {
    e.preventDefault();
    const id = safeInt(document.getElementById("cf_id").value, 0);
    const client_name = document.getElementById("cf_name").value.trim();
    const email = document.getElementById("cf_email").value.trim() || null;
    const phone = document.getElementById("cf_phone").value.trim() || null;
    const address = document.getElementById("cf_addr").value.trim() || null;
    const notes = document.getElementById("cf_notes").value.trim() || null;
    if (!client_name) { toast(t("msg_error"), t("msg_name_required")); return; }
    try {
      if (id) { await apiFetch(`/clients/${id}`, { method: "PUT", body: { client_name, email, phone, address, notes } }); toast(t("msg_saved"), t("msg_client_updated")); }
      else { await apiFetch(`/clients`, { method: "POST", body: { client_name, email, phone, address, notes } }); toast(t("msg_saved"), t("msg_client_created")); }
      await renderClients();
    } catch (e2) { toast(t("msg_error"), e2.message); }
  };

  viewEl.querySelectorAll('[data-act="edit"]').forEach(b => b.onclick = () => loadForm(b.dataset.id));
  viewEl.querySelectorAll('[data-act="del"]').forEach(b => b.onclick = async () => {
    const id = safeInt(b.dataset.id, 0); if (!id) return;
    if (!confirm(t("msg_delete_client"))) return;
    try { await apiFetch(`/clients/${id}`, { method: "DELETE" }); toast(t("msg_deleted"), t("msg_client_removed")); await renderClients(); }
    catch (e3) { toast(t("msg_error"), e3.message); }
  });

  resetForm();
}

async function renderVendors() {
  setPage(t("ven_title"), t("ven_subtitle"));
  const vendors = await loadVendors();
  viewEl.innerHTML = `
    <div class="grid">
      <div class="card">
        <div class="hd">
          <div><h3>${t("ven_title")}</h3><div class="sub">${vendors.length} ${t("ven_vendors_count")}</div></div>
          <button class="btn mini" id="refreshVendors">${t("btn_refresh")}</button>
        </div>
        <div class="bd">
          ${vendors.length ? `
            <table>
              <thead><tr><th>${t("ven_name")}</th><th>${t("ven_email")}</th><th>${t("ven_phone")}</th><th class="right">${t("inv_actions")}</th></tr></thead>
              <tbody>
                ${vendors.map(v => `
                  <tr>
                    <td><strong>${esc(v.vendor_name)}</strong><div class="muted" style="font-size:12px">${esc(v.address || "")}</div></td>
                    <td class="muted">${esc(v.email || "")}</td>
                    <td class="muted">${esc(v.phone || "")}</td>
                    <td class="right">
                      <div class="row-actions">
                        <button class="btn mini" data-act="edit" data-id="${v.vendor_id}">${t("btn_edit")}</button>
                        <button class="btn mini danger" data-act="del" data-id="${v.vendor_id}">${t("btn_delete")}</button>
                      </div>
                    </td>
                  </tr>`).join("")}
              </tbody>
            </table>` : `<div class="empty">${t("msg_no_vendors")}</div>`}
        </div>
      </div>

      <div class="card">
        <div class="hd"><h3 id="vendorFormTitle">${t("ven_add_vendor")}</h3></div>
        <div class="bd">
          <form id="vendorForm">
            <input type="hidden" id="vf_id" />
            <div class="field"><label>${t("ven_name")} ${t("field_required")}</label><input id="vf_name" required placeholder="${t("ph_vendor_name")}" /></div>
            <div class="field"><label>${t("ven_email")}</label><input id="vf_email" type="email" placeholder="${t("ph_email")}" /></div>
            <div class="two-col">
              <div class="field"><label>${t("ven_phone")}</label><input id="vf_phone" placeholder="${t("ph_phone")}" /></div>
              <div class="field"><label>${t("ven_address")}</label><input id="vf_addr" placeholder="${t("ph_address")}" /></div>
            </div>
            <div class="field"><label>${t("ven_notes")}</label><textarea id="vf_notes" placeholder="${t("ph_notes")}"></textarea></div>
            <div class="split" style="justify-content:flex-end;margin-top:10px;">
              <button type="button" class="btn ghost" id="vf_cancel" style="display:none;">${t("btn_cancel")}</button>
              <button class="btn primary" type="submit">${t("btn_save")}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  function resetForm() {
    document.getElementById("vendorFormTitle").textContent = t("ven_add_vendor");
    document.getElementById("vf_id").value = "";
    document.getElementById("vf_name").value = "";
    document.getElementById("vf_email").value = "";
    document.getElementById("vf_phone").value = "";
    document.getElementById("vf_addr").value = "";
    document.getElementById("vf_notes").value = "";
    document.getElementById("vf_cancel").style.display = "none";
  }
  function loadForm(id) {
    const v = state.vendors.find(x => Number(x.vendor_id) === Number(id));
    if (!v) return;
    document.getElementById("vendorFormTitle").textContent = t("ven_edit_vendor");
    document.getElementById("vf_id").value = v.vendor_id;
    document.getElementById("vf_name").value = v.vendor_name || "";
    document.getElementById("vf_email").value = v.email || "";
    document.getElementById("vf_phone").value = v.phone || "";
    document.getElementById("vf_addr").value = v.address || "";
    document.getElementById("vf_notes").value = v.notes || "";
    document.getElementById("vf_cancel").style.display = "inline-flex";
  }

  document.getElementById("refreshVendors").onclick = () => renderVendors();
  document.getElementById("vf_cancel").onclick = resetForm;

  document.getElementById("vendorForm").onsubmit = async (e) => {
    e.preventDefault();
    const id = safeInt(document.getElementById("vf_id").value, 0);
    const vendor_name = document.getElementById("vf_name").value.trim();
    const email = document.getElementById("vf_email").value.trim() || null;
    const phone = document.getElementById("vf_phone").value.trim() || null;
    const address = document.getElementById("vf_addr").value.trim() || null;
    const notes = document.getElementById("vf_notes").value.trim() || null;
    if (!vendor_name) { toast(t("msg_error"), t("msg_name_required")); return; }
    try {
      if (id) { await apiFetch(`/vendors/${id}`, { method: "PUT", body: { vendor_name, email, phone, address, notes } }); toast(t("msg_saved"), t("msg_vendor_updated")); }
      else { await apiFetch(`/vendors`, { method: "POST", body: { vendor_name, email, phone, address, notes } }); toast(t("msg_saved"), t("msg_vendor_created")); }
      await renderVendors();
    } catch (e2) { toast(t("msg_error"), e2.message); }
  };

  viewEl.querySelectorAll('[data-act="edit"]').forEach(b => b.onclick = () => loadForm(b.dataset.id));
  viewEl.querySelectorAll('[data-act="del"]').forEach(b => b.onclick = async () => {
    const id = safeInt(b.dataset.id, 0); if (!id) return;
    if (!confirm(t("msg_delete_vendor"))) return;
    try { await apiFetch(`/vendors/${id}`, { method: "DELETE" }); toast(t("msg_deleted"), t("msg_vendor_removed")); await renderVendors(); }
    catch (e3) { toast(t("msg_error"), e3.message); }
  });

  resetForm();
}

async function renderSales() {
  setPage(t("sal_title"), t("sal_subtitle"));
  const [sales, saleDetails, clients, inventory] = await Promise.all([
    loadSales(),
    loadSaleDetails(),
    loadClients(),
    loadInventory()
  ]);
  const invMap = Object.fromEntries(inventory.map(i => [i.item_id, i]));
  viewEl.innerHTML = `
    <div class="grid">
      <div class="card">
        <div class="hd">
          <div><h3>${t("sal_title")}</h3><div class="sub">${sales.length} ${t("sal_records_count")}</div></div>
          <button class="btn mini" id="refreshSales">${t("btn_refresh")}</button>
        </div>
        <div class="bd">
          ${sales.length ? `
            <table>
              <thead><tr><th>${t("sal_sale")}</th><th>${t("sal_client")}</th><th>${t("sal_date")}</th><th class="right">${t("inv_actions")}</th></tr></thead>
              <tbody>
                ${sales.map(s => `
                  <tr>
                    <td><strong>#${esc(s.sale_id)}</strong><div class="muted" style="font-size:12px">${esc(s.sale_notes || "")}</div></td>
                    <td class="muted">${esc(s.client_name || t("sal_walk_in"))}</td>
                    <td class="muted">${when(s.sale_date)}</td>
                    <td class="right">
                      <div class="row-actions">
                        <button class="btn mini danger" data-act="del" data-id="${s.sale_id}">${t("btn_delete")}</button>
                      </div>
                    </td>
                  </tr>`).join("")}
              </tbody>
            </table>` : `<div class="empty">${t("msg_no_sales")}</div>`}
          <div class="hr"></div>
          <div class="muted" style="font-size:12px;margin-bottom:6px;">${t("sal_recent_items")}</div>
          ${saleDetails.length ? `
            <table>
              <thead><tr><th>${t("sal_item")}</th><th>${t("sal_qty")}</th><th>${t("sal_price")}</th><th>${t("sal_client")}</th></tr></thead>
              <tbody>
                ${saleDetails.slice(0, 6).map(d => `
                  <tr>
                    <td>${esc(d.item_name)}</td>
                    <td class="muted">${esc(d.quantity)}</td>
                    <td class="muted">€${money(d.unit_price)}</td>
                    <td class="muted">${esc(d.client_name || t("sal_walk_in"))}</td>
                  </tr>`).join("")}
              </tbody>
            </table>` : `<div class="empty">${t("msg_no_sale_items")}</div>`}
        </div>
      </div>

      <div class="card">
        <div class="hd"><h3>${t("sal_new_sale")}</h3></div>
        <div class="bd">
          <form id="saleForm">
            <div class="field">
              <label>${t("sal_client")}</label>
              <select id="sale_client">
                <option value="">${t("sal_walk_in")}</option>
                ${clients.map(c => `<option value="${c.client_id}">${esc(c.client_name)}</option>`).join("")}
              </select>
            </div>
            <div class="field"><label>${t("sal_notes")}</label><textarea id="sale_notes" placeholder="${t("ph_notes")}"></textarea></div>
            <div class="field"><label>${t("sal_items")} ${t("field_required")}</label></div>
            <div class="line-items" id="saleItems"></div>
            <button type="button" class="btn mini" id="saleAddItem">${t("sal_add_item")}</button>
            <div class="split" style="justify-content:flex-end;margin-top:12px;">
              <button class="btn primary" type="submit">${t("sal_save_sale")}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  const saleItemsEl = document.getElementById("saleItems");
  function addSaleRow(itemId = "", qty = 1, price = "") {
    const row = document.createElement("div");
    row.className = "li";
    row.innerHTML = `
      <div class="field">
        <label>${t("sal_item")} ${t("field_required")}</label>
        <select class="li-item">
          <option value="">${t("sal_select_item")}</option>
          ${inventory.map(i => `<option value="${i.item_id}" ${Number(itemId) === Number(i.item_id) ? "selected" : ""}>${esc(i.item_name)}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>${t("sal_qty")} ${t("field_required")}</label>
        <input type="number" class="li-qty" min="1" value="${qty}" />
      </div>
      <div class="field">
        <label>${t("sal_price")} ${t("field_required")}</label>
        <input type="number" class="li-price" min="0" step="0.01" value="${price || ""}" />
      </div>
      <button type="button" class="btn mini danger remove">✕</button>
    `;
    saleItemsEl.appendChild(row);
    const select = row.querySelector(".li-item");
    const priceInput = row.querySelector(".li-price");
    select.addEventListener("change", () => {
      const it = invMap[Number(select.value)];
      if (it && !priceInput.value) { priceInput.value = it.unit_price ?? ""; }
    });
    row.querySelector(".remove").onclick = () => row.remove();
  }

  document.getElementById("saleAddItem").onclick = () => addSaleRow();
  addSaleRow();

  document.getElementById("saleForm").onsubmit = async (e) => {
    e.preventDefault();
    const client_id = safeInt(document.getElementById("sale_client").value, 0) || null;
    const notes = document.getElementById("sale_notes").value.trim() || null;
    const items = [...saleItemsEl.querySelectorAll(".li")].map(row => {
      const item_id = safeInt(row.querySelector(".li-item").value, 0);
      const quantity = safeInt(row.querySelector(".li-qty").value, 0);
      const unit_price = safeFloat(row.querySelector(".li-price").value, 0);
      return { item_id, quantity, unit_price, notes: null };
    }).filter(x => x.item_id && x.quantity > 0 && x.unit_price > 0);
    if (!items.length) { toast(t("msg_error"), t("msg_add_valid_item")); return; }
    try {
      await apiFetch(`/sales`, { method: "POST", body: { client_id, notes, items } });
      toast(t("msg_saved"), t("msg_sale_created"));
      await loadInventory();
      await renderSales();
    } catch (e2) { toast(t("msg_error"), e2.message); }
  };

  viewEl.querySelectorAll('[data-act="del"]').forEach(b => b.onclick = async () => {
    const id = safeInt(b.dataset.id, 0); if (!id) return;
    if (!confirm(t("msg_delete_sale"))) return;
    try { await apiFetch(`/sales/${id}`, { method: "DELETE" }); toast(t("msg_deleted"), t("msg_sale_removed")); await loadInventory(); await renderSales(); }
    catch (e3) { toast(t("msg_error"), e3.message); }
  });

  document.getElementById("refreshSales").onclick = () => renderSales();
}

async function renderSupply() {
  setPage(t("sup_title"), t("sup_subtitle"));
  const [orders, supplyDetails, vendors, inventory] = await Promise.all([
    loadSupply(),
    loadSupplyDetails(),
    loadVendors(),
    loadInventory()
  ]);
  const invMap = Object.fromEntries(inventory.map(i => [i.item_id, i]));

  viewEl.innerHTML = `
    <div class="grid">
      <div class="card">
        <div class="hd">
          <div><h3>${t("sup_title")}</h3><div class="sub">${orders.length} ${t("sup_records_count")}</div></div>
          <button class="btn mini" id="refreshSupply">${t("btn_refresh")}</button>
        </div>
        <div class="bd">
          ${orders.length ? `
            <table>
              <thead><tr><th>${t("sup_order")}</th><th>${t("sup_vendor")}</th><th>${t("sup_date")}</th><th class="right">${t("inv_actions")}</th></tr></thead>
              <tbody>
                ${orders.map(o => `
                  <tr>
                    <td><strong>#${esc(o.supply_order_id)}</strong><div class="muted" style="font-size:12px">${esc(o.order_notes || "")}</div></td>
                    <td class="muted">${esc(o.vendor_name || t("sup_unassigned"))}</td>
                    <td class="muted">${when(o.order_date)}</td>
                    <td class="right">
                      <div class="row-actions">
                        <button class="btn mini danger" data-act="del" data-id="${o.supply_order_id}">${t("btn_delete")}</button>
                      </div>
                    </td>
                  </tr>`).join("")}
              </tbody>
            </table>` : `<div class="empty">${t("msg_no_supply")}</div>`}
          <div class="hr"></div>
          <div class="muted" style="font-size:12px;margin-bottom:6px;">${t("sup_recent_items")}</div>
          ${supplyDetails.length ? `
            <table>
              <thead><tr><th>${t("sup_item")}</th><th>${t("sup_qty")}</th><th>${t("sup_cost")}</th><th>${t("sup_vendor")}</th></tr></thead>
              <tbody>
                ${supplyDetails.slice(0, 6).map(d => `
                  <tr>
                    <td>${esc(d.item_name)}</td>
                    <td class="muted">${esc(d.quantity)}</td>
                    <td class="muted">€${money(d.cost_price)}</td>
                    <td class="muted">${esc(d.vendor_name || t("sup_unassigned"))}</td>
                  </tr>`).join("")}
              </tbody>
            </table>` : `<div class="empty">${t("msg_no_supply_items")}</div>`}
        </div>
      </div>

      <div class="card">
        <div class="hd"><h3>${t("sup_new_order")}</h3></div>
        <div class="bd">
          <form id="supplyForm">
            <div class="field">
              <label>${t("sup_vendor")}</label>
              <select id="sup_vendor">
                <option value="">${t("sup_unassigned")}</option>
                ${vendors.map(v => `<option value="${v.vendor_id}">${esc(v.vendor_name)}</option>`).join("")}
              </select>
            </div>
            <div class="field"><label>${t("sup_notes")}</label><textarea id="sup_notes" placeholder="${t("ph_notes")}"></textarea></div>
            <div class="field"><label>${t("sup_items")} ${t("field_required")}</label></div>
            <div class="line-items" id="supItems"></div>
            <button type="button" class="btn mini" id="supAddItem">${t("sup_add_item")}</button>
            <div class="split" style="justify-content:flex-end;margin-top:12px;">
              <button class="btn primary" type="submit">${t("sup_save_order")}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  const supItemsEl = document.getElementById("supItems");
  function addSupplyRow(itemId = "", qty = 1, cost = "") {
    const row = document.createElement("div");
    row.className = "li";
    row.innerHTML = `
      <div class="field">
        <label>${t("sup_item")} ${t("field_required")}</label>
        <select class="li-item">
          <option value="">${t("sup_select_item")}</option>
          ${inventory.map(i => `<option value="${i.item_id}" ${Number(itemId) === Number(i.item_id) ? "selected" : ""}>${esc(i.item_name)}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>${t("sup_qty")} ${t("field_required")}</label>
        <input type="number" class="li-qty" min="1" value="${qty}" />
      </div>
      <div class="field">
        <label>${t("sup_cost")} ${t("field_required")}</label>
        <input type="number" class="li-price" min="0" step="0.01" value="${cost || ""}" />
      </div>
      <button type="button" class="btn mini danger remove">✕</button>
    `;
    supItemsEl.appendChild(row);
    const select = row.querySelector(".li-item");
    const costInput = row.querySelector(".li-price");
    select.addEventListener("change", () => {
      const it = invMap[Number(select.value)];
      if (it && !costInput.value) { costInput.value = it.unit_price ?? ""; }
    });
    row.querySelector(".remove").onclick = () => row.remove();
  }

  document.getElementById("supAddItem").onclick = () => addSupplyRow();
  addSupplyRow();

  document.getElementById("supplyForm").onsubmit = async (e) => {
    e.preventDefault();
    const vendor_id = safeInt(document.getElementById("sup_vendor").value, 0) || null;
    const notes = document.getElementById("sup_notes").value.trim() || null;
    const items = [...supItemsEl.querySelectorAll(".li")].map(row => {
      const item_id = safeInt(row.querySelector(".li-item").value, 0);
      const quantity = safeInt(row.querySelector(".li-qty").value, 0);
      const cost_price = safeFloat(row.querySelector(".li-price").value, 0);
      return { item_id, quantity, cost_price, notes: null };
    }).filter(x => x.item_id && x.quantity > 0 && x.cost_price > 0);
    if (!items.length) { toast(t("msg_error"), t("msg_add_valid_item")); return; }
    try {
      await apiFetch(`/supply`, { method: "POST", body: { vendor_id, notes, items } });
      toast(t("msg_saved"), t("msg_supply_created"));
      await loadInventory();
      await renderSupply();
    } catch (e2) { toast(t("msg_error"), e2.message); }
  };

  viewEl.querySelectorAll('[data-act="del"]').forEach(b => b.onclick = async () => {
    const id = safeInt(b.dataset.id, 0); if (!id) return;
    if (!confirm(t("msg_delete_supply"))) return;
    try { await apiFetch(`/supply/${id}`, { method: "DELETE" }); toast(t("msg_deleted"), t("msg_supply_removed")); await loadInventory(); await renderSupply(); }
    catch (e3) { toast(t("msg_error"), e3.message); }
  });

  document.getElementById("refreshSupply").onclick = () => renderSupply();
}

async function renderReports() {
  setPage(t("rep_title"), t("rep_subtitle"));
  const r = await loadReports();
  const inv = r.inventory || r;
  const tx = r.transactions || r;
  viewEl.innerHTML = `
    <div class="grid">
      <div class="card">
        <div class="hd"><h3>${t("rep_inventory")}</h3></div>
        <div class="bd">
          <div>${t("rep_total_value")}: <strong>€${money(Number(inv.total_value || 0))}</strong></div>
          <div class="muted">${t("rep_total_units")}: ${safeInt(inv.total_items || 0, 0)}</div>
          <div class="muted">${t("rep_low_stock_count")}: ${safeInt(inv.low_stock_count || 0, 0)}</div>
        </div>
      </div>
      <div class="card">
        <div class="hd"><h3>${t("rep_transactions")}</h3></div>
        <div class="bd">
          <div>${t("rep_sales_revenue")}: <strong>€${money(Number(tx.sales_revenue || 0))}</strong></div>
          <div>${t("rep_supply_cost")}: <strong>€${money(Number(tx.supply_cost || 0))}</strong></div>
          <div class="muted">${t("rep_gross_margin")}: €${money(Number(tx.gross_margin ?? ((tx.sales_revenue || 0) - (tx.supply_cost || 0))))}</div>
        </div>
      </div>
    </div>
  `;
}

let currentView = "dashboard";
async function goto(view) {
  currentView = view;
  setActive(view);
  const searchVal = document.getElementById("globalSearch").value || "";
  try {
    if (view === "dashboard") await renderDashboard();
    else if (view === "inventory") await renderInventory(searchVal);
    else if (view === "clients") await renderClients();
    else if (view === "vendors") await renderVendors();
    else if (view === "supply") await renderSupply();
    else if (view === "sales") await renderSales();
    else if (view === "reports") await renderReports();
  } catch (e) {
    toast(t("msg_error"), e.message);
    viewEl.innerHTML = `<div class="empty">${esc(e.message)}</div>`;
  }
}

document.getElementById("nav").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-view]");
  if (!btn) return;
  goto(btn.dataset.view);
});

const exportBtn = document.getElementById("exportBtn");
if (exportBtn) exportBtn.onclick = exportWorkbook;

document.getElementById("globalSearch").addEventListener("input", (e) => {
  if (currentView === "inventory") renderInventory(e.target.value || "");
});

(async function init() {
  await refreshHealth();
  const langToggle = document.getElementById("langToggle");
  if (langToggle) {
    langToggle.addEventListener("click", () => {
      i18n.toggleLanguage();
      updateLanguage();
      toast(t("msg_saved"), `${t("msg_language")}: ${i18n.getCurrentLanguage().toUpperCase()}`);
    });
  }

  updateLanguage();
})();
