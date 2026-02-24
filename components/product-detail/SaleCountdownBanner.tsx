import { COLORS } from '@/constants/theme';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Countdown = {
  days: number;
  hours: number;
  mins: number;
  secs: number;
};

type SaleCountdownBannerProps = {
  countdown?: Countdown;
};

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function SaleCountdownBanner({ countdown }: SaleCountdownBannerProps) {
  const [time, setTime] = useState<Countdown>(
    countdown ?? { days: 21, hours: 20, mins: 55, secs: 43 }
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => {
        let { days, hours, mins, secs } = prev;
        secs--;
        if (secs < 0) {
          secs = 59;
          mins--;
          if (mins < 0) {
            mins = 59;
            hours--;
            if (hours < 0) {
              hours = 23;
              days = Math.max(0, days - 1);
            }
          }
        }
        return { days, hours, mins, secs };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sale Tết Ant</Text>
      <View style={styles.countdownRow}>
        <Text style={styles.label}>Kết thúc sau:</Text>
        <View style={styles.numbers}>
          <Text style={styles.num}>{pad(time.days)}</Text>
          <Text style={styles.num}>{pad(time.hours)}</Text>
          <Text style={styles.num}>{pad(time.mins)}</Text>
          <Text style={styles.num}>{pad(time.secs)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.accentRed,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 12,
    color: COLORS.white,
  },
  numbers: {
    flexDirection: 'row',
    gap: 4,
  },
  num: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    minWidth: 24,
    textAlign: 'center',
  },
});
