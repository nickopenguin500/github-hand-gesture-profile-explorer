async function fetchGitHubProfile(username) {
    const errorText = document.getElementById('error-message');
    const profileCard = document.getElementById('profile-card');
    const repoList = document.getElementById('repo-list'); 

    try {
        errorText.classList.add('hidden'); 
        
        // 1. Fetch the Profile
        const profileRes = await fetch(`https://api.github.com/users/${username}`);
        if (!profileRes.ok) {
            if (profileRes.status === 404) throw new Error("User not found.");
            throw new Error("API Limit Reached or Network Error.");
        }
        const profileData = await profileRes.json();

        // 2. Fetch the Repositories
        const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=4`);
        const reposData = await reposRes.json();

        // Update the Profile info
        document.getElementById('avatar').src = profileData.avatar_url;
        document.getElementById('name').innerText = profileData.name || profileData.login;
        document.getElementById('bio').innerText = profileData.bio || "No bio available.";
        
        // Build the Repository Cards
        repoList.innerHTML = ""; // Clear old searches
        reposData.forEach(repo => {
            repoList.innerHTML += `
                <div class="repo-card">
                    <h4>${repo.name}</h4>
                    <p>${repo.description || "No description provided."}</p>
                    <small>💻 ${repo.language || "Mixed"}</small>
                </div>
            `;
        });

        profileCard.classList.remove('hidden'); 

    } catch (error) {
        profileCard.classList.add('hidden');
        errorText.innerText = error.message;
        errorText.classList.remove('hidden');
    }
}