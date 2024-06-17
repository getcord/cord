export interface PaginationDetails {
  /**
   * The token to use to get the next page of results. If empty, there are no more results.
   */
  token: string | null;

  /**
   * Total number of results. Might be bigger than the number of results returned on the query. Useful to display a "total" counter.
   */
  total: number;
}
