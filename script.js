document.addEventListener("DOMContentLoaded", function() {
    // Check device type once on load
    window.isMobileDevice = window.innerWidth < 768;
    
    // Set viewport meta tag dynamically for better mobile experience
    setOptimalViewport();
    
    initializeApp();
    setupEventListeners();
});

// Function to set the optimal viewport settings based on device
function setOptimalViewport() {
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        document.head.appendChild(viewportMeta);
    }
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';
}

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
    
    // Check if we need to show the mobile menu
    if (window.isMobileDevice) {
        setupMobileMenu();
    }
}

function setupEventListeners() {
    // Add resize listener to adjust the UI when orientation changes
    window.addEventListener('resize', handleResize);
    
    // Rating selector interaction with improved touch support
    const ratingInput = document.getElementById("ratingInput");
    if (ratingInput) {
        ratingInput.addEventListener("change", updateRatingDisplay);
        
        // Add touch-friendly rating selection
        setupTouchRating();
    }
    
    // Search input - pressing Enter triggers search
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                searchReviews();
                // Hide mobile keyboard after search on mobile
                if (window.isMobileDevice) {
                    searchInput.blur();
                }
            }
        });
        
        // Add search button for mobile users
        if (window.isMobileDevice && document.getElementById('searchContainer')) {
            const searchButton = document.createElement('button');
            searchButton.className = 'btn-search';
            searchButton.innerHTML = '<i class="fas fa-search"></i>';
            searchButton.addEventListener('click', searchReviews);
            document.getElementById('searchContainer').appendChild(searchButton);
        }
    }
    
    // Handle back/forward navigation
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.section) {
            showSection(event.state.section, false);
        } else {
            showSection('menuSection', false);
        }
    });
    
    // Add touchstart listeners for better mobile responsiveness
    document.querySelectorAll('button, .btn-primary, .btn-secondary').forEach(button => {
        button.addEventListener('touchstart', function() {
            this.classList.add('touch-active');
        });
        button.addEventListener('touchend', function() {
            this.classList.remove('touch-active');
        });
    });
}

// Handle resize and orientation changes
function handleResize() {
    const wasMobile = window.isMobileDevice;
    window.isMobileDevice = window.innerWidth < 768;
    
    // If device type changed (e.g., rotation from portrait to landscape)
    if (wasMobile !== window.isMobileDevice) {
        // Rebuild UI components that differ between mobile and desktop
        if (window.isMobileDevice) {
            setupMobileMenu();
        } else {
            // Return to desktop layout
            const mobileMenu = document.getElementById('mobileMenu');
            if (mobileMenu) {
                mobileMenu.remove();
            }
            document.body.classList.remove('mobile-menu-open');
        }
    }
    
    // Adjust content based on new size
    adjustForCurrentDevice();
}

// Set up mobile-specific menu
function setupMobileMenu() {
    // Only create if it doesn't exist
    if (!document.getElementById('mobileMenu')) {
        const menuButton = document.createElement('button');
        menuButton.id = 'mobileMenuButton';
        menuButton.className = 'mobile-menu-button';
        menuButton.innerHTML = '<i class="fas fa-bars"></i>';
        
        const mobileMenu = document.createElement('div');
        mobileMenu.id = 'mobileMenu';
        mobileMenu.className = 'mobile-menu hidden';
        
        // Create menu items based on main sections
        mobileMenu.innerHTML = `
            <div class="mobile-menu-header">
                <h2>SafeSphere</h2>
                <button id="mobileMenuClose"><i class="fas fa-times"></i></button>
            </div>
            <div class="mobile-menu-items">
                <div onclick="showSection('menuSection'); closeMobileMenu();">Home</div>
                <div onclick="showSection('reviewSection'); closeMobileMenu();">Write Review</div>
                <div onclick="showSection('searchSection'); closeMobileMenu();">Search</div>
                <div onclick="showSection('contactsSection'); closeMobileMenu();">Emergency Contacts</div>
                <div onclick="showSection('profileSection'); closeMobileMenu();">My Profile</div>
            </div>
        `;
        
        document.body.appendChild(menuButton);
        document.body.appendChild(mobileMenu);
        
        // Add event listeners
        menuButton.addEventListener('click', toggleMobileMenu);
        document.getElementById('mobileMenuClose').addEventListener('click', closeMobileMenu);
    }
}

