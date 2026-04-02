import type { Request, Response, NextFunction } from "express";

export function mockAuth(req: Request, res: Response, next: NextFunction) {
  const role = req.headers["x-user-role"] as string | undefined;
  const email = req.headers["x-user-email"] as string | undefined;
  res.locals.userRole = role === "customer" || role === "merchant" ? role : null;
  res.locals.userEmail = email ?? null;
  next();
}

export function requireRole(...roles: string[]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(res.locals.userRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
