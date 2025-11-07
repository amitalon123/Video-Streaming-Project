document.addEventListener('DOMContentLoaded', function() {
  const SERVER_API_BASE = 'http://localhost:4000/api';

  // Check if user is logged in
  if (!localStorage.getItem('isLoggedIn')) {
    window.location.href = '/login';
    return;
  }

  const defaultProfiles = [
    { name: 'Amit', image: '/Images/Amit.jpg' },
    { name: 'Asaf', image: '/Images/Asaf.jpg' },
    { name: 'Reut', image: '/Images/Reut.jpg' },
    { name: 'Edith', image: '/Images/Edith.jpg' },
    { name: 'Daniel', image: '/Images/Daniel.jpg' }
  ];

  const profileList = document.getElementById('profileList');
  const logoutBtn = document.getElementById('logoutBtn');

  async function fetchProfilesFromServer() {
    try {
      const res = await fetch(`${SERVER_API_BASE}/profiles`);
      if (!res.ok) throw new Error('Failed to load profiles');
      const json = await res.json();
      if (!json.success) throw new Error('Profiles API error');
      return json.data.map((p, idx) => ({
        _id: p._id,
        name: p.name,
        image: p.avatarUrl || defaultProfiles[idx % defaultProfiles.length].image
      }));
    } catch (e) {
      console.warn('Falling back to local profiles:', e.message);
      // Fallback to localStorage/defaults
      const saved = JSON.parse(localStorage.getItem('profiles') || '[]');
      return (saved.length > 0 ? saved : defaultProfiles).map((p, i) => ({
        id: p.id || i + 1,
        name: p.name,
        image: p.image
      }));
    }
  }

  function renderProfiles(profiles) {
    profileList.innerHTML = '';
    profiles.forEach((profile) => {
      const profileItem = document.createElement('div');
      profileItem.className = 'profile-item';
      const profileId = profile._id || profile.id;
      profileItem.innerHTML = `
        <div class="profile-avatar" data-profile-id="${profileId}">
          <img src="${profile.image}" alt="${profile.name}'s profile" class="profile-image">
        </div>
        <div class="profile-name">
          <input type="text" value="${profile.name}" class="profile-name-input">
        </div>
      `;

      // Select profile
      profileItem.querySelector('.profile-avatar').addEventListener('click', () => {
        localStorage.setItem('currentProfile', JSON.stringify(profile));
        setTimeout(() => {
          window.location.href = '/feed';
        }, 300);
      });

      // Edit name
      const nameInput = profileItem.querySelector('.profile-name-input');
      nameInput.addEventListener('change', async () => {
        profile.name = nameInput.value;
        // Persist locally for fallback
        const savedProfiles = JSON.parse(localStorage.getItem('profiles') || '[]');
        const idx = savedProfiles.findIndex((p) => (p._id || p.id) === profileId);
        if (idx >= 0) savedProfiles[idx].name = profile.name; else savedProfiles.push(profile);
        localStorage.setItem('profiles', JSON.stringify(savedProfiles));

        // Try to persist on server
        if (profile._id) {
          try {
            await fetch(`${SERVER_API_BASE}/profiles/${profile._id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: profile.name })
            });
          } catch (e) {
            console.warn('Failed to update profile on server:', e.message);
          }
        }

        // Update current profile if selected
        const currentProfile = JSON.parse(localStorage.getItem('currentProfile'));
        if (currentProfile && (currentProfile._id === profile._id || currentProfile.id === profile.id)) {
          currentProfile.name = profile.name;
          localStorage.setItem('currentProfile', JSON.stringify(currentProfile));
        }
      });

      profileList.appendChild(profileItem);
    });
  }

  fetchProfilesFromServer().then(renderProfiles);

  // Logout
  logoutBtn.addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.clear();
    window.location.href = '/login';
  });
});
