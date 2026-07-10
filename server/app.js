const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const astrologerRoutes = require('./routes/astrologerRoutes');
const walletRoutes = require('./routes/walletRoutes');
const blogRoutes = require('./routes/blogRoutes');
const storeRoutes = require('./routes/storeRoutes');
const orderRoutes = require('./routes/orderRoutes');
const newsRoutes = require('./routes/newsRoutes');
const poojaRoutes = require('./routes/poojaRoutes');
const supportRoutes = require('./routes/supportRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const freeServiceRoutes = require('./routes/freeServiceRoutes');
const giftCardRoutes = require('./routes/giftCardRoutes');
const followingRoutes = require('./routes/followingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const astroRoutes = require('./routes/astroRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const agoraRoutes = require('./routes/agoraRoutes');
const liveRoutes = require('./routes/liveRoutes');
const astrologerApplicationRoutes = require('./routes/astrologerApplicationRoutes');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Astro App API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/astrologers', astrologerRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/pooja', poojaRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/free-services', freeServiceRoutes);
app.use('/api/gift-cards', giftCardRoutes);
app.use('/api/following', followingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/astro', astroRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/agora', agoraRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/astrologer-applications', astrologerApplicationRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app;