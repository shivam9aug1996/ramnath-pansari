import { Toast } from "toastify-react-native";
import { clearAuthData } from "./features/authSlice";

const handle401Middleware = (store: any) => (next: any) => (action: any) => {
  const showToast = (message: string) => {
    Toast.hideAll();
    Toast.error(message, "top");
  };

  const status = action?.payload?.status;
  const errorMessage = action?.payload?.data?.error;
  console.log(JSON.stringify(action));
  if (status === 401) {
    store.dispatch(clearAuthData());
    showToast("Authentication failed");
  } else if (status === 467) {
    console.log("retrying7654");
  } else if (status >= 400) {
    showToast(errorMessage || "Something went wrong");
  } else if (typeof status === "string") {
    showToast(status);
  }

  return next(action);
};

export default handle401Middleware;
