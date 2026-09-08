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
import { getAnalysis } from './analysisStore';

// =========================================================
// TYPES
// =========================================================

type Theme = {
  theme: string;
  mentions: number;
  sentiment: 'positive' | 'mixed' | 'negative';
  quotes: string[];
  evidenceStrength?: 'limited' | 'moderate' | 'strong';
};

type Competitor = {
  name: string;
  placeId: string;
  address: string | null;
  rating: number | null;
  reviewCount: number | null;
  primaryType: string | null;
  velocity: number | null;
  velocityTrend: string;
  responseRate: number | null;
  responseRateStatus: string;
  responseRateNote?: string;
  reviewsSampled: number;
};

type Review = {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string | null;
  source: string;
};

type SuggestedReply = {
  reviewId: string;
  rating: number;
  text: string;
  suggestedReply: string;
  responseStatus: string;
  responseStatusNote?: string;
};

export type Analysis = {
  business: {
    name: string;
    address: string;
    placeId: string;
    rating: number | null;
    reviewCount: number | null;
    lastReviewDate: string | null;
    primaryType?: string | null;
  };

  dataQuality: {
    totalBusinessReviews: number | null;
    reviewsCollected: number;
    reviewsWithText: number;
    analysisCoverage: string;
    note: string;
    velocityNote?: string;
  };

  sources: Array<{
    platform: string;
    reviewsCollected: number;
    method: string;
    reliability?: string;
    durability?: string;
  }>;

  metrics: {
    averageRating: number | null;

    ratingDistribution: {
      '5': number;
      '4': number;
      '3': number;
      '2': number;
      '1': number;
    };

    sentimentCounts: {
      positive: number;
      mixed: number;
      negative: number;
    };

    reviewDates: {
      first: string | null;
      last: string | null;
    };

    velocity: {
      perMonth: number | null;
      trend: string;
      monthsCovered: number;
      sampleBased?: boolean;
    };

    reviewCount: number;
    reviewsWithText: number;
  };

  themes: Theme[];

  strengths: string[];

  weaknesses: string[];

  aiAnalysis?: {
    model: string;
    note: string;
  };

  competitorSearch?: {
    type: string;
    radiusMeters: number;
    note: string;
  };

  competitors: Competitor[];

  responseRate: number | null;
  responseRateStatus: string;
  responseRateNote: string;

  unanswered: SuggestedReply[];

  suggestedReplies: SuggestedReply[];

  reviews: Review[];
};

// =========================================================
// HELPERS
// =========================================================

function getParamValue(
  value: string | string[] | undefined
) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function formatNumber(
  value: number | null | undefined
) {
  if (
    value === null ||
    value === undefined
  ) {
    return '—';
  }

  return value.toLocaleString();
}

function formatRating(
  value: number | null | undefined
) {
  if (
    value === null ||
    value === undefined
  ) {
    return '—';
  }

  return value.toFixed(1);
}

function formatDate(
  value: string | null | undefined
) {
  if (!value) {
    return '—';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—';
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  );
}

function getRelativeDate(
  value: string | null | undefined
) {
  if (!value) {
    return 'Date unavailable';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Date unavailable';
  }

  const now =
    new Date();

  const difference =
    Math.floor(
      (
        now.getTime() -
        date.getTime()
      ) /
        (1000 * 60 * 60 * 24)
    );

  if (difference <= 0) {
    return 'Today';
  }

  if (difference === 1) {
    return 'Yesterday';
  }

  if (difference < 30) {
    return `${difference} days ago`;
  }

  return formatDate(value);
}

