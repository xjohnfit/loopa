import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import Icon, { IconName } from './Icon';

interface Props {
  icon: IconName;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon, title, subtitle }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: theme.colors.primarySoft, borderRadius: theme.radii.full },
        ]}
      >
        <Icon name={icon} size={30} color={theme.colors.primary} strokeWidth={1.75} />
      </View>
      <Text style={[theme.typography.heading, { color: theme.colors.textPrimary, marginTop: theme.spacing.lg }]}>
        {title}
      </Text>
      {subtitle && (
        <Text
          style={[
            theme.typography.bodyRegular,
            {
              color: theme.colors.textSecondary,
              marginTop: theme.spacing.xs,
              textAlign: 'center',
              paddingHorizontal: theme.spacing.xxl,
            },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  iconWrap: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
});
