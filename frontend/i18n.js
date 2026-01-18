// ==================================================================
// INTERNATIONALIZATION (i18n) - English & French
// ==================================================================

const translations = {
  en: {
    // Navigation
    nav_dashboard: "Dashboard",
    nav_inventory: "Inventory",
    nav_clients: "Clients",
    nav_vendors: "Vendors",
    nav_supply: "Supply Orders",
    nav_sales: "Sales",
    nav_reports: "Reports",

    // Brand
    brand_title: "Inventory System",
    brand_subtitle: "Supply • Sell • Manage",

    // Common buttons
    btn_add: "+ Add",
    btn_edit: "Edit",
    btn_delete: "Delete",
    btn_save: "Save",
    btn_cancel: "Cancel",
    btn_refresh: "Refresh",
    btn_export: "Export Excel",
    btn_remove: "Remove",

    // Dashboard
    dash_title: "Dashboard",
    dash_subtitle: "Overview at a glance",
    dash_total_value: "Total Inventory Value",
    dash_total_items: "Total Items in Stock",
    dash_low_stock: "Low Stock Alerts",
    dash_low_stock_title: "Low Stock Items",
    dash_low_stock_sub: "Items at or below reorder level",
    dash_activity_title: "Recent Activity",
    dash_activity_sub: "Latest transactions",
    dash_recent_sales: "Recent Sales",
    dash_recent_supply: "Recent Supply",
    dash_view_inventory: "View Inventory",
    dash_walk_in: "Walk-in",

    // Inventory
    inv_title: "Inventory",
    inv_subtitle: "Manage your products",
    inv_all_items: "All Items",
    inv_items_count: "items",
    inv_add_item: "+ Add Item",
    inv_edit_item: "Edit Item",
    inv_item_name: "Item Name",
    inv_description: "Description",
    inv_unit_price: "Unit Price",
    inv_reorder_level: "Reorder Level",
    inv_notes: "Notes",
    inv_quantity: "Qty",
    inv_price: "Price",
    inv_actions: "Actions",

    // Clients
    cli_title: "Clients",
    cli_subtitle: "Manage your customers",
    cli_clients_count: "clients",
    cli_add_client: "+ Add Client",
    cli_edit_client: "Edit Client",
    cli_name: "Name",
    cli_email: "Email",
    cli_phone: "Phone",
    cli_address: "Address",
    cli_notes: "Notes",

    // Vendors
    ven_title: "Vendors",
    ven_subtitle: "Manage your suppliers",
    ven_vendors_count: "vendors",
    ven_add_vendor: "+ Add Vendor",
    ven_edit_vendor: "Edit Vendor",
    ven_name: "Name",
    ven_email: "Email",
    ven_phone: "Phone",
    ven_address: "Address",
    ven_notes: "Notes",

    // Sales
    sal_title: "Sales",
    sal_subtitle: "Create sales",
    sal_records_count: "records",
    sal_sale: "Sale",
    sal_new_sale: "New Sale",
    sal_client: "Client",
    sal_walk_in: "Walk-in / none",
    sal_notes: "Notes",
    sal_items: "Items",
    sal_add_item: "+ Add Item",
    sal_save_sale: "Save Sale",
    sal_item: "Item",
    sal_select_item: "Select item",
    sal_qty: "Qty",
    sal_price: "Price",
    sal_date: "Date",
    sal_recent_items: "Recent line items",

    // Supply
    sup_title: "Supply Orders",
    sup_subtitle: "Receive stock",
    sup_records_count: "records",
    sup_order: "Order",
    sup_new_order: "New Supply Order",
    sup_vendor: "Vendor",
    sup_unassigned: "Unassigned",
    sup_notes: "Notes",
    sup_items: "Items",
    sup_add_item: "+ Add Item",
    sup_save_order: "Save Supply",
    sup_item: "Item",
    sup_select_item: "Select item",
    sup_qty: "Qty",
    sup_cost: "Cost",
    sup_date: "Date",
    sup_recent_items: "Recent items",

    // Reports
    rep_title: "Reports",
    rep_subtitle: "Analytics",
    rep_inventory: "Inventory",
    rep_transactions: "Transactions",
    rep_total_value: "Total Value",
    rep_total_units: "Total Units",
    rep_low_stock_count: "Low Stock Count",
    rep_sales_revenue: "Sales Revenue",
    rep_supply_cost: "Supply Cost",
    rep_gross_margin: "Gross Margin",

    // Messages
    msg_no_items: "No items",
    msg_no_clients: "No clients yet",
    msg_no_vendors: "No vendors yet",
    msg_no_sales: "No sales yet",
    msg_no_supply: "No supply orders yet",
    msg_no_low_stock: "No low stock alerts",
    msg_no_sale_items: "No sale items",
    msg_no_supply_items: "No supply items",
    msg_delete_confirm: "Delete this",
    msg_delete_item: "Delete this item?",
    msg_delete_client: "Delete this client?",
    msg_delete_vendor: "Delete this vendor?",
    msg_delete_sale: "Delete this sale?",
    msg_delete_supply: "Delete this supply order?",
    msg_name_required: "Name required",
    msg_price_required: "Name and valid price required",
    msg_add_valid_item: "Add at least one valid item",
    msg_api_unreachable: "API unreachable. Start the server.",
    msg_item_removed: "Item removed",
    msg_item_updated: "Item updated",
    msg_item_created: "Item created",
    msg_client_removed: "Client removed",
    msg_client_updated: "Client updated",
    msg_client_created: "Client created",
    msg_vendor_removed: "Vendor removed",
    msg_vendor_updated: "Vendor updated",
    msg_vendor_created: "Vendor created",
    msg_sale_created: "Sale created",
    msg_sale_removed: "Sale removed",
    msg_supply_created: "Supply order created",
    msg_supply_removed: "Supply order removed",
    msg_deleted: "Deleted",
    msg_saved: "Saved",
    msg_error: "Error",
    msg_exported: "Exported",
    msg_workbook_downloaded: "Workbook downloaded",
    msg_export_failed: "Export failed",
    msg_exporting: "Exporting...",
    msg_status: "Status",
    msg_language: "Language",

    // Status labels
    status_api_connected: "API Connected",
    status_api_ready: "API Ready",
    status_api_offline: "API Offline",

    // Field labels (with asterisks)
    field_required: "*",
    field_optional: "",

    // Placeholders
    ph_search: "Search inventory...",
    ph_item_name: "e.g., Coffee Beans 1kg",
    ph_description: "Optional description",
    ph_unit_price: "e.g., 12.50",
    ph_reorder: "e.g., 10",
    ph_notes: "Optional notes",
    ph_client_name: "e.g., Yann Cohen ©",
    ph_email: "yannco5@gmail.com",
    ph_phone: "+596 696 66 58 93",
    ph_address: "Street, City, Country",
    ph_vendor_name: "e.g., Yann Cohen ©",
  },

  fr: {
    // Navigation
    nav_dashboard: "Tableau de bord",
    nav_inventory: "Inventaire",
    nav_clients: "Clients",
    nav_vendors: "Fournisseurs",
    nav_supply: "Approvisionnements",
    nav_sales: "Ventes",
    nav_reports: "Rapports",

    // Brand
    brand_title: "Système d'inventaire",
    brand_subtitle: "Approvisionner • Vendre • Gérer",

    // Common buttons
    btn_add: "+ Ajouter",
    btn_edit: "Modifier",
    btn_delete: "Supprimer",
    btn_save: "Enregistrer",
    btn_cancel: "Annuler",
    btn_refresh: "Actualiser",
    btn_export: "Exporter Excel",
    btn_remove: "Retirer",

    // Dashboard
    dash_title: "Tableau de bord",
    dash_subtitle: "Vue d'ensemble",
    dash_total_value: "Valeur totale de l'inventaire",
    dash_total_items: "Total d'articles en stock",
    dash_low_stock: "Alertes de stock faible",
    dash_low_stock_title: "Articles à stock faible",
    dash_low_stock_sub: "Articles au ou sous le seuil de réapprovisionnement",
    dash_activity_title: "Activité récente",
    dash_activity_sub: "Dernières transactions",
    dash_recent_sales: "Ventes récentes",
    dash_recent_supply: "Approvisionnements récents",
    dash_view_inventory: "Voir l'inventaire",
    dash_walk_in: "Sans rendez-vous",

    // Inventory
    inv_title: "Inventaire",
    inv_subtitle: "Gérer vos produits",
    inv_all_items: "Tous les articles",
    inv_items_count: "articles",
    inv_add_item: "+ Ajouter un article",
    inv_edit_item: "Modifier l'article",
    inv_item_name: "Nom de l'article",
    inv_description: "Description",
    inv_unit_price: "Prix unitaire",
    inv_reorder_level: "Seuil de réapprovisionnement",
    inv_notes: "Notes",
    inv_quantity: "Qté",
    inv_price: "Prix",
    inv_actions: "Actions",

    // Clients
    cli_title: "Clients",
    cli_subtitle: "Gérer vos clients",
    cli_clients_count: "clients",
    cli_add_client: "+ Ajouter un client",
    cli_edit_client: "Modifier le client",
    cli_name: "Nom",
    cli_email: "Email",
    cli_phone: "Téléphone",
    cli_address: "Adresse",
    cli_notes: "Notes",

    // Vendors
    ven_title: "Fournisseurs",
    ven_subtitle: "Gérer vos fournisseurs",
    ven_vendors_count: "fournisseurs",
    ven_add_vendor: "+ Ajouter un fournisseur",
    ven_edit_vendor: "Modifier le fournisseur",
    ven_name: "Nom",
    ven_email: "Email",
    ven_phone: "Téléphone",
    ven_address: "Adresse",
    ven_notes: "Notes",

    // Sales
    sal_title: "Ventes",
    sal_subtitle: "Créer des ventes",
    sal_records_count: "enregistrements",
    sal_sale: "Vente",
    sal_new_sale: "Nouvelle vente",
    sal_client: "Client",
    sal_walk_in: "Sans rendez-vous / aucun",
    sal_notes: "Notes",
    sal_items: "Articles",
    sal_add_item: "+ Ajouter un article",
    sal_save_sale: "Enregistrer la vente",
    sal_item: "Article",
    sal_select_item: "Sélectionner un article",
    sal_qty: "Qté",
    sal_price: "Prix",
    sal_date: "Date",
    sal_recent_items: "Derniers articles",

    // Supply
    sup_title: "Approvisionnements",
    sup_subtitle: "Réceptionner le stock",
    sup_records_count: "enregistrements",
    sup_order: "Commande",
    sup_new_order: "Nouvel approvisionnement",
    sup_vendor: "Fournisseur",
    sup_unassigned: "Non assigné",
    sup_notes: "Notes",
    sup_items: "Articles",
    sup_add_item: "+ Ajouter un article",
    sup_save_order: "Enregistrer l'approvisionnement",
    sup_item: "Article",
    sup_select_item: "Sélectionner un article",
    sup_qty: "Qté",
    sup_cost: "Coût",
    sup_date: "Date",
    sup_recent_items: "Articles récents",

    // Reports
    rep_title: "Rapports",
    rep_subtitle: "Analyses",
    rep_inventory: "Inventaire",
    rep_transactions: "Transactions",
    rep_total_value: "Valeur totale",
    rep_total_units: "Total d'unités",
    rep_low_stock_count: "Nombre d'articles à stock faible",
    rep_sales_revenue: "Revenu des ventes",
    rep_supply_cost: "Coût d'approvisionnement",
    rep_gross_margin: "Marge brute",

    // Messages
    msg_no_items: "Aucun article",
    msg_no_clients: "Aucun client",
    msg_no_vendors: "Aucun fournisseur",
    msg_no_sales: "Aucune vente",
    msg_no_supply: "Aucun approvisionnement",
    msg_no_low_stock: "Aucune alerte de stock faible",
    msg_no_sale_items: "Aucun article de vente",
    msg_no_supply_items: "Aucun article d'approvisionnement",
    msg_delete_confirm: "Supprimer cet(te)",
    msg_delete_item: "Supprimer cet article ?",
    msg_delete_client: "Supprimer ce client ?",
    msg_delete_vendor: "Supprimer ce fournisseur ?",
    msg_delete_sale: "Supprimer cette vente ?",
    msg_delete_supply: "Supprimer cette commande ?",
    msg_name_required: "Nom requis",
    msg_price_required: "Nom et prix valide requis",
    msg_add_valid_item: "Ajouter au moins un article valide",
    msg_api_unreachable: "API inaccessible. Démarrez le serveur.",
    msg_item_removed: "Article supprimé",
    msg_item_updated: "Article mis à jour",
    msg_item_created: "Article créé",
    msg_client_removed: "Client supprimé",
    msg_client_updated: "Client mis à jour",
    msg_client_created: "Client créé",
    msg_vendor_removed: "Fournisseur supprimé",
    msg_vendor_updated: "Fournisseur mis à jour",
    msg_vendor_created: "Fournisseur créé",
    msg_sale_created: "Vente créée",
    msg_sale_removed: "Vente supprimée",
    msg_supply_created: "Approvisionnement créé",
    msg_supply_removed: "Approvisionnement supprimé",
    msg_deleted: "Supprimé",
    msg_saved: "Enregistré",
    msg_error: "Erreur",
    msg_exported: "Exporté",
    msg_workbook_downloaded: "Classeur téléchargé",
    msg_export_failed: "Échec de l'exportation",
    msg_exporting: "Exportation...",
    msg_status: "Statut",
    msg_language: "Langue",

    // Status labels
    status_api_connected: "API connectée",
    status_api_ready: "API prête",
    status_api_offline: "API hors ligne",


    // Field labels
    field_required: "*",
    field_optional: "",

    // Placeholders
    ph_search: "Rechercher dans l'inventaire...",
    ph_item_name: "ex., Yann Cohen ©",
    ph_description: "Description optionnelle",
    ph_unit_price: "ex., 12,50",
    ph_reorder: "ex., 10",
    ph_notes: "Notes optionnelles",
    ph_client_name: "ex., Café Central",
    ph_email: "yannco5@gmail.com",
    ph_phone: "+596 696 66 58 93",
    ph_address: "Rue, Ville, Pays",
    ph_vendor_name: "ex., Yann Cohen ©",
  }
};

// ==================================================================
// i18n SYSTEM
// ==================================================================

class I18n {
  constructor() {
    this.currentLang = localStorage.getItem('app_language') || 'en';
    this.translations = translations;
  }

  setLanguage(lang) {
    if (!this.translations[lang]) {
      console.warn(`Language ${lang} not found, falling back to English`);
      lang = 'en';
    }
    this.currentLang = lang;
    localStorage.setItem('app_language', lang);
  }

  t(key) {
    const translation = this.translations[this.currentLang][key];
    if (translation === undefined) {
      console.warn(`Translation missing for key: ${key} in language: ${this.currentLang}`);
      return this.translations['en'][key] || key;
    }
    return translation;
  }

  getCurrentLanguage() {
    return this.currentLang;
  }

  toggleLanguage() {
    const newLang = this.currentLang === 'en' ? 'fr' : 'en';
    this.setLanguage(newLang);
    return newLang;
  }
}

// Create global i18n instance
const i18n = new I18n();

// Shorthand function for translations
function t(key) {
  return i18n.t(key);
}
