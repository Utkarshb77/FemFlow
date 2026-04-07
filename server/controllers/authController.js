const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, dateOfBirth } = req.body;

    console.log('Registration attempt for:', email);

    // Validate required fields
    if (!name || !email || !password) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({ name, email, password, dateOfBirth });
    console.log('✓ User created successfully:', user._id);
    
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        averageCycleLength: user.averageCycleLength,
        averagePeriodLength: user.averagePeriodLength,
      },
    });
  } catch (error) {
    console.error('✗ Registration error:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for:', email);

    if (!email || !password) {
      console.log('Validation failed: Missing credentials');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('✓ Login successful:', user._id);
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        averageCycleLength: user.averageCycleLength,
        averagePeriodLength: user.averagePeriodLength,
      },
    });
  } catch (error) {
    console.error('✗ Login error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        dateOfBirth: req.user.dateOfBirth,
        averageCycleLength: req.user.averageCycleLength,
        averagePeriodLength: req.user.averagePeriodLength,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
