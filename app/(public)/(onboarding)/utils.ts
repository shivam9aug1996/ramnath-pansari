import { OnboardingSlide } from "@/types/global";
export const onboardingSlides: OnboardingSlide[] = [
  {
    key: 1,
    title: "Fresh Essentials, Faster!",
    text: "Get top-quality groceries delivered to your doorstep, fresh and hassle-free.",
    image: require("../../../assets/images/Image-Header1.png"),
    backgroundColor: "#ffffff",
  },
  {
    key: 2,
    title: "Shop Anywhere, Anytime",
    text: "Convenience at your fingertips—order your groceries directly from your phone.",
    image: require("../../../assets/images/Image-Header2.png"),
    backgroundColor: "#ffffff",
  },
  {
    key: 3,
    title: "Delivered in Under 30 Minutes",
    text: "Your favorite grocery items, delivered lightning fast—always on time.",
    image: require("../../../assets/images/Image-Header3.png"),
    backgroundColor: "#ffffff",
  },
];

const calculateWidths = (n: number) => {
  let widths = [];
  let initialWidth = 40.96;

  for (let i = 0; i < n; i++) {
    widths.push(parseFloat(initialWidth.toFixed(2)));
    initialWidth = (initialWidth * 37) / 100;
  }

  return widths;
};

export const dynamicArray = calculateWidths(3);

// Precompute all shifted arrays
const precomputedShiftedArrays = (array: number[]) => {
  const shiftedArrays = [];
  for (let i = 0; i < array.length; i++) {
    const shiftedArray = [...array];
    for (let j = 0; j < i; j++) {
      shiftedArray.unshift(shiftedArray.pop() as number);
    }
    shiftedArrays.push(shiftedArray);
  }
  return shiftedArrays;
};

export const shiftedArrays = precomputedShiftedArrays(dynamicArray);
