// controller/outfit.controller.js

import Outfit from "../models/outfit.model.js";
import WardrobeItem from "../models/wardrobeItem.model.js";
import { createError } from "../utils/error.js";

/**
 * Create an outfit with clothing items and a screenshot.
 */
export const createOutfit = async (req, res, next) => {
  try {
    const { clothingItems, screenshot } = req.body;

    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return next(createError(401, "User authentication required"));
    }

    // Validate we have an array of items
    if (!Array.isArray(clothingItems) || clothingItems.length === 0) {
      return next(createError(400, "No items selected"));
    }

    // Validate each clothing item: it must have an ID, x, and y
    const validatedItems = await Promise.all(
      clothingItems.map(async (item) => {
        if (!item.wardrobeItemId || item.x === undefined || item.y === undefined) {
          throw createError(400, "Missing wardrobeItemId or position (x, y).");
        }
        const wardrobeItem = await WardrobeItem.findById(item.wardrobeItemId);
        if (!wardrobeItem) {
          throw createError(404, `Wardrobe item ${item.wardrobeItemId} not found.`);
        }
        return {
          wardrobeItemId: wardrobeItem._id,
          x: item.x,
          y: item.y,
        };
      })
    );

    // Create the outfit document
    const newOutfit = new Outfit({
      userRef: req.user.id,
      clothingItems: validatedItems,
      screenshot, // base64 screenshot or URL
    });

    await newOutfit.save();

    // Increment the wearCount for each wardrobe item used
    for (const item of validatedItems) {
      await WardrobeItem.findByIdAndUpdate(item.wardrobeItemId, {
        $inc: { wearCount: 1 },
      });
    }

    res.status(201).json({
      success: true,
      outfit: newOutfit,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch all outfits for the logged-in user.
 */
export const getAllOutfits = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return next(createError(401, "User authentication required"));
    }

    // Populate the outfit items so we can see their imageUrl, wearCount, etc.
    const outfits = await Outfit.find({ userRef: req.user.id }).populate({
      path: "clothingItems.wardrobeItemId",
      select: "imageUrl itemCategory brand size wearCount", 
    });

    res.status(200).json({
      success: true,
      outfits,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an outfit if the user owns it.
 */
export const deleteOutfit = async (req, res, next) => {
  try {
    const outfit = await Outfit.findById(req.params.id);
    if (!outfit) {
      return next(createError(404, "Outfit not found!"));
    }

    // Only the owner of the outfit can delete it
    if (outfit.userRef.toString() !== req.user.id) {
      return next(createError(403, "Unauthorized: You can only delete your own outfits!"));
    }

    await Outfit.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Outfit deleted successfully!",
    });
  } catch (error) {
    next(error);
  }
};
