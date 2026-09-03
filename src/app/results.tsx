import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResultsScreen() {
  const { businessName, location } = useLocalSearchParams<{
    businessName?: string;
    location?: string;
  }>();

  const [showThemes, setShowThemes] = useState(false);
  const [showCompetitors, setShowCompetitors] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>REPUTATION RESULTS</Text>

        <Text style={styles.businessName}>
          {businessName ?? 'Demo Business'}
        </Text>

        <Text style={styles.location}>
          {location ?? 'Bengaluru, India'}
        </Text>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.rating}>4.2</Text>
            <Text style={styles.stars}>★★★★★</Text>
            <Text style={styles.reviewCount}>187 reviews</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryMetric}>
            <Text style={styles.metricValue}>14.5</Text>
            <Text style={styles.metricLabel}>reviews / month</Text>
          </View>
        </View>

        {/* Quick assessment */}
        <View style={styles.assessmentCard}>
          <Text style={styles.cardTitle}>At a glance</Text>

          <View style={styles.assessmentRow}>
            <Text style={styles.assessmentLabel}>Strength</Text>
            <Text style={styles.assessmentValue}>Staff & results</Text>
          </View>

          <View style={styles.assessmentRow}>
            <Text style={styles.assessmentLabel}>Main issue</Text>
            <Text style={styles.assessmentValue}>Waiting times</Text>
          </View>

          <View style={styles.assessmentRow}>
            <Text style={styles.assessmentLabel}>Response rate</Text>
            <Text style={styles.assessmentValue}>72%</Text>
          </View>

          <View style={styles.assessmentRow}>
            <Text style={styles.assessmentLabel}>Latest review</Text>
            <Text style={styles.assessmentValue}>2 days ago</Text>
          </View>
        </View>

        {/* Rating distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rating distribution</Text>

          <RatingBar label="5★" value={121} total={187} />
          <RatingBar label="4★" value={38} total={187} />
          <RatingBar label="3★" value={14} total={187} />
          <RatingBar label="2★" value={7} total={187} />
          <RatingBar label="1★" value={7} total={187} />
        </View>

        {/* Themes */}
        <ExpandableSection
          title="Customer themes"
          subtitle="What customers talk about most"
          expanded={showThemes}
          onPress={() => setShowThemes(!showThemes)}
        >
          <ThemeRow
            theme="Staff"
            mentions="46 mentions"
            sentiment="Positive"
          />

          <ThemeRow
            theme="Results"
            mentions="39 mentions"
            sentiment="Positive"
          />

          <ThemeRow
            theme="Waiting time"
            mentions="31 mentions"
            sentiment="Negative"
          />

          <ThemeRow
            theme="Booking"
            mentions="18 mentions"
            sentiment="Mixed"
          />
        </ExpandableSection>

        {/* Strengths / weaknesses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Strengths & weaknesses</Text>

          <View style={styles.insightCard}>
            <Text style={styles.insightHeading}>✓ Strengths</Text>

            <Text style={styles.insightText}>
              • Friendly and knowledgeable staff
            </Text>

            <Text style={styles.insightText}>
              • Customers frequently praise results
            </Text>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightHeading}>! Weaknesses</Text>

            <Text style={styles.insightText}>
              • Waiting times are the most repeated complaint
            </Text>

            <Text style={styles.insightText}>
              • Some customers mention appointment delays
            </Text>
          </View>
        </View>

        {/* Unanswered */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Needs a reply</Text>

          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.oneStar}>★ 1</Text>
              <Text style={styles.reviewDate}>2 days ago</Text>
            </View>

            <Text style={styles.reviewText}>
              "Waited 40 minutes past my appointment. Nobody explained
              the delay."
            </Text>

            <Pressable style={styles.replyButton}>
              <Text style={styles.replyButtonText}>View suggested reply</Text>
            </Pressable>
          </View>

          <Text style={styles.moreText}>3 more unanswered</Text>
        </View>

        {/* Competitors */}
        <ExpandableSection
          title="Competitor comparison"
          subtitle="Same category, same area"
          expanded={showCompetitors}
          onPress={() => setShowCompetitors(!showCompetitors)}
        >
          <CompetitorRow
            name={businessName ?? 'This business'}
            rating="4.2"
            reviews="187"
            responseRate="72%"
          />

          <CompetitorRow
            name="Competitor A"
            rating="4.5"
            reviews="243"
            responseRate="81%"
          />

          <CompetitorRow
            name="Competitor B"
            rating="4.0"
            reviews="156"
            responseRate="64%"
          />
        </ExpandableSection>

        {/* Recommendations */}
        <ExpandableSection
          title="Recommended actions"
          subtitle="Prioritized by impact"
          expanded={showRecommendations}
          onPress={() =>
            setShowRecommendations(!showRecommendations)
          }
        >
          <Recommendation
            priority="High"
            action="Address the four recent unanswered one-star reviews."
          />

          <Recommendation
            priority="High"
            action="Investigate appointment delays and waiting times."
          />

          <Recommendation
            priority="Medium"
            action="Use positive staff and results feedback in marketing."
          />
        </ExpandableSection>

        <Pressable
          style={styles.newAnalysisButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.newAnalysisText}>
            Analyze another business
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function RatingBar({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage = (value / total) * 100;

  return (
    <View style={styles.ratingRow}>
      <Text style={styles.ratingLabel}>{label}</Text>

      <View style={styles.ratingTrack}>
        <View
          style={[
            styles.ratingFill,
            { width: `${percentage}%` },
          ]}
        />
      </View>

      <Text style={styles.ratingNumber}>{value}</Text>
    </View>
  );
}

function ThemeRow({
  theme,
  mentions,
  sentiment,
}: {
  theme: string;
  mentions: string;
  sentiment: string;
}) {
  return (
    <View style={styles.themeRow}>
      <View>
        <Text style={styles.themeName}>{theme}</Text>
        <Text style={styles.themeMentions}>{mentions}</Text>
      </View>

      <Text
        style={[
          styles.sentiment,
          sentiment === 'Positive'
            ? styles.positive
            : sentiment === 'Negative'
              ? styles.negative
              : styles.mixed,
        ]}
      >
        {sentiment}
      </Text>
    </View>
  );
}

function ExpandableSection({
  title,
  subtitle,
  expanded,
  onPress,
  children,
}: {
  title: string;
  subtitle: string;
  expanded: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.expandable}>
      <Pressable onPress={onPress} style={styles.expandableHeader}>
        <View style={styles.expandableText}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>

        <Text style={styles.chevron}>{expanded ? '⌃' : '›'}</Text>
      </Pressable>

      {expanded && (
        <View style={styles.expandedContent}>
          {children}
        </View>
      )}
    </View>
  );
}

