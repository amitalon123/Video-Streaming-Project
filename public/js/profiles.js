document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('isLoggedIn')) {
    window.location.href = '/login';
    return;
  }

  const currentUser = safeParse(localStorage.getItem('currentUser'));
  if (!currentUser || !currentUser.id) {
    localStorage.clear();
    window.location.href = '/login';
    return;
  }

  const MAX_PROFILES = 5;
  const DEFAULT_AVATAR = '/Images/User1.jpg';
  const AVATAR_IMAGES = [
    DEFAULT_AVATAR,
    '/Images/User2.jpg',
    '/Images/User3.jpg',
    '/Images/User4.jpg',
    '/Images/User5.jpg'
  ];

  const userId = currentUser.id;
  const apiBaseUrl = `/api/users/${userId}/profiles`;

  const profileList = document.getElementById('profileList');
  const manageBtn = document.getElementById('manageProfilesBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  const profileModalElement = document.getElementById('profileModal');
  const profileModalTitle = document.getElementById('profileModalTitle');
  const profileForm = document.getElementById('profileForm');
  const profileNameInput = document.getElementById('profileNameInput');
  const avatarOptions = document.getElementById('avatarOptions');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const selectedAvatarInput = document.getElementById('selectedAvatarInput');

  const bootstrapModal = window.bootstrap && profileModalElement
    ? new window.bootstrap.Modal(profileModalElement)
    : null;

  let profiles = [];
  let isManaging = false;
  let modalMode = 'create';
  let editingProfileId = null;
  let selectedAvatar = AVATAR_IMAGES[0];
  let apiAvailable = true;

  init();

  async function init() {
    await reloadProfiles();
    attachEventHandlers();
    renderProfiles();
  }

  function attachEventHandlers() {
    manageBtn?.addEventListener('click', async (event) => {
      event.preventDefault();
      if (!apiAvailable) {
        window.alert('Profile management is temporarily unavailable. Please try again later.');
        return;
    }

      isManaging = !isManaging;
      manageBtn.textContent = isManaging ? 'Done' : 'Manage Profiles';
      renderProfiles();
    });

    logoutBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      localStorage.clear();
      window.location.href = '/login';
    });

    saveProfileBtn?.addEventListener('click', handleModalSubmit);

    profileNameInput?.addEventListener('input', () => {
      profileNameInput.classList.remove('is-invalid');
    });
  }

  async function handleModalSubmit() {
    if (!bootstrapModal) {
      return;
    }

    if (modalMode === 'create') {
      if (!profileForm.checkValidity()) {
        profileForm.classList.add('was-validated');
        return;
      }

      if (profiles.length >= MAX_PROFILES) {
        window.alert('You already have the maximum number of profiles.');
        return;
      }

      const name = profileNameInput.value.trim();
      const avatar = selectedAvatar || AVATAR_IMAGES[0];

      try {
        const payload = await callProfilesApi(apiBaseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, image: avatar })
        });
        await afterProfilesMutation(payload.profiles);
        bootstrapModal.hide();
      } catch (error) {
        window.alert(error.message);
      }
    } else if (modalMode === 'avatar' && editingProfileId) {
      try {
        const payload = await callProfilesApi(`${apiBaseUrl}/${editingProfileId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: selectedAvatar || AVATAR_IMAGES[0] })
        });
        await afterProfilesMutation(payload.profiles);
        bootstrapModal.hide();
      } catch (error) {
        window.alert(error.message);
      }
    }
  }

  async function reloadProfiles() {
    try {
      const payload = await callProfilesApi(apiBaseUrl);
      profiles = normalizeProfiles(payload.data || []);
      apiAvailable = true;
      manageBtn?.removeAttribute('disabled');
    } catch (error) {
      apiAvailable = false;
      manageBtn?.setAttribute('disabled', 'disabled');
      profiles = normalizeProfiles(buildDefaultProfiles());
      console.error('Failed to load profiles from server:', error);
      window.alert('Unable to load profiles from the server. Showing defaults without save support.');
    } finally {
      syncCurrentUserCache();
      ensureCurrentProfileValidity();
    }
  }

  function normalizeProfiles(rawProfiles = []) {
    if (!Array.isArray(rawProfiles)) {
      return [];
    }

    const normalized = rawProfiles
      .map((profile, index) => {
        const name = typeof profile.name === 'string' && profile.name.trim()
          ? profile.name.trim().substring(0, 20)
          : `Profile ${index + 1}`;
        const image = typeof profile.image === 'string' && profile.image.trim()
          ? profile.image.trim()
          : AVATAR_IMAGES[index % AVATAR_IMAGES.length];
        const idSource = profile.id || profile._id || profile.profileId || profile.uuid || `tmp-${index}`;

        return {
          id: String(idSource),
          name,
          image
        };
      })
      .slice(0, MAX_PROFILES);

    if (normalized.length === 0) {
      return buildDefaultProfiles();
    }

    return normalized;
  }

  async function callProfilesApi(url, options) {
    const response = await fetch(url, options);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = payload && payload.error ? payload.error : 'Request failed';
      throw new Error(errorMessage);
    }

    return payload;
  }

  async function afterProfilesMutation(nextProfiles) {
    profiles = normalizeProfiles(nextProfiles || []);
    syncCurrentUserCache();
    ensureCurrentProfileValidity();
    renderProfiles();
  }

  function renderProfiles() {
    if (!profileList) {
      return;
    }

    profileList.innerHTML = '';

    const fragment = document.createDocumentFragment();
    profiles.forEach((profile) => {
      fragment.appendChild(createProfileElement(profile));
    });
    profileList.appendChild(fragment);

    if (isManaging && profiles.length < MAX_PROFILES && apiAvailable) {
      profileList.appendChild(createAddProfileElement());
    }
  }

  function createProfileElement(profile) {
        const profileItem = document.createElement('div');
        profileItem.className = 'profile-item';
    profileItem.dataset.profileId = profile.id;

    if (isManaging) {
      profileItem.classList.add('manage-mode');
    }

    const avatarContainer = document.createElement('div');
    avatarContainer.className = 'profile-avatar';
    avatarContainer.dataset.profileId = profile.id;

    const avatarImage = document.createElement('img');
    avatarImage.src = profile.image;
    avatarImage.alt = `${profile.name}'s profile`;
    avatarImage.className = 'profile-image';
    avatarImage.loading = 'lazy';
    avatarImage.width = 200;
    avatarImage.height = 200;

    avatarContainer.appendChild(avatarImage);
    profileItem.appendChild(avatarContainer);

    const nameContainer = document.createElement('div');
    nameContainer.className = 'profile-name';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = profile.name;
    nameInput.maxLength = 20;
    nameInput.className = 'profile-name-input form-control text-center text-white';
    nameInput.autocomplete = 'off';
    nameInput.spellcheck = false;

    if (!isManaging || !apiAvailable) {
      nameInput.setAttribute('readonly', 'readonly');
      nameInput.classList.add('border-0', 'bg-transparent', 'shadow-none');
      nameInput.tabIndex = -1;
    } else {
      nameInput.removeAttribute('readonly');
      nameInput.classList.remove('border-0', 'bg-transparent', 'shadow-none');
      nameInput.tabIndex = 0;
    }

    nameInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        nameInput.blur();
      }
    });

    nameInput.addEventListener('blur', async () => {
      if (!isManaging || !apiAvailable) {
        return;
      }

      const newName = nameInput.value.trim();

      if (!newName) {
        nameInput.value = profile.name;
        return;
      }

      if (newName === profile.name) {
        return;
      }

      try {
        const payload = await callProfilesApi(`${apiBaseUrl}/${profile.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName.substring(0, 20) })
        });
        await afterProfilesMutation(payload.profiles);
      } catch (error) {
        window.alert(error.message);
        nameInput.value = profile.name;
      }
    });

    nameContainer.appendChild(nameInput);
    profileItem.appendChild(nameContainer);

    avatarContainer.addEventListener('click', (event) => {
      event.preventDefault();
      if (isManaging && apiAvailable) {
        openProfileModal('avatar', profile.id);
      } else {
        selectProfile(profile);
      }
    });

    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'profile-actions mt-3';

    if (isManaging && apiAvailable) {
      const changeAvatarBtn = document.createElement('button');
      changeAvatarBtn.type = 'button';
      changeAvatarBtn.className = 'btn btn-sm btn-outline-light me-2';
      changeAvatarBtn.textContent = 'Change Avatar';
      changeAvatarBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        openProfileModal('avatar', profile.id);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn btn-sm btn-outline-danger';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', async (event) => {
        event.stopPropagation();
        await handleDeleteProfile(profile.id, profile.name);
      });

      actionsContainer.appendChild(changeAvatarBtn);
      actionsContainer.appendChild(deleteBtn);
    } else {
      actionsContainer.classList.add('d-none');
    }

    profileItem.appendChild(actionsContainer);

    return profileItem;
  }

  function createAddProfileElement() {
    const addItem = document.createElement('div');
    addItem.className = 'profile-item add-profile';

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'btn btn-outline-light w-100 h-100 d-flex flex-column justify-content-center align-items-center';
    addButton.innerHTML = '<span class="display-4 fw-bold">+</span><span>Add Profile</span>';
    addButton.addEventListener('click', (event) => {
      event.preventDefault();
      openProfileModal('create');
    });

    addItem.appendChild(addButton);
    return addItem;
  }

  async function handleDeleteProfile(profileId, profileName) {
    const confirmDeletion = window.confirm(`Delete profile "${profileName}"?`);
    if (!confirmDeletion) {
      return;
    }

    try {
      const payload = await callProfilesApi(`${apiBaseUrl}/${profileId}`, {
        method: 'DELETE'
      });
      await afterProfilesMutation(payload.profiles);
    } catch (error) {
      window.alert(error.message);
    }
  }

  function selectProfile(profile) {
    localStorage.setItem('currentProfile', JSON.stringify(profile));
    window.location.href = '/feed';
  }

  function openProfileModal(mode, profileId = null) {
    if (!bootstrapModal) {
      return;
    }

    modalMode = mode;
    editingProfileId = profileId;
    profileForm.classList.remove('was-validated');
    profileNameInput.classList.remove('is-invalid');

    if (mode === 'create') {
      profileModalTitle.textContent = 'Create Profile';
      profileNameInput.value = '';
      profileNameInput.removeAttribute('readonly');
      profileNameInput.disabled = false;
      profileNameInput.classList.remove('border-0', 'bg-transparent');
      selectedAvatar = pickNextAvailableAvatar();
    } else if (mode === 'avatar' && profileId) {
      const profile = profiles.find((item) => item.id === profileId);
      if (!profile) {
        return;
      }

      profileModalTitle.textContent = 'Change Avatar';
      profileNameInput.value = profile.name;
      profileNameInput.setAttribute('readonly', 'readonly');
      profileNameInput.disabled = true;
      profileNameInput.classList.add('border-0', 'bg-transparent');
      selectedAvatar = profile.image;
    }

    renderAvatarOptions(selectedAvatar);
    bootstrapModal.show();

    if (!profileNameInput.disabled) {
      setTimeout(() => profileNameInput.focus(), 150);
    }
  }

  function renderAvatarOptions(activeImage) {
    if (!avatarOptions) {
      return;
    }

    avatarOptions.innerHTML = '';

    AVATAR_IMAGES.forEach((image) => {
      const col = document.createElement('div');
      col.className = 'col-4';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'avatar-option btn w-100 p-1 border border-2';
      button.dataset.avatar = image;
      button.style.backgroundColor = 'transparent';
      button.style.borderRadius = '0.75rem';

      const img = document.createElement('img');
      img.src = image;
      img.alt = 'Avatar';
      img.className = 'img-fluid rounded';
      img.loading = 'lazy';

      button.appendChild(img);
      button.addEventListener('click', () => {
        setSelectedAvatar(image);
      });

      col.appendChild(button);
      avatarOptions.appendChild(col);
    });

    setSelectedAvatar(activeImage);
  }

  function setSelectedAvatar(image) {
    selectedAvatar = image;
    if (selectedAvatarInput) {
      selectedAvatarInput.value = image;
    }

    Array.from(avatarOptions?.querySelectorAll('.avatar-option') || []).forEach((button) => {
      const isSelected = button.dataset.avatar === image;
      button.style.borderColor = isSelected ? '#0d6efd' : 'rgba(255, 255, 255, 0.3)';
      button.style.opacity = isSelected ? '1' : '0.7';
    });
  }

  function pickNextAvailableAvatar() {
    const usedImages = profiles.map((profile) => profile.image);
    const available = AVATAR_IMAGES.find((image) => !usedImages.includes(image));
    return available || AVATAR_IMAGES[0];
  }

  function syncCurrentUserCache() {
    const storedUser = safeParse(localStorage.getItem('currentUser'));
    if (!storedUser) {
      return;
    }

    storedUser.profiles = profiles;
    localStorage.setItem('currentUser', JSON.stringify(storedUser));
  }

  function ensureCurrentProfileValidity() {
    const storedProfile = safeParse(localStorage.getItem('currentProfile'));
    if (!storedProfile) {
      return;
    }

    const matchingProfile = profiles.find((profile) => profile.id === storedProfile.id);
    if (!matchingProfile) {
      localStorage.removeItem('currentProfile');
      return;
    }

    if (matchingProfile.name !== storedProfile.name || matchingProfile.image !== storedProfile.image) {
      localStorage.setItem('currentProfile', JSON.stringify(matchingProfile));
    }
  }

  function safeParse(value) {
    try {
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  }

  function buildDefaultProfiles() {
    return [
      {
        id: `default-${userId}`,
        name: deriveProfileName(currentUser.name),
        image: DEFAULT_AVATAR
      }
    ];
  }

  function deriveProfileName(name) {
    if (typeof name !== 'string' || !name.trim()) {
      return 'Profile';
    }

    const parts = name.trim().split(/\s+/);
    return parts[0].substring(0, 20);
  }
});
