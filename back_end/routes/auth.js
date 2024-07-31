const express = require('express');
const router = express.Router();
const { User } = require('../database'); // 确保路径正确
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 获取 token
router.post('/get_token', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, 'your-secret-key', { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Error in /api/auth/get_token:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;