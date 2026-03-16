import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Dimensions,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AIChatbotModal } from '@/components/AIChatbotModal';
import { SupportChatModal } from './SupportChatModal';
import { useAIChatbot } from '@/contexts/ai-chatbot-context';

const FAB_SIZE = 56;
const SUB_FAB_SIZE = 48;
const MINI_FAB_SIZE = 36;
const ITEM_SPACING = 12;
const SPRING_CONFIG = { damping: 22, stiffness: 140 };
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ACCENT_RED = '#E53935';
const SUPPORT_BLUE = '#1976D2';
const SUPPORT_BLUE_DARK = '#1565C0';

export function AIChatbotFab() {
  const insets = useSafeAreaInsets();
  const { openChatbot, closeChatbot, visible, fabPosition, setFabPosition } =
    useAIChatbot();
  const [showOverlay, setShowOverlay] = useState(false);
  const [supportVisible, setSupportVisible] = useState(false);
  const expandAnim = useRef(new RNAnimated.Value(0)).current;
  const expandedRef = useRef(false);

  // Cho phép FAB di chuyển gần như toàn màn hình, chỉ chừa mép rất mỏng
  const safeTop = insets.top; // tránh đè status bar
  const safeBottom = SCREEN_HEIGHT - FAB_SIZE; // không vượt khỏi đáy
  const safeLeft = 0;
  const safeRight = SCREEN_WIDTH - FAB_SIZE;
  const initY = safeBottom - 12;
  const initX = safeRight;

  useEffect(() => {
    setFabPosition({ x: initX, y: initY });
  }, [initX, initY, setFabPosition]);

  const translateX = useSharedValue(initX);
  const translateY = useSharedValue(initY);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const totalDrag = useSharedValue(0);

  const expand = useCallback(() => {
    if (expandedRef.current) return;
    expandedRef.current = true;
    setShowOverlay(true);
    RNAnimated.spring(expandAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [expandAnim]);

  const collapse = useCallback(() => {
    if (!expandedRef.current) return;
    expandedRef.current = false;
    RNAnimated.timing(expandAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setShowOverlay(false);
    });
  }, [expandAnim]);

  const toggleExpanded = useCallback(() => {
    if (expandedRef.current) collapse();
    else expand();
  }, [expand, collapse]);

  const handleAIPress = useCallback(() => {
    collapse();
    setSupportVisible(false);
    openChatbot();
  }, [collapse, openChatbot]);

  const handleSupportPress = useCallback(() => {
    collapse();
    closeChatbot();
    setSupportVisible(true);
  }, [collapse, closeChatbot]);

  const handleCloseSupport = useCallback(() => {
    setSupportVisible(false);
  }, []);

  const tapGesture = useMemo(
    () =>
      Gesture.Tap().onEnd(() => {
        runOnJS(toggleExpanded)();
      }),
    [toggleExpanded],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(8)
        .onStart(() => {
          startX.value = translateX.value;
          startY.value = translateY.value;
          totalDrag.value = 0;
        })
        .onUpdate((e) => {
          totalDrag.value +=
            Math.abs(e.translationX) + Math.abs(e.translationY);
          const x = Math.max(
            safeLeft,
            Math.min(safeRight, startX.value + e.translationX),
          );
          const y = Math.max(
            safeTop,
            Math.min(safeBottom, startY.value + e.translationY),
          );
          translateX.value = x;
          translateY.value = y;
          runOnJS(setFabPosition)({ x, y });
        })
        .onEnd(() => {
          const x = Math.max(
            safeLeft,
            Math.min(safeRight, translateX.value),
          );
          const y = Math.max(
            safeTop,
            Math.min(safeBottom, translateY.value),
          );
          translateX.value = withSpring(x, SPRING_CONFIG);
          translateY.value = withSpring(y, SPRING_CONFIG);
          runOnJS(setFabPosition)({ x, y });
          if (totalDrag.value < 10) {
            runOnJS(toggleExpanded)();
          }
        }),
    [
      safeTop,
      safeBottom,
      safeLeft,
      safeRight,
      toggleExpanded,
      setFabPosition,
      translateX,
      translateY,
      startX,
      startY,
      totalDrag,
    ],
  );

  const composedGesture = useMemo(
    () => Gesture.Race(panGesture, tapGesture),
    [panGesture, tapGesture],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const itemBaseLeft = fabPosition.x + (FAB_SIZE - SUB_FAB_SIZE) / 2;
  const itemBaseTop = fabPosition.y + (FAB_SIZE - SUB_FAB_SIZE) / 2;
  const step = SUB_FAB_SIZE + ITEM_SPACING;

  return (
    <>
      <AIChatbotModal
        visible={visible}
        onClose={closeChatbot}
        popoverMode
        fabPosition={fabPosition}
      />
      <SupportChatModal
        visible={supportVisible}
        onClose={handleCloseSupport}
        fabPosition={fabPosition}
      />

      {showOverlay && (
        <View style={styles.expandedOverlay} pointerEvents="box-none">
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={collapse}
          />

          <RNAnimated.View
            style={[
              styles.expandedItemWrap,
              {
                left: itemBaseLeft,
                top: itemBaseTop,
                opacity: expandAnim,
                transform: [
                  {
                    translateY: expandAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -2 * step],
                    }),
                  },
                  {
                    scale: expandAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                  },
                ],
              },
            ]}>
            <TouchableOpacity onPress={handleAIPress} activeOpacity={0.8}>
              <LinearGradient
                colors={['#E53935', '#D32F2F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.subFab}>
                <Ionicons name="sparkles" size={22} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </RNAnimated.View>

          <RNAnimated.View
            style={[
              styles.expandedItemWrap,
              {
                left: itemBaseLeft,
                top: itemBaseTop,
                opacity: expandAnim,
                transform: [
                  {
                    translateY: expandAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -step],
                    }),
                  },
                  {
                    scale: expandAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                  },
                ],
              },
            ]}>
            <TouchableOpacity onPress={handleSupportPress} activeOpacity={0.8}>
              <LinearGradient
                colors={[SUPPORT_BLUE, SUPPORT_BLUE_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.supportFab}>
                <Ionicons name="chatbubbles" size={22} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </RNAnimated.View>

          <RNAnimated.View
            style={[
              styles.expandedItemWrap,
              {
                left: itemBaseLeft,
                top: itemBaseTop,
                opacity: expandAnim,
                transform: [
                  {
                    scale: expandAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                  },
                ],
              },
            ]}>
            <TouchableOpacity onPress={collapse} activeOpacity={0.8}>
              <LinearGradient
                colors={['#E53935', '#D32F2F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.closeFab}>
                <Ionicons name="close" size={22} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </RNAnimated.View>
        </View>
      )}

      <GestureDetector gesture={composedGesture}>
        <Animated.View
          style={[styles.fabContainer, styles.fabOnTop, animatedStyle]}>
          <View style={styles.fabCircle}>
            <LinearGradient
              colors={['#E53935', '#D32F2F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fab}>
              <Ionicons name="sparkles" size={26} color="#FFF" />
            </LinearGradient>
          </View>
          {!showOverlay && (
            <View style={styles.miniSupport}>
              <LinearGradient
                colors={[SUPPORT_BLUE, SUPPORT_BLUE_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.miniSupportCircle}>
                <Ionicons name="chatbubbles" size={18} color="#FFF" />
              </LinearGradient>
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: FAB_SIZE,
    height: FAB_SIZE,
  },
  fabOnTop: {
    zIndex: 9999,
    elevation: 9999,
  },
  fabCircle: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    overflow: 'hidden',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#E53935',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
        }
      : { elevation: 8 }),
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniSupport: {
    position: 'absolute',
    left: -4,
    top: FAB_SIZE - MINI_FAB_SIZE + 4,
  },
  miniSupportCircle: {
    width: MINI_FAB_SIZE,
    height: MINI_FAB_SIZE,
    borderRadius: MINI_FAB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: SUPPORT_BLUE,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        }
      : { elevation: 6 }),
  },
  expandedOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
    elevation: 10000,
  },
  expandedItemWrap: {
    position: 'absolute',
    zIndex: 10001,
    elevation: 10001,
  },
  subFab: {
    width: SUB_FAB_SIZE,
    height: SUB_FAB_SIZE,
    borderRadius: SUB_FAB_SIZE / 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: ACCENT_RED,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
        }
      : { elevation: 8 }),
  },
  supportFab: {
    width: SUB_FAB_SIZE,
    height: SUB_FAB_SIZE,
    borderRadius: SUB_FAB_SIZE / 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: SUPPORT_BLUE,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
        }
      : { elevation: 8 }),
  },
  closeFab: {
    width: SUB_FAB_SIZE,
    height: SUB_FAB_SIZE,
    borderRadius: SUB_FAB_SIZE / 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: ACCENT_RED,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
        }
      : { elevation: 8 }),
  },
});
