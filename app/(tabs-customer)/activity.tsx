import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Chip, Text } from "react-native-paper";

export default function ActivityScreen() {
  const [selectedFilter, setSelectedFilter] = React.useState("all");

  const filters = [
    { key: "all", label: "Tất cả" },
    { key: "bidding", label: "Đang báo giá" },
    { key: "progress", label: "Đang tiến hành" },
  ];

  const renderEmptyState = (title: string) => (
    <View style={styles.emptySection}>
      <Text style={styles.emptyText}>{title}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Title */}
      <Text className='text-2xl !font-bold mb-2'>Hoạt động</Text>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <Chip
            key={f.key}
            mode={selectedFilter === f.key ? "flat" : "outlined"}
            selected={selectedFilter === f.key}
            onPress={() => setSelectedFilter(f.key)}
            style={[
              styles.chip,
              selectedFilter === f.key && styles.chipSelected,
            ]}
            textStyle={[
              styles.chipText,
              selectedFilter === f.key && styles.chipTextSelected,
            ]}
          >
            {f.label}
          </Chip>
        ))}
      </View>

      {/* Empty State */}
      {renderEmptyState("Chưa có hoạt động")}

      {/* History Section */}
      <Text style={styles.sectionTitle}>Lịch sử</Text>
      {renderEmptyState("Chưa có hoạt động")}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    borderRadius: 20,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  chipSelected: {
    // xanh lá
    backgroundColor: "#4CAF50",
  },
  chipText: {
    fontSize: 12,
    color: "#444",
  },
  chipTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  emptySection: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  emptyImage: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#888",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
  },
});
