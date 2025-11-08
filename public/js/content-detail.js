// API Configuration
const API_BASE_URL = "http://localhost:3000/api";

// Global state - liked content from localStorage
let likedContent = JSON.parse(localStorage.getItem("likedContent")) || {};

// Get content ID from URL path
// URL format: /content/:id (not /content?id=...)
function getContentIdFromUrl() {
  const path = window.location.pathname; // e.g., "/content/69064791bbdeecd4227cf950"
  const pathParts = path.split("/"); // ["", "content", "69064791bbdeecd4227cf950"]

  // Find the content ID (the last part after /content/)
  if (pathParts.length >= 3 && pathParts[1] === "content") {
    return pathParts[2];
  }

  // Fallback: try query string for backwards compatibility
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

// Fetch content details from API
async function fetchContentDetails(contentId) {
  try {
    const response = await fetch(`${API_BASE_URL}/content/${contentId}`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching content details:", error);
    return null;
  }
}

// Fetch episodes for series
async function fetchEpisodes(contentId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/episodes/content/${contentId}`
    );
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();

    // API returns episodes grouped by seasons (seasonMap)
    // Convert to flat array of all episodes
    if (data.data && typeof data.data === "object") {
      const episodesArray = [];
      Object.keys(data.data).forEach((season) => {
        episodesArray.push(...data.data[season]);
      });
      return episodesArray;
    }

    // If it's already an array, return as is
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error("Error fetching episodes:", error);
    return null;
  }
}

// Update views count
async function updateViews(contentId) {
  try {
    await fetch(`${API_BASE_URL}/content/${contentId}/views`, {
      method: "PUT",
    });
  } catch (error) {
    console.error("Error updating views:", error);
  }
}

// Load liked content from database
async function loadLikedContentFromDB() {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser || !currentUser.id) {
      return {};
    }

    const response = await fetch(
      `${API_BASE_URL}/viewings?user=${currentUser.id}&liked=true&limit=1000`
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

// Format runtime
function formatRuntime(minutes) {
  if (!minutes) return "Unknown duration";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

// Episode Progress Management
// Get a unique key for episode progress in localStorage
function getEpisodeProgressKey(episodeId) {
  const currentProfile = JSON.parse(localStorage.getItem("currentProfile"));
  const profileId = currentProfile
    ? currentProfile.id || currentProfile.name
    : "default";
  return `episodeProgress_${profileId}_${episodeId}`;
}

// Load episode progress from localStorage
function loadEpisodeProgress(episodeId) {
  try {
    const key = getEpisodeProgressKey(episodeId);
    const progress = localStorage.getItem(key);
    if (progress) {
      const progressData = JSON.parse(progress);
      return {
        currentTime: progressData.currentTime || 0,
        duration: progressData.duration || 0,
        percentage: progressData.percentage || 0,
        isCompleted: progressData.isCompleted || false,
      };
    }
  } catch (error) {
    console.error("Error loading episode progress:", error);
  }
  return { currentTime: 0, duration: 0, percentage: 0, isCompleted: false };
}

// Save episode progress to localStorage
function saveEpisodeProgress(episodeId, currentTime, duration) {
  try {
    const key = getEpisodeProgressKey(episodeId);
    const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;
    const isCompleted = percentage >= 95; // Consider 95%+ as completed

    const progressData = {
      currentTime: currentTime,
      duration: duration,
      percentage: percentage,
      isCompleted: isCompleted,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(key, JSON.stringify(progressData));
  } catch (error) {
    console.error("Error saving episode progress:", error);
  }
}

// Clear episode progress (when user wants to start over)
function clearEpisodeProgress(episodeId) {
  try {
    const key = getEpisodeProgressKey(episodeId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing episode progress:", error);
  }
}

// Display content details
function displayContentDetails(content) {
  const container = document.getElementById("contentDetailContainer");

  // Fix image path if necessary
  let imageUrl = content.imageUrl || "/posters/placeholder.jpg";
  if (imageUrl.startsWith("/assets/posters/")) {
    imageUrl = imageUrl.replace("/assets/posters/", "/posters/");
  } else if (imageUrl.startsWith("./posters/")) {
    imageUrl = imageUrl.replace("./posters/", "/posters/");
  }

  // Format genres
  let genreNames = "Unknown";
  if (content.genres && content.genres.length > 0) {
    if (typeof content.genres[0] === "object") {
      genreNames = content.genres.map((g) => g.name).join(", ");
    } else {
      genreNames = content.genres.join(", ");
    }
  }

  // Display video if available
  let videoUrl = content.trailerUrl || "";

  // נבדוק אם יש שדה videoUrl בתוכן, ללא קשר לסוג התוכן
  if (content.videoUrl) {
    videoUrl = content.videoUrl;
    console.log("Found videoUrl:", videoUrl);
  }

  // Fix video path if necessary
  if (videoUrl && videoUrl.startsWith("/assets/videos/")) {
    videoUrl = videoUrl.replace("/assets/videos/", "/videos/");
  } else if (videoUrl && videoUrl.startsWith("./videos/")) {
    videoUrl = videoUrl.replace("./videos/", "/videos/");
  }

  // עבור סרטים, נוסיף הדפסת דיבוג לראות אם יש להם videoUrl
  if (content.type === "movie") {
    console.log("Movie content:", content);
    console.log("Video URL for movie:", videoUrl);
  }

  const videoSection = videoUrl
    ? `<div class="video-container">
      <video controls width="100%" poster="${imageUrl}">
        <source src="${videoUrl}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>`
    : `<div class="content-banner">
      <img src="${imageUrl}" alt="${content.title}" onerror="this.src='/Images/placeholder.jpg'">
    </div>`;

  container.innerHTML = `
    <div class="content-detail">
      ${videoSection}
      <div class="content-info-detail">
        <h1>${content.title}</h1>
        <div class="content-meta">
          <span class="year">${content.releaseYear}</span>
          <span class="rating">${
            content.rating ? `★ ${content.rating}` : ""
          }</span>
          <span class="duration">${formatRuntime(content.duration)}</span>
          <span class="genre">${genreNames}</span>
        </div>
        <div class="description">
          <p>${content.description}</p>
        </div>
        <div class="stats">
          <div class="views"><i class="bi bi-eye"></i> ${
            content.views || 0
          } views</div>
          <div class="likes-container">
            <button class="like-button ${
              likedContent[content._id] ? "liked" : ""
            }" data-id="${content._id}" title="${
    likedContent[content._id] ? "Unlike" : "Like"
  }">
              <span class="heart">${
                likedContent[content._id] ? "❤️" : "🤍"
              }</span>
            </button>
          </div>
        </div>
        ${
          content.cast && content.cast.length > 0
            ? `
        <div class="cast">
          <h3>Cast</h3>
          <ul>
            ${content.cast
              .map(
                (actor) => `
              <li>
                ${actor.name} ${actor.role ? `as ${actor.role}` : ""}
                ${
                  actor.wikipediaLink
                    ? `<a href="${actor.wikipediaLink}" target="_blank"><i class="bi bi-wikipedia"></i></a>`
                    : ""
                }
              </li>
            `
              )
              .join("")}
          </ul>
        </div>
        `
            : ""
        }
        ${
          content.director
            ? `<div class="director"><strong>Director:</strong> ${content.director}</div>`
            : ""
        }
      </div>
    </div>
  `;

  // Add like button functionality
  const likeButton = container.querySelector(".like-button");
  if (likeButton) {
    likeButton.addEventListener("click", async (e) => {
      e.stopPropagation();

      const contentId = content._id;
      const isCurrentlyLiked = likedContent[contentId];
      const newLikedState = !isCurrentlyLiked;

      // Optimistic UI update
      if (newLikedState) {
        likedContent[contentId] = true;
        likeButton.classList.add("liked");
        likeButton.querySelector(".heart").textContent = "❤️";
        likeButton.title = "Unlike";
      } else {
        delete likedContent[contentId];
        likeButton.classList.remove("liked");
        likeButton.querySelector(".heart").textContent = "🤍";
        likeButton.title = "Like";
      }

      // Update on server (non-blocking)
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
            likeButton.classList.remove("liked");
            likeButton.querySelector(".heart").textContent = "🤍";
            likeButton.title = "Like";
          } else {
            likedContent[contentId] = true;
            likeButton.classList.add("liked");
            likeButton.querySelector(".heart").textContent = "❤️";
            likeButton.title = "Unlike";
          }
          localStorage.setItem("likedContent", JSON.stringify(likedContent));
        });
    });
  }
}

