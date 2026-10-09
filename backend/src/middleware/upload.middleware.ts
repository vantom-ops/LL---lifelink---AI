import multer from 'multer';

// Use memory storage so OCR and storage abstractions can handle the buffer uniformly
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB max
  },
  fileFilter: (_req, file, cb) => {
    // Allow images, PDFs, medical scan formats (including AVIF, BMP, HEIC, TIFF)
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/bmp',
      'image/x-ms-bmp',
      'image/tiff',
      'image/heic',
      'image/heif',
      'image/gif',
      'application/pdf',
      'application/dicom',
      'application/octet-stream'
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(jpg|jpeg|png|webp|avif|bmp|tiff|tif|heic|heif|gif|pdf|dcm)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload an image (JPG, PNG, WEBP, AVIF, TIFF, BMP) or PDF.'));
    }
  }
});
