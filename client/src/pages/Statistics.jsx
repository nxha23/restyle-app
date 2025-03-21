// src/pages/Statistics.jsx
import React, { useEffect, useState } from "react";
import localforage from "localforage";
import "../styles/Statistics.css";

export default function Statistics() {
  const [stats, setStats] = useState({ mostWorn: [], leastWorn: [] });
  const [sustainability, setSustainability] = useState({
    co2Saved: 0,
    waterSaved: 0,
  });
  const [error, setError] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [streak, setStreak] = useState(0);
  const token = localStorage.getItem("accessToken");

  // Retrieve currentUser from localStorage (assumes it's stored as JSON)
  const storedUser = localStorage.getItem("currentUser")
    ? JSON.parse(localStorage.getItem("currentUser"))
    : null;
  // Helper: user-specific cache keys
  const statsCacheKey = storedUser ? `stats-${storedUser._id}` : "stats";
  const sustainabilityCacheKey = storedUser
    ? `sustainability-${storedUser._id}`
    : "sustainability";

  const carbonFootprintMap = {
    top: { co2: 5, water: 2700 },
    hoodie: { co2: 8, water: 3000 },
    jumper: { co2: 10, water: 1000 },
    trousers: { co2: 15, water: 2000 },
    jeans: { co2: 20, water: 3800 },
    shorts: { co2: 8, water: 1500 },
    skirt: { co2: 10, water: 2000 },
    dress: { co2: 15, water: 3000 },
    jacket: { co2: 20, water: 1000 },
    shoes: { co2: 14, water: 8000 },
    average: { co2: 12, water: 1000 },
  };

  useEffect(() => {
    if (!token) {
      setError("No token found. Please log in.");
      return;
    }
    const loadCachedData = async () => {
      try {
        const cachedStats = await localforage.getItem(statsCacheKey);
        if (cachedStats) {
          setStats(cachedStats);
        }
        const cachedSustainability = await localforage.getItem(
          sustainabilityCacheKey
        );
        if (cachedSustainability) {
          setSustainability(cachedSustainability);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadCachedData();

    Promise.all([
      fetchStats(),
      fetchSustainability(),
      fetchChallenges(),
    ]).catch(console.error);

    fetch("/api/streak", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStreak(data.streak);
        }
      })
      .catch(console.error);
  }, [token, statsCacheKey, sustainabilityCacheKey]);

  const fetchStats = () => {
    return fetch("/api/wardrobe/statistics", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setError(data.message);
        } else {
          const sortedLeast = (data.leastWorn || []).sort(
            (a, b) => a.wearCount - b.wearCount
          );
          const sortedMost = (data.mostWorn || []).sort(
            (a, b) => b.wearCount - a.wearCount
          );
          const newStats = {
            mostWorn: sortedMost,
            leastWorn: sortedLeast,
          };
          setStats(newStats);
          localforage.setItem(statsCacheKey, newStats);
        }
      })
      .catch((err) => setError(err.message));
  };

  const fetchSustainability = async () => {
    try {
      const res = await fetch("/api/wardrobe/get", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
      } else {
        const allItems = data.items || [];
        let totalCO2 = 0;
        let totalWater = 0;
        allItems.forEach((item) => {
          const cat = item.itemCategory
            ? item.itemCategory.toLowerCase()
            : "average";
          const { co2, water } = carbonFootprintMap[cat] || carbonFootprintMap["average"];
          const rewears = Math.max(0, item.wearCount - 1);
          totalCO2 += co2 * rewears;
          totalWater += water * rewears;
        });
        const newSustainability = {
          co2Saved: totalCO2,
          waterSaved: totalWater,
        };
        setSustainability(newSustainability);
        localforage.setItem(sustainabilityCacheKey, newSustainability);
      }
    } catch (error) {
      console.error(error);
      setError("Failed to fetch sustainability data");
    }
  };

  const fetchChallenges = () => {
    return fetch("/api/challenge/all", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setChallenges(data.challenges);
        }
      })
      .catch(console.error);
  };

  // Challenge/Modal logic remains unchanged
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
    const newProgress = Math.min(
      selectedChallenge.progress + 1,
      selectedChallenge.goal
    );
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
            ch._id === selectedChallenge._id
              ? { ...ch, progress: newProgress }
              : ch
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
            ch._id === selectedChallenge._id
              ? { ...ch, progress: newProgress }
              : ch
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
    <div className="statistics-page">
      {error && <p className="error-message">{error}</p>}

      {/* New text providing context */}
      <h2 className="stats-intro">
        Every rewear counts. Here's your contribution to reducing fashion’s footprint:
      </h2>

      {/* Top row: CO₂, Water, and Current Streak */}
      <div className="stats-overview">
        <div className="stat-card">
          <h2>Total CO₂ Saved ☁️</h2>
          <p className="stat-value">{sustainability.co2Saved.toFixed(2)} kg</p>
        </div>
        <div className="stat-card">
          <h2>Total Water Saved 💧</h2>
          <p className="stat-value">
            {sustainability.waterSaved.toLocaleString()} liters
          </p>
        </div>
        <div className="stat-card">
          <h2>Current Streak 🔥</h2>
          <p className="stat-value">{streak} days</p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        <div className="worn-section-row">
          {/* MOST WORN */}
          <div className="worn-card">
            <h2>M O S T &nbsp;&nbsp; W O R N</h2>
            {stats.mostWorn.length > 0 ? (
              <div className="most-worn-container">
                {stats.mostWorn[1] && (
                  <div className="most-worn-card second-most-worn">
                    <img
                      src={stats.mostWorn[1].imageUrl}
                      alt="2nd Most Worn"
                      className="worn-image-card"
                    />
                    <p className="wear-count-text">
                      {stats.mostWorn[1].wearCount} wears
                    </p>
                  </div>
                )}
                {stats.mostWorn[0] && (
                  <div className="most-worn-card top-most-worn">
                    <img
                      src={stats.mostWorn[0].imageUrl}
                      alt="Most Worn"
                      className="worn-image-card"
                    />
                    <p className="wear-count-text">
                      {stats.mostWorn[0].wearCount} wears
                    </p>
                  </div>
                )}
                {stats.mostWorn[2] && (
                  <div className="most-worn-card third-most-worn">
                    <img
                      src={stats.mostWorn[2].imageUrl}
                      alt="3rd Most Worn"
                      className="worn-image-card"
                    />
                    <p className="wear-count-text">
                      {stats.mostWorn[2].wearCount} wears
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p>No data yet.</p>
            )}
          </div>

          {/* LEAST WORN */}
          <div className="worn-card">
            <h2>L E A S T &nbsp;&nbsp; W O R N</h2>
            {stats.leastWorn.length > 0 ? (
              <div className="least-worn-container">
                {stats.leastWorn[1] && (
                  <div className="least-worn-card left-least-worn">
                    <img
                      src={stats.leastWorn[1].imageUrl}
                      alt="2nd Least Worn"
                      className="worn-image-card"
                    />
                    <p className="wear-count-text">
                      {stats.leastWorn[1].wearCount} wears
                    </p>
                  </div>
                )}
                {stats.leastWorn[0] && (
                  <div className="least-worn-card top-least-worn">
                    <img
                      src={stats.leastWorn[0].imageUrl}
                      alt="Least Worn"
                      className="worn-image-card"
                    />
                    <p className="wear-count-text">
                      {stats.leastWorn[0].wearCount} wears
                    </p>
                  </div>
                )}
                {stats.leastWorn[2] && (
                  <div className="least-worn-card right-least-worn">
                    <img
                      src={stats.leastWorn[2].imageUrl}
                      alt="3rd Least Worn"
                      className="worn-image-card"
                    />
                    <p className="wear-count-text">
                      {stats.leastWorn[2].wearCount} wears
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p>No data yet.</p>
            )}
          </div>
        </div>

        {/* Challenges */}
        <div className="challenges-section">
          <h2>C H A L L E N G E S</h2>
          <ul>
            {challenges.map((challenge) => {
              const percentage = Math.round(
                (challenge.progress / challenge.goal) * 100
              );
              const isComplete = percentage >= 100;
              return (
                <li
                  key={challenge._id}
                  className="challenge-item"
                  onClick={() => handleChallengeClick(challenge)}
                >
                  <span className="challenge-emoji">
                    {challenge.locked ? "🔐" : isComplete ? "🎉" : "🔓"}
                  </span>{" "}
                  <span className="challenge-name">
                    {challenge.challengeType}
                  </span>
                  {!challenge.locked && !isComplete && (
                    <>
                      {" "}
                      - {challenge.progress}/{challenge.goal} ({percentage}%)
                      <div className="challenge-progressbar-container">
                        <div
                          className="challenge-progressbar-fill"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </>
                  )}
                  {!challenge.locked && isComplete && (
                    <> - Congratulations! Challenge completed!</>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Modal for Challenges */}
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
                            (selectedChallenge.progress /
                              selectedChallenge.goal) *
                            100
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
