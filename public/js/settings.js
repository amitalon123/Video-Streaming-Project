// Settings & Statistics Page JavaScript

let genreChart = null;
let profileViewsChart = null;

// Initialize page
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Settings page loaded");

  // Check if user is logged in
  if (!localStorage.getItem("isLoggedIn")) {
    console.log("User not logged in, redirecting to login");
    window.location.href = "/login";
    return;
  }

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    console.log("No user found, redirecting to login");
    window.location.href = "/login";
    return;
  }

  // Update profile display in header
  const currentProfile = JSON.parse(localStorage.getItem("currentProfile"));
  if (currentProfile) {
    const profileName = document.getElementById("profileName");
    const menuProfileImage = document.getElementById("menuProfileImage");
    if (profileName) profileName.textContent = currentProfile.name;
    if (menuProfileImage) {
      let profileImageUrl = currentProfile.image || "/Images/placeholder.jpg";
      if (profileImageUrl.startsWith("./Images/")) {
        profileImageUrl = profileImageUrl.replace("./Images/", "/Images/");
      }
      menuProfileImage.src = profileImageUrl;
    }
  }

  // Load statistics
  await loadStatistics(currentUser.id);

  // Setup dropdown menu
  setupDropdown();
});

// Setup profile dropdown menu
function setupDropdown() {
  const dropdownToggle = document.querySelector(".dropdown-icon");
  const profileDropdown = document.getElementById("profileDropdown");
  const profileMenu = document.querySelector(".profile-menu");

  if (!dropdownToggle || !profileDropdown || !profileMenu) return;

  // Toggle dropdown when clicking the toggle
  profileMenu.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownToggle.classList.toggle("active");
    profileDropdown.classList.toggle("show");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !dropdownToggle.contains(e.target) &&
      !profileDropdown.contains(e.target) &&
      !profileMenu.contains(e.target)
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
          // Already on settings page, just close dropdown
          dropdownToggle.classList.remove("active");
          profileDropdown.classList.remove("show");
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

// Load statistics data
async function loadStatistics(userId) {
  const loadingIndicator = document.getElementById("loadingIndicator");
  const errorMessage = document.getElementById("errorMessage");

  try {
    // Show loading indicator
    if (loadingIndicator) loadingIndicator.style.display = "block";
    if (errorMessage) errorMessage.style.display = "none";

    // Fetch both API calls in parallel for better performance
    const [genreResponse, profileViewsResponse] = await Promise.all([
      fetch("/api/stats/genre"),
      fetch(`/api/stats/profile-views/${userId}`),
    ]);

    // Check if both responses are ok
    if (!genreResponse.ok || !profileViewsResponse.ok) {
      throw new Error("Failed to load statistics");
    }

    // Parse both JSON responses in parallel
    const [genreData, profileViewsData] = await Promise.all([
      genreResponse.json(),
      profileViewsResponse.json(),
    ]);

    // Initialize charts
    initializeGenreChart(genreData);
    initializeProfileViewsChart(profileViewsData);

    // Hide loading indicator
    if (loadingIndicator) loadingIndicator.style.display = "none";
  } catch (error) {
    console.error("Error loading statistics:", error);
    if (loadingIndicator) loadingIndicator.style.display = "none";
    if (errorMessage) {
      errorMessage.textContent = `Error loading statistics: ${error.message}`;
      errorMessage.style.display = "block";
    }

    // Initialize charts with empty data - will show "NO DATA" message
    initializeGenreChart({ success: true, data: [] });
    initializeProfileViewsChart({
      success: true,
      data: [],
    });
  }
}

// Generate dynamic colors for charts
function generateColors(count) {
  const baseColors = [
    { bg: "rgba(229, 9, 20, 0.8)", border: "rgba(229, 9, 20, 1)" }, // Netflix red
    { bg: "rgba(255, 193, 7, 0.8)", border: "rgba(255, 193, 7, 1)" }, // Yellow
    { bg: "rgba(40, 167, 69, 0.8)", border: "rgba(40, 167, 69, 1)" }, // Green
    { bg: "rgba(0, 123, 255, 0.8)", border: "rgba(0, 123, 255, 1)" }, // Blue
    { bg: "rgba(108, 117, 125, 0.8)", border: "rgba(108, 117, 125, 1)" }, // Gray
    { bg: "rgba(220, 53, 69, 0.8)", border: "rgba(220, 53, 69, 1)" }, // Red
    { bg: "rgba(23, 162, 184, 0.8)", border: "rgba(23, 162, 184, 1)" }, // Cyan
    { bg: "rgba(255, 87, 34, 0.8)", border: "rgba(255, 87, 34, 1)" }, // Orange
    { bg: "rgba(138, 43, 226, 0.8)", border: "rgba(138, 43, 226, 1)" }, // BlueViolet
    { bg: "rgba(255, 20, 147, 0.8)", border: "rgba(255, 20, 147, 1)" }, // DeepPink
    { bg: "rgba(0, 191, 255, 0.8)", border: "rgba(0, 191, 255, 1)" }, // DeepSkyBlue
    { bg: "rgba(255, 140, 0, 0.8)", border: "rgba(255, 140, 0, 1)" }, // DarkOrange
    { bg: "rgba(50, 205, 50, 0.8)", border: "rgba(50, 205, 50, 1)" }, // LimeGreen
    { bg: "rgba(255, 69, 0, 0.8)", border: "rgba(255, 69, 0, 1)" }, // RedOrange
    { bg: "rgba(72, 61, 139, 0.8)", border: "rgba(72, 61, 139, 1)" }, // DarkSlateBlue
  ];

  const backgroundColor = [];
  const borderColor = [];

  for (let i = 0; i < count; i++) {
    const colorIndex = i % baseColors.length;
    backgroundColor.push(baseColors[colorIndex].bg);
    borderColor.push(baseColors[colorIndex].border);
  }

  return { backgroundColor, borderColor };
}

// Initialize Genre Popularity Pie Chart
function initializeGenreChart(apiData) {
  const ctx = document.getElementById("genreChart");
  const noDataMessage = document.getElementById("genreChartNoData");
  const legendContainer = document.getElementById("genreChartLegend");

  if (!ctx) return;

  // Destroy existing chart if it exists
  if (genreChart) {
    genreChart.destroy();
    genreChart = null;
  }

  // Clear legend
  if (legendContainer) {
    legendContainer.innerHTML = "";
  }

  // Process data
  let chartData;
  let hasData = false;

  if (apiData.success && apiData.data && apiData.data.length > 0) {
    // Use real data from API - create array with labels and values
    const dataArray = apiData.data.map((item) => ({
      label:
        Array.isArray(item.genreName) && item.genreName.length > 0
          ? item.genreName[0]
          : item.genreName || "Unknown",
      value: item.totalViews || item.totalLikes || 0,
    }));

    // Filter out items with zero values
    const filteredData = dataArray.filter((item) => item.value > 0);

    if (filteredData.length > 0) {
      // Sort by value (descending) - from largest to smallest
      filteredData.sort((a, b) => b.value - a.value);

      // Extract sorted labels and values
      chartData = {
        labels: filteredData.map((item) => item.label),
        values: filteredData.map((item) => item.value),
        fullData: filteredData,
      };
      hasData = true;
    }
  }

  // Check if we have valid data
  if (!hasData || !chartData || chartData.labels.length === 0) {
    // Show "NO DATA" message
    if (noDataMessage) noDataMessage.style.display = "block";
    if (ctx) ctx.style.display = "none";
    if (legendContainer) legendContainer.style.display = "none";
    return;
  }

  // Hide "NO DATA" message
  if (noDataMessage) noDataMessage.style.display = "none";
  if (ctx) ctx.style.display = "block";
  if (legendContainer) legendContainer.style.display = "flex";

  // Generate colors dynamically based on number of genres
  const colors = generateColors(chartData.labels.length);

  // Create custom legend (sorted by value, descending) using DocumentFragment for better performance
  if (legendContainer) {
    const fragment = document.createDocumentFragment();
    chartData.fullData.forEach((item, index) => {
      const legendItem = document.createElement("div");
      legendItem.className = "legend-item";
      const colorDiv = document.createElement("div");
      colorDiv.className = "legend-color";
      colorDiv.style.backgroundColor = colors.backgroundColor[index];
      colorDiv.style.borderColor = colors.borderColor[index];

      const labelSpan = document.createElement("span");
      labelSpan.className = "legend-label";
      labelSpan.textContent = item.label;

      const valueSpan = document.createElement("span");
      valueSpan.className = "legend-value";
      valueSpan.textContent = item.value.toLocaleString();

      legendItem.appendChild(colorDiv);
      legendItem.appendChild(labelSpan);
      legendItem.appendChild(valueSpan);
      fragment.appendChild(legendItem);
    });
    legendContainer.appendChild(fragment);
  }

  // Create chart with performance optimizations
  genreChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: "Views",
          data: chartData.values,
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: {
        duration: 750, // Reduced animation time for faster rendering
      },
      plugins: {
        legend: {
          display: false, // Hide default legend, we use custom one
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "#fff",
          bodyColor: "#fff",
          borderColor: "#e50914",
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed || context.raw;
              return `${label}: ${value.toLocaleString()}`;
            },
          },
        },
      },
    },
  });
}

