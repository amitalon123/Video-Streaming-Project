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

// Load video progress from database
async function loadVideoProgressFromDB(contentId, episodeId = null) {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const currentProfile = JSON.parse(localStorage.getItem("currentProfile"));
    if (!currentUser || !currentUser.id) {
      return null;
    }

    const profileId = currentProfile?.id || null;
    let url = `${API_BASE_URL}/viewings?user=${currentUser.id}&content=${contentId}`;
    if (profileId) url += `&profile=${profileId}`;
    // For episodes, we pass the episodeId
    // For movies, we don't send episode parameter and filter in frontend
    if (episodeId) {
      url += `&episode=${episodeId}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      // Filter for the correct episode (null for movies, episodeId for episodes)
      const progress =
        data.data.find((item) => {
          if (episodeId) {
            const itemEpisodeId =
              typeof item.episode === "object"
                ? item.episode?._id
                : item.episode;
            return itemEpisodeId === episodeId;
          } else {
            // For movies, episode should be null
            return !item.episode || item.episode === null;
          }
        }) || data.data[0]; // Fallback to first item if not found

      return {
        lastPositionSec: progress.lastPositionSec || 0,
        durationSec: progress.durationSec || 0,
        completed: progress.completed || false,
      };
    }

    return null;
  } catch (error) {
    console.error("Error loading video progress from DB:", error);
    return null;
  }
}

// Save video progress to database
async function saveVideoProgressToDB(
  contentId,
  episodeId,
  currentTime,
  duration
) {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const currentProfile = JSON.parse(localStorage.getItem("currentProfile"));
    if (!currentUser || !currentUser.id) {
      console.error("User not found in localStorage - cannot save progress");
      return null;
    }

    const profileId = currentProfile?.id || null;
    const lastPositionSec = Math.floor(currentTime);
    const durationSec = Math.floor(duration);

    const payload = {
      user: currentUser.id,
      profile: profileId,
      content: contentId,
      episode: episodeId || null,
      lastPositionSec: lastPositionSec,
      durationSec: durationSec,
    };

    console.log(`Saving progress to DB:`, {
      contentId,
      episodeId: episodeId || "movie",
      lastPositionSec,
      durationSec,
      profileId,
      percentage:
        durationSec > 0
          ? ((lastPositionSec / durationSec) * 100).toFixed(1) + "%"
          : "0%",
    });

    const response = await fetch(`${API_BASE_URL}/viewings/progress/upsert`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Network response was not ok: ${response.status} - ${errorText}`
      );
    }

    const result = await response.json();
    console.log(`Progress saved successfully to DB:`, result);
    return result;
  } catch (error) {
    console.error("Error saving video progress to DB:", error);
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
          <div class="watch-container">
            ${
              window.ViewingActions
                ? window.ViewingActions.getWatchButtonHtml(content._id)
                : `<button class="watch-button" data-id="${content._id}">Mark as Watched</button>`
            }
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

  // Set up video progress tracking for movies
  if (content.type === "movie" && videoUrl) {
    setupMovieProgressTracking(content._id);
  }

  // Add watch button functionality
  const watchButton = container.querySelector(".watch-button");
  if (watchButton && window.ViewingActions) {
    window.ViewingActions.init();
    const bannerPoster =
      container.querySelector(".content-banner") ||
      container.querySelector(".video-container");
    // For detail page, badge overlay is only meaningful when banner exists
    const posterEl = bannerPoster;
    window.ViewingActions.attachWatchHandler(
      watchButton,
      posterEl,
      content._id
    );
  }
}

