import { router } from "expo-router";
import {
  saveAuthData,
  setOnboardingSeen,
} from "@/redux/features/authSlice";
import { getAppHomeRoute } from "@/utils/authRoles";
import { setHasSeenOnboarding } from "@/utils/onboardingStorage";

type LoginPayload = {
  token: string;
  userData?: {
    name?: string;
    mobileNumber?: string;
    isAdminUser?: boolean;
    isDriverUser?: boolean;
    driverId?: string;
  };
};

export async function persistAuthAndNavigate(
  dispatch: (action: unknown) => unknown,
  data: LoginPayload,
) {
  await dispatch(saveAuthData(data) as any).unwrap();
  await setHasSeenOnboarding(true);
  dispatch(setOnboardingSeen(true));

  if (data.userData?.name) {
    router.replace(
      getAppHomeRoute(data.userData, data.token) as Parameters<typeof router.replace>[0],
    );
    return;
  }

  router.replace("/name");
}
