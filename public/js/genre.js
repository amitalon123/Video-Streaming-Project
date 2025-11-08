// API Configuration
const API_BASE_URL = "http://localhost:3000/api";

// Configuration from environment (for items per page)
// IMPORTANT: This value MUST match GENRE_ITEMS_PER_PAGE in the backend .env file
// The backend uses GENRE_ITEMS_PER_PAGE to determine how many items to return per page
// If these values don't match, pagination will be incorrect
// Example: If backend has GENRE_ITEMS_PER_PAGE=10, then ITEMS_PER_PAGE should be 10 here
const ITEMS_PER_PAGE = 10; // Must match backend GENRE_ITEMS_PER_PAGE from .env

// State management
let currentGenreId = null;
let currentPage = 1;
let isLoading = false;
let hasMoreContent = true;
let allContent = [];
let filteredContent = [];
let watchedContentIds = new Set(); // Track watched content IDs from localStorage

// Get genre ID from URL
function getGenreIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const genreId = urlParams.get("id");

  // Debug logging
  console.log("Current URL:", window.location.href);
  console.log("URL Search:", window.location.search);
  console.log("Genre ID from URL:", genreId);

  return genreId;
}

// Fetch genre details from API
async function fetchGenreDetails(genreId) {
  try {
    const response = await fetch(`${API_BASE_URL}/genres/${genreId}`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching genre details:", error);
    return null;
  }
}

// Fetch content by genre with pagination
async function fetchContentByGenre(
  genreId,
  page = 1,
  limit = ITEMS_PER_PAGE,
  sortBy = "popularity",
  contentType = "all"
) {
  try {
    let url = `${API_BASE_URL}/genres/${genreId}/content?page=${page}&limit=${limit}`;

    // Add sorting
    if (sortBy === "rating") {
      url += "&sort=rating:-1";
    } else if (sortBy === "newest") {
      url += "&sort=releaseYear:-1";
    } else if (sortBy === "oldest") {
      url += "&sort=releaseYear:1";
    } else {
      // Popularity - sort by views and likes
      url += "&sort=views:-1,likes:-1";
    }

    // Add content type filter
    if (contentType !== "all") {
      url += `&type=${contentType}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return {
      content: data.data || [],
      hasMore: data.pagination?.hasNextPage || false,
      total: data.total || 0,
    };
  } catch (error) {
    console.error("Error fetching content by genre:", error);
    return { content: [], hasMore: false, total: 0 };
  }
}

// Load watched content from localStorage
function loadWatchedContent() {
  const watched = localStorage.getItem("watchedContent");
  if (watched) {
    try {
      const watchedArray = JSON.parse(watched);
      watchedContentIds = new Set(watchedArray);
    } catch (error) {
      console.error("Error parsing watched content:", error);
      watchedContentIds = new Set();
    }
  }
}

// Save watched content to localStorage
function saveWatchedContent() {
  localStorage.setItem(
    "watchedContent",
    JSON.stringify(Array.from(watchedContentIds))
  );
}

// Mark content as watched
function markAsWatched(contentId) {
  watchedContentIds.add(contentId);
  saveWatchedContent();
}

// Check if content is watched
function isWatched(contentId) {
  return watchedContentIds.has(contentId);
}

// Apply filters to content
function applyFilters() {
  const watchStatus = document.getElementById("watchStatusFilter").value;

  filteredContent = allContent.filter((item) => {
    // Apply watch status filter
    if (watchStatus === "watched") {
      return isWatched(item._id);
    } else if (watchStatus === "not-watched") {
      return !isWatched(item._id);
    }
    // "all" - no filter
    return true;
  });

  // Clear and redisplay
  displayContent(filteredContent);
}

// Sort content
function sortContent(content, sortBy) {
  const sorted = [...content];

  switch (sortBy) {
    case "rating":
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case "popularity":
      return sorted.sort((a, b) => {
        const popularityA = (a.views || 0) + (a.likes || 0);
        const popularityB = (b.views || 0) + (b.likes || 0);
        return popularityB - popularityA;
      });
    case "newest":
      return sorted.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
    case "oldest":
      return sorted.sort((a, b) => (a.releaseYear || 0) - (b.releaseYear || 0));
    default:
      return sorted;
  }
}

// Create content card
function createContentCard(item) {
  const card = document.createElement("div");
  card.className = "content-card";

  // Get image URL and fix path if needed
  let imageUrl = item.imageUrl || "/posters/placeholder.jpg";
  if (imageUrl.startsWith("/assets/posters/")) {
    imageUrl = imageUrl.replace("/assets/posters/", "/posters/");
  } else if (imageUrl.startsWith("./posters/")) {
    imageUrl = imageUrl.replace("./posters/", "/posters/");
  }

  // Format genre display
  let genreDisplay = "Unknown";
  if (item.genres && item.genres.length > 0) {
    if (typeof item.genres[0] === "object") {
      genreDisplay = item.genres.map((g) => g.name).join(", ");
    } else {
      genreDisplay = item.genres.join(", ");
    }
  }

  // Check if watched
  const watched = isWatched(item._id);
  const watchedBadge = watched
    ? '<span class="watched-badge">✓ Watched</span>'
    : "";

  // Check if liked
  const likedContent = JSON.parse(localStorage.getItem("likedContent")) || {};
  const isLiked = likedContent[item._id];
  const heartIcon = isLiked ? "❤️" : "🤍";

  card.innerHTML = `
    <div class="content-poster">
      <img src="${imageUrl}" alt="${
    item.title
  }" onerror="this.src='/Images/placeholder.jpg'">
      ${watchedBadge}
    </div>
    <div class="content-info">
      <h3 class="content-title">${item.title}</h3>
      <div class="content-metadata">
        <span class="content-year">${item.releaseYear || "Unknown"}</span>
        <span class="content-genre">${genreDisplay}</span>
      </div>
      <div class="content-stats">
        <span class="content-rating">★ ${item.rating || "N/A"}</span>
        <button class="like-button ${isLiked ? "liked" : ""}" data-id="${
    item._id
  }">
          <span class="heart">${heartIcon}</span>
        </button>
      </div>
      <div class="content-actions">
        <button class="watch-button ${watched ? "watched" : ""}" data-id="${
    item._id
  }">
          ${watched ? "✓ Watched" : "Mark as Watched"}
        </button>
      </div>
    </div>
  `;

  // Make card clickable
  card.addEventListener("click", (e) => {
    if (e.target.closest(".like-button") || e.target.closest(".watch-button"))
      return;
    window.location.href = `/content/${item._id}`;
  });

  // Like button functionality
  const likeButton = card.querySelector(".like-button");
  likeButton.addEventListener("click", async (e) => {
    e.stopPropagation();
    await toggleLike(item._id, likeButton);
  });

  // Watch button functionality
  const watchButton = card.querySelector(".watch-button");
  watchButton.addEventListener("click", async (e) => {
    e.stopPropagation();
    await toggleWatchStatus(item._id, watchButton);
  });

  return card;
}

// Load liked content from database
async function loadLikedContentFromDB() {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const currentProfile = JSON.parse(localStorage.getItem("currentProfile"));
    if (!currentUser || !currentUser.id) {
      return {};
    }

    const profileQuery = currentProfile?.id ? `&profile=${currentProfile.id}` : "";
    const response = await fetch(`${API_BASE_URL}/viewings?user=${currentUser.id}${profileQuery}&liked=true&limit=1000`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();

    // Convert array to object: { contentId: true, ... }
    const likedContentObj = {};
    if (data.data && Array.isArray(data.data)) {
      data.data.forEach((item) => {
        if (item.content && item.liked) {
          const contentId =
            typeof item.content === "object" ? item.content._id : item.content;
          likedContentObj[contentId] = true;
        }
      });
    }

    return likedContentObj;
  } catch (error) {
    console.error("Error loading liked content from DB:", error);
    return {};
  }
}

// Update like status using ViewingHabit API
async function updateLike(contentId, isLiked) {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const currentProfile = JSON.parse(localStorage.getItem("currentProfile"));
    if (!currentUser || !currentUser.id) {
      console.error("User not found in localStorage");
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/viewings/like/toggle`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: currentUser.id,
        profile: currentProfile?.id || null,
        content: contentId,
        episode: null,
        liked: isLiked,
      }),
    });
    if (!response.ok) throw new Error("Network response was not ok");
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error updating like status:", error);
    return null;
  }
}

