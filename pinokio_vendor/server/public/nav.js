document.addEventListener("DOMContentLoaded", () => {
    const log = () => { };
    const rectInfo = () => null;

    const newWindowButton = document.querySelector("#new-window");
    const agent = document.body.getAttribute("data-agent");
    if (newWindowButton) {
        newWindowButton.addEventListener("click", (event) => {
            if (window.__TAURI__) {
                // Tauri implementation
                const { WebviewWindow } = window.__TAURI__.window;
                const label = "window-" + Math.random().toString(36).substring(7);
                const webview = new WebviewWindow(label, {
                    url: "/",
                    title: "Pinokio",
                    width: 1200,
                    height: 800,
                    resizable: true,
                    decorations: true
                });
                webview.once('tauri://created', function () {
                    console.log("New window created");
                });
                webview.once('tauri://error', function (e) {
                    console.error("Error creating window:", e);
                });
            } else if (agent === "electron") {
                window.open("/", "_blank", "pinokio");
            } else {
                window.open("/", "_blank");
            }
        });
    }

    const header = document.querySelector("header.navheader");
    const homeLink = header ? header.querySelector(".home") : null;

    if (!header) {
        return;
    }

    const homeIcon = homeLink ? homeLink.querySelector("img.icon") : null;
    const ensureHomeExpandIcon = () => {
        if (!homeLink || !homeIcon) {
            return null;
        }
        let icon = homeLink.querySelector(".home-expand-icon");
        if (!icon) {
            icon = document.createElement("i");
            icon.className = "fa-solid fa-expand home-expand-icon";
            icon.setAttribute("aria-hidden", "true");
            homeLink.appendChild(icon);
        }
        return icon;
    };
    ensureHomeExpandIcon();

    const MIN_MARGIN = 0;
    const LEGACY_MARGIN = 8;

    function clampPosition(left, top, sizeOverride) {
        const rect = header.getBoundingClientRect();
        const width = sizeOverride && Number.isFinite(sizeOverride.width) ? sizeOverride.width : rect.width;
        const height = sizeOverride && Number.isFinite(sizeOverride.height) ? sizeOverride.height : rect.height;
        const maxLeft = Math.max(0, window.innerWidth - width);
        const maxTop = Math.max(0, window.innerHeight - height);
        return {
            left: Math.min(Math.max(0, left), maxLeft),
            top: Math.min(Math.max(0, top), maxTop),
        };
    }

    function applyPosition(left, top) {
        header.style.left = `${left}px`;
        header.style.top = `${top}px`;
        header.style.right = "auto";
        header.style.bottom = "auto";
    }

    function measureRect(configureClone) {
        const clone = header.cloneNode(true);
        clone.querySelectorAll("[id]").forEach((node) => {
            if (node.id !== "refresh-page") {
                node.removeAttribute("id");
            }
        });
        Object.assign(clone.style, {
            transition: "none",
            transform: "none",
            position: "fixed",
            visibility: "hidden",
            pointerEvents: "none",
            margin: "0",
            left: "0",
            top: "0",
            right: "auto",
            bottom: "auto",
            width: "auto",
            height: "auto",
        });
        document.body.appendChild(clone);
        if (typeof configureClone === "function") {
            configureClone(clone);
        }
        const rect = clone.getBoundingClientRect();
        clone.remove();
        return rect;
    }

    const dispatchHeaderState = (minimized, detail = {}) => {
        if (typeof window === "undefined" || typeof window.CustomEvent !== "function") {
            return;
        }
        const payload = { minimized, ...detail };
        document.dispatchEvent(new CustomEvent("pinokio:header-state", { detail: payload }));
    };

    const headerTitle = header.querySelector("h1") || header;
    let dragHandle = headerTitle.querySelector(".header-drag-handle");
    if (!dragHandle) {
        dragHandle = document.createElement("div");
        dragHandle.className = "header-drag-handle";
        dragHandle.setAttribute("aria-hidden", "true");
        dragHandle.setAttribute("title", "Drag minimized header");
        headerTitle.insertBefore(dragHandle, homeLink ? homeLink.nextSibling : headerTitle.firstChild);
    }

    const STORAGE_KEY = () => `pinokio:header-state:v1:${location.pathname}`;
    const storage = (() => {
        try { return window.sessionStorage; } catch (_) { return null; }
    })();
    const readPersisted = () => {
        if (!storage) return null;
        try {
            const raw = storage.getItem(STORAGE_KEY());
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (_) { return null; }
    };
    const writePersisted = (data) => {
        if (!storage) return;
        try {
            const prev = readPersisted() || {};
            storage.setItem(STORAGE_KEY(), JSON.stringify({ ...prev, ...data }));
        } catch (_) { }
    };

    const state = {
        minimized: header.classList.contains("minimized"),
        pointerId: null,
        offsetX: 0,
        offsetY: 0,
        lastLeft: parseFloat(header.style.left) || 0,
        lastTop: parseFloat(header.style.top) || 0,
        hasCustomPosition: false,
        originalPosition: {
            top: header.style.top || "",
            left: header.style.left || "",
            right: header.style.right || "",
            bottom: header.style.bottom || "",
        },
        transitionHandler: null,
    };

    const persisted = readPersisted();
    const restoreFromStorage = !!(persisted && persisted.minimized);
    if (restoreFromStorage || header.classList.contains("minimized")) {
        header.classList.add("minimized");
        const size = measureRect((clone) => { clone.classList.add("minimized"); });
        const left = persisted && Number.isFinite(persisted.left) ? persisted.left : MIN_MARGIN;
        const top = persisted && Number.isFinite(persisted.top) ? persisted.top : MIN_MARGIN;
        const clamped = clampPosition(left, top, size);
        state.lastLeft = clamped.left;
        state.lastTop = clamped.top;
        state.minimized = true;
        applyPosition(clamped.left, clamped.top);
    }

    const stopTransition = () => {
        if (state.transitionHandler) {
            header.removeEventListener("transitionend", state.transitionHandler);
            state.transitionHandler = null;
        }
        header.classList.remove("transitioning");
        header.style.transition = "";
        header.style.transform = "";
    };

    const restore = () => {
        if (!header.classList.contains("minimized") || header.classList.contains("transitioning")) {
            return;
        }
        stopTransition();
        header.classList.add("transitioning");
        header.classList.remove("minimized");
        header.style.left = state.originalPosition.left;
        header.style.top = state.originalPosition.top;
        header.style.right = state.originalPosition.right;
        header.style.bottom = state.originalPosition.bottom;

        header.offsetWidth; // force reflow
        header.style.transition = "transform 560ms cubic-bezier(0.18, 0.85, 0.4, 1)";

        state.transitionHandler = () => {
            stopTransition();
            state.minimized = false;
            writePersisted({ minimized: false });
        };
        header.addEventListener("transitionend", state.transitionHandler);
    };

    if (homeLink) {
        homeLink.addEventListener("click", (event) => {
            if (header.classList.contains("minimized")) {
                event.preventDefault();
                restore();
            }
        });
    }

    const onPointerMove = (event) => {
        if (!header.classList.contains("minimized") || state.pointerId !== event.pointerId) {
            return;
        }
        const clamped = clampPosition(event.clientX - state.offsetX, event.clientY - state.offsetY);
        state.lastLeft = clamped.left;
        state.lastTop = clamped.top;
        state.hasCustomPosition = true;
        applyPosition(clamped.left, clamped.top);
        writePersisted({ minimized: true, left: clamped.left, top: clamped.top });
    };

    const onPointerEnd = (event) => {
        if (state.pointerId !== event.pointerId) return;
        dragHandle.classList.remove("dragging");
        state.pointerId = null;
    };

    dragHandle.addEventListener("pointerdown", (event) => {
        if (!header.classList.contains("minimized")) return;
        state.pointerId = event.pointerId;
        const rect = header.getBoundingClientRect();
        state.offsetX = event.clientX - rect.left;
        state.offsetY = event.clientY - rect.top;
        dragHandle.classList.add("dragging");
        event.preventDefault();
    });

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);
});
