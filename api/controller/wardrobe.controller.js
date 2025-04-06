// api/controller/wardrobe.controller.js
import WardrobeItem from "../models/wardrobeItem.model.js";
import { createError } from "../utils/error.js";
import { fetchImageBase64 } from "../utils/fetchImageBase64.js";
import { removeImageBackground } from "../utils/removeBg.js";
import { uploadImageToFirebase } from "../utils/firebaseUploader.js"; 

// CREATE (Add) a new wardrobe item
export const addWardrobeItem = async (req, res, next) => {
  try {
    const { itemCategory, customCategory, brand, size, datePurchased, imageUrl } = req.body;


    if (!itemCategory || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: itemCategory and imageUrl",
      });
    }
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "User authentication failed",
      });
    }

    // 1) Convert the image URL to base64
    const originalBase64 = await fetchImageBase64(imageUrl);

    // 2) Remove the background
    const cleanedRawBase64 = await removeImageBackground(originalBase64);

    // 3) Ensure the final data has the data URI prefix
    let finalDataUri;
    if (cleanedRawBase64.startsWith("data:")) {
      finalDataUri = cleanedRawBase64;
    } else {
      finalDataUri = `data:image/png;base64,${cleanedRawBase64}`;
    }

    // 4) Upload the cleaned image to Firebase and get its public URL
    const firebasePath = `wardrobe/${Date.now()}_${req.user.id}.png`;
    const publicImageUrl = await uploadImageToFirebase(finalDataUri, firebasePath);

    // 5) Create & store in DB using the public image URL
    const newItem = await WardrobeItem.create({
      itemCategory,
      customCategory: customCategory || "", 
      brand,
      size,
      datePurchased,
      imageUrl: publicImageUrl, 
      userRef: req.user.id,
      wearCount: 0,
    });

    return res.status(201).json({
      success: true,
      wardrobeItem: newItem,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE a wardrobe item
export const deleteWardrobeItem = async (req, res, next) => {
  try {
    const item = await WardrobeItem.findById(req.params.id);
    if (!item) {
      return next(createError(404, "Wardrobe item not found!"));
    }
    if (item.userRef.toString() !== req.user.id) {
      return next(createError(403, "You can only delete your own items!"));
    }
    await WardrobeItem.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Wardrobe item has been deleted!",
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE a wardrobe item
export const updateWardrobeItem = async (req, res, next) => {
  try {
    const item = await WardrobeItem.findById(req.params.id);
    if (!item) {
      return next(createError(404, "Wardrobe item not found!"));
    }
    if (item.userRef.toString() !== req.user.id) {
      return next(createError(403, "You can only update your own items!"));
    }
    const updatedItem = await WardrobeItem.findByIdAndUpdate(
      req.params.id,
      req.body, 
      { new: true }
    );
    return res.status(200).json({
      success: true,
      item: updatedItem,
    });
  } catch (error) {
    next(error);
  }
};

// GET a single wardrobe item
export const getWardrobeItem = async (req, res, next) => {
  try {
    const item = await WardrobeItem.findById(req.params.id);
    if (!item) {
      return next(createError(404, "Wardrobe item not found!"));
    }
    if (item.userRef.toString() !== req.user.id) {
      return next(createError(403, "You can only view your own items!"));
    }
    return res.status(200).json({
      success: true,
      item,
    });
  } catch (error) {
    next(error);
  }
};

// GET all wardrobe items for the current user
export const getWardrobeItems = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "User authentication failed",
      });
    }

    const items = await WardrobeItem.find({ userRef: req.user.id });

    // Log image sizes
    items.forEach((item, i) => {
      console.log(`Item #${i} image length: ${item.imageUrl?.length || 0}`);
    });

    return res.status(200).json({
      success: true,
      items,
    });
  } catch (error) {
    next(error);
  }
};

// GET top 3 most worn & bottom 3 least worn items (including wearCount)
export const getWearStatistics = async (req, res, next) => {
  try {
    const items = await WardrobeItem.find({ userRef: req.user.id });
    if (!items || items.length === 0) {
      return res.status(200).json({
        success: true,
        mostWorn: [],
        leastWorn: [],
      });
    }

    // Sort descending by wearCount for most worn
    const sortedDesc = [...items].sort((a, b) => b.wearCount - a.wearCount);
    const top3MostWorn = sortedDesc.slice(0, 3);

    // Sort ascending by wearCount for least worn
    const sortedAsc = [...items].sort((a, b) => a.wearCount - b.wearCount);
    const bottom3LeastWorn = sortedAsc.slice(0, 3);

    return res.status(200).json({
      success: true,
      mostWorn: top3MostWorn,
      leastWorn: bottom3LeastWorn,
    });
  } catch (error) {
    next(error);
  }
};
