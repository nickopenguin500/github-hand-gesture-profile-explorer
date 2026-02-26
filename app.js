const searchBtn = document.getElementById('search-btn');
const usernameInput = document.getElementById('username-input');
const closeBtn = document.getElementById('close-btn');

// Standard Mouse Click (for basic testing)
searchBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) fetchGitHubProfile(username);
});

// Gesture Control Loop
document.addEventListener('hand-pinch', (event) => {
    // 1. Get the X and Y coordinates of your pinched fingers
    const px = event.detail.x;
    const py = event.detail.y;

    // 2. Search Button Collision Check
    const searchRect = searchBtn.getBoundingClientRect();
    if (px >= searchRect.left && px <= searchRect.right && py >= searchRect.top && py <= searchRect.bottom) {
        const username = usernameInput.value.trim();
        if (username) fetchGitHubProfile(username);
    }

    // 3. Back Button Collision Check (Only works if the modal is currently visible)
    const modal = document.getElementById('repo-modal');
    if (!modal.classList.contains('hidden')) {
        const closeRect = closeBtn.getBoundingClientRect();
        if (px >= closeRect.left && px <= closeRect.right && py >= closeRect.top && py <= closeRect.bottom) {
            modal.classList.add('hidden');
        }
    }

    // 4. Repository Cards Collision Check
    // We get a list of all current cards on the screen
    const cards = document.querySelectorAll('.repo-card');
    cards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        // The mathematical check: Is the point inside the rectangle?
        if (px >= cardRect.left && px <= cardRect.right && py >= cardRect.top && py <= cardRect.bottom) {
            // If yes, trigger a virtual 'click' on that card to open the modal
            card.click();
        }
    });
});