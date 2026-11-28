import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamilies, layout, radius, spacing, typography } from '../theme';
import { BottomSheet } from './BottomSheet';

export type LegalDocKind = 'terms' | 'privacy';

interface LegalDocumentSheetProps {
  doc: LegalDocKind | null;
  onClose: () => void;
  externalUrl?: string;
}

const LEGAL_COPY: Record<
  LegalDocKind,
  {
    title: string;
    updated: string;
    sections: Array<{ heading: string; body: string }>;
  }
> = {
  terms: {
    title: 'Terms of Service',
    updated: 'Last updated November 2026',
    sections: [
      {
        heading: '1. Account & Eligibility',
        body: 'Expensio helps you record personal expenses, budgets, goals, and shared splits. You are responsible for keeping your account credentials and device session secure.',
      },
      {
        heading: '2. Self-Reported Financial Records',
        body: 'Account balances, income entries, budgets, and splits entered into Expensio are self-reported records and do not execute bank transfers or regulated financial advice.',
      },
      {
        heading: '3. Acceptable Use',
        body: 'Do not misuse verification OTPs, automated endpoints, or shared invite identifiers. Accounts may be rate-limited or temporarily locked after repeated failed sign-in attempts.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'Last updated November 2026',
    sections: [
      {
        heading: '1. Data Stored on Your Device',
        body: 'Authentication tokens and active session credentials are stored in encrypted native key storage (expo-secure-store). Non-sensitive preferences, budgets, and local transactions stay in app storage and are cleared on sign-out.',
      },
      {
        heading: '2. Authentication & Verification',
        body: 'When you sign in via mobile OTP, email, or Google Sign-In, Expensio sends only the verified token or contact identifier needed to authenticate your account with the API over HTTPS.',
      },
      {
        heading: '3. Permissions & Controls',
        body: 'Expensio does not collect device camera, photo library, or biometric hardware data. You may sign out at any time from Profile to remove local session and user data from this device.',
      },
    ],
  },
};

export function LegalDocumentSheet({ doc, onClose, externalUrl }: LegalDocumentSheetProps) {
  const content = doc ? LEGAL_COPY[doc] : null;

  return (
    <BottomSheet
      visible={doc !== null}
      onClose={onClose}
      accessibilityLabel={content?.title ?? 'Legal document'}
      maxHeightRatio={0.78}
    >
      {content ? (
        <View style={styles.wrap}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{content.title}</Text>
              <Text style={styles.updated}>{content.updated}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Close ${content.title}`}
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            >
              <Ionicons name="close-outline" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {content.sections.map((section) => (
              <View key={section.heading} style={styles.section}>
                <Text style={styles.sectionHeading}>{section.heading}</Text>
                <Text style={styles.sectionBody}>{section.body}</Text>
              </View>
            ))}
            {externalUrl ? (
              <Pressable
                accessibilityRole="link"
                onPress={() => {
                  void Linking.openURL(externalUrl).catch(() => {});
                }}
                style={styles.externalLink}
              >
                <Ionicons name="open-outline" size={16} color={colors.accent} />
                <Text style={styles.externalLinkText}>Open full document in browser</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  wrap: {
    maxHeight: '100%',
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  updated: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  closeBtn: {
    width: layout.headerButtonSize,
    height: layout.headerButtonSize,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  scroll: {
    maxHeight: 420,
  },
  body: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  section: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  sectionHeading: {
    ...typography.rowTitle,
    color: colors.accentDark,
    fontFamily: fontFamilies.bold,
  },
  sectionBody: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  externalLink: {
    minHeight: layout.headerButtonSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  externalLinkText: {
    ...typography.captionMedium,
    color: colors.accent,
    fontFamily: fontFamilies.semibold,
  },
});
