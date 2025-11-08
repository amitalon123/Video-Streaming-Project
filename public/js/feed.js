// API Configuration
const API_BASE_URL = "http://localhost:3000/api";

// Global state - liked content from database
let likedContent = {};

// API Functions - לשימוש עתידי
async function fetchAllContent(searchTerm = "", sortBy = "") {
  try {
    let url = `${API_BASE_URL}/content?`;
    if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
    if (sortBy === "name") url += "sort=title:1&";
    else if (sortBy === "name-desc") url += "sort=title:-1&";

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

    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching movies:", error);
    return [];
  }
}

async function fetchPopularContent() {
  try {
    const response = await fetch(`${API_BASE_URL}/content/popular/all`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching popular content:", error);
    return [];
  }
}

// Fetch newest content
async function fetchNewestContent() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/content?sort=releaseYear:-1&limit=20`
    );
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching newest content:", error);
    return [];
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
async function fetchNewestByGenre(genreId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/content/newest/genre/${genreId}`
    );
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching newest content by genre:", error);
    return [];
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

// Fetch all liked content with full details
async function fetchLikedContent() {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const currentProfile = JSON.parse(localStorage.getItem("currentProfile"));
    if (!currentUser || !currentUser.id) {
      return [];
    }

    // Get viewing habits with liked=true
    const profileQuery = currentProfile?.id ? `&profile=${currentProfile.id}` : "";
    const response = await fetch(`${API_BASE_URL}/viewings?user=${currentUser.id}${profileQuery}&liked=true&limit=1000`);
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
  }" onerror="this.src='/Images/placeholder.jpg'">
      ${window.ViewingActions && window.ViewingActions.isWatched(itemId) ? '<span class="watched-badge">✓ Watched</span>' : ''}
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
    window.ViewingActions.attachWatchHandler(watchButton, posterEl, itemId);
  }

  return card;
}

// Display content in horizontal row
function displayContentInRow(rowElement, contentArray) {
  rowElement.innerHTML = "";
  contentArray.forEach((item) => {
    const card = createHorizontalCard(item);
    rowElement.appendChild(card);
  });
}

// Display home page with horizontal sections
// Flag to prevent multiple simultaneous calls
let isLoadingHomeSections = false;

