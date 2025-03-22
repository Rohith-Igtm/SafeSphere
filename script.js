document.addEventListener("DOMContentLoaded", function () {
    loadReviews();
    // Initialize the history with the menu section
    history.replaceState({ section: 'menuSection' }, '', window.location);
});

function showSection(sectionId, pushState = true) {
    document.querySelectorAll(".container").forEach(section => {
        section.classList.add("hidden");
    });

    document.getElementById(sectionId).classList.remove("hidden");

    if (pushState) {
        history.pushState({ section: sectionId }, '', `#${sectionId}`);
    }
}

function showSection(sectionId, pushState = true) {
    document.querySelectorAll(".container").forEach(section => {
        section.classList.add("hidden");
    });

    document.getElementById(sectionId).classList.remove("hidden");

    if (pushState) {
        history.pushState({ section: sectionId }, '', `#${sectionId}`);
    }
}


// Handle back/forward navigation
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.section) {
        showSection(event.state.section, false); // Don't push a new state when navigating back
    } else {
        showSection('menuSection', false); // Default to menu if no state is found
    }
});


function registerUser() {
    const name = document.getElementById("nameInput").value.trim();
    const email = document.getElementById("emailInput").value.trim();
    const phone = document.getElementById("phoneInput").value.trim();
    
    if (!name || !email || !phone) {
        alert("Please enter all details.");
        return;
    }
    
    localStorage.setItem("user", JSON.stringify({ name, email, phone }));
    alert("Personal details saved!");
    showSection('menuSection'); // Return to menu after saving
}

function submitReview() {
    const location = document.getElementById("locationInput").value.trim();
    const reviewText = document.getElementById("reviewInput").value.trim();
    const rating = document.getElementById("ratingInput").value;
    
    if (!location || !reviewText) {
        alert("Please enter a location and a review.");
        return;
    }
    
    const review = { location, reviewText, rating, date: new Date().toLocaleString() };
    
    let reviews = JSON.parse(localStorage.getItem("reviews")) || [];
    reviews.push(review);
    localStorage.setItem("reviews", JSON.stringify(reviews));
    
    alert("Review submitted successfully!");
    // Clear form fields
    document.getElementById("locationInput").value = "";
    document.getElementById("reviewInput").value = "";
    document.getElementById("ratingInput").value = "1";
    // Return to menu after submission
    showSection('menuSection');
    loadReviews();
}
