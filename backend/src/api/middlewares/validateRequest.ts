import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { StatsAggregationType, TimeInterval } from '../../types/search';

const numericString = (fieldName: string) =>
  z.preprocess(
    (val) => (val === undefined ? '0' : val),
    z
      .string()
      .regex(/^\d+$/, `${fieldName} must be a valid number`)
      .transform((val) => parseInt(val, 10))
  );

export const searchQuerySchema = z.object({
  offset: numericString('Offset')
    .optional()
    .default(0)
    .transform((val) => Math.max(0, val)),
  limit: numericString('Limit')
    .optional()
    .default(10)
    .transform((val) => {
      const maxLimit = 100;
      return Math.min(Math.max(1, val), maxLimit);
    }),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  userId: z.string().optional().nullable().default(null),
  url: z.string().optional().nullable().default(null),
  browser: z.string().optional().nullable().default(null),
  dateStart: z.iso.datetime().optional().nullable().default(null),
  dateEnd: z.iso.datetime().optional().nullable().default(null),
  query: z.string().optional().nullable().default(null),
});

export const statsQuerySchema = z.object({
  bucketSize: numericString('BucketSize')
    .optional()
    .default(20)
    .transform((val) => {
      const maxLimit = 100;
      return Math.min(Math.max(1, val), maxLimit);
    }),
  interval: z.enum(TimeInterval).optional().default(TimeInterval.Day),
  aggregations: z
    .preprocess(
      (val) => {
        if (typeof val === 'string') {
          return val.split(',').map((v) => v.trim());
        }
        return val;
      },
      z.array(z.enum(StatsAggregationType)).optional()
    )
    .optional(),
  userId: z.string().optional().nullable().default(null),
  url: z.string().optional().nullable().default(null),
  browser: z.string().optional().nullable().default(null),
  dateStart: z.iso.datetime().optional().nullable().default(null),
  dateEnd: z.iso.datetime().optional().nullable().default(null),
  query: z.string().optional().nullable().default(null),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type StatsQuery = z.infer<typeof statsQuerySchema>;

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: any;
    }
  }
}

export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.validatedQuery = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Invalid query parameters',
          errors: JSON.parse(error.message),
        });
      }
      next(error);
    }
  };
};
