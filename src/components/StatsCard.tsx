import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sketch, sketchShadow } from '@/constants/theme';

interface StatsCardProps {
  streak: number;
}

export default function StatsCard({ streak }: StatsCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.headerText}>QUICK STATS</Text>
      <View style={styles.divider} />
      <View style={styles.content}>
        <Text style={styles.statLabel}>Daily Streak</Text>
        <View style={styles.streakContainer}>
          <Ionicons name="flame" size={24} color={Sketch.orange} />
          <Text style={styles.streakValue}>{streak}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Sketch.yellowLight,
    borderWidth: 2.5,
    borderColor: Sketch.ink,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 30,
    padding: 15,
    ...sketchShadow(4),
  },
  headerText: {
    fontWeight: '900',
    fontSize: 13,
    color: Sketch.ink,
    letterSpacing: 1,
  },
  divider: {
    height: 2,
    backgroundColor: Sketch.inkFaint,
    width: '100%',
    marginVertical: 10,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: Sketch.ink,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 24,
    fontWeight: '900',
    marginLeft: 5,
    color: Sketch.ink,
  },
});
