const workOrders = [
  { title: "Ignition failure", code: "E-11 · Tankless water heater", icon: "♨", iconClass: "", property: "1428 Oak Street", unit: "Unit 3B", status: "In progress", priority: "Urgent", updated: "12 min ago" },
  { title: "Not draining", code: "D-04 · Dishwasher", icon: "▤", iconClass: "dish", property: "906 Willow Lane", unit: "Unit 2A", status: "Needs review", priority: "Normal", updated: "38 min ago" },
  { title: "Low water pressure", code: "W-02 · Tankless water heater", icon: "⌁", iconClass: "tap", property: "311 Cedar Court", unit: "Unit 1", status: "Scheduled", priority: "Low", updated: "2 hrs ago" },
  { title: "Inlet filter warning", code: "E-17 · Tankless water heater", icon: "♨", iconClass: "", property: "78 Maple Avenue", unit: "Unit 4C", status: "In progress", priority: "Normal", updated: "Yesterday" },
];

const guides = {
  heater: {
    title: "Tankless water heater",
    model: "Rinnai RU199iN · Common symptoms",
    code: "E-11",
    tag: "No hot water",
    summary: "Ignition failure — unit clicks but won’t fire, or shuts off shortly after starting.",
    iconClass: "heater-device",
    icon: "<span></span>",
    steps: [
      ["Check gas supply", "Confirm shutoff valve is parallel to pipe."],
      ["Inspect igniter & flame rod", "Look for soot or a loose connection."],
      ["Clean flame rod", "Use fine emery cloth; restart the unit."],
    ],
  },
  dishwasher: {
    title: "Built-in dishwasher",
    model: "Bosch 300 Series · Common symptoms",
    code: "D-04",
    tag: "Standing water",
    summary: "Drain issue — water remains in the tub after a cycle or the pump runs continuously.",
    iconClass: "dishwasher-device",
    icon: "<span></span>",
    steps: [
      ["Check the filter basket", "Remove debris and rinse the mesh filter."],
      ["Inspect the drain hose", "Look for kinks beneath the sink."],
      ["Test the drain pump", "Clear the impeller; replace if it still hums."],
    ],
  },
};

const rowsElement = document.querySelector("#work-order-rows");
const searchInput = document.querySelector("#search-input");
const statusFilter = document.querySelector("#status-filter");
const emptyState = document.querySelector("#empty-state");
const dialog = document.querySelector("#triage-dialog");
const triageForm = document.querySelector("#triage-form");
const toast = document.querySelector("#toast");
let toastTimer;

function statusClass(status) {
  if (status === "In progress") return "status-progress";
  if (status === "Needs review") return "status-review";
  return "status-scheduled";
}

function priorityClass(priority) {
  return `priority-${priority.toLowerCase()}`;
}

function renderWorkOrders() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  const filtered = workOrders.filter((order) => {
    const matchesQuery = `${order.title} ${order.code} ${order.property} ${order.unit} ${order.status} ${order.priority}`.toLowerCase().includes(query);
    return matchesQuery && (status === "all" || order.status === status);
  });

  rowsElement.innerHTML = filtered.map((order) => `
    <tr>
      <td><div class="issue-cell"><span class="issue-icon ${order.iconClass}" aria-hidden="true">${order.icon}</span><span>${escapeHtml(order.title)}<small>${escapeHtml(order.code)}</small></span></div></td>
      <td class="property-cell">${escapeHtml(order.property)}<small>${escapeHtml(order.unit)}</small></td>
      <td><span class="status-pill ${statusClass(order.status)}">${escapeHtml(order.status)}</span></td>
      <td><span class="priority-pill ${priorityClass(order.priority)}">${escapeHtml(order.priority)}</span></td>
      <td class="updated-cell">${escapeHtml(order.updated)}</td>
      <td><button class="row-menu" type="button" aria-label="More options for ${escapeHtml(order.title)}">···</button></td>
    </tr>`).join("");
  emptyState.hidden = filtered.length !== 0;
  document.querySelector("#showing-label").textContent = `Showing ${filtered.length} of ${workOrders.length} work orders`;
  document.querySelector("#open-count").textContent = String(workOrders.length).padStart(2, "0");
  document.querySelector("#work-count").textContent = String(workOrders.length).padStart(2, "0");
  document.querySelector("#nav-count").textContent = workOrders.length;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2800);
}

function setGuide(guideName) {
  const guide = guides[guideName];
  document.querySelector("#guide-title").textContent = guide.title;
  document.querySelector("#guide-model").textContent = guide.model;
  document.querySelector("#symptom-code").textContent = guide.code;
  document.querySelector(".symptom-tag").textContent = guide.tag;
  document.querySelector("#symptom-summary").textContent = guide.summary;
  const deviceIcon = document.querySelector("#device-icon");
  deviceIcon.className = `device-icon ${guide.iconClass}`;
  deviceIcon.innerHTML = guide.icon;
  document.querySelector("#diagnostic-steps").innerHTML = guide.steps.map(([title, detail], index) => `
    <li><span class="step-number">${index + 1}</span><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(detail)}</small></span><span class="step-check">${index < 2 ? "✓" : "↗"}</span></li>`).join("");
}

searchInput.addEventListener("input", renderWorkOrders);
statusFilter.addEventListener("change", renderWorkOrders);

document.querySelectorAll(".guide-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".guide-tab").forEach((button) => {
      const selected = button === tab;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-selected", String(selected));
    });
    setGuide(tab.dataset.guide);
  });
});

document.querySelector("#new-triage-button").addEventListener("click", () => dialog.showModal());
document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
document.querySelector("#cancel-dialog").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

triageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(triageForm);
  const appliance = String(formData.get("appliance"));
  const priority = String(formData.get("priority"));
  const symptom = String(formData.get("symptom")).trim();
  const propertyInput = String(formData.get("property")).trim();
  const guide = appliance === "Dishwasher" ? guides.dishwasher : guides.heater;
  const addressParts = propertyInput.split(",");

  workOrders.unshift({
    title: symptom,
    code: `${guide.code} · ${appliance}`,
    icon: appliance === "Dishwasher" ? "▤" : "♨",
    iconClass: appliance === "Dishwasher" ? "dish" : "",
    property: addressParts[0],
    unit: addressParts.slice(1).join(",").trim() || "Unit not specified",
    status: "Needs review",
    priority,
    updated: "Just now",
  });
  renderWorkOrders();
  dialog.close();
  triageForm.reset();
  showToast("Triage created — your team is ready to take a look.");
});

document.querySelector("#restock-button").addEventListener("click", () => showToast("Inventory restock list is up to date."));

const currentDate = new Date();
document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("en-US", {
  weekday: "long", month: "long", day: "numeric",
}).format(currentDate);

renderWorkOrders();
