import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  Truck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./DeliveryLocationPage.css";

const popularLocations = [
  {
    city: "Bengaluru",
    pincode: "560001",
    area: "Central Bengaluru"
  },
  {
    city: "Mumbai",
    pincode: "400001",
    area: "South Mumbai"
  },
  {
    city: "Delhi",
    pincode: "110001",
    area: "Central Delhi"
  },
  {
    city: "Hyderabad",
    pincode: "500001",
    area: "Hyderabad Central"
  },
  {
    city: "Kolkata",
    pincode: "700001",
    area: "Central Kolkata"
  },
  {
    city: "Ranchi",
    pincode: "834001",
    area: "Ranchi Central"
  }
];

const serviceabilityData = {
  "560001": {
    city: "Bengaluru",
    state: "Karnataka",
    area: "Central Bengaluru",
    days: "2–4 days",
    express: "Tomorrow",
    cod: true,
    available: true
  },
  "400001": {
    city: "Mumbai",
    state: "Maharashtra",
    area: "South Mumbai",
    days: "2–4 days",
    express: "Tomorrow",
    cod: true,
    available: true
  },
  "110001": {
    city: "New Delhi",
    state: "Delhi",
    area: "Central Delhi",
    days: "2–4 days",
    express: "Tomorrow",
    cod: true,
    available: true
  },
  "500001": {
    city: "Hyderabad",
    state: "Telangana",
    area: "Hyderabad Central",
    days: "3–5 days",
    express: "2 days",
    cod: true,
    available: true
  },
  "700001": {
    city: "Kolkata",
    state: "West Bengal",
    area: "Central Kolkata",
    days: "3–5 days",
    express: "2 days",
    cod: true,
    available: true
  },
  "834001": {
    city: "Ranchi",
    state: "Jharkhand",
    area: "Ranchi Central",
    days: "3–6 days",
    express: "2–3 days",
    cod: true,
    available: true
  }
};

export default function DeliveryLocationPage({
  currentPincode = "",
  onLocationChange
}) {
  const navigate = useNavigate();

  const [pincode, setPincode] = useState(currentPincode);
  const [result, setResult] = useState(
    currentPincode ? serviceabilityData[currentPincode] : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkPincode = (value = pincode) => {
    const cleanPincode = value.trim();

    if (!/^\d{6}$/.test(cleanPincode)) {
      setResult(null);
      setError("Enter a valid 6-digit pincode.");
      return;
    }

    setLoading(true);
    setError("");

    setTimeout(() => {
      const serviceability = serviceabilityData[cleanPincode];

      if (!serviceability) {
        setResult({
          available: false,
          city: "",
          state: "",
          area: "",
          days: "",
          express: "",
          cod: false
        });
        setError("Delivery is currently unavailable for this pincode.");
      } else {
        setResult(serviceability);

        onLocationChange?.({
          pincode: cleanPincode,
          ...serviceability
        });
      }

      setLoading(false);
    }, 450);
  };

  const handlePopularLocation = (location) => {
    setPincode(location.pincode);
    checkPincode(location.pincode);
  };

  return (
    <main className="delivery-location-page">
      <section className="delivery-location-hero">
        <button
          className="delivery-back-button"
          type="button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="delivery-hero-content">
          <div className="delivery-location-icon">
            <MapPin size={25} />
          </div>

          <span>DELIVERY LOCATION</span>

          <h1>Where should we deliver?</h1>

          <p>
            Enter your pincode to see delivery availability, estimated arrival
            and payment options for your location.
          </p>

          <div className="delivery-search-box">
            <Search size={19} />

            <input
              value={pincode}
              onChange={(event) => {
                setPincode(
                  event.target.value.replace(/\D/g, "").slice(0, 6)
                );
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  checkPincode();
                }
              }}
              placeholder="Enter 6-digit pincode"
              inputMode="numeric"
              maxLength={6}
            />

            <button
              type="button"
              onClick={() => checkPincode()}
              disabled={loading}
            >
              {loading ? "Checking..." : "Check"}
            </button>
          </div>

          {error && (
            <div
              className={`delivery-message ${
                result?.available === false ? "error" : ""
              }`}
            >
              {result?.available === false ? (
                <span>!</span>
              ) : (
                <span>!</span>
              )}
              {error}
            </div>
          )}

          <button
            className="use-location-button"
            type="button"
            onClick={() => setError("Location access can be connected to your location service later.")}
          >
            <Navigation size={16} />
            Use my current location
          </button>
        </div>
      </section>

      {result?.available && (
        <section className="delivery-result">
          <div className="delivery-result-header">
            <div>
              <span>DELIVERY AVAILABLE</span>
              <h2>
                {result.area}, {result.city}
              </h2>
              <p>
                {result.state} · {pincode}
              </p>
            </div>

            <div className="delivery-available-badge">
              <CheckCircle2 size={17} />
              Serviceable
            </div>
          </div>

          <div className="delivery-benefits">
            <div className="delivery-benefit">
              <div>
                <Truck size={20} />
              </div>

              <span>
                <strong>Standard delivery</strong>
                <small>{result.days}</small>
              </span>
            </div>

            <div className="delivery-benefit">
              <div>
                <Clock3 size={20} />
              </div>

              <span>
                <strong>Express delivery</strong>
                <small>{result.express}</small>
              </span>
            </div>

            <div className="delivery-benefit">
              <div>
                <ShieldCheck size={20} />
              </div>

              <span>
                <strong>Cash on Delivery</strong>
                <small>
                  {result.cod ? "Available" : "Unavailable"}
                </small>
              </span>
            </div>
          </div>

          <div className="delivery-confidence">
            <div>
              <span>DELIVERY CONFIDENCE</span>
              <strong>High confidence for this location</strong>
            </div>

            <div className="confidence-bar">
              <span />
            </div>

            <small>
              Final ETA depends on product availability, warehouse allocation
              and courier capacity.
            </small>
          </div>

          <button
            className="continue-shopping-button"
            type="button"
            onClick={() => navigate("/shop")}
          >
            Continue shopping
            <ArrowLeft size={17} className="forward-icon" />
          </button>
        </section>
      )}

      {result?.available === false && (
        <section className="delivery-unavailable">
          <div className="unavailable-icon">!</div>
          <h2>We don't deliver here yet</h2>
          <p>
            We're expanding our delivery network. Try another pincode to
            check availability.
          </p>

          <button type="button" onClick={() => setPincode("")}>
            Try another pincode
          </button>
        </section>
      )}

      <section className="popular-locations">
        <div className="popular-heading">
          <div>
            <span>QUICK CHECK</span>
            <h2>Popular delivery locations</h2>
          </div>
        </div>

        <div className="popular-location-grid">
          {popularLocations.map((location) => (
            <button
              type="button"
              key={location.pincode}
              onClick={() => handlePopularLocation(location)}
            >
              <MapPin size={17} />

              <span>
                <strong>{location.city}</strong>
                <small>
                  {location.area} · {location.pincode}
                </small>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="delivery-info-strip">
        <div>
          <Truck size={19} />
          <span>
            <strong>Reliable delivery</strong>
            <small>Multiple courier partners</small>
          </span>
        </div>

        <div>
          <ShieldCheck size={19} />
          <span>
            <strong>Secure payments</strong>
            <small>Protected checkout</small>
          </span>
        </div>

        <div>
          <CheckCircle2 size={19} />
          <span>
            <strong>Easy returns</strong>
            <small>Simple return process</small>
          </span>
        </div>
      </section>
    </main>
  );
}