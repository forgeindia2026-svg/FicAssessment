const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fic_assessment_super_secret_jwt_key_2026', {
    expiresIn: '7d'
  });
};

// Seed default Admin if no admin@fic.com exists
const seedDefaultAdmin = async () => {
  try {
    const defaultEmail = 'admin@fic.com';
    const existingAdmin = await Admin.findOne({ email: defaultEmail });
    if (!existingAdmin) {
      const defaultPassword = 'admin123';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(defaultPassword, salt);

      await Admin.create({
        email: defaultEmail,
        passwordHash
      });
      console.log(`Default Admin created: ${defaultEmail} / ${defaultPassword}`);
    }
  } catch (err) {
    console.error('Error seeding default admin:', err.message);
  }
};

// POST /api/auth/login
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  res.json({
    _id: admin._id,
    email: admin.email,
    token: generateToken(admin._id)
  });
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({
    _id: req.admin._id,
    email: req.admin.email
  });
};

module.exports = {
  loginAdmin,
  getMe,
  seedDefaultAdmin
};
