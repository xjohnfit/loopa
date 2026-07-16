import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import Icon, { IconName } from './Icon';

interface Props {
  icon: IconName;
  label: string;
  color: string;
  onPress: () => void;
}

export default function ActionCard({ icon, label, color, onPress }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: color,
          borderRadius: theme.radii.lg,
          padding: theme.spacing.lg,
          opacity: pressed ? 0.85 : 1,
        },
        theme.shadow('sm'),
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
        <Icon name={icon} size={18} color="#FFFFFF" strokeWidth={2.25} />
      </View>
      <Text style={[theme.typography.heading, styles.label]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 90, justifyContent: 'space-between' },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  label: { color: '#FFFFFF' },
});
