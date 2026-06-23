import { useCallback, useEffect, useState } from "react";

/**
 * Shows pagination skeletons immediately when the user hits the list end,
 * before RTK Query flips isFetching / page state.
 */
export function usePaginationSkeleton({
  isFetching,
  page,
  hasItems,
  hasNextPage,
}: {
  isFetching: boolean;
  page: number;
  hasItems: boolean;
  hasNextPage: boolean;
}) {
  const [isPagingMore, setIsPagingMore] = useState(false);

  useEffect(() => {
    if (!isFetching) {
      setIsPagingMore(false);
    }
  }, [isFetching]);

  const beginPaging = useCallback(() => {
    if (!hasNextPage) return;
    setIsPagingMore(true);
  }, [hasNextPage]);

  const showSkeleton =
    hasNextPage &&
    (isPagingMore || (isFetching && page > 1 && hasItems));

  return { showSkeleton, beginPaging, isPagingMore };
}
