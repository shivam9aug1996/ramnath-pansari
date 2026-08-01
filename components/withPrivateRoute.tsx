import React from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";

const withPrivateRoute = (Component: React.ComponentType) => {
  return (props: any) => {
    const { token, saveAuthData } = useAuth();
    const router = useRouter();
    if (saveAuthData?.isSuccess) {
      if (!token) {
        router?.replace?.("/(onboarding)/onboarding");
        return null;
      }
    }

    return <Component {...props} />;
  };
};

export default withPrivateRoute;
