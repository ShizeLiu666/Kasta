const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../database'); 

router.post('/get_token', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username, password });
    if (user) {
      const token = jwt.sign({ username }, 'your-secret-key', { expiresIn: '4h' });
      return res.status(200).json({ token });
    } else {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;