import React from "react";
import { StyleSheet, View } from "react-native";

export const DEFAULT_MAP_LOADER_HEIGHT = 324;

type Props = {
  height?: number;
};

/** Static map placeholder — same on iOS, Android, and web. Fills parent width. */
const MapLoaderSkeleton = ({ height = DEFAULT_MAP_LOADER_HEIGHT }: Props) => {
  return (
    <View style={[styles.wrap, { height }]}>
      <View style={styles.mapFill} />
      <View style={styles.searchBar} />
      {/* <View style={styles.pin} /> */}
    </View>
  );
};

export default MapLoaderSkeleton;

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    alignSelf: "stretch",
    overflow: "hidden",
    backgroundColor: "#EEF2EF",
  },
  mapFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#E8EDEA",
  },
  searchBar: {
   // position: "absolute",
    
    // left: "8%",
    // right: "8%",
    // width: "100%",
    height: 55,
    borderRadius: 12,
    backgroundColor: "#D4DDD8",
    marginHorizontal:12,
    marginTop:12,
  },
  pin: {
    position: "absolute",
    top: "55%",
    left: "35%",
    width: 48,
    height: 48,
    marginTop: -24,
    borderRadius: 24,
    backgroundColor: "#D4DDD8",
  },
});