// Display episodes for series
function displayEpisodes(episodes, seriesTitle) {
  if (!episodes || episodes.length === 0) return;

  const container = document.getElementById("episodesContainer");
  container.style.display = "block";

  // Group episodes by season
  const seasons = {};
  episodes.forEach((episode) => {
    const season = episode.seasonNumber;
    if (!seasons[season]) seasons[season] = [];
    seasons[season].push(episode);
  });

  // Sort seasons and episodes
  const sortedSeasons = Object.keys(seasons).sort((a, b) => a - b);

  // Create season tabs
  const seasonsTabs = document.querySelector(".seasons-tabs");
  seasonsTabs.innerHTML = sortedSeasons
    .map(
      (season, index) =>
        `<button class="season-tab ${index === 0 ? "active" : ""}" 
     data-season="${season}">Season ${season}</button>`
    )
    .join("");

  // Create episodes list for first season
  displaySeasonEpisodes(seasons[sortedSeasons[0]], seriesTitle);

  // Add event listeners to season tabs
  document.querySelectorAll(".season-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      // Update active tab
      document
        .querySelectorAll(".season-tab")
        .forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      // Display episodes for selected season
      const season = tab.dataset.season;
      displaySeasonEpisodes(seasons[season], seriesTitle);
    });
  });
}

