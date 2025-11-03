document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (!localStorage.getItem('isLoggedIn')) {
        window.location.href = '/login';
        return;
    }

    // Default profiles
    let profiles = [
        { id: 1, name: 'Amit', image: '/Images/Amit.jpg' },
        { id: 2, name: 'Asaf', image: '/Images/Asaf.jpg' },
        { id: 3, name: 'Reut', image: '/Images/Reut.jpg' },
        { id: 4, name: 'Edith', image: '/Images/Edith.jpg' },
        { id: 5, name: 'Daniel', image: '/Images/Daniel.jpg' }
    ];

    // Load saved profiles if they exist
    const savedProfiles = JSON.parse(localStorage.getItem('profiles') || '[]');
    if (savedProfiles.length > 0) {
        // Update names from saved profiles
        profiles = profiles.map(profile => {
            const savedProfile = savedProfiles.find(p => p.id === profile.id);
            return savedProfile ? { ...profile, name: savedProfile.name } : profile;
        });
    }

    const profileList = document.getElementById('profileList');
    const logoutBtn = document.getElementById('logoutBtn');

    // Render profiles
    profiles.forEach(profile => {
        const profileItem = document.createElement('div');
        profileItem.className = 'profile-item';
        profileItem.innerHTML = `
            <div class="profile-avatar" data-profile-id="${profile.id}">
                <img src="${profile.image}" alt="${profile.name}'s profile" class="profile-image">
            </div>
            <div class="profile-name">
                <input type="text" value="${profile.name}" class="profile-name-input">
            </div>
        `;

        // Add click event to profile
        profileItem.querySelector('.profile-avatar').addEventListener('click', () => {
            // Save profile to localStorage
            localStorage.setItem('currentProfile', JSON.stringify(profile));
            
            // Create a welcome message
            const welcomeMessage = document.createElement('div');
            welcomeMessage.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                padding: 20px 40px;
                border-radius: 8px;
                z-index: 1000;
                font-size: 24px;
                color: white;
            `;
            // welcomeMessage.textContent = `Hello, ${profile.name}!`;
            // document.body.appendChild(welcomeMessage);

            // Redirect after showing message
            setTimeout(() => {
                window.location.href = '/feed';
            }, 1500);
        });

        // Add input event to save name changes
        const nameInput = profileItem.querySelector('.profile-name-input');
        nameInput.addEventListener('change', () => {
            profile.name = nameInput.value;
            // Update profiles in localStorage
            const savedProfiles = JSON.parse(localStorage.getItem('profiles') || '[]');
            const existingProfile = savedProfiles.find(p => p.id === profile.id);
            if (existingProfile) {
                existingProfile.name = profile.name;
            } else {
                savedProfiles.push(profile);
            }
            localStorage.setItem('profiles', JSON.stringify(savedProfiles));

            // Update current profile if it's the one being edited
            const currentProfile = JSON.parse(localStorage.getItem('currentProfile'));
            if (currentProfile && currentProfile.id === profile.id) {
                currentProfile.name = profile.name;
                localStorage.setItem('currentProfile', JSON.stringify(currentProfile));
            }
        });

        profileList.appendChild(profileItem);
    });

    // Logout functionality
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.clear();
        window.location.href = '/login';
    });
});
