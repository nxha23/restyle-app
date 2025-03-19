// src/pages/CalendarPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "../styles/CalendarPage.css"; // Ensure this path is correct

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CalendarPage() {
  const [outfits, setOutfits] = useState([]);
  const [dailyOutfit, setDailyOutfit] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  const dayRefs = useRef([]);
  const outfitListRef = useRef(null);

  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  // 1) Fetch all outfits
  useEffect(() => {
    if (!currentUser || !token) return;
    fetch("/api/outfit/all", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOutfits(data.outfits);
        }
      })
      .catch((err) => console.error(err));
  }, [currentUser, token]);

  // 2) Fetch daily outfit when selected day changes
  useEffect(() => {
    if (!selectedDay || !token) {
      setDailyOutfit(null);
      return;
    }
    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;

    fetch(`/api/dailyOutfit/get/${dateStr}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDailyOutfit(data.dailyOutfit);
        } else {
          setDailyOutfit(null);
        }
      })
      .catch((err) => console.error(err));
  }, [selectedDay, viewDate, token]);

  // 3) Fetch current streak from backend
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

  // Auto-scroll the selected day
  useEffect(() => {
    if (selectedDay && dayRefs.current[selectedDay - 1]?.current) {
      dayRefs.current[selectedDay - 1].current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedDay]);

  // POST to assign outfit
  const chooseDailyOutfit = (outfitId) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
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
          setIsModalOpen(false);
        } else {
          console.error("Failed to set daily outfit:", data.message);
        }
      })
      .catch((err) => console.error(err));
  };

  // DELETE to clear outfit
  const deleteDailyOutfit = () => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
    fetch(`/api/dailyOutfit/delete/${dateStr}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDailyOutfit(null);
        } else {
          console.error("Failed to delete daily outfit:", data.message);
        }
      })
      .catch((err) => console.error(err));
  };

  // Horizontal scroll in the modal
  const scrollLeft = () => {
    outfitListRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  };
  const scrollRight = () => {
    outfitListRef.current?.scrollBy({ left: 300, behavior: "smooth" });
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
        console.log(`Streak confirmed! Current streak: ${data.streakCount} days.`);
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

          dayRefs.current[day - 1] =
            dayRefs.current[day - 1] || React.createRef();

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
            // IF WE HAVE A DAILY OUTFIT
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
                          <img
                            src={itemData.imageUrl}
                            alt=""
                            className="item-image"
                          />
                        </div>
                        <p className="rewear-right-text">
                          Rewear count: {itemData.wearCount}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="button-container">
                {isToday && (
                  <button
                    className="confirm-outfit-btn"
                    onClick={handleConfirmOutfit}
                  >
                    Confirm Outfit
                  </button>
                )}
                <button
                  className="create-outfit-btn"
                  onClick={() => setIsModalOpen(true)}
                >
                  Change Outfit
                </button>
                <button className="clear-outfit-btn" onClick={deleteDailyOutfit}>
                  Clear Outfit
                </button>
                <button
                  className="create-outfit-btn"
                  onClick={() => navigate("/create-outfit")}
                >
                  Create a New Outfit
                </button>
              </div>
            </div>
          ) : (
            // IF NO OUTFIT SELECTED
            <div className="calendar-outfit-card with-bg no-outfit-container">
              <h2>No outfit selected for Day {selectedDay}</h2>
              <div className="button-container side-by-side">
                <button
                  className="create-outfit-btn"
                  onClick={() => setIsModalOpen(true)}
                >
                  Select Outfit
                </button>
                <button
                  className="create-outfit-btn"
                  onClick={() => navigate("/create-outfit")}
                >
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
            {/* Modal Header */}
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

            {/* Outfit list */}
            <div className="outfit-list" ref={outfitListRef}>
              {outfits.length > 0 ? (
                outfits.map((outfit) => (
                  <div
                    key={outfit._id}
                    className="calendar-outfit-card"
                    onClick={() => chooseDailyOutfit(outfit._id)}
                  >
                    {outfit.screenshot && (
                      <img
                        src={outfit.screenshot}
                        alt="Outfit"
                        className="outfit-screenshot"
                      />
                    )}
                  </div>
                ))
              ) : (
                <p>No outfits available. Create one!</p>
              )}
            </div>

            <button
              className="close-modal-btn"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
