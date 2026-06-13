import React from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import ContentLoader, { Rect } from "react-content-loader/native";

export const DEFAULT_MAP_LOADER_HEIGHT = 324;

type Props = {
  height?: number;
  width?: number;
};

const MapLoaderSkeleton = ({
  height = DEFAULT_MAP_LOADER_HEIGHT,
  width,
}: Props) => {
  const { width: windowWidth } = useWindowDimensions();
  const mapWidth = width ?? windowWidth;

  return (
    <View style={[styles.wrap, { height }]}>
      <ContentLoader
        speed={1}
        width={mapWidth}
        height={height}
        backgroundColor="#E8EDEA"
        foregroundColor="#D4DDD8"
      >
        <Rect x="0" y="0" width={mapWidth} height={height} rx={0} />
        <Rect
          x={mapWidth * 0.08}
          y={52}
          width={mapWidth * 0.84}
          height={44}
          rx={12}
        />
        <Rect
          x={mapWidth * 0.35}
          y={height * 0.55}
          width={48}
          height={48}
          rx={24}
        />
      </ContentLoader>
    </View>
  );
};

export default MapLoaderSkeleton;

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    backgroundColor: "#EEF2EF",
  },
});
