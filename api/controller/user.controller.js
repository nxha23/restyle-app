// api/controller/user.controller.js
import bcryptjs from 'bcryptjs';
import User from '../models/user.model.js';
import { createError } from '../utils/error.js';

export const test = (req, res) => {
  res.json({ message: 'API route is working!' });
};

export const updateUser = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(createError(401, 'You can only update your own account!'));
  }
  try {
    if (req.body.password) {
      req.body.password = bcryptjs.hashSync(req.body.password, 10);
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          username: req.body.username,
          email: req.body.email,
          password: req.body.password,
          avatar: req.body.avatar,
        },
      },
      { new: true }
    );
    const { password, ...rest } = updatedUser._doc;
    res.status(200).json({
      success: true,
      user: rest,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(createError(401, 'You can only delete your own account!'));
  }
  try {
    await User.findByIdAndDelete(req.params.id);
    res.clearCookie('access_token');
    res.status(200).json({
      success: true,
      message: 'User has been deleted!',
    });
  } catch (error) {
    next(error);
  }
};

export const getUserListings = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(createError(401, 'You can only view your own listings!'));
  }
  try {
    const listings = await Listing.find({ userRef: req.params.id });
    res.status(200).json({
      success: true,
      listings,
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(createError(404, 'User not found!'));
    }
    const { password, ...rest } = user._doc;
    res.status(200).json({
      success: true,
      user: rest,
    });
  } catch (error) {
    next(error);
  }
};

// If you want "getUserWardrobeItems"
import WardrobeItem from '../models/wardrobeItem.model.js';

export const getUserWardrobeItems = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(createError(401, 'You can only view your own wardrobe items!'));
  }
  try {
    const items = await WardrobeItem.find({ userRef: req.params.id });
    res.status(200).json({
      success: true,
      items,
    });
  } catch (error) {
    next(error);
  }
};
