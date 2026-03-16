import { TabScreenWrapper } from "@/components/TabScreenWrapper";
import { COLORS } from "@/constants/theme";
import { useTabBarBottomPadding } from "@/hooks/useTabBarBottomPadding";
import { STORE_BRANCHES, type StoreBranch } from "@/lib/storeBranches";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useRef, useState } from "react";
import { Linking, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StoreScreen() {
  const tabBarBottomPadding = useTabBarBottomPadding();
  const insets = useSafeAreaInsets();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(
    STORE_BRANCHES[0]?.id ?? null,
  );
  const mapRef = useRef<MapView | null>(null);

  const singleBranch = STORE_BRANCHES[0];

  const initialRegion: Region = useMemo(
    () =>
      singleBranch
        ? {
            latitude: singleBranch.latitude,
            longitude: singleBranch.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }
        : {
            latitude: 10.776,
            longitude: 106.7,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
    [singleBranch],
  );

  const handleSelectBranch = (branch: StoreBranch) => {
    setSelectedBranchId(branch.id);
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
            {singleBranch && (
              <Marker
                key={singleBranch.id}
                coordinate={{
                  latitude: singleBranch.latitude,
                  longitude: singleBranch.longitude,
                }}
                pinColor={COLORS.accentRed}
              />
            )}
          </MapView>

          <View style={[styles.header, { paddingTop: insets.top + 8 }]} />

          {singleBranch && (
            <View
              style={[
                styles.branchOverlayWrapper,
                { paddingBottom: tabBarBottomPadding + 8 },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.branchCard,
                  singleBranch.id === selectedBranchId && styles.branchCardSelected,
                ]}
                activeOpacity={0.9}
                onPress={() => handleSelectBranch(singleBranch)}
              >
                <Text style={styles.branchName}>{singleBranch.name}</Text>
                <Text style={styles.branchAddress} numberOfLines={2}>
                  {singleBranch.addressLine1}
                </Text>
                <Text style={styles.branchAddress}>
                  {singleBranch.addressLine2}
                </Text>
                <Text style={styles.branchHours}>{singleBranch.openingHours}</Text>

                <View style={styles.branchActionsRow}>
                  <TouchableOpacity
                    style={styles.branchAction}
                    activeOpacity={0.7}
                    onPress={() => handleCallStore(singleBranch.phone)}
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
                      handleOpenDirections(
                        singleBranch.latitude,
                        singleBranch.longitude,
                      )
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
            </View>
          )}
        </View>
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
    height: "100%",
  },
  header: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "transparent",
  },
  map: {
    flex: 1,
    width: "100%",
  },
  branchOverlayWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
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
    marginBottom: 8,
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
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
