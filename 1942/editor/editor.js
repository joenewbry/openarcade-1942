import {
  CAMPAIGNS,
  GRID_COLS,
  GRID_ROWS,
  LAYERS,
  TILE_SIZE,
  cloneGrid,
  computeAutoEdgeId,
  createGrid,
  drawTile,
  isEdgeId,
  layerPalette,
  loadCampaignTileSet,
  normalizeCampaignId,
  runAutoEdgeSelfTest,
  tileNameFor,
} from "./tiles.js";

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.25;
const DEFAULT_CAMPAIGN = "coral_front";
const ENTITY_TYPES = ["bunker", "ship", "turret", "hangar"];
const PALETTE_CATEGORY_OPTIONS = {
  water: [
    { id: "all", label: "All Water", ids: null },
    { id: "depth", label: "Depth (1-3)", ids: [1, 2, 3] },
    { id: "foam", label: "Foam (4)", ids: [4] },
  ],
  terrain: [
    { id: "all", label: "All Terrain", ids: null },
    { id: "base", label: "Base (10-14)", ids: [10, 11, 12, 13, 14] },
    { id: "edge", label: "Edges (20-27)", ids: [20, 21, 22, 23, 24, 25, 26, 27] },
    { id: "inner", label: "Inner (28-31)", ids: [28, 29, 30, 31] },
  ],
  clouds: [
    { id: "all", label: "All Clouds", ids: null },
    { id: "light", label: "Light (40-41)", ids: [40, 41] },
    { id: "storm", label: "Storm (42)", ids: [42] },
  ],
  entities: [
    { id: "all", label: "All Entities", values: null },
    { id: "defense", label: "Defense", values: ["bunker", "turret"] },
    { id: "ops", label: "Ops", values: ["ship", "hangar"] },
  ],
};

const TOOL_DEFS = [
  { id: "view", label: "View (V)", shortcut: "v" },
  { id: "paint", label: "Paint (B)", shortcut: "b" },
  { id: "fill", label: "Fill (G)", shortcut: "g" },
  { id: "eraser", label: "Eraser (E)", shortcut: "e" },
  { id: "select", label: "Select (V)", shortcut: "v" },
  { id: "rect", label: "Rect (R)", shortcut: "r" },
  { id: "line", label: "Line (L)", shortcut: "l" },
  { id: "stamp", label: "Stamp (S)", shortcut: "s" },
  { id: "entity", label: "Entity (N)", shortcut: "n" },
];

const ui = {
  canvas: document.getElementById("editorCanvas"),
  shell: document.getElementById("canvasShell"),
  palette: document.getElementById("palette"),
  toolButtons: document.getElementById("toolButtons"),
  activeLayerButtons: document.getElementById("activeLayerButtons"),
  layerControls: document.getElementById("layerControls"),
  statusText: document.getElementById("statusText"),
  tileInfo: document.getElementById("tileInfo"),
  cursorInfo: document.getElementById("cursorInfo"),
  selectionInfo: document.getElementById("selectionInfo"),
  campaignSelect: document.getElementById("campaignSelect"),
  paletteCategorySelect: document.getElementById("paletteCategorySelect"),
  levelNameInput: document.getElementById("levelNameInput"),
  zoomRange: document.getElementById("zoomRange"),
  zoomLabel: document.getElementById("zoomLabel"),
  gridBtn: document.getElementById("gridBtn"),
  newLevelBtn: document.getElementById("newLevelBtn"),
  saveBtn: document.getElementById("saveBtn"),
  loadBtn: document.getElementById("loadBtn"),
  exportBtn: document.getElementById("exportBtn"),
  fileInput: document.getElementById("fileInput"),
  undoBtn: document.getElementById("undoBtn"),
  redoBtn: document.getElementById("redoBtn"),
  propertiesPanel: document.getElementById("propertiesPanel"),
};

const ctx = ui.canvas.getContext("2d");

const state = {
  zoom: 1,
  showGrid: true,
  activeLayer: "water",
  tool: "paint",
  selectedTile: 1,
  paletteCategory: "all",
  selectedEntityType: ENTITY_TYPES[0],
  dragging: false,
  dragStart: null,
  brushRectDrag: false,
  dragRectPreview: null,
  hoverCell: null,
  forceEraser: false,
  selection: null,
  currentAction: null,
  undoStack: [],
  redoStack: [],
  tileSet: null,
  level: createEmptyLevel(DEFAULT_CAMPAIGN),
  propertiesVisible: true,
  manualEdgeOverrides: new Set(),
};

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function createEntitiesGrid(rows = GRID_ROWS, cols = GRID_COLS) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
}

function createEmptyLevel(campaign, name = "Coral Front - Level 1") {
  return {
    version: 1,
    campaign,
    name,
    cols: GRID_COLS,
    rows: GRID_ROWS,
    tileSize: TILE_SIZE,
    layers: {
      water: createGrid(GRID_ROWS, GRID_COLS, 1),
      terrain: createGrid(GRID_ROWS, GRID_COLS, 0),
      clouds: createGrid(GRID_ROWS, GRID_COLS, 0),
      entities: createEntitiesGrid(GRID_ROWS, GRID_COLS),
    },
    enemySpawns: [],
    bossArenas: [],
    scriptedMoments: [],
    metadata: {
      author: "editor",
      created: todayIso(),
      notes: "",
    },
    layerUi: {
      water: { visible: true, opacity: 1, locked: false },
      terrain: { visible: true, opacity: 1, locked: false },
      clouds: { visible: true, opacity: 0.8, locked: false },
      entities: { visible: true, opacity: 1, locked: false },
    },
  };
}