async function displayHomeSections() {
  console.log("displayHomeSections called");

  // Prevent multiple simultaneous calls
  if (isLoadingHomeSections) {
    console.log("Already loading home sections, skipping...");
    return;
  }

  isLoadingHomeSections = true;

  try {
    // Clear genre sections container first to prevent duplicates
    const genreSectionsContainer = document.getElementById("genreSections");
    if (genreSectionsContainer) {
      genreSectionsContainer.innerHTML = "";
    }

    // Load Popular Now section
    const popularContent = await fetchPopularContent();
    const popularRow = document.getElementById("popularRow");
    if (popularRow && popularContent.length > 0) {
      popularRow.innerHTML = ""; // Clear existing content
      displayContentInRow(popularRow, popularContent);
    }

    // Load New Releases section
    const newestContent = await fetchNewestContent();
    const newReleasesRow = document.getElementById("newReleasesRow");
    if (newReleasesRow && newestContent.length > 0) {
      newReleasesRow.innerHTML = ""; // Clear existing content
      displayContentInRow(newReleasesRow, newestContent);
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
          const newestByGenre = await fetchNewestByGenre(genre._id);
          console.log(
            `Content for ${genre.name}:`,
            newestByGenre?.length || 0,
            "items"
          );

          // Even if there's no content, show the genre section so users can click on it
          // Convert genre ID to string to ensure proper URL encoding
          const genreId = String(genre._id);

          const section = document.createElement("section");
          section.className = "content-section";

          if (newestByGenre && newestByGenre.length > 0) {
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
            displayContentInRow(row, newestByGenre);
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
    const apiPopular = await fetchPopularContent();

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

// Original code continues below
// TV Shows list
const tvShows = [
  {
    id: 1,
    title: "Stranger Things",
    year: 2016,
    genre: "Sci-Fi & Fantasy",
    likes: 1500,
    type: "tv",
  },
  {
    id: 2,
    title: "Breaking Bad",
    year: 2008,
    genre: "Crime Drama",
    likes: 2000,
    type: "tv",
  },
  {
    id: 3,
    title: "The Crown",
    year: 2016,
    genre: "Historical Drama",
    likes: 1200,
    type: "tv",
  },
  {
    id: 4,
    title: "Dark",
    year: 2017,
    genre: "Sci-Fi Mystery",
    likes: 1400,
    type: "tv",
  },
  {
    id: 5,
    title: "Black Mirror",
    year: 2011,
    genre: "Sci-Fi Anthology",
    likes: 1300,
    type: "tv",
  },
  {
    id: 6,
    title: "The Last of Us",
    year: 2023,
    genre: "Drama",
    likes: 2200,
    type: "tv",
  },
  {
    id: 7,
    title: "House of the Dragon",
    year: 2022,
    genre: "Fantasy",
    likes: 2100,
    type: "tv",
  },
  {
    id: 8,
    title: "Better Call Saul",
    year: 2015,
    genre: "Crime Drama",
    likes: 1900,
    type: "tv",
  },
  {
    id: 9,
    title: "The Mandalorian",
    year: 2019,
    genre: "Sci-Fi Western",
    likes: 2300,
    type: "tv",
  },
  {
    id: 10,
    title: "Succession",
    year: 2018,
    genre: "Drama",
    likes: 1800,
    type: "tv",
  },
  {
    id: 11,
    title: "The Boys",
    year: 2019,
    genre: "Action",
    likes: 2000,
    type: "tv",
  },
  {
    id: 12,
    title: "Ted Lasso",
    year: 2020,
    genre: "Comedy",
    likes: 1700,
    type: "tv",
  },
];

// Movies list
const movies = [
  {
    id: 13,
    title: "Inception",
    year: 2010,
    genre: "Sci-Fi",
    likes: 2500,
    type: "movie",
  },
  {
    id: 14,
    title: "The Dark Knight",
    year: 2008,
    genre: "Action",
    likes: 2800,
    type: "movie",
  },
  {
    id: 15,
    title: "Interstellar",
    year: 2014,
    genre: "Sci-Fi",
    likes: 2400,
    type: "movie",
  },
  {
    id: 16,
    title: "Oppenheimer",
    year: 2023,
    genre: "Drama",
    likes: 2600,
    type: "movie",
  },
  {
    id: 17,
    title: "Barbie",
    year: 2023,
    genre: "Comedy",
    likes: 2300,
    type: "movie",
  },
  {
    id: 18,
    title: "Avatar: The Way of Water",
    year: 2022,
    genre: "Sci-Fi",
    likes: 2700,
    type: "movie",
  },
  {
    id: 19,
    title: "Top Gun: Maverick",
    year: 2022,
    genre: "Action",
    likes: 2200,
    type: "movie",
  },
  {
    id: 20,
    title: "Everything Everywhere All at Once",
    year: 2022,
    genre: "Action",
    likes: 2400,
    type: "movie",
  },
  {
    id: 21,
    title: "The Batman",
    year: 2022,
    genre: "Action",
    likes: 2100,
    type: "movie",
  },
  {
    id: 22,
    title: "Dune",
    year: 2021,
    genre: "Sci-Fi",
    likes: 2300,
    type: "movie",
  },
  {
    id: 23,
    title: "Spider-Man: Across the Spider-Verse",
    year: 2023,
    genre: "Animation",
    likes: 2500,
    type: "movie",
  },
  {
    id: 24,
    title: "The Super Mario Bros. Movie",
    year: 2023,
    genre: "Animation",
    likes: 2000,
    type: "movie",
  },
];

// Combined list for home view
const contentData = [...tvShows, ...movies];

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
  let profileImageUrl = currentProfile.image || "/Images/placeholder.jpg";
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

  searchIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    const isVisible = searchInputContainer.style.display === "block";
    searchInputContainer.style.display = isVisible ? "none" : "block";
    if (!isVisible) {
      document.getElementById("searchInput").focus();
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

      // Special handling for home page - display horizontal sections
      if (category === "home") {
        await displayHomeSections();
        return;
      }

      const grid = container.querySelector(".content-grid");
      grid.innerHTML = ""; // Clear existing content

      // Show loading state
      grid.innerHTML = `<div class="loading">Loading content...</div>`;

      try {
        // Choose which content to display - from API
        let contentToShow = [];
        const searchTerm = searchInput.value.toLowerCase();
        const sortType = sortSelect.value;

        if (category === "tvshows") {
          contentToShow = await fetchTVShows(searchTerm, sortType);
        } else if (category === "movies") {
          contentToShow = await fetchMovies(searchTerm, sortType);
        } else if (category === "popular" || category === "newandpopular") {
          // שם הקטגוריה שונה בין הממשק למשתמש לבין הקוד
          contentToShow = await fetchPopularContent();
        } else if (category === "mylist") {
          // Fetch liked content for My List
          contentToShow = await fetchLikedContent();
        } else {
          contentToShow = await fetchAllContent(searchTerm, sortType);
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
          }" onerror="this.src='/Images/placeholder.jpg'">
              ${window.ViewingActions && window.ViewingActions.isWatched(itemId) ? '<span class="watched-badge">✓ Watched</span>' : ''}
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
            window.ViewingActions.attachWatchHandler(watchButton, posterEl, itemId);
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
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");

  // Load liked content from database
  likedContent = await loadLikedContentFromDB();

  // Also sync with localStorage for offline support
  localStorage.setItem("likedContent", JSON.stringify(likedContent));

  // Show home content initially
  displayContent("home");

  // Event listeners for search and sort
  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();
    const activeCategory = document
      .querySelector(".nav-link.active")
      .getAttribute("data-category");
    displayContent(activeCategory);
  });

  sortSelect.addEventListener("change", () => {
    const activeCategory = document
      .querySelector(".nav-link.active")
      .getAttribute("data-category");
    displayContent(activeCategory);
  });
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
    const action = e.target.closest(".dropdown-item").textContent.trim();
    switch (action) {
      case "User":
        console.log("User clicked");
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