// Toggle like status
async function toggleLike(contentId, buttonElement) {
  const likedContent = JSON.parse(localStorage.getItem("likedContent")) || {};
  const isCurrentlyLiked = likedContent[contentId];
  const newLikedState = !isCurrentlyLiked;

  // Optimistic UI update
  if (newLikedState) {
    likedContent[contentId] = true;
    buttonElement.classList.add("liked");
    buttonElement.querySelector(".heart").textContent = "❤️";
  } else {
    delete likedContent[contentId];
    buttonElement.classList.remove("liked");
    buttonElement.querySelector(".heart").textContent = "🤍";
  }

  // Update on server
  updateLike(contentId, newLikedState)
    .then(() => {
      // Save to localStorage after successful update
      localStorage.setItem("likedContent", JSON.stringify(likedContent));
    })
    .catch((error) => {
      console.error("Failed to update like status:", error);
      // Revert optimistic update on error
      if (newLikedState) {
        delete likedContent[contentId];
        buttonElement.classList.remove("liked");
        buttonElement.querySelector(".heart").textContent = "🤍";
      } else {
        likedContent[contentId] = true;
        buttonElement.classList.add("liked");
        buttonElement.querySelector(".heart").textContent = "❤️";
      }
    });
}

// Toggle watch status
async function toggleWatchStatus(contentId, buttonElement) {
  const wasWatched = isWatched(contentId);

  if (wasWatched) {
    watchedContentIds.delete(contentId);
    buttonElement.textContent = "Mark as Watched";
    buttonElement.classList.remove("watched");

    // Remove watched badge from poster
    const card = buttonElement.closest(".content-card");
    const badge = card.querySelector(".watched-badge");
    if (badge) badge.remove();
  } else {
    markAsWatched(contentId);
    buttonElement.textContent = "✓ Watched";
    buttonElement.classList.add("watched");

    // Add watched badge to poster
    const card = buttonElement.closest(".content-card");
    const poster = card.querySelector(".content-poster");
    if (poster && !poster.querySelector(".watched-badge")) {
      const badge = document.createElement("span");
      badge.className = "watched-badge";
      badge.textContent = "✓ Watched";
      poster.appendChild(badge);
    }
  }

  // Reapply filters if needed
  applyFilters();
}