function capitalize(
  value: string
) {
  if (!value) {
    return '';
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

// =========================================================
// MAIN SCREEN
// =========================================================

export default function ResultsScreen() {
  const params =
    useLocalSearchParams<{
      businessName?: string | string[];
      location?: string | string[];
    }>();

  const businessName =
    getParamValue(
      params.businessName
    );

  const location =
    getParamValue(
      params.location
    );

  const [showThemes, setShowThemes] =
    useState(false);

  const [showStrengths, setShowStrengths] =
    useState(false);

  const [showWeaknesses, setShowWeaknesses] =
    useState(false);

  const [showReplies, setShowReplies] =
    useState(false);

  const [showCompetitors, setShowCompetitors] =
    useState(false);

  const [showRecommendations, setShowRecommendations] =
    useState(false);

  const [selectedReplyId, setSelectedReplyId] =
    useState<string | null>(null);

  const analysis = getAnalysis();

  // =======================================================
  // SAFE FALLBACK
  // =======================================================

  if (!analysis) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>
              !
            </Text>
          </View>

          <Text style={styles.errorEyebrow}>
            REPUTATION INTELLIGENCE
          </Text>

          <Text style={styles.errorTitle}>
            Results unavailable
          </Text>

          <Text style={styles.errorText}>
            We could not read the analysis returned by
            the server.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.newAnalysisButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() =>
              router.replace('/')
            }
          >
            <Text style={styles.newAnalysisText}>
              Analyze another business
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // =======================================================
  // DATA
  // =======================================================

  const business =
    analysis.business;

  const metrics =
    analysis.metrics;

  const dataQuality =
    analysis.dataQuality;

  const themes =
    analysis.themes ?? [];

  const strengths =
    analysis.strengths ?? [];

  const weaknesses =
    analysis.weaknesses ?? [];

  const competitors =
    analysis.competitors ?? [];

  const suggestedReplies =
    analysis.suggestedReplies ??
    analysis.unanswered ??
    [];

  // =======================================================
  // RECOMMENDATIONS
  //
  // Derived from actual returned analysis.
  // Recommendations should not overstate limited
  // review sample evidence.
  // =======================================================

  const recommendations = (() => {
    const result: Array<{
      priority: string;
      action: string;
    }> = [];

    const normalize = (value: string) =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, ' ')
        .split(/\s+/)
        .filter(
          (word) =>
            word.length >= 4
        );

    const isRelatedToWeakness = (
      themeName: string
    ) => {
      const themeWords =
        normalize(themeName);

      return weaknesses.some(
        (weakness) => {
          const weaknessWords =
            normalize(weakness);

          const sharedWords =
            themeWords.filter(
              (word) =>
                weaknessWords.includes(
                  word
                )
            );

          return (
            sharedWords.length >= 2
          );
        }
      );
    };

    // =====================================================
    // WEAKNESSES
    // =====================================================

    weaknesses
      .slice(0, 2)
      .forEach((weakness) => {
        result.push({
          priority: 'Medium',
          action:
            `Address the reported concern: ${weakness}`,
        });
      });

    // =====================================================
    // NEGATIVE THEMES
    // =====================================================

    themes
      .filter(
        (theme) =>
          theme.sentiment ===
          'negative'
      )
      .sort(
        (a, b) =>
          b.mentions -
          a.mentions
      )
      .slice(0, 2)
      .forEach((theme) => {
        if (
          isRelatedToWeakness(
            theme.theme
          )
        ) {
          return;
        }

        result.push({
          priority:
            theme.mentions >= 2
              ? 'High'
              : 'Medium',

          action:
            theme.mentions >= 2
              ? `Investigate the recurring "${theme.theme}" issue mentioned across multiple customer reviews.`
              : `Investigate the reported "${theme.theme}" concern in the available review sample.`,
        });
      });

    // =====================================================
    // MIXED THEMES
    // =====================================================

    themes
      .filter(
        (theme) =>
          theme.sentiment ===
          'mixed'
      )
      .sort(
        (a, b) =>
          b.mentions -
          a.mentions
      )
      .slice(0, 1)
      .forEach((theme) => {
        result.push({
          priority: 'Medium',
          action:
            `Review the mixed feedback around "${theme.theme}" and identify what drives the positive and negative experiences.`,
        });
      });

    // =====================================================
    // POSITIVE THEMES
    // =====================================================

    if (
      result.length === 0 &&
      themes.length > 0
    ) {
      const strongestPositive =
        themes
          .filter(
            (theme) =>
              theme.sentiment ===
              'positive'
          )
          .sort(
            (a, b) =>
              b.mentions -
              a.mentions
          )[0];

      if (strongestPositive) {
        result.push({
          priority: 'Medium',
          action:
            `Protect and reinforce the positive customer experience around "${strongestPositive.theme}".`,
        });
      }
    }

    // =====================================================
    // FALLBACK
    // =====================================================

    if (
      result.length === 0
    ) {
      result.push({
        priority: 'Medium',
        action:
          'Collect more review history before making a stronger operational recommendation.',
      });
    }

    return result.slice(
      0,
      4
    );
  })();

  // =======================================================
  // DERIVED VALUES
  // =======================================================

  const distribution =
    metrics.ratingDistribution;

  const totalDistribution =
    Object.values(
      distribution
    ).reduce(
      (
        total,
        value
      ) =>
        total + value,
      0
    );

  const latestReviewDate =
    metrics.reviewDates.last ??
    business.lastReviewDate;

  const velocityUnavailable =
    metrics.velocity.sampleBased ||
    metrics.velocity.monthsCovered <
      1 ||
    metrics.velocity.trend ===
      'insufficient_data' ||
    metrics.velocity.perMonth ===
      null;

  const responseUnavailable =
    analysis.responseRate ===
      null ||
    analysis.responseRateStatus ===
      'unavailable';

  const semanticAnalysisUnavailable =
    !analysis.aiAnalysis ||
    analysis.aiAnalysis.note
      ?.toLowerCase()
      .includes(
        'unavailable'
      );

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <View
          style={
            styles.header
          }
        >
          <View style={styles.headerPill}>
            <View style={styles.headerPillDot} />

            <Text
              style={
                styles.headerEyebrow
              }
            >
              REPUTATION INTELLIGENCE
            </Text>
          </View>

          <Text
            style={
              styles.headerTitle
            }
          >
            Analysis results
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
            numberOfLines={2}
          >
            {business.name}
          </Text>

          {location ? (
            <Text
              style={
                styles.headerLocation
              }
              numberOfLines={1}
            >
              {location}
            </Text>
          ) : null}
        </View>

        {/* =================================================
            BUSINESS SUMMARY
        ================================================= */}

        <View
          style={
            styles.summaryCard
          }
        >
          <View
            style={
              styles.summaryTop
            }
          >
            <View
              style={
                styles.summaryBusiness
              }
            >
              <View style={styles.businessTypePill}>
                <Text style={styles.businessTypeText}>
                  {capitalize(
                    business.primaryType ||
                      'Business'
                  )}
                </Text>
              </View>

              <Text
                style={
                  styles.summaryName
                }
                numberOfLines={2}
              >
                {business.name}
              </Text>

              <Text
                style={
                  styles.summaryAddress
                }
                numberOfLines={2}
              >
                {business.address ||
                  'Address unavailable'}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.summaryMetrics
            }
          >
            {/* RATING */}

            <View
              style={
                styles.summaryMetric
              }
            >
              <Text
                style={
                  styles.metricCaption
                }
              >
                RATING
              </Text>

              <View style={styles.ratingValueRow}>
                <Text
                  style={
                    styles.metricValue
                  }
                >
                  {formatRating(
                    business.rating
                  )}
                </Text>

                <Text style={styles.summaryStar}>
                  ★
                </Text>
              </View>

              <Text
                style={
                  styles.metricLabel
                }
              >
                Google rating
              </Text>
            </View>

            {/* REVIEW COUNT */}

            <View
              style={
                styles.summaryMetric
              }
            >
              <Text
                style={
                  styles.metricCaption
                }
              >
                REVIEWS
              </Text>

              <Text
                style={
                  styles.metricValue
                }
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {formatNumber(
                  business.reviewCount
                )}
              </Text>

              <Text
                style={
                  styles.metricLabel
                }
              >
                Google reviews
              </Text>
            </View>

            {/* VELOCITY */}

            <View
              style={[
                styles.summaryMetric,
                styles.velocityMetric,
              ]}
            >
              <Text
                style={
                  styles.metricCaption
                }
              >
                VELOCITY
              </Text>

              <Text
                style={
                  velocityUnavailable
                    ? styles.metricUnavailable
                    : styles.metricValue
                }
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
              >
                {velocityUnavailable
                  ? 'Insufficient data'
                  : `~${metrics.velocity.perMonth}`}
              </Text>

              <Text
                style={
                  styles.metricLabel
                }
              >
                {velocityUnavailable
                  ? 'Monthly rate unavailable'
                  : 'reviews / month'}
              </Text>

              {velocityUnavailable ? (
                <View style={styles.sampleBadge}>
                  <Text style={styles.sampleBadgeText}>
                    Limited sample
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* =================================================
            AT A GLANCE
        ================================================= */}

        <View
          style={
            styles.section
          }
        >
          <View style={styles.sectionHeadingRow}>
            <View style={styles.sectionAccent} />

            <View>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                At a glance
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                The most useful signals from the available
                review evidence.
              </Text>
            </View>
          </View>

          <View
            style={
              styles.glanceGrid
            }
          >
            <View
              style={[
                styles.glanceCard,
                styles.glanceCardBlue,
              ]}
            >
              <View style={styles.glanceIconCircle}>
                <Text style={styles.glanceIconText}>
                  +
                </Text>
              </View>

              <Text
                style={
                  styles.glanceLabel
                }
              >
                Strongest signal
              </Text>

              <Text
                style={
                  styles.glanceValue
                }
                numberOfLines={3}
              >
                {strengths.length >
                0
                  ? strengths[0]
                  : 'No clear signal'}
              </Text>
            </View>

            <View
              style={[
                styles.glanceCard,
                styles.glanceCardNeutral,
              ]}
            >
              <View style={styles.glanceIconCircleNeutral}>
                <Text style={styles.glanceIconTextNeutral}>
                  !
                </Text>
              </View>

              <Text
                style={
                  styles.glanceLabel
                }
              >
                Main concern
              </Text>

              <Text
                style={
                  styles.glanceValue
                }
                numberOfLines={3}
              >
                {weaknesses.length >
                0
                  ? weaknesses[0]
                  : 'No clear weakness'}
              </Text>
            </View>

            <View
              style={[
                styles.glanceCard,
                styles.glanceCardNeutral,
              ]}
            >
              <View style={styles.glanceIconCircleNeutral}>
                <Text style={styles.glanceIconTextNeutral}>
                  ↗
                </Text>
              </View>

              <Text
                style={
                  styles.glanceLabel
                }
              >
                Owner response
              </Text>

              <Text
                style={
                  styles.glanceValue
                }
                numberOfLines={2}
              >
                {responseUnavailable
                  ? 'Unavailable'
                  : `${analysis.responseRate}%`}
              </Text>

              <Text style={styles.glanceHelper}>
                {responseUnavailable
                  ? 'Not exposed by source'
                  : 'Based on available data'}
              </Text>
            </View>

            <View
              style={[
                styles.glanceCard,
                styles.glanceCardNeutral,
              ]}
            >
              <View style={styles.glanceIconCircleNeutral}>
                <Text style={styles.glanceIconTextNeutral}>
                  ◷
                </Text>
              </View>

              <Text
                style={
                  styles.glanceLabel
                }
              >
                Latest review
              </Text>

              <Text
                style={
                  styles.glanceValue
                }
                numberOfLines={2}
              >
                {getRelativeDate(
                  latestReviewDate
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* =================================================
            RATING DISTRIBUTION
        ================================================= */}

        <View
          style={
            styles.section
          }
        >
          <View style={styles.sectionHeadingRow}>
            <View style={styles.sectionAccent} />

            <View>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Rating distribution
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Distribution across the reviews available
                from the source.
              </Text>
            </View>
          </View>

          <View
            style={
              styles.distributionCard
            }
          >
            {[
              {
                rating: 5,
                count:
                  distribution['5'],
              },
              {
                rating: 4,
                count:
                  distribution['4'],
              },
              {
                rating: 3,
                count:
                  distribution['3'],
              },
              {
                rating: 2,
                count:
                  distribution['2'],
              },
              {
                rating: 1,
                count:
                  distribution['1'],
              },
            ].map(
              ({
                rating,
                count,
              }) => {
                const percentage =
                  totalDistribution >
                  0
                    ? (count /
                        totalDistribution) *
                      100
                    : 0;

                return (
                  <View
                    key={
                      rating
                    }
                    style={
                      styles.ratingRow
                    }
                  >
                    <Text
                      style={
                        styles.ratingLabel
                      }
                    >
                      {rating}★
                    </Text>

                    <View
                      style={
                        styles.ratingTrack
                      }
                    >
                      <View
                        style={[
                          styles.ratingFill,
                          {
                            width: `${percentage}%`,
                          },
                        ]}
                      />
                    </View>

                    <Text
                      style={
                        styles.ratingNumber
                      }
                    >
                      {count}
                    </Text>
                  </View>
                );
              }
            )}

            <View style={styles.distributionFooter}>
              <Text style={styles.distributionFooterText}>
                Based on {formatNumber(totalDistribution)}{' '}
                collected reviews
              </Text>

              <Text style={styles.distributionFooterText}>
                {dataQuality.reviewsWithText}{' '}
                with text
              </Text>
            </View>
          </View>
        </View>

        {/* =================================================
            VELOCITY
        ================================================= */}

        <View
          style={
            styles.velocityCard
          }
        >
          <View style={styles.cardTopRow}>
            <View style={styles.cardIconBlue}>
              <Text style={styles.cardIconText}>
                ↗
              </Text>
            </View>

            <View style={styles.cardTopText}>
              <Text
                style={
                  styles.velocityTitle
                }
              >
                Review velocity
              </Text>

              <Text
                style={
                  styles.velocitySubtitle
                }
              >
                How quickly new reviews appear in the available
                sample.
              </Text>
            </View>
          </View>

          <View
            style={
              styles.velocityMain
            }
          >
            <Text
              style={
                velocityUnavailable
                  ? styles.velocityUnavailable
                  : styles.velocityValue
              }
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {velocityUnavailable
                ? 'Insufficient data'
                : `~${metrics.velocity.perMonth}`}
            </Text>

            {!velocityUnavailable ? (
              <Text
                style={
                  styles.velocityUnit
                }
              >
                reviews / month
              </Text>
            ) : (
              <Text style={styles.velocityUnavailableNote}>
                Monthly rate unavailable from the limited Google
                review sample.
              </Text>
            )}
          </View>

          <View
            style={
              styles.velocityStatus
            }
          >
            <View style={styles.statusDot} />

            <Text
              style={
                styles.velocityStatusText
              }
            >
              Trend:{' '}
              {velocityUnavailable
                ? 'Insufficient data from the available review sample'
                : capitalize(
                    metrics.velocity.trend
                  )}
            </Text>
          </View>
        </View>

        {/* =================================================
            THEMES
        ================================================= */}

        <Pressable
          style={
            styles.expandable
          }
          onPress={() =>
            setShowThemes(
              !showThemes
            )
          }
        >
          <View
            style={
              styles.expandableHeader
            }
          >
            <View style={styles.sectionIconBlue}>
              <Text style={styles.sectionIconText}>
                ✦
              </Text>
            </View>

            <View
              style={
                styles.expandableText
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Customer themes
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Topics appearing in the available review text.
              </Text>
            </View>

            <Text
              style={
                styles.chevron
              }
            >
              {showThemes
                ? '⌃'
                : '⌄'}
            </Text>
          </View>

          {showThemes ? (
            <View
              style={
                styles.expandedContent
              }
            >
              {themes.length ===
              0 ? (
                <View
                  style={
                    styles.emptySection
                  }
                >
                  <View style={styles.emptyIcon}>
                    <Text style={styles.emptyIconText}>
                      i
                    </Text>
                  </View>

                  <View style={styles.emptyTextContainer}>
                    <Text style={styles.emptySectionTitle}>
                      Insufficient review evidence
                    </Text>

                    <Text
                      style={
                        styles.emptySectionText
                      }
                    >
                      Only {dataQuality.reviewsWithText} reviews
                      contained usable text, so recurring themes
                      cannot be identified reliably.
                    </Text>
                  </View>
                </View>
              ) : (
                themes.map(
                  (
                    theme,
                    index
                  ) => (
                    <View
                      key={`${theme.theme}-${index}`}
                      style={
                        styles.themeContainer
                      }
                    >
                      <View
                        style={
                          styles.themeRow
                        }
                      >
                        <View
                          style={
                            styles.themeTextContainer
                          }
                        >
                          <Text
                            style={
                              styles.themeName
                            }
                          >
                            {theme.theme}
                          </Text>

                          <Text
                            style={
                              styles.themeMentions
                            }
                          >
                            {theme.mentions}{' '}
                            {theme.mentions ===
                            1
                              ? 'mention'
                              : 'mentions'}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.sentimentBadge,
                            theme.sentiment ===
                            'positive'
                              ? styles.sentimentBadgePositive
                              : theme.sentiment ===
                                'negative'
                              ? styles.sentimentBadgeNegative
                              : styles.sentimentBadgeMixed,
                          ]}
                        >
                          <Text
                            style={[
                              styles.sentiment,
                              theme.sentiment ===
                              'positive'
                                ? styles.positive
                                : theme.sentiment ===
                                  'negative'
                                ? styles.negative
                                : styles.mixed,
                            ]}
                          >
                            {capitalize(
                              theme.sentiment
                            )}
                          </Text>
                        </View>
                      </View>

                      {theme.evidenceStrength ? (
                        <Text
                          style={
                            styles.evidenceText
                          }
                        >
                          Evidence:{' '}
                          {capitalize(
                            theme.evidenceStrength
                          )}
                        </Text>
                      ) : null}

                      {theme.quotes?.length >
                      0 ? (
                        <View
                          style={
                            styles.quoteContainer
                          }
                        >
                          {theme.quotes
                            .slice(
                              0,
                              2
                            )
                            .map(
                              (
                                quote,
                                quoteIndex
                              ) => (
                                <Text
                                  key={
                                    quoteIndex
                                  }
                                  style={
                                    styles.quoteText
                                  }
                                >
                                  “{quote}”
                                </Text>
                              )
                            )}
                        </View>
                      ) : null}
                    </View>
                  )
                )
              )}
            </View>
          ) : null}
        </Pressable>

        {/* =================================================
            STRENGTHS
        ================================================= */}

        <Pressable
          style={
            styles.expandable
          }
          onPress={() =>
            setShowStrengths(
              !showStrengths
            )
          }
        >
          <View
            style={
              styles.expandableHeader
            }
          >
            <View style={styles.sectionIconPositive}>
              <Text style={styles.sectionIconTextPositive}>
                +
              </Text>
            </View>

            <View
              style={
                styles.expandableText
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Strengths
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Positive signals supported by the available
                review evidence.
              </Text>
            </View>

            <Text
              style={
                styles.chevron
              }
            >
              {showStrengths
                ? '⌃'
                : '⌄'}
            </Text>
          </View>

          {showStrengths ? (
            <View
              style={
                styles.expandedContent
              }
            >
              {strengths.length ===
              0 ? (
                <View
                  style={
                    styles.emptySection
                  }
                >
                  <View style={styles.emptyIcon}>
                    <Text style={styles.emptyIconText}>
                      i
                    </Text>
                  </View>

                  <View style={styles.emptyTextContainer}>
                    <Text style={styles.emptySectionTitle}>
                      Insufficient review evidence
                    </Text>

                    <Text
                      style={
                        styles.emptySectionText
                      }
                    >
                      More usable review text is needed to establish
                      reliable strengths.
                    </Text>
                  </View>
                </View>
              ) : (
                strengths.map(
                  (
                    strength,
                    index
                  ) => (
                    <View
                      key={
                        index
                      }
                      style={
                        styles.insightBullet
                      }
                    >
                      <View style={styles.insightSymbolPositive}>
                        <Text style={styles.insightSymbolText}>
                          +
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.insightText
                        }
                      >
                        {strength}
                      </Text>
                    </View>
                  )
                )
              )}
            </View>
          ) : null}
        </Pressable>

        {/* =================================================
            WEAKNESSES
        ================================================= */}

        <Pressable
          style={
            styles.expandable
          }
          onPress={() =>
            setShowWeaknesses(
              !showWeaknesses
            )
          }
        >
          <View
            style={
              styles.expandableHeader
            }
          >
            <View style={styles.sectionIconNegative}>
              <Text style={styles.sectionIconTextNegative}>
                −
              </Text>
            </View>

            <View
              style={
                styles.expandableText
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Weaknesses
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Reported concerns in the available review
                evidence.
              </Text>
            </View>

            <Text
              style={
                styles.chevron
              }
            >
              {showWeaknesses
                ? '⌃'
                : '⌄'}
            </Text>
          </View>

          {showWeaknesses ? (
            <View
              style={
                styles.expandedContent
              }
            >
              {weaknesses.length ===
              0 ? (
                <View
                  style={
                    styles.emptySection
                  }
                >
                  <View style={styles.emptyIcon}>
                    <Text style={styles.emptyIconText}>
                      i
                    </Text>
                  </View>

                  <View style={styles.emptyTextContainer}>
                    <Text style={styles.emptySectionTitle}>
                      Insufficient review evidence
                    </Text>

                    <Text
                      style={
                        styles.emptySectionText
                      }
                    >
                      More usable review text is needed to establish
                      reliable weaknesses.
                    </Text>
                  </View>
                </View>
              ) : (
                weaknesses.map(
                  (
                    weakness,
                    index
                  ) => (
                    <View
                      key={
                        index
                      }
                      style={
                        styles.insightBullet
                      }
                    >
                      <View style={styles.insightSymbolNegative}>
                        <Text style={styles.insightSymbolTextNegative}>
                          −
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.insightText
                        }
                      >
                        {weakness}
                      </Text>
                    </View>
                  )
                )
              )}
            </View>
          ) : null}
        </Pressable>

        {/* =================================================
            REPLIES
        ================================================= */}

        <Pressable
          style={
            styles.expandable
          }
          onPress={() =>
            setShowReplies(
              !showReplies
            )
          }
        >
          <View
            style={
              styles.expandableHeader
            }
          >
            <View style={styles.sectionIconPurple}>
              <Text style={styles.sectionIconTextPurple}>
                ↩
              </Text>
            </View>

            <View
              style={
                styles.expandableText
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Review responses
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Draft replies for eligible negative reviews.
              </Text>
            </View>

            <Text
              style={
                styles.chevron
              }
            >
              {showReplies
                ? '⌃'
                : '⌄'}
            </Text>
          </View>

          {showReplies ? (
            <View
              style={
                styles.expandedContent
              }
            >
              {suggestedReplies.length ===
              0 ? (
                <View
                  style={
                    styles.noReplyCard
                  }
                >
                  <View style={styles.noReplyIcon}>
                    <Text style={styles.noReplyIconText}>
                      ✓
                    </Text>
                  </View>

                  <View style={styles.noReplyContent}>
                    <Text
                      style={
                        styles.noReplyTitle
                      }
                    >
                      No eligible negative reviews
                    </Text>

                    <Text
                      style={
                        styles.noReplyText
                      }
                    >
                      No negative review with usable review text
                      was available for a response draft.
                    </Text>
                  </View>
                </View>
              ) : (
                suggestedReplies.map(
                  (
                    review
                  ) => {
                    const isSelected =
                      selectedReplyId ===
                      review.reviewId;

                    return (
                      <View
                        key={
                          review.reviewId
                        }
                        style={
                          styles.reviewCard
                        }
                      >
                        <View
                          style={
                            styles.reviewHeader
                          }
                        >
                          <View style={styles.reviewRatingBadge}>
                            <Text
                              style={
                                styles.ratingNegative
                              }
                            >
                              {review.rating}★
                            </Text>
                          </View>

                          <Text
                            style={
                              styles.reviewDate
                            }
                          >
                            {getRelativeDate(
                              analysis.reviews?.find(
                                (item) =>
                                  item.id ===
                                  review.reviewId
                              )?.date
                            )}
                          </Text>
                        </View>

                        <Text
                          style={
                            styles.reviewText
                          }
                        >
                          {review.text ||
                            'Review text unavailable.'}
                        </Text>

                        {review.suggestedReply ? (
                          <>
                            <Pressable
                              style={
                                styles.replyButton
                              }
                              onPress={() =>
                                setSelectedReplyId(
                                  isSelected
                                    ? null
                                    : review.reviewId
                                )
                              }
                            >
                              <Text
                                style={
                                  styles.replyButtonText
                                }
                              >
                                {isSelected
                                  ? 'Hide suggested reply'
                                  : 'View suggested reply'}
                              </Text>

                              <Text style={styles.replyButtonArrow}>
                                {isSelected
                                  ? '↑'
                                  : '→'}
                              </Text>
                            </Pressable>

                            {isSelected ? (
                              <View
                                style={
                                  styles.replyBox
                                }
                              >
                                <View style={styles.replyBoxHeader}>
                                  <Text
                                    style={
                                      styles.replyBoxTitle
                                    }
                                  >
                                    Suggested response
                                  </Text>

                                  <View style={styles.aiBadge}>
                                    <Text style={styles.aiBadgeText}>
                                      AI DRAFT
                                    </Text>
                                  </View>
                                </View>

                                <Text
                                  style={
                                    styles.replyBoxText
                                  }
                                >
                                  {review.suggestedReply}
                                </Text>

                                <Text
                                  style={
                                    styles.replyStatus
                                  }
                                >
                                  Review before publishing. No
                                  automatic posting is performed.
                                </Text>
                              </View>
                            ) : null}
                          </>
                        ) : null}

                        {review.responseStatusNote ? (
                          <Text
                            style={
                              styles.unknownResponseNote
                            }
                          >
                            {review.responseStatusNote}
                          </Text>
                        ) : null}
                      </View>
                    );
                  }
                )
              )}

              {analysis.responseRateStatus ===
              'unavailable' ? (
                <View style={styles.infoNote}>
                  <Text style={styles.infoNoteIcon}>
                    i
                  </Text>

                  <Text
                    style={
                      styles.infoNoteText
                    }
                  >
                    Owner response status is not exposed by
                    the available Google review data, so an
                    accurate response rate cannot be calculated.
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </Pressable>

        {/* =================================================
            COMPETITORS
        ================================================= */}

        <Pressable
          style={
            styles.expandable
          }
          onPress={() =>
            setShowCompetitors(
              !showCompetitors
            )
          }
        >
          <View
            style={
              styles.expandableHeader
            }
          >
            <View style={styles.sectionIconOrange}>
              <Text style={styles.sectionIconTextOrange}>
                ⇄
              </Text>
            </View>

            <View
              style={
                styles.expandableText
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Competitor comparison
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Nearby businesses found through Google Places.
              </Text>
            </View>

            <Text
              style={
                styles.chevron
              }
            >
              {showCompetitors
                ? '⌃'
                : '⌄'}
            </Text>
          </View>

          {showCompetitors ? (
            <View
              style={
                styles.expandedContent
              }
            >
              {competitors.length ===
              0 ? (
                <View
                  style={
                    styles.emptySection
                  }
                >
                  <View style={styles.emptyIcon}>
                    <Text style={styles.emptyIconText}>
                      i
                    </Text>
                  </View>

                  <View style={styles.emptyTextContainer}>
                    <Text style={styles.emptySectionTitle}>
                      No comparable businesses found
                    </Text>

                    <Text
                      style={
                        styles.emptySectionText
                      }
                    >
                      No comparable nearby businesses were found
                      through the configured Google Places search.
                    </Text>
                  </View>
                </View>
              ) : (
                competitors.map(
                  (
                    competitor,
                    index
                  ) => {
                    const competitorVelocity =
                      competitor.velocity !==
                        null &&
                      competitor.reviewsSampled >=
                        30
                        ? `~${competitor.velocity}/mo`
                        : 'Insufficient data';

                    const competitorResponse =
                      competitor.responseRate !==
                      null
                        ? `${competitor.responseRate}%`
                        : 'Unavailable';

                    return (
                      <View
                        key={
                          competitor.placeId ||
                          `${competitor.name}-${index}`
                        }
                        style={
                          styles.competitorRow
                        }
                      >
                        <View
                          style={
                            styles.competitorRank
                          }
                        >
                          <Text style={styles.competitorRankText}>
                            {index + 1}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.competitorMain
                          }
                        >
                          <Text
                            style={
                              styles.competitorName
                            }
                            numberOfLines={2}
                          >
                            {competitor.name}
                          </Text>

                          <View style={styles.competitorRatingRow}>
                            <Text
                              style={
                                styles.competitorRating
                              }
                            >
                              {formatRating(
                                competitor.rating
                              )}
                            </Text>

                            <Text style={styles.competitorStar}>
                              ★
                            </Text>

                            <Text
                              style={
                                styles.competitorReviewCount
                              }
                            >
                              {formatNumber(
                                competitor.reviewCount
                              )}{' '}
                              reviews
                            </Text>
                          </View>

                          <View
                            style={
                              styles.competitorDetails
                            }
                          >
                            <View style={styles.competitorMetricPill}>
                              <Text style={styles.competitorMetricLabel}>
                                Velocity
                              </Text>

                              <Text
                                style={
                                  styles.competitorMetricValue
                                }
                              >
                                {competitorVelocity}
                              </Text>
                            </View>

                            <View style={styles.competitorMetricPill}>
                              <Text style={styles.competitorMetricLabel}>
                                Response
                              </Text>

                              <Text
                                style={
                                  styles.competitorMetricValue
                                }
                              >
                                {competitorResponse}
                              </Text>
                            </View>

                            <View style={styles.competitorMetricPill}>
                              <Text style={styles.competitorMetricLabel}>
                                Sample
                              </Text>

                              <Text
                                style={
                                  styles.competitorMetricValue
                                }
                              >
                                {competitor.reviewsSampled}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  }
                )
              )}

              {analysis.competitorSearch ? (
                <View
                  style={
                    styles.competitorInsight
                  }
                >
                  <Text
                    style={
                      styles.competitorInsightTitle
                    }
                  >
                    Search method
                  </Text>

                  <Text
                    style={
                      styles.competitorInsightText
                    }
                  >
                    {analysis.competitorSearch.note}
                  </Text>
                </View>
              ) : null}

              <View style={styles.infoNote}>
                <Text style={styles.infoNoteIcon}>
                  i
                </Text>

                <Text
                  style={
                    styles.infoNoteText
                  }
                >
                  Competitor response rates are shown as
                  unavailable when owner-response data is not
                  exposed by the source.
                </Text>
              </View>
            </View>
          ) : null}
        </Pressable>

        {/* =================================================
            RECOMMENDATIONS
        ================================================= */}

        <Pressable
          style={[
            styles.expandable,
            styles.recommendationCard,
          ]}
          onPress={() =>
            setShowRecommendations(
              !showRecommendations
            )
          }
        >
          <View
            style={
              styles.expandableHeader
            }
          >
            <View style={styles.sectionIconRecommendation}>
              <Text style={styles.sectionIconTextRecommendation}>
                ✓
              </Text>
            </View>

            <View
              style={
                styles.expandableText
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Recommended actions
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Practical actions derived from the available
                evidence.
              </Text>
            </View>

            <Text
              style={
                styles.chevron
              }
            >
              {showRecommendations
                ? '⌃'
                : '⌄'}
            </Text>
          </View>

          {showRecommendations ? (
            <View
              style={
                styles.expandedContent
              }
            >
              {recommendations.map(
                (
                  recommendation,
                  index
                ) => (
                  <View
                    key={
                      index
                    }
                    style={
                      styles.recommendation
                    }
                  >
                    <View
                      style={[
                        styles.priority,
                        recommendation.priority ===
                        'High'
                          ? styles.priorityHigh
                          : styles.priorityMedium,
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          recommendation.priority ===
                          'High'
                            ? styles.priorityHighText
                            : styles.priorityMediumText,
                        ]}
                      >
                        {recommendation.priority}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.recommendationText
                      }
                    >
                      {recommendation.action}
                    </Text>
                  </View>
                )
              )}
            </View>
          ) : null}
        </Pressable>

        {/* =================================================
            DATA QUALITY
        ================================================= */}

        <View
          style={
            styles.sourceCard
          }
        >
          <View style={styles.sourceHeader}>
            <View style={styles.sourceIcon}>
              <Text style={styles.sourceIconText}>
                ✓
              </Text>
            </View>

            <View>
              <Text
                style={
                  styles.sourceTitle
                }
              >
                Data quality
              </Text>

              <Text style={styles.sourceSubtitle}>
                How much evidence was available for this analysis.
              </Text>
            </View>
          </View>

          <View style={styles.dataQualityStats}>
            <View style={styles.dataQualityStat}>
              <Text style={styles.dataQualityValue}>
                {formatNumber(
                  dataQuality.totalBusinessReviews
                )}
              </Text>

              <Text style={styles.dataQualityLabel}>
                total reviews
              </Text>
            </View>

            <View style={styles.dataQualityDivider} />

            <View style={styles.dataQualityStat}>
              <Text style={styles.dataQualityValue}>
                {dataQuality.reviewsCollected}
              </Text>

              <Text style={styles.dataQualityLabel}>
                collected
              </Text>
            </View>

            <View style={styles.dataQualityDivider} />

            <View style={styles.dataQualityStat}>
              <Text style={styles.dataQualityValue}>
                {dataQuality.reviewsWithText}
              </Text>

              <Text style={styles.dataQualityLabel}>
                with text
              </Text>
            </View>
          </View>

          <Text
            style={
              styles.sourceText
            }
          >
            {dataQuality.note}
          </Text>

          {dataQuality.velocityNote ? (
            <Text
              style={
                styles.sourceText
              }
            >
              {dataQuality.velocityNote}
            </Text>
          ) : null}
        </View>

        {/* =================================================
            AI STATUS
        ================================================= */}

        <View
          style={[
            styles.sourceCard,
            semanticAnalysisUnavailable
              ? styles.sourceCardWarning
              : styles.sourceCardSuccess,
          ]}
        >
          <View style={styles.sourceHeader}>
            <View
              style={[
                styles.sourceIcon,
                semanticAnalysisUnavailable
                  ? styles.sourceIconWarning
                  : styles.sourceIconSuccess,
              ]}
            >
              <Text
                style={[
                  styles.sourceIconText,
                  semanticAnalysisUnavailable
                    ? styles.sourceIconTextWarning
                    : styles.sourceIconTextSuccess,
                ]}
              >
                {semanticAnalysisUnavailable
                  ? '!'
                  : '✦'}
              </Text>
            </View>

            <View>
              <Text
                style={
                  styles.sourceTitle
                }
              >
                Analysis method
              </Text>

              <Text style={styles.sourceSubtitle}>
                Semantic and deterministic analysis status.
              </Text>
            </View>
          </View>

          <Text
            style={
              styles.sourceText
            }
          >
            {semanticAnalysisUnavailable
              ? 'Semantic analysis was unavailable for this run. Deterministic review metrics are still available.'
              : `Semantic analysis generated using ${
                  analysis.aiAnalysis?.model ||
                  'the configured AI model'
                }.`}
          </Text>
        </View>

        {/* =================================================
            SOURCE
        ================================================= */}

        <View
          style={
            styles.sourceCard
          }
        >
          <View style={styles.sourceHeader}>
            <View style={styles.sourceIcon}>
              <Text style={styles.sourceIconText}>
                ◉
              </Text>
            </View>

            <View>
              <Text
                style={
                  styles.sourceTitle
                }
              >
                Data source
              </Text>

              <Text style={styles.sourceSubtitle}>
                Source, collection method and limitations.
              </Text>
            </View>
          </View>

          {analysis.sources?.map(
            (
              source,
              index
            ) => (
              <View
                key={
                  `${source.platform}-${index}`
                }
                style={styles.sourceBlock}
              >
                <Text
                  style={
                    styles.sourcePlatform
                  }
                >
                  {source.platform}
                </Text>

                <View style={styles.sourceTag}>
                  <Text style={styles.sourceTagText}>
                    {source.reviewsCollected}{' '}
                    reviews collected
                  </Text>
                </View>

                <Text
                  style={
                    styles.sourceText
                  }
                >
                  Method: {source.method}
                </Text>

                {source.reliability ? (
                  <Text
                    style={
                      styles.sourceText
                    }
                  >
                    Reliability: {source.reliability}
                  </Text>
                ) : null}

                {source.durability ? (
                  <Text
                    style={
                      styles.sourceText
                    }
                  >
                    Durability: {source.durability}
                  </Text>
                ) : null}
              </View>
            )
          )}
        </View>

        {/* =================================================
            NEW ANALYSIS
        ================================================= */}

        <Pressable
          style={({ pressed }) => [
            styles.newAnalysisButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() =>
            router.replace('/')
          }
        >
          <Text
            style={
              styles.newAnalysisText
            }
          >
            Analyze another business
          </Text>

          <Text style={styles.newAnalysisArrow}>
            →
          </Text>
        </Pressable>

        <View
          style={
            styles.bottomSpacer
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles =
  StyleSheet.create({
    // =====================================================
    // BASE
    // =====================================================

    safeArea: {
      flex: 1,
      backgroundColor: '#F4F6FA',
    },

    container: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 48,
    },

    buttonPressed: {
      opacity: 0.82,
      transform: [
        {
          scale: 0.985,
        },
      ],
    },

    // =====================================================
    // HEADER
    // =====================================================

    header: {
      marginBottom: 20,
      paddingTop: 2,
    },

    headerPill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: '#EFF6FF',
    },

    headerPillDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#2563EB',
      marginRight: 6,
    },

    headerEyebrow: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      color: '#2563EB',
    },

    headerTitle: {
      marginTop: 10,
      fontSize: 30,
      lineHeight: 36,
      fontWeight: '800',
      color: '#101828',
    },

    headerSubtitle: {
      marginTop: 6,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '700',
      color: '#344054',
    },

    headerLocation: {
      marginTop: 3,
      fontSize: 13,
      lineHeight: 18,
      color: '#667085',
    },

    // =====================================================
    // SUMMARY
    // =====================================================

    summaryCard: {
      padding: 20,
      borderRadius: 22,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E4E7EC',
      shadowColor: '#101828',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    },

    summaryTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    summaryBusiness: {
      flex: 1,
    },

    businessTypePill: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 7,
      backgroundColor: '#F2F4F7',
    },

    businessTypeText: {
      fontSize: 9,
      lineHeight: 12,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: '#667085',
    },

    summaryName: {
      marginTop: 9,
      fontSize: 19,
      lineHeight: 25,
      fontWeight: '800',
      color: '#101828',
    },

    summaryAddress: {
      marginTop: 6,
      fontSize: 12,
      lineHeight: 18,
      color: '#667085',
    },

    summaryMetrics: {
      marginTop: 22,
      paddingTop: 17,
      borderTopWidth: 1,
      borderTopColor: '#EAECF0',
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    summaryMetric: {
      flex: 1,
      minWidth: 0,
      paddingRight: 10,
    },

    velocityMetric: {
      paddingRight: 0,
    },

    metricCaption: {
      fontSize: 9,
      lineHeight: 12,
      fontWeight: '800',
      letterSpacing: 0.9,
      color: '#98A2B3',
    },

    ratingValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },

    metricValue: {
      fontSize: 24,
      lineHeight: 29,
      fontWeight: '800',
      color: '#101828',
    },

    summaryStar: {
      marginLeft: 4,
      marginTop: 1,
      fontSize: 17,
      color: '#F59E0B',
    },

    metricUnavailable: {
      marginTop: 4,
      fontSize: 15,
      lineHeight: 19,
      fontWeight: '800',
      color: '#344054',
      flexShrink: 1,
    },

    metricLabel: {
      marginTop: 4,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '600',
      color: '#667085',
    },

    sampleBadge: {
      alignSelf: 'flex-start',
      marginTop: 5,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: '#F2F4F7',
    },

    sampleBadgeText: {
      fontSize: 8,
      lineHeight: 11,
      fontWeight: '800',
      letterSpacing: 0.3,
      color: '#667085',
    },

    // =====================================================
    // SECTION
    // =====================================================

    section: {
      marginTop: 30,
    },

    sectionHeadingRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    sectionAccent: {
      width: 3,
      minHeight: 25,
      marginTop: 1,
      marginRight: 10,
      borderRadius: 2,
      backgroundColor: '#2563EB',
    },

    sectionTitle: {
      fontSize: 19,
      lineHeight: 24,
      fontWeight: '800',
      color: '#101828',
    },

    sectionSubtitle: {
      marginTop: 4,
      fontSize: 12,
      lineHeight: 18,
      color: '#667085',
    },

    // =====================================================
    // AT A GLANCE
    // =====================================================

    glanceGrid: {
      marginTop: 14,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },

    glanceCard: {
      width: '48%',
      minHeight: 128,
      padding: 15,
      borderRadius: 18,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E4E7EC',
      shadowColor: '#101828',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.035,
      shadowRadius: 8,
      elevation: 1,
    },

    glanceCardBlue: {
      borderColor: '#D9E8FF',
      backgroundColor: '#FBFDFF',
    },

    glanceCardNeutral: {
      backgroundColor: '#FFFFFF',
    },

    glanceIconCircle: {
      width: 25,
      height: 25,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#EFF6FF',
    },

    glanceIconText: {
      fontSize: 15,
      lineHeight: 17,
      fontWeight: '800',
      color: '#2563EB',
    },

    glanceIconCircleNeutral: {
      width: 25,
      height: 25,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F2F4F7',
    },

    glanceIconTextNeutral: {
      fontSize: 13,
      lineHeight: 16,
      fontWeight: '800',
      color: '#667085',
    },

    glanceLabel: {
      marginTop: 11,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: '800',
      letterSpacing: 0.2,
      color: '#667085',
    },

    glanceValue: {
      marginTop: 6,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '700',
      color: '#344054',
    },

    glanceHelper: {
      marginTop: 3,
      fontSize: 9,
      lineHeight: 13,
      color: '#98A2B3',
    },

    // =====================================================
    // RATING DISTRIBUTION
    // =====================================================

    distributionCard: {
      marginTop: 14,
      padding: 18,
      borderRadius: 18,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E4E7EC',
      shadowColor: '#101828',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 1,
    },

    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 14,
    },

    ratingRowFirst: {
      marginTop: 0,
    },

    ratingLabel: {
      width: 30,
      fontSize: 13,
      fontWeight: '700',
      color: '#344054',
    },

    ratingTrack: {
      flex: 1,
      height: 9,
      marginHorizontal: 10,
      borderRadius: 5,
      backgroundColor: '#EAECF0',
      overflow: 'hidden',
    },

    ratingFill: {
      height: '100%',
      borderRadius: 5,
      backgroundColor: '#2563EB',
    },

    ratingNumber: {
      width: 30,
      fontSize: 13,
      fontWeight: '600',
      color: '#667085',
      textAlign: 'right',
    },

    distributionFooter: {
      marginTop: 17,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#EAECF0',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },

    distributionFooterText: {
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '600',
      color: '#98A2B3',
    },

    // =====================================================
    // VELOCITY
    // =====================================================

    velocityCard: {
      marginTop: 20,
      padding: 20,
      borderRadius: 20,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E4E7EC',
      shadowColor: '#101828',
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.035,
      shadowRadius: 10,
      elevation: 1,
    },

    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    cardIconBlue: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#EFF6FF',
    },

    cardIconText: {
      fontSize: 18,
      fontWeight: '800',
      color: '#2563EB',
    },

    cardTopText: {
      flex: 1,
      marginLeft: 11,
    },

    velocityTitle: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '800',
      color: '#101828',
    },

    velocitySubtitle: {
      marginTop: 3,
      fontSize: 12,
      lineHeight: 17,
      color: '#667085',
    },

    velocityMain: {
      marginTop: 17,
    },

    velocityValue: {
      fontSize: 30,
      lineHeight: 36,
      fontWeight: '800',
      color: '#101828',
    },

    velocityUnavailable: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '800',
      color: '#344054',
      flexShrink: 1,
    },

    velocityUnit: {
      marginTop: 2,
      fontSize: 11,
      fontWeight: '600',
      color: '#667085',
    },

    velocityUnavailableNote: {
      marginTop: 4,
      fontSize: 11,
      lineHeight: 17,
      color: '#667085',
    },

    velocityStatus: {
      marginTop: 17,
      paddingTop: 13,
      borderTopWidth: 1,
      borderTopColor: '#EAECF0',
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      marginTop: 5,
      marginRight: 8,
      backgroundColor: '#98A2B3',
    },

    velocityStatusText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: '600',
      color: '#667085',
    },

    // =====================================================
    // EXPANDABLE
    // =====================================================

    expandable: {
      marginTop: 16,
      padding: 20,
      borderRadius: 20,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E4E7EC',
      shadowColor: '#101828',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.03,
      shadowRadius: 9,
      elevation: 1,
    },

    expandableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    expandableText: {
      flex: 1,
      paddingRight: 8,
    },

    chevron: {
      width: 28,
      textAlign: 'center',
      fontSize: 25,
      lineHeight: 28,
      fontWeight: '600',
      color: '#667085',
      marginLeft: 8,
    },

    expandedContent: {
      marginTop: 18,
      borderTopWidth: 1,
      borderTopColor: '#EAECF0',
      paddingTop: 14,
    },

    // =====================================================
    // SECTION ICONS
    // =====================================================

    sectionIconBlue: {
      width: 34,
      height: 34,
      marginRight: 11,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#EFF6FF',
    },

    sectionIconText: {
      fontSize: 17,
      fontWeight: '800',
      color: '#2563EB',
    },

    sectionIconPositive: {
      width: 34,
      height: 34,
      marginRight: 11,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ECFDF3',
    },

    sectionIconTextPositive: {
      fontSize: 18,
      fontWeight: '800',
      color: '#15803D',
    },

    sectionIconNegative: {
      width: 34,
      height: 34,
      marginRight: 11,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FEF3F2',
    },

    sectionIconTextNegative: {
      fontSize: 18,
      fontWeight: '800',
      color: '#B42318',
    },

    sectionIconPurple: {
      width: 34,
      height: 34,
      marginRight: 11,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F4F3FF',
    },

    sectionIconTextPurple: {
      fontSize: 17,
      fontWeight: '800',
      color: '#6941C6',
    },

    sectionIconOrange: {
      width: 34,
      height: 34,
      marginRight: 11,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFAEB',
    },

    sectionIconTextOrange: {
      fontSize: 17,
      fontWeight: '800',
      color: '#B54708',
    },

    sectionIconRecommendation: {
      width: 34,
      height: 34,
      marginRight: 11,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#EFF6FF',
    },

    sectionIconTextRecommendation: {
      fontSize: 16,
      fontWeight: '800',
      color: '#2563EB',
    },

    // =====================================================
    // THEMES
    // =====================================================

    themeContainer: {
      paddingVertical: 8,
    },

    themeRow: {
      paddingVertical: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    themeTextContainer: {
      flex: 1,
      paddingRight: 12,
    },

    themeName: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
      color: '#344054',
    },

    themeMentions: {
      marginTop: 3,
      fontSize: 12,
      color: '#667085',
    },

    evidenceText: {
      marginTop: 5,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '700',
      color: '#98A2B3',
    },

    sentimentBadge: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 7,
    },

    sentimentBadgePositive: {
      backgroundColor: '#ECFDF3',
    },

    sentimentBadgeNegative: {
      backgroundColor: '#FEF3F2',
    },

    sentimentBadgeMixed: {
      backgroundColor: '#FFFAEB',
    },

    sentiment: {
      fontSize: 10,
      lineHeight: 13,
      fontWeight: '800',
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

    quoteContainer: {
      marginTop: 7,
      paddingLeft: 12,
      paddingTop: 3,
      paddingBottom: 2,
      borderLeftWidth: 2,
      borderLeftColor: '#D0D5DD',
    },

    quoteText: {
      marginBottom: 7,
      fontSize: 13,
      lineHeight: 19,
      fontStyle: 'italic',
      color: '#667085',
    },

    // =====================================================
    // INSIGHTS
    // =====================================================

    insightBullet: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 10,
    },

    insightSymbolPositive: {
      width: 28,
      height: 28,
      borderRadius: 8,
      marginRight: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ECFDF3',
    },

    insightSymbolNegative: {
      width: 28,
      height: 28,
      borderRadius: 8,
      marginRight: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FEF3F2',
    },

    insightSymbolText: {
      fontSize: 16,
      lineHeight: 18,
      fontWeight: '800',
      color: '#15803D',
    },

    insightSymbolTextNegative: {
      fontSize: 16,
      lineHeight: 18,
      fontWeight: '800',
      color: '#B42318',
    },

    insightText: {
      flex: 1,
      paddingTop: 3,
      fontSize: 14,
      lineHeight: 20,
      color: '#475467',
    },

    // =====================================================
    // EMPTY STATES
    // =====================================================

    emptySection: {
      marginTop: 2,
      padding: 14,
      borderRadius: 14,
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    emptyIcon: {
      width: 28,
      height: 28,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#EFF6FF',
    },

    emptyIconText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#2563EB',
    },

    emptyTextContainer: {
      flex: 1,
      marginLeft: 10,
    },

    emptySectionTitle: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '800',
      color: '#344054',
    },

    emptySectionText: {
      marginTop: 4,
      fontSize: 13,
      lineHeight: 20,
      color: '#667085',
    },

    // =====================================================
    // REPLIES
    // =====================================================

    reviewCard: {
      marginTop: 12,
      padding: 16,
      borderRadius: 16,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E4E7EC',
    },

    reviewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    reviewRatingBadge: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 7,
      backgroundColor: '#FEF3F2',
    },

    ratingNegative: {
      fontSize: 12,
      lineHeight: 15,
      fontWeight: '800',
      color: '#B42318',
    },

    reviewDate: {
      fontSize: 12,
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
      minHeight: 38,
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: '#EFF6FF',
      flexDirection: 'row',
      alignItems: 'center',
    },

    replyButtonText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#2563EB',
    },

    replyButtonArrow: {
      marginLeft: 7,
      fontSize: 14,
      fontWeight: '800',
      color: '#2563EB',
    },

    replyBox: {
      marginTop: 14,
      padding: 15,
      borderRadius: 14,
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },

    replyBoxHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    replyBoxTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: '#344054',
    },

    aiBadge: {
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: '#F2F4F7',
    },

    aiBadgeText: {
      fontSize: 8,
      lineHeight: 11,
      fontWeight: '800',
      letterSpacing: 0.5,
      color: '#667085',
    },

    replyBoxText: {
      marginTop: 10,
      fontSize: 14,
      lineHeight: 21,
      color: '#475467',
    },

    replyStatus: {
      marginTop: 10,
      fontSize: 10,
      lineHeight: 15,
      color: '#98A2B3',
    },

    noReplyCard: {
      padding: 14,
      borderRadius: 14,
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    noReplyIcon: {
      width: 30,
      height: 30,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ECFDF3',
    },

    noReplyIconText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#15803D',
    },

    noReplyContent: {
      flex: 1,
      marginLeft: 10,
    },

    noReplyTitle: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '800',
      color: '#344054',
    },

    noReplyText: {
      marginTop: 5,
      fontSize: 13,
      lineHeight: 19,
      color: '#667085',
    },

    unknownResponseNote: {
      marginTop: 10,
      fontSize: 11,
      lineHeight: 17,
      color: '#98A2B3',
    },

    infoNote: {
      marginTop: 14,
      padding: 12,
      borderRadius: 12,
      backgroundColor: '#F8FAFC',
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    infoNoteIcon: {
      width: 19,
      height: 19,
      borderRadius: 6,
      textAlign: 'center',
      lineHeight: 19,
      fontSize: 10,
      fontWeight: '800',
      color: '#667085',
      backgroundColor: '#EAECF0',
      overflow: 'hidden',
    },

    infoNoteText: {
      flex: 1,
      marginLeft: 8,
      fontSize: 11,
      lineHeight: 17,
      color: '#667085',
    },

    // =====================================================
    // COMPETITORS
    // =====================================================

    competitorRow: {
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#EAECF0',
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    competitorRank: {
      width: 28,
      height: 28,
      marginRight: 10,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F2F4F7',
    },

    competitorRankText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#667085',
    },

    competitorMain: {
      flex: 1,
    },

    competitorName: {
      fontSize: 14,
      lineHeight: 19,
      fontWeight: '800',
      color: '#344054',
    },

    competitorRatingRow: {
      marginTop: 6,
      flexDirection: 'row',
      alignItems: 'center',
    },

    competitorRating: {
      fontSize: 14,
      fontWeight: '800',
      color: '#344054',
    },

    competitorStar: {
      marginLeft: 3,
      fontSize: 12,
      color: '#F59E0B',
    },

    competitorReviewCount: {
      marginLeft: 6,
      fontSize: 11,
      color: '#667085',
    },

    competitorDetails: {
      marginTop: 10,
      flexDirection: 'row',
      gap: 6,
    },

    competitorMetricPill: {
      flex: 1,
      minWidth: 0,
      padding: 8,
      borderRadius: 9,
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#EAECF0',
    },

    competitorMetricLabel: {
      fontSize: 8,
      lineHeight: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      color: '#98A2B3',
    },

    competitorMetricValue: {
      marginTop: 3,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '700',
      color: '#475467',
    },

    competitorInsight: {
      marginTop: 14,
      padding: 13,
      borderRadius: 12,
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },

    competitorInsightTitle: {
      fontSize: 10,
      lineHeight: 13,
      fontWeight: '800',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: '#667085',
    },

    competitorInsightText: {
      marginTop: 5,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: '600',
      color: '#475467',
    },

    responseUnavailableNote: {
      marginTop: 14,
      fontSize: 12,
      lineHeight: 17,
      color: '#98A2B3',
    },

    // =====================================================
    // RECOMMENDATIONS
    // =====================================================

    recommendationCard: {
      borderColor: '#D9E8FF',
    },

    recommendation: {
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#EAECF0',
    },

    priority: {
      alignSelf: 'flex-start',
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 7,
    },

    priorityHigh: {
      backgroundColor: '#FEF3F2',
    },

    priorityMedium: {
      backgroundColor: '#FFFAEB',
    },

    priorityText: {
      fontSize: 9,
      lineHeight: 12,
      fontWeight: '800',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },

    priorityHighText: {
      color: '#B42318',
    },

    priorityMediumText: {
      color: '#B54708',
    },

    recommendationText: {
      marginTop: 8,
      fontSize: 14,
      lineHeight: 21,
      color: '#344054',
    },

    // =====================================================
    // SOURCE
    // =====================================================

    sourceCard: {
      marginTop: 18,
      padding: 18,
      borderRadius: 18,
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },

    sourceCardWarning: {
      backgroundColor: '#FFFCF5',
      borderColor: '#FDE68A',
    },

    sourceCardSuccess: {
      backgroundColor: '#F8FFFB',
      borderColor: '#D1FAE5',
    },

    sourceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    sourceIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ECFDF3',
    },

    sourceIconWarning: {
      backgroundColor: '#FEF3C7',
    },

    sourceIconSuccess: {
      backgroundColor: '#ECFDF3',
    },

    sourceIconText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#15803D',
    },

    sourceIconTextWarning: {
      color: '#B54708',
    },

    sourceIconTextSuccess: {
      color: '#15803D',
    },

    sourceTitle: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '800',
      color: '#344054',
    },

    sourceSubtitle: {
      marginTop: 2,
      fontSize: 10,
      lineHeight: 14,
      color: '#98A2B3',
    },

    sourceText: {
      marginTop: 9,
      fontSize: 12,
      lineHeight: 18,
      color: '#667085',
    },

    sourceBlock: {
      marginTop: 15,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
    },

    sourcePlatform: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '800',
      color: '#344054',
    },

    sourceTag: {
      alignSelf: 'flex-start',
      marginTop: 7,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 7,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },

    sourceTagText: {
      fontSize: 9,
      lineHeight: 12,
      fontWeight: '700',
      color: '#667085',
    },

    dataQualityStats: {
      marginTop: 15,
      paddingVertical: 13,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: '#E2E8F0',
      flexDirection: 'row',
      alignItems: 'center',
    },

    dataQualityStat: {
      flex: 1,
      alignItems: 'center',
    },

    dataQualityValue: {
      fontSize: 18,
      lineHeight: 22,
      fontWeight: '800',
      color: '#344054',
    },

    dataQualityLabel: {
      marginTop: 3,
      fontSize: 9,
      lineHeight: 12,
      fontWeight: '600',
      color: '#98A2B3',
    },

    dataQualityDivider: {
      width: 1,
      height: 28,
      backgroundColor: '#E2E8F0',
    },

    // =====================================================
    // BUTTON
    // =====================================================

    newAnalysisButton: {
      minHeight: 56,
      marginTop: 28,
      paddingHorizontal: 18,
      borderRadius: 16,
      backgroundColor: '#2563EB',
      borderWidth: 1,
      borderColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      shadowColor: '#2563EB',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 2,
    },

    newAnalysisText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
    },

    newAnalysisArrow: {
      marginLeft: 9,
      fontSize: 20,
      lineHeight: 22,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    bottomSpacer: {
      height: 20,
    },

    // =====================================================
    // ERROR
    // =====================================================

    errorContainer: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: 'center',
    },

    errorIcon: {
      width: 48,
      height: 48,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FEF3F2',
      marginBottom: 18,
    },

    errorIconText: {
      fontSize: 22,
      fontWeight: '800',
      color: '#B42318',
    },

    errorEyebrow: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.1,
      color: '#2563EB',
    },

    errorTitle: {
      marginTop: 7,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '800',
      color: '#101828',
    },

    errorText: {
      marginTop: 9,
      fontSize: 14,
      lineHeight: 21,
      color: '#667085',
    },
  });