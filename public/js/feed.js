// API Configuration
const API_BASE_URL = "http://localhost:3000/api";

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
    const response = await fetch(`${API_BASE_URL}/content/popular`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching popular content:", error);
    return [];
  }
}

async function updateLike(contentId, isLiked) {
  try {
    const response = await fetch(`${API_BASE_URL}/content/${contentId}/like`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ add: isLiked }),
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Error updating like status:", error);
    return null;
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

document.addEventListener("DOMContentLoaded", function () {
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

  // טעינת נתונים מה-API במקביל לנתונים הסטטיים
  // לא משנה את הפונקציונליות הקיימת בשלב זה
  // תצוגה ראשונית של נתונים מה-API בטעינת הדף
  const activeCategory = document
    .querySelector(".nav-link.active")
    .getAttribute("data-category");
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
        } else {
          contentToShow = await fetchAllContent(searchTerm, sortType);
        }

        // Clear the loading message
        grid.innerHTML = "";

        // If no content was found
        if (contentToShow.length === 0) {
          grid.innerHTML = `
            <div class="no-content">
              <p>No content found. Try different search criteria.</p>
            </div>
          `;
          return;
        }

        // Create and append cards
        contentToShow.forEach((item) => {
          const card = document.createElement("div");
          card.className = "content-card";

          // Get image URL and fix path if needed
          let imageUrl = item.imageUrl || "./posters/placeholder.jpg";

          // Fix image path if it's coming from the API with the wrong path
          if (imageUrl.startsWith("/assets/posters/")) {
            imageUrl = imageUrl.replace("/assets/posters/", "./posters/");
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

          card.innerHTML = `
            <div class="content-poster">
              <img src="${imageUrl}" alt="${
            item.title
          }" onerror="this.src='./Images/placeholder.jpg'">
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
                  <span class="like-count">${item.likes || 0}</span>
                </button>
              </div>
            </div>
          `;

          // Make the card clickable to view content details
          card.addEventListener("click", (e) => {
            // Prevent click if the like button was clicked
            if (e.target.closest(".like-button")) return;

            // Navigate to content detail page
            window.location.href = `./content-detail.html?id=${itemId}`;
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
              likeButton.querySelector(".like-count").textContent =
                (parseInt(
                  likeButton.querySelector(".like-count").textContent
                ) || 0) + 1;
            } else {
              delete likedContent[itemId];
              likeButton.classList.remove("liked");
              likeButton.querySelector(".heart").textContent = "🤍";
              likeButton.querySelector(".like-count").textContent = Math.max(
                0,
                (parseInt(
                  likeButton.querySelector(".like-count").textContent
                ) || 0) - 1
              );
            }

            // Save to localStorage
            localStorage.setItem("likedContent", JSON.stringify(likedContent));

            // Update on server
            try {
              await updateLike(itemId, newLikedState);
              console.log(`Updated like status for ${item.title}`);
            } catch (error) {
              console.error("Failed to update like status:", error);
            }
          });

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

  // Get liked content from localStorage
  let likedContent = JSON.parse(localStorage.getItem("likedContent")) || {};

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
