import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// =========================================================
// TYPES
// =========================================================

type Theme = {
  theme: string;
  mentions: number;
  sentiment: 'positive' | 'mixed' | 'negative';
  quotes: string[];
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

type Analysis = {
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
      analysis?: string | string[];
    }>();

  const businessName =
    getParamValue(
      params.businessName
    );

  const location =
    getParamValue(
      params.location
    );

  const analysisParam =
    getParamValue(
      params.analysis
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

  // =======================================================
  // PARSE BACKEND RESPONSE
  // =======================================================

  const analysis =
    useMemo<Analysis | null>(() => {
      if (!analysisParam) {
        return null;
      }

      try {
        return JSON.parse(
          analysisParam
        ) as Analysis;
      } catch (error) {
        console.error(
          'Failed to parse analysis:',
          error
        );

        return null;
      }
    }, [analysisParam]);

  // =======================================================
  // SAFE FALLBACK
  // =======================================================

  if (!analysis) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>
            Results unavailable
          </Text>

          <Text style={styles.errorText}>
            We could not read the analysis returned by
            the server.
          </Text>

          <Pressable
            style={styles.newAnalysisButton}
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
  // Derived from the actual returned analysis.
  // Recommendations should not overstate what the limited
  // review sample can prove.
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
        .filter((word) => word.length >= 4);

    const isRelatedToWeakness = (themeName: string) => {
      const themeWords = normalize(themeName);

      return weaknesses.some((weakness) => {
        const weaknessWords = normalize(weakness);

        const sharedWords = themeWords.filter((word) =>
          weaknessWords.includes(word)
        );

        return sharedWords.length >= 2;
      });
    };

    // =====================================================
    // WEAKNESSES
    // =====================================================
    // A weakness from a limited sample is a reported concern,
    // not automatically a recurring or high-severity problem.

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
    // Skip a negative theme when it describes the same issue
    // already captured by a weakness. This avoids duplicate
    // recommendations for the same customer concern.

    themes
      .filter(
        (theme) =>
          theme.sentiment === 'negative'
      )
      .sort(
        (a, b) =>
          b.mentions - a.mentions
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
          theme.sentiment === 'mixed'
      )
      .sort(
        (a, b) =>
          b.mentions - a.mentions
      )
      .slice(0, 1)
      .forEach((theme) => {
        result.push({
          priority: 'Medium',

          action:
            theme.mentions >= 2
              ? `Review the "${theme.theme}" experience because feedback is mixed across multiple available reviews.`
              : `Review the "${theme.theme}" experience because the available feedback is mixed.`,
        });
      });

    // =====================================================
    // POSITIVE THEMES
    // =====================================================
    // Avoid saying "consistently" when only one review
    // supports the positive signal.

    themes
      .filter(
        (theme) =>
          theme.sentiment === 'positive'
      )
      .sort(
        (a, b) =>
          b.mentions - a.mentions
      )
      .slice(0, 1)
      .forEach((theme) => {
        result.push({
          priority: 'Medium',

          action:
            theme.mentions >= 2
              ? `Continue reinforcing "${theme.theme}", which is positively mentioned across multiple available reviews.`
              : `Continue reinforcing "${theme.theme}", which received positive feedback in the available review sample.`,
        });
      });

    // =====================================================
    // FALLBACK
    // =====================================================

    if (result.length === 0) {
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
  // BEST / WORST COMPETITOR
  // =======================================================

  const bestCompetitor =
    competitors.length > 0
      ? [...competitors]
          .filter(
            (item) =>
              typeof item.rating ===
              'number'
          )
          .sort(
            (a, b) =>
              (b.rating ?? 0) -
              (a.rating ?? 0)
          )[0]
      : null;

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <Text style={styles.eyebrow}>
          REPUTATION RESULTS
        </Text>

        <Text style={styles.businessName}>
          {business.name ||
            businessName ||
            'Business'}
        </Text>

        <Text style={styles.location}>
          {business.address ||
            location ||
            'Location unavailable'}
        </Text>

        {/* =================================================
            DATA QUALITY NOTICE
        ================================================= */}

        <View
          style={
            styles.dataQualityCard
          }
        >
          <View
            style={
              styles.dataQualityIcon
            }
          >
            <Text
              style={
                styles.dataQualityIconText
              }
            >
              i
            </Text>
          </View>

          <View
            style={
              styles.dataQualityContent
            }
          >
            <Text
              style={
                styles.dataQualityTitle
              }
            >
              Analysis based on available reviews
            </Text>

            <Text
              style={
                styles.dataQualityText
              }
            >
              {dataQuality.note}
            </Text>
          </View>
        </View>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <View
          style={styles.summaryCard}
        >
          <View>
            <Text style={styles.rating}>
              {formatRating(
                business.rating
              )}
            </Text>

            <Text style={styles.stars}>
              ★★★★★
            </Text>

            <Text
              style={
                styles.reviewCount
              }
            >
              {formatNumber(
                business.reviewCount
              )}{' '}
              Google reviews
            </Text>
          </View>

          <View
            style={
              styles.summaryDivider
            }
          />

          <View
            style={
              styles.summaryMetric
            }
          >
            <Text
              style={
                styles.metricValue
              }
            >
              {metrics.velocity.sampleBased ||
              metrics.velocity.monthsCovered < 1 ||
              metrics.velocity.trend === 'insufficient_data'
                ? 'Insufficient data'
                : `~${metrics.velocity.perMonth}`}
            </Text>

            <Text
              style={
                styles.metricLabel
              }
            >
              review velocity
            </Text>

            <Text
              style={
                styles.sampleLabel
              }
            >
              Limited review sample
            </Text>
          </View>
        </View>

        {/* =================================================
            QUICK ASSESSMENT
        ================================================= */}

        <View
          style={styles.assessmentCard}
        >
          <Text
            style={styles.cardTitle}
          >
            At a glance
          </Text>

          <View
            style={styles.assessmentRow}
          >
            <Text
              style={
                styles.assessmentLabel
              }
            >
              Strongest signal
            </Text>

            <Text
              style={
                styles.assessmentValue
              }
            >
              {themes.length > 0
                ? themes
                    .filter(
                      (theme) =>
                        theme.sentiment ===
                        'positive'
                    )
                    .sort(
                      (a, b) =>
                        b.mentions -
                        a.mentions
                    )[0]
                    ?.theme ??
                  'No clear signal'
                : 'No clear signal'}
            </Text>
          </View>

          <View
            style={styles.assessmentRow}
          >
            <Text
              style={
                styles.assessmentLabel
              }
            >
              Main issue
            </Text>

            <Text
              style={
                styles.assessmentValue
              }
            >
              {weaknesses[0] ??
                'No clear weakness identified'}
            </Text>
          </View>

          <View
            style={styles.assessmentRow}
          >
            <Text
              style={
                styles.assessmentLabel
              }
            >
              Response rate
            </Text>

            <Text
              style={
                styles.assessmentValue
              }
            >
              {analysis.responseRate !==
              null
                ? `${analysis.responseRate}%`
                : 'Unavailable'}
            </Text>
          </View>

          <View
            style={styles.assessmentRow}
          >
            <Text
              style={
                styles.assessmentLabel
              }
            >
              Latest review
            </Text>

            <Text
              style={
                styles.assessmentValue
              }
            >
              {getRelativeDate(
                business.lastReviewDate
              )}
            </Text>
          </View>
        </View>

        {/* =================================================
            RATING DISTRIBUTION
        ================================================= */}

        <View
          style={styles.section}
        >
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
            Available Google review sample
          </Text>

          <RatingBar
            label="5★"
            value={
              metrics.ratingDistribution[
                '5'
              ]
            }
            total={
              metrics.reviewCount
            }
          />

          <RatingBar
            label="4★"
            value={
              metrics.ratingDistribution[
                '4'
              ]
            }
            total={
              metrics.reviewCount
            }
          />

          <RatingBar
            label="3★"
            value={
              metrics.ratingDistribution[
                '3'
              ]
            }
            total={
              metrics.reviewCount
            }
          />

          <RatingBar
            label="2★"
            value={
              metrics.ratingDistribution[
                '2'
              ]
            }
            total={
              metrics.reviewCount
            }
          />

          <RatingBar
            label="1★"
            value={
              metrics.ratingDistribution[
                '1'
              ]
            }
            total={
              metrics.reviewCount
            }
          />
        </View>

        {/* =================================================
            VELOCITY
        ================================================= */}

        <View
          style={styles.velocityCard}
        >
          <View>
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
              Limited Google review sample
            </Text>
          </View>

          <View
            style={
              styles.velocityRight
            }
          >
            <Text
              style={
                styles.velocityValue
              }
            >
              {metrics.velocity.sampleBased ||
              metrics.velocity.monthsCovered < 1 ||
              metrics.velocity.trend === 'insufficient_data'
                ? 'Insufficient data'
                : `~${metrics.velocity.perMonth}`}
            </Text>

            <Text
              style={
                styles.velocityUnit
              }
            >
              Reliable monthly rate unavailable
            </Text>
          </View>

          <View
            style={
              styles.velocityStatus
            }
          >
            <Text
              style={
                styles.velocityStatusText
              }
            >
              Trend: Insufficient data from the available review sample
            </Text>
          </View>
        </View>

        {/* =================================================
            CUSTOMER THEMES
        ================================================= */}

        <ExpandableSection
          title="Customer themes"
          subtitle="What customers talk about most"
          expanded={showThemes}
          onPress={() =>
            setShowThemes(
              !showThemes
            )
          }
        >
          {themes.length === 0 ? (
            <EmptySection
              text="There was not enough review text to identify recurring themes."
            />
          ) : (
            themes.map(
              (
                theme,
                index
              ) => (
                <ThemeRow
                  key={`${theme.theme}-${index}`}
                  theme={
                    theme.theme
                  }
                  mentions={
                    `${theme.mentions} ${
                      theme.mentions === 1
                        ? 'mention'
                        : 'mentions'
                    }`
                  }
                  sentiment={
                    capitalize(
                      theme.sentiment
                    )
                  }
                  quotes={
                    theme.quotes
                  }
                />
              )
            )
          )}
        </ExpandableSection>

        {/* =================================================
            STRENGTHS
        ================================================= */}

        <ExpandableSection
          title="Strengths"
          subtitle="What customers value"
          expanded={
            showStrengths
          }
          onPress={() =>
            setShowStrengths(
              !showStrengths
            )
          }
        >
          {strengths.length === 0 ? (
            <EmptySection
              text="No clear strengths were identified from the available review text."
            />
          ) : (
            strengths.map(
              (
                strength,
                index
              ) => (
                <InsightBullet
                  key={`strength-${index}`}
                  symbol="✓"
                  text={
                    strength
                  }
                  positive
                />
              )
            )
          )}
        </ExpandableSection>

        {/* =================================================
            WEAKNESSES
        ================================================= */}

        <ExpandableSection
          title="Weaknesses"
          subtitle="Issues that may need attention"
          expanded={
            showWeaknesses
          }
          onPress={() =>
            setShowWeaknesses(
              !showWeaknesses
            )
          }
        >
          {weaknesses.length === 0 ? (
            <EmptySection
              text="No clear weaknesses were identified from the available review text."
            />
          ) : (
            weaknesses.map(
              (
                weakness,
                index
              ) => (
                <InsightBullet
                  key={`weakness-${index}`}
                  symbol="!"
                  text={
                    weakness
                  }
                />
              )
            )
          )}
        </ExpandableSection>

        {/* =================================================
            NEEDS A REPLY
        ================================================= */}

        <ExpandableSection
          title="Needs a reply"
          subtitle="Negative reviews with draft responses"
          expanded={
            showReplies
          }
          onPress={() =>
            setShowReplies(
              !showReplies
            )
          }
        >
          {suggestedReplies.length ===
          0 ? (
            <View
              style={
                styles.noReplyCard
              }
            >
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
                No negative review with usable text was
                available in the current Google sample.
              </Text>

              <Text
                style={
                  styles.unknownResponseNote
                }
              >
                Note: Google Places does not expose whether
                a business has already responded to a review.
              </Text>
            </View>
          ) : (
            suggestedReplies.map(
              (review) => {
                const expanded =
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
                      <Text
                        style={
                          styles.ratingNegative
                        }
                      >
                        ★ {review.rating}
                      </Text>

                      <Text
                        style={
                          styles.reviewDate
                        }
                      >
                        Review
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.reviewText
                      }
                    >
                      "{review.text}"
                    </Text>

                    <Pressable
                      style={
                        styles.replyButton
                      }
                      onPress={() =>
                        setSelectedReplyId(
                          expanded
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
                        {expanded
                          ? 'Hide suggested reply'
                          : 'View suggested reply'}
                      </Text>
                    </Pressable>

                    {expanded && (
                      <View
                        style={
                          styles.replyBox
                        }
                      >
                        <Text
                          style={
                            styles.replyBoxTitle
                          }
                        >
                          Suggested response
                        </Text>

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
                          Response status: unknown
                        </Text>
                      </View>
                    )}
                  </View>
                );
              }
            )
          )}
        </ExpandableSection>

        {/* =================================================
            COMPETITORS
        ================================================= */}

        <ExpandableSection
          title="Competitor comparison"
          subtitle={
            analysis.competitorSearch?.note ??
            'Comparable businesses in the same area'
          }
          expanded={
            showCompetitors
          }
          onPress={() =>
            setShowCompetitors(
              !showCompetitors
            )
          }
        >
          {/* Current business */}

          <View
            style={
              styles.competitorRow
            }
          >
            <View
              style={
                styles.competitorMain
              }
            >
              <Text
                style={
                  styles.youLabel
                }
              >
                THIS BUSINESS
              </Text>

              <Text
                style={
                  styles.competitorName
                }
              >
                {business.name}
              </Text>

              <Text
                style={
                  styles.competitorMetric
                }
              >
                {formatRating(
                  business.rating
                )}{' '}
                ★ ·{' '}
                {formatNumber(
                  business.reviewCount
                )}{' '}
                reviews
              </Text>
            </View>
          </View>

          {competitors.length ===
          0 ? (
            <EmptySection
              text="No comparable businesses were returned by Google."
            />
          ) : (
            competitors.map(
              (
                competitor,
                index
              ) => (
                <CompetitorRow
                  key={
                    competitor.placeId ||
                    `${competitor.name}-${index}`
                  }
                  name={
                    competitor.name
                  }
                  rating={
                    formatRating(
                      competitor.rating
                    )
                  }
                  reviews={
                    formatNumber(
                      competitor.reviewCount
                    )
                  }
                  velocity={
                    competitor.velocity !== null &&
                    competitor.reviewsSampled >= 30
                      ? `~${competitor.velocity}/mo`
                      : 'Insufficient data'
                  }
                  responseRate={
                    competitor.responseRate !==
                    null
                      ? `${competitor.responseRate}%`
                      : 'Unavailable'
                  }
                />
              )
            )
          )}

          {bestCompetitor && (
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
                Highest-rated comparable
              </Text>

              <Text
                style={
                  styles.competitorInsightText
                }
              >
                {bestCompetitor.name} at{' '}
                {formatRating(
                  bestCompetitor.rating
                )}{' '}
                ★
              </Text>
            </View>
          )}

          <Text
            style={
              styles.responseUnavailableNote
            }
          >
            Response rates are unavailable because Google
            Places does not expose business-owner response
            status in the review data.
          </Text>
        </ExpandableSection>

        {/* =================================================
            RECOMMENDATIONS
        ================================================= */}

        <ExpandableSection
          title="Recommended actions"
          subtitle="Prioritized from the available evidence"
          expanded={
            showRecommendations
          }
          onPress={() =>
            setShowRecommendations(
              !showRecommendations
            )
          }
        >
          {recommendations.map(
            (
              recommendation,
              index
            ) => (
              <Recommendation
                key={`recommendation-${index}`}
                priority={
                  recommendation.priority
                }
                action={
                  recommendation.action
                }
              />
            )
          )}
        </ExpandableSection>

        {/* =================================================
            SOURCE / ANALYSIS NOTE
        ================================================= */}

        <View
          style={
            styles.sourceCard
          }
        >
          <Text
            style={
              styles.sourceTitle
            }
          >
            Data source
          </Text>

          <Text
            style={
              styles.sourceText
            }
          >
            Google Places ·{' '}
            {dataQuality.reviewsCollected}{' '}
            reviews collected ·{' '}
            {dataQuality.reviewsWithText}{' '}
            with usable text
          </Text>

          {analysis.aiAnalysis?.note && (
            <Text
              style={
                styles.sourceText
              }
            >
              {analysis.aiAnalysis.note}
            </Text>
          )}
        </View>

        {/* =================================================
            NEW ANALYSIS
        ================================================= */}

        <Pressable
          style={
            styles.newAnalysisButton
          }
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
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// =========================================================
// RATING BAR
// =========================================================

function RatingBar({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage =
    total > 0
      ? (value / total) * 100
      : 0;

  return (
    <View
      style={
        styles.ratingRow
      }
    >
      <Text
        style={
          styles.ratingLabel
        }
      >
        {label}
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
              width:
                `${percentage}%`,
            },
          ]}
        />
      </View>

      <Text
        style={
          styles.ratingNumber
        }
      >
        {value}
      </Text>
    </View>
  );
}

// =========================================================
// THEME ROW
// =========================================================

function ThemeRow({
  theme,
  mentions,
  sentiment,
  quotes,
}: {
  theme: string;
  mentions: string;
  sentiment: string;
  quotes: string[];
}) {
  return (
    <View
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
            {theme}
          </Text>

          <Text
            style={
              styles.themeMentions
            }
          >
            {mentions}
          </Text>
        </View>

        <Text
          style={[
            styles.sentiment,
            sentiment ===
            'Positive'
              ? styles.positive
              : sentiment ===
                'Negative'
                ? styles.negative
                : styles.mixed,
          ]}
        >
          {sentiment}
        </Text>
      </View>

      {quotes.length > 0 && (
        <View
          style={
            styles.quoteContainer
          }
        >
          {quotes
            .slice(0, 2)
            .map(
              (
                quote,
                index
              ) => (
                <Text
                  key={`${theme}-quote-${index}`}
                  style={
                    styles.quoteText
                  }
                >
                  "{quote}"
                </Text>
              )
            )}
        </View>
      )}
    </View>
  );
}

// =========================================================
// EXPANDABLE SECTION
// =========================================================

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
    <View
      style={
        styles.expandable
      }
    >
      <Pressable
        onPress={onPress}
        style={
          styles.expandableHeader
        }
      >
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
            {title}
          </Text>

          <Text
            style={
              styles.sectionSubtitle
            }
          >
            {subtitle}
          </Text>
        </View>

        <Text
          style={
            styles.chevron
          }
        >
          {expanded
            ? '⌃'
            : '›'}
        </Text>
      </Pressable>

      {expanded && (
        <View
          style={
            styles.expandedContent
          }
        >
          {children}
        </View>
      )}
    </View>
  );
}