// Set up progress tracking for movie videos
async function setupMovieProgressTracking(contentId) {
  // Wait for video element to be available (with retry)
  let video = document.querySelector(".video-container video");
  let retries = 0;
  while (!video && retries < 20) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    video = document.querySelector(".video-container video");
    retries++;
  }

  if (!video) {
    console.error(
      "Video element not found for progress tracking after retries"
    );
    return;
  }

  console.log(
    `Video element found for movie ${contentId}, readyState: ${video.readyState}`
  );

  // Load saved progress from database
  const savedProgress = await loadVideoProgressFromDB(contentId, null);
  console.log("Loaded progress for movie:", savedProgress);

  if (savedProgress && savedProgress.lastPositionSec > 0) {
    console.log(
      `Found saved progress: ${savedProgress.lastPositionSec}s / ${savedProgress.durationSec}s`
    );

    // Function to resume video
    const resumeVideo = () => {
      const duration = video.duration || savedProgress.durationSec || 0;
      const lastPosition = savedProgress.lastPositionSec;

      console.log(
        `Video readyState: ${video.readyState}, duration: ${duration}, lastPosition: ${lastPosition}`
      );

      // Resume if position is valid (more than 1 second and less than 95% of duration)
      if (duration > 0 && lastPosition >= 1 && lastPosition < duration * 0.95) {
        video.currentTime = lastPosition;
        console.log(
          `Resuming movie ${contentId} from ${lastPosition.toFixed(2)}s (${(
            (lastPosition / duration) *
            100
          ).toFixed(1)}%)`
        );
      } else {
        console.log(
          `Skipping resume: lastPosition=${lastPosition}, duration=${duration}, condition check failed`
        );
      }
    };

    // Wait for video metadata to load
    if (video.readyState >= 1) {
      // Video already has metadata
      console.log("Video metadata already loaded, resuming immediately");
      resumeVideo();
    } else {
      // Wait for metadata
      console.log("Waiting for video metadata to load...");
      video.addEventListener(
        "loadedmetadata",
        () => {
          console.log("Video metadata loaded, resuming now");
          resumeVideo();
        },
        { once: true }
      );

      // Also try on loadeddata event as fallback
      video.addEventListener(
        "loadeddata",
        () => {
          console.log("Video data loaded, attempting resume");
          if (video.currentTime === 0 && savedProgress.lastPositionSec >= 1) {
            resumeVideo();
          }
        },
        { once: true }
      );

      // Also try on canplay event (video is ready to play)
      video.addEventListener(
        "canplay",
        () => {
          console.log("Video can play, checking if resume needed");
          if (video.currentTime === 0 && savedProgress.lastPositionSec >= 1) {
            resumeVideo();
          }
        },
        { once: true }
      );
    }
  } else {
    console.log("No saved progress found or lastPositionSec is 0");
  }

  // Hide replay button when video starts playing again
  video.addEventListener("play", () => {
    const replayOverlay = video
      .closest(".video-container")
      ?.querySelector(".replay-overlay");
    if (replayOverlay) {
      replayOverlay.style.display = "none";
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
          saveVideoProgressToDB(contentId, null, currentTime, duration);
          console.log(
            `Saving progress: ${currentTime.toFixed(2)}s / ${duration.toFixed(
              2
            )}s`
          );
        }
      }
    }, 5000); // Save every 5 seconds
  });

  // Save progress when paused
  video.addEventListener("pause", () => {
    const currentTime = video.currentTime;
    const duration = video.duration;
    if (duration > 0) {
      saveVideoProgressToDB(contentId, null, currentTime, duration);
      console.log(
        `Saving progress on pause: ${currentTime.toFixed(
          2
        )}s / ${duration.toFixed(2)}s`
      );
    }
    if (saveProgressInterval) {
      clearInterval(saveProgressInterval);
    }
  });

  // Save progress when video ends
  video.addEventListener("ended", () => {
    const duration = video.duration;
    saveVideoProgressToDB(contentId, null, duration, duration);
    console.log(`Movie completed: ${duration.toFixed(2)}s`);
    if (saveProgressInterval) {
      clearInterval(saveProgressInterval);
    }

    // Show replay button
    showReplayButton(video, contentId, null);
  });

  // Save progress when seeking (user manually changes position)
  video.addEventListener("seeked", () => {
    const currentTime = video.currentTime;
    const duration = video.duration;
    if (duration > 0) {
      saveVideoProgressToDB(contentId, null, currentTime, duration);
      console.log(
        `Saving progress on seek: ${currentTime.toFixed(
          2
        )}s / ${duration.toFixed(2)}s`
      );
    }
  });

  // Save progress when leaving page (visibilitychange)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && video && !video.paused && !video.ended) {
      const currentTime = video.currentTime;
      const duration = video.duration;
      if (duration > 0) {
        saveVideoProgressToDB(contentId, null, currentTime, duration);
        console.log(
          `Saving progress on page hide: ${currentTime.toFixed(
            2
          )}s / ${duration.toFixed(2)}s`
        );
      }
    }
  });

  // Save progress when page is about to unload (beforeunload)
  window.addEventListener("beforeunload", () => {
    if (video && !video.paused && !video.ended) {
      const currentTime = video.currentTime;
      const duration = video.duration;
      if (duration > 0) {
        // Use sendBeacon for reliable transmission on page unload
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        const currentProfile = JSON.parse(
          localStorage.getItem("currentProfile")
        );
        if (currentUser && currentUser.id) {
          const profileId = currentProfile?.id || null;
          const payload = JSON.stringify({
            user: currentUser.id,
            profile: profileId,
            content: contentId,
            episode: null,
            lastPositionSec: Math.floor(currentTime),
            durationSec: Math.floor(duration),
          });

          // Try to use sendBeacon for reliable transmission
          // Note: sendBeacon only supports POST, so we'll use a POST endpoint or fallback to fetch
          if (navigator.sendBeacon) {
            // sendBeacon only supports POST, so we need to use fetch with keepalive instead
            fetch(`${API_BASE_URL}/viewings/progress/upsert`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: payload,
              keepalive: true, // This ensures the request completes even if page closes
            }).catch((err) =>
              console.error("Error saving progress on unload:", err)
            );
            console.log(
              "Progress saved via fetch with keepalive on page unload"
            );
          } else {
            // Fallback to regular fetch (may not complete if page closes)
            saveVideoProgressToDB(contentId, null, currentTime, duration);
          }
        }
      }
    }
  });
}

