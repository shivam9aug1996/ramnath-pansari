import { useSelector } from "react-redux";
import {
  deliverySettingsApi,
} from "@/redux/features/deliverySettingsSlice";
import { useGetAdminDeliverySettingsQuery } from "@/redux/features/adminDeliverySettingsSlice";
import { RootState } from "@/types/global";
import {
  resolveDeliverySettings,
  type DeliverySettings,
} from "@/utils/deliveryFee";

type UseDeliverySettingsOptions = {
  /** When true, fetches via admin API. Customers rely on checkout refresh + cache. */
  fetch?: boolean;
};

export function useDeliverySettings(
  options?: UseDeliverySettingsOptions,
): DeliverySettings {
  const { data: fetched } = useGetAdminDeliverySettingsQuery(undefined, {
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