// Display episodes for a specific season
function displaySeasonEpisodes(episodes, seriesTitle) {
  const container = document.querySelector(".episodes-list");

  container.innerHTML = episodes
    .map((episode) => {
      // Fix video path
      let videoUrl = episode.videoUrl || "";
      if (videoUrl.startsWith("/assets/videos/")) {
        videoUrl = videoUrl.replace("/assets/videos/", "/videos/");
      } else if (videoUrl.startsWith("./videos/")) {
        videoUrl = videoUrl.replace("./videos/", "/videos/");
      }

      // Load progress for this episode
      const episodeId = episode._id || episode.id;
      const progress = loadEpisodeProgress(episodeId);
      const progressPercentage = Math.round(progress.percentage);
      const hasProgress = progress.percentage > 0;
      const isCompleted = progress.isCompleted;

      return `
      <div class="episode-card" data-episode-id="${episodeId}">
        <div class="episode-header">
          <h3>${episode.title}</h3>
          ${
            hasProgress
              ? `
          <div class="episode-progress-info">
            <span class="progress-percentage">${progressPercentage}%</span>
            ${
              isCompleted
                ? '<span class="completed-badge">✓ Completed</span>'
                : ""
            }
          </div>
          `
              : ""
          }
        </div>
        <div class="episode-number">S${episode.seasonNumber} E${
        episode.episodeNumber
      }</div>
        <div class="episode-description">${episode.description}</div>
        <div class="episode-meta">
          <span class="duration">${formatRuntime(episode.duration)}</span>
        </div>
        ${
          hasProgress
            ? `
        <div class="episode-progress-bar-container">
          <div class="episode-progress-bar" style="width: ${progressPercentage}%"></div>
        </div>
        `
            : ""
        }
        ${
          videoUrl
            ? `
        <div class="episode-video">
          <video 
            controls 
            width="100%" 
            data-episode-id="${episodeId}"
            data-saved-time="${progress.currentTime}"
            data-duration="${progress.duration || episode.duration * 60}">
            <source src="${videoUrl}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
        `
            : ""
        }
      </div>
    `;
    })
    .join("");

  // Set up video progress tracking after episodes are rendered
  setupEpisodeProgressTracking();
}

// Set up progress tracking for all episode videos
function setupEpisodeProgressTracking() {
  const videos = document.querySelectorAll(".episode-video video");

  videos.forEach((video) => {
    const episodeId = video.getAttribute("data-episode-id");
    if (!episodeId) return;

    // Resume from saved position when video is loaded
    video.addEventListener("loadedmetadata", () => {
      const savedTime = parseFloat(video.getAttribute("data-saved-time")) || 0;
      const duration =
        video.duration || parseFloat(video.getAttribute("data-duration")) || 0;

      // Only resume if saved time is more than 5 seconds and less than 95% of video
      if (savedTime > 5 && savedTime < duration * 0.95) {
        video.currentTime = savedTime;
        console.log(
          `Resuming episode ${episodeId} from ${savedTime.toFixed(2)}s`
        );
      }
    });

    // Save progress periodically while playing
    let saveProgressInterval;
    video.addEventListener("play", () => {
      // Save progress every 5 seconds
      saveProgressInterval = setInterval(() => {
        if (!video.paused && !video.ended) {
          const currentTime = video.currentTime;
          const duration = video.duration;
          if (duration > 0) {
            saveEpisodeProgress(episodeId, currentTime, duration);
            updateProgressDisplay(episodeId, currentTime, duration);
          }
        }
      }, 5000); // Save every 5 seconds
    });

    // Save progress when paused
    video.addEventListener("pause", () => {
      const currentTime = video.currentTime;
      const duration = video.duration;
      if (duration > 0) {
        saveEpisodeProgress(episodeId, currentTime, duration);
        updateProgressDisplay(episodeId, currentTime, duration);
      }
      if (saveProgressInterval) {
        clearInterval(saveProgressInterval);
      }
    });

    // Save progress when video ends
    video.addEventListener("ended", () => {
      const duration = video.duration;
      saveEpisodeProgress(episodeId, duration, duration);
      updateProgressDisplay(episodeId, duration, duration);
      if (saveProgressInterval) {
        clearInterval(saveProgressInterval);
      }
    });

    // Save progress when seeking (user manually changes position)
    video.addEventListener("seeked", () => {
      const currentTime = video.currentTime;
      const duration = video.duration;
      if (duration > 0) {
        saveEpisodeProgress(episodeId, currentTime, duration);
        updateProgressDisplay(episodeId, currentTime, duration);
      }
    });

    // Update progress bar in real-time while playing
    video.addEventListener("timeupdate", () => {
      if (!video.paused && !video.ended) {
        const currentTime = video.currentTime;
        const duration = video.duration;
        if (duration > 0) {
          updateProgressDisplay(episodeId, currentTime, duration);
        }
      }
    });
  });
}

