const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const cycleRoutes = require('./routes/cycles');
const logRoutes = require('./routes/logs');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cycles', cycleRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FemFlow API is running' });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

// Add mongoose connection event listeners for better debugging
mongoose.connection.on('connected', () => {
  console.log('✓ MongoDB connection established successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('✗ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠ MongoDB disconnected');
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✓ Mongoose connected to MongoDB Atlas');
    console.log('Database:', mongoose.connection.name);
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('✗ MongoDB connection error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  });
