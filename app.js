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
  return `${state.project.twinmotion.basePath}/${item.file}`;
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
    "viewportSummary",
    "viewportMetricBar",
    "viewportMap",
    "selectedViewport",
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
  return state.project.productName || "SiteView Planning Evidence";
}

function productTagline() {
  return state.project.heroLine || "Drone mapping, 3D models, viewpoint evidence and interactive map layers for clearer planning decisions.";
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
  const heroNote = "Drone mapping, 3D models, viewpoint evidence and interactive terrain layers in one premium planning review pack.";
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
  media.addEventListener("click", () => openImageModal(src, item.title));
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

  els.shedFeaturedImg.src = selectedSrc;
  els.shedFeaturedImg.alt = selected.title;
  els.shedFeaturedTitle.textContent = selected.title;
  els.shedFeaturedNote.textContent = selected.note;
  els.shedFeaturedMedia.onclick = () => openImageModal(selectedSrc, selected.title);

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

function renderViewports() {
  const twinmotion = state.project.twinmotion;
  const selected = twinmotion.viewpoints.find((item) => item.id === state.selectedViewportId) || twinmotion.viewpoints[0];
  state.selectedViewportId = selected.id;
  const selectedLabel = selected.title.replace("Viewpoint ", "");
  const viewportMapSrc = state.project.assets.viewportDioramaMap
    ? assetUrl("viewportDioramaMap")
    : twinmotionUrl(twinmotion.overallMap);

  els.viewportSummary.textContent = twinmotion.summary;
  els.viewportMetricBar.innerHTML = "";
  els.viewportMap.innerHTML = "";
  els.selectedViewport.innerHTML = "";
  els.viewportThumbGrid.innerHTML = "";

  [
    { value: String(twinmotion.viewpoints.length), label: "Mapped Viewpoints" },
    { value: "A-J", label: "Camera Positions" },
    { value: selectedLabel, label: "Selected Review Image" }
  ].forEach((metric) => {
    const card = create("article", "viewport-metric");
    card.append(create("strong", "", metric.value));
    card.append(create("span", "", metric.label));
    els.viewportMetricBar.append(card);
  });

  const mapCard = create("article", "viewport-map-card");
  const mapMedia = create("div", "viewport-map-card__media");
  const mapFrame = create("div", "viewport-map-card__image-frame");
  const mapButton = create("button", "viewport-map-card__image-button");
  const mapImg = create("img");
  const hotspotLayer = create("div", "viewport-hotspot-layer");
  const mapBody = create("div", "viewport-map-card__body");
  const mapSrc = viewportMapSrc;

  mapImg.src = mapSrc;
  mapImg.alt = twinmotion.overallMap.title;
  mapImg.loading = "lazy";
  mapImg.decoding = "async";
  mapButton.type = "button";
  mapButton.setAttribute("aria-label", `Open ${twinmotion.overallMap.title}`);
  mapButton.addEventListener("click", () => openImageModal(mapSrc, twinmotion.overallMap.title));
  mapButton.append(mapImg);

  (twinmotion.mapHotspots || []).forEach((hotspot) => {
    const target = twinmotion.viewpoints.find((item) => item.id === hotspot.viewpointId);
    if (!target) return;

    const button = create("button", "viewport-hotspot");
    button.type = "button";
    button.style.left = `${hotspot.x}%`;
    button.style.top = `${hotspot.y}%`;
    button.setAttribute("aria-label", `Select ${target.title} from map`);
    button.title = target.title;
    button.addEventListener("click", () => {
      state.selectedViewportId = target.id;
      renderViewports();
    });
    hotspotLayer.append(button);
  });

  mapFrame.append(mapButton, hotspotLayer);
  mapMedia.append(mapFrame);
  const mapTag = create("span", "viewport-card-pill", "Site Context");
  mapBody.append(create("p", "eyebrow", "Mapped Cameras"));
  mapBody.append(create("h3", "", twinmotion.overallMap.title));
  mapBody.append(mapTag);
  mapBody.append(create("p", "muted", twinmotion.overallMap.note));
  mapCard.append(mapMedia, mapBody);
  els.viewportMap.append(mapCard);

  const selectedSrc = twinmotionUrl(selected);
  const selectedMedia = create("button", "selected-viewport__media");
  const selectedImg = create("img");
  const selectedBody = create("div", "selected-viewport__body");
  const selectedMeta = create("div", "selected-viewport__meta");
  const selectedBadge = create("span", "selected-viewport__badge", selected.title.replace("Viewpoint ", ""));
  const selectedStats = create("div", "selected-viewport__stats");
  const bearingStat = create("div", "selected-stat");
  const distanceStat = create("div", "selected-stat");

  selectedImg.src = selectedSrc;
  selectedImg.alt = selected.title;
  selectedImg.decoding = "async";
  selectedMedia.type = "button";
  selectedMedia.setAttribute("aria-label", `Open ${selected.title}`);
  selectedMedia.addEventListener("click", () => openImageModal(selectedSrc, selected.title));
  bearingStat.append(create("span", "", "Bearing"));
  bearingStat.append(create("strong", "", "310° NW"));
  distanceStat.append(create("span", "", "Distance"));
  distanceStat.append(create("strong", "", "~215 m"));
  selectedStats.append(bearingStat, distanceStat);
  selectedMeta.append(selectedBadge);
  selectedMedia.append(selectedImg, selectedMeta, selectedStats);
  selectedBody.append(create("p", "eyebrow", "Selected View"));
  selectedBody.append(create("h3", "", selected.title));
  selectedBody.append(create("p", "muted", selected.note));
  els.selectedViewport.append(selectedMedia, selectedBody);

  twinmotion.viewpoints.forEach((item) => {
    const thumb = create("button", "viewport-thumb");
    const image = create("img");
    const label = create("span", "", item.title.replace("Viewpoint ", ""));
    const src = twinmotionUrl(item);

    image.src = src;
    image.alt = item.title;
    image.loading = "lazy";
    image.decoding = "async";
    thumb.type = "button";
    thumb.classList.toggle("active", item.id === state.selectedViewportId);
    thumb.setAttribute("aria-label", `Select ${item.title}`);
    thumb.addEventListener("click", () => {
      state.selectedViewportId = item.id;
      renderViewports();
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
  els.fullscreenMapBtn.textContent = mapFullscreen ? "Exit Full Screen" : "Full Screen";
  els.fullscreenMapBtn.classList.toggle("is-active", mapFullscreen);
  els.modalFullscreenBtn.textContent = modalFullscreen ? "Exit Full Screen" : "Full Screen";
  els.modalFullscreenBtn.classList.toggle("is-active", modalFullscreen);
}

function applyModalTransform() {
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

function openImageModal(src, title) {
  els.modalTitle.textContent = title;
  els.modalImg.src = src;
  els.modalImg.alt = title;
  els.imageModal.classList.add("open");
  els.imageModal.setAttribute("aria-hidden", "false");
  resetModalView();
}

async function closeImageModal() {
  els.imageModal.classList.remove("open");
  els.imageModal.setAttribute("aria-hidden", "true");
  els.imageModalShell.classList.remove("is-fullscreen");
  els.modalImg.removeAttribute("src");

  if (document.fullscreenElement === els.imageModalShell) {
    await exitNativeFullscreen();
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
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1.14 : 0.88;
    setModalScale(state.modal.scale * direction);
  }, { passive: false });

  els.modalStage.addEventListener("pointerdown", (event) => {
    state.modal.isPanning = true;
    state.modal.startX = event.clientX;
    state.modal.startY = event.clientY;
    state.modal.startPanX = state.modal.panX;
    state.modal.startPanY = state.modal.panY;
    els.modalStage.setPointerCapture(event.pointerId);
    applyModalTransform();
  });

  els.modalStage.addEventListener("pointermove", (event) => {
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
  wireEvents();
  renderAll();
}

init().catch((error) => {
  document.body.innerHTML = `<main class="shell"><article class="glass" style="padding:22px;"><h1>Planning pack could not load</h1><p class="muted">${error.message}</p></article></main>`;
});
