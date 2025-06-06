import React, { lazy, Suspense, useState, useTransition } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import AboutTab from "./AboutTab";
// import PostsTab from "./PostsTab";
import ContactTab from "./ContactTab";
import TabButton from "./TabButton";
const PostsTab = lazy(() => import("./PostsTab"));

export default function TabContainer() {
  const [tab, setTab] = useState("about");
  const [isPending, startTransition] = useTransition();

  function selectTab(nextTab) {
    //setTab(nextTab);
    startTransition(() => {
      setTab(nextTab);
    });
  }

  return (
    <View style={styles.container}>
      <Text style={{ color: "red", fontSize: 56 }}>
        {isPending ? "loading" : ""}
      </Text>
      <View style={styles.tabBar}>
        <TabButton
          isActive={tab === "about"}
          onPress={() => selectTab("about")}
        >
          About
        </TabButton>
        <TabButton
          isActive={tab === "posts"}
          onPress={() => selectTab("posts")}
        >
          Posts (slow)
        </TabButton>
        <TabButton
          isActive={tab === "contact"}
          onPress={() => selectTab("contact")}
        >
          Contact
        </TabButton>
      </View>
      <View style={styles.content}>
        {tab === "about" && <AboutTab />}
        {tab === "posts" && (
          <Suspense fallback={<Text>hi</Text>}>
            <PostsTab />
          </Suspense>
        )}
        {tab === "contact" && <ContactTab />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
});
