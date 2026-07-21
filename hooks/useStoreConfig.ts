import { useEffect } from "react";
import { useSelector } from "react-redux";
import {
  storeConfigApi,
  useFetchStoreConfigQuery,
} from "@/redux/features/storeConfigSlice";
import { RootState } from "@/types/global";
import { resolveStoreConfig, type StoreConfig } from "@/utils/storeConfig";
import { devLog } from "@/utils/devLog";

type UseStoreConfigOptions = {
  fetch?: boolean;
};

export function useStoreConfig(options?: UseStoreConfigOptions): StoreConfig {
  const isGuestUser = useSelector(
    (state: RootState) => state.auth?.userData?.isGuestUser,
  );
  const skip = !options?.fetch || Boolean(isGuestUser);
  const { data: fetched, status, isError, error } = useFetchStoreConfigQuery(
    undefined,
    { skip },
  );
  const cached = useSelector(
    (state: RootState) =>
      storeConfigApi.endpoints.fetchStoreConfig.select()(state)?.data
        ?.storeConfig,
  );
  const config = options?.fetch ? fetched?.storeConfig : cached;
  const resolved = resolveStoreConfig(config);

  useEffect(() => {
    devLog("[store-config] useStoreConfig", {
      fetchOpt: Boolean(options?.fetch),
      isGuestUser: Boolean(isGuestUser),
      skip,
      source: options?.fetch ? "query" : "select",
      hasRaw: Boolean(config),
      queryStatus: status,
      isError,
      error,
      acceptingOrders: resolved.acceptingOrders,
    });
  }, [
    options?.fetch,
    isGuestUser,
    skip,
    config,
    status,
    isError,
    error,
    resolved.acceptingOrders,
  ]);

  return resolved;
}