function defaultLayerOpacity(layer) {
  return layer === "clouds" ? 0.8 : 1;
}

function ensureLayerUiState() {
  if (!state.level.layerUi || typeof state.level.layerUi !== "object") {
    state.level.layerUi = {};
  }

  for (const layer of LAYERS) {
    const existing = state.level.layerUi[layer] || {};
    const opacity = Number(existing.opacity);
    state.level.layerUi[layer] = {
      visible: existing.visible !== false,
      opacity: Number.isFinite(opacity)
        ? Math.max(0, Math.min(1, opacity))
        : defaultLayerOpacity(layer),
      locked: Boolean(existing.locked),
    };
  }
}

function isLayerLocked(layer = state.activeLayer) {
  return Boolean(state.level.layerUi?.[layer]?.locked);
}

function editingLayerForTool() {
  return state.tool === "entity" ? "entities" : state.activeLayer;
}

function blockIfLayerLocked(toolOverride = state.tool) {
  const editableTools = new Set(["paint", "eraser", "fill", "rect", "line", "stamp", "entity"]);
  if (!editableTools.has(toolOverride)) return false;

  const layer = toolOverride === "entity" ? "entities" : state.activeLayer;
  if (!isLayerLocked(layer)) return false;

  setStatus(`Layer "${layer}" is locked`);
  return true;
}

function setStatus(message) {
  ui.statusText.textContent = message;
}

function buildCampaignSelect() {
  ui.campaignSelect.innerHTML = "";
  for (const campaign of CAMPAIGNS) {
    const option = document.createElement("option");
    option.value = campaign.id;
    option.textContent = campaign.label;
    ui.campaignSelect.append(option);
  }
}

function paletteOptionsForLayer(layer) {
  return PALETTE_CATEGORY_OPTIONS[layer] || [{ id: "all", label: "All", ids: null }];
}

function syncPaletteCategorySelect() {
  const options = paletteOptionsForLayer(state.activeLayer);
  if (!options.some((option) => option.id === state.paletteCategory)) {
    state.paletteCategory = "all";
  }

  ui.paletteCategorySelect.innerHTML = "";
  for (const option of options) {
    const node = document.createElement("option");
    node.value = option.id;
    node.textContent = option.label;
    ui.paletteCategorySelect.append(node);
  }
  ui.paletteCategorySelect.value = state.paletteCategory;
}

function buildToolButtons() {
  ui.toolButtons.innerHTML = "";
  for (const tool of TOOL_DEFS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tool-btn";
    button.dataset.tool = tool.id;
    button.textContent = tool.label;
    button.addEventListener("click", () => setTool(tool.id));
    ui.toolButtons.append(button);
  }
  syncToolButtons();
}

function syncToolButtons() {
  ui.toolButtons.querySelectorAll(".tool-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === state.tool);
  });
}

function setTool(toolId) {
  state.tool = toolId;
  if (toolId === "entity") {
    state.activeLayer = "entities";
  }
  if (toolId === "view") {
    state.activeLayer = state.activeLayer;
  }
  syncToolButtons();
  syncLayerTabs();
  syncPaletteCategorySelect();
  renderPalette();
  setStatus(`Tool: ${toolId}`);
}

function buildLayerTabs() {
  ui.activeLayerButtons.innerHTML = "";
  for (const layer of LAYERS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "layer-tab";
    button.dataset.layer = layer;
    button.textContent = layer;
    button.addEventListener("click", () => {
      state.activeLayer = layer;
      if (layer === "entities") {
        state.tool = "entity";
      }
      syncLayerTabs();
      syncToolButtons();
      syncPaletteCategorySelect();
      renderPalette();
      updateTileInfo();
      setStatus(`Active layer: ${layer}`);
    });
    ui.activeLayerButtons.append(button);
  }
  syncLayerTabs();
}

function syncLayerTabs() {
  ui.activeLayerButtons.querySelectorAll(".layer-tab").forEach((button) => {
    const layer = button.dataset.layer;
    button.classList.toggle("active", layer === state.activeLayer);
    button.classList.toggle("locked", isLayerLocked(layer));
    button.textContent = isLayerLocked(layer) ? `${layer} 🔒` : layer;
  });
}

function buildLayerControls() {
  ensureLayerUiState();
  ui.layerControls.innerHTML = "";

  for (const layer of LAYERS) {
    const row = document.createElement("div");
    row.className = "layer-row";

    const meta = document.createElement("div");
    meta.className = "layer-meta";

    const visibleLabel = document.createElement("label");
    const visibleCheckbox = document.createElement("input");
    visibleCheckbox.type = "checkbox";
    visibleCheckbox.checked = state.level.layerUi[layer].visible;
    visibleCheckbox.addEventListener("change", () => {
      state.level.layerUi[layer].visible = visibleCheckbox.checked;
      render();
    });
    visibleLabel.append(visibleCheckbox, document.createTextNode(layer));

    const lockLabel = document.createElement("label");
    lockLabel.title = `Lock ${layer} layer`;
    const lockCheckbox = document.createElement("input");
    lockCheckbox.type = "checkbox";
    lockCheckbox.checked = state.level.layerUi[layer].locked;
    lockCheckbox.addEventListener("change", () => {
      state.level.layerUi[layer].locked = lockCheckbox.checked;
      syncLayerTabs();
      setStatus(`${lockCheckbox.checked ? "Locked" : "Unlocked"} ${layer} layer`);
    });
    lockLabel.append(lockCheckbox, document.createTextNode("lock"));

    const opacityValue = document.createElement("span");
    opacityValue.textContent = String(state.level.layerUi[layer].opacity.toFixed(2));

    meta.append(visibleLabel, lockLabel, opacityValue);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "1";
    slider.step = "0.05";
    slider.value = String(state.level.layerUi[layer].opacity);
    slider.addEventListener("input", () => {
      state.level.layerUi[layer].opacity = Number(slider.value);
      opacityValue.textContent = Number(slider.value).toFixed(2);
      render();
    });

    row.append(meta, slider);
    ui.layerControls.append(row);
  }
}