// Initialize Profile Views Bar Chart
function initializeProfileViewsChart(apiData) {
  const ctx = document.getElementById("profileViewsChart");
  const noDataMessage = document.getElementById("profileViewsChartNoData");

  if (!ctx) return;

  // Destroy existing chart if it exists
  if (profileViewsChart) {
    profileViewsChart.destroy();
    profileViewsChart = null;
  }

  // Process data
  let chartData;
  let hasData = false;

  if (apiData.success && apiData.data && apiData.data.length > 0) {
    // Use real data from API - data is already sorted by viewCount (descending) from backend
    const dataArray = apiData.data.map((item) => ({
      label: item.profileName || "Unknown",
      value: item.viewCount || 0,
    }));

    // Filter out items with zero values
    const filteredData = dataArray.filter((item) => item.value > 0);

    if (filteredData.length > 0) {
      // Data is already sorted from backend, but ensure it's sorted for consistency
      // Only sort if needed (check if already sorted)
      let needsSort = false;
      for (let i = 1; i < filteredData.length; i++) {
        if (filteredData[i].value > filteredData[i - 1].value) {
          needsSort = true;
          break;
        }
      }
      if (needsSort) {
        filteredData.sort((a, b) => b.value - a.value);
      }

      chartData = {
        labels: filteredData.map((item) => item.label),
        values: filteredData.map((item) => item.value),
      };
      hasData = true;
    }
  }

  // Check if we have valid data
  if (!hasData || !chartData || chartData.labels.length === 0) {
    // Show "NO DATA" message
    if (noDataMessage) noDataMessage.style.display = "block";
    if (ctx) ctx.style.display = "none";
    return;
  }

  // Hide "NO DATA" message
  if (noDataMessage) noDataMessage.style.display = "none";
  if (ctx) ctx.style.display = "block";

  // Create chart with performance optimizations
  profileViewsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: "Views",
          data: chartData.values,
          backgroundColor: "rgba(229, 9, 20, 0.8)",
          borderColor: "rgba(229, 9, 20, 1)",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: {
        duration: 750, // Reduced animation time for faster rendering
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "#fff",
          bodyColor: "#fff",
          borderColor: "#e50914",
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function (context) {
              const value = context.parsed.y || context.raw;
              return `Views: ${value.toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: "#fff",
            stepSize: 1,
            callback: function (value) {
              return value.toLocaleString();
            },
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        x: {
          ticks: {
            color: "#fff",
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
    },
  });
}
