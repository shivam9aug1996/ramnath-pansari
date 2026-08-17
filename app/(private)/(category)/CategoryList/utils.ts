import { Colors } from "@/constants/Colors";
import { SubCategory } from "@/types/global";

export const imageBorderStyle = (
  arrayColor: string[],
  isSelected: boolean,
  index: number
) => ({
  backgroundColor: arrayColor[index % arrayColor.length],
  borderColor: isSelected ? Colors.light.mediumGreen : "transparent",
});

export const staticImage =
  "https://static-assets-web.flixcart.com/www/linchpin/batman-returns/images/fk-default-image-75ff340b.png";

export const categoryListPlaceholder = [
  {
    _id: "1",
    name: "Dals & Pulses",
    image: staticImage,
    children: [
      {
        _id: "1",
        name: "Dals & Pulses",
        image: staticImage,
        children: [],
      },
      {
        _id: "2",
        name: "Dals & Pulses",
        image: staticImage,
        children: [],
      },
      {
        _id: "3",
        name: "Dals & Pulses",
        image: staticImage,
        children: [],
      },
      {
        _id: "4",
        name: "Dals & Pulses",
        image: staticImage,
        children: [],
      },
      {
        _id: "5",
        name: "Dals & Pulses",
        image: staticImage,
        children: [],
      },
    ],
  },
  {
    _id: "2",
    name: "Ghee & Oils",
    image: staticImage,
    children: null,
  },
  {
    _id: "3",
    name: "Atta & Flours",
    image: staticImage,
    children: null,
  },
  {
    _id: "4",
    name: "Dals & Pulses",
    image: staticImage,
    children: [],
  },
  {
    _id: "5",
    name: "Dals & Pulses",
    image: staticImage,
    children: [],
  },
];

export const getSubCategoryIndex = (
  subCategories: SubCategory[],
  selectedSubCategory: SubCategory
) => {
  console.log("subCategories1111", subCategories);
  console.log("selectedSubCategory111", selectedSubCategory);
  return subCategories?.findIndex(
    (item: any) => item?._id?.toString()?.toLowerCase() === selectedSubCategory?._id?.toString()?.toLowerCase()
  ) ?? -1;
};
