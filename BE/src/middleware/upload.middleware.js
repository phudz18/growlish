const multer = require('multer');


const ALLOWED_IMAGE_TYPES = /^image\/(jpeg|jpg|png|gif|webp)$/;
const ALLOWED_AUDIO_TYPES = /^audio\/(mpeg|mp3|wav|ogg|m4a|webm)$/;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;  
const MAX_AUDIO_SIZE = 20 * 1024 * 1024; 


const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (jpeg, png, gif, webp)'));
    }
  }
}).single('avatar');


const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AUDIO_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_AUDIO_TYPES.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file âm thanh (mp3, wav, ogg, m4a)'));
    }
  }
}).single('audio');


function wrapMulter(multerMiddleware) {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `Lỗi upload: ${err.message}` });
      }
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  };
}

module.exports = {
  uploadAvatar: wrapMulter(uploadAvatar),
  uploadAudio: wrapMulter(uploadAudio),
};