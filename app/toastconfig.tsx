import { BaseToast } from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { fonts } from "@/constants/Fonts";

const baseStyles = {
  borderLeftWidth: 4,
  borderWidth: 1,
  borderRadius: 10,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 3,
};

const contentContainerStyle = {
  paddingHorizontal: 15,
  paddingVertical: 10,
};

const text2Style = {
  ...fonts.defaultRegular,
  fontSize: 14,
  marginRight: 50,
};

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        ...baseStyles,
        backgroundColor: "#eafaf1",
        borderColor: "#a3d9b5",
        borderLeftColor: "#55c57a",
      }}
      contentContainerStyle={contentContainerStyle}
      text2Style={{ ...text2Style, color: "#333" }}
      renderLeadingIcon={() => (
        <Ionicons
          name="checkmark-circle"
          size={28}
          style={{
            color: "#55c57a",
            alignSelf: "center",
            marginLeft: 10,
          }}
        />
      )}
    />
  ),

  error: (props: any) => (
    <BaseToast
      {...props}
      style={{
        ...baseStyles,
        zIndex: 66687654,
        backgroundColor: "#fdecea",
        borderColor: "#f5c6cb",
        borderLeftColor: "#e63946",
      }}
      contentContainerStyle={contentContainerStyle}
      text2Style={{ ...text2Style, color: "#721c24" }}
      renderLeadingIcon={() => (
        <Ionicons
          name="close-circle"
          size={28}
          style={{
            color: "#e63946",
            alignSelf: "center",
            marginLeft: 10,
          }}
        />
      )}
    />
  ),

  info: (props: any) => (
    <BaseToast
      {...props}
      style={{
        ...baseStyles,
        backgroundColor: "#eaf4fc",
        borderColor: "#a3cfe3",
        borderLeftColor: "#3498db",
      }}
      contentContainerStyle={contentContainerStyle}
      text2Style={{ ...text2Style, color: "#2c3e50", fontSize: 12 }}
      text2NumberOfLines={2}
      renderLeadingIcon={() => (
        <Ionicons
          name="information-circle"
          size={28}
          style={{
            color: "#3498db",
            alignSelf: "center",
            marginLeft: 10,
          }}
        />
      )}
    />
  ),
};