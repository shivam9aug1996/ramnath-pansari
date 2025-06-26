import { showToast } from "@/utils/utils";
import { clearAuthData } from "./features/authSlice";

const handle401Middleware = (store: any) => (next: any) => (action: any) => {
  const status = action?.payload?.status;
  const errorMessage = action?.payload?.data?.error;
   
  if (status === 401) {
    store.dispatch(clearAuthData());
    showToast({ type: "error", text2: "Authentication failed" });
  } else if (status === 467) {
    console.log("retrying7654");
  } else if (status >= 400) {
    showToast({ type: "error", text2: errorMessage || "Something went wrong" });
  } else if (typeof status === "string") {
    showToast({ type: "error", text2: status });
  }

  return next(action);
};

export default handle401Middleware;