function updateCanvasDimensions() {
  const scaledTile = TILE_SIZE * state.zoom;
  ui.canvas.width = GRID_COLS * scaledTile;
  ui.canvas.height = GRID_ROWS * scaledTile;
  ui.zoomRange.value = String(Math.round(state.zoom * 100));
  ui.zoomLabel.textContent = `${Math.round(state.zoom * 100)}%`;
}

function updateTileInfo() {
  if (state.activeLayer === "entities") {
    ui.tileInfo.textContent = `Entity · ${state.selectedEntityType}`;
    return;
  }
  const name = tileNameFor(state.activeLayer, state.selectedTile);
  ui.tileInfo.textContent = `ID ${state.selectedTile} · ${name}`;
}

function renderPalette() {
  ui.palette.innerHTML = "";
  const categoryOptions = paletteOptionsForLayer(state.activeLayer);
  const category = categoryOptions.find((option) => option.id === state.paletteCategory) || categoryOptions[0];

  if (state.activeLayer === "entities") {
    const allowed = category.values ? new Set(category.values) : null;
    if (allowed && !allowed.has(state.selectedEntityType)) {
      state.selectedEntityType = category.values[0] || ENTITY_TYPES[0];
      updateTileInfo();
    }
    for (const type of ENTITY_TYPES) {
      if (allowed && !allowed.has(type)) continue;
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "palette-tile";
      tile.classList.toggle("selected", state.selectedEntityType === type);
      const swatch = document.createElement("canvas");
      swatch.width = 64;
      swatch.height = 64;
      const sctx = swatch.getContext("2d");
      sctx.fillStyle = "#2f3f53";
      sctx.fillRect(0, 0, 64, 64);
      sctx.fillStyle = "#f59e0b";
      sctx.beginPath();
      sctx.arc(32, 32, 16, 0, Math.PI * 2);
      sctx.fill();
      sctx.fillStyle = "#0f172a";
      sctx.font = "10px monospace";
      sctx.fillText(type.slice(0, 3).toUpperCase(), 16, 56);
      const label = document.createElement("span");
      label.className = "palette-label";
      label.textContent = type;
      tile.append(swatch, label);
      tile.addEventListener("click", () => {
        state.selectedEntityType = type;
        updateTileInfo();
        renderPalette();
      });
      ui.palette.append(tile);
    }
    return;
  }

  const allowedIds = category.ids ? new Set(category.ids) : null;
  if (allowedIds && !allowedIds.has(state.selectedTile)) {
    const next = [...allowedIds][0];
    state.selectedTile = Number.isFinite(next) ? next : 0;
    updateTileInfo();
  }
  for (const entry of layerPalette(state.activeLayer)) {
    if (allowedIds && !allowedIds.has(entry.id)) continue;
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "palette-tile";
    tile.classList.toggle("selected", entry.id === state.selectedTile);

    const swatch = document.createElement("canvas");
    swatch.width = TILE_SIZE;
    swatch.height = TILE_SIZE;
    const sctx = swatch.getContext("2d");
    sctx.fillStyle = "#dde5ee";
    sctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    if (entry.id !== 0 && state.tileSet) {
      drawTile(sctx, state.tileSet, state.activeLayer, entry.id, 0, 0, TILE_SIZE, 1);
    }

    const label = document.createElement("span");
    label.className = "palette-label";
    label.textContent = `${entry.id} ${entry.name}`;

    tile.append(swatch, label);
    tile.addEventListener("click", () => {
      state.selectedTile = entry.id;
      updateTileInfo();
      renderPalette();
    });

    ui.palette.append(tile);
  }
}

function renderBackground() {
  ctx.fillStyle = "#10324a";
  ctx.fillRect(0, 0, ui.canvas.width, ui.canvas.height);
  if (state.tileSet && state.tileSet.campaignTint !== "transparent") {
    ctx.fillStyle = state.tileSet.campaignTint;
    ctx.fillRect(0, 0, ui.canvas.width, ui.canvas.height);
  }
}

function renderLayer(layer) {
  const uiLayer = state.level.layerUi[layer];
  if (!uiLayer.visible) return;

  const scaledTile = TILE_SIZE * state.zoom;

  if (layer === "entities") {
    ctx.save();
    ctx.globalAlpha = uiLayer.opacity;
    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let col = 0; col < GRID_COLS; col += 1) {
        const entity = state.level.layers.entities[row][col];
        if (!entity) continue;
        const x = col * scaledTile;
        const y = row * scaledTile;
        ctx.fillStyle = "rgba(245, 158, 11, 0.9)";
        ctx.beginPath();
        ctx.arc(x + scaledTile / 2, y + scaledTile / 2, Math.max(6, scaledTile * 0.18), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#111827";
        ctx.font = `${Math.max(9, Math.floor(10 * state.zoom))}px monospace`;
        ctx.fillText(entity.type.slice(0, 3).toUpperCase(), x + 4, y + Math.max(12, scaledTile * 0.25));
      }
    }
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.globalAlpha = uiLayer.opacity;
  for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let col = 0; col < GRID_COLS; col += 1) {
        const tileId = state.level.layers[layer][row][col];
        if (!tileId) continue;
        drawTile(ctx, state.tileSet, layer, tileId, col * scaledTile, row * scaledTile, scaledTile, 1);
      }
    }
  ctx.restore();
}

