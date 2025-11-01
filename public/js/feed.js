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
  function displayContent(category) {
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

      // Choose which content to display
      let contentToShow = [];
      if (category === "tvshows") {
        contentToShow = tvShows;
      } else if (category === "movies") {
        contentToShow = movies;
      } else {
        contentToShow = contentData;
      }

      // Apply search filter
      const searchTerm = searchInput.value.toLowerCase();
      if (searchTerm) {
        contentToShow = contentToShow.filter(
          (item) =>
            item.title.toLowerCase().includes(searchTerm) ||
            item.genre.toLowerCase().includes(searchTerm)
        );
      }

      // Apply sort
      const sortType = sortSelect.value;
      if (sortType === "name") {
        contentToShow.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortType === "name-desc") {
        contentToShow.sort((a, b) => b.title.localeCompare(a.title));
      }

      // Create and append cards
      contentToShow.forEach((item) => {
        const card = document.createElement("div");
        card.className = "content-card";

        // Check if the item is liked
        const isLiked = likedContent[item.id];
        const heartIcon = isLiked ? "❤️" : "🤍";
        const likeCount = item.likes + (isLiked ? 1 : 0);

        card.innerHTML = `
                    <div class="content-info">
                        <h3 class="content-title">${item.title}</h3>
                        <div class="content-metadata">
                            <span class="content-year">${item.year}</span>
                            <span class="content-genre">${item.genre}</span>
                        </div>
                        <button class="like-button ${
                          isLiked ? "liked" : ""
                        }" data-id="${item.id}">
                            <span class="heart">${heartIcon}</span>
                            <span class="like-count">${likeCount}</span>
                        </button>
                    </div>
                `;

        // Add like button functionality
        const likeButton = card.querySelector(".like-button");
        likeButton.addEventListener("click", () => {
          const isLiked = likedContent[item.id];
          if (isLiked) {
            delete likedContent[item.id];
            item.likes--;
            likeButton.classList.remove("liked");
            likeButton.querySelector(".heart").textContent = "🤍";
          } else {
            likedContent[item.id] = true;
            item.likes++;
            likeButton.classList.add("liked");
            likeButton.querySelector(".heart").textContent = "❤️";
          }
          likeButton.querySelector(".like-count").textContent = item.likes;
          localStorage.setItem("likedContent", JSON.stringify(likedContent));
        });

        grid.appendChild(card);
      });
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
