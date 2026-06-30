import { shallowEqual, useSelector } from "react-redux";
import { recentSearchApi } from "@/redux/features/recentSearchSlice";
import type { RecentSearchItem } from "@/utils/recentSearchConfigCache";
import { RootState } from "@/types/global";

const EMPTY_RECENT_SEARCH: RecentSearchItem[] = [];

export function useCachedRecentSearch(
  userId?: string,
  _source = "unknown",
): RecentSearchItem[] {
  return useSelector((state: RootState) => {
    if (!userId) return EMPTY_RECENT_SEARCH;
    return (
      recentSearchApi.endpoints.fetchRecentSearch.select({ userId })(state)
        ?.data ?? EMPTY_RECENT_SEARCH
    );
  }, shallowEqual);
}
