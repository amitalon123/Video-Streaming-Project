// API Configuration
const API_BASE_URL = "http://localhost:3000/api";

// Get content ID from URL
function getContentIdFromUrl() {
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
    const response = await fetch(`${API_BASE_URL}/episodes/content/${contentId}`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching episodes:", error);
    return null;
  }
}

// Update views count
async function updateViews(contentId) {
  try {
    await fetch(`${API_BASE_URL}/content/${contentId}/views`, {
      method: "PUT"
    });
  } catch (error) {
    console.error("Error updating views:", error);
  }
}

// Format runtime
function formatRuntime(minutes) {
  if (!minutes) return "Unknown duration";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

// Display content details
function displayContentDetails(content) {
  const container = document.getElementById("contentDetailContainer");
  
  // Fix image path if necessary
  let imageUrl = content.imageUrl || "./posters/placeholder.jpg";
  if (imageUrl.startsWith("/assets/posters/")) {
    imageUrl = imageUrl.replace("/assets/posters/", "./posters/");
  }
  
  // Format genres
  let genreNames = "Unknown";
  if (content.genres && content.genres.length > 0) {
    if (typeof content.genres[0] === "object") {
      genreNames = content.genres.map(g => g.name).join(", ");
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
  
  // תיקון נתיב הווידאו אם צריך
  if (videoUrl && videoUrl.startsWith("/assets/videos/")) {
    videoUrl = videoUrl.replace("/assets/videos/", "./videos/");
  }
  
  // עבור סרטים, נוסיף הדפסת דיבוג לראות אם יש להם videoUrl
  if (content.type === "movie") {
    console.log("Movie content:", content);
    console.log("Video URL for movie:", videoUrl);
  }
  
  const videoSection = videoUrl ? 
    `<div class="video-container">
      <video controls width="100%" poster="${imageUrl}">
        <source src="${videoUrl}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>` :
    `<div class="content-banner">
      <img src="${imageUrl}" alt="${content.title}" onerror="this.src='./Images/placeholder.jpg'">
    </div>`;
  
  container.innerHTML = `
    <div class="content-detail">
      ${videoSection}
      <div class="content-info-detail">
        <h1>${content.title}</h1>
        <div class="content-meta">
          <span class="year">${content.releaseYear}</span>
          <span class="rating">${content.rating ? `★ ${content.rating}` : ''}</span>
          <span class="duration">${formatRuntime(content.duration)}</span>
          <span class="genre">${genreNames}</span>
        </div>
        <div class="description">
          <p>${content.description}</p>
        </div>
        <div class="stats">
          <div class="views"><i class="bi bi-eye"></i> ${content.views || 0} views</div>
          <div class="likes"><i class="bi bi-heart"></i> ${content.likes || 0} likes</div>
        </div>
        ${content.cast && content.cast.length > 0 ? `
        <div class="cast">
          <h3>Cast</h3>
          <ul>
            ${content.cast.map(actor => `
              <li>
                ${actor.name} ${actor.role ? `as ${actor.role}` : ''}
                ${actor.wikipediaLink ? `<a href="${actor.wikipediaLink}" target="_blank"><i class="bi bi-wikipedia"></i></a>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
        ` : ''}
        ${content.director ? `<div class="director"><strong>Director:</strong> ${content.director}</div>` : ''}
      </div>
    </div>
  `;
}

// Display episodes for series
function displayEpisodes(episodes, seriesTitle) {
  if (!episodes || episodes.length === 0) return;
  
  const container = document.getElementById("episodesContainer");
  container.style.display = "block";
  
  // Group episodes by season
  const seasons = {};
  episodes.forEach(episode => {
    const season = episode.seasonNumber;
    if (!seasons[season]) seasons[season] = [];
    seasons[season].push(episode);
  });
  
  // Sort seasons and episodes
  const sortedSeasons = Object.keys(seasons).sort((a, b) => a - b);
  
  // Create season tabs
  const seasonsTabs = document.querySelector(".seasons-tabs");
  seasonsTabs.innerHTML = sortedSeasons.map((season, index) => 
    `<button class="season-tab ${index === 0 ? 'active' : ''}" 
     data-season="${season}">Season ${season}</button>`
  ).join("");
  
  // Create episodes list for first season
  displaySeasonEpisodes(seasons[sortedSeasons[0]], seriesTitle);
  
  // Add event listeners to season tabs
  document.querySelectorAll(".season-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      // Update active tab
      document.querySelectorAll(".season-tab").forEach(t => t.classList.remove("active"));
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
  
  container.innerHTML = episodes.map(episode => {
    // Fix video path
    let videoUrl = episode.videoUrl || "";
    if (videoUrl.startsWith("/assets/videos/")) {
      videoUrl = videoUrl.replace("/assets/videos/", "./videos/");
    }
    
    return `
      <div class="episode-card">
        <h3>${episode.title}</h3>
        <div class="episode-number">S${episode.seasonNumber} E${episode.episodeNumber}</div>
        <div class="episode-description">${episode.description}</div>
        <div class="episode-meta">
          <span class="duration">${formatRuntime(episode.duration)}</span>
        </div>
        ${videoUrl ? `
        <div class="episode-video">
          <video controls width="100%">
            <source src="${videoUrl}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
        ` : ''}
      </div>
    `;
  }).join("");
}

// Main function
async function initContentDetail() {
  // Check if user is logged in
  if (!localStorage.getItem("isLoggedIn")) {
    window.location.href = "./login.html";
    return;
  }

  // Get current profile
  const currentProfile = JSON.parse(localStorage.getItem("currentProfile"));
  if (!currentProfile) {
    window.location.href = "./profiles.html";
    return;
  }

  // Update profile display
  const profileName = document.getElementById("profileName");
  const menuProfileImage = document.getElementById("menuProfileImage");
  profileName.textContent = currentProfile.name;
  menuProfileImage.src = currentProfile.image;

  // Get content ID from URL
  const contentId = getContentIdFromUrl();
  if (!contentId) {
    document.getElementById("contentDetailContainer").innerHTML = `
      <div class="error">Content ID not provided. <a href="./feed.html">Back to Browse</a></div>
    `;
    return;
  }

  // Fetch and display content
  const content = await fetchContentDetails(contentId);
  if (!content) {
    document.getElementById("contentDetailContainer").innerHTML = `
      <div class="error">Content not found. <a href="./feed.html">Back to Browse</a></div>
    `;
    return;
  }

  // Display content details
  displayContentDetails(content);

  // Update view count
  updateViews(contentId);

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
    if (!dropdownToggle.contains(e.target) && !profileDropdown.contains(e.target)) {
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
        case "Switch User":
          window.location.href = "./profiles.html";
          break;
        case "Logout":
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("currentProfile");
          window.location.href = "./login.html";
          break;
      }
    });
  });
}

// Initialize when page is loaded
document.addEventListener("DOMContentLoaded", initContentDetail);
