// controller/dailyOutfit.controller.js
import DailyOutfit from "../models/dailyOutfit.model.js";
import Outfit from "../models/outfit.model.js";
import WardrobeItem from "../models/wardrobeItem.model.js";
import { createError } from "../utils/error.js";

/**
 * Assign an outfit to a given date (upsert).
 * Body: { date: "YYYY-MM-DD", outfitId: "..." }
 */
export const setDailyOutfit = async (req, res, next) => {
  try {
    const { date, outfitId } = req.body;
    if (!date || !outfitId) {
      return next(createError(400, "Missing date or outfitId"));
    }

    // 1) Check that the outfit belongs to the user and populate its clothing items
    const outfit = await Outfit.findById(outfitId).populate("clothingItems.wardrobeItemId");
    if (!outfit) {
      return next(createError(404, "Outfit not found"));
    }
    if (outfit.userRef.toString() !== req.user.id) {
      return next(createError(403, "You do not own this outfit"));
    }

    // 2) Convert the date string to a Date object
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return next(createError(400, "Invalid date format"));
    }

    // 3) Upsert a record in DailyOutfit for this date
    const dailyOutfit = await DailyOutfit.findOneAndUpdate(
      { userRef: req.user.id, date: dateObj },
      { userRef: req.user.id, date: dateObj, outfitRef: outfitId },
      { upsert: true, new: true }
    );

    // 4) Increment wearCount for each item in the chosen outfit
    await Promise.all(
      outfit.clothingItems.map(async (cItem) => {
        const itemId =
          typeof cItem.wardrobeItemId === "object" && cItem.wardrobeItemId._id
            ? cItem.wardrobeItemId._id
            : cItem.wardrobeItemId;
        await WardrobeItem.findByIdAndUpdate(itemId, { $inc: { wearCount: 1 } });
      })
    );

    // 5) Re-populate the dailyOutfit with updated outfit details (including updated wearCount)
    const updatedDailyOutfit = await DailyOutfit.findById(dailyOutfit._id).populate({
      path: "outfitRef",
      populate: {
        path: "clothingItems.wardrobeItemId",
      },
    });

    res.status(200).json({ success: true, dailyOutfit: updatedDailyOutfit });
  } catch (error) {
    next(error);
  }
};

/**
 * Get the daily outfit for a specific date.
 * Example: GET /api/dailyOutfit/get/2025-03-14
 */
export const getDailyOutfit = async (req, res, next) => {
  try {
    const dateStr = req.params.date;
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) {
      return next(createError(400, "Invalid date format"));
    }

    const dailyOutfit = await DailyOutfit.findOne({
      userRef: req.user.id,
      date: dateObj,
    }).populate({
      path: "outfitRef",
      populate: {
        path: "clothingItems.wardrobeItemId",
      },
    });

    res.status(200).json({
      success: true,
      dailyOutfit: dailyOutfit || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete (clear) the daily outfit for a specific date, and decrement wearCount for each item.
 * Example: DELETE /api/dailyOutfit/delete/2025-03-14
 */
export const deleteDailyOutfit = async (req, res, next) => {
  try {
    const dateStr = req.params.date;
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) {
      return next(createError(400, "Invalid date format"));
    }

    // 1) Find the daily outfit doc so we know which outfitRef was assigned
    const existingDailyOutfit = await DailyOutfit.findOne({
      userRef: req.user.id,
      date: dateObj,
    }).populate({
      path: "outfitRef",
      populate: {
        path: "clothingItems.wardrobeItemId",
      },
    });

    if (!existingDailyOutfit) {
      return next(createError(404, "No daily outfit found for this date"));
    }

    // 2) Decrement wearCount for each item in that assigned outfit
    if (existingDailyOutfit.outfitRef) {
      const outfitItems = existingDailyOutfit.outfitRef.clothingItems || [];
      await Promise.all(
        outfitItems.map(async (cItem) => {
          const itemData = cItem.wardrobeItemId;
          if (!itemData) return;
          await WardrobeItem.findByIdAndUpdate(itemData._id, { $inc: { wearCount: -1 } });
        })
      );
    }

    // 3) Now delete the daily outfit record
    await DailyOutfit.findByIdAndDelete(existingDailyOutfit._id);

    res.status(200).json({ success: true, message: "Daily outfit deleted successfully" });
  } catch (error) {
    next(error);
  }
};
