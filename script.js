// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyChMhyseh9zwPtFnh2fZIvC1zoGR9xkRnw",
    authDomain: "safesphere-29656.firebaseapp.com",
    databaseURL: "https://safesphere-29656-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "safesphere-29656",
    storageBucket: "safesphere-29656.appspot.com",
    messagingSenderId: "865787650719",
    appId: "1:865787650719:web:71da4fec011b9408edb8aa"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

document.addEventListener("DOMContentLoaded", function() {
    initializeApp();
    setupEventListeners();
    loadReviews();
});

// ================= CORE APPLICATION SETUP =================
let currentUser = null;
window.isMobileDevice = /Mobi|Android/i.test(navigator.userAgent);

function initializeApp() {
    setOptimalViewport();
    setupInitialState();
    loadUserData();
    updateRatingDisplay();
    
    const hash = window.location.hash.substring(1);
    const sectionId = hash || 'menuSection';
    showSection(sectionId, false);
    history.replaceState({ section: sectionId }, '', hash ? window.location : window.location + '#menuSection');

    if (window.isMobileDevice) setupMobileMenu();
}

function setOptimalViewport() {
    const viewportMeta = document.querySelector('meta[name="viewport"]') || document.createElement('meta');
    viewportMeta.name = 'viewport';
    viewportMeta.content = window.isMobileDevice ? 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0' :
        'width=device-width, initial-scale=1.0';
    document.head.appendChild(viewportMeta);
}

function setupInitialState() {
    // Add any additional initial setup needed
    const searchSection = document.getElementById('searchSection');
    if (searchSection && !document.getElementById('searchButton')) {
        const searchForm = document.querySelector('#searchSection .form-group') || document.createElement('div');
        const searchButtonContainer = document.createElement('div');
        searchButtonContainer.className = 'form-group search-button-container';
        searchButtonContainer.innerHTML = `
            <button id="searchButton" class="btn-primary">Search</button>
        `;
        searchForm.parentNode.insertBefore(searchButtonContainer, searchForm.nextSibling);
    }
}

function setupEventListeners() {
    window.addEventListener('resize', handleResize);
    window.addEventListener('popstate', handlePopState);

    // Rating Input
    const ratingInput = document.getElementById("ratingInput");
    if (ratingInput) {
        ratingInput.addEventListener("change", updateRatingDisplay);
        setupRatingSystem();
    }

    // Search Input and Button
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                searchReviews();
            }
        });
    }

    const searchButton = document.getElementById("searchButton");
    if (searchButton) {
        searchButton.addEventListener("click", searchReviews);
    }

    // Mobile Touch Events
    document.querySelectorAll('button, .btn-primary, .btn-secondary').forEach(button => {
        button.addEventListener('touchstart', function() {
            this.classList.add('touch-active');
        });
        button.addEventListener('touchend', function() {
            this.classList.remove('touch-active');
        });
    });
}

