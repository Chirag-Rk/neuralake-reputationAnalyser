# Reputation & Review Intelligence

> A mobile-first application for analyzing customer reviews, identifying reputation trends, benchmarking competitors, and generating actionable business recommendations.

Reputation & Review Intelligence transforms real customer-review data into a structured reputation snapshot for businesses. The application combines business information, review analytics, AI-powered semantic analysis, competitor intelligence, and evidence-based recommendations within a focused mobile experience.

The system is designed with **data transparency and evidence quality** in mind. When the available review sample is insufficient to support a metric or conclusion, the application explicitly communicates that limitation rather than presenting an unsupported estimate.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Objectives](#objectives)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Analysis Pipeline](#analysis-pipeline)
- [Intelligence Components](#intelligence-components)
- [Data Sources](#data-sources)
- [Data Quality & Reliability](#data-quality--reliability)
- [Installation Guide](#installation-guide)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Mobile Application Screens](#mobile-application-screens)
- [Testing & Validation](#testing--validation)
- [Engineering Decisions](#engineering-decisions)
- [Known Limitations](#known-limitations)
- [Future Enhancements](#future-enhancements)
- [Project Scope](#project-scope)
- [Security](#security)
- [License](#license)

---

# Project Overview

Reputation & Review Intelligence is a **React Native mobile application** that helps businesses understand how customers perceive their products and services.

A user enters a business name and location. The backend resolves the business, retrieves the available review sample, calculates deterministic metrics, analyzes customer feedback using AI, discovers nearby competitors, and generates actionable recommendations.

### Core Workflow

```text
Business Search
      │
      ▼
Business Resolution
      │
      ▼
Review Collection
      │
      ▼
Review Normalization
      │
      ▼
Deterministic Metrics
      │
      ▼
AI Semantic Analysis
      │
      ├───────────────┐
      ▼               ▼
Customer Themes   Review Responses
      │
      ▼
Competitor Analysis
      │
      ▼
Recommendations
      │
      ▼
Mobile Results Dashboard
```

# Problem Statement

Customer reviews contain valuable information about a business, but manually analyzing large amounts of feedback is time-consuming and difficult to scale.

A simple star rating does not answer important business questions such as:

- What do customers consistently appreciate?
- What problems are mentioned repeatedly?
- Which customer concerns require attention?
- What are the business's primary strengths and weaknesses?
- Which negative reviews may require a response?
- How does the business compare with nearby competitors?
- What actions should management prioritize?

The purpose of this project is to convert available customer feedback into structured, understandable, and actionable reputation intelligence.

The application combines deterministic analytics with AI-powered semantic analysis while maintaining clear boundaries around what the available data can actually support.

# Objectives

The primary objectives of the system are to:

- Resolve a real business using its name and location.
- Collect the review information available through the selected data source.
- Calculate reliable review and rating metrics.
- Identify meaningful customer themes.
- Determine sentiment associated with those themes.
- Identify evidence-based strengths and weaknesses.
- Surface eligible negative reviews for response generation.
- Generate professional suggested review responses.
- Discover and compare nearby competitors.
- Produce prioritized, evidence-based recommendations.
- Clearly communicate data coverage and analytical limitations.

# Key Features

## Business Search

Search for a real business using:

- Business name
- Location

The backend resolves the requested business before performing the analysis.

## Reputation Overview

The application provides a high-level business snapshot including:

- Business name
- Overall rating
- Total public review count
- Most recent available review date

## Review Analytics

The system calculates metrics from the reviews actually available to the application:

- Rating distribution
- Average rating of the collected sample
- Review count
- Reviews containing usable text
- Review date range
- Review velocity when sufficient historical data is available
- Review-text coverage

## Customer Theme Analysis

AI-powered semantic analysis identifies meaningful topics appearing in customer feedback.

Each theme can include:

- Theme name
- Mention count
- Sentiment
- Supporting review quotes
- Evidence strength

Example:

```json
{
  "theme": "Exceptional Service",
  "mentions": 3,
  "sentiment": "positive",
  "quotes": [
    "Example supporting customer quote"
  ],
  "evidenceStrength": "strong"
}
```

## Strengths & Weaknesses

The system identifies business strengths and weaknesses based on the available review evidence.

The analysis is designed to distinguish between:

- Isolated feedback
- Repeated observations
- Stronger recurring signals

This prevents a single review from automatically being interpreted as a business-wide trend.

## Negative Review Intelligence

Eligible negative reviews can be surfaced for further attention.

The application provides context from the original review and, where appropriate, generates a suggested response.

## AI-Generated Review Responses

Suggested responses are designed to be:

- Professional
- Calm
- Concise
- Relevant
- Non-defensive

The response generation process avoids:

- Excuses
- Unsupported promises
- Invented facts
- Private customer information
- Unnecessary customer identification

## Competitor Intelligence

Nearby competitors are discovered dynamically using Google Places.

The application can compare:

- Business name
- Rating
- Review count
- Available review metrics
- Review velocity when sufficient data exists

Competitors are dynamically discovered rather than hardcoded.

## Data Quality Transparency

The application explicitly communicates the quality and coverage of the review data.

Key indicators include:

- Total public review count
- Reviews collected
- Reviews containing usable text
- Analysis coverage
- Source information
- Collection method
- Velocity availability
- Known limitations

# System Architecture

```text
┌──────────────────────────────────────────┐
│            React Native Mobile App        │
│               Expo + TypeScript           │
└────────────────────┬─────────────────────┘
                      │
                      │ POST /analyse
                      ▼
┌──────────────────────────────────────────┐
│             Node.js + Express             │
│                 Backend                   │
└──────────────┬──────────────┬─────────────┘
               │              │
               ▼              ▼
       ┌──────────────┐ ┌──────────────┐
       │ Google Places│ │  Gemini API  │
       │     API      │ │              │
       └──────┬───────┘ └──────┬───────┘
              │                │
              └────────┬───────┘
                        ▼
              Analysis Pipeline
                        │
                        ▼
              Structured JSON
                        │
                        ▼
┌──────────────────────────────────────────┐
│              Results Screen               │
│                                            │
│ Rating • Themes • Strengths               │
│ Weaknesses • Competitors                  │
│ Recommendations • Suggested Replies       │
│ Data Quality                              │
└──────────────────────────────────────────┘
```

# Technology Stack

| Category | Technology |
|---|---|
| Mobile Framework | React Native |
| Development Platform | Expo |
| Programming Language | TypeScript |
| Navigation | Expo Router |
| Backend Runtime | Node.js |
| Backend Framework | Express.js |
| Business Data | Google Places API |
| Review Data | Google Places API |
| AI / Semantic Analysis | Gemini API |
| Communication | REST API |
| Data Exchange | JSON |

# Project Structure

```text
neuralake-reputation-analyzer/
│
├── assets/
│   └── images/
│       └── reputation-bg.png
│
├── src/
│   └── app/
│       ├── index.tsx
│       ├── analysing.tsx
│       ├── results.tsx
│       └── analysisStore.ts
│
├── Server/
│   ├── src/
│   │   └── index.js
│   ├── package.json
│   └── .env
│
├── app.json
├── package.json
├── package-lock.json
└── README.md
```

## Application Components

| File | Responsibility |
|---|---|
| index.tsx | Business search interface |
| analysing.tsx | Analysis workflow and backend communication |
| results.tsx | Reputation intelligence dashboard |
| analysisStore.ts | Analysis state management |
| Server/src/index.js | Backend API and analysis pipeline |
| Server/package.json | Backend dependencies and scripts |
| app.json | Expo application configuration |
| reputation-bg.png | Mobile application visual asset |

# Analysis Pipeline

The backend processes a business through several stages.

## Step 1 — Business Resolution

The submitted business name and location are used to identify the corresponding business.

## Step 2 — Review Collection

The backend retrieves the available review sample associated with the resolved business.

## Step 3 — Review Normalization

Collected reviews are normalized into a consistent internal format.

The process handles:

- Review identifiers
- Ratings
- Review text
- Review dates
- Missing text
- Duplicate reviews

## Step 4 — Deterministic Analysis

The backend calculates numerical metrics programmatically.

This includes:

- Rating distribution
- Review counts
- Sample average
- Review dates
- Text coverage
- Review velocity when supported by sufficient evidence

## Step 5 — Semantic Analysis

Gemini analyzes the available review text to identify:

- Customer themes
- Sentiment
- Strengths
- Weaknesses
- Supporting evidence

## Step 6 — Competitor Discovery

Nearby businesses are identified using Google Places based on the resolved business and its category.

## Step 7 — Review Response Generation

Eligible negative reviews are passed through a controlled response-generation workflow.

## Step 8 — Recommendations

The system produces prioritized recommendations based on the available customer evidence.

## Step 9 — Results

The final structured analysis is returned to the mobile application and displayed through the results dashboard.

# Intelligence Components

## 1. Business Resolution Engine

The Business Resolution Engine identifies the requested business and retrieves core business metadata.

Typical information includes:

- Business name
- Place ID
- Rating
- Review count
- Business category
- Location

## 2. Review Metrics Engine

The Review Metrics Engine performs deterministic calculations on the collected review sample.

### Metrics

- Average rating
- Rating distribution
- Review count
- Reviews with usable text
- First available review date
- Most recent review date
- Review velocity when supported

Numerical calculations are performed programmatically rather than delegated to the LLM.

## 3. Customer Theme Intelligence

Gemini is used for semantic interpretation of customer review text.

The model is instructed to:

- Use only supplied review evidence
- Identify meaningful themes
- Count mentions by review
- Determine sentiment
- Provide short supporting quotes
- Assign evidence strength
- Identify strengths
- Identify weaknesses
- Avoid unsupported conclusions

### Evidence Strength

| Supporting Reviews | Evidence Strength |
|---|---|
| 1 | Limited |
| 2 | Moderate |
| 3+ | Strong |

A theme supported by one review is therefore treated as a limited signal, rather than automatically being described as a recurring trend.

## 4. Quote Validation

Generated quotes are validated against the original review text.

This provides an additional safeguard against unsupported or fabricated customer quotations.

## 5. Recommendation Engine

Recommendations are derived from the available evidence.

Inputs can include:

- Negative themes
- Weaknesses
- Mixed feedback
- Positive themes
- Evidence strength

Recommendations are prioritized according to the strength and relevance of the available evidence.

## 6. Review Response Engine

Reviews with ratings of 3 stars or below and usable text can be considered for response generation.

Generated responses are designed to:

- Acknowledge the customer's feedback
- Maintain a professional tone
- Avoid defensiveness
- Avoid unsupported claims
- Remain concise

## 7. Competitor Intelligence Engine

The system dynamically discovers nearby competitors rather than relying on predefined competitors.

This makes the analysis adaptable to different:

- Businesses
- Locations
- Business categories

# Data Sources

## Google Places API

Google Places is used as the primary source for:

- Business information
- Ratings
- Public review counts
- Available review samples
- Nearby competitor discovery

The application uses the available API data rather than relying on browser scraping.

# Data Quality & Reliability

Data quality is a core consideration of the system.

## Review Sample Limitation

The number of public reviews associated with a business can be significantly larger than the number of reviews exposed to the application through the selected API.

For example:

```text
Business
   │
   ├── 37,000+ public reviews
   │
   ▼
Google Places API
   │
   ├── Limited review sample
   │
   ▼
Available evidence
   │
   ▼
Analysis
```

Therefore:

```text
Total Public Reviews
        ≠
Reviews Available for Analysis
```

The application communicates this distinction instead of implying complete historical coverage.

## Analysis Coverage

The system reports:

- Total public reviews
- Reviews collected
- Reviews with usable text
- Analysis coverage

This provides context for interpreting the generated insights.

## Review Velocity

Review velocity is only calculated when the available review dates provide sufficient historical evidence.

If the available sample is inadequate, the system reports:

```text
Insufficient data
```

rather than producing a precise-looking estimate from insufficient observations.

## Response Rate

The available review data does not reliably expose business-owner response status for the collected reviews.

Therefore, response rate is reported as:

```text
Unavailable
```

rather than being estimated or fabricated.

## Semantic Analysis Coverage

AI-generated insights depend on the amount of usable review text available.

When the available text is insufficient, the application can communicate that semantic analysis is unavailable or limited.

# Installation Guide

## Prerequisites

Install the following:

- Node.js
- npm
- Expo
- Expo Go
- Google Places API credentials
- Gemini API credentials

## Clone the Repository

```bash
git clone https://github.com/Chirag-Rk/neuralake-reputationAnalyser.git
```

Navigate into the project:

```bash
cd neuralake-reputation-analyzer
```

## Install Mobile Dependencies

From the project root:

```bash
npm install
```

## Install Backend Dependencies

Navigate to the backend:

```bash
cd Server
```

Install dependencies:

```bash
npm install
```

# Configuration

Create the backend environment file:

```text
Server/.env
```

Add the required API credentials:

```env
GOOGLE_PLACES_API_KEY=your_google_places_api_key
GEMINI_API_KEY=your_gemini_api_key
```

Replace the placeholder values with valid API keys.

> **Important**
> Do not commit API credentials to source control.
> The `.env` file is excluded through `.gitignore`.

# Running the Application

## Start the Backend

From the Server directory:

```bash
npm start
```

The backend runs on:

```text
http://localhost:3000
```

## Start the Mobile Application

Open a second terminal and return to the project root:

```bash
cd ..
```

Start Expo:

```bash
npx expo start
```

Open the application using Expo Go.

## Physical Device Development

For physical-device testing:

1. Connect the development computer and mobile device to the same local network.
2. Start the backend.
3. Start Expo.
4. Open the project through Expo Go.
5. Ensure the mobile application is configured to communicate with the development machine's local network address.

# API Reference

## POST /analyse

Runs the reputation intelligence pipeline for a business.

### Request

```json
{
  "businessName": "The Leela Palace Bengaluru",
  "location": "Bengaluru, Karnataka"
}
```

### Response

The API returns structured reputation intelligence.

```json
{
  "business": {
    "name": "The Leela Palace Bengaluru",
    "rating": 4.6,
    "reviewCount": 37125,
    "lastReviewDate": "..."
  },
  "dataQuality": {
    "totalBusinessReviews": 37125,
    "reviewsCollected": 5,
    "reviewsWithText": 3,
    "analysisCoverage": "limited",
    "note": "...",
    "velocityNote": "..."
  },
  "sources": [
    {
      "platform": "Google Places",
      "reviewsCollected": 5,
      "method": "Place Details"
    }
  ],
  "metrics": {
    "averageRating": 4.6,
    "ratingDistribution": {
      "5": 3,
      "4": 1,
      "3": 1,
      "2": 0,
      "1": 0
    },
    "sentimentCounts": {
      "positive": 3,
      "mixed": 1,
      "negative": 1
    },
    "reviewDates": {
      "first": "...",
      "last": "..."
    },
    "velocity": {
      "perMonth": null,
      "trend": "insufficient_data"
    },
    "reviewCount": 5,
    "reviewsWithText": 3
  },
  "themes": [],
  "strengths": [],
  "weaknesses": [],
  "competitors": [],
  "unanswered": [],
  "suggestedReplies": []
}
```

### Response Fields

| Field | Description |
|---|---|
| business | Resolved business information |
| dataQuality | Review coverage and data-quality information |
| sources | Data-source and collection-method details |
| metrics | Deterministically calculated review metrics |
| themes | AI-generated customer themes |
| strengths | Evidence-based positive observations |
| weaknesses | Evidence-based negative observations |
| competitors | Dynamically discovered nearby competitors |
| unanswered | Eligible negative reviews |
| suggestedReplies | Generated review-response suggestions |
| reviews | Normalized review records |

# Mobile Application Screens

The application intentionally follows a focused three-screen experience.

## Screen 1 — Find a Business

The user enters:

- Business name
- Location

The screen provides a clear primary action to initiate the analysis.

The interface is designed around:

- Mobile-first interaction
- Clear hierarchy
- Large touch targets
- Minimal user input
- Simple navigation

## Screen 2 — Analysing

The application displays named analysis stages instead of an indefinite loading spinner.

Example:

```text
Resolving business
        ↓
Collecting reviews
        ↓
Calculating metrics
        ↓
Analyzing customer themes
        ↓
Comparing competitors
        ↓
Preparing recommendations
```

The screen also handles:

- Loading state
- Analysis progress
- API errors
- Failed analysis
- Successful completion

## Screen 3 — Results

The results dashboard presents the most important information first.

### Business Summary

- Business name
- Overall rating
- Review count

### Review Intelligence

- Rating distribution
- Review velocity
- Customer themes
- Sentiment
- Strengths
- Weaknesses

### Response Intelligence

- Eligible negative reviews
- Suggested responses

### Competitor Intelligence

- Nearby competitors
- Ratings
- Review counts
- Available comparison metrics

### Recommendations

Prioritized actions based on the available customer evidence.

### Data Quality

The results also communicate:

- Review sample size
- Text coverage
- Data source
- Analysis coverage
- Metric limitations

# Testing & Validation

The application was validated using multiple real businesses and different review conditions.

## Business Test — The Leela Palace Bengaluru

The Leela Palace Bengaluru was used to validate the primary reputation-analysis workflow.

Validated functionality included:

- Real business resolution
- Real Google review collection
- Rating metrics
- Rating distribution
- Customer themes
- Sentiment analysis
- Strength identification
- Weakness identification
- Competitor discovery
- Recommendations
- Data-quality reporting
- Insufficient-data velocity handling

## Business Test — Westside, Indira Nagar

Westside was used to validate the application against a different business category and review profile.

Validated functionality included:

- Business resolution
- Review collection
- Review-text analysis
- Negative-review handling
- Suggested response generation
- Dynamic competitor discovery
- Evidence-aware recommendations
- Limited-data handling

## Edge Case Handling

### Business Not Found

The application displays an appropriate error state rather than attempting to analyze an unresolved business.

### Limited Review Sample

The application clearly reports limited review coverage.

### Insufficient Velocity Data

The application displays:

```text
Insufficient data
```

instead of producing an unsupported estimate.

### No Eligible Negative Reviews

No unnecessary response suggestions are generated when there are no eligible negative reviews.

### Insufficient Review Text

Semantic analysis can be marked as unavailable when there is insufficient usable review text.

## Expo Validation

The project was validated using:

```bash
npx expo-doctor
```

Final validation:

```text
21/21 checks passed
```

## Backend Syntax Validation

The backend can be validated using:

```bash
node --check Server/src/index.js
```

# Engineering Decisions

## Deterministic Metrics

Numerical calculations are performed programmatically instead of relying on an LLM.

This applies to:

- Review counts
- Rating distributions
- Dates
- Statistical calculations
- Review velocity

This improves reproducibility and reduces hallucination risk.

## AI for Semantic Tasks

AI is used specifically for tasks that benefit from natural-language understanding:

- Theme extraction
- Sentiment classification
- Strength identification
- Weakness identification
- Review-response generation

This creates a clear separation between deterministic computation and probabilistic language analysis.

## Evidence-Based Analysis

The AI analysis is constrained to the review evidence provided to it.

The system avoids intentionally inferring unsupported business characteristics.

## Structured AI Output

AI analysis follows a structured schema.

The output is validated before being consumed by the mobile application.

This makes the AI integration more predictable and easier to handle programmatically.

## Quote Verification

AI-generated review quotes are checked against the original review text.

This provides an additional layer of protection against unsupported quotations.

## Explicit Uncertainty

When data is insufficient, the application communicates the limitation instead of inventing a result.

For example:

```text
Insufficient data
```

is preferable to presenting an exact monthly review rate when the available sample cannot support that precision.

## Dynamic Competitor Discovery

Competitors are discovered dynamically through Google Places.

This allows the same analysis pipeline to work across multiple businesses and categories without hardcoded competitor data.

## Backend Credential Protection

Third-party credentials are kept on the backend.

The mobile client communicates with the backend instead of exposing provider API keys.

# Known Limitations

The current implementation has several intentional limitations.

## Limited Review Availability

The selected Google Places API workflow exposes only a limited review sample compared with the complete public review history of a business.

## Historical Review Velocity

Reliable review velocity requires enough dated review observations across a meaningful time period.

When this evidence is unavailable, the application reports insufficient data.

## Response Rate

Business-owner response information is not reliably available through the review data used by this implementation.

## AI Analysis Coverage

The quality of semantic analysis depends on:

- Number of reviews collected
- Amount of usable review text
- Quality of the available text

## Competitor Data

Competitor analysis depends on the businesses and information returned by Google Places.

## Dynamic Review Data

The available review sample can change between requests.

## No Persistent Database

The current implementation does not maintain historical review snapshots or long-term reputation records.

## No Automatic Publishing

Suggested review responses are generated for the user but are not automatically posted to external review platforms.

# Future Enhancements

Potential future improvements include:

## Multi-Source Review Integration

Support additional review platforms to increase review coverage and provide a broader view of business reputation.

## Historical Reputation Tracking

Maintain historical snapshots to support:

- Reputation trends
- Rating changes
- Review-volume trends
- Sentiment evolution
- Theme evolution

## Advanced Review Velocity

With larger historical datasets, the application could provide more reliable:

- Monthly review velocity
- Growth rates
- Period-over-period comparisons
- Review-volume trends

## Advanced Competitor Benchmarking

Future versions could include:

- Competitive rankings
- Category benchmarks
- Sentiment comparison
- Theme comparison
- Strength comparison
- Reputation gaps

## Automated Monitoring

A future version could continuously monitor reputation changes and notify businesses when significant changes occur.

## Business Accounts

Future versions could introduce:

- Authentication
- Saved businesses
- Saved analyses
- Historical dashboards
- Team access

# Project Scope

The current implementation intentionally focuses on the core reputation-intelligence workflow:

```text
Search
  ↓
Analyze
  ↓
Understand
  ↓
Compare
  ↓
Act
```

The following features are outside the current scope:

- User authentication
- User accounts
- Payments
- Notifications
- PDF export
- Automatic review posting
- Multilingual support
- Dark mode
- Persistent reputation monitoring

Keeping the scope focused ensures that the core analysis workflow remains reliable, demonstrable, and maintainable.

# Security

The project follows basic security practices for third-party API integrations.

## API Key Protection

- API keys are stored in backend environment variables.
- `.env` files are excluded from Git.
- Credentials are not hardcoded into the mobile application.
- Third-party API credentials are not sent to the mobile client.

## Environment Configuration

Sensitive configuration is maintained locally through:

```text
Server/.env
```

A production deployment should additionally use a secure secret-management solution and appropriately restricted API credentials.

# Conclusion

Reputation & Review Intelligence demonstrates how real customer feedback can be transformed into actionable business intelligence through a combination of deterministic analytics and AI-powered semantic analysis.

The system focuses on five core capabilities:

```text
Real Data
   +
Reliable Metrics
   +
AI-Powered Insights
   +
Competitor Intelligence
   +
Actionable Recommendations
```

The application also emphasizes responsible interpretation of data by explicitly distinguishing between:

- Total public reviews
- Reviews actually available for analysis
- Evidence-supported insights
- Limited signals
- Unavailable metrics

This approach enables the application to provide useful reputation intelligence while avoiding false precision and unsupported conclusions.

# License

This project was developed as part of the NeuraLake Reputation & Review Intelligence assignment.

The implementation is intended for evaluation and demonstration purposes.
