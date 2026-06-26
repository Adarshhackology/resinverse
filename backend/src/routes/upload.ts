import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Use memory storage so we can convert to Base64 directly and store in DB
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  },
});

// Helper: try Cloudinary upload if credentials are set, else return base64 Data URL (stored in DB)
async function uploadToCloudinaryOrBase64(file: Express.Multer.File, userId: string): Promise<{ url: string; publicId: string }> {
  // If Cloudinary is configured, use it
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    try {
      const { v2: cloudinary } = await import('cloudinary');
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `resinverse/${userId}`,
            resource_type: 'auto',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          },
          (error, result) => error ? reject(error) : resolve(result)
        );
        stream.end(file.buffer);
      });
      return { url: result.secure_url, publicId: result.public_id };
    } catch (err) {
      console.warn('Cloudinary upload failed, falling back to Base64:', err);
    }
  }

  // Fallback: Convert file buffer to Base64 Data URL so it is stored directly in the database
  const b64 = file.buffer.toString('base64');
  const mime = file.mimetype;
  const dataUrl = `data:${mime};base64,${b64}`;
  
  return { url: dataUrl, publicId: `local-${Date.now()}` };
}

// POST /api/upload/image
router.post('/image', authenticate, upload.single('file'), async (req: AuthRequest & Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  try {
    const result = await uploadToCloudinaryOrBase64(req.file, req.user!.id);
    return res.json(result);
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

// POST /api/upload/images (multiple)
router.post('/images', authenticate, upload.array('files', 10), async (req: AuthRequest & Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files?.length) return res.status(400).json({ error: 'No files provided' });
  try {
    const results = await Promise.all(files.map(f => uploadToCloudinaryOrBase64(f, req.user!.id)));
    return res.json({ urls: results.map(r => r.url), publicIds: results.map(r => r.publicId) });
  } catch (err) {
    console.error('Upload multiple error:', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