// Display content in grid
function displayContent(content, clearGrid = true) {
  const grid = document.getElementById("genreContentGrid");

  // Clear grid if needed (for initial display or filter changes)
  if (clearGrid) {
    grid.innerHTML = "";
  }

  if (content.length === 0 && clearGrid) {
    grid.innerHTML = `
      <div class="no-content">
        <p>No content found matching your filters.</p>
      </div>
    `;
    return;
  }

  content.forEach((item) => {
    const card = createContentCard(item);
    grid.appendChild(card);
  });
}

// Load more content (for infinite scroll)
async function loadMoreContent() {
  console.log(
    "loadMoreContent called - isLoading:",
    isLoading,
    "hasMoreContent:",
    hasMoreContent
  );

  if (isLoading) {
    console.log("Already loading, skipping...");
    return;
  }

  if (!hasMoreContent) {
    console.log("No more content to load");
    return;
  }

  isLoading = true;
  const loadingIndicator = document.getElementById("loadingIndicator");
  if (loadingIndicator) {
    loadingIndicator.style.display = "block";
  }

  try {
    const sortBy = document.getElementById("sortSelect").value;
    const contentType = document.getElementById("contentTypeFilter").value;

    const nextPage = currentPage + 1;
    console.log(
      `Loading page ${nextPage} with sort=${sortBy}, type=${contentType}`
    );

    const result = await fetchContentByGenre(
      currentGenreId,
      nextPage,
      ITEMS_PER_PAGE,
      sortBy,
      contentType
    );

    console.log(
      `Fetched ${result.content.length} items, hasMore: ${result.hasMore}`
    );

    if (result.content.length > 0) {
      // Add new content to existing content
      allContent = [...allContent, ...result.content];

      // Apply filters to new content only (don't clear grid)
      const watchStatus = document.getElementById("watchStatusFilter").value;
      const newFilteredContent = result.content.filter((item) => {
        if (watchStatus === "watched") {
          return isWatched(item._id);
        } else if (watchStatus === "not-watched") {
          return !isWatched(item._id);
        }
        return true;
      });

      console.log(`After filtering: ${newFilteredContent.length} items`);

      // Display new filtered content without clearing grid
      displayContent(newFilteredContent, false);

      // Update filteredContent array
      filteredContent = [...filteredContent, ...newFilteredContent];

      // Update current page
      currentPage = nextPage;
    }

    hasMoreContent = result.hasMore;

    if (!hasMoreContent) {
      console.log("No more content available");
      const endMessage = document.getElementById("endMessage");
      if (endMessage) {
        endMessage.style.display = "block";
      }
    }
  } catch (error) {
    console.error("Error loading more content:", error);
  } finally {
    isLoading = false;
    if (loadingIndicator) {
      loadingIndicator.style.display = "none";
    }
  }
}

