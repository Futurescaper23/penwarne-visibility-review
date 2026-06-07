const state = {
  projects: [],
  project: null,
  tab: "overview",
  layerMode: "single",
  primaryLayer: "ortho",
  secondaryLayer: "dsm",
  opacity: 55,
  swipe: 50,
  scale: 1,
  panX: 0,
  panY: 0,
  isPanning: false,
  isSwiping: false,
  startX: 0,
  startY: 0,
  startPanX: 0,
  startPanY: 0,
  panoLoaded: false,
  panoViewer: null,
  selectedReferenceId: null,
  selectedViewportId: null,
  selectedShedId: null,
  modal: {
    scale: 1,
    panX: 0,
    panY: 0,
    isPanning: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0
  }
};

const els = {};
let viewerChannel = null;

const layerLabels = {
  ortho: "Orthomosaic",
  dsm: "DSM surface model",
  contour: "Contours"
};

function $(id) {
  return document.getElementById(id);
}

function create(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function assetUrl(name) {
  return `${state.project.assetBase}/${state.project.assets[name]}`;
}

function twinmotionUrl(item) {
  const basePath = item.basePath || state.project.twinmotion.basePath;
  return `${basePath}/${item.file}`;
}

function comparisonUrl(item) {
  const basePath = item.basePath || "projects/confidential-rural-site/viewpoints";
  return `${basePath}/${item.file}`;
}

function parseViewerHash() {
  const hash = window.location.hash || "";
  if (!hash.startsWith("#viewer?")) return null;

  const query = new URLSearchParams(hash.slice("#viewer?".length));
  const src = query.get("src");
  if (!src) return null;

  return {
    src,
    title: query.get("title") || "Planning Evidence Image",
    note: query.get("note") || query.get("caption") || "",
    compare: query.get("src2")
      ? {
          src: query.get("src2"),
          title: query.get("title2") || "Comparison Image",
          label: query.get("label2") || "Comparison"
        }
      : null,
    label: query.get("label") || "Image"
  };
}

function clearViewerHash() {
  if (!window.location.hash.startsWith("#viewer?")) return;
  history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
}

function syncModalFromHash() {
  const payload = parseViewerHash();
  if (payload) {
    openImageModal(payload.src, payload.title, { note: payload.note, fromHash: true });
  } else if (els.imageModal?.classList.contains("open")) {
    closeImageModal({ keepHash: true });
  }
}

function openModalFromPayload(payload) {
  if (!payload?.src) return;
  if (payload.requestId) {
    try {
      localStorage.setItem("planning-image-viewer-ack", JSON.stringify({
        requestId: payload.requestId,
        ts: Date.now()
      }));
    } catch {
      // Ignore acknowledgement failures.
    }
  }
  openImageModal(payload.src, payload.title || "Planning Evidence Image", {
    note: payload.note || payload.caption || "",
    label: payload.label || "Image",
    compare: payload.compare || null
  });
}

function registerViewerBridge() {
  if (typeof BroadcastChannel !== "undefined") {
    viewerChannel = new BroadcastChannel("planning-image-viewer");
    viewerChannel.addEventListener("message", (event) => {
      openModalFromPayload(event.data);
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key !== "planning-image-viewer" || !event.newValue) return;

    try {
      const payload = JSON.parse(event.newValue);
      openModalFromPayload(payload);
    } catch {
      // Ignore malformed bridge payloads.
    }
  });
}

async function loadProjects() {
  const response = await fetch("data/projects.json");
  if (!response.ok) {
    throw new Error("Project data could not be loaded.");
  }

  const data = await response.json();
  state.projects = data.projects || [];
  state.project = state.projects[0];
}

function cacheElements() {
  [
    "projectTitle",
    "projectSummary",
    "heroBrandName",
    "heroBrandSub",
    "heroEyebrow",
    "heroSiteValue",
    "heroClientValue",
    "heroVisualTitle",
    "heroVisualNote",
    "explorePackBtn",
    "heroExistingModelLink",
    "heroProposedModelLink",
    "planningQuestion",
    "decisionLine",
    "workflowList",
    "metricGrid",
    "overviewSectionGrid",
    "sceneExistingModelLink",
    "sceneProposedModelLink",
    "vistaPanel",
    "sceneVistaLink",
    "sceneVistaFrame",
    "viewportSummary",
    "viewportMetricBar",
    "comparisonStage",
    "existingThumbGrid",
    "viewportThumbGrid",
    "shedViewGrid",
    "shedFeaturedMedia",
    "shedFeaturedImg",
    "shedFeaturedTitle",
    "shedFeaturedNote",
    "shedPrevBtn",
    "shedNextBtn",
    "singleModeBtn",
    "sliderModeBtn",
    "transparencyModeBtn",
    "zoomOutBtn",
    "zoomInBtn",
    "resetViewBtn",
    "fullscreenMapBtn",
    "layerWorkspace",
    "imageStage",
    "singleLayer",
    "baseLayer",
    "blendLayer",
    "swipeLayer",
    "swipeHandle",
    "singleImg",
    "baseImg",
    "blendImg",
    "swipeImg",
    "primaryLayerSelect",
    "secondaryLayerSelect",
    "opacityRange",
    "zoomValue",
    "layerCaption",
    "loadPanoBtn",
    "panoramaViewer",
    "methodGrid",
    "downloadList",
    "imageModal",
    "imageModalShell",
    "modalTitle",
    "modalStage",
    "modalImg",
    "modalCompare",
    "modalCompareImgA",
    "modalCompareImgB",
    "modalCompareLabelA",
    "modalCompareLabelB",
    "modalInfo",
    "modalNote",
    "modalZoomOutBtn",
    "modalZoomInBtn",
    "modalResetBtn",
    "modalFullscreenBtn",
    "modalCloseBtn",
    "modalZoomValue"
  ].forEach((id) => {
    els[id] = $(id);
  });
}

function productName() {
  return state.project.productName || "SiteView Visibility Review";
}

function productTagline() {
  return state.project.heroLine || "Drone mapping, 3D models, viewpoint review and interactive map layers for early-stage site reconnaissance.";
}

function setLink(element, href, fallbackText) {
  if (href) {
    element.href = href;
    element.removeAttribute("aria-disabled");
    element.textContent = fallbackText;
  } else {
    element.href = "#";
    element.setAttribute("aria-disabled", "true");
    element.textContent = "Add Link";
  }
}

function renderHero() {
  const heroAssetName = state.project.assets.heroShell ? "heroShell" : (state.project.assets.hero ? "hero" : "ortho");
  const heroTitle = productName();
  const heroNote = "Drone mapping, 3D models, viewpoint review and interactive terrain layers in one early-stage visibility review pack.";
  const visualSrc = assetUrl(heroAssetName);
  const heroImage = document.querySelector("[data-fs-hero-image]");

  els.heroBrandName.textContent = "FutureScaping Labs";
  els.heroBrandSub.textContent = "SiteView Platform";
  els.heroEyebrow.textContent = "Planning Evidence System";
  els.projectTitle.textContent = productName();
  els.projectSummary.textContent = productTagline();
  els.heroSiteValue.textContent = state.project.site || "";
  els.heroClientValue.textContent = `${state.project.client || ""}${state.project.status ? ` | ${state.project.status}` : ""}`;
  if (heroImage) {
    heroImage.src = visualSrc;
    heroImage.alt = heroTitle;
  }
  els.heroVisualTitle.textContent = heroTitle;
  els.heroVisualNote.textContent = heroNote;

  setLink(els.heroExistingModelLink, state.project.existingModelUrl, "Open Baseline Model");
  setLink(els.heroProposedModelLink, state.project.proposedModelUrl || state.project.modelUrl, "Open 3D Scene");
}

function renderOverview() {
  els.planningQuestion.textContent = state.project.planningQuestion;
  els.decisionLine.textContent = state.project.decisionLine;
  els.workflowList.innerHTML = "";
  els.metricGrid.innerHTML = "";
  els.overviewSectionGrid.innerHTML = "";

  state.project.workflow.forEach((item, index) => {
    const row = create("div", "workflow-item");
    row.append(create("span", "workflow-index", String(index + 1)));
    row.append(create("div", "", item));
    els.workflowList.append(row);
  });

  state.project.metrics.forEach((metric) => {
    const card = create("article", "metric-card");
    card.append(create("p", "eyebrow", metric.label));
    card.append(create("strong", "", metric.value));
    card.append(create("p", "muted", metric.detail));
    els.metricGrid.append(card);
  });

  (state.project.overviewSections || []).forEach((section) => {
    const card = create("article", "overview-section-card");
    card.append(create("h3", "", section.title));
    card.append(create("p", "muted", section.body));
    els.overviewSectionGrid.append(card);
  });
}

function renderScene() {
  setLink(els.sceneExistingModelLink, state.project.existingModelUrl, "Open Existing Model");
  setLink(els.sceneProposedModelLink, state.project.proposedModelUrl || state.project.modelUrl, "Open Proposed Model");

  if (state.project.vistaUrl) {
    els.vistaPanel.classList.remove("scene-vista--hidden");
    els.sceneVistaLink.href = state.project.vistaUrl;
    els.sceneVistaLink.removeAttribute("aria-disabled");
    els.sceneVistaFrame.src = state.project.vistaUrl;
  } else {
    els.vistaPanel.classList.add("scene-vista--hidden");
    els.sceneVistaLink.href = "#";
    els.sceneVistaLink.setAttribute("aria-disabled", "true");
    els.sceneVistaFrame.removeAttribute("src");
  }
}

function visualCard(item, className = "", meta = {}) {
  const classes = ["visual-card"];
  if (className) classes.push(className);
  if (meta.featured) classes.push("visual-card--featured");
  if (meta.tall) classes.push("visual-card--tall");

  const card = create("article", classes.join(" "));
  const media = create("button", "visual-card__media");
  const image = create("img");
  const body = create("div", "visual-card__body");
  const src = twinmotionUrl(item);

  image.src = src;
  image.alt = item.title;
  image.loading = "lazy";
  image.decoding = "async";

  media.type = "button";
  media.setAttribute("aria-label", `Open ${item.title}`);
  media.addEventListener("click", () => openImageModal(src, item.title, { note: item.note }));
  media.append(image);

  body.append(create("h3", "", item.title));
  if (meta.kicker) {
    body.append(create("p", "eyebrow", meta.kicker));
  }
  body.append(create("p", "muted", item.note));
  card.append(media, body);
  return card;
}

function renderShedGallery() {
  const shedViews = state.project.twinmotion.shedViews;
  const selected = shedViews.find((item) => item.id === state.selectedShedId) || shedViews[0];
  state.selectedShedId = selected.id;

  const selectedIndex = shedViews.findIndex((item) => item.id === selected.id);
  const selectedSrc = twinmotionUrl(selected);
  const shortTitle = selected.title.replace("Detailed Shed Visual ", "Visual ");

  els.shedFeaturedImg.src = selectedSrc;
  els.shedFeaturedImg.alt = selected.title;
  els.shedFeaturedTitle.textContent = shortTitle;
  els.shedFeaturedNote.textContent = "";
  els.shedFeaturedMedia.onclick = () => openImageModal(selectedSrc, selected.title, { note: selected.note });

  els.shedViewGrid.innerHTML = "";

  shedViews.forEach((item, index) => {
    const thumb = create("button", "shed-thumb");
    const img = create("img");
    const badge = create("span", "shed-thumb__badge", String(index + 1).padStart(2, "0"));
    const copy = create("div", "shed-thumb__copy");
    const src = twinmotionUrl(item);

    img.src = src;
    img.alt = item.title;
    img.loading = "lazy";
    img.decoding = "async";

    copy.append(create("strong", "", item.title.replace("Detailed Shed Visual ", "Visual ")));
    copy.append(create("span", "", index === 0 ? "Hero angle" : index < 5 ? "Primary review" : "Supporting still"));

    thumb.type = "button";
    thumb.classList.toggle("active", item.id === state.selectedShedId);
    thumb.addEventListener("click", () => {
      state.selectedShedId = item.id;
      renderShedGallery();
    });
    thumb.append(img, badge, copy);
    els.shedViewGrid.append(thumb);
  });

  els.shedPrevBtn.disabled = selectedIndex <= 0;
  els.shedNextBtn.disabled = selectedIndex >= shedViews.length - 1;
}

function buildViewportCard(item, options) {
  const card = create("article", "viewport-map-card");
  const media = create("button", "selected-viewport__media");
  const image = create("img");
  const body = create("div", "selected-viewport__body");
  const meta = create("div", "selected-viewport__meta");
  const badge = create("span", "selected-viewport__badge", options.badge);
  const stats = create("div", "selected-viewport__stats");
  const primaryStat = create("div", "selected-stat");
  const secondaryStat = create("div", "selected-stat");
  const src = twinmotionUrl(item);

  image.src = src;
  image.alt = item.title;
  image.decoding = "async";
  media.type = "button";
  media.setAttribute("aria-label", `Open ${item.title}`);
  media.addEventListener("click", () => openImageModal(src, item.title, { note: item.note }));

  primaryStat.append(create("span", "", options.statLabel));
  primaryStat.append(create("strong", "", options.statValue));
  secondaryStat.append(create("span", "", options.secondaryStatLabel));
  secondaryStat.append(create("strong", "", options.secondaryStatValue));

  stats.append(primaryStat, secondaryStat);
  meta.append(badge);
  media.append(image, meta, stats);

  body.append(create("p", "eyebrow", options.eyebrow));
  body.append(create("h3", "", item.title));
  body.append(create("p", "muted", item.note));

  card.append(media, body);
  return card;
}

function buildComparisonFigure(item, options) {
  const figure = create("button", "comparison-figure");
  const image = create("img");
  const label = create("span", "comparison-figure__label", options.label);
  const src = comparisonUrl(item);

  figure.type = "button";
  figure.setAttribute("aria-label", `Open ${item.title}`);
  figure.addEventListener("click", () => openImageModal(src, item.title, { note: item.note }));

  image.src = src;
  image.alt = item.title;
  image.loading = "lazy";
  image.decoding = "async";

  figure.append(image, label);
  return figure;
}

function buildComparisonStage(referenceItem) {
  const panel = create("article", "comparison-panel");
  const header = create("div", "comparison-panel__header");
  const body = create("div", "comparison-panel__body");
  const summary = create("div", "comparison-panel__summary");
  const comparisonItem = referenceItem.comparison
    ? {
        title: referenceItem.comparison.title,
        file: referenceItem.comparison.file,
        basePath: referenceItem.comparison.basePath,
        note: referenceItem.comparison.note
      }
    : null;
  const combinedNotes = [referenceItem.note, comparisonItem?.note].filter(Boolean).join(" ");

  header.append(create("p", "eyebrow", "Selected Viewpoint"));
  header.append(create("h3", "", comparisonItem ? `${referenceItem.title} comparison` : referenceItem.title));
  header.append(create("p", "muted", comparisonItem
    ? "Existing and proposed views are paired here at a bigger scale so the difference reads immediately."
    : "This viewpoint is currently shown as a single large reference image. Add a matching proposed render and it will drop into the same comparison layout."));

  body.append(buildComparisonFigure(referenceItem, { label: "Existing" }));
  if (comparisonItem) {
    body.append(buildComparisonFigure(comparisonItem, { label: "Proposed" }));
    body.classList.add("comparison-panel__body--split");
  } else {
    body.classList.add("comparison-panel__body--single");
  }

  summary.append(create("p", "eyebrow", comparisonItem ? "Comparison Note" : "Reference Note"));
  summary.append(create("p", "comparison-panel__note", comparisonItem
    ? combinedNotes
    : referenceItem.note));

  const mapDrawer = create("aside", "comparison-map-drawer");
  const mapHandle = create("button", "comparison-map-drawer__handle");
  const mapPanel = create("div", "comparison-map-drawer__panel");
  const mapButton = create("button", "comparison-map-drawer__media");
  const mapImage = create("img");
  const mapCopy = create("div", "comparison-map-drawer__copy");
  const mapSrc = "projects/confidential-rural-site/viewpoints/3D Map V2.png";

  mapHandle.type = "button";
  mapHandle.setAttribute("aria-label", "Reveal 3D viewpoint orientation map");
  mapHandle.append(create("span", "", "3D Map"));

  mapButton.type = "button";
  mapButton.setAttribute("aria-label", "Open 3D viewpoint orientation map");
  mapButton.addEventListener("click", () => openImageModal(mapSrc, "3D Viewpoint Orientation Map", {
    note: "Use this map to understand where each viewpoint is taken from and the general direction of view back towards the site."
  }));

  mapImage.src = mapSrc;
  mapImage.alt = "3D viewpoint orientation map";
  mapImage.loading = "lazy";
  mapImage.decoding = "async";

  mapCopy.append(create("p", "eyebrow", "3D Orientation Map"));
  mapCopy.append(create("h3", "", "View direction reference"));
  mapCopy.append(create("p", "muted", "Hover this tab when you want a quick reminder of where the viewpoints are taken from and the direction they look towards the site."));

  mapButton.append(mapImage);
  mapPanel.append(mapButton, mapCopy);
  mapDrawer.append(mapHandle, mapPanel);
  panel.append(mapDrawer);

  panel.append(header, body, summary);
  return panel;
}

function renderViewports() {
  const referenceViews = state.project.referenceViews || { summary: "", views: [] };
  const proposedViews = state.project.twinmotion;
  const selectedReference = referenceViews.views.find((item) => item.id === state.selectedReferenceId) || referenceViews.views[0];

  state.selectedReferenceId = selectedReference ? selectedReference.id : null;

  els.viewportSummary.textContent = proposedViews.summary;
  els.viewportMetricBar.innerHTML = "";
  els.comparisonStage.innerHTML = "";
  els.existingThumbGrid.innerHTML = "";
  els.viewportThumbGrid.innerHTML = "";

  [
    { value: String(referenceViews.views.length), label: "Existing Views" },
    { value: String(proposedViews.viewpoints.length), label: "Proposed Views" },
    { value: String(proposedViews.shedViews.length), label: "Shed Visuals" }
  ].forEach((metric) => {
    const card = create("article", "viewport-metric");
    card.append(create("strong", "", metric.value));
    card.append(create("span", "", metric.label));
    els.viewportMetricBar.append(card);
  });

  if (selectedReference) {
    els.comparisonStage.append(buildComparisonStage(selectedReference));
  }

  referenceViews.views.forEach((item) => {
    const thumb = create("button", "viewport-thumb");
    const image = create("img");
    const label = create("span", "", item.shortLabel || item.title.replace("Existing View ", ""));
    const src = twinmotionUrl(item);

    image.src = src;
    image.alt = item.title;
    image.loading = "lazy";
    image.decoding = "async";
    thumb.type = "button";
    thumb.classList.toggle("active", item.id === state.selectedReferenceId);
    thumb.setAttribute("aria-label", `Select ${item.title}`);
    thumb.addEventListener("click", () => {
      state.selectedReferenceId = item.id;
      renderViewports();
    });
    thumb.append(image, label);
    els.existingThumbGrid.append(thumb);
  });

  proposedViews.viewpoints.forEach((item) => {
    const thumb = create("button", "viewport-thumb");
    const image = create("img");
    const label = create("span", "", item.shortLabel || item.title.replace("Proposed View ", ""));
    const src = twinmotionUrl(item);

    image.src = src;
    image.alt = item.title;
    image.loading = "lazy";
    image.decoding = "async";
    thumb.type = "button";
    thumb.setAttribute("aria-label", `Open ${item.title}`);
    thumb.addEventListener("click", () => {
      state.selectedViewportId = item.id;
      openImageModal(src, item.title, { note: item.note });
    });
    thumb.append(image, label);
    els.viewportThumbGrid.append(thumb);
  });
}

function setLayerMode(mode) {
  state.layerMode = mode;
  [els.singleModeBtn, els.sliderModeBtn, els.transparencyModeBtn].forEach((button) => {
    button.classList.toggle("active", button.id.toLowerCase().startsWith(mode));
  });

  els.singleLayer.classList.toggle("active", mode === "single");
  els.baseLayer.classList.toggle("active", mode !== "single");
  els.blendLayer.classList.toggle("active", mode === "transparency");
  els.swipeLayer.classList.toggle("active", mode === "slider");
  els.swipeHandle.classList.toggle("active", mode === "slider");
  updateLayers();
}

function updateLayers() {
  state.primaryLayer = els.primaryLayerSelect.value;
  state.secondaryLayer = els.secondaryLayerSelect.value;
  state.opacity = Number(els.opacityRange.value);

  els.singleImg.src = assetUrl(state.primaryLayer);
  els.baseImg.src = assetUrl(state.primaryLayer);
  els.blendImg.src = assetUrl(state.secondaryLayer);
  els.swipeImg.src = assetUrl(state.secondaryLayer);

  els.blendLayer.style.opacity = String(state.opacity / 100);
  els.imageStage.style.setProperty("--swipe", `${state.swipe}%`);
  applyViewTransform();

  const primary = layerLabels[state.primaryLayer];
  const secondary = layerLabels[state.secondaryLayer];
  els.layerCaption.textContent = state.layerMode === "single"
    ? `${primary} inspection. Wheel to zoom, then drag to pan.`
    : `${primary} compared with ${secondary}. Wheel to zoom, drag the image to pan, or drag the slider handle in slider mode.`;
}

function applyViewTransform() {
  const scale = String(state.scale);
  const panX = `${state.panX}px`;
  const panY = `${state.panY}px`;

  els.imageStage.style.setProperty("--scale", scale);
  els.imageStage.style.setProperty("--pan-x", panX);
  els.imageStage.style.setProperty("--pan-y", panY);
  els.imageStage.classList.toggle("is-panning", state.isPanning);
  els.imageStage.classList.toggle("is-zoomed", state.scale > 1);
  els.zoomValue.textContent = `${Math.round(state.scale * 100)}%`;
}

function clampPan() {
  const rect = els.imageStage.getBoundingClientRect();
  const maxX = Math.max(0, ((rect.width * state.scale) - rect.width) / 2);
  const maxY = Math.max(0, ((rect.height * state.scale) - rect.height) / 2);
  state.panX = Math.max(-maxX, Math.min(maxX, state.panX));
  state.panY = Math.max(-maxY, Math.min(maxY, state.panY));
}

function setMapScale(nextScale) {
  state.scale = Math.max(1, Math.min(6, nextScale));
  clampPan();
  applyViewTransform();
}

function resetView() {
  state.scale = 1;
  state.panX = 0;
  state.panY = 0;
  state.swipe = 50;
  updateLayers();
}

function setMapFallbackFullscreen(isFullscreen) {
  els.layerWorkspace.classList.toggle("is-fullscreen", isFullscreen);
  document.body.classList.toggle("fullscreen-locked", isFullscreen);
}

async function enterNativeFullscreen(element) {
  if (!element.requestFullscreen) return false;

  try {
    await element.requestFullscreen({ navigationUI: "hide" });
    return true;
  } catch {
    return false;
  }
}

async function exitNativeFullscreen() {
  if (!document.fullscreenElement || !document.exitFullscreen) return false;

  try {
    await document.exitFullscreen();
    return true;
  } catch {
    return false;
  }
}

async function toggleMapFullscreen() {
  if (document.fullscreenElement === els.layerWorkspace) {
    await exitNativeFullscreen();
  } else if (els.layerWorkspace.classList.contains("is-fullscreen")) {
    setMapFallbackFullscreen(false);
  } else {
    const enteredNativeFullscreen = await enterNativeFullscreen(els.layerWorkspace);
    if (!enteredNativeFullscreen) {
      setMapFallbackFullscreen(true);
    }
  }

  updateFullscreenButtons();
  requestAnimationFrame(() => {
    clampPan();
    applyViewTransform();
  });
}

function updateFullscreenButtons() {
  const mapFullscreen = document.fullscreenElement === els.layerWorkspace || els.layerWorkspace.classList.contains("is-fullscreen");
  const modalFullscreen = document.fullscreenElement === els.imageModalShell || els.imageModalShell.classList.contains("is-fullscreen");
  els.fullscreenMapBtn.textContent = mapFullscreen ? "Exit Full Screen" : "Make Full Screen";
  els.fullscreenMapBtn.classList.toggle("is-active", mapFullscreen);
  els.modalFullscreenBtn.textContent = modalFullscreen ? "Exit Full Screen" : "Make Full Screen";
  els.modalFullscreenBtn.classList.toggle("is-active", modalFullscreen);
}

function applyModalTransform() {
  if (els.modalStage.classList.contains("is-compare")) {
    els.modalStage.classList.remove("is-panning");
    els.modalZoomValue.textContent = "Compare";
    return;
  }
  els.modalStage.style.setProperty("--modal-scale", String(state.modal.scale));
  els.modalStage.style.setProperty("--modal-pan-x", `${state.modal.panX}px`);
  els.modalStage.style.setProperty("--modal-pan-y", `${state.modal.panY}px`);
  els.modalStage.classList.toggle("is-panning", state.modal.isPanning);
  els.modalZoomValue.textContent = `${Math.round(state.modal.scale * 100)}%`;
}

function clampModalPan() {
  const rect = els.modalStage.getBoundingClientRect();
  const maxX = Math.max(0, ((rect.width * state.modal.scale) - rect.width) / 2);
  const maxY = Math.max(0, ((rect.height * state.modal.scale) - rect.height) / 2);
  state.modal.panX = Math.max(-maxX, Math.min(maxX, state.modal.panX));
  state.modal.panY = Math.max(-maxY, Math.min(maxY, state.modal.panY));
}

function setModalScale(nextScale) {
  state.modal.scale = Math.max(1, Math.min(8, nextScale));
  clampModalPan();
  applyModalTransform();
}

function resetModalView() {
  state.modal.scale = 1;
  state.modal.panX = 0;
  state.modal.panY = 0;
  applyModalTransform();
}

function openImageModal(src, title, options = {}) {
  els.modalTitle.textContent = title;
  const compare = options.compare || null;
  const note = options.note || "";

  els.modalStage.classList.toggle("is-compare", Boolean(compare));
  els.modalCompare.hidden = !compare;

  if (compare) {
    els.modalImg.removeAttribute("src");
    els.modalImg.alt = "";
    els.modalCompareImgA.src = src;
    els.modalCompareImgA.alt = title;
    els.modalCompareImgB.src = compare.src;
    els.modalCompareImgB.alt = compare.title || "Comparison Image";
    els.modalCompareLabelA.textContent = options.label || "View 4";
    els.modalCompareLabelB.textContent = compare.label || "View 5";
    els.modalCompareImgA.onclick = () => openImageModal(src, options.label || title, { note, label: options.label || "Image" });
    els.modalCompareImgB.onclick = () => openImageModal(compare.src, compare.title || "Comparison Image", {
      note,
      label: compare.label || "Image"
    });
  } else {
    els.modalImg.src = src;
    els.modalImg.alt = title;
    els.modalCompare.hidden = true;
    els.modalCompareImgA.removeAttribute("src");
    els.modalCompareImgB.removeAttribute("src");
    els.modalCompareImgA.onclick = null;
    els.modalCompareImgB.onclick = null;
    els.modalCompareLabelA.textContent = "View 4";
    els.modalCompareLabelB.textContent = "View 5";
  }

  els.modalInfo.hidden = !note;
  els.modalNote.textContent = note;
  [els.modalZoomOutBtn, els.modalZoomInBtn, els.modalResetBtn].forEach((button) => {
    button.hidden = Boolean(compare);
  });
  els.imageModal.classList.add("open");
  els.imageModal.setAttribute("aria-hidden", "false");
  resetModalView();
}

async function closeImageModal(options = {}) {
  els.imageModal.classList.remove("open");
  els.imageModal.setAttribute("aria-hidden", "true");
  els.imageModalShell.classList.remove("is-fullscreen");
  els.modalStage.classList.remove("is-compare");
  els.modalImg.removeAttribute("src");
  els.modalCompare.hidden = true;
  els.modalCompareImgA.removeAttribute("src");
  els.modalCompareImgB.removeAttribute("src");
  els.modalCompareImgA.onclick = null;
  els.modalCompareImgB.onclick = null;
  els.modalCompareLabelA.textContent = "View 4";
  els.modalCompareLabelB.textContent = "View 5";
  els.modalInfo.hidden = true;
  els.modalNote.textContent = "";
  [els.modalZoomOutBtn, els.modalZoomInBtn, els.modalResetBtn].forEach((button) => {
    button.hidden = false;
  });

  if (document.fullscreenElement === els.imageModalShell) {
    await exitNativeFullscreen();
  }
  if (!options.keepHash) {
    clearViewerHash();
  }
  updateFullscreenButtons();
}

async function toggleModalFullscreen() {
  if (document.fullscreenElement === els.imageModalShell) {
    await exitNativeFullscreen();
  } else if (els.imageModalShell.classList.contains("is-fullscreen")) {
    els.imageModalShell.classList.remove("is-fullscreen");
  } else {
    const enteredNativeFullscreen = await enterNativeFullscreen(els.imageModalShell);
    if (!enteredNativeFullscreen) {
      els.imageModalShell.classList.add("is-fullscreen");
    }
  }

  updateFullscreenButtons();
  requestAnimationFrame(() => {
    clampModalPan();
    applyModalTransform();
  });
}

function renderMethod() {
  els.methodGrid.innerHTML = "";

  Object.entries(state.project.method).forEach(([label, value]) => {
    const card = create("article", "method-card");
    const title = label.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
    card.append(create("h3", "", title));
    card.append(create("p", "muted", value));
    els.methodGrid.append(card);
  });
}

function renderDownloads() {
  els.downloadList.innerHTML = "";

  state.project.downloads.forEach((download) => {
    const item = create("div", "download-item");
    const copy = create("div", "download-copy");
    const isArchive = /\.zip$/i.test(download.href);
    const link = create("a", "button", isArchive ? "Download" : "Open");
    link.href = download.href;
    if (isArchive) {
      link.setAttribute("download", "");
    }

    copy.append(create("h3", "", download.label));
    copy.append(create("p", "muted", download.note));
    item.append(copy, link);
    els.downloadList.append(item);
  });
}

function renderAll() {
  renderHero();
  renderOverview();
  renderScene();
  renderViewports();
  renderShedGallery();
  renderMethod();
  renderDownloads();
  setLayerMode(state.layerMode);
  resetView();

  if (state.panoViewer) {
    state.panoViewer.destroy?.();
    state.panoViewer = null;
    state.panoLoaded = false;
    els.panoramaViewer.innerHTML = '<p class="muted">Load the panorama when you need the full site context.</p>';
  }
}

function switchTab(tabName) {
  state.tab = tabName;

  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === tabName);
  });

  document.querySelectorAll(".fs-shell__nav-item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tabTarget === tabName);
  });
}

