// API Configuration
const API_BASE_URL = "http://localhost:3000/api";

// Global state - liked content from database
let likedContent = {};

// Global reference to search input (will be set in DOMContentLoaded)
let searchInput = null;

// Infinite scroll state for horizontal sections
const infiniteScrollState = {
  popular: { page: 1, hasMore: true, isLoading: false, hasLooped: false },
  newReleases: { page: 1, hasMore: true, isLoading: false, hasLooped: false },
  recommended: { page: 1, hasMore: true, isLoading: false, hasLooped: false },
  continueWatching: {
    page: 1,
    hasMore: true,
    isLoading: false,
    hasLooped: false,
  },
  genres: {}, // Will store state per genre: { genreId: { page: 1, hasMore: true, isLoading: false, hasLooped: false } }
};

// Items per page for infinite scroll
const ITEMS_PER_LOAD = 10;

// API Functions - לשימוש עתידי
async function fetchAllContent(searchTerm = "", sortBy = "") {
  try {
    let url = `${API_BASE_URL}/content?`;
    if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
    if (sortBy === "name") url += "sort=title:1&";
    else if (sortBy === "name-desc") url += "sort=title:-1&";
    url += "limit=1000";
      
    console.log("Fetching from URL:", url); // דיבוג

    const response = await fetch(url);
    if (!response.ok) {
      console.error("API Error:", response.status, response.statusText);
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    console.log("API Response:", data); // דיבוג
    return data.data || [];
  } catch (error) {
    console.error("Error fetching content:", error);
    return [];
  }
}

async function fetchTVShows(searchTerm = "", sortBy = "") {
  try {
    let url = `${API_BASE_URL}/content?type=series&`;
    if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
    if (sortBy === "name") url += "sort=title:1&";
    else if (sortBy === "name-desc") url += "sort=title:-1&";
  url += "limit=1000";
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching TV shows:", error);
    return [];
  }
}

async function fetchMovies(searchTerm = "", sortBy = "") {
  try {
    let url = `${API_BASE_URL}/content?type=movie&`;
    if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
    if (sortBy === "name") url += "sort=title:1&";
    else if (sortBy === "name-desc") url += "sort=title:-1&";
    url += "limit=1000";

    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching movies:", error);
    return [];
  }
}

async function fetchPopularContent(page = 1, limit = ITEMS_PER_LOAD) {
  try {
    // Use getAllContent with popularity sort which supports pagination
    const response = await fetch(
      `${API_BASE_URL}/content?sort=popularity&page=${page}&limit=${limit}`
    );
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return {
      content: data.data || [],
      hasMore: data.pagination?.hasNextPage || false,
      total: data.pagination?.total || 0,
    };
  } catch (error) {
    console.error("Error fetching popular content:", error);
    return { content: [], hasMore: false, total: 0 };
  }
}

// Fetch newest content
async function fetchNewestContent(page = 1, limit = ITEMS_PER_LOAD) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/content?sort=year_desc&page=${page}&limit=${limit}`
    );
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return {
      content: data.data || [],
      hasMore: data.pagination?.hasNextPage || false,
      total: data.pagination?.total || 0,
    };
  } catch (error) {
    console.error("Error fetching newest content:", error);
    return { content: [], hasMore: false, total: 0 };
  }
}

// Fetch content by genre
async function fetchContentByGenre(genreId) {
  try {
    const response = await fetch(`${API_BASE_URL}/genres/${genreId}/content`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching content by genre:", error);
    return [];
  }
}

// Fetch newest content by genre
async function fetchNewestByGenre(genreId, page = 1, limit = ITEMS_PER_LOAD) {
  try {
    // Use the genre content endpoint which supports pagination
    const response = await fetch(
      `${API_BASE_URL}/genres/${genreId}/content?page=${page}&limit=${limit}&sort=releaseYear:-1`
    );
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return {
      content: data.data || [],
      hasMore: data.pagination?.hasNextPage || false,
      total: data.pagination?.total || 0,
    };
  } catch (error) {
    console.error("Error fetching newest content by genre:", error);
    return { content: [], hasMore: false, total: 0 };
  }
}

// Load liked content from database
async function loadLikedContentFromDB() {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const currentProfile = JSON.parse(localStorage.getItem("currentProfile"));
    if (!currentUser || !currentUser.id) {
      return {};
    }

    const profileQuery = currentProfile?.id
      ? `&profile=${currentProfile.id}`
      : "";
    const response = await fetch(
      `${API_BASE_URL}/viewings?user=${currentUser.id}${profileQuery}&liked=true&limit=1000`
    );
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

// Fetch all liked content with full details
async function fetchLikedContent() {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const currentProfile = JSON.parse(localStorage.getItem("currentProfile"));
    if (!currentUser || !currentUser.id) {
      return [];
    }

    // Get viewing habits with liked=true
    const profileQuery = currentProfile?.id
      ? `&profile=${currentProfile.id}`
      : "";
    const response = await fetch(
      `${API_BASE_URL}/viewings?user=${currentUser.id}${profileQuery}&liked=true&limit=1000`
    );
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    // Extract content IDs
    const contentIds = data.data
      .map((item) => {
        if (item.content && item.liked) {
          return typeof item.content === "object"
            ? item.content._id
            : item.content;
        }
        return null;
      })
      .filter((id) => id !== null);

    if (contentIds.length === 0) {
      return [];
    }

    // Fetch full content details for each liked content
    const contentPromises = contentIds.map(async (contentId) => {
      try {
        const contentResponse = await fetch(
          `${API_BASE_URL}/content/${contentId}`
        );
        if (!contentResponse.ok) return null;
        const contentData = await contentResponse.json();
        return contentData.data;
      } catch (error) {
        console.error(`Error fetching content ${contentId}:`, error);
        return null;
      }
    });

    const contents = await Promise.all(contentPromises);
    return contents.filter((content) => content !== null);
  } catch (error) {
    console.error("Error fetching liked content:", error);
    return [];
  }
}

// Fetch user's liked content to extract genres for recommendations
// Only uses LIKED content (heart icon) for genres, not watched content
// Only excludes LIKED content from recommendations (not watched content)
async function getUserContentForRecommendations() {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const currentProfile = JSON.parse(localStorage.getItem("currentProfile"));
    if (!currentUser || !currentUser.id) {
      return { likedGenres: [], likedContent: [], excludeIds: [] };
    }

    const profileQuery = currentProfile?.id
      ? `&profile=${currentProfile.id}`
      : "";

    // Step 1: Get ONLY liked content (for genres extraction AND excludeIds)
    // We only exclude liked content, not watched content
    const likedResponse = await fetch(
      `${API_BASE_URL}/viewings?user=${currentUser.id}${profileQuery}&liked=true&limit=1000`
    );
    if (!likedResponse.ok) throw new Error("Network response was not ok");
    const likedData = await likedResponse.json();

    if (!likedData.data || !Array.isArray(likedData.data)) {
      // If no liked content, return empty (no recommendations based on likes)
      return {
        likedGenres: [],
        likedContent: [],
        excludeIds: [], // Don't exclude anything if user hasn't liked anything
      };
    }

    // Extract ONLY liked content IDs (for genres)
    const likedContentIds = new Set();
    likedData.data.forEach((item) => {
      if (item.content && item.liked === true) {
        const contentId =
          typeof item.content === "object" ? item.content._id : item.content;
        likedContentIds.add(contentId.toString());
      }
    });

    if (likedContentIds.size === 0) {
      console.log("No liked content found for recommendations");
      return {
        likedGenres: [],
        likedContent: [],
        excludeIds: [], // Don't exclude anything if user hasn't liked anything
      };
    }

    console.log(
      `Found ${likedContentIds.size} LIKED content items for recommendations (genres extraction)`
    );

    // Fetch full content details to extract genres from LIKED content only
    const contentPromises = Array.from(likedContentIds).map(
      async (contentId) => {
        try {
          const contentResponse = await fetch(
            `${API_BASE_URL}/content/${contentId}`
          );
          if (!contentResponse.ok) return null;
          const contentData = await contentResponse.json();
          return contentData.data;
        } catch (error) {
          console.error(`Error fetching content ${contentId}:`, error);
          return null;
        }
      }
    );

    const contents = await Promise.all(contentPromises);
    const validContents = contents.filter((content) => content !== null);

    console.log(
      `Fetched ${validContents.length} liked content items to extract genres from`
    );

    // Extract genres from LIKED content only (not from watched content)
    const genreIds = new Set();
    validContents.forEach((content) => {
      if (content.genres && Array.isArray(content.genres)) {
        content.genres.forEach((genre) => {
          const genreId =
            typeof genre === "object" ? genre._id || genre.id : genre;
          if (genreId) {
            genreIds.add(genreId.toString());
            console.log(
              `Added genre ${genreId} from liked content: ${content.title}`
            );
          }
        });
      } else {
        console.warn(
          `Content ${content.title} (${content._id}) has no genres array`
        );
      }
    });

    console.log(
      `Extracted ${genreIds.size} unique genres from user's LIKED content only (not from watched content)`
    );
    console.log("Genre IDs:", Array.from(genreIds));

    // Only exclude LIKED content from recommendations (not watched content)
    // This way, we can recommend content with similar genres even if user has watched it (but not liked it)
    console.log(
      `Excluding ${likedContentIds.size} LIKED content items from recommendations (so we don't recommend content user already liked)`
    );

    return {
      likedGenres: Array.from(genreIds), // Only genres from LIKED content
      likedContent: Array.from(likedContentIds),
      excludeIds: Array.from(likedContentIds), // Only exclude LIKED content, not watched content
    };
  } catch (error) {
    console.error("Error fetching user content for recommendations:", error);
    return { likedGenres: [], likedContent: [], excludeIds: [] };
  }
}

