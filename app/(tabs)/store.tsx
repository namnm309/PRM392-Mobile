import { TabScreenWrapper } from "@/components/TabScreenWrapper";
import { COLORS } from "@/constants/theme";
import { useTabBarBottomPadding } from "@/hooks/useTabBarBottomPadding";
import { STORE_BRANCHES, type StoreBranch } from "@/lib/storeBranches";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useRef, useState } from "react";
import {
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StoreScreen() {
  const tabBarBottomPadding = useTabBarBottomPadding();
  const insets = useSafeAreaInsets();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const mapRef = useRef<MapView | null>(null);

  const initialRegion: Region = useMemo(() => {
    const lats = STORE_BRANCHES.map((b) => b.latitude);
    const lngs = STORE_BRANCHES.map((b) => b.longitude);
    const latMin = Math.min(...lats);
    const latMax = Math.max(...lats);
    const lngMin = Math.min(...lngs);
    const lngMax = Math.max(...lngs);

    const latitude = (latMin + latMax) / 2;
    const longitude = (lngMin + lngMax) / 2;

    return {
      latitude,
      longitude,
      latitudeDelta: Math.max(latMax - latMin, 0.02),
      longitudeDelta: Math.max(lngMax - lngMin, 0.02),
    };
  }, []);

  const handleSelectBranch = (branch: StoreBranch, index: number) => {
    setSelectedBranchId(branch.id);

    // Cuộn nhẹ tới item tương ứng để người dùng thấy rõ
    if (scrollRef.current) {
      const ITEM_HEIGHT = 120;
      scrollRef.current.scrollTo({
        y: ITEM_HEIGHT * index,
        animated: true,
      });
    }

    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: branch.latitude,
          longitude: branch.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500,
      );
    }
  };

  const handleCallStore = (phone: string) => {
    const url = `tel:${phone}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      }
    });
  };

  const handleOpenDirections = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      }
    });
  };

  return (
    <TabScreenWrapper>
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
          >
            {STORE_BRANCHES.map((branch) => {
              const isSelected = branch.id === selectedBranchId;
              return (
                <Marker
                  key={branch.id}
                  coordinate={{
                    latitude: branch.latitude,
                    longitude: branch.longitude,
                  }}
                  pinColor={isSelected ? COLORS.accentRed : "#D32F2F"}
                  onPress={() =>
                    handleSelectBranch(
                      branch,
                      STORE_BRANCHES.findIndex((b) => b.id === branch.id),
                    )
                  }
                />
              );
            })}
          </MapView>

          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <View style={styles.searchInputWrap}>
              <Ionicons
                name="search-outline"
                size={18}
                color={COLORS.categoryChipTextSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                placeholder="Bạn muốn tìm shop gần khu vực nào?"
                placeholderTextColor={COLORS.categoryChipTextSecondary}
                style={styles.searchInput}
                returnKeyType="search"
              />
            </View>

            <View style={styles.filterRow}>
              <TouchableOpacity style={styles.filterChip} activeOpacity={0.7}>
                <Text style={styles.filterChipText}>Chọn Tỉnh/ Thành phố</Text>
                <Ionicons
                  name="chevron-down-outline"
                  size={16}
                  color={COLORS.categoryChipTextSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterChip} activeOpacity={0.7}>
                <Text style={styles.filterChipText}>Chọn Quận/ Huyện</Text>
                <Ionicons
                  name="chevron-down-outline"
                  size={16}
                  color={COLORS.categoryChipTextSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarBottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandTabsRow}>
            <TouchableOpacity style={styles.brandTabActive} activeOpacity={0.7}>
              <Text style={styles.brandTabTextActive}>TechStore</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.brandTab} activeOpacity={0.7}>
              <Text style={styles.brandTabText}>Đối tác 1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.brandTab} activeOpacity={0.7}>
              <Text style={styles.brandTabText}>Đối tác 2</Text>
            </TouchableOpacity>
          </View>

          {STORE_BRANCHES.map((branch, index) => {
            const isSelected = branch.id === selectedBranchId;
            return (
              <TouchableOpacity
                key={branch.id}
                style={[
                  styles.branchCard,
                  isSelected && styles.branchCardSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => handleSelectBranch(branch, index)}
              >
                <Text style={styles.branchName}>{branch.name}</Text>
                <Text style={styles.branchAddress} numberOfLines={2}>
                  {branch.addressLine1}
                </Text>
                <Text style={styles.branchAddress}>{branch.addressLine2}</Text>
                <Text style={styles.branchHours}>{branch.openingHours}</Text>

                <View style={styles.branchActionsRow}>
                  <TouchableOpacity
                    style={styles.branchAction}
                    activeOpacity={0.7}
                    onPress={() => handleCallStore(branch.phone)}
                  >
                    <Ionicons
                      name="call-outline"
                      size={16}
                      color={COLORS.accentRed}
                    />
                    <Text style={styles.branchActionText}>Gọi cửa hàng</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.branchAction}
                    activeOpacity={0.7}
                    onPress={() =>
                      handleOpenDirections(branch.latitude, branch.longitude)
                    }
                  >
                    <Ionicons
                      name="navigate-outline"
                      size={16}
                      color={COLORS.accentRed}
                    />
                    <Text style={styles.branchActionText}>Chỉ đường</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </TabScreenWrapper>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  mapContainer: {
    position: "relative",
    width: "100%",
    height: 520,
  },
  header: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "transparent",
  },
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.categoryChipBorder,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.cartTextPrimary,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  filterChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.categoryChipBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 13,
    color: COLORS.cartTextPrimary,
  },
  map: {
    height: 520,
    width: "100%",
  },
  list: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  brandTabsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  brandTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.categoryChipBorder,
    marginRight: 8,
  },
  brandTabActive: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.accentRed,
    marginRight: 8,
  },
  brandTabText: {
    fontSize: 13,
    color: COLORS.categoryChipText,
  },
  brandTabTextActive: {
    fontSize: 13,
    color: COLORS.accentRed,
    fontWeight: "600",
  },
  branchCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: COLORS.white,
  },
  branchCardSelected: {
    borderColor: COLORS.accentRed,
  },
  branchName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.cartTextPrimary,
    marginBottom: 4,
  },
  branchAddress: {
    fontSize: 13,
    color: COLORS.categoryChipText,
  },
  branchHours: {
    fontSize: 12,
    color: COLORS.categoryChipTextSecondary,
    marginTop: 4,
  },
  branchActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  branchAction: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  branchActionText: {
    fontSize: 13,
    color: COLORS.accentRed,
    marginLeft: 4,
  },
});
