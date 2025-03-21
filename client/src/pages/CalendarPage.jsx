// src/pages/CalendarPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import localforage from "localforage";
import "../styles/CalendarPage.css"; // Ensure this path is correct

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CalendarPage() {
  const [outfits, setOutfits] = useState([]);
  const [dailyOutfit, setDailyOutfit] = useState(null);
  // In-memory cache for daily outfits keyed by date string ("YYYY-MM-DD")
  const [dailyOutfitsCache, setDailyOutfitsCache] = useState({});
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [submittingOutfit, setSubmittingOutfit] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const dayRefs = useRef([]);
  const outfitListRef = useRef(null);

  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  // Helper: Build a user-specific cache key (if currentUser is available)
  const getCacheKey = (baseKey) =>
    currentUser ? `${baseKey}-${currentUser._id}` : baseKey;

  // -----------------------------------------------------
  // SCROLL FUNCTIONS FOR OUTFIT LIST
  // -----------------------------------------------------
  const scrollLeft = () => {
    outfitListRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    outfitListRef.current?.scrollBy({ left: 300, behavior: "smooth" });
  };
  // -----------------------------------------------------

  // 1) Fetch all outfits (with user-specific caching)
  useEffect(() => {
    const loadAndFetchOutfits = async () => {
      const cacheKey = getCacheKey("calendarOutfits");
      const cachedOutfits = await localforage.getItem(cacheKey);
      if (cachedOutfits) {
        setOutfits(cachedOutfits);
      }
      if (!currentUser || !token) return;
      try {
        const res = await fetch("/api/outfit/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setOutfits(data.outfits);
          await localforage.setItem(cacheKey, data.outfits);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadAndFetchOutfits();
  }, [currentUser, token]);

  // Utility: Build a date string in format "YYYY-MM-DD" for a given day using viewDate's month/year
  const buildDateStr = (day, dateObj = viewDate) => {
    const month = dateObj.getMonth();
    const year = dateObj.getFullYear();
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  // 2) Prefetch the current day ±2 days immediately with user-specific keys
  useEffect(() => {
    if (!token || !currentUser) return;
    const now = new Date();
    if (!selectedDay && viewDate.getMonth() === now.getMonth() && viewDate.getFullYear() === now.getFullYear()) {
      setSelectedDay(now.getDate());
    }
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const windowSize = 2;
    const currentDay = selectedDay || now.getDate();
    const startDay = Math.max(1, currentDay - windowSize);
    const endDay = Math.min(daysInMonth, currentDay + windowSize);

    for (let d = startDay; d <= endDay; d++) {
      const dateStr = buildDateStr(d);
      const cacheKey = getCacheKey(`dailyOutfit-${dateStr}`);
      localforage.getItem(cacheKey).then((cached) => {
        if (cached) {
          setDailyOutfitsCache((prev) => ({ ...prev, [dateStr]: cached }));
          if (d === currentDay) {
            setDailyOutfit(cached);
          }
        } else {
          fetch(`/api/dailyOutfit/get/${dateStr}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                localforage.setItem(cacheKey, data.dailyOutfit);
                setDailyOutfitsCache((prev) => ({ ...prev, [dateStr]: data.dailyOutfit }));
                if (d === currentDay) {
                  setDailyOutfit(data.dailyOutfit);
                }
              }
            })
            .catch((err) => console.error(err));
        }
      });
    }
  }, [token, viewDate, selectedDay, currentUser]);

  // 3) In the background, prefetch the remaining days of the month
  useEffect(() => {
    if (!token || !currentUser) return;
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const windowSize = 2;
    const currentDay = selectedDay || new Date().getDate();
    const startDay = Math.max(1, currentDay - windowSize);
    const endDay = Math.min(daysInMonth, currentDay + windowSize);

    const fetchRest = async () => {
      for (let d = 1; d <= daysInMonth; d++) {
        if (d >= startDay && d <= endDay) continue;
        const dateStr = buildDateStr(d);
        const cacheKey = getCacheKey(`dailyOutfit-${dateStr}`);
        if (!dailyOutfitsCache[dateStr]) {
          try {
            const cached = await localforage.getItem(cacheKey);
            if (cached) {
              setDailyOutfitsCache((prev) => ({ ...prev, [dateStr]: cached }));
            } else {
              const res = await fetch(`/api/dailyOutfit/get/${dateStr}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const data = await res.json();
              if (data.success) {
                await localforage.setItem(cacheKey, data.dailyOutfit);
                setDailyOutfitsCache((prev) => ({ ...prev, [dateStr]: data.dailyOutfit }));
              }
            }
          } catch (err) {
            console.error(err);
          }
        }
      }
    };

    const timeoutId = setTimeout(fetchRest, 500);
    return () => clearTimeout(timeoutId);
  }, [token, viewDate, selectedDay, dailyOutfitsCache, currentUser]);

  // 4) When the user selects a day, update dailyOutfit immediately from the cache (or fetch if missing)
  useEffect(() => {
    if (!selectedDay || !token || !currentUser) {
      setDailyOutfit(null);
      return;
    }
    const dateStr = buildDateStr(selectedDay);
    const cacheKey = getCacheKey(`dailyOutfit-${dateStr}`);
    if (dailyOutfitsCache[dateStr]) {
      setDailyOutfit(dailyOutfitsCache[dateStr]);
    } else {
      fetch(`/api/dailyOutfit/get/${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setDailyOutfit(data.dailyOutfit);
            setDailyOutfitsCache((prev) => ({ ...prev, [dateStr]: data.dailyOutfit }));
            localforage.setItem(cacheKey, data.dailyOutfit);
          } else {
            setDailyOutfit(null);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [selectedDay, token, currentUser]);

  // 5) Fetch current streak from backend
  useEffect(() => {
    if (!token) return;
    fetch("/api/streak", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStreakCount(data.streak);
        }
      })
      .catch(console.error);
  }, [token]);

  // Month/Year info
  const currentMonthName = MONTH_NAMES[viewDate.getMonth()];
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const daysInThisMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInThisMonth }, (_, i) => i + 1);

  // Month navigation
  const handlePrevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDay(null);
    setDailyOutfit(null);
  };
  const handleNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDay(null);
    setDailyOutfit(null);
  };
  const handleToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(now.getDate());
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
  };

  // Auto-scroll the selected day into view
  useEffect(() => {
    if (selectedDay && dayRefs.current[selectedDay - 1]?.current) {
      dayRefs.current[selectedDay - 1].current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedDay]);

  // 6) POST to assign outfit (update cache on success)
  const chooseDailyOutfit = (outfitId) => {
    if (submittingOutfit) return;
    setSubmittingOutfit(true);
    setSubmitMessage("Submitting outfit, please wait...");

    const dateStr = buildDateStr(selectedDay);
    const cacheKey = getCacheKey(`dailyOutfit-${dateStr}`);
    fetch("/api/dailyOutfit/set", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ date: dateStr, outfitId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDailyOutfit(data.dailyOutfit);
          setDailyOutfitsCache((prev) => ({ ...prev, [dateStr]: data.dailyOutfit }));
          localforage.setItem(cacheKey, data.dailyOutfit);
          setIsModalOpen(false);
        } else {
          console.error("Failed to set daily outfit:", data.message);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setSubmittingOutfit(false);
        setSubmitMessage("");
      });
  };

  // 7) DELETE to clear outfit (update cache on success)
  const deleteDailyOutfit = () => {
    const dateStr = buildDateStr(selectedDay);
    const cacheKey = getCacheKey(`dailyOutfit-${dateStr}`);
    fetch(`/api/dailyOutfit/delete/${dateStr}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDailyOutfit(null);
          setDailyOutfitsCache((prev) => ({ ...prev, [dateStr]: null }));
          localforage.setItem(cacheKey, null);
        } else {
          console.error("Failed to delete daily outfit:", data.message);
        }
      })
      .catch((err) => console.error(err));
  };

  // Determine if the selected day is today
  const today = new Date();
  const isToday =
    selectedDay === today.getDate() &&
    viewDate.getMonth() === today.getMonth() &&
    viewDate.getFullYear() === today.getFullYear();

  // Handler to confirm today's outfit (streak)
  const handleConfirmOutfit = async () => {
    if (!isToday) {
      console.log("You can only confirm your outfit for today!");
      return;
    }
    try {
      const res = await fetch("/api/streak/confirm", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setStreakCount(data.streakCount);
        setConfirmMessage("Streak logged!🎉");
        console.log(`Streak confirmed! Current streak: ${data.streakCount} days.`);
        setTimeout(() => {
          setConfirmMessage("");
        }, 3000);
      } else {
        console.log(data.message || "Failed to confirm streak.");
      }
    } catch (err) {
      console.error(err);
      console.log("Error confirming streak.");
    }
  };

  return (
    <div className="calendar-page">
      {/* CALENDAR HEADER */}
      <div className="calendar-header">
        <button className="arrow-button" onClick={handlePrevMonth}>
          &larr;
        </button>
        <h1>
          {currentMonthName} {currentYear}
        </h1>
        <button className="arrow-button" onClick={handleNextMonth}>
          &rarr;
        </button>
        <button className="today-button" onClick={handleToday}>
          Today
        </button>
      </div>

      {/* DAYS ROW */}
      <div className="days-row">
        {daysArray.map((day) => {
          const realToday = new Date();
          const dayIsToday =
            day === realToday.getDate() &&
            currentMonth === realToday.getMonth() &&
            currentYear === realToday.getFullYear();
          const isActive = day === selectedDay;

          dayRefs.current[day - 1] = dayRefs.current[day - 1] || React.createRef();

          return (
            <div
              key={day}
              ref={dayRefs.current[day - 1]}
              className={`day-card ${isActive ? "active" : ""} ${dayIsToday ? "today" : ""}`}
              onClick={() => handleDayClick(day)}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* OUTFIT SECTION */}
      <div className="outfit-section">
        {selectedDay ? (
          dailyOutfit ? (
            <div className="calendar-outfit-card">
              <h2 className="outfit-title">Outfit of the day</h2>
              <div className="outfit-content">
                <div className="outfit-main-image-container">
                  {dailyOutfit.outfitRef?.screenshot && (
                    <img
                      src={dailyOutfit.outfitRef.screenshot}
                      alt="Daily Outfit"
                      className="outfit-main-image"
                    />
                  )}
                </div>
                <div className="outfit-items-panel">
                  {dailyOutfit.outfitRef?.clothingItems?.map((cItem) => {
                    const itemData = cItem.wardrobeItemId;
                    if (!itemData) return null;
                    return (
                      <div key={cItem._id} className="item-container">
                        <div className="single-item-box">
                          <img src={itemData.imageUrl} alt="" className="item-image" />
                        </div>
                        <p className="rewear-right-text">Rewear count: {itemData.wearCount}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="button-container">
                {isToday && (
                  <div className="confirm-outfit-group">
                    <button className="confirm-outfit-btn" onClick={handleConfirmOutfit}>
                      Confirm Outfit
                    </button>
                    <p className="confirm-outfit-reminder">
                      Remember to click "Confirm Outfit" daily to update your streak!
                    </p>
                    {confirmMessage && <p className="confirmation-message">{confirmMessage}</p>}
                  </div>
                )}
                <button className="create-outfit-btn" onClick={() => setIsModalOpen(true)}>
                  Change Outfit
                </button>
                <button className="clear-outfit-btn" onClick={deleteDailyOutfit}>
                  Clear Outfit
                </button>
                <button className="create-outfit-btn" onClick={() => navigate("/create-outfit")}>
                  Create a New Outfit
                </button>
              </div>
            </div>
          ) : (
            <div className="calendar-outfit-card with-bg no-outfit-container">
              <h2>No outfit selected for Day {selectedDay}</h2>
              <div className="button-container side-by-side">
                <button className="create-outfit-btn" onClick={() => setIsModalOpen(true)}>
                  Select Outfit
                </button>
                <button className="create-outfit-btn" onClick={() => navigate("/create-outfit")}>
                  Create a New Outfit
                </button>
              </div>
            </div>
          )
        ) : (
          <p>Please select a day above.</p>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select an Outfit</h2>
              <div className="arrow-buttons">
                <button className="arrow-button" onClick={scrollLeft}>
                  &larr;
                </button>
                <button className="arrow-button" onClick={scrollRight}>
                  &rarr;
                </button>
              </div>
            </div>
            {submittingOutfit && <p className="submitting-message">{submitMessage}</p>}
            <div className="outfit-list" ref={outfitListRef}>
              {outfits.length > 0 ? (
                outfits.map((outfit) => (
                  <div
                    key={outfit._id}
                    className={`calendar-outfit-card outfit-hover ${submittingOutfit ? "disabled" : ""}`}
                    onClick={() => {
                      if (!submittingOutfit) {
                        chooseDailyOutfit(outfit._id);
                      }
                    }}
                  >
                    {outfit.screenshot && (
                      <img src={outfit.screenshot} alt="Outfit" className="outfit-screenshot" />
                    )}
                  </div>
                ))
              ) : (
                <p>No outfits available. Create one!</p>
              )}
            </div>
            <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
