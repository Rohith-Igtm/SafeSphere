document.addEventListener("DOMContentLoaded", function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    loadReviews();
    displayRecentReviews();
    loadUserData();
    updateRatingDisplay();
    
    // Initialize the history with the current section
    const hash = window.location.hash.substring(1);
    const sectionId = hash || 'menuSection';
    showSection(sectionId, false);
    history.replaceState({ section: sectionId }, '', hash ? window.location : window.location + '#menuSection');
}

function setupEventListeners() {
    // Rating selector interaction
    const ratingInput = document.getElementById("ratingInput");
    if (ratingInput) {
        ratingInput.addEventListener("change", updateRatingDisplay);
    }
    
    // Search input - pressing Enter triggers search
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                searchReviews();
            }
        });
    }
    
    // Handle back/forward navigation
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.section) {
            showSection(event.state.section, false);
        } else {
            showSection('menuSection', false);
        }
    });
}

function showSection(sectionId, pushState = true) {
    // Validate section ID
    if (!document.getElementById(sectionId)) {
        sectionId = 'menuSection';
    }
    
    // Hide all sections
    document.querySelectorAll(".container").forEach(section => {
        section.classList.add("hidden");
    });
    
    // Show the requested section
    document.getElementById(sectionId).classList.remove("hidden");
    
    // Update browser history if needed
    if (pushState) {
        history.pushState({ section: sectionId }, '', `#${sectionId}`);
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function updateRatingDisplay() {
    const rating = parseInt(document.getElementById("ratingInput").value);
    const stars = document.querySelectorAll("#ratingDisplay i");
    
    stars.forEach((star, index) => {
        // Remove all rating classes first
        star.classList.remove("rating-1", "rating-2", "rating-3", "rating-4", "rating-5");
        
        if (index < rating) {
            // Add the appropriate rating class
            star.classList.add(`rating-${rating}`);
        }
    });
}

function registerUser() {
    const name = document.getElementById("nameInput").value.trim();
    const email = document.getElementById("emailInput").value.trim();
    const phone = document.getElementById("phoneInput").value.trim();
    
    // Form validation
    if (!name || !email || !phone) {
        showNotification("Please enter all required details.", "error");
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification("Please enter a valid email address.", "error");
        return;
    }
    
    // Save user data
    const userData = { name, email, phone, lastUpdated: new Date().toISOString() };
    localStorage.setItem("user", JSON.stringify(userData));
    
    showNotification("Personal details saved successfully!", "success");
    showSection('menuSection');
}

function loadUserData() {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
        document.getElementById("nameInput").value = userData.name || '';
        document.getElementById("emailInput").value = userData.email || '';
        document.getElementById("phoneInput").value = userData.phone || '';
    }
}

function accessContacts() {
    // Simulate loading contacts - in a real app, this might come from an API
    const contactList = document.getElementById("contactList");
    contactList.innerHTML = '';
    
    // Demo contacts - in a real app, these would come from a database
    const demoContacts = [
        { name: "Emergency Services", phone: "911", email: "emergency@safesphere.com" },
        { name: "Local Police", phone: "555-0123", email: "police@safesphere.com" },
        { name: "Community Watch", phone: "555-0456", email: "watch@safesphere.com" },
        { name: "Safety Hotline", phone: "555-0789", email: "hotline@safesphere.com" }
    ];
    
    // Display contacts
    demoContacts.forEach(contact => {
        const contactElement = document.createElement("div");
        contactElement.className = "contact-item";
        
        // Get initials for avatar
        const initials = contact.name.split(' ').map(word => word[0]).join('').toUpperCase();
        
        contactElement.innerHTML = `
            <div class="contact-avatar">${initials}</div>
            <div class="contact-name">${contact.name}</div>
            <div class="contact-info">${contact.phone}</div>
            <div class="contact-info">${contact.email}</div>
        `;
        
        contactList.appendChild(contactElement);
    });
    
    showNotification("Contacts loaded successfully", "info");
}

function submitReview() {
    const location = document.getElementById("locationInput").value.trim();
    const reviewText = document.getElementById("reviewInput").value.trim();
    const rating = document.getElementById("ratingInput").value;
    
    // Form validation
    if (!location) {
        showNotification("Please enter a location.", "error");
        return;
    }
    
    if (!reviewText) {
        showNotification("Please write a review.", "error");
        return;
    }
    
    // Create review object
    const review = {
        id: generateUniqueId(),
        location,
        reviewText,
        rating,
        date: new Date().toISOString()
    };
    
    // Save review to local storage
    let reviews = JSON.parse(localStorage.getItem("reviews")) || [];
    reviews.push(review);
    localStorage.setItem("reviews", JSON.stringify(reviews));
    
    // Clear form fields
    document.getElementById("locationInput").value = "";
    document.getElementById("reviewInput").value = "";
    document.getElementById("ratingInput").value = "3";
    updateRatingDisplay();
    
    showNotification("Review submitted successfully!", "success");
    showSection('menuSection');
    displayRecentReviews();
}

function loadReviews() {
    // This function only gets the reviews from storage
    return JSON.parse(localStorage.getItem("reviews")) || [];
}

function displayRecentReviews() {
    const recentReviewsList = document.getElementById("recentReviewsList");
    if (!recentReviewsList) return;
    
    const reviews = loadReviews();
    
    if (reviews.length === 0) {
        recentReviewsList.innerHTML = `
            <div class="empty-state">
                <p>No reviews yet. Be the first to share your experience!</p>
                <button onclick="showSection('reviewSection')" class="btn-secondary">
                    <i class="fas fa-pen"></i> Write a Review
                </button>
            </div>
        `;
        return;
    }
    
    // Sort reviews by date (newest first)
    reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Display the 5 most recent reviews
    recentReviewsList.innerHTML = '';
    const recentReviews = reviews.slice(0, 5);
    
    recentReviews.forEach(review => {
        const reviewElement = createReviewElement(review);
        recentReviewsList.appendChild(reviewElement);
    });
}

function searchReviews() {
    const searchTerm = document.getElementById("searchInput").value.trim().toLowerCase();
    const searchResults = document.getElementById("searchResults");
    
    if (!searchTerm) {
        searchResults.innerHTML = `
            <div class="empty-state">
                <p>Enter a location name to search for safety reviews.</p>
            </div>
        `;
        return;
    }
    
    const reviews = loadReviews();
    const matchingReviews = reviews.filter(review => 
        review.location.toLowerCase().includes(searchTerm)
    );
    
    if (matchingReviews.length === 0) {
        searchResults.innerHTML = `
            <div class="empty-state">
                <p>No reviews found for "${searchTerm}".</p>
                <button onclick="showSection('reviewSection')" class="btn-secondary">
                    <i class="fas fa-pen"></i> Write the First Review
                </button>
            </div>
        `;
        return;
    }
    
    // Display matching reviews
    searchResults.innerHTML = `<h3>Found ${matchingReviews.length} reviews for "${searchTerm}"</h3>`;
    
    matchingReviews.forEach(review => {
        const reviewElement = createReviewElement(review);
        searchResults.appendChild(reviewElement);
    });
}

function createReviewElement(review) {
    const reviewElement = document.createElement("div");
    reviewElement.className = "review";
    
    // Format date
    const formattedDate = formatDate(review.date);
    
    // Create safety rating display using the actual rating value
    const ratingValue = parseInt(review.rating);
    let ratingStars = '';
    
    // Create shields with appropriate rating classes
    for (let i = 1; i <= 5; i++) {
        if (i <= ratingValue) {
            ratingStars += `<i class="fas fa-shield-alt rating-${ratingValue}"></i>`;
        } else {
            ratingStars += '<i class="fas fa-shield-alt"></i>';
        }
    }
    
    reviewElement.innerHTML = `
        <div class="review-header">
            <div class="review-location">${review.location}</div>
            <div class="review-rating">${ratingStars}</div>
        </div>
        <div class="review-date">${formattedDate}</div>
        <div class="review-text">${review.reviewText}</div>
    `;
    
    return reviewElement;
}

// Utility functions
function showNotification(message, type = 'info') {
    // Simple alert for now - could be enhanced with a custom notification system
    alert(message);
}

function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}
