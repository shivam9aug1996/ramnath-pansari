import { useSelector } from "react-redux";
import { offerApi } from "@/redux/features/offerSlice";
import { OfferDocument, RootState } from "@/types/global";

const EMPTY_OFFERS: OfferDocument[] = [];


export function usePromoLocalHydrated(): boolean {
  return useSelector((state: RootState) => Boolean(state.appSync?.localHydrated));
}


export function useCachedOffers(): OfferDocument[] {
  return useSelector(
    (state: RootState) =>
      offerApi.endpoints.fetchOffers.select()(state)?.data?.offers ??
      EMPTY_OFFERS,
  );
}
