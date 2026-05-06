import { Request, Response, NextFunction } from 'express';
import { ClerkExpressRequireAuth, StrictAuthProp } from '@clerk/clerk-sdk-node';
import { pool } from '../db';

// Extend Express Request type to include auth and user properties
declare global {
  namespace Express {
    interface Request extends StrictAuthProp {
      user?: any;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Use Clerk's built-in middleware to cryptographically verify the token signature
  ClerkExpressRequireAuth()(req, res, async (err: any) => {
    if (err) {
      console.error('Clerk Auth Error:', err);
      return res.status(401).json({ error: 'Unauthorized: Invalid Token' });
    }

    try {
      // req.auth is guaranteed to be securely populated by Clerk
      const clerkUserId = req.auth?.userId;

      if (!clerkUserId) {
        return res.status(401).json({ error: 'Unauthorized: No User ID in Token' });
      }

      // Fetch user from DB
      const result = await pool.query('SELECT * FROM users WHERE clerk_user_id = $1', [clerkUserId]);
      
      // Attach user to req to check roles in subsequent middlewares
      if (result.rows.length > 0) {
        req.user = result.rows[0];
      }

      next();
    } catch (dbError) {
      console.error('Database error during auth', dbError);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(403).json({ error: 'Forbidden: User not found in database. Please onboard.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient role.' });
    }

    next();
  };
};
