import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../models/User/userRepository';
import { UserProfilePictureRepository } from '../models/UserProfilePicture/UserProfilePictureRepository';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { mapUserToUserResponse } from '../models/User/userRepositoryDataMapper';
import { sendSuccess } from '../../../shared/utils/successHandler';
import { AppError } from '../../../shared/utils/errorHandler';

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user || '';
    const { name } = req.body;

    if (!name || !name.trim()) {
      throw new AppError(400, 'BAD_REQUEST', 'Name is required', 'Name cannot be blank.');
    }

    const nameParts = name.trim().split(/\s+/);
    const fname = nameParts[0] || '';
    const lname = nameParts.slice(1).join(' ') || '';

    const updatedUser = await UserRepository.updateProfile(userId, fname, lname);
    if (!updatedUser) {
      throw new AppError(404, 'NOT_FOUND', 'User not found', 'User not found');
    }

    sendSuccess(res, mapUserToUserResponse(updatedUser), 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const uploadProfilePicture = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user || '';
    const file = req.file;

    if (!file) {
      throw new AppError(400, 'MISSING_FILE', 'No file uploaded', 'Please select a profile picture to upload.');
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(file.buffer, 'avatars');

    // Save to DB (this also updates user's current avatar)
    await UserProfilePictureRepository.saveProfilePicture(userId, result.url, result.public_id);

    // Fetch the updated user
    const updatedUser = await UserRepository.findById(userId);
    if (!updatedUser) {
      throw new AppError(404, 'NOT_FOUND', 'User not found', 'User not found');
    }

    sendSuccess(res, mapUserToUserResponse(updatedUser), 'Profile picture uploaded successfully');
  } catch (error) {
    next(error);
  }
};

export const getProfilePictures = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user || '';
    const pictures = await UserProfilePictureRepository.getProfilePictures(userId);
    sendSuccess(res, pictures, 'Profile pictures retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const selectProfilePicture = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user || '';
    const { id: pictureId } = req.params;

    if (!pictureId) {
      throw new AppError(400, 'BAD_REQUEST', 'Picture ID is required', 'Picture selection failed.');
    }

    // Select the picture in the database
    await UserProfilePictureRepository.selectProfilePicture(userId, pictureId);

    // Fetch the updated user
    const updatedUser = await UserRepository.findById(userId);
    if (!updatedUser) {
      throw new AppError(404, 'NOT_FOUND', 'User not found', 'User not found');
    }

    sendSuccess(res, mapUserToUserResponse(updatedUser), 'Profile picture selected successfully');
  } catch (error) {
    next(error);
  }
};