function CompetitorRow({
  name,
  rating,
  reviews,
  responseRate,
}: {
  name: string;
  rating: string;
  reviews: string;
  responseRate: string;
}) {
  return (
    <View style={styles.competitorRow}>
      <Text style={styles.competitorName}>{name}</Text>

      <View>
        <Text style={styles.competitorMetric}>
          {rating} ★ · {reviews} reviews
        </Text>

        <Text style={styles.competitorResponse}>
          {responseRate} response rate
        </Text>
      </View>
    </View>
  );
}

function Recommendation({
  priority,
  action,
}: {
  priority: string;
  action: string;
}) {
  return (
    <View style={styles.recommendation}>
      <Text style={styles.priority}>{priority}</Text>
      <Text style={styles.recommendationText}>{action}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#667085',
  },

  businessName: {
    marginTop: 12,
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },

  location: {
    marginTop: 4,
    fontSize: 15,
    color: '#667085',
  },

  summaryCard: {
    marginTop: 28,
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    flexDirection: 'row',
    alignItems: 'center',
  },

  rating: {
    fontSize: 42,
    fontWeight: '700',
    color: '#111827',
  },

  stars: {
    marginTop: -2,
    fontSize: 18,
    letterSpacing: 2,
    color: '#F59E0B',
  },

  reviewCount: {
    marginTop: 5,
    fontSize: 13,
    color: '#667085',
  },

  summaryDivider: {
    width: 1,
    height: 70,
    marginHorizontal: 24,
    backgroundColor: '#EAECF0',
  },

  summaryMetric: {
    flex: 1,
  },

  metricValue: {
    fontSize: 25,
    fontWeight: '700',
    color: '#111827',
  },

  metricLabel: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#667085',
  },

  assessmentCard: {
    marginTop: 16,
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
  },

  cardTitle: {
    marginBottom: 14,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  assessmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
  },

  assessmentLabel: {
    fontSize: 14,
    color: '#667085',
  },

  assessmentValue: {
    maxWidth: '55%',
    fontSize: 14,
    fontWeight: '600',
    color: '#344054',
    textAlign: 'right',
  },

  section: {
    marginTop: 28,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#667085',
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
  },

  ratingLabel: {
    width: 30,
    fontSize: 13,
    fontWeight: '600',
    color: '#344054',
  },

  ratingTrack: {
    flex: 1,
    height: 8,
    marginHorizontal: 10,
    borderRadius: 4,
    backgroundColor: '#E4E7EC',
    overflow: 'hidden',
  },

  ratingFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },

  ratingNumber: {
    width: 30,
    fontSize: 13,
    color: '#667085',
    textAlign: 'right',
  },

  expandable: {
    marginTop: 28,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
  },

  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  expandableText: {
    flex: 1,
  },

  chevron: {
    fontSize: 28,
    color: '#667085',
  },

  expandedContent: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#EAECF0',
    paddingTop: 12,
  },

  themeRow: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  themeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#344054',
  },

  themeMentions: {
    marginTop: 3,
    fontSize: 13,
    color: '#667085',
  },

  sentiment: {
    fontSize: 13,
    fontWeight: '700',
  },

  positive: {
    color: '#15803D',
  },

  negative: {
    color: '#B42318',
  },

  mixed: {
    color: '#B54708',
  },

  insightCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
  },

  insightHeading: {
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#344054',
  },

  insightText: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    color: '#667085',
  },

  reviewCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
  },

  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  oneStar: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B42318',
  },

  reviewDate: {
    fontSize: 13,
    color: '#667085',
  },

  reviewText: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: '#344054',
  },

  replyButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
  },

  replyButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },

  moreText: {
    marginTop: 10,
    fontSize: 13,
    color: '#667085',
  },

  competitorRow: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
  },

  competitorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#344054',
  },

  competitorMetric: {
    marginTop: 5,
    fontSize: 14,
    color: '#344054',
  },

  competitorResponse: {
    marginTop: 3,
    fontSize: 13,
    color: '#667085',
  },

  recommendation: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
  },

  priority: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#B54708',
    textTransform: 'uppercase',
  },

  recommendationText: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    color: '#344054',
  },

  newAnalysisButton: {
    height: 54,
    marginTop: 30,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  newAnalysisText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563EB',
  },
});