// Fetch recommendations based on user's liked/watched content
async function fetchRecommendations(limit = 5, offset = 0) {
  try {
    // Get user's content data (genres, liked content, exclude IDs)
    const userData = await getUserContentForRecommendations();

    console.log("=== RECOMMENDATIONS DEBUG ===");
    console.log("User data for recommendations:", {
      likedGenresCount: userData.likedGenres.length,
      likedGenres: userData.likedGenres,
      likedContentCount: userData.likedContent.length,
      likedContent: userData.likedContent,
      excludeIdsCount: userData.excludeIds.length,
      excludeIds: userData.excludeIds,
    });

    // If user has no liked content (no genres), return empty array
    // We need at least some liked genres to make recommendations
    if (userData.likedGenres.length === 0) {
      console.log(
        "No liked genres found for recommendations - user needs to like content first"
      );
      return [];
    }

    // Call recommendations API
    const requestBody = {
      likedGenres: userData.likedGenres,
      likedContent: userData.likedContent,
      excludeIds: userData.excludeIds,
    };

    console.log("Sending request to API:", {
      url: `${API_BASE_URL}/content/recommendations?limit=${limit}`,
      body: requestBody,
    });

    const response = await fetch(
      `${API_BASE_URL}/content/recommendations?limit=${limit}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      throw new Error(`Network response was not ok: ${response.status}`);
    }

    const data = await response.json();
    console.log("API Response:", {
      success: data.success,
      count: data.count,
      recommendationsCount: data.data?.length || 0,
      recommendations: data.data?.map((item) => ({
        id: item._id,
        title: item.title,
        genres: item.genres?.map((g) => (typeof g === "object" ? g.name : g)),
        genreMatchCount: item.genreMatchCount,
        recommendationScore: item.recommendationScore,
      })),
    });

    // Log full response for debugging
    console.log("Full API Response data:", data);

    // If we got fewer recommendations than requested, log why
    if (data.data && data.data.length < limit) {
      console.warn(
        `⚠️ Only got ${data.data.length} recommendations out of ${limit} requested. This might mean:`
      );
      console.warn("1. Not enough content in database with matching genres");
      console.warn(
        "2. All content with matching genres is already in excludeIds"
      );
      console.warn("3. Database has limited content");
    }

    const recommendations = data.data || [];
    console.log(`Returning ${recommendations.length} recommendations`);
    console.log("=== END RECOMMENDATIONS DEBUG ===");

    return recommendations;
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
}

// Create a content card for horizontal row
function createHorizontalCard(item) {
  const card = document.createElement("div");
  card.className = "content-card";

  // Get image URL and fix path if needed
  let imageUrl = item.imageUrl || "/posters/placeholder.jpg";
  if (imageUrl.startsWith("/assets/posters/")) {
    imageUrl = imageUrl.replace("/assets/posters/", "/posters/");
  } else if (imageUrl.startsWith("./posters/")) {
    imageUrl = imageUrl.replace("./posters/", "/posters/");
  }

  // Check if the item is liked
  const itemId = item._id;
  const isLiked = likedContent[itemId];
  const heartIcon = isLiked ? "❤️" : "🤍";
  // Compute genre display (match genre page)
  let genreDisplay = "Unknown";
  if (item.genres && item.genres.length > 0) {
    if (typeof item.genres[0] === "object") {
      genreDisplay = item.genres.map((g) => g.name).join(", ");
    } else {
      genreDisplay = item.genres.join(", ");
    }
  }
  // Initialize watched state
  if (window.ViewingActions) window.ViewingActions.init();
  const watchBtnHtml = window.ViewingActions
    ? window.ViewingActions.getWatchButtonHtml(itemId)
    : `<button class="watch-button" data-id="${itemId}">Mark as Watched</button>`;

  card.innerHTML = `
    <div class="content-poster">
      <img src="${imageUrl}" alt="${
    item.title
  }" onerror="this.src='/posters/nature.jpg'">
      ${
        window.ViewingActions && window.ViewingActions.isWatched(itemId)
          ? '<span class="watched-badge">✓ Watched</span>'
          : ""
      }
    </div>
    <div class="content-info">
      <h3 class="content-title">${item.title}</h3>
      <div class="content-metadata">
        <span class="content-year">${item.releaseYear || "Unknown"}</span>
        <span class="content-genre">${genreDisplay}</span>
      </div>
      <div class="content-stats">
        <span class="content-rating">★ ${item.rating || "N/A"}</span>
        <button class="like-button ${
          isLiked ? "liked" : ""
        }" data-id="${itemId}">
          <span class="heart">${heartIcon}</span>
        </button>
      </div>
      <div class="content-actions">
        ${watchBtnHtml}
      </div>
    </div>
  `;

  // Make the card clickable
  card.addEventListener("click", (e) => {
    if (e.target.closest(".like-button")) return;
    window.location.href = `/content/${itemId}`;
  });

  // Add like button functionality
  const likeButton = card.querySelector(".like-button");
  likeButton.addEventListener("click", async (e) => {
    e.stopPropagation();

    const isCurrentlyLiked = likedContent[itemId];
    const newLikedState = !isCurrentlyLiked;

    // Optimistic UI update
    if (newLikedState) {
      likedContent[itemId] = true;
      likeButton.classList.add("liked");
      likeButton.querySelector(".heart").textContent = "❤️";
    } else {
      delete likedContent[itemId];
      likeButton.classList.remove("liked");
      likeButton.querySelector(".heart").textContent = "🤍";
    }

    // Update on server
    updateLike(itemId, newLikedState)
      .then(() => {
        // Save to localStorage after successful update
        localStorage.setItem("likedContent", JSON.stringify(likedContent));
        console.log(`Updated like status for ${item.title}`);

        // Refresh recommendations if we're on the home page
        const activeCategory = document
          .querySelector(".nav-link.active")
          ?.getAttribute("data-category");
        if (activeCategory === "home") {
          console.log("Refreshing recommendations after like toggle");
          refreshRecommendations();
        }
      })
      .catch((error) => {
        console.error("Failed to update like status:", error);
        // Revert optimistic update on error
        if (newLikedState) {
          delete likedContent[itemId];
          likeButton.classList.remove("liked");
          likeButton.querySelector(".heart").textContent = "🤍";
        } else {
          likedContent[itemId] = true;
          likeButton.classList.add("liked");
          likeButton.querySelector(".heart").textContent = "❤️";
        }
      });
  });

  // Add watch button functionality
  const watchButton = card.querySelector(".watch-button");
  if (watchButton && window.ViewingActions) {
    const posterEl = card.querySelector(".content-poster");
    // Pass callback to refresh recommendations after watch toggle
    const onAfterWatchToggle = () => {
      const activeCategory = document
        .querySelector(".nav-link.active")
        ?.getAttribute("data-category");
      if (activeCategory === "home") {
        console.log(
          "Refreshing recommendations and continue watching after watch toggle"
        );
        refreshRecommendations();
        refreshContinueWatching();
      }
    };
    window.ViewingActions.attachWatchHandler(
      watchButton,
      posterEl,
      itemId,
      onAfterWatchToggle
    );
  }

  return card;
}

// Display content in horizontal row
function displayContentInRow(rowElement, contentArray, append = false) {
  if (!append) {
    rowElement.innerHTML = "";
  }
  contentArray.forEach((item) => {
    const card = createHorizontalCard(item);
    rowElement.appendChild(card);
  });
}

// Setup infinite horizontal scroll (carousel) for a section
// True carousel: duplicate content at the end, seamless infinite scroll
// Only works if there are 5+ content items in the section
function setupInfiniteHorizontalScroll(
  scrollContainer,
  rowElement,
  sectionType,
  fetchFunction,
  fetchParams = {}
) {
  // Prevent duplicate listeners
  if (scrollContainer.dataset.infiniteScrollSetup === "true") {
    return;
  }

  // Check if there are 5+ content items (cards) in the row
  // Count actual content cards (not loading messages or error messages)
  // Include both regular content cards and continue-watching cards
  const contentCards = rowElement.querySelectorAll(
    ".content-card:not(.loading):not(.error)"
  );
  const contentCount = contentCards.length;

  // Only setup carousel if there are 5+ content items
  if (contentCount < 5) {
    console.log(
      `[${sectionType}] Only ${contentCount} items, skipping carousel (needs 5+)`
    );
    return;
  }

  // Mark as setup to prevent duplicate listeners
  scrollContainer.dataset.infiniteScrollSetup = "true";

  // Wait for layout to be ready and images to load before measuring
  let retryCount = 0;
  const maxRetries = 20;

  const setupCarousel = () => {
    // Check if scrollContainer and rowElement exist and are visible
    if (!scrollContainer || !rowElement) {
      console.warn(
        `[${sectionType}] Scroll container or row element not found`
      );
      return;
    }

    // Store the scrollWidth of the scrollContainer (which contains the rowElement)
    // This is the actual scrollable width
    const originalScrollWidth = scrollContainer.scrollWidth;
    const clientWidth = scrollContainer.clientWidth;
    const rowWidth = rowElement.scrollWidth;

    // Debug logging
    console.log(
      `[${sectionType}] Setup attempt ${
        retryCount + 1
      }: scrollWidth=${originalScrollWidth}, rowWidth=${rowWidth}, clientWidth=${clientWidth}`
    );

    if (
      (originalScrollWidth === 0 ||
        originalScrollWidth <= clientWidth ||
        rowWidth === 0) &&
      retryCount < maxRetries
    ) {
      // Content might not be laid out yet, try again
      retryCount++;
      setTimeout(setupCarousel, 150);
      return;
    }

    if (originalScrollWidth === 0 || originalScrollWidth <= clientWidth) {
      console.warn(
        `[${sectionType}] Could not setup carousel after ${retryCount} retries: scrollWidth=${originalScrollWidth}, clientWidth=${clientWidth}, rowWidth=${rowWidth}`
      );
      return;
    }

    // Clone all content cards and append them at the end for seamless looping
    const originalCards = Array.from(contentCards);
    originalCards.forEach((card) => {
      const clonedCard = card.cloneNode(true);
      clonedCard.classList.add("carousel-duplicate");
      rowElement.appendChild(clonedCard);
    });

    // Store original cards for later duplication
    const originalCardsArray = Array.from(contentCards);

    // After cloning, calculate the original width (half of new scrollWidth)
    // Wait a bit for layout to update after cloning
    setTimeout(() => {
      const newScrollWidth = scrollContainer.scrollWidth;
      const originalWidth = newScrollWidth / 2;

      console.log(
        `[${sectionType}] Carousel setup complete: originalWidth=${originalWidth}, newScrollWidth=${newScrollWidth}, clientWidth=${clientWidth}`
      );

      // Infinite scroll: add more duplicates when reaching the end
      // This allows continuous scrolling without jumping back
      let isAddingMore = false;

      const handleScroll = () => {
        if (isAddingMore) {
          return;
        }

        const scrollLeft = scrollContainer.scrollLeft;
        const currentScrollWidth = scrollContainer.scrollWidth;
        const currentClientWidth = scrollContainer.clientWidth;

        // Calculate how close we are to the end (within 200px of the end)
        const distanceFromEnd =
          currentScrollWidth - scrollLeft - currentClientWidth;

        // If we're close to the end (within 200px), add more duplicates
        if (distanceFromEnd < 200) {
          isAddingMore = true;

          // Clone all original cards again and append them
          originalCardsArray.forEach((card) => {
            const clonedCard = card.cloneNode(true);
            clonedCard.classList.add("carousel-duplicate");
            rowElement.appendChild(clonedCard);
          });

          // Reset flag after a short delay
          setTimeout(() => {
            isAddingMore = false;
          }, 100);
        }
      };

      scrollContainer.addEventListener("scroll", handleScroll, {
        passive: true,
      });
    }, 50);
  };

  // Try to setup immediately, then retry if needed
  setupCarousel();
}

// Store all continue watching content for pagination
let allContinueWatchingContent = [];

// Fetch content that user is currently watching (has progress but not completed)
async function fetchContinueWatching(page = 1, limit = ITEMS_PER_LOAD) {
  console.log(
    `[Continue Watching] fetchContinueWatching called with page=${page}, limit=${limit}`
  );
  try {
    // If first page, fetch all content
    if (page === 1) {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      const currentProfile = JSON.parse(localStorage.getItem("currentProfile"));
      console.log(
        `[Continue Watching] User: ${currentUser?.id}, Profile: ${currentProfile?.id}`
      );

      if (!currentUser || !currentUser.id) {
        console.log(`[Continue Watching] No user found, returning empty`);
        allContinueWatchingContent = [];
        return { content: [], hasMore: false, total: 0 };
      }

      // Get viewing habits with progress but not completed
      const profileQuery = currentProfile?.id
        ? `&profile=${currentProfile.id}`
        : "";
      const url = `${API_BASE_URL}/viewings?user=${currentUser.id}${profileQuery}&limit=1000`;
      console.log(`[Continue Watching] Fetching from URL: ${url}`);

      const response = await fetch(url);
      console.log(
        `[Continue Watching] Response status: ${response.status} ${response.statusText}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[Continue Watching] API error: ${response.status} - ${errorText}`
        );
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      console.log(`[Continue Watching] API response:`, data);

      if (!data.data || !Array.isArray(data.data)) {
        allContinueWatchingContent = [];
        return { content: [], hasMore: false, total: 0 };
      }

      // Filter for content with progress but not completed
      // Include both movies (episode = null) and series episodes
      console.log(
        `[Continue Watching] Total viewings fetched: ${data.data?.length || 0}`
      );

      // Log all items first to see what we're working with
      console.log(`[Continue Watching] All viewings data:`, data.data);

      const inProgressItems = data.data.filter((item) => {
        // Skip items without content (shouldn't happen, but safety check)
        if (!item.content) {
          console.warn(
            `[Continue Watching] Skipping item without content:`,
            item
          );
          return false;
        }

        const hasProgress = item.lastPositionSec && item.lastPositionSec > 0;
        const notCompleted = !item.completed;
        const isEpisode = !!item.episode;
        const isMovie = !item.episode;

        const shouldInclude = hasProgress && notCompleted;

        // Helper function to safely get content ID
        const getContentId = () => {
          if (!item.content) return null;
          return typeof item.content === "object"
            ? item.content._id
            : item.content;
        };

        // Helper function to safely get episode ID
        const getEpisodeId = () => {
          if (!item.episode) return null;
          return typeof item.episode === "object"
            ? item.episode._id
            : item.episode;
        };

        // Log all items to see why they're being filtered out
        if (!shouldInclude) {
          console.log(`[Continue Watching] Excluding item:`, {
            contentId: getContentId(),
            episodeId: getEpisodeId(),
            type: isEpisode ? "episode" : "movie",
            lastPositionSec: item.lastPositionSec,
            durationSec: item.durationSec,
            completed: item.completed,
            hasProgress: hasProgress,
            notCompleted: notCompleted,
            reason: !hasProgress ? "no progress" : "completed",
          });
        } else {
          console.log(`[Continue Watching] Including item:`, {
            contentId: getContentId(),
            episodeId: getEpisodeId(),
            type: isEpisode ? "episode" : "movie",
            lastPositionSec: item.lastPositionSec,
            durationSec: item.durationSec,
            completed: item.completed,
            lastWatchedAt: item.lastWatchedAt,
          });
        }

        return shouldInclude;
      });

      console.log(
        `[Continue Watching] Filtered in-progress items: ${inProgressItems.length}`
      );

      if (inProgressItems.length === 0) {
        console.log(`[Continue Watching] No in-progress items found`);
        allContinueWatchingContent = [];
        return { content: [], hasMore: false, total: 0 };
      }

      // Group by content ID to avoid duplicates
      // If user is watching multiple episodes from the same series, show the series once
      const contentMap = new Map();

      // Sort by lastWatchedAt (most recent first)
      inProgressItems.sort((a, b) => {
        const dateA = new Date(a.lastWatchedAt || 0);
        const dateB = new Date(b.lastWatchedAt || 0);
        return dateB - dateA;
      });

      // Process items and group by content ID
      for (const item of inProgressItems) {
        // Skip items without content (shouldn't happen, but safety check)
        if (!item.content) {
          console.warn(
            `[Continue Watching] Skipping item without content in grouping:`,
            item
          );
          continue;
        }

        const contentId =
          typeof item.content === "object" ? item.content._id : item.content;

        // If this content is already in the map, keep the one with the most recent lastWatchedAt
        if (!contentMap.has(contentId)) {
          contentMap.set(contentId, item);
          console.log(
            `[Continue Watching] Added content ${contentId} to map (episode: ${
              item.episode ? "yes" : "no"
            })`
          );
        } else {
          const existingItem = contentMap.get(contentId);
          const existingDate = new Date(existingItem.lastWatchedAt || 0);
          const currentDate = new Date(item.lastWatchedAt || 0);
          if (currentDate > existingDate) {
            contentMap.set(contentId, item);
            console.log(
              `[Continue Watching] Updated content ${contentId} in map with more recent episode`
            );
          }
        }
      }

      console.log(
        `[Continue Watching] Unique content items after grouping: ${contentMap.size}`
      );

      // Fetch full content details for unique content items
      const contentPromises = Array.from(contentMap.values()).map(
        async (item) => {
          try {
            const contentId =
              typeof item.content === "object"
                ? item.content._id
                : item.content;
            const contentResponse = await fetch(
              `${API_BASE_URL}/content/${contentId}`
            );
            if (!contentResponse.ok) return null;
            const contentData = await contentResponse.json();

            // Add progress info to content
            const content = contentData.data;
            content.progress = {
              lastPositionSec: item.lastPositionSec,
              durationSec: item.durationSec,
              percentage:
                item.durationSec > 0
                  ? Math.round((item.lastPositionSec / item.durationSec) * 100)
                  : 0,
            };

            // If this is an episode, mark it as a series for display
            if (item.episode) {
              content.isSeries = true;
              // Store episode info for potential future use
              content.lastWatchedEpisode = {
                episodeId:
                  typeof item.episode === "object"
                    ? item.episode._id
                    : item.episode,
                episodeTitle:
                  typeof item.episode === "object"
                    ? item.episode.title
                    : "Episode",
              };
            }

            return content;
          } catch (error) {
            console.error(
              `Error fetching content for continue watching:`,
              error
            );
            return null;
          }
        }
      );

      const contents = await Promise.all(contentPromises);
      allContinueWatchingContent = contents.filter(
        (content) => content !== null
      );

      console.log(
        `[Continue Watching] Final content items: ${allContinueWatchingContent.length}`
      );
      allContinueWatchingContent.forEach((content) => {
        console.log(
          `[Continue Watching] Content: ${content.title} (${
            content.isSeries ? "Series" : "Movie"
          }), Progress: ${content.progress?.percentage || 0}%`
        );
      });
    }

    // Return paginated results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedContent = allContinueWatchingContent.slice(
      startIndex,
      endIndex
    );
    const hasMore = endIndex < allContinueWatchingContent.length;

    return {
      content: paginatedContent,
      hasMore: hasMore,
      total: allContinueWatchingContent.length,
    };
  } catch (error) {
    console.error("Error fetching continue watching content:", error);
    return { content: [], hasMore: false, total: 0 };
  }
}

// Create a content card with progress bar for continue watching
function createContinueWatchingCard(item) {
  const card = document.createElement("div");
  card.className = "content-card continue-watching-card";

  // Get image URL and fix path if needed
  let imageUrl = item.imageUrl || "/posters/placeholder.jpg";
  if (imageUrl.startsWith("/assets/posters/")) {
    imageUrl = imageUrl.replace("/assets/posters/", "/posters/");
  } else if (imageUrl.startsWith("./posters/")) {
    imageUrl = imageUrl.replace("./posters/", "/posters/");
  }

  const itemId = item._id;
  const progress = item.progress || {};
  const percentage = progress.percentage || 0;

  // Check if the item is liked
  const isLiked = likedContent[itemId];
  const heartIcon = isLiked ? "❤️" : "🤍";

  // Compute genre display
  let genreDisplay = "Unknown";
  if (item.genres && item.genres.length > 0) {
    if (typeof item.genres[0] === "object") {
      genreDisplay = item.genres.map((g) => g.name).join(", ");
    } else {
      genreDisplay = item.genres.join(", ");
    }
  }

  card.innerHTML = `
    <div class="content-poster">
      <img src="${imageUrl}" alt="${
    item.title
  }" onerror="this.src='/posters/nature.jpg'">
      <div class="continue-watching-progress-bar">
        <div class="continue-watching-progress-fill" style="width: ${percentage}%"></div>
      </div>
    </div>
    <div class="content-info">
      <h3 class="content-title">${item.title}</h3>
      <div class="content-metadata">
        <span class="content-year">${item.releaseYear || "Unknown"}</span>
        <span class="content-genre">${genreDisplay}</span>
      </div>
      <div class="content-stats">
        <span class="content-rating">★ ${item.rating || "N/A"}</span>
        <button class="like-button ${
          isLiked ? "liked" : ""
        }" data-id="${itemId}">
          <span class="heart">${heartIcon}</span>
        </button>
      </div>
      <div class="continue-watching-info">
        <span class="continue-watching-percentage">${percentage}% watched</span>
      </div>
    </div>
  `;

  // Make the card clickable
  card.addEventListener("click", (e) => {
    if (e.target.closest(".like-button")) return;
    window.location.href = `/content/${itemId}`;
  });

  // Add like button functionality
  const likeButton = card.querySelector(".like-button");
  likeButton.addEventListener("click", async (e) => {
    e.stopPropagation();

    const isCurrentlyLiked = likedContent[itemId];
    const newLikedState = !isCurrentlyLiked;

    // Optimistic UI update
    if (newLikedState) {
      likedContent[itemId] = true;
      likeButton.classList.add("liked");
      likeButton.querySelector(".heart").textContent = "❤️";
    } else {
      delete likedContent[itemId];
      likeButton.classList.remove("liked");
      likeButton.querySelector(".heart").textContent = "🤍";
    }

    // Update on server
    updateLike(itemId, newLikedState)
      .then(() => {
        localStorage.setItem("likedContent", JSON.stringify(likedContent));
        console.log(`Updated like status for ${item.title}`);
      })
      .catch((error) => {
        console.error("Failed to update like status:", error);
        // Revert optimistic update on error
        if (newLikedState) {
          delete likedContent[itemId];
          likeButton.classList.remove("liked");
          likeButton.querySelector(".heart").textContent = "🤍";
        } else {
          likedContent[itemId] = true;
          likeButton.classList.add("liked");
          likeButton.querySelector(".heart").textContent = "❤️";
        }
      });
  });

  return card;
}

// Refresh continue watching section (called after watch/progress actions)
async function refreshContinueWatching() {
  try {
    const continueWatchingRow = document.getElementById("continueWatchingRow");
    if (!continueWatchingRow) return;

    // Reset the cached content
    allContinueWatchingContent = [];

    // Fetch fresh continue watching content
    const continueWatchingResult = await fetchContinueWatching(
      1,
      ITEMS_PER_LOAD
    );

    if (continueWatchingResult.content.length > 0) {
      infiniteScrollState.continueWatching = {
        page: 1,
        hasMore: continueWatchingResult.hasMore,
        isLoading: false,
        hasLooped: false,
      };
      continueWatchingRow.innerHTML = "";
      continueWatchingResult.content.forEach((item) => {
        const card = createContinueWatchingCard(item);
        continueWatchingRow.appendChild(card);
      });
      // Re-setup infinite scroll
      const continueWatchingSection = document.getElementById(
        "continueWatchingSection"
      );
      if (continueWatchingSection) {
        continueWatchingSection.dataset.infiniteScrollSetup = "false";
        setupInfiniteHorizontalScroll(
          continueWatchingSection,
          continueWatchingRow,
          "continueWatching",
          fetchContinueWatching
        );
      }
      // Show the section
      if (continueWatchingSection) {
        continueWatchingSection.closest(".content-section").style.display =
          "block";
      }
    } else {
      // Hide the section if no content to continue watching
      const continueWatchingSection = document.getElementById(
        "continueWatchingSection"
      );
      if (continueWatchingSection) {
        continueWatchingSection.closest(".content-section").style.display =
          "none";
      }
    }
  } catch (error) {
    console.error("Error refreshing continue watching:", error);
  }
}

// Refresh recommendations section (called after like/watch actions)
async function refreshRecommendations() {
  try {
    const recommendedRow = document.getElementById("recommendedRow");
    if (!recommendedRow) return;

    // Show loading state
    recommendedRow.innerHTML = `<div class="loading" style="padding: 20px; color: #aaa;">Refreshing recommendations...</div>`;

    // Fetch fresh recommendations
    const recommendedContent = await fetchRecommendations(5);

    if (recommendedContent.length > 0) {
      infiniteScrollState.recommended = {
        page: 1,
        hasMore: recommendedContent.length >= 5,
        isLoading: false,
        hasLooped: false,
      };
      displayContentInRow(recommendedRow, recommendedContent);
      // Re-setup infinite scroll (in case it wasn't set up before)
      const recommendedSection = document.getElementById("recommendedSection"); // This is the .horizontal-scroll element itself
      if (recommendedSection) {
        // Remove old listener if exists
        recommendedSection.dataset.infiniteScrollSetup = "false";
        setupInfiniteHorizontalScroll(
          recommendedSection,
          recommendedRow,
          "recommended",
          fetchRecommendations
        );
      }
      // Show the section
      const recommendedSectionElement =
        document.getElementById("recommendedSection");
      if (recommendedSectionElement) {
        recommendedSectionElement.closest(".content-section").style.display =
          "block";
      }
    } else {
      // Hide the section if no recommendations
      const recommendedSectionElement =
        document.getElementById("recommendedSection");
      if (recommendedSectionElement) {
        recommendedSectionElement.closest(".content-section").style.display =
          "none";
      }
    }
  } catch (error) {
    console.error("Error refreshing recommendations:", error);
  }
}

// Display home page with horizontal sections
// Flag to prevent multiple simultaneous calls
let isLoadingHomeSections = false;

async function displayHomeSections() {
  console.log("displayHomeSections called");

  // Check if there's a search term - if so, don't display home sections
  // This check MUST be first, before any other checks
  const searchTerm = searchInput ? searchInput.value.trim() : "";
  if (searchTerm) {
    console.log(
      "Search term exists, skipping home sections display:",
      searchTerm
    );
    isLoadingHomeSections = false; // Reset flag so it can run again when search is cleared
    return;
  }

  // Prevent multiple simultaneous calls
  if (isLoadingHomeSections) {
    console.log("Already loading home sections, skipping...");
    return;
  }

  // Check if genres are already loaded to prevent duplicates
  const genreSectionsContainer = document.getElementById("genreSections");
  if (genreSectionsContainer && genreSectionsContainer.children.length > 0) {
    console.log("Genres already loaded, skipping duplicate load...");
    return;
  }

  isLoadingHomeSections = true;

  try {
    // Clear genre sections container first to prevent duplicates
    if (genreSectionsContainer) {
      genreSectionsContainer.innerHTML = "";
    }

    // Load Continue Watching section
    console.log(
      `[Continue Watching] Loading Continue Watching section in displayHomeSections`
    );
    const continueWatchingResult = await fetchContinueWatching(
      1,
      ITEMS_PER_LOAD
    );
    console.log(
      `[Continue Watching] Result from fetchContinueWatching:`,
      continueWatchingResult
    );
    const continueWatchingRow = document.getElementById("continueWatchingRow");
    const continueWatchingSection = document.getElementById(
      "continueWatchingSection"
    ); // This is the .horizontal-scroll element itself
    console.log(
      `[Continue Watching] Row element:`,
      continueWatchingRow,
      `Section element:`,
      continueWatchingSection
    );
    if (continueWatchingRow) {
      console.log(
        `[Continue Watching] Found continueWatchingRow, content length: ${continueWatchingResult.content.length}`
      );
      if (continueWatchingResult.content.length > 0) {
        console.log(
          `[Continue Watching] Displaying ${continueWatchingResult.content.length} items`
        );
        infiniteScrollState.continueWatching = {
          page: 1,
          hasMore: continueWatchingResult.hasMore,
          isLoading: false,
          hasLooped: false,
        };
        // Use displayContentInRow but with continue watching cards
        continueWatchingRow.innerHTML = "";
        continueWatchingResult.content.forEach((item) => {
          const card = createContinueWatchingCard(item);
          continueWatchingRow.appendChild(card);
        });
        // Setup infinite scroll
        if (continueWatchingSection) {
          setupInfiniteHorizontalScroll(
            continueWatchingSection,
            continueWatchingRow,
            "continueWatching",
            fetchContinueWatching
          );
        }
        // Show the section
        if (continueWatchingSection) {
          continueWatchingSection.closest(".content-section").style.display =
            "block";
        }
      } else {
        // Hide the section if no content to continue watching
        if (continueWatchingSection) {
          continueWatchingSection.closest(".content-section").style.display =
            "none";
        }
      }
    }

    // Load Recommended for You section
    const recommendedContent = await fetchRecommendations(5);
    const recommendedRow = document.getElementById("recommendedRow");
    const recommendedSection = document.getElementById("recommendedSection"); // This is the .horizontal-scroll element itself
    if (recommendedRow) {
      if (recommendedContent.length > 0) {
        infiniteScrollState.recommended = {
          page: 1,
          hasMore: recommendedContent.length >= 5,
          isLoading: false,
          hasLooped: false,
        };
        displayContentInRow(recommendedRow, recommendedContent);
        // Setup infinite scroll
        if (recommendedSection) {
          setupInfiniteHorizontalScroll(
            recommendedSection,
            recommendedRow,
            "recommended",
            fetchRecommendations
          );
        }
        // Show the section
        const recommendedSectionElement =
          document.getElementById("recommendedSection");
        if (recommendedSectionElement) {
          recommendedSectionElement.closest(".content-section").style.display =
            "block";
        }
      } else {
        // Hide the section if no recommendations
        const recommendedSectionElement =
          document.getElementById("recommendedSection");
        if (recommendedSectionElement) {
          recommendedSectionElement.closest(".content-section").style.display =
            "none";
        }
      }
    }

    // Load Popular Now section
    const popularResult = await fetchPopularContent(1, ITEMS_PER_LOAD);
    const popularRow = document.getElementById("popularRow");
    const popularSection = document.getElementById("popularSection"); // This is the .horizontal-scroll element itself
    if (popularRow && popularResult.content.length > 0) {
      infiniteScrollState.popular = {
        page: 1,
        hasMore: popularResult.hasMore,
        isLoading: false,
        hasLooped: false,
      };
      displayContentInRow(popularRow, popularResult.content);
      // Setup infinite scroll
      if (popularSection) {
        setupInfiniteHorizontalScroll(
          popularSection,
          popularRow,
          "popular",
          fetchPopularContent
        );
      }
    }

    // Load New Releases section
    const newestResult = await fetchNewestContent(1, ITEMS_PER_LOAD);
    const newReleasesRow = document.getElementById("newReleasesRow");
    const newReleasesSection = document.getElementById("newReleasesSection"); // This is the .horizontal-scroll element itself
    if (newReleasesRow && newestResult.content.length > 0) {
      infiniteScrollState.newReleases = {
        page: 1,
        hasMore: newestResult.hasMore,
        isLoading: false,
        hasLooped: false,
      };
      displayContentInRow(newReleasesRow, newestResult.content);
      // Setup infinite scroll
      if (newReleasesSection) {
        setupInfiniteHorizontalScroll(
          newReleasesSection,
          newReleasesRow,
          "newReleases",
          fetchNewestContent
        );
      }
    }

    // Load genres and create dynamic genre sections
    if (!genreSectionsContainer) {
      console.error("genreSections container not found!");
      isLoadingHomeSections = false;
      return;
    }

    try {
      const genresResponse = await fetch(`${API_BASE_URL}/genres`);
      console.log(
        "Genres API Response:",
        genresResponse.status,
        genresResponse.statusText
      );

      if (!genresResponse.ok) {
        console.error(
          "Failed to fetch genres:",
          genresResponse.status,
          genresResponse.statusText
        );
        genreSectionsContainer.innerHTML = `
          <div class="error-message" style="padding: 20px; color: #aaa; text-align: center;">
            Failed to load genres. Please try again later.
          </div>
        `;
        return;
      }

      const genresData = await genresResponse.json();
      console.log("Genres Data:", genresData);
      const genres = genresData.data || [];

      if (genres.length === 0) {
        console.warn("No genres found in API response");
        genreSectionsContainer.innerHTML = `
          <div class="error-message" style="padding: 20px; color: #aaa; text-align: center;">
            No genres available.
          </div>
        `;
        return;
      }

      genreSectionsContainer.innerHTML = "";
      let sectionsCreated = 0;

      // Create a section for each genre
      for (const genre of genres) {
        if (!genre.isActive) {
          console.log(`Skipping inactive genre: ${genre.name}`);
          continue;
        }

        console.log(
          `Loading content for genre: ${genre.name} (ID: ${genre._id})`
        );

        try {
          const newestByGenreResult = await fetchNewestByGenre(
            genre._id,
            1,
            ITEMS_PER_LOAD
          );
          console.log(
            `Content for ${genre.name}:`,
            newestByGenreResult?.content?.length || 0,
            "items"
          );

          // Even if there's no content, show the genre section so users can click on it
          // Convert genre ID to string to ensure proper URL encoding
          const genreId = String(genre._id);

          const section = document.createElement("section");
          section.className = "content-section";

          if (
            newestByGenreResult &&
            newestByGenreResult.content &&
            newestByGenreResult.content.length > 0
          ) {
            section.innerHTML = `
              <div class="section-header">
                <h2 class="section-title genre-link" data-genre-id="${genreId}" style="cursor: pointer;" title="Click to view all ${genre.name} content">
                  ${genre.name}
                </h2>
                <a href="/genre?id=${genreId}" class="view-all-link" title="View all ${genre.name} content">View All →</a>
              </div>
              <div class="horizontal-scroll">
                <div class="content-row" data-genre-id="${genreId}"></div>
              </div>
            `;

            const row = section.querySelector(".content-row");
            const scrollContainer = section.querySelector(".horizontal-scroll");
            // Initialize state for this genre
            infiniteScrollState.genres[genreId] = {
              page: 1,
              hasMore: newestByGenreResult.hasMore,
              isLoading: false,
              hasLooped: false,
            };
            displayContentInRow(row, newestByGenreResult.content);
            // Setup infinite scroll
            if (scrollContainer) {
              setupInfiniteHorizontalScroll(
                scrollContainer,
                row,
                "genre",
                fetchNewestByGenre
              );
            }
          } else {
            // Show genre section even if no content (so users can click to see genre page)
            section.innerHTML = `
              <div class="section-header">
                <h2 class="section-title genre-link" data-genre-id="${genreId}" style="cursor: pointer;" title="Click to view all ${genre.name} content">
                  ${genre.name}
                </h2>
                <a href="/genre?id=${genreId}" class="view-all-link" title="View all ${genre.name} content">View All →</a>
              </div>
              <div class="horizontal-scroll">
                <div class="content-row" data-genre-id="${genreId}">
                  <p style="color: #aaa; padding: 20px;">No content available yet.</p>
                </div>
              </div>
            `;
          }

          // Add click handler to genre title
          const genreLink = section.querySelector(".genre-link");
          if (genreLink) {
            genreLink.addEventListener("click", (e) => {
              e.preventDefault();
              window.location.href = `/genre?id=${genreId}`;
            });
          }

          genreSectionsContainer.appendChild(section);
          sectionsCreated++;
        } catch (genreError) {
          console.error(
            `Error loading content for genre ${genre.name}:`,
            genreError
          );
        }
      }

      console.log(`Created ${sectionsCreated} genre sections`);

      if (sectionsCreated === 0) {
        genreSectionsContainer.innerHTML = `
          <div class="error-message" style="padding: 20px; color: #aaa; text-align: center;">
            No genre sections available. Please try again later.
          </div>
        `;
      }
    } catch (error) {
      console.error("Error fetching genres:", error);
      if (genreSectionsContainer) {
        genreSectionsContainer.innerHTML = `
          <div class="error-message" style="padding: 20px; color: #aaa; text-align: center;">
            Error loading genres. Please check your connection and try again.
          </div>
        `;
      }
    }
  } catch (error) {
    console.error("Error displaying home sections:", error);
  } finally {
    isLoadingHomeSections = false;
  }
}

// פונקציה לטעינת נתונים מה-API (תשמש בעתיד)
async function loadInitialData() {
  try {
    // הצגת מצב טעינה (לא פעיל עדיין)
    console.log("Loading data from API...");

    // טעינת הנתונים מה-API
    const apiContent = await fetchAllContent();
    const apiTvShows = await fetchTVShows();
    const apiMovies = await fetchMovies();
    const apiPopularResult = await fetchPopularContent(1, 20);
    const apiPopular = apiPopularResult.content || [];

    // אחסון במשתנים זמניים (לא משמשים עדיין)
    window.apiData = {
      content: apiContent,
      tvShows: apiTvShows,
      movies: apiMovies,
      popular: apiPopular,
    };

    console.log("API data loaded successfully:", window.apiData);
    return true;
  } catch (error) {
    console.error("Failed to load data from API:", error);
    return false;
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  console.log("Feed page loaded");

  // Check if user is logged in
  if (!localStorage.getItem("isLoggedIn")) {
    console.log("User not logged in, redirecting to login");
    window.location.href = "/login";
    return;
  }

  // Get current profile
  const currentProfile = JSON.parse(localStorage.getItem("currentProfile"));
  if (!currentProfile) {
    console.log("No profile found, redirecting to profiles");
    window.location.href = "/profiles";
    return;
  }

  console.log("User logged in, profile:", currentProfile);

  // Update profile display
  const profileName = document.getElementById("profileName");
  const menuProfileImage = document.getElementById("menuProfileImage");

  profileName.textContent = currentProfile.name;

  // Fix profile image path if needed
  let profileImageUrl = currentProfile.image || "/Images/User1.jpg";
  if (profileImageUrl.startsWith("./Images/")) {
    profileImageUrl = profileImageUrl.replace("./Images/", "/Images/");
  }
  menuProfileImage.src = profileImageUrl;

  // טעינת נתונים מה-API במקביל לנתונים הסטטיים
  // לא משנה את הפונקציונליות הקיימת בשלב זה
  // תצוגה ראשונית של נתונים מה-API בטעינת הדף
  const activeCategory = document
    .querySelector(".nav-link.active")
    .getAttribute("data-category");
  console.log("Active category:", activeCategory);
  displayContent(activeCategory);

  // Search icon functionality
  const searchIcon = document.querySelector(".search-icon");
  const searchInputContainer = document.querySelector(
    ".search-input-container"
  );
  // Set global searchInput reference (defined at top of file)
  searchInput = document.getElementById("searchInput");

  // Flag to prevent multiple simultaneous search operations
  let isSearching = false;

  // Function to perform search (defined here so it's accessible from both icon click and Enter key)
  const performSearch = () => {
    // Prevent multiple simultaneous searches
    if (isSearching) {
      console.log("Search already in progress, skipping...");
      return;
    }

    isSearching = true;
    const searchTerm = searchInput.value.trim();
    console.log("Performing search for:", searchTerm);

    // Reset the home sections loading flag when performing a search
    // This ensures that if user searches, home sections won't interfere
    isLoadingHomeSections = false;

    if (!searchTerm) {
      console.log("No search term, showing all content");
      isSearching = false;
      return;
    }

    const activeCategory = document
      .querySelector(".nav-link.active")
      .getAttribute("data-category");

    displayContent(activeCategory).finally(() => {
      isSearching = false;
    });
  };

  // Toggle search input visibility and perform search if input is visible
  searchIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    const isVisible = searchInputContainer.style.display === "block";

    if (isVisible) {
      // If input is visible, perform search (only if not already searching)
      if (!isSearching) {
        performSearch();
      }
    } else {
      // If input is hidden, show it
      searchInputContainer.style.display = "block";
      searchInput.focus();
    }
  });

  // Search on Enter key press
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!isSearching) {
        performSearch();
      }
    }
  });

  // Close search when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !searchInputContainer.contains(e.target) &&
      !searchIcon.contains(e.target)
    ) {
      searchInputContainer.style.display = "none";
    }
  });

  // Navigation functionality
  // Function to display content
  async function displayContent(category) {
    // First, hide all containers
    document.querySelectorAll(".category-container").forEach((container) => {
      container.style.display = "none";
    });

    // Show the selected container
    const container = document.getElementById(category);
    if (container) {
      container.style.display = "block";

      // Special handling for home page
      if (category === "home") {
        // Get search term from input
        const searchTerm = searchInput ? searchInput.value.trim() : "";

        // If there's a search term, show search results instead of home sections
        if (searchTerm) {
          // Stop any ongoing home sections loading to prevent genres from rendering
          isLoadingHomeSections = false;

          // Hide home sections (popular, new releases, genres) and their titles
          const popularSection = document
            .querySelector("#popularSection")
            ?.closest(".content-section");
          const newReleasesSection = document
            .querySelector("#newReleasesSection")
            ?.closest(".content-section");
          const popularRow = document.getElementById("popularRow");
          const newReleasesRow = document.getElementById("newReleasesRow");
          const genreSectionsContainer =
            document.getElementById("genreSections");

          if (popularSection) popularSection.style.display = "none";
          if (newReleasesSection) newReleasesSection.style.display = "none";
          if (popularRow) popularRow.style.display = "none";
          if (newReleasesRow) newReleasesRow.style.display = "none";
          if (genreSectionsContainer) {
            genreSectionsContainer.style.display = "none";
            // Clear genres container to prevent duplicates when search is cleared
            genreSectionsContainer.innerHTML = "";
          }

          // Create search results section with horizontal scroll (like Netflix)
          let searchSection = container.querySelector(
            ".search-results-section"
          );
          if (!searchSection) {
            searchSection = document.createElement("section");
            searchSection.className = "content-section search-results-section";
            searchSection.innerHTML = `
              <h2 class="section-title">Search Results</h2>
              <div class="horizontal-scroll">
                <div class="content-row" id="searchResultsRow"></div>
              </div>
            `;
            container.appendChild(searchSection);
          }

          searchSection.style.display = "block";
          const searchResultsRow = document.getElementById("searchResultsRow");
          searchResultsRow.innerHTML = `<div class="loading">Searching for "${searchTerm}"...</div>`;

          try {
            // Remove sort parameter - no sorting in search
            const contentToShow = await fetchAllContent(searchTerm, "");

            if (contentToShow.length === 0) {
              searchResultsRow.innerHTML = `
                <div class="no-content" style="padding: 40px; text-align: center; color: #aaa;">
                  <p>No content found for "${searchTerm}". Try a different search term.</p>
                </div>
              `;
              return;
            }

            // Display search results in horizontal row (like Netflix)
            // displayContentInRow already handles card creation and event listeners
            displayContentInRow(searchResultsRow, contentToShow);
            // Setup infinite scroll for search results
            const searchScrollContainer =
              searchSection.querySelector(".horizontal-scroll");
            if (searchScrollContainer) {
              setupInfiniteHorizontalScroll(
                searchScrollContainer,
                searchResultsRow,
                "search",
                null // No fetch function needed for search - it's already loaded
              );
            }
          } catch (error) {
            console.error("Error displaying search results:", error);
            const searchResultsRow =
              document.getElementById("searchResultsRow");
            if (searchResultsRow) {
              searchResultsRow.innerHTML = `
                <div class="error" style="padding: 40px; text-align: center; color: #aaa;">
                  <p>Error loading search results. Please try again later.</p>
                </div>
              `;
            }
          }
        } else {
          // No search term - show regular home sections
          // Hide search results section
          const searchSection = container.querySelector(
            ".search-results-section"
          );
          if (searchSection) searchSection.style.display = "none";

          // Show home sections (popular, new releases, genres) and their titles
          const popularSection = document
            .querySelector("#popularSection")
            ?.closest(".content-section");
          const newReleasesSection = document
            .querySelector("#newReleasesSection")
            ?.closest(".content-section");
          const popularRow = document.getElementById("popularRow");
          const newReleasesRow = document.getElementById("newReleasesRow");
          const genreSectionsContainer =
            document.getElementById("genreSections");
          const grid = container.querySelector(".content-grid");

          if (popularSection) popularSection.style.display = "block";
          if (newReleasesSection) newReleasesSection.style.display = "block";
          if (popularRow) popularRow.style.display = "block";
          if (newReleasesRow) newReleasesRow.style.display = "block";
          if (genreSectionsContainer)
            genreSectionsContainer.style.display = "block";
          if (grid) grid.style.display = "none";

          // Load home sections (displayHomeSections will check for duplicates internally)
          await displayHomeSections();
        }
        return;
      }

      const grid = container.querySelector(".content-grid");
      grid.innerHTML = ""; // Clear existing content

      // Show loading state
      grid.innerHTML = `<div class="loading">Loading content...</div>`;

      try {
        // Choose which content to display - from API
        let contentToShow = [];
        // Get search term from input (trim whitespace, but keep original case for better matching)
        const searchTerm = searchInput ? searchInput.value.trim() : "";
        // No sorting in feed page - removed sort functionality

        console.log(
          "Displaying content for category:",
          category,
          "with search term:",
          searchTerm
        );

        if (category === "tvshows") {
          contentToShow = await fetchTVShows(searchTerm, "");
        } else if (category === "movies") {
          contentToShow = await fetchMovies(searchTerm, "");
        } else if (category === "popular" || category === "newandpopular") {
          // שם הקטגוריה שונה בין הממשק למשתמש לבין הקוד
          const popularResult = await fetchPopularContent(1, 50);
          contentToShow = popularResult.content || [];
        } else if (category === "mylist") {
          // Fetch liked content for My List
          contentToShow = await fetchLikedContent();
        } else {
          contentToShow = await fetchAllContent(searchTerm, "");
        }

        // Clear the loading message
        grid.innerHTML = "";

        // If no content was found
        if (contentToShow.length === 0) {
          if (category === "mylist") {
            grid.innerHTML = `
              <div class="no-content">
                <p>Your list is empty. Start adding content you like!</p>
              </div>
            `;
          } else {
            grid.innerHTML = `
              <div class="no-content">
                <p>No content found. Try different search criteria.</p>
              </div>
            `;
          }
          return;
        }

        // Create and append cards
        contentToShow.forEach((item) => {
          const card = document.createElement("div");
          card.className = "content-card";

          // Get image URL and fix path if needed
          let imageUrl = item.imageUrl || "/posters/placeholder.jpg";

          // Fix image path if it's coming from the API with the wrong path
          if (imageUrl.startsWith("/assets/posters/")) {
            imageUrl = imageUrl.replace("/assets/posters/", "/posters/");
          } else if (imageUrl.startsWith("./posters/")) {
            imageUrl = imageUrl.replace("./posters/", "/posters/");
          }

          // Format genre display
          let genreDisplay = "";
          if (item.genres && item.genres.length > 0) {
            if (typeof item.genres[0] === "object") {
              genreDisplay = item.genres.map((g) => g.name).join(", ");
            } else {
              genreDisplay = item.genres.join(", ");
            }
          } else {
            genreDisplay = "Unknown Genre";
          }

          // Check if the item is liked
          const itemId = item._id; // MongoDB uses _id
          const isLiked = likedContent[itemId];
          const heartIcon = isLiked ? "❤️" : "🤍";

          // Initialize watched state
          if (window.ViewingActions) window.ViewingActions.init();
          const watchBtnHtml = window.ViewingActions
            ? window.ViewingActions.getWatchButtonHtml(itemId)
            : `<button class="watch-button" data-id="${itemId}">Mark as Watched</button>`;

          card.innerHTML = `
            <div class="content-poster">
              <img src="${imageUrl}" alt="${
            item.title
          }" onerror="this.src='/posters/nature.jpg'">
              ${
                window.ViewingActions && window.ViewingActions.isWatched(itemId)
                  ? '<span class="watched-badge">✓ Watched</span>'
                  : ""
              }
            </div>
                    <div class="content-info">
                        <h3 class="content-title">${item.title}</h3>
                        <div class="content-metadata">
                <span class="content-year">${item.releaseYear}</span>
                <span class="content-genre">${genreDisplay}</span>
                        </div>
              <div class="content-stats">
                <span class="content-rating">★ ${item.rating || "N/A"}</span>
                        <button class="like-button ${
                          isLiked ? "liked" : ""
                        }" data-id="${itemId}">
                            <span class="heart">${heartIcon}</span>
                        </button>
              </div>
              <div class="content-actions">
                ${watchBtnHtml}
              </div>
                    </div>
                `;

          // Make the card clickable to view content details
          card.addEventListener("click", (e) => {
            // Prevent click if the like button was clicked
            if (e.target.closest(".like-button")) return;

            // Navigate to content detail page
            window.location.href = `/content/${itemId}`;
          });

          // Add like button functionality
          const likeButton = card.querySelector(".like-button");
          likeButton.addEventListener("click", async (e) => {
            e.stopPropagation(); // Prevent card click event

            const isCurrentlyLiked = likedContent[itemId];
            const newLikedState = !isCurrentlyLiked;

            // Optimistic UI update
            if (newLikedState) {
              likedContent[itemId] = true;
              likeButton.classList.add("liked");
              likeButton.querySelector(".heart").textContent = "❤️";
            } else {
              delete likedContent[itemId];
              likeButton.classList.remove("liked");
              likeButton.querySelector(".heart").textContent = "🤍";
            }

            // Update on server
            updateLike(itemId, newLikedState)
              .then(() => {
                // Save to localStorage after successful update
                localStorage.setItem(
                  "likedContent",
                  JSON.stringify(likedContent)
                );
                console.log(`Updated like status for ${item.title}`);

                // If we're on My List page and user unliked, remove the card
                const activeCategory = document
                  .querySelector(".nav-link.active")
                  ?.getAttribute("data-category");
                if (activeCategory === "mylist" && !newLikedState) {
                  // Remove the card from the grid
                  card.remove();

                  // If no more content, show empty message
                  const grid = document.getElementById("myListGrid");
                  if (grid && grid.children.length === 0) {
                    grid.innerHTML = `
                      <div class="no-content">
                        <p>Your list is empty. Start adding content you like!</p>
                      </div>
                    `;
                  }
                }
              })
              .catch((error) => {
                console.error("Failed to update like status:", error);
                // Revert optimistic update on error
                if (newLikedState) {
                  delete likedContent[itemId];
                  likeButton.classList.remove("liked");
                  likeButton.querySelector(".heart").textContent = "🤍";
                } else {
                  likedContent[itemId] = true;
                  likeButton.classList.add("liked");
                  likeButton.querySelector(".heart").textContent = "❤️";
                }
              });
          });

          // Add watch button functionality
          const watchButton = card.querySelector(".watch-button");
          if (watchButton && window.ViewingActions) {
            const posterEl = card.querySelector(".content-poster");
            window.ViewingActions.attachWatchHandler(
              watchButton,
              posterEl,
              itemId
            );
          }

          grid.appendChild(card);
        });
      } catch (error) {
        console.error("Error displaying content:", error);
        grid.innerHTML = `
          <div class="error">
            <p>Error loading content. Please try again later.</p>
            <p>Details: ${error.message}</p>
          </div>
        `;
      }
    }
  }

  // Add click handlers to nav links
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      // Update active state
      document
        .querySelectorAll(".nav-link")
        .forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      // Get and display content
      const category = link.getAttribute("data-category");
      console.log("Clicked category:", category);
      displayContent(category);
    });
  });

  const contentGrid = document.getElementById("contentGrid");
  // searchInput is already defined above in the search icon functionality section
  // sortSelect removed - no sorting functionality in feed page

  // Load liked content from database
  likedContent = await loadLikedContentFromDB();

  // Also sync with localStorage for offline support
  localStorage.setItem("likedContent", JSON.stringify(likedContent));

  // Show home content initially
  displayContent("home");

  // Event listeners for search
  // Real-time search removed - search only happens on Enter key or icon click
  // (Event listeners are defined above in the search icon functionality section)
});

const dropdownToggle = document.querySelector(".dropdown-icon");
const profileDropdown = document.getElementById("profileDropdown");
const profileMenu = document.querySelector(".profile-menu");
// Toggle dropdown when clicking the toggle
profileMenu.addEventListener("click", (e) => {
  e.stopPropagation(); // prevent bubbling to document
  dropdownToggle.classList.toggle("active");
  profileDropdown.classList.toggle("show");
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (
    !dropdownToggle.contains(e.target) &&
    !profileDropdown.contains(e.target)
  ) {
    dropdownToggle.classList.remove("active");
    profileDropdown.classList.remove("show");
  }
});
// Add click handlers for dropdown items
document.querySelectorAll(".dropdown-item").forEach((item) => {
  item.addEventListener("click", (e) => {
    const action =
      e.target.closest(".dropdown-item")?.dataset.action ||
      e.target.closest(".dropdown-item")?.textContent.trim();
    switch (action) {
      case "settings":
      case "User":
        window.location.href = "/settings";
        break;
      case "switch-profile":
      case "Switch Profile":
        window.location.href = "/profiles";
        break;
      case "logout":
      case "Logout":
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("currentProfile");
        localStorage.removeItem("currentUser");
        window.location.href = "/login";
        break;
    }
  });
});