function renderGrid() {
  if (!state.showGrid) return;
  const scaledTile = TILE_SIZE * state.zoom;
  ctx.save();
  ctx.strokeStyle = "rgba(236, 253, 245, 0.18)";
  ctx.lineWidth = 1;

  for (let col = 0; col <= GRID_COLS; col += 1) {
    const x = col * scaledTile + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ui.canvas.height);
    ctx.stroke();
  }

  for (let row = 0; row <= GRID_ROWS; row += 1) {
    const y = row * scaledTile + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(ui.canvas.width, y);
    ctx.stroke();
  }

  ctx.restore();
}

function renderSelection() {
  const selection = state.dragRectPreview || state.selection;
  if (!selection) return;
  const scaledTile = TILE_SIZE * state.zoom;
  const x0 = Math.min(selection.start.col, selection.end.col);
  const y0 = Math.min(selection.start.row, selection.end.row);
  const x1 = Math.max(selection.start.col, selection.end.col);
  const y1 = Math.max(selection.start.row, selection.end.row);

  const x = x0 * scaledTile;
  const y = y0 * scaledTile;
  const w = (x1 - x0 + 1) * scaledTile;
  const h = (y1 - y0 + 1) * scaledTile;

  ctx.save();
  ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(96, 165, 250, 0.9)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.restore();
}

function renderHover() {
  if (!state.hoverCell) return;
  if (state.hoverCell.col < 0 || state.hoverCell.row < 0) return;
  if (state.hoverCell.col >= GRID_COLS || state.hoverCell.row >= GRID_ROWS) return;

  const scaledTile = TILE_SIZE * state.zoom;
  const x = state.hoverCell.col * scaledTile;
  const y = state.hoverCell.row * scaledTile;
  ctx.save();
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 2, y + 2, scaledTile - 4, scaledTile - 4);
  ctx.restore();
}

function render() {
  renderBackground();
  renderLayer("water");
  renderLayer("terrain");
  renderLayer("clouds");
  renderLayer("entities");
  renderGrid();
  renderSelection();
  renderHover();
}

function clampCell(col, row) {
  return {
    col: Math.max(0, Math.min(GRID_COLS - 1, col)),
    row: Math.max(0, Math.min(GRID_ROWS - 1, row)),
  };
}

function eventToCell(event) {
  const rect = ui.canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const scaledTile = TILE_SIZE * state.zoom;
  const col = Math.floor(x / scaledTile);
  const row = Math.floor(y / scaledTile);
  return clampCell(col, row);
}

function updateCursorInfo(cell) {
  ui.cursorInfo.textContent = `col ${cell.col}, row ${cell.row}`;
}

function beginAction() {
  state.currentAction = {
    tileChanges: [],
    tileMap: new Map(),
    entityChanges: [],
    entityMap: new Map(),
    lockChanges: [],
    lockMap: new Map(),
    autoTileSeeds: new Set(),
  };
}

function hasPendingAction(action) {
  return action && (action.tileChanges.length > 0 || action.entityChanges.length > 0 || action.lockChanges.length > 0);
}

function commitAction() {
  if (!hasPendingAction(state.currentAction)) {
    state.currentAction = null;
    return;
  }

  const action = {
    tileChanges: state.currentAction.tileChanges.map((entry) => ({ ...entry })),
    entityChanges: state.currentAction.entityChanges.map((entry) => ({ ...entry })),
    lockChanges: state.currentAction.lockChanges.map((entry) => ({ ...entry })),
  };

  state.undoStack.push(action);
  if (state.undoStack.length > 250) {
    state.undoStack.shift();
  }
  state.redoStack = [];
  state.currentAction = null;
}

function recordTileChange(action, layer, row, col, nextValue) {
  const grid = state.level.layers[layer];
  const currentValue = grid[row][col];
  if (currentValue === nextValue) return;
  const key = `${layer}:${row}:${col}`;
  const existing = action.tileMap.get(key);

  if (existing) {
    existing.to = nextValue;
  } else {
    const change = { layer, row, col, from: currentValue, to: nextValue };
    action.tileMap.set(key, change);
    action.tileChanges.push(change);
  }

  grid[row][col] = nextValue;
}

function recordEntityChange(action, row, col, nextEntity) {
  const grid = state.level.layers.entities;
  const currentEntity = grid[row][col];
  const currentKey = currentEntity ? currentEntity.type : "";
  const nextKey = nextEntity ? nextEntity.type : "";
  if (currentKey === nextKey) return;

  const key = `${row}:${col}`;
  const existing = action.entityMap.get(key);

  if (existing) {
    existing.to = nextEntity ? { ...nextEntity } : null;
  } else {
    const change = {
      row,
      col,
      from: currentEntity ? { ...currentEntity } : null,
      to: nextEntity ? { ...nextEntity } : null,
    };
    action.entityMap.set(key, change);
    action.entityChanges.push(change);
  }

  grid[row][col] = nextEntity ? { ...nextEntity } : null;
}

