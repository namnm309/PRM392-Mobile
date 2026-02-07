import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { COLORS } from '@/constants/theme';

export type ChipTag = 'HOT' | 'MỚI';

type CategoryChipProps = {
  label: string;
  selected?: boolean;
  tag?: ChipTag;
  onPress?: () => void;
  style?: ViewStyle;
};

export function CategoryChip({
  label,
  selected = false,
  tag,
  onPress,
  style,
}: CategoryChipProps) {
  const content = (
    <View style={[styles.wrapper, selected && styles.wrapperSelected]}>
      {tag ? (
        <View style={styles.tag} pointerEvents="none">
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      ) : null}
      <Text
        style={[
          styles.label,
          selected && styles.labelSelected,
          tag && styles.labelWithTag,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.chip, style]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.chip, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    marginRight: 8,
    marginBottom: 8,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.categoryChipBorder,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
    minHeight: 36,
    position: 'relative',
  },
  wrapperSelected: {
    borderColor: COLORS.accentRed,
    backgroundColor: COLORS.accentRed,
  },
  tag: {
    position: 'absolute',
    top: -4,
    right: 8,
    backgroundColor: COLORS.accentRed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
  label: {
    fontSize: 13,
    color: COLORS.categoryChipText,
  },
  labelWithTag: {
    paddingRight: 28,
  },
  labelSelected: {
    color: COLORS.white,
  },
});
