const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config(); // Fallback to root .env if present
require('express-async-errors');
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const seedAdmin = require('./utils/seedAdmin');
const errorHandler = require('./middleware/errorHandler');
const { initSocketHandlers } = require('./socket/handlers');

// Route imports
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const associationRoutes = require('./routes/associations');
const teamRoutes = require('./routes/teams');
const groundRoutes = require('./routes/grounds');
const bookingRoutes = require('./routes/bookings');
const tournamentRoutes = require('./routes/tournaments');
const fixtureRoutes = require('./routes/fixtures');
const friendlyMatchRoutes = require('./routes/friendlyMatches');
const matchRoutes = require('./routes/matches');
const fundRoutes = require('./routes/funds');
const receiptRoutes = require('./routes/receipts');
const groupRoutes = require('./routes/groups');
const announcementRoutes = require('./routes/announcements');
const notificationRoutes = require('./routes/notifications');
const sportRoutes = require('./routes/sports');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const scoringRoutes = require('./routes/scoring');
const searchRoutes = require('./routes/search');
const uploadRoutes = require('./routes/uploads');
const paymentRoutes = require('./routes/payments');
const expenseRoutes = require('./routes/expenses');
const playerRoutes = require('./routes/players');

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Attach io to app for use in controllers
app.set('io', io);

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' },
  skip: (req) => {
    return (
      req.path.includes('/notifications') ||
      req.path.includes('/live') ||
      req.path.includes('/scorecard') ||
      req.path === '/health'
    );
  }
});

app.use('/api/', generalLimiter);

// Logging & Body Parsing
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/associations', associationRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/grounds', groundRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/tournaments', tournamentRoutes);
app.use('/api/v1/fixtures', fixtureRoutes);
app.use('/api/v1/friendly-matches', friendlyMatchRoutes);
app.use('/api/v1/matches', matchRoutes);
app.use('/api/v1/funds', fundRoutes);
app.use('/api/v1/receipts', receiptRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/sports', sportRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/scoring', scoringRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/players', playerRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use(errorHandler);

// Initialize Socket.IO handlers
initSocketHandlers(io);

const PORT = process.env.PORT || 5000;

// Connect Database before accepting HTTP connections
connectDB().then(async () => {
  await seedAdmin();
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}).catch(err => {
  console.error('[FATAL] Failed to start server:', err);
  process.exit(1);
});

module.exports = { app, server };
