const crypto = require('crypto');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']; // get the Authorization header
  const token = authHeader && authHeader.split(' ')[1]; // extract Bearer Token. The authorization header typically follows the format Bearer <token>

  if (token == null) return res.sendStatus(401); // if no token, return HTTP 401

  const validateToken = (token) => {
    try {
      const parts = token.split(':');
      const iv = Buffer.from(parts[0], 'hex'); // 从token中提取IV
      const encryptedToken = parts[1];
      const key = crypto.createHash('sha256').update('your-secret-key').digest();
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      const timestamp = parseInt(decrypted, 10);
      const now = Date.now();
      const oneHour = 3600000;

      if (now - timestamp > oneHour) {
        return false; // Token expired
      }
      return true; // Token is valid
    } catch (error) {
      return false; // Token is invalid
    }
  };

  if (!validateToken(token)) return res.sendStatus(403);

  next();
};

module.exports = authenticateToken;

// const jwt = require('jsonwebtoken');

// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization']; // Get the Authorization header
//   const token = authHeader && authHeader.split(' ')[1]; // Extract Bearer Token. The authorization header typically follows the format Bearer <token>

//   if (token == null) return res.sendStatus(401); // No Token, return HTTP 401 status code, indicating Unauthorized

//   // Verify the Token
//   // 'your-secret-key' is the secret key used to sign and verify the Token
//   // The third parameter is a callback function that will be called once verification is complete
//   jwt.verify(token, 'your-secret-key', (err, user) => {
//     if (err) return res.sendStatus(403); // If verification fails (e.g., Token is invalid or expired), return HTTP 403 status code, indicating Forbidden
//     req.user = user; // If verification is successful, store the decoded user information in the user property of the request object
//     next(); // Pass control to the next middleware function or route handler
//   });
// };

// module.exports = authenticateToken;