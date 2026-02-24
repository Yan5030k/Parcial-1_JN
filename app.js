// ==========================
//   "Base de datos" local (LocalStorage)
// ==========================
const Storage = {
  keyData: "concesionaria_db_v3",

  load() {
    try {
      const raw = localStorage.getItem(this.keyData);
      if (!raw) return { cars: [], sales: [] };
      return JSON.parse(raw);
    } catch (e) {
      console.error("Error al cargar la BD:", e);
      return { cars: [], sales: [] };
    }
  },

  save(data) {
    try {
      localStorage.setItem(this.keyData, JSON.stringify(data));
    } catch (e) {
      console.error("Error al guardar en la BD:", e);
      alert("Error crítico: No se pudo guardar en la base de datos local.");
    }
  },

  ensureSeed() {
    const data = this.load();
    if (data.cars.length > 0) return;

    const seedCars = [
      {
        id: crypto.randomUUID(),
        marca: "Toyota",
        modelo: "Corolla",
        anio: 2020,
        precio: 13500,
        combustible: "Gasolina",
        transmision: "Automática",
        stock: 2,
        vendidas: 0
      }
    ];
    this.save({ cars: seedCars, sales: [] });
  }
};

// ==========================
//   Utilidades / Validación
// ==========================
function toInt(value) {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : NaN;
}

function toFloat(value) {
  const n = Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : NaN;
}

function formatMoney(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "$0.00";
  return num.toLocaleString("es-SV", { style: "currency", currency: "USD" });
}

