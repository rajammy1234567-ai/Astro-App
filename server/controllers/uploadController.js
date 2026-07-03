const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function parseImagePayload(body) {
  const raw = body?.image || body?.data;
  if (!raw || typeof raw !== 'string') return null;

  const match = raw.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (match) {
    return { mime: match[1].toLowerCase(), base64: match[2] };
  }

  if (body?.mimeType && ALLOWED.has(body.mimeType.toLowerCase())) {
    return { mime: body.mimeType.toLowerCase(), base64: raw };
  }

  return null;
}

function buildPublicUrl(req, filename) {
  const host = req.get('host');
  const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
  return `${proto}://${host}/uploads/${filename}`;
}

exports.uploadImage = async (req, res) => {
  try {
    const parsed = parseImagePayload(req.body);
    if (!parsed) {
      return res.status(400).json({ message: 'Invalid image data. Send base64 or data URL.' });
    }

    if (!ALLOWED.has(parsed.mime)) {
      return res.status(400).json({ message: 'Only JPEG, PNG, WebP, and GIF images are allowed.' });
    }

    const buffer = Buffer.from(parsed.base64, 'base64');
    if (!buffer.length) {
      return res.status(400).json({ message: 'Empty image file.' });
    }
    if (buffer.length > MAX_BYTES) {
      return res.status(400).json({ message: 'Image too large. Max 8 MB.' });
    }

    ensureUploadsDir();
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${EXT[parsed.mime]}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);

    const url = buildPublicUrl(req, filename);
    return res.json({ url, filename });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ message: 'Failed to upload image.' });
  }
};