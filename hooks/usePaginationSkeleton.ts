import { useCallback, useEffect, useRef, useState } from "react";

export function usePaginationSkeleton({
  isFetching,
  page,
  hasItems,
  hasNextPage,
  itemCount,
}: {
  isFetching: boolean;
  page: number;
  hasItems: boolean;
  hasNextPage: boolean;
  itemCount: number;
}) {
  const [isPagingMore, setIsPagingMore] = useState(false);
  const countAtPagingStart = useRef(0);

  useEffect(() => {
    if (!isFetching && isPagingMore) {
      setIsPagingMore(false);
    }
  }, [isFetching, isPagingMore]);

  const beginPaging = useCallback(() => {
    if (!hasNextPage) return;
    countAtPagingStart.current = itemCount;
    setIsPagingMore(true);
  }, [hasNextPage, itemCount]);

  const hasNewItems =
    isPagingMore && itemCount > countAtPagingStart.current;

  const showSkeleton =
    hasNextPage &&
    (isPagingMore || (isFetching && page > 1 && hasItems)) &&
    !hasNewItems;

  return { showSkeleton, beginPaging, isPagingMore };
}