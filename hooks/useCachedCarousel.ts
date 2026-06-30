import { useSelector } from "react-redux";
import { carouselApi } from "@/redux/features/carouselSlice";
import { CarouselBannerDocument, RootState } from "@/types/global";

const EMPTY_BANNERS: CarouselBannerDocument[] = [];

export function useCachedCarouselBanners(): CarouselBannerDocument[] {
  return useSelector(
    (state: RootState) =>
      carouselApi.endpoints.fetchCarousel.select()(state)?.data?.banners ??
      EMPTY_BANNERS,
  );
}
