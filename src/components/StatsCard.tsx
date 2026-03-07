import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
          <Ionicons name="flame" size={24} color="#FF6F00" />
          <Text style={styles.streakValue}>{streak}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF9C4', // Very light yellow
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 30,
    padding: 15,
    // Comic shadow
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  headerText: {
    fontWeight: '900',
    fontSize: 14,
    color: '#000',
    textTransform: 'uppercase',
  },
  divider: {
    height: 2,
    backgroundColor: '#E0E0E0',
    width: '100%',
    marginVertical: 10,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 24,
    fontWeight: '900',
    marginLeft: 5,
  },
});
