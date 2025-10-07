import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

type StarRatingProps = {
  rating: number; // ví dụ 4.6
  size?: number;
};

export function StarRating({ rating, size = 16 }: StarRatingProps) {
  const fullStars = Math.floor(rating); // số sao đầy
  const hasHalfStar = rating - fullStars >= 0.5; // có nửa sao?
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {/* số sao đầy */}
      {Array(fullStars)
        .fill(0)
        .map((_, i) => (
          <MaterialCommunityIcons
            key={`full-${i}`}
            name="star"
            size={size}
            color="#FFD700"
          />
        ))}

      {/* nửa sao */}
      {hasHalfStar && (
        <MaterialCommunityIcons
          name="star-half-full"
          size={size}
          color="#FFD700"
        />
      )}

      {/* sao rỗng */}
      {Array(emptyStars)
        .fill(0)
        .map((_, i) => (
          <MaterialCommunityIcons
            key={`empty-${i}`}
            name="star-outline"
            size={size}
            color="#FFD700"
          />
        ))}

      {/* hiển thị số trung bình bên cạnh */}
      <Text style={{ marginLeft: 4 }}>{rating.toFixed(1)}</Text>
    </View>
  );
}