// ==========================
//   WebComponent: AdminPanel
// ==========================
class AdminPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    Storage.ensureSeed();
    const db = Storage.load();
    this.cars = db.cars || [];
    this.sales = db.sales || [];
    this.lastMessageTimer = null;
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
    this.refreshUI();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host{ width: 100%; max-width: 1100px; display: block; }
        .wrap{ background: #ffffff; border: 1px solid #eaeaea; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,.06); overflow: hidden; }
        .topbar{ padding: 18px 18px 14px 18px; border-bottom: 1px solid #eaeaea; display: flex; flex-wrap: wrap; gap: 10px 16px; align-items: flex-end; justify-content: space-between; }
        .title{ display: flex; flex-direction: column; gap: 6px; }
        .title h1{ font-size: 22px; color: #111827; font-weight: 800; margin:0;}
        .title p{ font-size: 13px; color: #6b7280; line-height: 1.35; max-width: 780px; margin:0;}
        .stats{ display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
        .chip{ border: 1px solid #eaeaea; border-radius: 999px; padding: 8px 12px; font-size: 13px; color: #111827; background: #fafafa; white-space: nowrap; font-weight: bold;}
        .content{ padding: 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 980px){ .content{ grid-template-columns: 1fr; } }
        .card{ border: 1px solid #eaeaea; border-radius: 14px; padding: 14px; background: #ffffff; }
        .card h2{ font-size: 16px; color: #0c1b98; font-weight: 800; margin-top:0; margin-bottom: 10px; }
        .row{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
        @media (max-width: 520px){ .row{ grid-template-columns: 1fr; } }
        label{ display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #374151; font-weight: 700; }
        input, select{ border: 1px solid #d1d5db; border-radius: 10px; padding: 10px 10px; font-size: 14px; outline: none; background: #ffffff; }
        input:focus, select:focus{ border-color: #1c2bc0; box-shadow: 0 0 0 3px rgba(28,43,192,.12); }
        .actions{ display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
        button{ border: none; border-radius: 12px; padding: 10px 14px; font-weight: 800; cursor: pointer; font-size: 14px; transition: 0.2s;}
        .btn-primary{ background: #1c2bc0; color: #ffffff; }
        .btn-primary:hover{ filter: brightness(.90); }
        .btn-danger{ background: #ef4444; color: #ffffff; }
        .btn-danger:hover{ filter: brightness(.90); }
        .message{ margin-top: 10px; font-size: 13px; padding: 10px 12px; border-radius: 12px; border: 1px solid #eaeaea; background: #fafafa; color: #111827; display: none; }
        .message.show{ display:block; }
        .message.ok{ border-color: rgba(16,185,129,.35); background: rgba(16,185,129,.08); color: #065f46; font-weight:bold;}
        .message.err{ border-color: rgba(239,68,68,.35); background: rgba(239,68,68,.08); color: #991b1b; font-weight:bold;}
        .full{ grid-column: 1 / -1; }
        table{ width: 100%; border-collapse: collapse; font-size: 13px; border-radius: 12px; border: 1px solid #eaeaea; }
        thead th{ text-align: left; background: #f8fafc; color: #111827; padding: 10px; border-bottom: 1px solid #eaeaea; font-weight: 900;}
        tbody td{ padding: 10px; border-bottom: 1px solid #f1f5f9; color: #111827; vertical-align: middle; }
        tbody tr:hover{ background: #fafafa; }
        .muted{ color: #6b7280; font-size: 12px; }
        .pill{ display: inline-block; padding: 6px 10px; border-radius: 999px; border: 1px solid #eaeaea; font-weight: 800; font-size: 12px; }
        .pill.ok{ border-color: rgba(16,185,129,.3); background: rgba(16,185,129,.10); color: #065f46;}
        .pill.low{ border-color: rgba(245,158,11,.35); background: rgba(245,158,11,.10); color: #b45309;}
        .pill.out{ border-color: rgba(239,68,68,.35); background: rgba(239,68,68,.10); color: #991b1b;}
        .footer-actions{ display: flex; justify-content: space-between; align-items: center; padding: 18px; background: #f8fafc; border-top: 1px solid #eaeaea;}
        
        /* Estilos para el visor del total */
        .total-preview { margin: 12px 0; padding: 12px; background: #f8fafc; border-radius: 10px; border: 2px dashed #cbd5e1; text-align: center; font-size: 15px; color: #475569; transition: 0.3s; }
        .total-preview strong { color: #0c1b98; font-size: 20px; display: block; margin-top: 4px; }
      </style>

      <section class="wrap">
        <div class="topbar">
          <div class="title">
            <h1>Admin – Concesionaria de Autos</h1>
            <p><strong>Situación problemática:</strong> Control de inventario y ventas en tiempo real sin recargar página.</p>
          </div>
          <div class="stats">
            <span class="chip" id="stat-total">Autos: 0</span>
            <span class="chip" id="stat-stock">En stock: 0</span>
            <span class="chip" id="stat-ventas">Ingresos: $0.00</span>
          </div>
        </div>

        <div class="content">
          <div class="card">
            <h2>Ingresar nuevo auto</h2>
            <form id="form-add">
              <div class="row">
                <label>Marca *
                  <input id="add-marca" type="text" placeholder="Ej: Toyota" pattern="[a-zA-ZÀ-ÿ\\s]+" title="Solo letras" required />
                </label>
                <label>Modelo *
                  <input id="add-modelo" type="text" placeholder="Ej: Corolla" required />
                </label>
              </div>

              <div class="row">
                <label>Año *
                  <input id="add-anio" type="number" min="1980" max="2027" placeholder="Ej: 2020" required />
                </label>
                <label>Precio (USD) *
                  <input id="add-precio" type="number" step="0.01" min="0.01" placeholder="Ej: 13500" required />
                </label>
              </div>

              <div class="row">
                <label>Combustible *
                  <select id="add-combustible" required>
                    <option value="">Seleccione…</option>
                    <option>Gasolina</option><option>Diésel</option><option>Híbrido</option><option>Eléctrico</option>
                  </select>
                </label>
                <label>Transmisión *
                  <select id="add-transmision" required>
                    <option value="">Seleccione…</option>
                    <option>Manual</option><option>Automática</option>
                  </select>
                </label>
              </div>

              <div class="row">
                <label>Stock inicial *
                  <input id="add-stock" type="number" min="0" placeholder="Ej: 2" required />
                </label>
              </div>

              <div class="actions">
                <button class="btn-primary" type="submit">Guardar Vehículo</button>
              </div>
              <div class="message" id="msg-add"></div>
            </form>
          </div>

          <div class="card">
            <h2>Vender auto</h2>
            <form id="form-sell">
              <label>Seleccione auto disponible *
                <select id="sell-car" required><option value="">Cargando…</option></select>
              </label>

              <div class="row" style="margin-top:10px;">
                <label>Cantidad a vender *
                  <input id="sell-qty" type="number" min="1" placeholder="Ej: 1" required />
                </label>
                <label>Cliente (opcional)
                  <input id="sell-client" type="text" pattern="[a-zA-ZÀ-ÿ\\s]+" title="Solo letras" placeholder="Nombre del cliente" />
                </label>
              </div>

              <div class="total-preview" id="sell-preview">
                Total a cobrar: <strong>$0.00</strong>
              </div>

              <div class="actions">
                <button class="btn-primary" type="submit" style="width: 100%;">💸 Registrar Venta</button>
              </div>
              <div class="message" id="msg-sell"></div>
            </form>
          </div>

          <div class="card full">
            <h2>Historial de Ventas</h2>
            <div style="overflow:auto; max-height: 250px;">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Vehículo</th>
                    <th>Cant.</th>
                    <th>Total Pagado</th>
                  </tr>
                </thead>
                <tbody id="tbody-sales"><tr><td colspan="5">Cargando…</td></tr></tbody>
              </table>
            </div>
          </div>

          <div class="card full">
            <h2>Inventario en Tiempo Real</h2>
            <div style="overflow:auto; max-height: 400px;">
              <table>
                <thead>
                  <tr>
                    <th>Auto</th><th>Detalles</th><th>Precio</th><th>Stock</th><th>Vendidas</th><th>Estado</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody id="tbody"><tr><td colspan="7">Cargando…</td></tr></tbody>
              </table>
            </div>
            <div class="message" id="msg-table"></div>
          </div>
        </div>

        <div class="footer-actions">
          <div class="muted">
            <strong>WebComponents:</strong> La lógica y estilos viven encapsulados dentro de <code>&lt;admin-panel&gt;</code>.
          </div>
          <button class="btn-danger" type="button" id="btn-reset">⚠️ Borrar BD Completa</button>
        </div>
      </section>
    `;
  }

  bindEvents() {
    const $ = (sel) => this.shadowRoot.querySelector(sel);

    // Eventos principales de formularios
    $("#form-add").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleAdd();
    });

    $("#form-sell").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSell();
    });

    // Eventos para calcular el total dinámicamente antes de vender
    $("#sell-car").addEventListener("change", () => this.updateSellPreview());
    $("#sell-qty").addEventListener("input", () => this.updateSellPreview());

    $("#btn-reset").addEventListener("click", () => this.resetData());

    // Evento de eliminación delegada
    this.shadowRoot.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      if (btn.dataset.action === "delete") this.deleteCar(btn.dataset.id);
    });
  }

  // --- NUEVA FUNCIÓN: Calcula el total en tiempo real ---
  updateSellPreview() {
    const $ = (sel) => this.shadowRoot.querySelector(sel);
    const carId = $("#sell-car").value;
    const qty = toInt($("#sell-qty").value) || 0;
    const previewEl = $("#sell-preview");

    if (!carId || qty <= 0) {
      previewEl.innerHTML = `Total a cobrar: <strong>$0.00</strong>`;
      return;
    }

    const car = this.cars.find(c => c.id === carId);
    if (car) {
      const total = car.precio * qty;
      previewEl.innerHTML = `Total a cobrar: <strong>${formatMoney(total)}</strong>`;
    }
  }

  saveAndRefresh() {
    Storage.save({ cars: this.cars, sales: this.sales });
    this.refreshUI();
  }

  showMessage(elId, text, type = "ok") {
    const el = this.shadowRoot.getElementById(elId);
    if (!el) return;

    el.textContent = text;
    el.className = `message show ${type}`;

    clearTimeout(this.lastMessageTimer);
    this.lastMessageTimer = setTimeout(() => {
      el.classList.remove("show", "ok", "err");
      el.textContent = "";
    }, 4000);
  }

  refreshUI() {
    const $ = (sel) => this.shadowRoot.querySelector(sel);

    const total = this.cars.length;
    const stockTotal = this.cars.reduce((acc, c) => acc + (Number(c.stock) || 0), 0);
    const ingresosTotal = this.sales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);

    $("#stat-total").textContent = `Modelos: ${total}`;
    $("#stat-stock").textContent = `Unidades en stock: ${stockTotal}`;
    $("#stat-ventas").textContent = `Ingresos Totales: ${formatMoney(ingresosTotal)}`;

    const sellSelect = $("#sell-car");
    sellSelect.innerHTML = `<option value="">Seleccione un vehículo…</option>` +
      this.cars
        .filter(c => c.stock > 0)
        .map(c => `<option value="${c.id}">${c.marca} ${c.modelo} (${c.anio}) - ${formatMoney(c.precio)} - Quedan: ${c.stock}</option>`)
        .join("");

    const tbody = $("#tbody");
    if (this.cars.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="muted" style="text-align:center; padding: 20px;">No hay autos registrados. Agregue uno en el formulario superior.</td></tr>`;
    } else {
      tbody.innerHTML = this.cars.map(c => {
        const estado = c.stock === 0 ? { text: "Agotado", cls: "out" } :
                       c.stock <= 2 ? { text: "Bajo stock", cls: "low" } :
                       { text: "Disponible", cls: "ok" };

        return `
          <tr>
            <td><strong>${c.marca} ${c.modelo}</strong><br><span class="muted">${c.anio}</span></td>
            <td><span class="pill">${c.combustible}</span> <span class="pill">${c.transmision}</span></td>
            <td><strong>${formatMoney(c.precio)}</strong></td>
            <td>${c.stock}</td>
            <td>${c.vendidas}</td>
            <td><span class="pill ${estado.cls}">${estado.text}</span></td>
            <td>
              <button class="btn-danger" data-action="delete" data-id="${c.id}">Eliminar</button>
            </td>
          </tr>
        `;
      }).join("");
    }

    const tbodySales = $("#tbody-sales");
    if (this.sales.length === 0) {
      tbodySales.innerHTML = `<tr><td colspan="5" class="muted" style="text-align:center; padding: 20px;">Aún no se han registrado ventas.</td></tr>`;
    } else {
      tbodySales.innerHTML = this.sales.map(s => `
        <tr>
          <td class="muted">${s.fecha}</td>
          <td><strong>${s.client}</strong></td>
          <td>${s.carName}</td>
          <td>${s.qty}</td>
          <td style="color: #0c1b98; font-weight: bold;">${formatMoney(s.total)}</td>
        </tr>
      `).join("");
    }

    // Reinicia el visor del total a cero cada vez que la UI se actualiza (ej. después de vender)
    this.updateSellPreview();
  }

  handleAdd() {
    const $ = (sel) => this.shadowRoot.querySelector(sel);

    const marca = $("#add-marca").value.trim();
    const modelo = $("#add-modelo").value.trim();
    const anio = toInt($("#add-anio").value);
    const precio = toFloat($("#add-precio").value);
    const combustible = $("#add-combustible").value;
    const transmision = $("#add-transmision").value;
    const stock = toInt($("#add-stock").value);

    if (!marca || !modelo || isNaN(anio) || isNaN(precio) || isNaN(stock) || !combustible || !transmision) {
      return this.showMessage("msg-add", "Error: Todos los campos marcados con * son obligatorios.", "err");
    }

    const dup = this.cars.some(c => c.marca.toLowerCase() === marca.toLowerCase() && c.modelo.toLowerCase() === modelo.toLowerCase() && c.anio === anio);
    if (dup) {
      return this.showMessage("msg-add", "Error: Ya existe un auto idéntico registrado.", "err");
    }

    this.cars.push({
      id: crypto.randomUUID(),
      marca, modelo, anio, precio, combustible, transmision, stock, vendidas: 0
    });

    $("#form-add").reset();
    this.saveAndRefresh();
    this.showMessage("msg-add", `✅ Vehículo guardado exitosamente.`, "ok");
  }

  handleSell() {
    const $ = (sel) => this.shadowRoot.querySelector(sel);

    const carId = $("#sell-car").value;
    const qty = toInt($("#sell-qty").value);
    const client = $("#sell-client").value.trim() || "Consumidor Final";
    
    if (!carId) return this.showMessage("msg-sell", "Error: Debe seleccionar un vehículo.", "err");
    if (isNaN(qty) || qty <= 0) return this.showMessage("msg-sell", "Error: La cantidad a vender debe ser al menos 1.", "err");

    const car = this.cars.find(c => c.id === carId);
    if (qty > car.stock) {
      return this.showMessage("msg-sell", `Error: Inventario insuficiente. Solo quedan ${car.stock}.`, "err");
    }

    car.stock -= qty;
    car.vendidas += qty;

    const totalVenta = car.precio * qty;
    const fechaActual = new Date().toLocaleString("es-SV", { dateStyle: "short", timeStyle: "short" });

    this.sales.unshift({
      id: crypto.randomUUID(),
      fecha: fechaActual,
      client,
      carName: `${car.marca} ${car.modelo}`,
      qty,
      total: totalVenta
    });

    $("#form-sell").reset();
    this.saveAndRefresh();
    this.showMessage("msg-sell", `✅ Venta registrada exitosamente.`, "ok");
  }

  deleteCar(id) {
    const idx = this.cars.findIndex(c => c.id === id);
    if (idx === -1) return;
    
    const car = this.cars[idx];
    
    if (window.confirm(`⚠️ ADVERTENCIA:\n\n¿Está totalmente seguro que desea eliminar el vehículo "${car.marca} ${car.modelo}" del inventario?\n\nEsta acción no se puede deshacer.`)) {
        this.cars.splice(idx, 1);
        this.saveAndRefresh();
        this.showMessage("msg-table", `🗑️ Vehículo eliminado correctamente.`, "ok");
    }
  }

  resetData() {
    const confirmacion = prompt("⚠️ ZONA DE PELIGRO:\n\nEsto borrará TODO el inventario y TODAS las ventas registradas. Esta acción NO se puede deshacer.\n\nEscriba la palabra 'borrar' para confirmar:");
    
    if (confirmacion !== null && confirmacion.trim().toLowerCase() === 'borrar') {
       localStorage.removeItem(Storage.keyData);
       this.cars = [];
       this.sales = [];
       this.saveAndRefresh();
       alert("La base de datos ha sido borrada permanentemente.");
    } else if (confirmacion !== null) {
       alert("Cancelado: La palabra clave de seguridad no coincide.");
    }
  }
}

customElements.define("admin-panel", AdminPanel);