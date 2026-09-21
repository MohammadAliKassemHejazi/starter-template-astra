import type { Request, Response } from 'express';
import { getHealth } from '../services/health.service';
import { sendSuccess } from '../utils/respond';

export function healthController(_req: Request, res: Response): Response {
  return sendSuccess(res, getHealth(), 'healthy');
}
