import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import QueryResult from "./QueryResult";

function parseBrandsParam(
  brands: string | string[] | undefined,
): string[] {
  const raw = Array.isArray(brands) ? brands[0] : brands;
  if (!raw) return [];
  return raw
    .split(",")
    .map((b) => {
      try {
        return decodeURIComponent(b.trim());
      } catch {
        return b.trim();
      }
    })
    .filter(Boolean);
}

function parseFlag(value: string | string[] | undefined): boolean {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "1" || raw === "true";
}

const Result = () => {
  const { query, brands, brandBrowse } = useLocalSearchParams<{
    query: string;
    brands?: string | string[];
    brandBrowse?: string | string[];
  }>();

  const initialBrands = useMemo(() => parseBrandsParam(brands), [brands]);
  const isBrandBrowse = useMemo(
    () => parseFlag(brandBrowse),
    [brandBrowse],
  );

  return (
    <QueryResult
      query={query}
      initialBrands={initialBrands}
      brandBrowse={isBrandBrowse}
    />
  );
};

export default Result;