// Display episodes for series
async function displayEpisodes(episodes, seriesTitle) {
  if (!episodes || episodes.length === 0) return;

  const container = document.getElementById("episodesContainer");
  container.style.display = "block";

  // Get content ID for loading progress
  const contentId = getContentIdFromUrl();

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
  await displaySeasonEpisodes(
    seasons[sortedSeasons[0]],
    seriesTitle,
    contentId
  );

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
      const contentId = getContentIdFromUrl();
      displaySeasonEpisodes(seasons[season], seriesTitle, contentId);
    });
  });
}

// Display episodes for a specific season
async function displaySeasonEpisodes(episodes, seriesTitle, contentId) {
  const container = document.querySelector(".episodes-list");

  // Load progress for all episodes from database
  const episodesWithProgress = await Promise.all(
    episodes.map(async (episode) => {
      const episodeId = episode._id || episode.id;
      const dbProgress = await loadVideoProgressFromDB(contentId, episodeId);

      // Fallback to localStorage if DB doesn't have progress
      const localProgress = loadEpisodeProgress(episodeId);

      // Use DB progress if available, otherwise use localStorage
      let progress;
      if (dbProgress && dbProgress.lastPositionSec > 0) {
        const percentage =
          dbProgress.durationSec > 0
            ? (dbProgress.lastPositionSec / dbProgress.durationSec) * 100
            : 0;
        progress = {
          currentTime: dbProgress.lastPositionSec,
          duration: dbProgress.durationSec,
          percentage: percentage,
          isCompleted: dbProgress.completed || false,
        };
      } else {
        progress = localProgress;
      }

      return { episode, progress };
    })
  );

  container.innerHTML = episodesWithProgress
    .map(({ episode, progress }) => {
      // Fix video path
      let videoUrl = episode.videoUrl || "";
      if (videoUrl.startsWith("/assets/videos/")) {
        videoUrl = videoUrl.replace("/assets/videos/", "/videos/");
      } else if (videoUrl.startsWith("./videos/")) {
        videoUrl = videoUrl.replace("./videos/", "/videos/");
      }

      const episodeId = episode._id || episode.id;
      const progressPercentage = Math.round(progress.percentage);
      const hasProgress = progress.percentage > 0;
      const isCompleted = progress.isCompleted;

      return `
      <div class="episode-card-small" data-episode-id="${episodeId}">
        <div class="episode-card-content">
          <div class="episode-info">
            <div class="episode-header-small">
              <span class="episode-number-small">S${episode.seasonNumber} E${
        episode.episodeNumber
      }</span>
              <h4 class="episode-title-small">${episode.title}</h4>
              ${
                hasProgress
                  ? `
              <div class="episode-progress-info-small">
                <span class="progress-percentage-small">${progressPercentage}%</span>
                ${
                  isCompleted
                    ? '<span class="completed-badge-small">✓</span>'
                    : ""
                }
              </div>
              `
                  : ""
              }
            </div>
            <div class="episode-meta-small">
              <span class="duration-small">${formatRuntime(
                episode.duration
              )}</span>
              ${
                hasProgress
                  ? `
              <div class="episode-progress-bar-container-small">
                <div class="episode-progress-bar-small" style="width: ${progressPercentage}%"></div>
              </div>
              `
                  : ""
              }
            </div>
          </div>
          <button class="episode-play-button" data-episode-id="${episodeId}" data-video-url="${
        videoUrl || ""
      }">
            <i class="bi bi-play-fill"></i>
          </button>
        </div>
        ${
          videoUrl
            ? `
        <div class="episode-video-hidden" style="display: none;">
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
  setupEpisodeProgressTracking(contentId);

  // Set up play button click handlers for small episode cards
  document.querySelectorAll(".episode-play-button").forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.stopPropagation();
      const episodeId = button.getAttribute("data-episode-id");
      const videoUrl = button.getAttribute("data-video-url");
      const episodeCard = button.closest(".episode-card-small");

      if (!episodeCard || !videoUrl) return;

      // Find or create video element
      let videoContainer = episodeCard.querySelector(".episode-video-hidden");
      if (!videoContainer) {
        // Create video container if it doesn't exist
        videoContainer = document.createElement("div");
        videoContainer.className = "episode-video-hidden";
        episodeCard.appendChild(videoContainer);
      }

      // Check if video already exists
      let video = videoContainer.querySelector("video");
      if (!video) {
        // Get saved progress for this episode
        const savedProgress = await loadVideoProgressFromDB(
          contentId,
          episodeId
        );
        const savedTime = savedProgress ? savedProgress.lastPositionSec : 0;
        const duration = savedProgress ? savedProgress.durationSec : 0;

        // Create video element
        video = document.createElement("video");
        video.controls = true;
        video.width = "100%";
        video.setAttribute("data-episode-id", episodeId);
        video.setAttribute("data-saved-time", savedTime);
        video.setAttribute("data-duration", duration);
        video.innerHTML = `<source src="${videoUrl}" type="video/mp4">Your browser does not support the video tag.`;
        videoContainer.appendChild(video);

        // Set up progress tracking for this video
        setupVideoProgressTracking(video, contentId, episodeId);

        // Show and play video
        videoContainer.classList.add("show");
        video.load();
        video.play().catch((err) => {
          console.error("Error playing video:", err);
        });
      } else {
        // Toggle video visibility if it already exists
        if (videoContainer.classList.contains("show")) {
          videoContainer.classList.remove("show");
          video.pause();
        } else {
          videoContainer.classList.add("show");
          // Load and play video
          video.load();
          video.play().catch((err) => {
            console.error("Error playing video:", err);
          });
        }
      }
    });
  });
}

