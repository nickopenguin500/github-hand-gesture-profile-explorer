async function fetchGitHubProfile(username) {
    const errorText = document.getElementById('error-message');
    const profileCard = document.getElementById('profile-card');

    try {
        errorText.classList.add('hidden'); // Hide old errors
        
        const response = await fetch(`https://api.github.com/users/${username}`);
        
        if (!response.ok) {
            if (response.status === 404) throw new Error("User not found.");
            if (response.status === 403) throw new Error("API rate limit exceeded.");
            throw new Error("Something went wrong with the API.");
        }

        const data = await response.json();

        // Update the DOM with the fetched data
        document.getElementById('avatar').src = data.avatar_url;
        document.getElementById('name').innerText = data.name || data.login;
        document.getElementById('bio').innerText = data.bio || "No bio available.";
        document.getElementById('repos').innerText = data.public_repos;

        profileCard.classList.remove('hidden'); // Show the card

    } catch (error) {
        profileCard.classList.add('hidden');
        errorText.innerText = error.message;
        errorText.classList.remove('hidden');
    }
}