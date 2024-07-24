const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']; // Get the Authorization header
  const token = authHeader && authHeader.split(' ')[1]; // Extract Bearer Token. The authorization header typically follows the format Bearer <token>

  if (token == null) return res.sendStatus(401); // No Token, return HTTP 401 status code, indicating Unauthorized

  // Verify the Token
  // 'your-secret-key' is the secret key used to sign and verify the Token
  // The third parameter is a callback function that will be called once verification is complete
  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) return res.sendStatus(403); // If verification fails (e.g., Token is invalid or expired), return HTTP 403 status code, indicating Forbidden
    req.user = user; // If verification is successful, store the decoded user information in the user property of the request object
    next(); // Pass control to the next middleware function or route handler
  });
};

module.exports = authenticateToken;