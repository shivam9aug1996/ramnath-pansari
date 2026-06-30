import { useSelector } from "react-redux";
import {
  deliverySettingsApi,
  useFetchDeliverySettingsQuery,
} from "@/redux/features/deliverySettingsSlice";
import { RootState } from "@/types/global";
import {
  resolveDeliverySettings,
  type DeliverySettings,
} from "@/utils/deliveryFee";

type UseDeliverySettingsOptions = {
  /** When true, fetches from API (e.g. admin). Customers rely on checkout refresh + cache. */
  fetch?: boolean;
};

export function useDeliverySettings(
  options?: UseDeliverySettingsOptions,
): DeliverySettings {
  const { data: fetched } = useFetchDeliverySettingsQuery(undefined, {
    skip: !options?.fetch,
  });
  const cached = useSelector(
    (state: RootState) =>
      deliverySettingsApi.endpoints.fetchDeliverySettings.select()(state)?.data
        ?.deliverySettings,
  );
  const settings = options?.fetch ? fetched?.deliverySettings : cached;
  return resolveDeliverySettings(settings);
}
