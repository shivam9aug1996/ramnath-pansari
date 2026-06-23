import { router } from "expo-router";
import { saveAuthData } from "@/redux/features/authSlice";

type LoginPayload = {
  token: string;
  userData?: {
    name?: string;
    isAdminUser?: boolean;
  };
};

export async function persistAuthAndNavigate(
  dispatch: (action: unknown) => unknown,
  data: LoginPayload,
) {
  await dispatch(saveAuthData(data) as any).unwrap();

  if (data.userData?.name) {
    if (data.userData.isAdminUser) {
      router.replace("/admin/home");
    } else {
      router.replace("/(private)/(tabs)/home");
    }
    return;
  }

  router.replace("/name");
}
