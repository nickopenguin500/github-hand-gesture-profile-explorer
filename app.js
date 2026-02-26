const searchBtn = document.getElementById('search-btn');
const usernameInput = document.getElementById('username-input');

// 1. Standard Mouse Click (for basic testing)
searchBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) fetchGitHubProfile(username);
});

// 2. Gesture Control (Listens for the custom event from vision.js)
document.addEventListener('hand-pinch', (event) => {
    const pinchX = event.detail.x;
    const pinchY = event.detail.y;
    
    // Get the boundaries of the search button
    const buttonRect = searchBtn.getBoundingClientRect();

    // Check if the pinch coordinates overlap with the button
    const isPinchOnButton = (
        pinchX >= buttonRect.left &&
        pinchX <= buttonRect.right &&
        pinchY >= buttonRect.top &&
        pinchY <= buttonRect.bottom
    );

    if (isPinchOnButton) {
        const username = usernameInput.value.trim();
        if (username) fetchGitHubProfile(username);
    }
});