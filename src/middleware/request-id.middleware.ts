import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Use existing request ID if provided, otherwise generate one
    const existingRequestId = req.headers['x-request-id'];
    const requestId = Array.isArray(existingRequestId)
      ? existingRequestId[0]
      : existingRequestId || uuidv4();

    // Attach request ID to request object
    req.requestId = requestId;

    // Set response header
    res.setHeader('X-Request-ID', requestId);

    next();
  }
}