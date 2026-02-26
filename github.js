// --- 1. FETCH THE MAIN PROFILE ---
async function fetchGitHubProfile(username) {
    const errorText = document.getElementById('error-message');
    const profileCard = document.getElementById('profile-card');
    const repoList = document.getElementById('repo-list'); 

    try {
        errorText.classList.add('hidden'); 
        const profileRes = await fetch(`https://api.github.com/users/${username}`);
        if (!profileRes.ok) throw new Error("User not found.");
        const profileData = await profileRes.json();

        const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=4`);
        const reposData = await reposRes.json();

        document.getElementById('avatar').src = profileData.avatar_url;
        document.getElementById('name').innerText = profileData.name || profileData.login;
        document.getElementById('bio').innerText = profileData.bio || "No bio available.";
        
        repoList.innerHTML = ""; 
        reposData.forEach(repo => {
            const repoDiv = document.createElement('div');
            repoDiv.className = 'repo-card';
            
            repoDiv.innerHTML = `
                <h4>${repo.name}</h4>
                <p>${repo.description || "No description provided."}</p>
                <small>Language: ${repo.language || "Mixed"}</small>
            `;
            
            repoDiv.addEventListener('click', () => showRepoDetails(repo));
            repoList.appendChild(repoDiv);
        });

        profileCard.classList.remove('hidden'); 
    } catch (error) {
        profileCard.classList.add('hidden');
        errorText.innerText = error.message;
        errorText.classList.remove('hidden');
    }
}

// --- 2. COLOR MAP FOR LANGUAGE BAR ---
const languageColors = {
    "JavaScript": "#f1e05a", "Python": "#3572A5", "HTML": "#e34c26",
    "CSS": "#563d7c", "TypeScript": "#3178c6", "Java": "#b07219",
    "C++": "#f34b7d", "C": "#555555", "Shell": "#89e051"
};

// --- 3. FETCH DEEP REPOSITORY DETAILS (THE MODAL) ---
async function showRepoDetails(repo) {
    // Fill basic data
    document.getElementById('modal-repo-name').innerText = repo.name;
    document.getElementById('modal-repo-desc').innerText = repo.description || "No description provided.";
    document.getElementById('modal-repo-stars').innerHTML = `Stars: <span>${repo.stargazers_count}</span>`;
    document.getElementById('modal-repo-forks').innerHTML = `Forks: <span>${repo.forks_count}</span>`;
    document.getElementById('modal-repo-issues').innerHTML = `Issues: <span>${repo.open_issues_count}</span>`;
    document.getElementById('modal-repo-license').innerHTML = `License: <span>${repo.license ? repo.license.name : 'N/A'}</span>`;
    document.getElementById('modal-repo-size').innerHTML = `Size: <span>${repo.size > 1024 ? (repo.size / 1024).toFixed(2) + ' MB' : repo.size + ' KB'}</span>`;
    document.getElementById('modal-repo-link').href = repo.html_url;

    // Process Topics (Tags)
    const topicsContainer = document.getElementById('repo-topics');
    topicsContainer.innerHTML = ''; 
    if (repo.topics && repo.topics.length > 0) {
        repo.topics.forEach(topic => {
            topicsContainer.innerHTML += `<span class="topic-tag">${topic}</span>`;
        });
    }

    // Unhide the modal now so the user sees it while the heavy data loads
    document.getElementById('repo-modal').classList.remove('hidden');

    // Fetch Deep Language Data
    const langBar = document.getElementById('modal-language-bar');
    const langLegend = document.getElementById('modal-language-legend');
    langBar.innerHTML = ''; langLegend.innerHTML = '';
    
    try {
        const langRes = await fetch(repo.languages_url);
        const langData = await langRes.json();
        
        // Calculate total bytes to find percentages
        const totalBytes = Object.values(langData).reduce((a, b) => a + b, 0);
        
        for (const [lang, bytes] of Object.entries(langData)) {
            const percentage = ((bytes / totalBytes) * 100).toFixed(1);
            const color = languageColors[lang] || "#8b949e"; // Default gray if unknown
            
            // Build the visual bar
            langBar.innerHTML += `<div class="lang-segment" style="width: ${percentage}%; background-color: ${color};" title="${lang} ${percentage}%"></div>`;
            // Build the text legend
            langLegend.innerHTML += `<div class="lang-legend-item"><span style="background-color: ${color}; display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:5px;"></span>${lang} <small style="color:#8b949e">${percentage}%</small></div>`;
        }
    } catch (e) {
        console.log("Could not load languages");
    }

    // Fetch Deep Commit History
    const commitsContainer = document.getElementById('modal-commits');
    commitsContainer.innerHTML = '<p style="color: #8b949e; font-size: 14px;">Loading recent activity...</p>';
    
    try {
        // We strip {/sha} from the API URL to get the generic commits endpoint
        const commitUrl = repo.commits_url.replace('{/sha}', '') + '?per_page=3';
        const commitRes = await fetch(commitUrl);
        const commitsData = await commitRes.json();
        
        commitsContainer.innerHTML = '';
        if (Array.isArray(commitsData) && commitsData.length > 0) {
            commitsData.forEach(c => {
                const date = new Date(c.commit.author.date).toLocaleDateString();
                const msg = c.commit.message.split('\n')[0]; // Only get the first line of the commit message
                commitsContainer.innerHTML += `
                    <div class="commit-item">
                        <p class="commit-message">${msg}</p>
                        <p class="commit-date">${c.commit.author.name} • ${date}</p>
                    </div>
                `;
            });
        } else {
            commitsContainer.innerHTML = '<p style="color: #8b949e; font-size: 14px;">No recent commits found.</p>';
        }
    } catch (e) {
        commitsContainer.innerHTML = '<p style="color: #ff7b72; font-size: 14px;">Could not load commit history.</p>';
    }
}

// --- 4. EXPORTS AND EVENT LISTENERS ---
window.fetchGitHubProfile = fetchGitHubProfile;

window.closeModal = function() {
    document.getElementById('repo-modal').classList.add('hidden');
};