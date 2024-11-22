import { useSelector } from "react-redux";
import { RootState } from "@/types/global";

export const useAuth = () => {
  const token = useSelector((state: RootState) => state?.auth?.token);
  const saveAuthData = useSelector(
    (state: RootState) => state?.auth?.saveAuthData
  );
  return { token, saveAuthData }; // return true if authenticated, false otherwise
};
