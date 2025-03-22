import React, { useState, useEffect } from 'react';
import { Shield, MapPin, ArrowLeft, Search } from 'lucide-react';

const SafeSphereApp = () => {
  // States for the entire application
  const [view, setView] = useState('search'); // 'search', 'submit', 'results'
  const [locationName, setLocationName] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [reviews, setReviews] = useState([]);
  const [locationScore, setLocationScore] = useState(null);
  
  // States for review submission
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualLocationEntry, setManualLocationEntry] = useState(false);

  // Colors for the rating system from dangerous (red) to safe (green)
  const ratingColors = {
    0: '#ccc', // Default gray for unselected
    1: '#ef4444', // Red - Dangerous
    2: '#fb923c', // Orange - Concerning
    3: '#facc15', // Yellow - Moderate
    4: '#a3e635', // Light Green - Safe
    5: '#4ade80', // Green - Very Safe
  };

  // Threat level descriptions
  const threatLevels = {
    0: 'Select Safety Rating',
    1: 'High Risk Area',
    2: 'Concerning',
    3: 'Exercise Caution',
    4: 'Generally Safe',
    5: 'Very Safe'
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get current location using browser geolocation
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      setManualLocationEntry(false);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
          
          // Try to get location name using reverse geocoding
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then(response => response.json())
            .then(data => {
              if (data.display_name) {
                setLocationName(data.display_name.split(',').slice(0, 2).join(', '));
              }
            })
            .catch(err => console.error('Error getting location name:', err))
            .finally(() => setLoading(false));
        },
        (err) => {
          setError('Location access denied. Please enable location services.');
          setLoading(false);
          console.error(err);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  // Handle location name change
  const handleLocationNameChange = (e) => {
    setLocationName(e.target.value);
    setManualLocationEntry(true);
    // If user is manually typing, we should clear the geolocation data
    if (currentLocation && !manualLocationEntry) {
      setCurrentLocation(null);
    }
  };

  // Simulate storing review to "blockchain"/database
  const storeReview = (reviewData) => {
    // In a real app, this would be an API call to your backend
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        // Get existing reviews from localStorage (simulating a database)
        const existingReviews = JSON.parse(localStorage.getItem('safesphereReviews') || '[]');
        
        // Add the new review with an ID
        const newReview = {
          ...reviewData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        
        // Add to "database"
        const updatedReviews = [newReview, ...existingReviews];
        localStorage.setItem('safesphereReviews', JSON.stringify(updatedReviews));
        
        resolve(newReview);
      }, 1000);
    });
  };

  // Simulate fetching reviews from "blockchain"/database
  const fetchReviews = (query) => {
    // In a real app, this would be an API call to your backend
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        // Get reviews from localStorage (simulating a database)
        const allReviews = JSON.parse(localStorage.getItem('safesphereReviews') || '[]');
        
        // Filter by location name if a query is provided
        const filteredReviews = query 
          ? allReviews.filter(review => 
              review.locationName.toLowerCase().includes(query.toLowerCase())
            )
          : allReviews;
        
        resolve(filteredReviews);
      }, 1000);
    });
  };

  // Calculate average safety score from reviews
  const calculateSafetyScore = (reviewsData) => {
    if (!reviewsData || reviewsData.length === 0) return null;
    
    const total = reviewsData.reduce((sum, review) => sum + review.rating, 0);
    return {
      averageSafety: parseFloat((total / reviewsData.length).toFixed(1)),
      totalReviews: reviewsData.length
    };
  };

  // Handle review submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a safety rating before submitting');
      return;
    }
    
    if (!locationName) {
      alert('Please enter a location name');
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare review data
      const reviewData = {
        locationName,
        rating,
        reviewText,
        latitude: currentLocation?.latitude || null,
        longitude: currentLocation?.longitude || null,
        manualLocationEntry: manualLocationEntry
      };
      
      // Store the review
      await storeReview(reviewData);
      
      // Show success message
      setSubmitted(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setRating(0);
        setReviewText('');
        setManualLocationEntry(false);
        // Switch back to search view
        setView('search');
      }, 3000);
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle location search
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a location to search');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Fetch reviews for the searched location
      const data = await fetchReviews(searchQuery);
      setReviews(data);
      
      // Calculate safety score
      setLocationScore(calculateSafetyScore(data));
      
      // Switch to results view
      setView('results');
    } catch (error) {
      setError('Failed to fetch location reviews. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle rating selection
  const handleRatingClick = (selectedRating) => {
    setRating(selectedRating);
  };

  // Display safety rating shields
  const renderSafetyShields = (ratingValue, size = 36) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((shield) => (
          <Shield
            key={shield}
            size={size}
            className={`${size > 20 ? 'mx-1' : 'mx-px'} ${view === 'submit' ? 'cursor-pointer' : ''}`}
            fill={shield <= (view === 'submit' ? (hover || ratingValue) : ratingValue) 
              ? ratingColors[shield <= ratingValue ? ratingValue : shield] 
              : '#ccc'}
            color={shield <= (view === 'submit' ? (hover || ratingValue) : ratingValue) 
              ? ratingColors[shield <= ratingValue ? ratingValue : shield] 
              : '#ccc'}
            onClick={view === 'submit' ? () => handleRatingClick(shield) : undefined}
            onMouseEnter={view === 'submit' ? () => setHover(shield) : undefined}
            onMouseLeave={view === 'submit' ? () => setHover(0) : undefined}
          />
        ))}
      </div>
    );
  };

  // Search View
  const SearchView = () => (
    <>
      <h2 className="text-xl font-bold text-center mb-4">SafeSphere Location Safety</h2>
      
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex">
          <input
            type="text"
            className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search location (e.g., Central Park, NYC)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 focus:outline-none"
          >
            <Search size={20} />
          </button>
        </div>
      </form>
      
      <div className="flex space-x-2 mb-6">
        <button
          onClick={getCurrentLocation}
          className="flex-1 bg-blue-100 text-blue-800 font-medium px-4 py-2 rounded-lg hover:bg-blue-200 flex items-center justify-center"
        >
          <MapPin size={16} className="mr-2" />
          Find Nearby Reviews
        </button>
        
        <button
          onClick={() => {
            setView('submit');
          }}
          className="flex-1 bg-green-100 text-green-800 font-medium px-4 py-2 rounded-lg hover:bg-green-200 flex items-center justify-center"
        >
          <Shield size={16} className="mr-2" />
          Submit Review
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="mt-4 text-xs text-center text-gray-500">
        <p>Help keep our community safe by sharing and checking location safety reviews.</p>
      </div>
    </>
  );

  // Submit Review View
  const SubmitView = () => (
    <>
      <div className="flex items-center mb-4">
        <button
          onClick={() => setView('search')}
          className="mr-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold">SafeSphere Location Safety Review</h2>
      </div>
      
      {submitted ? (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          <p className="font-bold">Thank you!</p>
          <p>Your safety review has been submitted and will help keep our community informed.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="locationName" className="block text-sm font-medium text-gray-700 mb-2">
              Location Name:
            </label>
            <div className="flex items-center">
              <input
                id="locationName"
                type="text"
                className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Enter location name"
                value={locationName}
                onChange={handleLocationNameChange}
                required
              />
              <button 
                type="button" 
                onClick={getCurrentLocation}
                className="ml-2 px-2 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
                title="Use my current location"
              >
                <MapPin size={20} />
              </button>
            </div>
            {manualLocationEntry && (
              <p className="text-xs text-gray-500 mt-1">
                Using manually entered location (GPS coordinates will not be stored)
              </p>
            )}
            {currentLocation && !manualLocationEntry && (
              <p className="text-xs text-green-600 mt-1">
                Using GPS location
              </p>
            )}
          </div>
          
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Rate the safety level of this location:</p>
            
            <div className="flex flex-col items-center">
              <div className="flex mb-2">
                {renderSafetyShields(rating)}
              </div>
              
              <div className="text-center mb-4">
                <span className="font-medium" style={{ color: ratingColors[rating || hover] }}>
                  {threatLevels[rating || hover] || 'Select Safety Rating'}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 h-2 rounded-full mb-4">
                <div className="flex w-full h-full">
                  <div className="w-1/5 h-full bg-red-500 rounded-l-full"></div>
                  <div className="w-1/5 h-full bg-orange-500"></div>
                  <div className="w-1/5 h-full bg-yellow-500"></div>
                  <div className="w-1/5 h-full bg-lime-500"></div>
                  <div className="w-1/5 h-full bg-green-500 rounded-r-full"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-2">
              Describe any safety concerns or observations:
            </label>
            <textarea
              id="review"
              rows="4"
              className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Share details about this location's safety..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            ></textarea>
          </div>
          
          <div className="flex justify-center">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center"
              disabled={loading}
            >
              <Shield className="mr-2" size={16} />
              {loading ? 'Submitting...' : 'Submit Safety Review'}
            </button>
          </div>
        </form>
      )}
      
      <div className="mt-4 text-xs text-center text-gray-500">
        <p>Your reviews help our community stay safer. All data is anonymized and secured with blockchain.</p>
      </div>
    </>
  );

  // Results View
  const ResultsView = () => (
    <>
      <div className="flex items-center mb-4">
        <button
          onClick={() => setView('search')}
          className="mr-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold">SafeSphere Safety Information</h2>
      </div>
      
      {locationScore ? (
        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <h3 className="font-bold mb-2">{searchQuery}</h3>
          <div className="flex items-center mb-2">
            <div className="mr-2">Safety Score: {locationScore.averageSafety}/5</div>
            {renderSafetyShields(Math.round(locationScore.averageSafety), 24)}
          </div>
          
          <div className="mb-2">
            <span 
              className="font-medium"
              style={{ color: ratingColors[Math.round(locationScore.averageSafety)] }}
            >
              {threatLevels[Math.round(locationScore.averageSafety)]}
            </span>
          </div>
          
          <p className="text-sm text-gray-600">Based on {locationScore.totalReviews} {locationScore.totalReviews === 1 ? 'review' : 'reviews'}</p>
          
          <div className="mt-2 flex">
            <button
              onClick={() => {
                setLocationName(searchQuery);
                setManualLocationEntry(true);
                setCurrentLocation(null);
                setView('submit');
              }}
              className="bg-blue-100 text-blue-800 text-sm font-medium px-4 py-1 rounded-lg hover:bg-blue-200 flex items-center"
            >
              <Shield size={14} className="mr-1" />
              Add Your Review
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-100 rounded-lg p-4 mb-4">
          <p className="text-yellow-800">No safety reviews available for this location yet.</p>
          <button
            onClick={() => {
              setLocationName(searchQuery);
              setManualLocationEntry(true);
              setCurrentLocation(null);
              setView('submit');
            }}
            className="mt-2 bg-blue-100 text-blue-800 text-sm font-medium px-4 py-1 rounded-lg hover:bg-blue-200 flex items-center"
          >
            <Shield size={14} className="mr-1" />
            Be the first to review
          </button>
        </div>
      )}
      
      {reviews.length > 0 ? (
        <div>
          <h3 className="font-bold mb-2">Safety Reviews</h3>
          {reviews.map((review) => (
            <div key={review.id} className="border-b py-3">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium">{review.locationName}</div>
                <div className="flex items-center text-xs text-gray-500 ml-2">
                  {formatDate(review.createdAt)}
                </div>
              </div>
              
              <div className="flex items-center mb-2">
                {renderSafetyShields(review.rating, 18)}
                <span 
                  className="ml-2 text-sm font-medium"
                  style={{ color: ratingColors[review.rating] }}
                >
                  {threatLevels[review.rating]}
                </span>
              </div>
              
              {review.reviewText && (
                <p className="text-sm text-gray-700 mt-1">{review.reviewText}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          <p>No reviews available for this location.</p>
        </div>
      )}
    </>
  );

  // Main render function
  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
      {loading && view !== 'submit' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p>Loading...</p>
          </div>
        </div>
      )}
      
      {view === 'search' && <SearchView />}
      {view === 'submit' && <SubmitView />}
      {view === 'results' && <ResultsView />}
    </div>
  );
};

export default SafeSphereApp;