// Initialize infinite scroll
let scrollHandler = null;

function setupInfiniteScroll() {
  // Remove any existing scroll listeners to prevent duplicates
  if (scrollHandler) {
    window.removeEventListener("scroll", scrollHandler);
  }

  let ticking = false;
  let lastScrollTop = 0;

  scrollHandler = function handleScroll() {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop =
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop;
      const clientHeight =
        document.documentElement.clientHeight || window.innerHeight;

      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

      // Only check if scrolling down
      const isScrollingDown = scrollTop > lastScrollTop;
      lastScrollTop = scrollTop;

      // Load more when user is near bottom (300px from bottom) and scrolling down
      if (
        distanceFromBottom <= 300 &&
        hasMoreContent &&
        !isLoading &&
        isScrollingDown
      ) {
        console.log("Near bottom, loading more content...", {
          scrollHeight,
          scrollTop,
          clientHeight,
          distanceFromBottom,
          hasMoreContent,
          isLoading,
          currentPage,
          itemsPerPage: ITEMS_PER_PAGE,
        });
        loadMoreContent();
      }

      ticking = false;
    });
  };

  window.addEventListener("scroll", scrollHandler, { passive: true });

  console.log(
    "Infinite scroll initialized with ITEMS_PER_PAGE:",
    ITEMS_PER_PAGE
  );
}

// Setup event listeners for filters
function setupFilters() {
  document.getElementById("sortSelect").addEventListener("change", async () => {
    // Reset and reload content with new sort
    currentPage = 1;
    hasMoreContent = true;
    allContent = [];
    document.getElementById("genreContentGrid").innerHTML = "";
    document.getElementById("endMessage").style.display = "none";

    await loadInitialContent();
  });

  document
    .getElementById("contentTypeFilter")
    .addEventListener("change", async () => {
      // Reset and reload content with new filter
      currentPage = 1;
      hasMoreContent = true;
      allContent = [];
      document.getElementById("genreContentGrid").innerHTML = "";
      document.getElementById("endMessage").style.display = "none";

      await loadInitialContent();
    });

  document
    .getElementById("watchStatusFilter")
    .addEventListener("change", () => {
      // Just reapply filters to existing content
      applyFilters();
    });
}

// Load initial content
async function loadInitialContent() {
  console.log("Loading initial content for genre:", currentGenreId);
  const loadingIndicator = document.getElementById("loadingIndicator");
  if (loadingIndicator) {
    loadingIndicator.style.display = "block";
  }

  try {
    const sortBy = document.getElementById("sortSelect").value;
    const contentType = document.getElementById("contentTypeFilter").value;

    currentPage = 1;
    console.log(
      `Loading page ${currentPage} with sort=${sortBy}, type=${contentType}`
    );

    const result = await fetchContentByGenre(
      currentGenreId,
      currentPage,
      ITEMS_PER_PAGE,
      sortBy,
      contentType
    );

    console.log(
      `Initial load: ${result.content.length} items, hasMore: ${result.hasMore}`
    );

    allContent = result.content;
    hasMoreContent = result.hasMore;

    applyFilters();

    if (!hasMoreContent) {
      console.log("No more content available from initial load");
      const endMessage = document.getElementById("endMessage");
      if (endMessage) {
        endMessage.style.display = "block";
      }
    } else {
      const endMessage = document.getElementById("endMessage");
      if (endMessage) {
        endMessage.style.display = "none";
      }
    }
  } catch (error) {
    console.error("Error loading initial content:", error);
  } finally {
    if (loadingIndicator) {
      loadingIndicator.style.display = "none";
    }
  }
}

