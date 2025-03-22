document.addEventListener("DOMContentLoaded", function ()
{
    loadReviews();
});

function showSection(sectionId) {
    document.querySelectorAll(".container").forEach(section => {
        section.classList.add("hidden");
    });
    document.getElementById(sectionId).classList.remove("hidden");
}

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
}

function accessContacts() {
    if (navigator.contacts && navigator.contacts.select) {
        navigator.contacts.select(["name", "tel"], { multiple: true }).then(contacts => {
            displayContacts(contacts);
        }).catch(error => {
            alert("Access to contacts denied");
            console.error(error);
        });
    } else {
        alert("Contacts API not supported on this device.");
    }
}

function displayContacts(contacts) {
    const contactList = document.getElementById("contactList");
    contactList.innerHTML = "";
    
    contacts.forEach(contact => {
        const contactItem = document.createElement("div");
        contactItem.classList.add("contact-item");
        contactItem.textContent = `${contact.name[0]} - ${contact.tel[0]}`;
        contactItem.addEventListener("click", () => saveFavoriteContact(contact));
        contactList.appendChild(contactItem);
    });
}

function saveFavoriteContact(contact) {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    favorites.push(contact);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    alert("Contact saved as favorite!");
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
    document.getElementById("locationInput").value = "";
    document.getElementById("reviewInput").value = "";
    document.getElementById("ratingInput").value = "1";
    
    loadReviews();
}

function searchReviews() {
    const query = document.getElementById("searchInput").value.trim().toLowerCase();
    const reviews = JSON.parse(localStorage.getItem("reviews")) || [];
    const resultsContainer = document.getElementById("searchResults");
    resultsContainer.innerHTML = "";
    
    const filteredReviews = reviews.filter(review => review.location.toLowerCase().includes(query));
    
    if (filteredReviews.length === 0) {
        resultsContainer.innerHTML = "<p>No reviews found for this location.</p>";
        return;
    }
    
    filteredReviews.forEach(review => {
        const reviewElement = document.createElement("div");
        reviewElement.classList.add("review");
        reviewElement.innerHTML = `<strong>${review.location}</strong> - ${review.date}<br>
            Rating: ${review.rating} ⭐<br>
            ${review.reviewText}`;
        resultsContainer.appendChild(reviewElement);
    });
}

function loadReviews() {
    const reviews = JSON.parse(localStorage.getItem("reviews")) || [];
    const resultsContainer = document.getElementById("searchResults");
    resultsContainer.innerHTML = "";
    
    reviews.forEach(review => {
        const reviewElement = document.createElement("div");
        reviewElement.classList.add("review");
        reviewElement.innerHTML = `<strong>${review.location}</strong> - ${review.date}<br>
            Rating: ${review.rating} ⭐<br>
            ${review.reviewText}`;
        resultsContainer.appendChild(reviewElement);
    });
}
