import React from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { COLORS } from '@/constants/theme';

type Props = TextInputProps & {
  style?: object;
};

export function SearchBar({ style, ...rest }: Props) {
  return (
    <View style={[styles.container, style]}>
      <TextInput
        placeholderTextColor={COLORS.grey}
        style={styles.input}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  input: {
    color: COLORS.white,
    fontSize: 15,
  },
});

