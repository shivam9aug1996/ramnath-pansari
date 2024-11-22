import {
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Link, router, useRouter } from "expo-router";
import {
  authApi,
  useLogoutMutation,
  usePrivateDataMutation,
} from "@/redux/features/authSlice";
import { ThemedText } from "@/components/ThemedText";
import withPrivateRoute from "@/components/withPrivateRoute";
import { useFetchCategoriesQuery } from "@/redux/features/categorySlice";
import { useDispatch, useSelector } from "react-redux";
import { Category, RootState } from "@/types/global";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { Colors } from "@/constants/Colors";
import CustomTextInput from "@/components/CustomTextInput";
import CategorySelector from "../../(category)/CategoryList/CategorySelector";
import { imageBorderStyle } from "../../(category)/CategoryList/utils";
import { arrayColor } from "../../(category)/CategoryList/constants";
import { downloadAsset, truncateText } from "@/utils/utils";
import LottieSuccess from "../../(address)/LottieSuccess";
import DownloadManager from "../../../../utils/DownloadManager";

const index = () => {
  const token = useSelector((state: RootState) => state?.auth?.token);
  const userData = useSelector((state: RootState) => state?.auth?.userData);
  const [privateData, { isLoading, data, isError, error }] =
    usePrivateDataMutation();
  const route = useRouter();
  const dispatch = useDispatch();
  const [logout, { isError: islogouterror, isSuccess }] = useLogoutMutation();
  const { data: getCategories } = useFetchCategoriesQuery({}, { skip: !token });
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const fun = (val) => {};
  const downloadManager = new DownloadManager(fun);

  // useEffect(() => {
  //   // downloadAsset(
  //   //   "https://res.cloudinary.com/dc2z2c3u8/raw/upload/v1732081469/orderSuccess_xlxkxw.json",
  //   //   "lottieSu.json"
  //   // );
  //   const hey = async () => {
  //     const fileUri = await downloadManager.startDownload(
  //       "https://res.cloudinary.com/dc2z2c3u8/raw/upload/v1732081469/orderSuccess_xlxkxw.json",
  //       "lottieSu.json"
  //     );
  //     if (fileUri) console.log(`File downloaded to: ${fileUri}`);
  //   };
  //   hey();
  // }, []);
  return (
    <ScreenSafeWrapper showBackButton={false}>
      {/* <LottieSuccess /> */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: 10 }}>
          <View style={{ flexDirection: "column" }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ flex: 2 }}>
                <Text
                  style={{
                    fontFamily: "Raleway_800ExtraBold",
                    fontSize: 22,
                    color: Colors.light.darkGreen,
                    marginBottom: 3,
                  }}
                  numberOfLines={1}
                >{`Hey ${truncateText(
                  userData?.name?.split(" ")[0],
                  10
                )} 👋`}</Text>
              </View>

              <TouchableOpacity
                style={{
                  flex: 1,
                  alignItems: "flex-end",
                }}
                onPress={() => {
                  router.navigate("/(tabs)/account");
                }}
              >
                <Image
                  borderRadius={25}
                  width={50}
                  height={50}
                  source={{
                    uri:
                      userData?.profileImage ||
                      "https://static.vecteezy.com/system/resources/previews/036/594/092/non_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg",
                  }}
                />
              </TouchableOpacity>
            </View>
            <Text
              style={{
                fontFamily: "Raleway_500Medium",
                fontSize: 16,
                color: Colors.light.mediumLightGrey,
                paddingTop: 8,
              }}
            >{`Your one-stop shop for everything you love.`}</Text>
          </View>
          <CustomTextInput
            onChangeText={() => {}}
            value={"Search..."}
            type="search"
            variant={2}
            onPress={(e) => {
              router.push("/(search)/search");
            }}
            wrapperStyle={styles.textInputWrapper}
            textInputStyle={styles.textInputStyle}
            //  multiline
          />
        </View>
        {getCategories?.categories?.map((item: any, index: number) => {
          const borderStyle = imageBorderStyle(
            arrayColor,
            item?._id === "kio",
            index
          );
          return (
            <View
              key={item?._id}
              style={{ flex: 1, flexDirection: "column", marginBottom: 40 }}
            >
              <View
                style={[
                  {
                    borderRadius: 23,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderWidth: 1,
                    alignSelf: "flex-start",
                  },
                  borderStyle,
                ]}
              >
                <Text
                  style={{
                    fontFamily: "Raleway_500Medium",
                    fontSize: 12,
                    color: Colors.light.mediumGrey,
                  }}
                >
                  {item?.name}
                </Text>
              </View>
              <CategorySelector
                categories={item?.children}
                //selectedCategory={selectedCategory}
                onSelectCategory={(data) => {
                  console.log("uytfghjk", data);

                  let g = item?.children?.findIndex((item) => {
                    return item?._id === data?._id;
                  });
                  router.navigate({
                    pathname: `/(category)/${item?._id}`,
                    params: {
                      name: item?.name,
                      selectedCategoryIdIndex: g,
                    },
                  });
                  console.log("gfghj", g);
                  //setSelectedCategory(data);
                }}
              />
            </View>
          );
        })}
      </ScrollView>
    </ScreenSafeWrapper>
  );
};

export default withPrivateRoute(index);

const styles = StyleSheet.create({
  textInputWrapper: {
    marginTop: 20,
    marginBottom: 30,
  },
  textInputStyle: {
    fontFamily: "Raleway_400Regular",
    fontSize: 12,
    color: Colors.light.darkGreen,
    top: 1,
    opacity: 0.6,
  },
});
