// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import localforage from "localforage"; // Added for caching
import "../styles/Home.css"; // Our custom CSS

export default function Home() {
  const [nudge, setNudge] = useState("");
  const [streak, setStreak] = useState(0);
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tomorrowOutfit, setTomorrowOutfit] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherSuggestion, setWeatherSuggestion] = useState("");
  const [error, setError] = useState(null);

  const token = localStorage.getItem("accessToken");
  const navigate = useNavigate();

  // Retrieve currentUser from localStorage (assumes it's stored as JSON)
  const storedUser = localStorage.getItem("currentUser") ? JSON.parse(localStorage.getItem("currentUser")) : null;

  // Helper: Build user-specific cache key
  const getCacheKey = (baseKey) =>
    storedUser ? `${baseKey}-${storedUser._id}` : baseKey;

  // Use Vite's environment variable:
  const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

  useEffect(() => {
    if (!token) {
      setError("No token found. Please log in.");
      return;
    }

    // 1) Fetch daily nudge (AI tip)
    fetch("/api/nudge", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNudge(data.nudge || "Try upcycling an old piece into something new!");
        } else {
          setNudge("Try upcycling an old piece into something new!");
        }
      })
      .catch((err) => setError(err.message));

    // 2) Fetch challenges (unlocked only)
    fetch("/api/challenge/all", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const allChallenges = data.challenges || [];
          const unlocked = allChallenges.filter((ch) => !ch.locked);
          setChallenges(unlocked);
        }
      })
      .catch((err) => setError(err.message));

    // 3) Fetch the streak
    fetch("/api/streak", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStreak(data.streak);
        }
      })
      .catch((err) => setError(err.message));

    // 4) Fetch outfit for tomorrow with localForage caching
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedTomorrow = tomorrow.toISOString().split("T")[0];
    const cacheKey = getCacheKey(`tomorrowOutfit-${formattedTomorrow}`);
    
    // Load cached outfit first
    localforage.getItem(cacheKey)
      .then((cachedOutfit) => {
        if (cachedOutfit) {
          setTomorrowOutfit(cachedOutfit);
        }
        // Fetch fresh data in background
        return fetch(`/api/dailyOutfit/get/${formattedTomorrow}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.dailyOutfit) {
          setTomorrowOutfit(data.dailyOutfit);
          localforage.setItem(cacheKey, data.dailyOutfit);
        } else {
          setTomorrowOutfit(null);
        }
      })
      .catch((err) => setError(err.message));

    // 5) Fetch weather using geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetch(
            `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}`
          )
            .then((res) => res.json())
            .then((data) => {
              if (data.error) {
                console.error("Weather API error:", data.error);
                return;
              }
              setWeather(data);
              if (data.current) {
                const condition = data.current.condition.text.toLowerCase();
                const tempC = data.current.temp_c;
                let suggestion = "";
                if (condition.includes("rain")) {
                  suggestion = "Rainy day! Consider a waterproof jacket.";
                } else if (tempC > 25) {
                  suggestion = "It's hot! Wear light, breathable fabrics.";
                } else if (tempC < 10) {
                  suggestion = "Chilly weather! A warm coat is recommended.";
                } else {
                  suggestion = "Weather looks mild! Enjoy your day.";
                }
                setWeatherSuggestion(suggestion);
              }
            })
            .catch((err) => console.error("Weather fetch error:", err));
        },
        (err) => {
          console.error("Geolocation error:", err);
        }
      );
    }
  }, [token]);

  // -------------------------
  // Challenge / Modal Logic
  // -------------------------
  const handleChallengeClick = (challenge) => {
    setSelectedChallenge(challenge);
    setShowModal(true);
  };

  const handleUnlockChallenge = async () => {
    if (!selectedChallenge) return;
    try {
      const res = await fetch(`/api/challenge/update/${selectedChallenge._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ locked: false }),
      });
      const data = await res.json();
      if (data.success) {
        setChallenges((prev) =>
          prev.map((ch) =>
            ch._id === selectedChallenge._id ? { ...ch, locked: false } : ch
          )
        );
        setSelectedChallenge((prev) =>
          prev ? { ...prev, locked: false } : prev
        );
      } else {
        console.error("Unlock failed:", data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogProgress = async () => {
    if (!selectedChallenge) return;
    const newProgress = Math.min(selectedChallenge.progress + 1, selectedChallenge.goal);
    try {
      const res = await fetch(`/api/challenge/update/${selectedChallenge._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ progress: newProgress }),
      });
      const data = await res.json();
      if (data.success) {
        setChallenges((prev) =>
          prev.map((ch) =>
            ch._id === selectedChallenge._id ? { ...ch, progress: newProgress } : ch
          )
        );
        setSelectedChallenge((prev) =>
          prev ? { ...prev, progress: newProgress } : prev
        );
      } else {
        console.error("Log progress failed:", data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnlogDay = async () => {
    if (!selectedChallenge) return;
    const newProgress = Math.max(selectedChallenge.progress - 1, 0);
    try {
      const res = await fetch(`/api/challenge/update/${selectedChallenge._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ progress: newProgress }),
      });
      const data = await res.json();
      if (data.success) {
        setChallenges((prev) =>
          prev.map((ch) =>
            ch._id === selectedChallenge._id ? { ...ch, progress: newProgress } : ch
          )
        );
        setSelectedChallenge((prev) =>
          prev ? { ...prev, progress: newProgress } : prev
        );
      } else {
        console.error("Unlog day failed:", data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedChallenge(null);
  };

  return (
    <div className="home-page">
      {error && <p className="error-message">{error}</p>}

      {/* TOP ROW: Nudge (left) and Streak (right) */}
      <div className="top-row">
        <div className="left-col">
          <h1 className="nudge-title">
            Today's Eco-Friendly Nudge <span role="img" aria-label="leaf">🌱</span>
          </h1>
          <p className="nudge-text">{nudge}</p>
        </div>
        <div className="right-col streaks-section">
          <h2 className="streaks-heading">
            Streaks <span role="img" aria-label="fire">🔥</span>
          </h2>
          <p className="streaks-count">
            <strong>{streak}</strong> days
          </p>
          <p className="streaks-subtext">Remember to log your outfits daily!</p>
          <p className="streaks-subtext">Keep it up!</p>
        </div>
      </div>

      {/* TOMORROW ROW: Outfit for Tomorrow (left) and Weather (right) */}
      <div className="tomorrow-row">
        <div className="tomorrow-outfit-section">
          <h2 className="section-title">Outfit for Tomorrow 👕</h2>
          {tomorrowOutfit ? (
            <div className="outfit-container">
              <img
                src={tomorrowOutfit.outfitRef?.screenshot || ""}
                alt="Tomorrow's Outfit"
                className="outfit-image"
              />
            </div>
          ) : (
            <div className="no-outfit-message">
              <p>Don't forget to plan your outfit for tomorrow!</p>
              <button
                className="plan-outfit-button"
                onClick={() => navigate("/calendar")}
              >
                Plan Outfit Now
              </button>
            </div>
          )}
        </div>

        <div className="weather-section">
          <h2 className="weather-title">Weather ☁️</h2>
          {weather && weather.current ? (
            <>
              <p className="weather-desc">
                {weatherSuggestion} <br />
                Current Temp: {Math.round(weather.current.temp_c)}°C
              </p>
              <p className="weather-desc">
                Condition: {weather.current.condition.text}
              </p>
            </>
          ) : (
            <p className="weather-desc">Fetching your local weather...</p>
          )}
        </div>
      </div>

      {/* Ongoing Challenges Section */}
      <div className="challenges-section">
        <h2 className="challenges-heading">Ongoing Challenges</h2>
        {challenges.length === 0 ? (
          <p className="no-challenges">No challenges yet.</p>
        ) : (
          <ul className="challenge-list">
            {challenges.map((ch) => {
              const percentage = Math.round((ch.progress / ch.goal) * 100);
              const isComplete = percentage >= 100;
              return (
                <li
                  key={ch._id}
                  className="challenge-item"
                  onClick={() => handleChallengeClick(ch)}
                >
                  <span className="challenge-emoji">
                    {ch.locked ? "🔐" : isComplete ? "🎉" : "🔓"}
                  </span>{" "}
                  {ch.challengeType}
                  {!ch.locked && !isComplete && (
                    <>
                      {" "}
                      - {ch.progress}/{ch.goal} ({percentage}%)
                      <div className="challenge-progressbar-container">
                        <div
                          className="challenge-progressbar-fill"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </>
                  )}
                  {!ch.locked && isComplete && (
                    <> - Congratulations! Challenge completed!</>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Modal for Challenge Details */}
      {showModal && selectedChallenge && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedChallenge.challengeType}</h3>
            {selectedChallenge.locked ? (
              <>
                <p>This challenge is locked.</p>
                <div className="button-row">
                  <button onClick={handleUnlockChallenge}>
                    Unlock Challenge
                  </button>
                  <button onClick={handleCloseModal} className="close-modal-btn">
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                {selectedChallenge.progress >= selectedChallenge.goal ? (
                  <p>Congrats! You’ve completed this challenge!</p>
                ) : (
                  <>
                    <p>
                      Progress: {selectedChallenge.progress} /{" "}
                      {selectedChallenge.goal}
                    </p>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${
                            (selectedChallenge.progress / selectedChallenge.goal) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </>
                )}
                <div className="button-row">
                  <button onClick={handleLogProgress}>Log Progress (+1)</button>
                  <button onClick={handleUnlogDay}>Unlog Day (−1)</button>
                  <button onClick={handleCloseModal} className="close-modal-btn">
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
