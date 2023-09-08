import {
  Pressable,
  StyleSheet,
  View,
  Text,
} from "react-native";

import { Link } from "expo-router";
import { colors } from "../constants/colors";

const IMAGE_URL =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2728&q=80";

  export default function HomeScreen() {
  return (
    <View style={styles.wrapper}>
      {/* @ts-expect-error FIXME: add types */}
      <Link href={{pathname: 'image-crop-modal', params: {url: IMAGE_URL}}} asChild>
        <Pressable style={{ width: "100%" }}>
          {({ pressed }) => (
            <Text style={[styles.buttonText, { opacity: pressed ? 0.5 : 1 }]}>Обрезать изображение</Text>
          )}
        </Pressable>
      </Link>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 20,
    color: colors.black,
    textAlign: "center",
  },
});
