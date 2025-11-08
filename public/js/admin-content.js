// Global variables
let allGenres = [];
let allSeries = [];
let castCountCreate = 0;
const MAX_CAST = 10;
let currentFormType = "content"; // "content" or "episode"

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  loadGenres();
  loadSeries();
  setupEventListeners();
  setupCastManagement();
  setupTypeChangeHandlers();
  setupResetButton();
  setupContentTypeToggle();
});

// Load Genres
async function loadGenres() {
  try {
    const response = await fetch("/api/genres");
    if (!response.ok) throw new Error("Failed to load genres");

    const data = await response.json();
    allGenres = data.data || data;

    populateGenreSelects();
  } catch (error) {
    console.error("Error loading genres:", error);
    showMessage(
      "createMessage",
      "Failed to load genres. Please refresh the page.",
      "error"
    );
  }
}

// Load Series for Episode Form
async function loadSeries() {
  try {
    const response = await fetch("/api/content?type=series&limit=1000");
    if (!response.ok) throw new Error("Failed to load series");

    const data = await response.json();
    allSeries = data.data || [];

    populateSeriesDropdown();
  } catch (error) {
    console.error("Error loading series:", error);
    showMessage(
      "createMessage",
      "Failed to load series. Please refresh the page.",
      "error"
    );
  }
}

function populateSeriesDropdown() {
  const dropdown = document.getElementById("episode_series");
  if (!dropdown) return;

  // Clear existing options except the first one
  dropdown.innerHTML = '<option value="">Select a series...</option>';

  // Add series options
  allSeries.forEach((series) => {
    const option = document.createElement("option");
    option.value = series._id;
    option.textContent = `${series.title} (${series.releaseYear})`;
    dropdown.appendChild(option);
  });
}

function populateGenreSelects() {
  const container = document.getElementById("create_genres");

  if (!container) return;

  const checkboxes = allGenres
    .filter((genre) => genre.isActive)
    .map(
      (genre) => `
      <label class="genre-checkbox-label">
        <input
          type="checkbox"
          name="genres"
          value="${genre._id}"
          class="genre-checkbox"
        />
        <span class="genre-checkbox-text">${genre.name}</span>
      </label>
    `
    )
    .join("");

  container.innerHTML = checkboxes;

  // Add event listeners to toggle checked class on labels
  const genreCheckboxes = container.querySelectorAll(".genre-checkbox");
  genreCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      const label = this.closest(".genre-checkbox-label");
      if (this.checked) {
        label.classList.add("checked");
      } else {
        label.classList.remove("checked");
      }
    });
  });
}

// Cast Management
function setupCastManagement() {
  // Create form
  document.getElementById("create_addCastBtn").addEventListener("click", () => {
    if (castCountCreate < MAX_CAST) {
      addCastMember("create");
    } else {
      showMessage(
        "createMessage",
        `Maximum ${MAX_CAST} cast members allowed`,
        "error"
      );
      setTimeout(() => clearMessages(), 3000);
    }
  });
}

function addCastMember(formType) {
  const container = document.getElementById(`${formType}_castContainer`);
  const index = castCountCreate;

  const castMemberDiv = document.createElement("div");
  castMemberDiv.className = "cast-member";
  castMemberDiv.innerHTML = `
    <div class="cast-member-header">
      <span class="cast-member-title">Cast Member ${index + 1}</span>
      <button type="button" class="remove-cast-btn" onclick="removeCastMember(this, '${formType}')">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>
    <div class="cast-fields">
      <div class="cast-field">
        <label>Name *</label>
        <input type="text" name="${formType}_cast_name_${index}" required class="form-control" placeholder="Actor Name">
      </div>
      <div class="cast-field">
        <label>Role</label>
        <input type="text" name="${formType}_cast_role_${index}" class="form-control" placeholder="Character Name">
      </div>
      <div class="cast-field">
        <label>Wikipedia Link</label>
        <input type="url" name="${formType}_cast_wiki_${index}" class="form-control" placeholder="https://en.wikipedia.org/wiki/...">
      </div>
    </div>
  `;

  container.appendChild(castMemberDiv);
  castCountCreate++;
}

function removeCastMember(button, formType) {
  button.closest(".cast-member").remove();
  castCountCreate--;

  // Renumber remaining cast members
  renumberCastMembers(formType);
}

