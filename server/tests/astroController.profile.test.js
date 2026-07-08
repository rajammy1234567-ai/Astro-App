const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const astroController = require('../controllers/astroController');
const Astrologer = require('../models/Astrologer');

let mongoServer;

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

test.after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test('updateProfile auto-publishes a newly completed astrologer profile', async () => {
  const astrologer = await Astrologer.create({
    name: 'Test Astrologer',
    phone: '9999999999',
    password: 'password123',
    pricePerMin: 20,
    isPublished: false,
    approvedViaApplication: true,
    isOnline: false,
  });

  const req = {
    astrologer: {
      _id: astrologer._id,
      pricePerMin: 20,
      approvedViaApplication: true,
      isPublished: false,
    },
    body: {
      name: 'Updated Name',
      bio: 'A great astrologer',
      specialty: 'Vedic',
      image: 'https://example.com/photo.jpg',
      languages: ['English', 'Hindi'],
      experience: 5,
      chatEnabled: true,
      callEnabled: true,
      pricingPackages: [{ minutes: 1, price: 25 }],
    },
  };

  const res = {
    json(payload) {
      this.payload = payload;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
  };

  await astroController.updateProfile(req, res);

  assert.equal(res.statusCode, undefined);
  assert.equal(res.payload.isPublished, true);

  const saved = await Astrologer.findById(astrologer._id);
  assert.equal(saved.isPublished, true);
  assert.equal(saved.name, 'Updated Name');
});
