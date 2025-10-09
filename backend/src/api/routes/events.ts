import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getEventStats, searchEvents } from '../controllers/eventsController';
import {
  searchQuerySchema,
  statsQuerySchema,
  validateQuery,
} from '../middlewares/validateRequest';

const router = Router();

router.get('/search', validateQuery(searchQuerySchema), searchEvents);
router.all('/search', (req: Request, res: Response) => {
  res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
    message: 'Method not allowed',
    allowedMethods: ['GET'],
  });
});

router.get('/stats', validateQuery(statsQuerySchema), getEventStats);
router.all('/stats', (req: Request, res: Response) => {
  res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
    message: 'Method not allowed',
    allowedMethods: ['GET'],
  });
});

export default router;