function cellKey(row, col) {
  return `${row}:${col}`;
}

function recordEdgeOverrideChange(action, row, col, nextLocked) {
  const key = cellKey(row, col);
  const currentlyLocked = state.manualEdgeOverrides.has(key);
  if (currentlyLocked === nextLocked) return;

  const existing = action.lockMap.get(key);
  if (existing) {
    existing.to = nextLocked;
  } else {
    const change = { row, col, from: currentlyLocked, to: nextLocked };
    action.lockMap.set(key, change);
    action.lockChanges.push(change);
  }

  if (nextLocked) {
    state.manualEdgeOverrides.add(key);
  } else {
    state.manualEdgeOverrides.delete(key);
  }
}

function queueAutoTileSeed(action, row, col) {
  action.autoTileSeeds.add(cellKey(row, col));
}

function flushAutoTileSeeds(action) {
  if (!action.autoTileSeeds || action.autoTileSeeds.size === 0) return;

  const candidates = new Set();
  for (const seed of action.autoTileSeeds) {
    const [rowText, colText] = seed.split(":");
    const centerRow = Number(rowText);
    const centerCol = Number(colText);

    for (let row = centerRow - 1; row <= centerRow + 1; row += 1) {
      for (let col = centerCol - 1; col <= centerCol + 1; col += 1) {
        if (row < 0 || col < 0 || row >= GRID_ROWS || col >= GRID_COLS) continue;
        candidates.add(cellKey(row, col));
      }
    }
  }

  action.autoTileSeeds.clear();
  const ordered = [...candidates].sort();
  for (const key of ordered) {
    if (state.manualEdgeOverrides.has(key)) continue;
    const [rowText, colText] = key.split(":");
    const row = Number(rowText);
    const col = Number(colText);
    const terrainId = state.level.layers.terrain[row][col];
    if (!isEdgeId(terrainId)) continue;

    const autoEdgeId = computeAutoEdgeId(state.level.layers.water, row, col, terrainId);
    if (!autoEdgeId || autoEdgeId === terrainId) continue;
    recordTileChange(action, "terrain", row, col, autoEdgeId);
  }
}

function applyAction(action, direction) {
  for (const change of action.tileChanges) {
    const value = direction === "undo" ? change.from : change.to;
    state.level.layers[change.layer][change.row][change.col] = value;
  }

  for (const change of action.entityChanges) {
    const value = direction === "undo" ? change.from : change.to;
    state.level.layers.entities[change.row][change.col] = value ? { ...value } : null;
  }

  for (const change of action.lockChanges || []) {
    const locked = direction === "undo" ? change.from : change.to;
    const key = cellKey(change.row, change.col);
    if (locked) {
      state.manualEdgeOverrides.add(key);
    } else {
      state.manualEdgeOverrides.delete(key);
    }
  }

  render();
}

function undo() {
  const action = state.undoStack.pop();
  if (!action) return;
  applyAction(action, "undo");
  state.redoStack.push(action);
  setStatus("Undo");
}

function redo() {
  const action = state.redoStack.pop();
  if (!action) return;
  applyAction(action, "redo");
  state.undoStack.push(action);
  setStatus("Redo");
}

function paintCell(action, cell, useErase = false) {
  const layer = editingLayerForTool();
  if (isLayerLocked(layer)) return;

  if (layer === "entities") {
    if (useErase) {
      recordEntityChange(action, cell.row, cell.col, null);
    } else {
      recordEntityChange(action, cell.row, cell.col, { type: state.selectedEntityType, facing: "south" });
    }
    return;
  }

  const next = useErase ? 0 : state.selectedTile;

  if (layer === "terrain") {
    if (isEdgeId(next) && !useErase) {
      recordTileChange(action, "terrain", cell.row, cell.col, next);
      recordEdgeOverrideChange(action, cell.row, cell.col, true);
      queueAutoTileSeed(action, cell.row, cell.col);
      flushAutoTileSeeds(action);
      return;
    }

    recordTileChange(action, "terrain", cell.row, cell.col, next);
    recordEdgeOverrideChange(action, cell.row, cell.col, false);
    queueAutoTileSeed(action, cell.row, cell.col);
    flushAutoTileSeeds(action);
    return;
  }

  recordTileChange(action, layer, cell.row, cell.col, next);
  if (layer === "water") {
    queueAutoTileSeed(action, cell.row, cell.col);
    flushAutoTileSeeds(action);
  }
}

function floodFill(action, startCell, useErase = false) {
  const layer = state.activeLayer;
  if (layer === "entities" || isLayerLocked(layer)) return;

  const grid = state.level.layers[layer];
  const target = grid[startCell.row][startCell.col];
  const replacement = useErase ? 0 : state.selectedTile;
  if (target === replacement) return;

  const stack = [startCell];
  const visited = new Set();

  while (stack.length > 0) {
    const cell = stack.pop();
    const key = cellKey(cell.row, cell.col);
    if (visited.has(key)) continue;
    visited.add(key);
    if (grid[cell.row][cell.col] !== target) continue;

    recordTileChange(action, layer, cell.row, cell.col, replacement);
    if (layer === "terrain") {
      recordEdgeOverrideChange(action, cell.row, cell.col, isEdgeId(replacement) && !useErase);
    }
    if (layer === "water" || layer === "terrain") {
      queueAutoTileSeed(action, cell.row, cell.col);
    }

    const neighbors = [
      { row: cell.row - 1, col: cell.col },
      { row: cell.row + 1, col: cell.col },
      { row: cell.row, col: cell.col - 1 },
      { row: cell.row, col: cell.col + 1 },
    ];

    for (const next of neighbors) {
      if (next.row < 0 || next.col < 0 || next.row >= GRID_ROWS || next.col >= GRID_COLS) continue;
      stack.push(next);
    }
  }

  flushAutoTileSeeds(action);
}

