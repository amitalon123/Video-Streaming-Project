// ViewingActions: shared helpers to manage per-profile 'watched' state
// Exposes global window.ViewingActions for use in page scripts
(function () {
  const API_BASE_URL = "http://localhost:3000/api";
  const state = {
    watchedIds: new Set(),
    initialized: false,
  };

  function getCurrentProfile() {
    try {
      return JSON.parse(localStorage.getItem("currentProfile"));
    } catch (_) {
      return null;
    }
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("currentUser"));
    } catch (_) {
      return null;
    }
  }

  function getWatchedStorageKey() {
    const currentProfile = getCurrentProfile();
    const profileId = currentProfile
      ? currentProfile.id || currentProfile._id || currentProfile.name
      : "default";
    return `watchedContent_${profileId}`;
  }

  function loadLocal() {
    try {
      const key = getWatchedStorageKey();
      let watched = localStorage.getItem(key);
      if (!watched) {
        const legacy = localStorage.getItem("watchedContent");
        if (legacy) {
          watched = legacy;
          localStorage.setItem(key, legacy);
        }
      }
      if (watched) {
        const arr = JSON.parse(watched);
        state.watchedIds = Array.isArray(arr) ? new Set(arr) : new Set();
      } else {
        state.watchedIds = new Set();
      }
    } catch (e) {
      console.error("ViewingActions.loadLocal error:", e);
      state.watchedIds = new Set();
    }
  }

  function saveLocal() {
    try {
      const key = getWatchedStorageKey();
      localStorage.setItem(key, JSON.stringify(Array.from(state.watchedIds)));
    } catch (e) {
      console.error("ViewingActions.saveLocal error:", e);
    }
  }

  async function loadFromDB() {
    try {
      const user = getCurrentUser();
      const profile = getCurrentProfile();
      if (!user || !user.id) return;
      const profileQuery = profile?.id ? `&profile=${profile.id}` : "";
      const res = await fetch(`${API_BASE_URL}/viewings?user=${user.id}${profileQuery}&watched=true&limit=1000`);
      if (!res.ok) return;
      const payload = await res.json();
      const next = new Set();
      if (payload?.data && Array.isArray(payload.data)) {
        payload.data.forEach((vh) => {
          if (vh?.content && vh?.watched) {
            const cid = typeof vh.content === "object" ? vh.content._id : vh.content;
            if (cid) next.add(cid);
          }
        });
      }
      state.watchedIds = next;
      saveLocal();
    } catch (e) {
      console.error("ViewingActions.loadFromDB error:", e);
    }
  }

  async function updateWatched(contentId, isWatched) {
    const user = getCurrentUser();
    const profile = getCurrentProfile();
    if (!user || !user.id) {
      console.error("ViewingActions.updateWatched: missing user");
      return null;
    }
    const body = {
      user: user.id,
      profile: profile?.id || null,
      content: contentId,
      episode: null,
      watched: isWatched,
    };
    const res = await fetch(`${API_BASE_URL}/viewings/watch/toggle`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Failed to update watched");
    return await res.json();
  }

  function isWatched(contentId) {
    return state.watchedIds.has(contentId);
  }

  function getWatchButtonHtml(contentId) {
    const watched = isWatched(contentId);
    return `<button class="watch-button ${watched ? "watched" : ""}" data-id="${contentId}">
      ${watched ? "✓ Watched" : "Mark as Watched"}
    </button>`;
  }

  function ensureBadge(posterEl) {
    if (!posterEl) return null;
    let badge = posterEl.querySelector(".watched-badge");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "watched-badge";
      badge.textContent = "✓ Watched";
      posterEl.appendChild(badge);
    }
    return badge;
  }

  function removeBadge(cardEl) {
    if (!cardEl) return;
    const badge = cardEl.querySelector(".watched-badge");
    if (badge) badge.remove();
  }

  function attachWatchHandler(buttonEl, posterEl, contentId, onAfterToggle) {
    if (!buttonEl) return;
    buttonEl.addEventListener("click", async (e) => {
      e.stopPropagation();
      const currentlyWatched = isWatched(contentId);
      const nextState = !currentlyWatched;

      // optimistic UI
      if (nextState) {
        state.watchedIds.add(contentId);
        buttonEl.classList.add("watched");
        buttonEl.textContent = "✓ Watched";
        ensureBadge(posterEl);
      } else {
        state.watchedIds.delete(contentId);
        buttonEl.classList.remove("watched");
        buttonEl.textContent = "Mark as Watched";
        removeBadge(buttonEl.closest(".content-card"));
      }

      try {
        await updateWatched(contentId, nextState);
        saveLocal();
      } catch (err) {
        console.error("ViewingActions.attachWatchHandler revert:", err);
        // revert
        if (nextState) {
          state.watchedIds.delete(contentId);
          buttonEl.classList.remove("watched");
          buttonEl.textContent = "Mark as Watched";
          removeBadge(buttonEl.closest(".content-card"));
        } else {
          state.watchedIds.add(contentId);
          buttonEl.classList.add("watched");
          buttonEl.textContent = "✓ Watched";
          ensureBadge(posterEl);
        }
      } finally {
        if (typeof onAfterToggle === "function") {
          try { onAfterToggle(isWatched(contentId)); } catch (_) {}
        }
      }
    });
  }

  async function init() {
    if (state.initialized) return;
    state.initialized = true;
    loadLocal();
    // async hydrate, do not block
    loadFromDB();
  }

  window.ViewingActions = {
    init,
    isWatched,
    getWatchButtonHtml,
    attachWatchHandler,
  };
})();


