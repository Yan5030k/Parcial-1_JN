// ==========================
//   "Base de datos" local
// ==========================
const Storage = {
  key: "concesionaria_autos_v1",

  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  },

  save(cars) {
    localStorage.setItem(this.key, JSON.stringify(cars));
  },

  ensureSeed() {
    const cars = this.load();
    if (cars.length > 0) return;

    const seed = [
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
      },
      {
        id: crypto.randomUUID(),
        marca: "Honda",
        modelo: "Civic",
        anio: 2019,
        precio: 12500,
        combustible: "Gasolina",
        transmision: "Manual",
        stock: 1,
        vendidas: 0
      }
    ];
    this.save(seed);
  }
};

// ==========================
//   Utilidades / Validación
// ==========================
function isNonEmptyText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function toInt(value) {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : NaN;
}

function toFloat(value) {
  const n = Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : NaN;
}

function clampMin(n, min) {
  return n < min ? min : n;
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
    this.cars = Storage.load();
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
        :host{
          width: 100%;
          max-width: 1100px;
        }

        .wrap{
          background: #ffffff;
          border: 1px solid #eaeaea;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(0,0,0,.06);
          overflow: hidden;
        }

        .topbar{
          padding: 18px 18px 14px 18px;
          border-bottom: 1px solid #eaeaea;
          display: flex;
          flex-wrap: wrap;
          gap: 10px 16px;
          align-items: flex-end;
          justify-content: space-between;
        }

        .title{
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .title h1{
          font-size: 22px;
          color: #111827;
          font-weight: 800;
          letter-spacing: .3px;
        }

        .title p{
          font-size: 13px;
          color: #6b7280;
          line-height: 1.35;
          max-width: 780px;
        }

        .stats{
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .chip{
          border: 1px solid #eaeaea;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 13px;
          color: #111827;
          background: #fafafa;
          white-space: nowrap;
        }

        .content{
          padding: 18px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 980px){
          .content{
            grid-template-columns: 1fr;
          }
        }

        .card{
          border: 1px solid #eaeaea;
          border-radius: 14px;
          padding: 14px;
          background: #ffffff;
        }

        .card h2{
          font-size: 16px;
          color: #0c1b98;
          font-weight: 800;
          margin-bottom: 10px;
        }

        .row{
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }

        @media (max-width: 520px){
          .row{
            grid-template-columns: 1fr;
          }
        }

        label{
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          color: #374151;
          font-weight: 700;
        }

        input, select{
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 10px 10px;
          font-size: 14px;
          outline: none;
          background: #ffffff;
        }

        input:focus, select:focus{
          border-color: #1c2bc0;
          box-shadow: 0 0 0 3px rgba(28,43,192,.12);
        }

        .actions{
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 6px;
        }

        button{
          border: none;
          border-radius: 12px;
          padding: 10px 14px;
          font-weight: 800;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-primary{
          background: #1c2bc0;
          color: #ffffff;
        }

        .btn-primary:hover{ filter: brightness(.95); }

        .btn-danger{
          background: #ef4444;
          color: #ffffff;
        }

        .btn-danger:hover{ filter: brightness(.95); }

        .btn-ghost{
          background: #f3f4f6;
          color: #111827;
          border: 1px solid #e5e7eb;
        }

        .btn-ghost:hover{ filter: brightness(.98); }

        .message{
          margin-top: 10px;
          font-size: 13px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #eaeaea;
          background: #fafafa;
          color: #111827;
          display: none;
        }

        .message.show{ display:block; }
        .message.ok{
          border-color: rgba(16,185,129,.35);
          background: rgba(16,185,129,.08);
        }
        .message.err{
          border-color: rgba(239,68,68,.35);
          background: rgba(239,68,68,.08);
        }

        .full{
          grid-column: 1 / -1;
        }

        table{
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          overflow: hidden;
          border-radius: 12px;
          border: 1px solid #eaeaea;
        }

        thead th{
          text-align: left;
          background: #f8fafc;
          color: #111827;
          font-weight: 900;
          padding: 10px;
          border-bottom: 1px solid #eaeaea;
        }

        tbody td{
          padding: 10px;
          border-bottom: 1px solid #f1f5f9;
          color: #111827;
          vertical-align: top;
        }

        tbody tr:hover{
          background: #fafafa;
        }

        .muted{
          color: #6b7280;
          font-size: 12px;
        }

        .pill{
          display: inline-block;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid #eaeaea;
          background: #ffffff;
          font-weight: 800;
          font-size: 12px;
        }

        .pill.ok{
          border-color: rgba(16,185,129,.3);
          background: rgba(16,185,129,.10);
        }

        .pill.low{
          border-color: rgba(245,158,11,.35);
          background: rgba(245,158,11,.10);
        }

        .pill.out{
          border-color: rgba(239,68,68,.35);
          background: rgba(239,68,68,.10);
        }

        .small{
          font-size: 12px;
        }

        .footer-actions{
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
        }

        .hint{
          color: #6b7280;
          font-size: 12px;
          line-height: 1.35;
        }
      </style>

      <section class="wrap">
        <div class="topbar">
          <div class="title">
            <h1>Admin – Concesionaria de Autos</h1>
            <p>
              <strong>Situación problemática:</strong> En muchas concesionarias pequeñas el inventario y las ventas se controlan
              en papel o Excel, causando errores y falta de disponibilidad en tiempo real. Este panel registra autos, controla stock y ventas
              sin recargar la página.
            </p>
            <p class="muted">
              Sector: Automotriz / Comercio y ventas / PYMES / Administración.
            </p>
          </div>

          <div class="stats">
            <span class="chip" id="stat-total">Autos: 0</span>
            <span class="chip" id="stat-stock">En stock: 0</span>
            <span class="chip" id="stat-vendidos">Vendidos: 0</span>
          </div>
        </div>

        <div class="content">
          <div class="card">
            <h2>Ingresar nuevo auto</h2>

            <form id="form-add">
              <div class="row">
                <label>
                  Marca *
                  <input id="add-marca" type="text" placeholder="Ej: Toyota" />
                </label>
                <label>
                  Modelo *
                  <input id="add-modelo" type="text" placeholder="Ej: Corolla" />
                </label>
              </div>

              <div class="row">
                <label>
                  Año *
                  <input id="add-anio" type="number" inputmode="numeric" placeholder="Ej: 2020" />
                </label>
                <label>
                  Precio (USD) *
                  <input id="add-precio" type="number" inputmode="decimal" step="0.01" placeholder="Ej: 13500" />
                </label>
              </div>

              <div class="row">
                <label>
                  Combustible *
                  <select id="add-combustible">
                    <option value="">Seleccione…</option>
                    <option>Gasolina</option>
                    <option>Diésel</option>
                    <option>Híbrido</option>
                    <option>Eléctrico</option>
                  </select>
                </label>
                <label>
                  Transmisión *
                  <select id="add-transmision">
                    <option value="">Seleccione…</option>
                    <option>Manual</option>
                    <option>Automática</option>
                  </select>
                </label>
              </div>

              <div class="row">
                <label>
                  Stock inicial *
                  <input id="add-stock" type="number" inputmode="numeric" placeholder="Ej: 2" />
                </label>
                <label class="muted">
                  &nbsp;
                  <span class="small">Se guarda en el navegador (localStorage).</span>
                </label>
              </div>

              <div class="actions">
                <button class="btn-primary" type="submit">Guardar auto</button>
                <button class="btn-ghost" type="button" id="btn-demo">Cargar ejemplo</button>
              </div>

              <div class="message" id="msg-add"></div>
            </form>
          </div>

          <div class="card">
            <h2>Vender auto</h2>

            <form id="form-sell">
              <label>
                Seleccione auto disponible *
                <select id="sell-car">
                  <option value="">Cargando…</option>
                </select>
              </label>

              <div class="row" style="margin-top:10px;">
                <label>
                  Cantidad a vender *
                  <input id="sell-qty" type="number" inputmode="numeric" placeholder="Ej: 1" />
                </label>
                <label>
                  Cliente (opcional)
                  <input id="sell-client" type="text" placeholder="Nombre del cliente" />
                </label>
              </div>

              <div class="actions">
                <button class="btn-primary" type="submit">Registrar venta</button>
                <button class="btn-danger" type="button" id="btn-reset">Borrar datos</button>
              </div>

              <div class="message" id="msg-sell"></div>
            </form>

            <div class="hint" style="margin-top:10px;">
              * La venta reduce el stock. Si el stock llega a 0, el auto queda “Agotado”.
            </div>
          </div>

          <div class="card full">
            <h2>Inventario</h2>
            <div class="hint" style="margin-bottom:10px;">
              Lista de autos y su disponibilidad. Actualiza sin recargar.
            </div>

            <div style="overflow:auto;">
              <table>
                <thead>
                  <tr>
                    <th>Auto</th>
                    <th>Detalles</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Vendidas</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody id="tbody">
                  <tr><td colspan="7" class="muted">Cargando…</td></tr>
                </tbody>
              </table>
            </div>

            <div class="footer-actions">
              <div class="hint">
                WebComponents: <code>&lt;admin-panel&gt;</code> encapsula interfaz + lógica. JS captura eventos, valida y actualiza el DOM.
              </div>
              <button class="btn-ghost" type="button" id="btn-export">Exportar JSON</button>
            </div>

            <div class="message" id="msg-table"></div>
          </div>
        </div>
      </section>
    `;
  }

  bindEvents() {
    const $ = (sel) => this.shadowRoot.querySelector(sel);

    $("#form-add").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleAdd();
    });

    $("#form-sell").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSell();
    });

    $("#btn-demo").addEventListener("click", () => this.fillDemo());
    $("#btn-reset").addEventListener("click", () => this.resetData());
    $("#btn-export").addEventListener("click", () => this.exportJSON());

    this.shadowRoot.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      if (btn.dataset.action === "delete") this.deleteCar(btn.dataset.id);
    });
  }

  saveAndRefresh(message = null) {
    Storage.save(this.cars);
    this.refreshUI(message);
  }

  showMessage(elId, text, type = "ok") {
    const el = this.shadowRoot.getElementById(elId);
    if (!el) return;

    el.textContent = text;
    el.classList.add("show");
    el.classList.toggle("ok", type === "ok");
    el.classList.toggle("err", type === "err");

    clearTimeout(this.lastMessageTimer);
    this.lastMessageTimer = setTimeout(() => {
      el.classList.remove("show", "ok", "err");
      el.textContent = "";
    }, 3500);
  }

  refreshUI(message = null) {
    const $ = (sel) => this.shadowRoot.querySelector(sel);

    const total = this.cars.length;
    const stockTotal = this.cars.reduce((acc, c) => acc + (Number(c.stock) || 0), 0);
    const vendidosTotal = this.cars.reduce((acc, c) => acc + (Number(c.vendidas) || 0), 0);

    $("#stat-total").textContent = `Autos: ${total}`;
    $("#stat-stock").textContent = `En stock: ${stockTotal}`;
    $("#stat-vendidos").textContent = `Vendidos: ${vendidosTotal}`;

    const sellSelect = $("#sell-car");
    sellSelect.innerHTML =
      `<option value="">Seleccione…</option>` +
      this.cars
        .filter(c => (Number(c.stock) || 0) > 0)
        .map(c => {
          const label = `${c.marca} ${c.modelo} (${c.anio}) — ${formatMoney(c.precio)} — Stock: ${c.stock}`;
          return `<option value="${c.id}">${label}</option>`;
        })
        .join("");

    const tbody = $("#tbody");
    if (this.cars.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="muted">No hay autos registrados.</td></tr>`;
    } else {
      tbody.innerHTML = this.cars
        .map(c => {
          const stock = Number(c.stock) || 0;
          const vendidas = Number(c.vendidas) || 0;

          const estado =
            stock === 0 ? { text: "Agotado", cls: "out" } :
            stock <= 2 ? { text: "Bajo stock", cls: "low" } :
            { text: "Disponible", cls: "ok" };

          return `
            <tr>
              <td>
                <div><strong>${c.marca} ${c.modelo}</strong></div>
                <div class="muted">${c.anio}</div>
              </td>
              <td>
                <div class="pill">${c.combustible}</div>
                <div class="pill">${c.transmision}</div>
              </td>
              <td><strong>${formatMoney(c.precio)}</strong></td>
              <td>${stock}</td>
              <td>${vendidas}</td>
              <td><span class="pill ${estado.cls}">${estado.text}</span></td>
              <td>
                <button class="btn-danger" data-action="delete" data-id="${c.id}">Eliminar</button>
              </td>
            </tr>
          `;
        })
        .join("");
    }

    if (message) this.showMessage("msg-table", message, "ok");
  }

  handleAdd() {
    const $ = (id) => this.shadowRoot.getElementById(id);

    const marca = $("#add-marca").value;
    const modelo = $("#add-modelo").value;
    const anio = toInt($("#add-anio").value);
    const precio = toFloat($("#add-precio").value);
    const combustible = $("#add-combustible").value;
    const transmision = $("#add-transmision").value;
    const stock = toInt($("#add-stock").value);

    const currentYear = new Date().getFullYear();

    if (!isNonEmptyText(marca)) return this.showMessage("msg-add", "Marca es obligatoria.", "err");
    if (!isNonEmptyText(modelo)) return this.showMessage("msg-add", "Modelo es obligatorio.", "err");
    if (!Number.isFinite(anio) || anio < 1980 || anio > currentYear + 1) {
      return this.showMessage("msg-add", `Año inválido. Use un año entre 1980 y ${currentYear + 1}.`, "err");
    }
    if (!Number.isFinite(precio) || precio <= 0) return this.showMessage("msg-add", "Precio inválido. Debe ser mayor a 0.", "err");
    if (!isNonEmptyText(combustible)) return this.showMessage("msg-add", "Seleccione combustible.", "err");
    if (!isNonEmptyText(transmision)) return this.showMessage("msg-add", "Seleccione transmisión.", "err");
    if (!Number.isFinite(stock) || stock < 0) return this.showMessage("msg-add", "Stock inválido. Debe ser 0 o mayor.", "err");

    const dup = this.cars.some(c =>
      c.marca.toLowerCase().trim() === marca.toLowerCase().trim() &&
      c.modelo.toLowerCase().trim() === modelo.toLowerCase().trim() &&
      Number(c.anio) === anio
    );
    if (dup) {
      return this.showMessage("msg-add", "Ya existe un auto con la misma marca, modelo y año.", "err");
    }

    this.cars.push({
      id: crypto.randomUUID(),
      marca: marca.trim(),
      modelo: modelo.trim(),
      anio,
      precio: Number(precio.toFixed(2)),
      combustible,
      transmision,
      stock: clampMin(stock, 0),
      vendidas: 0
    });

    $("#form-add").reset();
    this.saveAndRefresh("Auto agregado al inventario.");
    this.showMessage("msg-add", "Auto guardado correctamente.", "ok");
  }

  fillDemo() {
    const $ = (id) => this.shadowRoot.getElementById(id);
    $("#add-marca").value = "Nissan";
    $("#add-modelo").value = "Sentra";
    $("#add-anio").value = "2021";
    $("#add-precio").value = "14500";
    $("#add-combustible").value = "Gasolina";
    $("#add-transmision").value = "Automática";
    $("#add-stock").value = "3";
    this.showMessage("msg-add", "Ejemplo cargado. Ahora presione “Guardar auto”.", "ok");
  }

  handleSell() {
    const $ = (id) => this.shadowRoot.getElementById(id);

    const carId = $("#sell-car").value;
    const qty = toInt($("#sell-qty").value);
    const client = $("#sell-client").value;

    if (!isNonEmptyText(carId)) return this.showMessage("msg-sell", "Seleccione un auto.", "err");
    if (!Number.isFinite(qty) || qty <= 0) return this.showMessage("msg-sell", "Cantidad inválida. Debe ser mayor a 0.", "err");

    const car = this.cars.find(c => c.id === carId);
    if (!car) return this.showMessage("msg-sell", "Auto no encontrado.", "err");

    const stock = Number(car.stock) || 0;
    if (qty > stock) return this.showMessage("msg-sell", `No hay stock suficiente. Disponible: ${stock}.`, "err");

    car.stock = stock - qty;
    car.vendidas = (Number(car.vendidas) || 0) + qty;

    const clientText = isNonEmptyText(client) ? ` a ${client.trim()}` : "";
    this.saveAndRefresh(`Venta registrada: ${qty} unidad(es) de ${car.marca} ${car.modelo}${clientText}.`);

    $("#form-sell").reset();
    this.showMessage("msg-sell", "Venta registrada correctamente.", "ok");
  }

  deleteCar(id) {
    const idx = this.cars.findIndex(c => c.id === id);
    if (idx === -1) return;
    const c = this.cars[idx];
    this.cars.splice(idx, 1);
    this.saveAndRefresh(`Auto eliminado: ${c.marca} ${c.modelo} (${c.anio}).`);
  }

  resetData() {
    localStorage.removeItem(Storage.key);
    this.cars = [];
    this.saveAndRefresh("Datos borrados. Inventario vacío.");
    this.showMessage("msg-sell", "Se borraron los datos del inventario.", "ok");
  }

  exportJSON() {
    const dataStr = JSON.stringify(this.cars, null, 2);
    this.showMessage("msg-table", `Export JSON listo (mire la consola).`, "ok");
    console.log("=== INVENTARIO JSON ===");
    console.log(dataStr);
  }
}

customElements.define("admin-panel", AdminPanel);