function applyRect(action, from, to, useErase = false) {
  const minCol = Math.min(from.col, to.col);
  const maxCol = Math.max(from.col, to.col);
  const minRow = Math.min(from.row, to.row);
  const maxRow = Math.max(from.row, to.row);

  for (let row = minRow; row <= maxRow; row += 1) {
    for (let col = minCol; col <= maxCol; col += 1) {
      paintCell(action, { row, col }, useErase);
    }
  }
}

function applyLine(action, from, to, useErase = false) {
  if (Math.abs(to.col - from.col) >= Math.abs(to.row - from.row)) {
    const row = from.row;
    const minCol = Math.min(from.col, to.col);
    const maxCol = Math.max(from.col, to.col);
    for (let col = minCol; col <= maxCol; col += 1) {
      paintCell(action, { row, col }, useErase);
    }
  } else {
    const col = from.col;
    const minRow = Math.min(from.row, to.row);
    const maxRow = Math.max(from.row, to.row);
    for (let row = minRow; row <= maxRow; row += 1) {
      paintCell(action, { row, col }, useErase);
    }
  }
}

function applyStamp(action, center, useErase = false) {
  const candidates = [
    center,
    { row: center.row, col: center.col + 1 },
    { row: center.row + 1, col: center.col },
    { row: center.row + 1, col: center.col + 1 },
  ];

  for (const cell of candidates) {
    if (cell.row < 0 || cell.col < 0 || cell.row >= GRID_ROWS || cell.col >= GRID_COLS) continue;
    paintCell(action, cell, useErase);
  }
}

function handlePointerDown(event) {
  const cell = eventToCell(event);
  state.hoverCell = cell;
  updateCursorInfo(cell);

  const leftClick = event.button === 0;
  const rightClick = event.button === 2;
  if (!leftClick && !rightClick) return;

  if (state.tool === "view") return;
  if (blockIfLayerLocked()) return;

  state.forceEraser = rightClick;
  const useErase = state.tool === "eraser" || state.forceEraser;

  if (state.tool === "fill") {
    beginAction();
    floodFill(state.currentAction, cell, useErase);
    commitAction();
    render();
    return;
  }

  if (state.tool === "select") {
    state.selection = { start: cell, end: cell };
    state.dragging = true;
    state.dragStart = cell;
    ui.selectionInfo.textContent = `(${cell.col},${cell.row})`;
    render();
    return;
  }

  beginAction();
  state.dragging = true;
  state.dragStart = cell;
  state.brushRectDrag = state.tool === "paint" && event.shiftKey;
  state.dragRectPreview = state.brushRectDrag ? { start: cell, end: cell } : null;

  if ((state.tool === "paint" || state.tool === "eraser" || state.tool === "entity") && !state.brushRectDrag) {
    paintCell(state.currentAction, cell, useErase);
  }

  render();
}

function handlePointerMove(event) {
  const cell = eventToCell(event);
  state.hoverCell = cell;
  updateCursorInfo(cell);

  if (!state.dragging) {
    render();
    return;
  }

  if (state.tool === "select") {
    state.selection = { start: state.dragStart, end: cell };
    const width = Math.abs(state.dragStart.col - cell.col) + 1;
    const height = Math.abs(state.dragStart.row - cell.row) + 1;
    ui.selectionInfo.textContent = `${width}x${height} @ (${Math.min(state.dragStart.col, cell.col)}, ${Math.min(state.dragStart.row, cell.row)})`;
    render();
    return;
  }

  if (state.brushRectDrag) {
    state.dragRectPreview = { start: state.dragStart, end: cell };
    render();
    return;
  }

  const useErase = state.tool === "eraser" || state.forceEraser;
  if (state.tool === "paint" || state.tool === "eraser" || state.tool === "entity") {
    paintCell(state.currentAction, cell, useErase);
    render();
  }
}

function handlePointerUp(event) {
  if (!state.dragging) return;

  const endCell = eventToCell(event);
  const useErase = state.tool === "eraser" || state.forceEraser;

  if (state.brushRectDrag) {
    applyRect(state.currentAction, state.dragStart, endCell, useErase);
  } else if (state.tool === "rect") {
    applyRect(state.currentAction, state.dragStart, endCell, useErase);
  } else if (state.tool === "line") {
    applyLine(state.currentAction, state.dragStart, endCell, useErase);
  } else if (state.tool === "stamp") {
    applyStamp(state.currentAction, endCell, useErase);
  }

  if (state.tool !== "select") {
    commitAction();
  }

  state.dragging = false;
  state.forceEraser = false;
  state.dragStart = null;
  state.brushRectDrag = false;
  state.dragRectPreview = null;
  render();
}

function buildGroundEnemiesFromGrid() {
  const groundEnemies = [];
  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let col = 0; col < GRID_COLS; col += 1) {
      const entity = state.level.layers.entities[row][col];
      if (!entity) continue;
      groundEnemies.push({
        type: entity.type,
        col,
        row,
        facing: entity.facing || "south",
      });
    }
  }
  return groundEnemies;
}

