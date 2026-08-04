import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  View,
  ViewStyle,
  ScrollView,
  Text,
  TouchableOpacity,
  Platform,
  Pressable,
} from "react-native";
import AppHead from "@/components/AppHead";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors } from "@/constants/Colors";
import { router, useFocusEffect } from "expo-router";
import { setCheckoutFlow } from "@/redux/features/orderSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import {
  clearAuthData,
  logoutSession,
  useDeleteAccountMutation,
} from "@/redux/features/authSlice";
import Feather from "@expo/vector-icons/Feather";
import BottomSheet from "@/components/BottomSheet";
import AccountOption from "@/components/AccountOption";
import ProfileContainer from "@/components/ProfileContainer";
import NotFound from "../(result)/NotFound";
import DeferredFadeIn from "@/components/DeferredFadeIn";
import GetTheApp from "@/components/GetTheApp";

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function QuickAction({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        pressed && styles.quickActionPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.quickActionIcon}>{icon}</View>
      <Text style={styles.quickActionLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const Account: React.FC = () => {
  const dispatch = useDispatch();
  const userInfo = useSelector((state: RootState) => state.auth.userData);
  const logoutSessionPending = useSelector(
    (state: RootState) => state.auth?.logoutSessionPending,
  );

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [deleteAccount, { isLoading: isAccountDeleting }] =
    useDeleteAccountMutation();

  useFocusEffect(
    useCallback(() => {
      return () => {
        setDeleteConfirm(false);
        setLogoutConfirm(false);
      };
    }, []),
  );

  const goOrders = useCallback(() => {
    dispatch(setCheckoutFlow(false));
    router.push("/(order)/order");
  }, [dispatch]);

  const goAddresses = useCallback(() => {
    dispatch(setCheckoutFlow(false));
    router.push("/(address)/addressList");
  }, [dispatch]);

  const goSupport = useCallback(() => {
    router.push("/(support)/support");
  }, []);

  const goVoiceOs = useCallback(() => {
    router.push("/(voiceOs)");
  }, []);

  return (
    <>
      <AppHead title="Account" />
      <ScreenSafeWrapper
        title="Profile"
        // On web, keep ScrollView full-bleed so the scrollbar sits on the screen edge.
        wrapperStyle={Platform.OS === "web" ? styles.webWrapper : undefined}
        headerStyle={Platform.OS === "web" ? styles.webHeaderPad : undefined}
      >
        <DeferredFadeIn delay={100} style={{ flex: 1 }}>
          {userInfo?._id ? (
            isAccountDeleting ? (
              <NotFound
                title={"Deleting Account..."}
                subtitle={"Please wait while we delete your account."}
              />
            ) : logoutSessionPending ? (
              <NotFound
                title={"Logging Out..."}
                subtitle={"Please wait while we securely log you out."}
              />
            ) : (
              <ScrollView
                bounces={Platform.OS === "android" ? false : true}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                pinchGestureEnabled={false}
                showsVerticalScrollIndicator={Platform.OS === "web"}
              >
                <ProfileContainer userInfo={userInfo} />

                <DeferredFadeIn delay={80}>
                  <View style={styles.body}>
                    {userInfo?.isGuestUser ? (
                      <AccountOption
                        onPress={() => router.push("/login")}
                        icon={
                          <MaterialCommunityIcons
                            name="login"
                            size={20}
                            color={Colors.light.gradientGreen_2}
                          />
                        }
                        label="Login/Signup"
                      />
                    ) : (
                      <View style={styles.quickRow}>
                        <QuickAction
                          label="Orders"
                          onPress={goOrders}
                          icon={
                            <Feather
                              name="package"
                              size={22}
                              color={Colors.light.darkGreen}
                            />
                          }
                        />
                        <QuickAction
                          label="Addresses"
                          onPress={goAddresses}
                          icon={
                            <Ionicons
                              name="location-sharp"
                              size={22}
                              color={Colors.light.darkGreen}
                            />
                          }
                        />
                        <QuickAction
                          label="Support"
                          onPress={goSupport}
                          icon={
                            <Ionicons
                              name="headset-outline"
                              size={22}
                              color={Colors.light.darkGreen}
                            />
                          }
                        />
                      </View>
                    )}

                    {!userInfo?.isGuestUser && (
                      <View style={styles.section}>
                        <SectionLabel>Account</SectionLabel>
                        <AccountOption
                          onPress={goVoiceOs}
                          icon={
                            <Ionicons
                              name="chatbubble-ellipses-outline"
                              size={20}
                              color={Colors.light.gradientGreen_2}
                            />
                          }
                          label="Shop Assist"
                        />
                        <AccountOption
                          onPress={() => router.push("/profile")}
                          icon={
                            <MaterialCommunityIcons
                              name="account"
                              size={20}
                              color={Colors.light.gradientGreen_2}
                            />
                          }
                          label="My Profile"
                        />
                      </View>
                    )}

                    {userInfo?.isGuestUser && (
                      <View style={styles.section}>
                        <SectionLabel>Help</SectionLabel>
                        <AccountOption
                          onPress={goVoiceOs}
                          icon={
                            <Ionicons
                              name="chatbubble-ellipses-outline"
                              size={20}
                              color={Colors.light.gradientGreen_2}
                            />
                          }
                          label="Shop Assist"
                        />
                        <AccountOption
                          onPress={goSupport}
                          icon={
                            <Ionicons
                              name="headset-outline"
                              size={20}
                              color={Colors.light.gradientGreen_2}
                            />
                          }
                          label="Help & Support"
                        />
                      </View>
                    )}

                    {Platform.OS === "web" && (
                      <View style={styles.section}>
                        <SectionLabel>App</SectionLabel>
                        <GetTheApp variant="compact" />
                      </View>
                    )}

                    <View style={styles.section}>
                      <SectionLabel>Info</SectionLabel>
                      <AccountOption
                        onPress={() => router.push("/(about)/about")}
                        icon={
                          <Ionicons
                            name="information-circle-outline"
                            size={20}
                            color={Colors.light.gradientGreen_2}
                          />
                        }
                        label="About"
                      />
                      <AccountOption
                        onPress={() => router.push("/(legal)/terms")}
                        icon={
                          <Ionicons
                            name="document-text-outline"
                            size={20}
                            color={Colors.light.gradientGreen_2}
                          />
                        }
                        label="Terms & Conditions"
                      />
                      <AccountOption
                        onPress={() => router.push("/(legal)/privacy")}
                        icon={
                          <Ionicons
                            name="shield-checkmark-outline"
                            size={20}
                            color={Colors.light.gradientGreen_2}
                          />
                        }
                        label="Privacy Policy"
                      />
                    </View>

                    {!userInfo?.isGuestUser && (
                      <View style={styles.section}>
                        <SectionLabel>Session</SectionLabel>
                        <AccountOption
                          onPress={() => setLogoutConfirm(true)}
                          icon={
                            <MaterialIcons
                              name="logout"
                              size={20}
                              color={Colors.light.gradientRed_1}
                            />
                          }
                          label="Logout"
                        />
                        <AccountOption
                          onPress={() => setDeleteConfirm(true)}
                          icon={
                            <MaterialIcons
                              name="delete-forever"
                              size={20}
                              color={Colors.light.gradientRed_1}
                            />
                          }
                          label="Delete Account"
                        />
                      </View>
                    )}
                  </View>
                </DeferredFadeIn>
              </ScrollView>
            )
          ) : (
            <NotFound
              title={"Logging Out..."}
              subtitle={"Please wait while we securely log you out."}
            />
          )}
        </DeferredFadeIn>
      </ScreenSafeWrapper>

      {deleteConfirm && (
        <BottomSheet
          onClose={() => setDeleteConfirm(false)}
          wrapperStyle={{ height: "100%" }}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Confirm Deletion</Text>
            <Text style={styles.message}>
              Are you sure you want to delete your account? This action cannot
              be undone.
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setDeleteConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={async () => {
                  setDeleteConfirm(false);
                  await deleteAccount({
                    userId: userInfo?._id,
                  })?.unwrap();
                  dispatch(clearAuthData());
                }}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheet>
      )}
      {logoutConfirm && (
        <BottomSheet
          onClose={() => setLogoutConfirm(false)}
          wrapperStyle={{ height: "100%" }}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Confirm Logout</Text>
            <Text style={styles.message}>
              Are you sure you want to log out of your account?
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setLogoutConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={async () => {
                  setLogoutConfirm(false);
                  await dispatch(logoutSession() as any).unwrap();
                }}
              >
                <Text style={styles.deleteButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheet>
      )}
    </>
  );
};

export default Account;

const styles = StyleSheet.create({
  webWrapper: {
    paddingHorizontal: 0,
  },
  webHeaderPad: {
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === "web" ? 160 : 140,
    paddingHorizontal: Platform.OS === "web" ? 20 : 0,
    flexGrow: 1,
  },
  body: {
    paddingHorizontal: 10,
    gap: 8,
    marginTop: 4,
  },
  quickRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
    marginTop: 4,
  },
  quickAction: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 6,
    backgroundColor: Colors.light.softGreen,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.lightGrey,
  },
  quickActionPressed: {
    opacity: 0.85,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.lightGrey,
  },
  quickActionLabel: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 12,
    color: Colors.light.darkGrey,
    letterSpacing: 0.2,
  },
  section: {
    marginTop: 10,
    gap: 2,
  },
  sectionLabel: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 12,
    color: Colors.light.mediumGrey,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
    marginLeft: 4,
  },
  content: {
    backgroundColor: "#FFFFFF",
    padding: 28,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    flex: 1,
    marginTop: "6%",
  } as ViewStyle,
  title: {
    fontSize: 22,
    fontFamily: "Montserrat_800ExtraBold",
    marginBottom: 20,
    textAlign: "center",
    color: Colors.light.darkGrey,
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 16,
    fontFamily: "Raleway_500Medium",
    color: Colors.light.mediumGrey,
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.light.darkGrey,
    fontFamily: "Montserrat_700Bold",
    letterSpacing: 0.3,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: Colors.light.gradientRed_1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.light.gradientRed_1,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  deleteButtonText: {
    fontSize: 16,
    color: "white",
    fontFamily: "Montserrat_700Bold",
    letterSpacing: 0.3,
  },
});
