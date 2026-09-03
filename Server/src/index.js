const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'NeuraLake Reputation API',
  });
});

app.post('/analyse', (req, res) => {
  const { businessName, location } = req.body;

  if (!businessName || !location) {
    return res.status(400).json({
      error: 'Business name and location are required.',
    });
  }

  const analysis = {
    business: {
      name: businessName,
      rating: 4.2,
      reviewCount: 187,
      lastReviewDate: '2026-09-01',
    },

    sources: [
      {
        platform: 'demo',
        reviewsCollected: 187,
        method: 'hardcoded sample data',
      },
    ],

    distribution: {
      '5': 121,
      '4': 38,
      '3': 14,
      '2': 7,
      '1': 7,
    },

    velocity: {
      perMonth: 14.5,
      trend: 'rising',
    },

    themes: [
      {
        theme: 'Staff',
        mentions: 46,
        sentiment: 'positive',
        quotes: [
          'Friendly and knowledgeable staff.',
        ],
      },
      {
        theme: 'Results',
        mentions: 39,
        sentiment: 'positive',
        quotes: [
          'Customers frequently praise the results.',
        ],
      },
      {
        theme: 'Waiting time',
        mentions: 31,
        sentiment: 'negative',
        quotes: [
          'Waited 40 minutes past my appointment.',
        ],
      },
      {
        theme: 'Booking',
        mentions: 18,
        sentiment: 'mixed',
        quotes: [
          'Booking was easy but the appointment started late.',
        ],
      },
    ],

    strengths: [
      'Friendly and knowledgeable staff',
      'Customers frequently praise results',
    ],

    weaknesses: [
      'Waiting times are the most repeated complaint',
      'Some customers mention appointment delays',
    ],

    unanswered: [
      {
        reviewId: 'demo-review-001',
        rating: 1,
        text: 'Waited 40 minutes past my appointment. Nobody explained the delay.',
        suggestedReply:
          'We are sorry to hear about the delay and understand how frustrating that must have been. Thank you for bringing this to our attention.',
      },
    ],

    competitors: [
      {
        name: 'Competitor A',
        rating: 4.5,
        reviewCount: 243,
        responseRate: 81,
      },
      {
        name: 'Competitor B',
        rating: 4.0,
        reviewCount: 156,
        responseRate: 64,
      },
    ],

    recommendations: [
      {
        action:
          'Address the four recent unanswered one-star reviews.',
        priority: 'high',
        why: 'Recent unanswered negative reviews are an immediate reputation risk.',
      },
      {
        action:
          'Investigate appointment delays and waiting times.',
        priority: 'high',
        why: 'Waiting time is the most repeated negative theme.',
      },
      {
        action:
          'Use positive staff and results feedback in marketing.',
        priority: 'medium',
        why: 'These are recurring strengths that can support customer acquisition.',
      },
    ],
  };

  res.json(analysis);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`NeuraLake API running on http://localhost:${PORT}`);
});