function buildTileRefs() {
  const refs = {};
  for (const layer of ["water", "terrain", "clouds"]) {
    refs[layer] = {};
    for (const entry of layerPalette(layer)) {
      if (entry.id === 0) continue;
      refs[layer][entry.id] = entry.name;
    }
  }
  return refs;
}

function serializeLevel(pretty = true) {
  const payload = {
    version: 1,
    campaign: normalizeCampaignId(state.level.campaign),
    name: state.level.name,
    cols: GRID_COLS,
    rows: GRID_ROWS,
    tileSize: TILE_SIZE,
    layers: {
      water: cloneGrid(state.level.layers.water),
      terrain: cloneGrid(state.level.layers.terrain),
      clouds: cloneGrid(state.level.layers.clouds),
    },
    groundEnemies: buildGroundEnemiesFromGrid(),
    enemySpawns: Array.isArray(state.level.enemySpawns) ? state.level.enemySpawns : [],
    bossArenas: Array.isArray(state.level.bossArenas) ? state.level.bossArenas : [],
    scriptedMoments: Array.isArray(state.level.scriptedMoments) ? state.level.scriptedMoments : [],
    metadata: {
      author: state.level.metadata?.author || "editor",
      created: state.level.metadata?.created || todayIso(),
      notes: state.level.metadata?.notes || "",
    },
    tileRefs: {
      campaign: normalizeCampaignId(state.level.campaign),
      layers: buildTileRefs(),
    },
  };

  return JSON.stringify(payload, null, pretty ? 2 : 0);
}

function download(filename, content) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function normalizeLayerGrid(grid, fallbackValue = 0) {
  const output = createGrid(GRID_ROWS, GRID_COLS, fallbackValue);
  if (!Array.isArray(grid)) return output;

  for (let row = 0; row < Math.min(GRID_ROWS, grid.length); row += 1) {
    const sourceRow = grid[row];
    if (!Array.isArray(sourceRow)) continue;
    for (let col = 0; col < Math.min(GRID_COLS, sourceRow.length); col += 1) {
      const value = Number(sourceRow[col]);
      output[row][col] = Number.isFinite(value) ? value : fallbackValue;
    }
  }
  return output;
}

function normalizeEntityGrid(groundEnemies) {
  const entities = createEntitiesGrid(GRID_ROWS, GRID_COLS);
  if (!Array.isArray(groundEnemies)) return entities;

  for (const enemy of groundEnemies) {
    if (!enemy) continue;
    const row = Number(enemy.row);
    const col = Number(enemy.col);
    if (!Number.isInteger(row) || !Number.isInteger(col)) continue;
    if (row < 0 || col < 0 || row >= GRID_ROWS || col >= GRID_COLS) continue;
    entities[row][col] = {
      type: enemy.type || "bunker",
      facing: enemy.facing || "south",
    };
  }

  return entities;
}

function readLayerFromData(data, names) {
  for (const name of names) {
    if (Array.isArray(data?.layers?.[name])) return data.layers[name];
  }
  for (const name of names) {
    if (Array.isArray(data?.[name])) return data[name];
  }
  return null;
}

async function loadLevelFromObject(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid level JSON");
  }

  const campaign = normalizeCampaignId(data.campaign || data.campaignId || DEFAULT_CAMPAIGN);
  state.tileSet = await loadCampaignTileSet(campaign);

  const nextLevel = createEmptyLevel(campaign, data.name || "Imported Level");
  const waterLayer = readLayerFromData(data, ["water", "waterLayer"]);
  const terrainLayer = readLayerFromData(data, ["terrain", "terrainLayer"]);
  const cloudLayer = readLayerFromData(data, ["clouds", "cloud", "cloudLayer"]);

  nextLevel.layers.water = normalizeLayerGrid(waterLayer, 1);
  nextLevel.layers.terrain = normalizeLayerGrid(terrainLayer, 0);
  nextLevel.layers.clouds = normalizeLayerGrid(cloudLayer, 0);
  nextLevel.layers.entities = normalizeEntityGrid(data.groundEnemies);
  nextLevel.enemySpawns = Array.isArray(data.enemySpawns) ? data.enemySpawns : [];
  nextLevel.bossArenas = Array.isArray(data.bossArenas) ? data.bossArenas : [];
  nextLevel.scriptedMoments = Array.isArray(data.scriptedMoments) ? data.scriptedMoments : [];
  nextLevel.metadata = {
    author: data.metadata?.author || "editor",
    created: data.metadata?.created || todayIso(),
    notes: data.metadata?.notes || "",
  };

  if (data.layerUi && typeof data.layerUi === "object") {
    for (const layer of LAYERS) {
      if (!data.layerUi[layer] || typeof data.layerUi[layer] !== "object") continue;
      nextLevel.layerUi[layer] = {
        ...nextLevel.layerUi[layer],
        ...data.layerUi[layer],
      };
    }
  }

  state.level = nextLevel;
  ensureLayerUiState();
  state.undoStack = [];
  state.redoStack = [];
  state.paletteCategory = "all";
  state.manualEdgeOverrides = new Set();
  state.dragging = false;
  state.dragStart = null;
  state.brushRectDrag = false;
  state.dragRectPreview = null;

  ui.campaignSelect.value = campaign;
  ui.levelNameInput.value = state.level.name;
  buildLayerControls();
  syncPaletteCategorySelect();
  renderPalette();
  updateTileInfo();
  render();
}