// Toggle mobile menu visibility
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.remove('hidden');
        document.body.classList.add('mobile-menu-open');
    } else {
        closeMobileMenu();
    }
}

// Close mobile menu
function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.add('hidden');
    document.body.classList.remove('mobile-menu-open');
}

// Adjust UI elements for current device
function adjustForCurrentDevice() {
    // Adjust review display for mobile
    const reviews = document.querySelectorAll('.review');
    reviews.forEach(review => {
        if (window.isMobileDevice) {
            review.classList.add('mobile-review');
        } else {
            review.classList.remove('mobile-review');
        }
    });
    
    // Adjust form elements for better mobile input
    if (window.isMobileDevice) {
        // Increase input tap targets
        document.querySelectorAll('input, textarea, select').forEach(input => {
            input.classList.add('mobile-input');
        });
    } else {
        document.querySelectorAll('input, textarea, select').forEach(input => {
            input.classList.remove('mobile-input');
        });
    }
}

// Setup touch-friendly rating selection
function setupTouchRating() {
    const ratingContainer = document.getElementById('ratingDisplay');
    if (!ratingContainer) return;
    
    const stars = ratingContainer.querySelectorAll('i');
    stars.forEach((star, index) => {
        star.addEventListener('click', function() {
            // Set the rating input value
            document.getElementById('ratingInput').value = index + 1;
            updateRatingDisplay();
        });
        
        // Add touch feedback
        star.addEventListener('touchstart', function(e) {
            e.preventDefault(); // Prevent double-tap zoom
            this.classList.add('touch-active');
        });
        
        star.addEventListener('touchend', function(e) {
            e.preventDefault();
            this.classList.remove('touch-active');
            // Set the rating input value
            document.getElementById('ratingInput').value = index + 1;
            updateRatingDisplay();
        });
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
    
    // Close mobile menu if open
    if (document.getElementById('mobileMenu') && !document.getElementById('mobileMenu').classList.contains('hidden')) {
        closeMobileMenu();
    }
    
    // Scroll to top - with smooth scrolling on mobile
    if (window.isMobileDevice) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        window.scrollTo(0, 0);
    }
    
    // Adjust UI elements for current view
    adjustForCurrentDevice();
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
    
    // Hide virtual keyboard on mobile
    if (window.isMobileDevice) {
        document.activeElement.blur();
    }
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
        
        // Add click-to-call on mobile devices
        const phoneDisplay = window.isMobileDevice ? 
            `<a href="tel:${contact.phone}" class="contact-phone">${contact.phone}</a>` : 
            `<div class="contact-info">${contact.phone}</div>`;
            
        // Add click-to-email on mobile devices
        const emailDisplay = window.isMobileDevice ? 
            `<a href="mailto:${contact.email}" class="contact-email">${contact.email}</a>` : 
            `<div class="contact-info">${contact.email}</div>`;
        
        contactElement.innerHTML = `
            <div class="contact-avatar">${initials}</div>
            <div class="contact-name">${contact.name}</div>
            ${phoneDisplay}
            ${emailDisplay}
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
    
    // Hide virtual keyboard on mobile
    if (window.isMobileDevice) {
        document.activeElement.blur();
    }
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
    
    // Determine how many reviews to show based on device
    const displayCount = window.isMobileDevice ? 3 : 5;
    
    // Display the most recent reviews
    recentReviewsList.innerHTML = '';
    const recentReviews = reviews.slice(0, displayCount);
    
    recentReviews.forEach(review => {
        const reviewElement = createReviewElement(review);
        recentReviewsList.appendChild(reviewElement);
    });
    
    // Add "View More" button on mobile if there are more reviews
    if (window.isMobileDevice && reviews.length > displayCount) {
        const viewMoreBtn = document.createElement('button');
        viewMoreBtn.className = 'btn-secondary view-more-btn';
        viewMoreBtn.innerHTML = 'View More Reviews';
        viewMoreBtn.addEventListener('click', function() {
            showSection('searchSection');
            // Auto-populate search with empty string to show all reviews
            document.getElementById('searchInput').value = '';
            searchReviews();
        });
        recentReviewsList.appendChild(viewMoreBtn);
    }
}

function searchReviews() {
    const searchTerm = document.getElementById("searchInput").value.trim().toLowerCase();
    const searchResults = document.getElementById("searchResults");
    
    if (!searchTerm) {
        // On mobile, empty search shows all reviews instead of empty state
        if (window.isMobileDevice) {
            searchResults.innerHTML = `<h3>All Reviews</h3>`;
            const reviews = loadReviews();
            
            if (reviews.length === 0) {
                searchResults.innerHTML = `
                    <div class="empty-state">
                        <p>No reviews yet. Be the first to share your experience!</p>
                        <button onclick="showSection('reviewSection')" class="btn-secondary">
                            <i class="fas fa-pen"></i> Write a Review
                        </button>
                    </div>
                `;
            } else {
                // Sort reviews by date (newest first)
                reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                reviews.forEach(review => {
                    const reviewElement = createReviewElement(review);
                    searchResults.appendChild(reviewElement);
                });
            }
            return;
        } else {
            searchResults.innerHTML = `
                <div class="empty-state">
                    <p>Enter a location name to search for safety reviews.</p>
                </div>
            `;
            return;
        }
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
    reviewElement.className = window.isMobileDevice ? "review mobile-review" : "review";
    
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
    
    // Determine if we should truncate review text on mobile
    let reviewText = review.reviewText;
    if (window.isMobileDevice && reviewText.length > 100) {
        const truncatedText = reviewText.substring(0, 100) + '...';
        reviewText = `
            <div class="review-text-truncated">${truncatedText}</div>
            <div class="review-text-full hidden">${reviewText}</div>
            <button class="read-more-btn">Read More</button>
        `;
    } else {
        reviewText = `<div class="review-text">${reviewText}</div>`;
    }
    
    reviewElement.innerHTML = `
        <div class="review-header">
            <div class="review-location">${review.location}</div>
            <div class="review-rating">${ratingStars}</div>
        </div>
        <div class="review-date">${formattedDate}</div>
        ${reviewText}
    `;
    
    // Add read more functionality for mobile
    if (window.isMobileDevice && review.reviewText.length > 100) {
        setTimeout(() => {
            const readMoreBtn = reviewElement.querySelector('.read-more-btn');
            if (readMoreBtn) {
                readMoreBtn.addEventListener('click', function() {
                    const truncated = reviewElement.querySelector('.review-text-truncated');
                    const full = reviewElement.querySelector('.review-text-full');
                    
                    if (truncated.classList.contains('hidden')) {
                        truncated.classList.remove('hidden');
                        full.classList.add('hidden');
                        this.textContent = 'Read More';
                    } else {
                        truncated.classList.add('hidden');
                        full.classList.remove('hidden');
                        this.textContent = 'Read Less';
                    }
                });
            }
        }, 0);
    }
    
    return reviewElement;
}

// Enhanced notification system for mobile
function showNotification(message, type = 'info') {
    if (window.isMobileDevice) {
        // Create a custom mobile-friendly notification
        const notification = document.createElement('div');
        notification.className = `mobile-notification ${type}`;
        
        // Add appropriate icon based on notification type
        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-exclamation-circle';
        
        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Slide in animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300); // Wait for fade out animation
        }, 3000);
    } else {
        // Use simple alert for desktop
        alert(message);
    }
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
