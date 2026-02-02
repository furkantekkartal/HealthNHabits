const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
const profilePicturesDir = path.join(uploadsDir, 'profile_pictures');
const analyzedImagesDir = path.join(uploadsDir, 'analyzed_images');

[uploadsDir, profilePicturesDir, analyzedImagesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Storage configuration for profile pictures
const profilePictureStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, profilePicturesDir);
    },
    filename: (req, file, cb) => {
        const userId = req.user?.userId || 'unknown';
        const timestamp = Date.now();
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `${userId}_${timestamp}${ext}`);
    }
});

// Storage configuration for analyzed food images
const analyzedImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, analyzedImagesDir);
    },
    filename: (req, file, cb) => {
        const userId = req.user?.userId || 'unknown';
        const timestamp = Date.now();
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `${userId}_${timestamp}${ext}`);
    }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
};

// Multer instances
const uploadProfilePicture = multer({
    storage: profilePictureStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: imageFileFilter
});

const uploadAnalyzedImage = multer({
    storage: analyzedImageStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: imageFileFilter
});

// Keep memory storage for AI analysis (needs base64)
const uploadForAnalysis = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Helper to get full URL for a file path
const getFileUrl = (req, filePath) => {
    if (!filePath) return null;

    // If it's already a full URL, return it
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath;
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Convert backslashes to forward slashes for URL
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Ensure we don't have double slashes
    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;

    return `${baseUrl}/${cleanPath}`;
};

// Helper to save base64 image to disk
const saveBase64Image = async (base64Data, directory, filename) => {
    const filePath = path.join(directory, filename);
    const buffer = Buffer.from(base64Data, 'base64');
    await fs.promises.writeFile(filePath, buffer);
    return `uploads/${path.basename(directory)}/${filename}`;
};

module.exports = {
    uploadProfilePicture,
    uploadAnalyzedImage,
    uploadForAnalysis,
    getFileUrl,
    saveBase64Image,
    profilePicturesDir,
    analyzedImagesDir
};
