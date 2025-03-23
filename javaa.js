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
let favoriteContacts = [];
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
    
    // Load favorite contacts if any
    loadFavoriteContacts();
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
        favoriteContacts: favoriteContacts,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    if (!validateUser(userData)) return;

    db.ref('users').push(userData)
        .then(() => {
            // Store user data locally
            currentUser = {
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                favoriteContacts: favoriteContacts
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
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

// ================= CONTACTS FUNCTIONALITY =================
function accessContacts() {
    // Check if the Contacts API is available (mobile browsers)
    if (navigator.contacts && navigator.contacts.select) {
        // Show loading state
        showNotification("Requesting access to contacts...", "info");
        
        // Properties to retrieve 
        const props = ['name', 'tel', 'email'];
        
        // Request contacts
        navigator.contacts.select(props, {multiple: true})
            .then(contacts => {
                if (contacts.length > 0) {
                    displayContacts(contacts);
                    showNotification(`${contacts.length} contacts loaded`, "success");
                } else {
                    showNotification("No contacts selected", "info");
                }
            })
            .catch(err => {
                console.error('Error accessing contacts:', err);
                if (err.name === 'NotAllowedError') {
                    showNotification("Permission denied. Please allow contact access.", "error");
                } else if (err.name === 'TypeError') {
                    showNotification("Contact selection was canceled", "info");
                } else {
                    showNotification("Error accessing contacts", "error");
                    // Fallback for devices without contact API support
                    showMockContacts();
                }
            });
    } else {
        console.log('Contacts API not supported');
        showNotification("Contacts API not supported on this device", "info");
        // Fallback for browsers without contact API support
        showMockContacts();
    }
}

function displayContacts(contacts) {
    const contactList = document.getElementById('contactList');
    const favoriteContactsList = document.getElementById('favoriteContactsList');
    const favoriteContactsDisplay = document.getElementById('favoriteContactsDisplay');
    
    // Determine where to display based on which section is visible
    const isContactsSection = !document.getElementById('contactsSection').classList.contains('hidden');
    const isProfileSection = !document.getElementById('profileSection').classList.contains('hidden');
    
    // Create HTML for contacts
    const html = contacts.map(contact => {
        const name = contact.name && contact.name.length ? contact.name[0] : 'Unknown';
        const phone = contact.tel && contact.tel.length ? contact.tel[0] : 'No phone';
        const contactId = `contact-${name.replace(/[^a-z0-9]/gi, '')}-${phone.replace(/[^0-9]/g, '')}`;
        const isFavorite = favoriteContacts.some(fc => fc.name === name && fc.phone === phone);
        
        return `
            <div class="contact-item ${isFavorite ? 'favorite' : ''}" id="${contactId}">
                <div class="contact-info">
                    <div class="contact-name">${name}</div>
                    <div class="contact-phone">${phone}</div>
                </div>
                <button onclick="toggleFavoriteContact('${name}', '${phone}')" class="btn-favorite">
                    <i class="fas ${isFavorite ? 'fa-heart' : 'fa-heart-o'}"></i>
                </button>
            </div>
        `;
    }).join('');
    
    // Display in the appropriate section
    if (isContactsSection && contactList) {
        contactList.innerHTML = html;
        updateFavoriteContactsDisplay(favoriteContactsDisplay);
    } else if (isProfileSection && favoriteContactsList) {
        // In profile section, only show favorites
        updateFavoriteContactsDisplay(favoriteContactsList);
    }
}

function toggleFavoriteContact(name, phone) {
    // Check if contact is already a favorite
    const existingIndex = favoriteContacts.findIndex(c => c.name === name && c.phone === phone);
    
    if (existingIndex >= 0) {
        // Remove from favorites
        favoriteContacts.splice(existingIndex, 1);
        showNotification(`Removed ${name} from favorites`, "info");
    } else {
        // Add to favorites
        favoriteContacts.push({ name, phone });
        showNotification(`Added ${name} to favorites`, "success");
    }
    
    // Save favorites to localStorage
    localStorage.setItem('favoriteContacts', JSON.stringify(favoriteContacts));
    
    // Update UI
    const contactItem = document.getElementById(`contact-${name.replace(/[^a-z0-9]/gi, '')}-${phone.replace(/[^0-9]/g, '')}`);
    if (contactItem) {
        contactItem.classList.toggle('favorite');
        const heartIcon = contactItem.querySelector('.btn-favorite i');
        if (heartIcon) {
            heartIcon.classList.toggle('fa-heart');
            heartIcon.classList.toggle('fa-heart-o');
        }
    }
    
    // Update favorite displays
    updateFavoriteContactsDisplay(document.getElementById('favoriteContactsDisplay'));
    updateFavoriteContactsDisplay(document.getElementById('favoriteContactsList'));
}

function updateFavoriteContactsDisplay(container) {
    if (!container) return;
    
    if (favoriteContacts.length === 0) {
        container.innerHTML = '<div class="empty-state">No favorite contacts yet</div>';
        return;
    }
    
    container.innerHTML = favoriteContacts.map(contact => `
        <div class="contact-item favorite">
            <div class="contact-info">
                <div class="contact-name">${contact.name}</div>
                <div class="contact-phone">${contact.phone}</div>
            </div>
            <button onclick="toggleFavoriteContact('${contact.name}', '${contact.phone}')" class="btn-favorite">
                <i class="fas fa-heart"></i>
            </button>
        </div>
    `).join('');
}

function loadFavoriteContacts() {
    const storedFavorites = localStorage.getItem('favoriteContacts');
    if (storedFavorites) {
        try {
            favoriteContacts = JSON.parse(storedFavorites);
            // Update displays
            updateFavoriteContactsDisplay(document.getElementById('favoriteContactsDisplay'));
            updateFavoriteContactsDisplay(document.getElementById('favoriteContactsList'));
        } catch (e) {
            console.error('Error parsing stored favorites', e);
            localStorage.removeItem('favoriteContacts');
        }
    }
}

// Mock contacts for testing on devices/browsers without Contacts API
function showMockContacts() {
    const mockContacts = [
        { name: ['John Doe'], tel: ['+1 (555) 123-4567'], email: ['john@example.com'] },
        { name: ['Jane Smith'], tel: ['+1 (555) 987-6543'], email: ['jane@example.com'] },
        { name: ['Sam Wilson'], tel: ['+1 (555) 234-5678'], email: ['sam@example.com'] },
        { name: ['Lisa Johnson'], tel: ['+1 (555) 345-6789'], email: ['lisa@example.com'] },
        { name: ['Emergency Services'], tel: ['911'], email: [''] }
    ];
    
    displayContacts(mockContacts);
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
        timer = setTimeout(() => func.
