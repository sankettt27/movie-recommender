document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Particles.js background
    particlesJS('particles-js', {
        "particles": {
            "number": { "value": 60, "density": { "enable": true, "value_area": 800 } },
            "color": { "value": ["#ff003c", "#ffffff", "#8a0021"] },
            "shape": { "type": "circle" },
            "opacity": { 
                "value": 0.5, 
                "random": true, 
                "anim": { "enable": true, "speed": 1, "opacity_min": 0.1, "sync": false } 
            },
            "size": { 
                "value": 3, 
                "random": true, 
                "anim": { "enable": true, "speed": 2, "size_min": 0.1, "sync": false } 
            },
            "line_linked": { 
                "enable": true, 
                "distance": 150, 
                "color": "#ff003c", 
                "opacity": 0.2, 
                "width": 1 
            },
            "move": { 
                "enable": true, 
                "speed": 1, 
                "direction": "none", 
                "random": true, 
                "straight": false, 
                "out_mode": "out", 
                "bounce": false 
            }
        },
        "interactivity": {
            "detect_on": "window",
            "events": {
                "onhover": { "enable": true, "mode": "grab" },
                "onclick": { "enable": true, "mode": "push" },
                "resize": true
            },
            "modes": {
                "grab": { "distance": 140, "line_linked": { "opacity": 0.5 } },
                "push": { "particles_nb": 3 }
            }
        },
        "retina_detect": true
    });

    // Elements
    const uploadBox = document.getElementById('upload-box');
    const mainSearchBox = document.getElementById('main-search-box');
    const uploadBtn = document.getElementById('upload-btn');
    const csvUpload = document.getElementById('csv-upload');
    const uploadBtnText = uploadBtn.querySelector('.btn-text');
    const uploadBtnLoader = uploadBtn.querySelector('.btn-loader');
    
    const movieInput = document.getElementById('movie-input');
    const autocompleteList = document.getElementById('autocomplete-list');
    const recommendBtn = document.getElementById('recommend-btn');
    const surpriseBtn = document.getElementById('surprise-btn');
    const btnText = recommendBtn.querySelector('.btn-text');
    const btnLoader = recommendBtn.querySelector('.btn-loader');
    const resultsContainer = document.getElementById('results-container');
    const errorMessage = document.getElementById('error-message');
    const quickChips = document.querySelectorAll('.chip');

    let allMovies = [];

    // Check status
    function checkStatus() {
        fetch('/status')
            .then(res => res.json())
            .then(data => {
                if (data.loaded) {
                    uploadBox.classList.add('hidden');
                    mainSearchBox.classList.remove('hidden');
                    loadMoviesList();
                } else {
                    uploadBox.classList.remove('hidden');
                    mainSearchBox.classList.add('hidden');
                }
            })
            .catch(err => console.error(err));
    }
    
    checkStatus();

    // Upload logic
    uploadBtn.addEventListener('click', () => {
        const file = csvUpload.files[0];
        if (!file) {
            showError("Please select a file first.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        uploadBtnText.classList.add('hidden');
        uploadBtnLoader.classList.remove('hidden');
        uploadBtn.disabled = true;
        hideError();

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            uploadBtnText.classList.remove('hidden');
            uploadBtnLoader.classList.add('hidden');
            uploadBtn.disabled = false;

            if (data.status === 'success') {
                checkStatus();
            } else {
                showError(data.message);
            }
        })
        .catch(err => {
            uploadBtnText.classList.remove('hidden');
            uploadBtnLoader.classList.add('hidden');
            uploadBtn.disabled = false;
            showError("Upload failed.");
            console.error(err);
        });
    });

    function loadMoviesList() {
        fetch('/movies')
            .then(response => response.json())
            .then(data => {
                if (data.movies) {
                    allMovies = data.movies;
                }
            })
            .catch(err => console.error("Failed to load movies:", err));
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');
    }
    
    function hideError() {
        errorMessage.classList.add('hidden');
    }

    // Autocomplete Logic
    movieInput.addEventListener('input', function() {
        const val = this.value;
        autocompleteList.innerHTML = '';
        if (!val) {
            autocompleteList.classList.remove('active');
            return;
        }

        // Find top 10 matches
        const matches = allMovies.filter(m => m.toLowerCase().includes(val.toLowerCase())).slice(0, 10);
        
        if (matches.length > 0) {
            autocompleteList.classList.add('active');
            matches.forEach(match => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                
                // Highlight matching part
                const regex = new RegExp(`(${val})`, "gi");
                item.innerHTML = match.replace(regex, "<strong style='color:#ff003c'>$1</strong>");
                
                item.addEventListener('click', function() {
                    movieInput.value = match;
                    autocompleteList.classList.remove('active');
                });
                
                autocompleteList.appendChild(item);
            });
        } else {
            autocompleteList.classList.remove('active');
        }
    });

    // Close autocomplete when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target !== movieInput && e.target !== autocompleteList) {
            autocompleteList.classList.remove('active');
        }
    });

    // 3D Parallax Hover Effect for Cards
    function setup3DCards() {
        const cards = document.querySelectorAll('.movie-card');
        
        cards.forEach(card => {
            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // Calculate rotation based on cursor position
                const rotateX = ((y - centerY) / centerY) * -10;
                const rotateY = ((x - centerX) / centerX) * 10;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
            });
            
            card.addEventListener('mouseleave', () => {
                // Reset transform
                card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) translateY(0)`;
            });
        });
    }

    // Recommendation Logic
    recommendBtn.addEventListener('click', getRecommendations);
    
    // Surprise Me Logic
    surpriseBtn.addEventListener('click', () => {
        if (allMovies.length === 0) return;
        const randomMovie = allMovies[Math.floor(Math.random() * allMovies.length)];
        movieInput.value = randomMovie;
        getRecommendations();
    });

    // Quick Picks Logic
    quickChips.forEach(chip => {
        chip.addEventListener('click', () => {
            movieInput.value = chip.textContent.trim();
            getRecommendations();
        });
    });

    movieInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            autocompleteList.classList.remove('active');
            getRecommendations();
        }
    });

    function getRecommendations() {
        const movie = movieInput.value.trim();
        if (!movie) return;

        // UI State: Loading
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');
        recommendBtn.disabled = true;
        hideError();
        resultsContainer.classList.add('hidden');
        resultsContainer.innerHTML = '';

        // Fetch recommendations from API
        fetch(`/recommend?movie=${encodeURIComponent(movie)}`)
            .then(res => res.json())
            .then(data => {
                // UI State: Reset Loading
                btnText.classList.remove('hidden');
                btnLoader.classList.add('hidden');
                recommendBtn.disabled = false;

                if (data.error) {
                    showError(data.error);
                } else if (data.recommendations && data.recommendations.length > 0) {
                    resultsContainer.classList.remove('hidden');
                    
                    data.recommendations.forEach((rec, index) => {
                        const card = document.createElement('div');
                        card.className = 'movie-card';
                        // Staggered pop-in animation
                        card.style.animation = `cardPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards ${index * 0.15}s`;
                        
                        card.innerHTML = `
                            <div class="rank-badge">${index + 1}</div>
                            <h3>${rec.title}</h3>
                            <div class="genres">${rec.genres.replace(/ /g, ', ')}</div>
                            <div class="overview">${rec.overview}</div>
                        `;
                        
                        // Add click listener to open IMDb
                        card.addEventListener('click', () => {
                            const imdbUrl = `https://www.imdb.com/find/?q=${encodeURIComponent(rec.title)}`;
                            window.open(imdbUrl, '_blank');
                        });
                        
                        resultsContainer.appendChild(card);
                    });
                    
                    // Attach 3D parallax effect to newly created cards
                    setup3DCards();
                }
            })
            .catch(err => {
                btnText.classList.remove('hidden');
                btnLoader.classList.add('hidden');
                recommendBtn.disabled = false;
                showError("An error occurred while fetching recommendations.");
                console.error(err);
            });
    }
});
