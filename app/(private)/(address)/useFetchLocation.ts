import { useLazyFetchGeocodingQuery } from "@/redux/features/addressSlice";
import { useState } from "react";
import { fetchLocation } from "./utils";
const initialState = {
  city: "",
  state: "",
  pincode: "",
  area: "",
  latitude: "",
  longitude: "",
  hasLat: false,
};

const useFetchLocation = () => {
  const [fetchGeocoding] = useLazyFetchGeocodingQuery();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    city: string;
    state: string;
    pincode: string;
    area: string;
    latitude: string;
    longitude: string;
    hasLat: boolean;
  }>(initialState);
  const [error, setError] = useState<string>("");

  const reset = () => {
    setData(initialState);
  };

  const fetchLocationData = async (lat = null, long = null) => {
    console.log("trdfgbnm,./");
    setLoading(true);
    setError("");
    setData(initialState);

    try {
      let latitude = lat;
      let longitude = long;
      console.log("jhgfdsdfghjkl;'", latitude, longitude);
      if (!latitude) {
        let loc = await fetchLocation();
        latitude = loc?.latitude;
        longitude = loc?.longitude;
      }

      console.log("fghjkl;", latitude, longitude);
      if (latitude && longitude) {
        const locData = await fetchGeocoding(
          {
            latitude,
            longitude,
          },
          false
        )?.unwrap();
        console.log("ytredfghjkl;/", locData);
        setData({ ...locData?.data, hasLat: lat ? true : false });
      }
    } catch (e: any) {
      setError(e?.message || "An unexpected error occurred");
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return { loading, data, error, fetchLocationData, reset };
};

export default useFetchLocation;