// Update progress display (progress bar and percentage)
function updateProgressDisplay(episodeId, currentTime, duration) {
  const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const roundedPercentage = Math.round(percentage);
  const isCompleted = percentage >= 95;

  const episodeCard = document.querySelector(
    `[data-episode-id="${episodeId}"]`
  );
  if (!episodeCard) return;

  // Update progress bar
  const progressBar = episodeCard.querySelector(".episode-progress-bar");
  if (progressBar) {
    progressBar.style.width = `${roundedPercentage}%`;
  }

  // Update or create progress percentage
  let progressInfo = episodeCard.querySelector(".episode-progress-info");
  if (!progressInfo) {
    // Create progress info if it doesn't exist
    const header = episodeCard.querySelector(".episode-header");
    if (header) {
      progressInfo = document.createElement("div");
      progressInfo.className = "episode-progress-info";
      header.appendChild(progressInfo);
    } else {
      return;
    }
  }

  // Update progress percentage
  let percentageSpan = progressInfo.querySelector(".progress-percentage");
  if (!percentageSpan) {
    percentageSpan = document.createElement("span");
    percentageSpan.className = "progress-percentage";
    progressInfo.insertBefore(percentageSpan, progressInfo.firstChild);
  }
  percentageSpan.textContent = `${roundedPercentage}%`;

  // Update or create completed badge
  let completedBadge = progressInfo.querySelector(".completed-badge");
  if (isCompleted && !completedBadge) {
    completedBadge = document.createElement("span");
    completedBadge.className = "completed-badge";
    completedBadge.textContent = "✓ Completed";
    progressInfo.appendChild(completedBadge);
  } else if (!isCompleted && completedBadge) {
    completedBadge.remove();
  }

  // Show progress bar if it doesn't exist
  let progressBarContainer = episodeCard.querySelector(
    ".episode-progress-bar-container"
  );
  if (!progressBarContainer && percentage > 0) {
    progressBarContainer = document.createElement("div");
    progressBarContainer.className = "episode-progress-bar-container";
    const meta = episodeCard.querySelector(".episode-meta");
    if (meta && meta.nextSibling) {
      episodeCard.insertBefore(progressBarContainer, meta.nextSibling);
    } else if (meta) {
      meta.after(progressBarContainer);
    }

    const progressBar = document.createElement("div");
    progressBar.className = "episode-progress-bar";
    progressBar.style.width = `${roundedPercentage}%`;
    progressBarContainer.appendChild(progressBar);
  }
}

// Main function
async function initContentDetail() {
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

  // Load liked content from database
  likedContent = await loadLikedContentFromDB();

  // Also sync with localStorage for offline support
  localStorage.setItem("likedContent", JSON.stringify(likedContent));

  // Get content ID from URL
  const contentId = getContentIdFromUrl();
  if (!contentId) {
    document.getElementById("contentDetailContainer").innerHTML = `
      <div class="error">Content ID not provided. <a href="/feed">Back to Browse</a></div>
    `;
    return;
  }

  // Fetch and display content
  const content = await fetchContentDetails(contentId);
  if (!content) {
    document.getElementById("contentDetailContainer").innerHTML = `
      <div class="error">Content not found. <a href="/feed">Back to Browse</a></div>
    `;
    return;
  }

  // Display content details
  displayContentDetails(content);

  // Update view count (non-blocking, don't wait for it)
  updateViews(contentId).catch((err) =>
    console.error("Error updating views:", err)
  );

  // If it's a series, fetch and display episodes
  if (content.type === "series") {
    const episodes = await fetchEpisodes(contentId);
    if (episodes) {
      displayEpisodes(episodes, content.title);
    }
  }

  // Set up dropdown toggle
  setupDropdown();
}

// Set up profile dropdown
function setupDropdown() {
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

// Initialize when page is loaded
document.addEventListener("DOMContentLoaded", initContentDetail);
