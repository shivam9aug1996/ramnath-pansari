import { debounce } from "@/utils/utils";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState, useTransition } from "react";

import AppIntroSlider from "react-native-app-intro-slider";
import { onboardingSlides } from "./utils";
import OnboardingItem from "@/components/onboarding/OnboardingItem";
import useVerifyOtp1 from "@/screens/verifyOtp/hooks/sdfg";
import DeferredFadeIn from "@/components/DeferredFadeIn";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";

const Onboarding = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const route = useRouter();
  const sliderRef = useRef<AppIntroSlider>(null);
  const [isPending, startTransition] = useTransition();
  const { guestLogin, isLoading: isLoadingVerifyOtp } = useVerifyOtp1();
  const saveAuthDataState = useSelector(
    (state: RootState) => state?.auth?.saveAuthData
  );
  const renderItem = useCallback(
    ({ item }: any) => {
      const debouncePress = debounce(handlePress, 500, true);
      return (
       <DeferredFadeIn delay={100} style={{flex:1}}>
        <OnboardingItem
          activeSlide={activeSlide}
          handlePress={debouncePress}
          item={item}
          isLoadingVerifyOtp={isLoadingVerifyOtp || saveAuthDataState?.isLoading}
        />
       </DeferredFadeIn>
      );
    },
    [activeSlide, isLoadingVerifyOtp, saveAuthDataState?.isLoading]
  );

  const onSlideChange = (index: number) => {
    startTransition(() => {
      setActiveSlide(index);
    });
  };

  const handlePress = useCallback(() => {
    let totalSlides = onboardingSlides.length;
    if (activeSlide === totalSlides - 1) {
      guestLogin();
    } else {
      sliderRef?.current?.goToSlide(activeSlide + 1);
      onSlideChange(activeSlide + 1);
    }
  }, [activeSlide]);

  return (
    <AppIntroSlider
      renderItem={renderItem}
      data={onboardingSlides}
      onSlideChange={onSlideChange}
      ref={sliderRef}
      renderPagination={() => null}
    />
  );
};

export default Onboarding;
