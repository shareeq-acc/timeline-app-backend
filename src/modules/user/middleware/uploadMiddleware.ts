import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { AppError } from '../../../shared/utils/errorHandler';

const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(
      400,
      'INVALID_FILE_TYPE',
      'Unsupported file format. Please upload JPG, PNG, or WEBP.',
      'Unsupported format. Please select an image (JPG, PNG, WEBP).'
    ));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter,
});

export const uploadAvatarMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const uploadSingle = upload.single('avatar'); // Expect field name 'avatar'
  
  uploadSingle(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError(
          400,
          'FILE_TOO_LARGE',
          'File size limit exceeded. Max 2MB allowed.',
          'Image is too large. Choose an image under 2MB.'
        ));
      }
      return next(err);
    }
    next();
  });
};