// Setup profile dropdown
function setupDropdown() {
  const dropdownToggle = document.querySelector(".dropdown-icon");
  const profileDropdown = document.getElementById("profileDropdown");
  const profileMenu = document.querySelector(".profile-menu");

  profileMenu.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownToggle.classList.toggle("active");
    profileDropdown.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (
      !dropdownToggle.contains(e.target) &&
      !profileDropdown.contains(e.target)
    ) {
      dropdownToggle.classList.remove("active");
      profileDropdown.classList.remove("show");
    }
  });

  document.querySelectorAll(".dropdown-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      const action = e.target.closest(".dropdown-item").textContent.trim();
      switch (action) {
        case "Profile":
          console.log("Profile clicked");
          break;
        case "Switch Profile":
          window.location.href = "/profiles";
          break;
        case "Logout":
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("currentProfile");
          window.location.href = "/login";
          break;
      }
    });
  });
}

// Main initialization function
async function initGenrePage() {
  // Check if user is logged in
  if (!localStorage.getItem("isLoggedIn")) {
    window.location.href = "/login";
    return;
  }

  // Get current profile
  const currentProfile = JSON.parse(localStorage.getItem("currentProfile"));
  if (!currentProfile) {
    window.location.href = "/profiles";
    return;
  }

  // Update profile display
  const profileName = document.getElementById("profileName");
  const menuProfileImage = document.getElementById("menuProfileImage");
  profileName.textContent = currentProfile.name;

  // Fix profile image path if needed
  let profileImageUrl = currentProfile.image || "/Images/placeholder.jpg";
  if (profileImageUrl.startsWith("./Images/")) {
    profileImageUrl = profileImageUrl.replace("./Images/", "/Images/");
  }
  menuProfileImage.src = profileImageUrl;

  // Load watched content
  loadWatchedContent();

  // Load liked content from database
  const likedContentFromDB = await loadLikedContentFromDB();
  localStorage.setItem("likedContent", JSON.stringify(likedContentFromDB));

  // Get genre ID from URL
  currentGenreId = getGenreIdFromUrl();
  if (!currentGenreId) {
    // Hide genre header and filters
    const genreHeader = document.getElementById("genreHeader");
    const filtersSection = document.querySelector(".filters-section");
    if (genreHeader) genreHeader.style.display = "none";
    if (filtersSection) filtersSection.style.display = "none";

    // Show error message
    document.getElementById("genreContentGrid").innerHTML = `
      <div class="error-message" style="text-align: center; padding: 50px; color: #e50914;">
        <h2 style="margin-bottom: 20px;">Genre ID not provided</h2>
        <p style="margin-bottom: 20px; color: #aaa;">
          Please select a genre from the home page to view its content.
        </p>
        <a href="/feed" style="color: #e50914; text-decoration: underline; font-size: 1.1rem;">
          ← Back to Browse
        </a>
      </div>
    `;
    return;
  }

  // Fetch and display genre details
  const genre = await fetchGenreDetails(currentGenreId);
  if (!genre) {
    document.getElementById("genreContentGrid").innerHTML = `
      <div class="error">
        <p>Genre not found. <a href="/feed">Back to Browse</a></p>
      </div>
    `;
    return;
  }

  document.getElementById("genreTitle").textContent = genre.name;
  document.getElementById("genreDescription").textContent =
    genre.description || "";

  // Setup filters and infinite scroll
  setupFilters();
  setupInfiniteScroll();
  setupDropdown();

  // Load initial content
  await loadInitialContent();
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", initGenrePage);
