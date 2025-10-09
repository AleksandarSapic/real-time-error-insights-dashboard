import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { fetchSearchResults } from '../../lib/search';
import { fetchEventStats } from '../../lib/stats';
import { SearchFilters } from '../../types/search';
import { withCache } from '../../utils/cache';
import config from '../../config';
import { SearchQuery, StatsQuery } from '../middlewares/validateRequest';

export const searchEvents = async (req: Request, res: Response) => {
  try {
    const {
      offset,
      limit,
      sortOrder,
      userId,
      url,
      browser,
      dateStart,
      dateEnd,
      query,
    } = req.validatedQuery as SearchQuery;

    const filters: SearchFilters = {
      userId,
      url,
      browser,
      dateStart,
      dateEnd,
      query,
    };

    console.log('Search request received', {
      filters,
      offset,
      limit,
      sortOrder,
    });

    const cacheParams = {
      ...filters,
      offset,
      limit,
      sortOrder,
    };

    const result = await withCache(
      {
        prefix: 'search',
        ttl: config.cache.searchTTL,
        params: cacheParams,
      },
      () =>
        fetchSearchResults({
          filters,
          offset,
          limit,
          sortOrder,
        })
    );

    console.log('Search completed', {
      total: result.pagination.total,
      returned: result.pagination.returned,
      appliedFilters: Object.entries(filters)
        .filter(([_, v]) => v)
        .map(([k]) => k),
    });

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};

export const getEventStats = async (req: Request, res: Response) => {
  try {
    const {
      bucketSize,
      interval,
      aggregations,
      userId,
      url,
      browser,
      dateStart,
      dateEnd,
      query,
    } = req.validatedQuery as StatsQuery;

    const filters: SearchFilters = {
      userId,
      url,
      browser,
      dateStart,
      dateEnd,
      query,
    };

    console.log('Stats request received', {
      filters,
      bucketSize,
      interval,
      aggregations,
    });

    const cacheParams = {
      ...filters,
      interval,
      bucketSize,
      aggregations,
    };

    const stats = await withCache(
      {
        prefix: 'stats',
        ttl: config.cache.statsTTL,
        params: cacheParams,
      },
      () =>
        fetchEventStats({
          filters,
          bucketSize,
          interval,
          aggregations,
        })
    );

    console.log('Statistics retrieved', {
      totalEvents: stats.summary.totalEvents,
      uniqueUsers: stats.summary.uniqueUsers,
    });

    res.status(StatusCodes.OK).json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    throw error;
  }
};
