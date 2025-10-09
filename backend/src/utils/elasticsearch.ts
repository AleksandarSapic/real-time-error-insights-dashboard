import { SearchFilters } from '../types/search';

export const buildMustClauses = (filters: SearchFilters): any[] => {
  const mustClauses: any[] = [];

  if (filters.userId) {
    mustClauses.push({ match: { userId: filters.userId } });
  }

  if (filters.url) {
    mustClauses.push({ match: { url: filters.url } });
  }

  if (filters.browser) {
    mustClauses.push({ match: { browser: filters.browser } });
  }

  if (filters.query) {
    mustClauses.push({
      multi_match: {
        query: filters.query,
        fields: ['errorMessage', 'stackTrace', 'url'],
      },
    });
  }

  if (filters.dateStart || filters.dateEnd) {
    const rangeClause: any = { range: { timestamp: {} } };

    if (filters.dateStart) {
      rangeClause.range.timestamp.gte = filters.dateStart;
    }

    if (filters.dateEnd) {
      rangeClause.range.timestamp.lte = filters.dateEnd;
    }

    mustClauses.push(rangeClause);
  }

  return mustClauses;
};

export const getElasticsearchTotal = (
  total: number | { value: number; relation: string } | undefined
): number => {
  if (typeof total === 'number') {
    return total;
  }
  if (total && typeof total === 'object' && 'value' in total) {
    return total.value;
  }
  return 0;
};
