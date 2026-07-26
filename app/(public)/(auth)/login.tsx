import { StyleSheet } from "react-native";
import AppHead from "@/components/AppHead";
import Login from "@/screens/login";
const login = () => {
  return (
    <>
      <AppHead title="Login" />
      <Login />
    </>
  );
};

export default login;

const styles = StyleSheet.create({});