// =========================================================
// INSIGHT BULLET
// =========================================================

function InsightBullet({
  symbol,
  text,
  positive = false,
}: {
  symbol: string;
  text: string;
  positive?: boolean;
}) {
  return (
    <View
      style={
        styles.insightBullet
      }
    >
      <Text
        style={[
          styles.insightSymbol,
          positive
            ? styles.positiveSymbol
            : styles.negativeSymbol,
        ]}
      >
        {symbol}
      </Text>

      <Text
        style={
          styles.insightText
        }
      >
        {text}
      </Text>
    </View>
  );
}

// =========================================================
// COMPETITOR ROW
// =========================================================

function CompetitorRow({
  name,
  rating,
  reviews,
  velocity,
  responseRate,
}: {
  name: string;
  rating: string;
  reviews: string;
  velocity: string;
  responseRate: string;
}) {
  return (
    <View
      style={
        styles.competitorRow
      }
    >
      <Text
        style={
          styles.competitorName
        }
      >
        {name}
      </Text>

      <Text
        style={
          styles.competitorMetric
        }
      >
        {rating} ★ · {reviews} reviews
      </Text>

      <View
        style={
          styles.competitorDetails
        }
      >
        <Text
          style={
            styles.competitorDetail
          }
        >
          Velocity: {velocity}
        </Text>

        <Text
          style={
            styles.competitorDetail
          }
        >
          Response: {responseRate}
        </Text>
      </View>
    </View>
  );
}

