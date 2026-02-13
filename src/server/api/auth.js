import express from 'express';
import jwt from 'jsonwebtoken';
import passport from '../config/passport.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth flow
 */
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  session: false 
}));

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/login?error=auth_failed' 
  }),
  (req, res) => {
    // Generate JWT token
    const token = generateToken(req.user);
    
    // Determine frontend URL
    let frontendUrl = process.env.FRONTEND_URL;
    
    // If not set, fallback to current host (for production)
    if (!frontendUrl) {
      const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const host = req.headers.host || req.hostname;
      frontendUrl = `${protocol}://${host}`;
    }
    
    console.log('OAuth redirect to:', frontendUrl);
    res.redirect(`${frontendUrl}/?token=${token}`);
  }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info (requires valid JWT)
 */
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const token = authHeader.substring(7);
  
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    res.json({
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role || 'user', // Include role from token
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout (client-side token deletion)
 */
router.post('/logout', (req, res) => {
  // With JWT, logout is mainly client-side (delete token)
  // But we can implement token blacklisting if needed
  res.json({ message: 'Logged out successfully' });
});

export default router;
