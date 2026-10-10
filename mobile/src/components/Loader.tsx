import { View, ActivityIndicator } from "react-native";
import COLORS from "../../constants/colors";

export default function Loader({
  size = "large",
}: {
  size?: number | "large" | "small" | undefined;
}) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.background,
      }}
    >
      <ActivityIndicator size={size} color={COLORS.primary} />
    </View>
  );
}