// ================= FIREBASE OPERATIONS =================
function registerUser() {
    const userData = {
        name: document.getElementById("nameInput").value.trim(),
        email: document.getElementById("emailInput").value.trim(),
        phone: document.getElementById("phoneInput").value.trim(),
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    if (!validateUser(userData)) return;

    db.ref('users').push(userData)
        .then(() => {
            showNotification("Profile saved successfully!", "success");
            showSection('menuSection');
        })
        .catch(error => handleError(error, "registration"));
}

function submitReview() {
    const reviewData = {
        location: document.getElementById("locationInput").value.trim(),
        review: document.getElementById("reviewInput").value.trim(),
        rating: document.getElementById("ratingInput").value,
        userName: currentUser?.name || "Anonymous",
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    if (!validateReview(reviewData)) return;

    db.ref('reviews').push(reviewData)
        .then(() => {
            showNotification("Review submitted successfully!", "success");
            resetReviewForm();
            showSection('menuSection');
            loadReviews();
        })
        .catch(error => handleError(error, "review submission"));
}

function loadReviews() {
    db.ref('reviews').limitToLast(5).on('value', snapshot => {
        const reviews = [];
        snapshot.forEach(child => reviews.push({ id: child.key, ...child.val() }));
        displayRecentReviews(reviews.reverse());
    });
}

function searchReviews() {
    const query = document.getElementById("searchInput").value.trim().toLowerCase();
    const resultsContainer = document.getElementById("searchResults");
    
    if (!query) {
        resultsContainer.innerHTML = `<div class="empty-state">Enter a location to search</div>`;
        return;
    }

    // Show loading state
    resultsContainer.innerHTML = `<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Searching...</div>`;

    db.ref('reviews').orderByChild('location')
        .startAt(query)
        .endAt(query + '\uf8ff')
        .once('value', snapshot => {
            const results = [];
            snapshot.forEach(child => results.push({ id: child.key, ...child.val() }));
            displaySearchResults(results);
        });
}

// ================= UI FUNCTIONS =================
function showSection(sectionId, pushState = true) {
    document.querySelectorAll(".container").forEach(section => section.classList.add("hidden"));
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove("hidden");
        if (pushState) history.pushState({ section: sectionId }, '', `#${sectionId}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (window.isMobileDevice) closeMobileMenu();
    adjustForCurrentDevice();
}

function handlePopState(event) {
    if (event.state && event.state.section) {
        showSection(event.state.section, false);
    }
}

function updateRatingDisplay() {
    const rating = parseInt(document.getElementById("ratingInput").value);
    const stars = document.querySelectorAll("#ratingDisplay i");
    
    stars.forEach((star, index) => {
        // Remove all existing rating classes
        star.className = "fas fa-star";
        
        // Add color class based on rating
        if (index < rating) {
            star.classList.add(`rating-${rating}`);
        } else {
            star.classList.add('rating-inactive');
        }
    });
}

function setupRatingSystem() {
    // Make sure we have the rating display container
    const ratingDisplay = document.getElementById("ratingDisplay");
    if (!ratingDisplay) return;
    
    // Clear existing stars if any
    ratingDisplay.innerHTML = '';
    
    // Create 5 stars
    for (let i = 0; i < 5; i++) {
        const star = document.createElement('i');
        star.className = 'fas fa-star rating-inactive';
        star.dataset.value = i + 1;
        ratingDisplay.appendChild(star);
    }
    
    // Add event listeners to each star
    document.querySelectorAll('#ratingDisplay i').forEach(star => {
        star.addEventListener('click', () => {
            document.getElementById("ratingInput").value = star.dataset.value;
            updateRatingDisplay();
        });
        
        // Add hover effect
        star.addEventListener('mouseenter', () => {
            const value = parseInt(star.dataset.value);
            document.querySelectorAll('#ratingDisplay i').forEach((s, index) => {
                s.classList.toggle('rating-hover', index < value);
            });
        });
        
        // Remove hover effect
        star.addEventListener('mouseleave', () => {
            document.querySelectorAll('#ratingDisplay i').forEach(s => {
                s.classList.remove('rating-hover');
            });
        });
    });
    
    // Initial update
    updateRatingDisplay();
}

function setupMobileMenu() {
    if (!document.querySelector('.mobile-menu-button')) {
        const menuButton = document.createElement('button');
        menuButton.className = 'mobile-menu-button';
        menuButton.innerHTML = '<i class="fas fa-bars"></i>';
        
        const mobileMenu = document.createElement('div');
        mobileMenu.id = 'mobileMenu';
        mobileMenu.className = 'mobile-menu hidden';
        mobileMenu.innerHTML = `
            <div class="mobile-menu-header">
                <h2>SafeSphere</h2>
                <button id="mobileMenuClose"><i class="fas fa-times"></i></button>
            </div>
            <div class="mobile-menu-items">
                <div onclick="showSection('menuSection')">Home</div>
                <div onclick="showSection('reviewSection')">Write Review</div>
                <div onclick="showSection('searchSection')">Search</div>
                <div onclick="showSection('contactsSection')">Contacts</div>
            </div>
        `;

        document.body.append(menuButton, mobileMenu);
        menuButton.addEventListener('click', toggleMobileMenu);
        document.getElementById('mobileMenuClose').addEventListener('click', closeMobileMenu);
    }
}

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.toggle('hidden');
    document.body.classList.toggle('mobile-menu-open');
}

function closeMobileMenu() {
    document.getElementById('mobileMenu').classList.add('hidden');
    document.body.classList.remove('mobile-menu-open');
}

// ================= HELPER FUNCTIONS =================
function validateUser(user) {
    if (!user.name || !user.email || !user.phone) {
        showNotification("Please fill all required fields", "error");
        return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
        showNotification("Invalid email format", "error");
        return false;
    }
    return true;
}

function validateReview(review) {
    if (!review.location || !review.review) {
        showNotification("Please fill all review fields", "error");
        return false;
    }
    return true;
}

function displayRecentReviews(reviews) {
    const container = document.getElementById("recentReviewsList");
    if (!container) return;
    
    container.innerHTML = reviews.length > 0 ? reviews.map(review => `
        <div class="review">
            <div class="review-header">
                <div class="review-location">${review.location}</div>
                <div class="review-rating">
                    ${getRatingStars(review.rating)}
                </div>
            </div>
            <div class="review-content">
                <p class="review-text">${review.review}</p>
                <div class="review-meta">
                    <span class="review-author">${review.userName}</span>
                    <span class="review-date">${new Date(review.timestamp).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    `).join('') : `<div class="empty-state">No reviews yet. Be the first to write one!</div>`;
}

function getRatingStars(rating) {
    const ratingValue = parseInt(rating) || 0;
    let stars = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < ratingValue) {
            stars += `<i class="fas fa-star rating-${ratingValue}"></i>`;
        } else {
            stars += `<i class="fas fa-star rating-inactive"></i>`;
        }
    }
    
    return stars;
}

function displaySearchResults(results) {
    const container = document.getElementById("searchResults");
    if (!container) return;
    
    container.innerHTML = results.length > 0 ? 
        `<div class="search-results-count">${results.length} result${results.length > 1 ? 's' : ''} found</div>
        <div class="search-results-grid">
            ${results.map(review => `
                <div class="result-card">
                    <h4>${review.location}</h4>
                    <div class="rating">${getRatingStars(review.rating)}</div>
                    <p>${review.review}</p>
                    <div class="review-meta">
                        <span>By ${review.userName}</span>
                        <span>${new Date(review.timestamp).toLocaleDateString()}</span>
                    </div>
                </div>
            `).join('')}
        </div>` :
        `<div class="empty-state">No results found for your search</div>`;
}

function handleResize() {
    window.isMobileDevice = window.innerWidth < 768;
    
    if (window.isMobileDevice) {
        setupMobileMenu();
    } else if (document.querySelector('.mobile-menu-button')) {
        // Only remove if we need to
        document.querySelector('.mobile-menu-button').remove();
        document.getElementById('mobileMenu')?.remove();
    }
    
    adjustForCurrentDevice();
}

function adjustForCurrentDevice() {
    document.body.classList.toggle('mobile-view', window.isMobileDevice);
    document.body.classList.toggle('desktop-view', !window.isMobileDevice);
    
    document.querySelectorAll('.review').forEach(review => 
        review.classList.toggle('mobile-review', window.isMobileDevice)
    );
    
    // Adjust search results display
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        const resultsGrid = searchResults.querySelector('.search-results-grid');
        if (resultsGrid) {
            resultsGrid.classList.toggle('mobile-grid', window.isMobileDevice);
        }
    }
}

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), timeout);
    };
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    // Add animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove notification after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300); // Wait for fade out animation
    }, 3000);
}

function handleError(error, context) {
    console.error(`${context} error:`, error);
    showNotification(`Error during ${context}: ${error.message}`, "error");
}

function resetReviewForm() {
    document.getElementById("locationInput").value = "";
    document.getElementById("reviewInput").value = "";
    document.getElementById("ratingInput").value = "3";
    updateRatingDisplay();
}

function loadUserData() {
    // Fetch user data if available (assuming user authentication is implemented)
    // For now, just check if we have user data stored in local storage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
        } catch (e) {
            console.error('Error parsing stored user data', e);
            localStorage.removeItem('currentUser');
        }
    }
}