// Set up progress tracking for all episode videos (legacy - for old format)
async function setupEpisodeProgressTracking(contentId) {
  const videos = document.querySelectorAll(
    ".episode-video video, .episode-video-hidden video"
  );

  videos.forEach(async (video) => {
    const episodeId = video.getAttribute("data-episode-id");
    if (!episodeId) return;

    // Load saved progress from database
    const savedProgress = await loadVideoProgressFromDB(contentId, episodeId);
    console.log(`Loaded progress for episode ${episodeId}:`, savedProgress);

    const savedTime = savedProgress
      ? savedProgress.lastPositionSec
      : parseFloat(video.getAttribute("data-saved-time")) || 0;
    const duration =
      video.duration || parseFloat(video.getAttribute("data-duration")) || 0;

    console.log(
      `Episode ${episodeId} - savedTime: ${savedTime}, duration: ${duration}`
    );

    // Function to resume episode
    const resumeEpisode = () => {
      const finalDuration = video.duration || duration;
      console.log(
        `Episode ${episodeId} - readyState: ${video.readyState}, finalDuration: ${finalDuration}, savedTime: ${savedTime}`
      );

      // Only resume if saved time is more than 1 second and less than 95% of video
      if (
        finalDuration > 0 &&
        savedTime >= 1 &&
        savedTime < finalDuration * 0.95
      ) {
        video.currentTime = savedTime;
        console.log(
          `Resuming episode ${episodeId} from ${savedTime.toFixed(2)}s (${(
            (savedTime / finalDuration) *
            100
          ).toFixed(1)}%)`
        );
      } else {
        console.log(
          `Skipping resume for episode ${episodeId}: savedTime=${savedTime}, finalDuration=${finalDuration}, condition check failed`
        );
      }
    };

    // Resume from saved position when video is loaded
    if (video.readyState >= 1) {
      console.log(
        `Episode ${episodeId} metadata already loaded, resuming immediately`
      );
      resumeEpisode();
    } else {
      video.addEventListener(
        "loadedmetadata",
        () => {
          console.log(`Episode ${episodeId} metadata loaded, resuming now`);
          resumeEpisode();
        },
        { once: true }
      );

      // Also try on loadeddata event as fallback
      video.addEventListener(
        "loadeddata",
        () => {
          console.log(`Episode ${episodeId} data loaded, attempting resume`);
          if (video.currentTime === 0 && savedTime >= 1) {
            resumeEpisode();
          }
        },
        { once: true }
      );
    }

    // Save progress periodically while playing
    let saveProgressInterval;
    video.addEventListener("play", () => {
      // Save progress every 5 seconds
      saveProgressInterval = setInterval(() => {
        if (!video.paused && !video.ended) {
          const currentTime = video.currentTime;
          const duration = video.duration;
          if (duration > 0) {
            // Save to DB
            saveVideoProgressToDB(contentId, episodeId, currentTime, duration);
            // Also save to localStorage as backup
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
        // Save to DB
        saveVideoProgressToDB(contentId, episodeId, currentTime, duration);
        // Also save to localStorage as backup
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
      // Save to DB
      saveVideoProgressToDB(contentId, episodeId, duration, duration);
      // Also save to localStorage as backup
      saveEpisodeProgress(episodeId, duration, duration);
      updateProgressDisplay(episodeId, duration, duration);
      if (saveProgressInterval) {
        clearInterval(saveProgressInterval);
      }

      // Show replay button
      showReplayButton(video, contentId, episodeId);
    });

    // Save progress when seeking (user manually changes position)
    video.addEventListener("seeked", () => {
      const currentTime = video.currentTime;
      const duration = video.duration;
      if (duration > 0) {
        // Save to DB
        saveVideoProgressToDB(contentId, episodeId, currentTime, duration);
        // Also save to localStorage as backup
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

    // Hide replay button when video starts playing again
    video.addEventListener("play", () => {
      const replayOverlay = video
        .closest(".episode-video")
        ?.querySelector(".replay-overlay");
      if (replayOverlay) {
        replayOverlay.style.display = "none";
      }
    });

    // Save progress when page is about to unload (beforeunload) - for episodes
    window.addEventListener("beforeunload", () => {
      if (video && !video.paused && !video.ended) {
        const currentTime = video.currentTime;
        const duration = video.duration;
        if (duration > 0) {
          // Use sendBeacon for reliable transmission on page unload
          const currentUser = JSON.parse(localStorage.getItem("currentUser"));
          const currentProfile = JSON.parse(
            localStorage.getItem("currentProfile")
          );
          if (currentUser && currentUser.id) {
            const profileId = currentProfile?.id || null;
            const payload = JSON.stringify({
              user: currentUser.id,
              profile: profileId,
              content: contentId,
              episode: episodeId,
              lastPositionSec: Math.floor(currentTime),
              durationSec: Math.floor(duration),
            });

            // Try to use fetch with keepalive for reliable transmission on page unload
            // Note: sendBeacon only supports POST, so we use fetch with keepalive instead
            if (navigator.sendBeacon || true) {
              // Always use fetch with keepalive
              fetch(`${API_BASE_URL}/viewings/progress/upsert`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: payload,
                keepalive: true, // This ensures the request completes even if page closes
              }).catch((err) =>
                console.error(
                  `Error saving progress on unload for episode ${episodeId}:`,
                  err
                )
              );
              console.log(
                `Progress saved via fetch with keepalive on page unload for episode ${episodeId}`
              );
            } else {
              // Fallback to regular fetch (may not complete if page closes)
              saveVideoProgressToDB(
                contentId,
                episodeId,
                currentTime,
                duration
              );
            }
          }
        }
      }
    });
  });
}

// Show replay button when video ends
function showReplayButton(video, contentId, episodeId) {
  // Find the video container
  const videoContainer =
    video.closest(".video-container") || video.closest(".episode-video");
  if (!videoContainer) {
    console.error("Video container not found");
    return;
  }

  // Check if replay overlay already exists
  let replayOverlay = videoContainer.querySelector(".replay-overlay");

  if (!replayOverlay) {
    // Create replay overlay
    replayOverlay = document.createElement("div");
    replayOverlay.className = "replay-overlay";
    replayOverlay.innerHTML = `
      <button class="replay-button" title="Watch Again">
        <i class="bi bi-arrow-repeat"></i>
        <span>Watch Again</span>
      </button>
    `;
    videoContainer.appendChild(replayOverlay);
  }

  // Always set up click handler (even if overlay already exists)
  const replayButton = replayOverlay.querySelector(".replay-button");

  if (replayButton) {
    // Remove existing listeners to avoid duplicates by cloning the button
    const newReplayButton = replayButton.cloneNode(true);
    replayButton.parentNode.replaceChild(newReplayButton, replayButton);

    // Add click handler - find video element dynamically when clicked
    newReplayButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("Replay button clicked", { contentId, episodeId });

      // Find the video element again (it might have changed)
      const currentVideo = videoContainer.querySelector("video");
      if (currentVideo) {
        replayVideo(currentVideo, contentId, episodeId);
      } else {
        console.error("Video element not found in container");
      }
    });
  }

  // Show the overlay
  replayOverlay.style.display = "flex";
}

// Replay video from beginning
function replayVideo(video, contentId, episodeId) {
  console.log("Replay button clicked", { video, contentId, episodeId });

  if (!video) {
    console.error("Video element not found");
    return;
  }

  // Hide replay button first
  const replayOverlay =
    video.closest(".video-container")?.querySelector(".replay-overlay") ||
    video.closest(".episode-video")?.querySelector(".replay-overlay");
  if (replayOverlay) {
    replayOverlay.style.display = "none";
  }

  // Reset video to beginning
  video.currentTime = 0;

  // Try to play the video (play() returns a Promise)
  const playPromise = video.play();

  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        console.log("Video replay started successfully");

        // Clear progress from database
        saveVideoProgressToDB(contentId, episodeId, 0, video.duration);

        // Clear progress from localStorage for episodes
        if (episodeId) {
          clearEpisodeProgress(episodeId);
        }

        // Update progress display for episodes
        if (episodeId) {
          updateProgressDisplay(episodeId, 0, video.duration);
        }
      })
      .catch((error) => {
        console.error("Error playing video:", error);
        // If autoplay is blocked, the video is reset but user needs to click play
        // This is normal browser behavior for autoplay policies
      });
  } else {
    // Fallback for older browsers
    console.log("Video replay (fallback)");
    saveVideoProgressToDB(contentId, episodeId, 0, video.duration);
    if (episodeId) {
      clearEpisodeProgress(episodeId);
      updateProgressDisplay(episodeId, 0, video.duration);
    }
  }
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

  // Check if it's the new small format or old format
  const isSmallFormat = episodeCard.classList.contains("episode-card-small");

  if (isSmallFormat) {
    // Update small format progress
    const progressBar = episodeCard.querySelector(
      ".episode-progress-bar-small"
    );
    if (progressBar) {
      progressBar.style.width = `${roundedPercentage}%`;
    }

    // Update or create progress info
    let progressInfo = episodeCard.querySelector(
      ".episode-progress-info-small"
    );
    if (!progressInfo) {
      const header = episodeCard.querySelector(".episode-header-small");
      if (header) {
        progressInfo = document.createElement("div");
        progressInfo.className = "episode-progress-info-small";
        header.appendChild(progressInfo);
      } else {
        return;
      }
    }

    // Update progress percentage
    let percentageSpan = progressInfo.querySelector(
      ".progress-percentage-small"
    );
    if (!percentageSpan) {
      percentageSpan = document.createElement("span");
      percentageSpan.className = "progress-percentage-small";
      progressInfo.insertBefore(percentageSpan, progressInfo.firstChild);
    }
    percentageSpan.textContent = `${roundedPercentage}%`;

    // Update or create completed badge
    let completedBadge = progressInfo.querySelector(".completed-badge-small");
    if (isCompleted && !completedBadge) {
      completedBadge = document.createElement("span");
      completedBadge.className = "completed-badge-small";
      completedBadge.textContent = "✓";
      progressInfo.appendChild(completedBadge);
    } else if (!isCompleted && completedBadge) {
      completedBadge.remove();
    }

    // Show progress bar if it doesn't exist
    let progressBarContainer = episodeCard.querySelector(
      ".episode-progress-bar-container-small"
    );
    if (!progressBarContainer && percentage > 0) {
      const meta = episodeCard.querySelector(".episode-meta-small");
      if (meta) {
        progressBarContainer = document.createElement("div");
        progressBarContainer.className = "episode-progress-bar-container-small";
        const progressBar = document.createElement("div");
        progressBar.className = "episode-progress-bar-small";
        progressBar.style.width = `${roundedPercentage}%`;
        progressBarContainer.appendChild(progressBar);
        meta.appendChild(progressBarContainer);
      }
    } else if (progressBarContainer) {
      const progressBar = progressBarContainer.querySelector(
        ".episode-progress-bar-small"
      );
      if (progressBar) {
        progressBar.style.width = `${roundedPercentage}%`;
      }
    }
  } else {
    // Update old format progress (for backward compatibility)
    const progressBar = episodeCard.querySelector(".episode-progress-bar");
    if (progressBar) {
      progressBar.style.width = `${roundedPercentage}%`;
    }

    let progressInfo = episodeCard.querySelector(".episode-progress-info");
    if (!progressInfo) {
      const header = episodeCard.querySelector(".episode-header");
      if (header) {
        progressInfo = document.createElement("div");
        progressInfo.className = "episode-progress-info";
        header.appendChild(progressInfo);
      } else {
        return;
      }
    }

    let percentageSpan = progressInfo.querySelector(".progress-percentage");
    if (!percentageSpan) {
      percentageSpan = document.createElement("span");
      percentageSpan.className = "progress-percentage";
      progressInfo.insertBefore(percentageSpan, progressInfo.firstChild);
    }
    percentageSpan.textContent = `${roundedPercentage}%`;

    let completedBadge = progressInfo.querySelector(".completed-badge");
    if (isCompleted && !completedBadge) {
      completedBadge = document.createElement("span");
      completedBadge.className = "completed-badge";
      completedBadge.textContent = "✓ Completed";
      progressInfo.appendChild(completedBadge);
    } else if (!isCompleted && completedBadge) {
      completedBadge.remove();
    }

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
      await displayEpisodes(episodes, content.title);
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
}

// Initialize when page is loaded
document.addEventListener("DOMContentLoaded", initContentDetail);
