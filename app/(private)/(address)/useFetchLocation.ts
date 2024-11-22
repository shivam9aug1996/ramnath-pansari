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
  }>(initialState);
  const [error, setError] = useState<string>("");

  const fetchLocationData = async (lat = null, long = null) => {
    setLoading(true);
    setError("");
    setData(initialState);

    try {
      let latitude = lat;
      let longitude = long;
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
          true
        )?.unwrap();
        setData(locData?.data);
      }
    } catch (e: any) {
      setError(e?.message || "An unexpected error occurred");
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return { loading, data, error, fetchLocationData };
};

export default useFetchLocation;
