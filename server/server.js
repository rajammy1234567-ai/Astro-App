require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const seedDatabase = require('./utils/seedData');
const initSocket = require('./sockets/socketServer');
const { isEmailConfigured } = require('./utils/emailService');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await seedDatabase();

  const server = http.createServer(app);
  initSocket(server);

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use.`);
      console.error('   Another server instance is running. Fix:');
      console.error(`   Windows: netstat -ano | findstr :${PORT}  then  taskkill /PID <pid> /F`);
      console.error('   Or close the other terminal running "npm run dev"\n');
      process.exit(1);
    }
    throw err;
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Astro App API running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log('   💾 Admin data permanently saved — edit/delete only from admin panel');
    if (isEmailConfigured()) {
      console.log(`   Gmail OTP: ✅ enabled (${process.env.SMTP_USER})`);
    } else {
      console.log('   Gmail OTP: ⚠️  not configured — email login uses dev OTP');
      console.log('   Add SMTP_USER + SMTP_PASS in server/.env (see .env.example)');
    }
    console.log(`   Dev OTP fallback: ${process.env.DEV_OTP || '123456'}\n`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});