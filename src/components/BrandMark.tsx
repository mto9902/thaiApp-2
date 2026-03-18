import React from "react";
import { Image, ImageStyle, StyleSheet, View, ViewStyle } from "react-native";

type BrandMarkProps = {
  size?: number;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
};

const BRAND_MARK = require("../../assets/branding/keystone-logo-source.png");

export default function BrandMark({
  size = 24,
  style,
  imageStyle,
}: BrandMarkProps) {
  return (
    <View style={[styles.frame, { width: size, height: size }, style]}>
      <Image
        source={BRAND_MARK}
        style={[styles.image, { width: size, height: size }, imageStyle]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
