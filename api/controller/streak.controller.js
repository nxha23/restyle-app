import User from "../models/user.model.js";
import DailyOutfit from "../models/dailyOutfit.model.js";

/**
 * Helper to check if two dates are consecutive (ignoring time)
 * @param {Date} dateA - The first date
 * @param {Date} dateB - The second date (should be after dateA)
 * @returns {Boolean} - True if dateB is exactly one day after dateA
 */
function isConsecutiveDay(dateA, dateB) {
  const dayA = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
  const dayB = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());
  const oneDayMs = 24 * 60 * 60 * 1000;
  return dayB - dayA === oneDayMs;
}

export const getStreak = async (req, res) => {
  try {
    // Use req.user.id as set in your verifyToken middleware
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    return res.json({
      success: true,
      streak: user.streakCount,
      lastStreakDate: user.lastStreakDate,
    });
  } catch (error) {
    console.error("Error in getStreak:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};

export const confirmStreak = async (req, res) => {
  try {
    // Use req.user.id to find the user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Get today's date as YYYY-MM-DD
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];

    // Check that a daily outfit exists for today.
    const dailyOutfit = await DailyOutfit.findOne({
      userId: user._id, 
      date: dateStr,
    });
    if (!dailyOutfit) {
      return res.status(400).json({
        success: false,
        message: "No daily outfit found for today. Confirmation failed.",
      });
    }

    // Update streak: if lastStreakDate exists and is yesterday, increment; otherwise reset to 1.
    if (!user.lastStreakDate) {
      user.streakCount = 1;
    } else {
      const lastDate = new Date(
        user.lastStreakDate.getFullYear(),
        user.lastStreakDate.getMonth(),
        user.lastStreakDate.getDate()
      );
      const currentDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      if (isConsecutiveDay(lastDate, currentDate)) {
        user.streakCount++;
      } else {
        user.streakCount = 1;
      }
    }

    // Save the confirmation date and updated streak count.
    user.lastStreakDate = today;
    await user.save();

    return res.json({
      success: true,
      message: "Streak confirmed for today!",
      streakCount: user.streakCount,
    });
  } catch (error) {
    console.error("Error in confirmStreak:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};