// =========================================================
// RECOMMENDATION
// =========================================================

function Recommendation({
  priority,
  action,
}: {
  priority: string;
  action: string;
}) {
  return (
    <View
      style={
        styles.recommendation
      }
    >
      <Text
        style={[
          styles.priority,
          priority === 'High'
            ? styles.priorityHigh
            : styles.priorityMedium,
        ]}
      >
        {priority}
      </Text>

      <Text
        style={
          styles.recommendationText
        }
      >
        {action}
      </Text>
    </View>
  );
}

// =========================================================
// EMPTY SECTION
// =========================================================

function EmptySection({
  text,
}: {
  text: string;
}) {
  return (
    <View
      style={
        styles.emptySection
      }
    >
      <Text
        style={
          styles.emptySectionText
        }
      >
        {text}
      </Text>
    </View>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        '#F7F8FA',
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
      marginTop: 6,
      fontSize: 14,
      lineHeight: 20,
      color: '#667085',
    },

    // =====================================================
    // DATA QUALITY
    // =====================================================

    dataQualityCard: {
      marginTop: 20,
      padding: 14,
      borderRadius: 14,
      backgroundColor: '#EFF6FF',
      borderWidth: 1,
      borderColor: '#BFDBFE',
      flexDirection: 'row',
    },

    dataQualityIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2563EB',
    },

    dataQualityIconText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },

    dataQualityContent: {
      flex: 1,
      marginLeft: 10,
    },

    dataQualityTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: '#1E3A8A',
    },

    dataQualityText: {
      marginTop: 4,
      fontSize: 12,
      lineHeight: 17,
      color: '#475467',
    },

    // =====================================================
    // SUMMARY
    // =====================================================

    summaryCard: {
      marginTop: 18,
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
      height: 75,
      marginHorizontal: 20,
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

    sampleLabel: {
      marginTop: 6,
      fontSize: 11,
      fontWeight: '700',
      color: '#2563EB',
    },

    // =====================================================
    // ASSESSMENT
    // =====================================================

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
      maxWidth: '58%',
      fontSize: 14,
      fontWeight: '600',
      color: '#344054',
      textAlign: 'right',
    },

    // =====================================================
    // SECTIONS
    // =====================================================

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
      lineHeight: 18,
      color: '#667085',
    },

    // =====================================================
    // RATING
    // =====================================================

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

    // =====================================================
    // VELOCITY
    // =====================================================

    velocityCard: {
      marginTop: 24,
      padding: 18,
      borderRadius: 16,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#EAECF0',
      position: 'relative',
    },

    velocityTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#111827',
    },

    velocitySubtitle: {
      marginTop: 3,
      fontSize: 12,
      color: '#667085',
    },

    velocityRight: {
      position: 'absolute',
      right: 18,
      top: 16,
      alignItems: 'flex-end',
    },

    velocityValue: {
      fontSize: 22,
      fontWeight: '700',
      color: '#111827',
    },

    velocityUnit: {
      fontSize: 11,
      color: '#667085',
    },

    velocityStatus: {
      marginTop: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#EAECF0',
    },

    velocityStatusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#667085',
    },

    // =====================================================
    // EXPANDABLE
    // =====================================================

    expandable: {
      marginTop: 24,
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

    // =====================================================
    // THEMES
    // =====================================================

    themeContainer: {
      paddingVertical: 6,
    },

    themeRow: {
      paddingVertical: 10,
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

    quoteContainer: {
      marginTop: 3,
      paddingLeft: 12,
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

    insightSymbol: {
      width: 24,
      fontSize: 16,
      fontWeight: '800',
    },

    positiveSymbol: {
      color: '#15803D',
    },

    negativeSymbol: {
      color: '#B42318',
    },

    insightText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      color: '#475467',
    },

    // =====================================================
    // REPLIES
    // =====================================================

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

    ratingNegative: {
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

    replyBox: {
      marginTop: 14,
      padding: 14,
      borderRadius: 12,
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },

    replyBoxTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: '#344054',
    },

    replyBoxText: {
      marginTop: 8,
      fontSize: 14,
      lineHeight: 21,
      color: '#475467',
    },

    replyStatus: {
      marginTop: 10,
      fontSize: 11,
      color: '#98A2B3',
    },

    noReplyCard: {
      paddingVertical: 10,
    },

    noReplyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#344054',
    },

    noReplyText: {
      marginTop: 6,
      fontSize: 13,
      lineHeight: 19,
      color: '#667085',
    },

    unknownResponseNote: {
      marginTop: 10,
      fontSize: 12,
      lineHeight: 17,
      color: '#98A2B3',
    },

    // =====================================================
    // COMPETITORS
    // =====================================================

    competitorRow: {
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: '#EAECF0',
    },

    competitorMain: {
      flex: 1,
    },

    youLabel: {
      marginBottom: 4,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: '#2563EB',
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

    competitorDetails: {
      marginTop: 6,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },

    competitorDetail: {
      fontSize: 12,
      color: '#667085',
    },

    competitorInsight: {
      marginTop: 14,
      padding: 13,
      borderRadius: 12,
      backgroundColor: '#F8FAFC',
    },

    competitorInsightTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: '#667085',
    },

    competitorInsightText: {
      marginTop: 4,
      fontSize: 14,
      fontWeight: '600',
      color: '#344054',
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

    recommendation: {
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: '#EAECF0',
    },

    priority: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },

    priorityHigh: {
      color: '#B42318',
    },

    priorityMedium: {
      color: '#B54708',
    },

    recommendationText: {
      marginTop: 5,
      fontSize: 14,
      lineHeight: 20,
      color: '#344054',
    },

    // =====================================================
    // EMPTY
    // =====================================================

    emptySection: {
      paddingVertical: 12,
    },

    emptySectionText: {
      fontSize: 13,
      lineHeight: 19,
      color: '#667085',
    },

    // =====================================================
    // SOURCE
    // =====================================================

    sourceCard: {
      marginTop: 24,
      padding: 16,
      borderRadius: 14,
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#EAECF0',
    },

    sourceTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: '#344054',
    },

    sourceText: {
      marginTop: 5,
      fontSize: 12,
      lineHeight: 18,
      color: '#667085',
    },

    // =====================================================
    // BUTTON
    // =====================================================

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

    // =====================================================
    // ERROR
    // =====================================================

    errorContainer: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: 'center',
    },

    errorTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#111827',
    },

    errorText: {
      marginTop: 8,
      fontSize: 14,
      lineHeight: 21,
      color: '#667085',
    },
  });