function renumberCastMembers(formType) {
  const container = document.getElementById(`${formType}_castContainer`);
  const castMembers = container.querySelectorAll(".cast-member");

  castMembers.forEach((member, index) => {
    const title = member.querySelector(".cast-member-title");
    title.textContent = `Cast Member ${index + 1}`;

    const inputs = member.querySelectorAll("input");
    inputs[0].name = `${formType}_cast_name_${index}`;
    inputs[1].name = `${formType}_cast_role_${index}`;
    inputs[2].name = `${formType}_cast_wiki_${index}`;
  });

  castCountCreate = castMembers.length;
}

// Type Change Handlers (Show/Hide Duration)
function setupTypeChangeHandlers() {
  document.getElementById("create_type").addEventListener("change", (e) => {
    toggleDurationField("create", e.target.value);
  });
}

// Reset Button Handler
function setupResetButton() {
  const form = document.getElementById("createContentForm");
  const resetButton = form.querySelector('button[type="reset"]');

  if (resetButton) {
    resetButton.addEventListener("click", (e) => {
      e.preventDefault();
      resetForm();
    });
  }
}

function resetForm() {
  const form = document.getElementById("createContentForm");

  // Reset form fields
  form.reset();

  // Clear cast members
  clearCastMembers("create");

  // Uncheck all genre checkboxes and remove checked class from labels
  const genreCheckboxes = document.querySelectorAll(
    '#create_genres input[type="checkbox"]'
  );
  genreCheckboxes.forEach((checkbox) => {
    checkbox.checked = false;
    const label = checkbox.closest(".genre-checkbox-label");
    if (label) {
      label.classList.remove("checked");
    }
  });

  // Reset duration field visibility
  const typeSelect = document.getElementById("create_type");
  if (typeSelect) {
    toggleDurationField("create", typeSelect.value);
  }

  // Reset episode form fields if visible
  if (currentFormType === "episode") {
    const episodeSeries = document.getElementById("episode_series");
    if (episodeSeries) {
      episodeSeries.value = "";
    }
  }

  // Clear messages
  clearMessages();
}

function toggleDurationField(formType, type) {
  const durationGroup = document.getElementById(`${formType}_durationGroup`);
  const durationInput = document.getElementById(`${formType}_duration`);

  if (type === "series") {
    durationGroup.style.display = "none";
    durationInput.removeAttribute("required");
    durationInput.value = "";
  } else {
    durationGroup.style.display = "block";
  }
}

// Content Type Toggle (Series vs Episode)
function setupContentTypeToggle() {
  const seriesBtn = document.getElementById("contentTypeSeries");
  const episodeBtn = document.getElementById("contentTypeEpisode");

  if (seriesBtn && episodeBtn) {
    seriesBtn.addEventListener("click", () => switchToContentForm());
    episodeBtn.addEventListener("click", () => switchToEpisodeForm());
  }
}

function switchToContentForm() {
  currentFormType = "content";
  
  // Update button states
  document.getElementById("contentTypeSeries").classList.add("active");
  document.getElementById("contentTypeEpisode").classList.remove("active");
  
  // Update section title
  document.getElementById("sectionTitle").textContent = "Create New Content";
  
  // Show/hide form sections
  document.getElementById("contentFormSections").style.display = "block";
  document.getElementById("episodeFormSection").style.display = "none";
  
  // Update submit button text
  document.getElementById("submitBtnText").textContent = "Create Content";
  
  // Make episode fields not required
  const episodeFields = document.querySelectorAll("#episodeFormSection [required]");
  episodeFields.forEach(field => field.removeAttribute("required"));
  
  // Make content fields required again
  const contentFields = document.querySelectorAll("#contentFormSections [required]");
  contentFields.forEach(field => field.setAttribute("required", "required"));
  
  // Reset form
  resetForm();
}

function switchToEpisodeForm() {
  currentFormType = "episode";
  
  // Update button states
  document.getElementById("contentTypeSeries").classList.remove("active");
  document.getElementById("contentTypeEpisode").classList.add("active");
  
  // Update section title
  document.getElementById("sectionTitle").textContent = "Create New Episode";
  
  // Show/hide form sections
  document.getElementById("contentFormSections").style.display = "none";
  document.getElementById("episodeFormSection").style.display = "block";
  
  // Update submit button text
  document.getElementById("submitBtnText").textContent = "Create Episode";
  
  // Make content fields not required
  const contentFields = document.querySelectorAll("#contentFormSections [required]");
  contentFields.forEach(field => field.removeAttribute("required"));
  
  // Make episode fields required
  const episodeFields = document.querySelectorAll("#episodeFormSection [required]");
  episodeFields.forEach(field => field.setAttribute("required", "required"));
  
  // Reset form
  resetForm();
}