function loadPanorama() {
  if (state.panoLoaded) return;

  els.panoramaViewer.innerHTML = "";
  state.panoViewer = pannellum.viewer("panoramaViewer", {
    type: "equirectangular",
    panorama: assetUrl("panorama"),
    autoLoad: true,
    showControls: true,
    compass: false,
    hfov: 100
  });
  state.panoLoaded = true;
}

function wireJumpButtons() {
  document.querySelectorAll("[data-tab-target]").forEach((button) => {
    button.addEventListener("click", () => {
      switchTab(button.dataset.tabTarget);
      document.querySelector("main")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  els.explorePackBtn.addEventListener("click", () => {
    switchTab("overview");
    document.querySelector("main")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function wireEvents() {
  wireJumpButtons();
  window.addEventListener("hashchange", syncModalFromHash);

  els.singleModeBtn.addEventListener("click", () => setLayerMode("single"));
  els.sliderModeBtn.addEventListener("click", () => setLayerMode("slider"));
  els.transparencyModeBtn.addEventListener("click", () => setLayerMode("transparency"));
  els.zoomOutBtn.addEventListener("click", () => setMapScale(state.scale / 1.2));
  els.zoomInBtn.addEventListener("click", () => setMapScale(state.scale * 1.2));
  els.resetViewBtn.addEventListener("click", resetView);
  els.fullscreenMapBtn.addEventListener("click", toggleMapFullscreen);
  els.primaryLayerSelect.addEventListener("change", updateLayers);
  els.secondaryLayerSelect.addEventListener("change", updateLayers);
  els.opacityRange.addEventListener("input", updateLayers);
  els.loadPanoBtn.addEventListener("click", loadPanorama);
  els.shedPrevBtn.addEventListener("click", () => {
    const views = state.project.twinmotion.shedViews;
    const index = views.findIndex((item) => item.id === state.selectedShedId);
    if (index > 0) {
      state.selectedShedId = views[index - 1].id;
      renderShedGallery();
    }
  });
  els.shedNextBtn.addEventListener("click", () => {
    const views = state.project.twinmotion.shedViews;
    const index = views.findIndex((item) => item.id === state.selectedShedId);
    if (index < views.length - 1) {
      state.selectedShedId = views[index + 1].id;
      renderShedGallery();
    }
  });
  els.modalZoomOutBtn.addEventListener("click", () => setModalScale(state.modal.scale / 1.22));
  els.modalZoomInBtn.addEventListener("click", () => setModalScale(state.modal.scale * 1.22));
  els.modalResetBtn.addEventListener("click", resetModalView);
  els.modalFullscreenBtn.addEventListener("click", toggleModalFullscreen);
  els.modalCloseBtn.addEventListener("click", closeImageModal);
  document.addEventListener("fullscreenchange", updateFullscreenButtons);

  els.imageStage.addEventListener("wheel", (event) => {
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1.12 : 0.88;
    setMapScale(state.scale * direction);
  }, { passive: false });

  els.imageStage.addEventListener("pointerdown", (event) => {
    const handleRect = els.swipeHandle.getBoundingClientRect();
    const onHandle = state.layerMode === "slider"
      && event.clientX >= handleRect.left - 18
      && event.clientX <= handleRect.right + 18;

    if (onHandle) {
      state.isSwiping = true;
    } else {
      state.isPanning = true;
      state.startX = event.clientX;
      state.startY = event.clientY;
      state.startPanX = state.panX;
      state.startPanY = state.panY;
    }

    els.imageStage.setPointerCapture(event.pointerId);
    applyViewTransform();
  });

  els.imageStage.addEventListener("pointermove", (event) => {
    if (state.isSwiping) {
      const rect = els.imageStage.getBoundingClientRect();
      state.swipe = Math.max(4, Math.min(96, ((event.clientX - rect.left) / rect.width) * 100));
      updateLayers();
      return;
    }

    if (!state.isPanning) return;
    state.panX = state.startPanX + event.clientX - state.startX;
    state.panY = state.startPanY + event.clientY - state.startY;
    clampPan();
    applyViewTransform();
  });

  ["pointerup", "pointercancel"].forEach((eventName) => {
    els.imageStage.addEventListener(eventName, () => {
      state.isPanning = false;
      state.isSwiping = false;
      applyViewTransform();
    });
  });

  els.imageStage.addEventListener("dblclick", resetView);

  els.modalStage.addEventListener("wheel", (event) => {
    if (els.modalStage.classList.contains("is-compare")) return;
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1.14 : 0.88;
    setModalScale(state.modal.scale * direction);
  }, { passive: false });

  els.modalStage.addEventListener("pointerdown", (event) => {
    if (els.modalStage.classList.contains("is-compare")) return;
    state.modal.isPanning = true;
    state.modal.startX = event.clientX;
    state.modal.startY = event.clientY;
    state.modal.startPanX = state.modal.panX;
    state.modal.startPanY = state.modal.panY;
    els.modalStage.setPointerCapture(event.pointerId);
    applyModalTransform();
  });

  els.modalStage.addEventListener("pointermove", (event) => {
    if (els.modalStage.classList.contains("is-compare")) return;
    if (!state.modal.isPanning) return;
    state.modal.panX = state.modal.startPanX + event.clientX - state.modal.startX;
    state.modal.panY = state.modal.startPanY + event.clientY - state.modal.startY;
    clampModalPan();
    applyModalTransform();
  });

  ["pointerup", "pointercancel"].forEach((eventName) => {
    els.modalStage.addEventListener(eventName, () => {
      state.modal.isPanning = false;
      applyModalTransform();
    });
  });

  els.modalStage.addEventListener("dblclick", resetModalView);

  els.imageModal.addEventListener("click", (event) => {
    if (event.target === els.imageModal) {
      closeImageModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && els.imageModal.classList.contains("open")) {
      closeImageModal();
    }

    if (event.key === "Escape" && els.layerWorkspace.classList.contains("is-fullscreen")) {
      setMapFallbackFullscreen(false);
      updateFullscreenButtons();
    }
  });
}

async function init() {
  cacheElements();
  await loadProjects();
  registerViewerBridge();
  wireEvents();
  renderAll();
  syncModalFromHash();
}

init().catch((error) => {
  document.body.innerHTML = `<main class="shell"><article class="glass" style="padding:22px;"><h1>Planning pack could not load</h1><p class="muted">${error.message}</p></article></main>`;
});