async function newLevel(campaign) {
  const campaignId = normalizeCampaignId(campaign);
  state.tileSet = await loadCampaignTileSet(campaignId);
  const campaignName = CAMPAIGNS.find((entry) => entry.id === campaignId)?.label || "Campaign";
  state.level = createEmptyLevel(campaignId, `${campaignName} - Level 1`);
  ensureLayerUiState();
  state.undoStack = [];
  state.redoStack = [];
  state.activeLayer = "water";
  state.paletteCategory = "all";
  state.selectedTile = 1;
  state.manualEdgeOverrides = new Set();
  state.dragging = false;
  state.dragStart = null;
  state.brushRectDrag = false;
  state.dragRectPreview = null;
  ui.levelNameInput.value = state.level.name;
  ui.campaignSelect.value = campaignId;

  buildLayerControls();
  syncLayerTabs();
  syncPaletteCategorySelect();
  renderPalette();
  updateTileInfo();
  render();
  setStatus(`New ${campaignId} level ready`);
}

function changeZoom(nextZoom) {
  state.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, nextZoom));
  updateCanvasDimensions();
  render();
}

function togglePropertiesPanel() {
  state.propertiesVisible = !state.propertiesVisible;
  ui.propertiesPanel.style.display = state.propertiesVisible ? "block" : "none";
}

function wireEvents() {
  ui.canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  ui.canvas.addEventListener("mousedown", handlePointerDown);
  ui.canvas.addEventListener("mousemove", handlePointerMove);
  window.addEventListener("mouseup", handlePointerUp);

  ui.newLevelBtn.addEventListener("click", async () => {
    await newLevel(ui.campaignSelect.value);
  });

  ui.campaignSelect.addEventListener("change", async (event) => {
    await newLevel(event.target.value);
  });

  ui.paletteCategorySelect.addEventListener("change", (event) => {
    state.paletteCategory = event.target.value || "all";
    renderPalette();
    updateTileInfo();
    render();
  });

  ui.levelNameInput.addEventListener("input", () => {
    state.level.name = ui.levelNameInput.value.trim() || "Untitled Level";
  });

  ui.saveBtn.addEventListener("click", () => {
    download(`${state.level.campaign}_level.json`, serializeLevel(true));
    setStatus("Saved JSON level");
  });

  ui.exportBtn.addEventListener("click", () => {
    download(`${state.level.campaign}_level_export.json`, serializeLevel(false));
    setStatus("Exported compact JSON level");
  });

  ui.loadBtn.addEventListener("click", () => {
    ui.fileInput.click();
  });

  ui.fileInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await loadLevelFromObject(parsed);
      setStatus(`Loaded ${file.name}`);
    } catch (error) {
      setStatus(`Load failed: ${error.message}`);
    }
  });

  ui.undoBtn.addEventListener("click", undo);
  ui.redoBtn.addEventListener("click", redo);

  ui.gridBtn.addEventListener("click", () => {
    state.showGrid = !state.showGrid;
    ui.gridBtn.setAttribute("aria-pressed", String(state.showGrid));
    render();
  });

  ui.zoomRange.addEventListener("input", () => {
    changeZoom(Number(ui.zoomRange.value) / 100);
  });

  ui.shell.addEventListener("wheel", (event) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    changeZoom(state.zoom + direction * ZOOM_STEP);
  }, { passive: false });

  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (event.ctrlKey && key === "g") {
      event.preventDefault();
      state.showGrid = !state.showGrid;
      ui.gridBtn.setAttribute("aria-pressed", String(state.showGrid));
      render();
      return;
    }

    if (event.ctrlKey && key === "z") {
      event.preventDefault();
      undo();
      return;
    }

    if ((event.ctrlKey && key === "y") || (event.ctrlKey && event.shiftKey && key === "z")) {
      event.preventDefault();
      redo();
      return;
    }

    if (event.ctrlKey && key === "s") {
      event.preventDefault();
      download(`${state.level.campaign}_level.json`, serializeLevel(true));
      setStatus("Saved JSON level");
      return;
    }

    if (key === "p") {
      event.preventDefault();
      togglePropertiesPanel();
      return;
    }

    if (key === "v") {
      setTool("select");
      return;
    }

    if (key === "b") {
      setTool("paint");
      return;
    }

    if (key === "e") {
      setTool("eraser");
      return;
    }

    if (key === "g") {
      setTool("fill");
      return;
    }

    if (key === "r") {
      setTool("rect");
      return;
    }

    if (key === "l") {
      setTool("line");
      return;
    }

    if (key === "s") {
      setTool("stamp");
      return;
    }

    if (key === "n") {
      setTool("entity");
      return;
    }
  });
}

async function init() {
  buildCampaignSelect();
  buildToolButtons();
  buildLayerTabs();
  syncPaletteCategorySelect();
  updateCanvasDimensions();
  wireEvents();
  window.__openArcadeAutoTileSelfTest = runAutoEdgeSelfTest;
  const autoTileSelfTest = runAutoEdgeSelfTest();
  if (!autoTileSelfTest.passed) {
    console.warn("[editor:auto-tiling] self-test failures", autoTileSelfTest.failures);
  } else {
    console.info(`[editor:auto-tiling] self-test passed (${autoTileSelfTest.total})`);
  }
  await newLevel(DEFAULT_CAMPAIGN);
}

init().catch((error) => {
  setStatus(`Editor init failed: ${error.message}`);
});