// Event Listeners
function setupEventListeners() {
  // Create form submission
  document
    .getElementById("createContentForm")
    .addEventListener("submit", handleCreateSubmit);

  // Close success modal
  document
    .getElementById("closeSuccessModal")
    .addEventListener("click", closeSuccessModal);

  // Close modal when clicking outside
  document.getElementById("successModal").addEventListener("click", (e) => {
    if (e.target.id === "successModal") {
      closeSuccessModal();
    }
  });
}

// Create Content or Episode
async function handleCreateSubmit(e) {
  e.preventDefault();

  // Show loading state
  const submitBtn = document.getElementById("submitBtn");
  const submitBtnText = document.getElementById("submitBtnText");
  const originalText = submitBtnText.textContent;

  submitBtn.classList.add("loading");
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Sending...';

  // Clear previous messages
  clearMessages();

  try {
    let formData;
    let apiEndpoint;
    let validationError;

    if (currentFormType === "episode") {
      // Validate and collect episode data
      validationError = validateEpisodeForm();
      if (validationError) {
        showMessage("createMessage", validationError, "error");
        submitBtn.classList.remove("loading");
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="bi bi-check-lg"></i> <span id="submitBtnText">${originalText}</span>`;
        return;
      }

      formData = collectEpisodeFormData();
      apiEndpoint = "/api/episodes";
    } else {
      // Validate and collect content data
      formData = collectFormData("create");

      // Validate genres
      if (!formData.genres || formData.genres.length === 0) {
        showMessage("createMessage", "Please select at least one genre.", "error");
        submitBtn.classList.remove("loading");
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="bi bi-check-lg"></i> <span id="submitBtnText">${originalText}</span>`;
        return;
      }

      apiEndpoint = "/api/admin";
    }

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      // Reset form
      resetForm();

      // Show success modal
      const successMessage = data.message || 
        (currentFormType === "episode" 
          ? "Episode successfully added." 
          : "Content successfully added.");
      showSuccessModal(successMessage);
    } else {
      // Show error message
      const errorMessage =
        data.error ||
        data.message ||
        (currentFormType === "episode"
          ? "An error occurred while creating the episode."
          : "An error occurred while creating the content.");
      showMessage("createMessage", errorMessage, "error");
    }
  } catch (error) {
    console.error(`Error creating ${currentFormType}:`, error);

    let errorMessage = `Unexpected error occurred while creating the ${currentFormType}.`;

    if (error.message) {
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("network")
      ) {
        errorMessage =
          "Network error: Unable to connect to the server. Please check your internet connection and try again.";
      } else if (error.message.includes("timeout")) {
        errorMessage =
          "Timeout: The server is taking too long to respond. Please try again.";
      } else {
        errorMessage = `Error: ${error.message}`;
      }
    }

    showMessage("createMessage", errorMessage, "error");
  } finally {
    // Reset button state
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i class="bi bi-check-lg"></i> <span id="submitBtnText">${originalText}</span>`;
  }
}

// Validate Episode Form
function validateEpisodeForm() {
  const series = document.getElementById("episode_series").value;
  const seasonNumber = document.getElementById("episode_seasonNumber").value;
  const episodeNumber = document.getElementById("episode_episodeNumber").value;
  const title = document.getElementById("episode_title").value.trim();
  const description = document.getElementById("episode_description").value.trim();
  const duration = document.getElementById("episode_duration").value;
  const videoUrl = document.getElementById("episode_videoUrl").value.trim();

  if (!series) {
    return "Please select a parent series.";
  }

  if (!seasonNumber || parseInt(seasonNumber) < 1) {
    return "Please enter a valid season number (minimum 1).";
  }

  if (!episodeNumber || parseInt(episodeNumber) < 1) {
    return "Please enter a valid episode number (minimum 1).";
  }

  if (!title) {
    return "Please enter an episode title.";
  }

  if (!description) {
    return "Please enter an episode description.";
  }

  if (!duration || parseInt(duration) < 1) {
    return "Please enter a valid duration in minutes (minimum 1).";
  }

  if (!videoUrl) {
    return "Please enter a video URL.";
  }

  // Validate URL format
  try {
    new URL(videoUrl);
  } catch (e) {
    return "Please enter a valid video URL.";
  }

  return null; // No validation errors
}

// Collect Episode Form Data
function collectEpisodeFormData() {
  const formData = {
    content: document.getElementById("episode_series").value,
    seasonNumber: parseInt(document.getElementById("episode_seasonNumber").value),
    episodeNumber: parseInt(document.getElementById("episode_episodeNumber").value),
    title: document.getElementById("episode_title").value.trim(),
    description: document.getElementById("episode_description").value.trim(),
    duration: parseInt(document.getElementById("episode_duration").value),
    videoUrl: document.getElementById("episode_videoUrl").value.trim(),
  };

  // Optional fields
  const imageUrl = document.getElementById("episode_imageUrl").value.trim();
  if (imageUrl) {
    formData.imageUrl = imageUrl;
  }

  const releaseDate = document.getElementById("episode_releaseDate").value;
  if (releaseDate) {
    formData.releaseDate = new Date(releaseDate);
  }

  return formData;
}

// Success Modal Functions
function showSuccessModal(message) {
  const modal = document.getElementById("successModal");
  const messageEl = document.getElementById("successMessage");

  messageEl.textContent = message;
  modal.classList.add("show");
}

function closeSuccessModal() {
  const modal = document.getElementById("successModal");
  modal.classList.remove("show");
}

// Utility Functions
function collectFormData(formType) {
  const formData = {
    title: document.getElementById(`${formType}_title`).value.trim(),
    type: document.getElementById(`${formType}_type`).value,
    description: document
      .getElementById(`${formType}_description`)
      .value.trim(),
    releaseYear: parseInt(
      document.getElementById(`${formType}_releaseYear`).value
    ),
    imageUrl: document.getElementById(`${formType}_imageUrl`).value.trim(),
    trailerUrl: document.getElementById(`${formType}_trailerUrl`).value.trim(),
    videoUrl: document.getElementById(`${formType}_videoUrl`).value.trim(),
    director: document.getElementById(`${formType}_director`).value.trim(),
  };

  // Rating will be automatically updated from IMDB on server side

  // Duration (only for movies)
  const durationValue = document.getElementById(`${formType}_duration`).value;
  if (formData.type === "movie" && durationValue) {
    formData.duration = parseInt(durationValue);
  }

  // Genres - Get checked checkboxes
  const genreCheckboxes = document.querySelectorAll(
    `#${formType}_genres input[type="checkbox"]:checked`
  );
  formData.genres = Array.from(genreCheckboxes).map(
    (checkbox) => checkbox.value
  );

  // Producers
  const producersValue = document
    .getElementById(`${formType}_producers`)
    .value.trim();
  if (producersValue) {
    formData.producers = producersValue
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p);
  }

  // Cast
  formData.cast = [];
  for (let i = 0; i < castCountCreate; i++) {
    const nameInput = document.querySelector(
      `input[name="${formType}_cast_name_${i}"]`
    );
    const roleInput = document.querySelector(
      `input[name="${formType}_cast_role_${i}"]`
    );
    const wikiInput = document.querySelector(
      `input[name="${formType}_cast_wiki_${i}"]`
    );

    if (nameInput && nameInput.value.trim()) {
      formData.cast.push({
        name: nameInput.value.trim(),
        role: roleInput ? roleInput.value.trim() : "",
        wikipediaLink: wikiInput ? wikiInput.value.trim() : "",
      });
    }
  }

  return formData;
}

function clearCastMembers(formType) {
  document.getElementById(`${formType}_castContainer`).innerHTML = "";
  castCountCreate = 0;
}

function showMessage(elementId, message, type) {
  const messageEl = document.getElementById(elementId);
  messageEl.className = `message ${type}`;
  messageEl.innerHTML = `
    <i class="bi bi-${
      type === "success" ? "check-circle-fill" : "exclamation-circle-fill"
    }"></i>
    ${message}
  `;
}

function clearMessages() {
  const el = document.getElementById("createMessage");
  if (el) {
    el.className = "message";
    el.innerHTML = "";
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
