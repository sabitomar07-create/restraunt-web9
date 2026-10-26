import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { db } from './db.ts';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  defaultAddress?: string;
  role: 'customer' | 'admin';
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Creates a cryptographically random session token valid for 30 days.
 */
export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO sessions (token, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).run(token, userId, expiresAt, now);

  return token;
}

/**
 * Validates a session token and returns the authenticated user if valid.
 */
export function validateSession(token: string): AuthenticatedUser | null {
  if (!token) return null;

  const session = db.prepare(`
    SELECT s.user_id, s.expires_at, p.email, p.full_name, p.phone, p.default_address, r.role
    FROM sessions s
    JOIN profiles p ON p.id = s.user_id
    LEFT JOIN user_roles r ON r.user_id = s.user_id
    WHERE s.token = ?
  `).get(token) as {
    user_id: string;
    expires_at: string;
    email: string;
    full_name: string;
    phone?: string;
    default_address?: string;
    role?: 'customer' | 'admin';
  } | undefined;

  if (!session) return null;

  if (new Date(session.expires_at) < new Date()) {
    // Session expired, remove it
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }

  return {
    id: session.user_id,
    email: session.email,
    fullName: session.full_name,
    phone: session.phone || undefined,
    defaultAddress: session.default_address || undefined,
    role: session.role || 'customer',
  };
}

/**
 * Middleware: extracts token from Authorization header or cookie, attaches user if valid.
 * Does not block unauthenticated requests.
 */
export function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-session-token']) {
    token = req.headers['x-session-token'] as string;
  }

  if (token) {
    const user = validateSession(token);
    if (user) {
      req.user = user;
    }
  }

  next();
}

/**
 * Middleware: requires an authenticated user.
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  next();
}

/**
 * Middleware: requires an authenticated administrator.
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    return;
  }
  next();
}
