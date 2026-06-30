import { useSelector } from "react-redux";
import {
  storeConfigApi,
  useFetchStoreConfigQuery,
} from "@/redux/features/storeConfigSlice";
import { RootState } from "@/types/global";
import { resolveStoreConfig, type StoreConfig } from "@/utils/storeConfig";

type UseStoreConfigOptions = {
  fetch?: boolean;
};

export function useStoreConfig(options?: UseStoreConfigOptions): StoreConfig {
  const { data: fetched } = useFetchStoreConfigQuery(undefined, {
    skip: !options?.fetch,
  });
  const cached = useSelector(
    (state: RootState) =>
      storeConfigApi.endpoints.fetchStoreConfig.select()(state)?.data
        ?.storeConfig,
  );
  const config = options?.fetch ? fetched?.storeConfig : cached;
  return resolveStoreConfig(config);
}
