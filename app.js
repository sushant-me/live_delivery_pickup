// Custom car icon
const carIcon = L.icon({
  iconUrl: "car.png",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// User location icon
const userIcon = L.icon({
  iconUrl:
    "https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Initialize map (default: Kathmandu)
const map = L.map("map").setView([27.7172, 85.324], 14);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap",
}).addTo(map);

// DOM elements
const btn = document.getElementById("request-btn");
const statusText = document.getElementById("status-text");
const statusDetails = document.getElementById("status-details");
const statusIcon = document.getElementById("status-icon");
const statusCard = document.getElementById("status-card");
const driverInfo = document.getElementById("driver-info");
const etaValue = document.getElementById("eta-value");
const distanceValue = document.getElementById("distance-value");

let userMarker, carMarker;
let rideInProgress = false;
let arrivalInterval;

// Update UI state
function updateUIState(state) {
  switch (state) {
    case "ready":
      statusText.textContent = "Ready to ride";
      statusDetails.textContent = "Click below to request a ride";
      statusIcon.textContent = "🚗";
      btn.innerHTML =
        '<span class="button-icon">🚖</span><span class="button-text">Request Ride</span>';
      btn.style.backgroundColor = "var(--primary-color)";
      driverInfo.style.display = "none";
      statusCard.classList.remove("arriving");
      break;

    case "searching":
      statusText.textContent = "Finding a driver";
      statusDetails.textContent = "Searching nearby drivers...";
      statusIcon.textContent = "🔍";
      btn.innerHTML =
        '<span class="button-icon">⏳</span><span class="button-text">Searching...</span>';
      btn.style.backgroundColor = "var(--light-text)";
      break;

    case "driver-assigned":
      statusText.textContent = "Driver coming";
      statusDetails.textContent = "Your driver is on the way";
      statusIcon.textContent = "🚕";
      btn.innerHTML =
        '<span class="button-icon">🛑</span><span class="button-text">Cancel Ride</span>';
      btn.style.backgroundColor = "var(--accent-color)";
      driverInfo.style.display = "flex";
      statusCard.classList.add("arriving");
      break;

    case "arrived":
      statusText.textContent = "Driver arrived!";
      statusDetails.textContent = "Your ride is here";
      statusIcon.textContent = "🎉";
      btn.innerHTML =
        '<span class="button-icon">⭐</span><span class="button-text">Rate Driver</span>';
      btn.style.backgroundColor = "var(--secondary-color)";
      clearInterval(arrivalInterval);
      break;
  }
}

// Calculate distance between coordinates (in km)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Simulate driver movement
function simulateDriverMovement(driverCoords, userCoords) {
  const totalSteps = 20;
  let currentStep = 0;

  // Calculate movement increments
  const latIncrement = (driverCoords[0] - userCoords[0]) / totalSteps;
  const lngIncrement = (driverCoords[1] - userCoords[1]) / totalSteps;

  // Place initial car marker
  if (carMarker) map.removeLayer(carMarker);
  carMarker = L.marker(driverCoords, { icon: carIcon })
    .addTo(map)
    .bindPopup("Your driver is coming");

  // Start movement simulation
  arrivalInterval = setInterval(() => {
    if (currentStep >= totalSteps) {
      updateUIState("arrived");
      carMarker.setPopupContent("Driver has arrived!").openPopup();
      return;
    }

    currentStep++;
    const newLat = driverCoords[0] - latIncrement * currentStep;
    const newLng = driverCoords[1] - lngIncrement * currentStep;
    carMarker.setLatLng([newLat, newLng]);

    // Update ETA and distance
    const distance = calculateDistance(
      newLat,
      newLng,
      userCoords[0],
      userCoords[1]
    );
    const eta = Math.round(distance * 3 + 1); // Simple ETA calculation (3 min per km + 1 min)

    distanceValue.textContent = distance.toFixed(1) + " km";
    etaValue.textContent = eta + " min";
  }, 1000);
}

// Request ride button handler
btn.addEventListener("click", () => {
  if (rideInProgress) {
    // Cancel ride
    if (confirm("Are you sure you want to cancel your ride?")) {
      clearInterval(arrivalInterval);
      if (carMarker) map.removeLayer(carMarker);
      rideInProgress = false;
      updateUIState("ready");
    }
    return;
  }

  if (navigator.geolocation) {
    updateUIState("searching");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userCoords = [pos.coords.latitude, pos.coords.longitude];

        // Update user marker
        if (userMarker) map.removeLayer(userMarker);
        userMarker = L.marker(userCoords, { icon: userIcon })
          .addTo(map)
          .bindPopup("Your location")
          .openPopup();

        map.setView(userCoords, 16);

        // Simulate finding a driver (after 2-3 seconds)
        setTimeout(() => {
          rideInProgress = true;
          updateUIState("driver-assigned");

          // Place driver ~1.5km away in random direction
          const angle = Math.random() * Math.PI * 2;
          const distance = 0.015; // ~1.5km
          const driverCoords = [
            userCoords[0] + Math.cos(angle) * distance,
            userCoords[1] + Math.sin(angle) * distance,
          ];

          // Start driver movement simulation
          simulateDriverMovement(driverCoords, userCoords);
        }, 2000 + Math.random() * 1000);
      },
      (err) => {
        updateUIState("ready");
        alert("Error: " + err.message);
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
});

// Initialize UI
updateUIState("ready");
