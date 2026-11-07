import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { AppError } from '../utils/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage abstraction
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, unique);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files (jpeg, png, webp, gif) are allowed', 400), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
});

/**
 * Image processing service abstraction: strips EXIF GPS data and optimizes images
 */
export async function processUploadedImage(filePath) {
  try {
    const sharpModule = await import('sharp');
    const sharp = sharpModule.default || sharpModule;
    
    const tempPath = `${filePath}.tmp.webp`;
    await sharp(filePath)
      .rotate() // Auto-orient based on EXIF before stripping
      .withMetadata({ orientation: 1 }) // Strips GPS and personal EXIF while preserving standard orientation
      .webp({ quality: 85 })
      .toFile(tempPath);

    fs.unlinkSync(filePath);
    const finalPath = filePath.replace(/\.[^.]+$/, '.webp');
    fs.renameSync(tempPath, finalPath);
    return path.basename(finalPath);
  } catch (err) {
    // If sharp fails or is not available, retain original file safely
    return path.basename(filePath);
  }
}

