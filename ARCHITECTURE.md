# ARCHITECTURE.md

# CITY EMERGENCY ALERTS V6.1
## Current Architecture and Target Implementation

## 1. Runtime model

The application is a static Progressive Web App deployed through GitHub Pages.

There is no traditional application server in the current repository.

The system has two execution contexts:

### Browser

Responsibilities:

- load generated JSON
- render the six tabs
- manage Region / Taluka / Locality selection
- store local preferences
- store last-visit timestamp
- store safety-checklist state
- request browser geolocation
- call allowed browser APIs such as TomTom and Open-Meteo
- hand off navigation to a map application

### GitHub Actions / Node.js scripts

Responsibilities:

- collect or import source data
- normalize events
- classify events
- deduplicate events
- correlate related reports
- calculate confidence
- calculate impact
- apply lifecycle and expiry
- generate Situation Snapshot
- generate environmental intelligence
- generate journey context
- validate output
- write JSON into `data/`

## 2. Data flow

```text
Official sources / trusted media / weather / traffic / river data
        ↓
Collectors
        ↓
Normalization
        ↓
Classification
        ↓
Deduplication
        ↓
Correlation and evidence fusion
        ↓
Source trust and confidence
        ↓
Impact assessment
        ↓
Lifecycle and expiry
        ↓
Geographic/locality mapping
        ↓
Situation / Alerts / Incidents / Journey intelligence
        ↓
Generated JSON in data/
        ↓
Frontend rendering
```

## 3. Repository structure

```text
.github/workflows/   GitHub Actions
assets/              icons and static assets
config/              source, region, locality, severity, route and policy configuration
css/                 modular styles
data/                generated and fixture JSON
docs/                product and engineering documentation
js/                  browser application
scripts/             Node.js intelligence pipeline
tests/               automated tests
index.html            app shell
manifest.json         PWA manifest
sw.js                 service worker
package.json          scripts and package metadata
```

## 4. Browser architecture

### `js/app.js`

Application bootstrap.

Expected responsibilities only:

- register service worker
- load state
- initialize location selector
- initialize navigation
- render the app

### `js/core/`

- `state.js`: shared application state and event filtering/sorting
- `navigation.js`: tab switching
- `location.js`: Region / Taluka / Locality UI and persistence

### `js/services/`

- `api.js`: JSON/API fetch utilities
- future TomTom service
- future Open-Meteo service
- future geolocation and reverse-geocoding service

External API logic should not be embedded directly inside UI render modules.

### `js/ui/`

One module per visible screen:

- `situation.js`
- `alerts.js`
- `incidents.js`
- `journey.js`
- `official.js`
- `emergency.js`
- `events.js`
- `render-all.js`

UI modules should render from state and call services for actions.

### `js/utils/`

Formatting, escaping, time, and shared pure helpers.

## 5. Intelligence pipeline architecture

### Decision Intelligence

Located mainly under:

- `scripts/intelligence/`
- `scripts/run-intelligence-core.js`

Core stages include:

- collection
- normalization
- classification
- deduplication
- correlation
- confidence
- impact
- lifecycle
- geography
- personal relevance
- situation generation

### Environmental Intelligence

Located mainly under:

- `scripts/environment/`
- `scripts/build-environmental-intelligence.js`

Responsibilities:

- weather intelligence
- river intelligence
- seasonal intelligence
- critical infrastructure
- geographic impact
- citizen-facing environmental story

### Journey Intelligence

Located mainly under:

- `scripts/journey/`
- `scripts/build-journey-intelligence.js`

Current implementation is largely configured/generated and must be extended for real routing.

Target routing architecture:

```text
Browser current location / typed places
        ↓
TomTom Search and Reverse Geocoding
        ↓
TomTom Routing with alternatives and traffic
        ↓
Route geometry
        ↓
Overlay active alerts/incidents/weather/river influence zones
        ↓
Per-route penalties
        ↓
Journey Suitability Index
        ↓
Best route and explanation
```

## 6. Source trust architecture

Trust order:

```text
A+  Emergency services / disaster management
A   Official government department
B   Trusted media / verified news
C   Supporting verified signal
D   Unverified / ignored until corroborated
```

Rules:

- official confirmation outranks media
- media can create Developing status
- media cannot create confirmed emergency without corroboration
- source conflict must be explicit
- stale sources reduce confidence
- duplicate reports increase evidence, not event count

## 7. Data contracts

Important generated files:

- `data/alerts.json`
- `data/incidents.json`
- `data/intelligence.json`
- `data/environmental-context.json`
- `data/journey-intelligence.json`
- `data/live-intelligence.json`
- `data/build-status.json`
- `data/source-health.json`

Each active event should eventually include:

```json
{
  "id": "stable-id",
  "title": "Human-readable title",
  "summary": "Concise summary",
  "category": "category",
  "severity": "emergency|warning|watch|advisory",
  "sourceTrust": "A+|A|B|C|D",
  "confidenceScore": 0,
  "publishedAt": "ISO timestamp",
  "lastVerifiedAt": "ISO timestamp",
  "expiresAt": "ISO timestamp",
  "lifecycle": "developing|active|monitoring|resolved|expired",
  "talukas": [],
  "localities": [],
  "recommendedAction": "Actionable guidance",
  "sources": []
}
```

## 8. Freshness model

Do not use one generic “Updated” time for everything.

Required timestamps:

- `sourceCheckedAt`
- `publishedAt`
- `lastVerifiedAt`
- `intelligenceGeneratedAt`
- `expiresAt`

Workflow execution time is not the same as event freshness.

The UI must clearly show stale or unavailable data.

## 9. Local persistence

Use `localStorage` only for non-sensitive user preferences:

- selected Region / Taluka / Locality
- last-visit timestamp
- recent journey searches
- safety-checklist state

Do not store precise location history by default.

## 10. Deployment

Target:

- GitHub Pages
- `main` branch
- `/root`

Primary workflows:

- Update All Intelligence
- Validate Data
- Build Status
- Pages Deployment

Scheduled workflows may run late. The app must show actual source freshness, not promise exact real-time updates.

## 11. Security constraints

- never commit unrestricted API keys
- browser-exposed keys must be product-restricted
- do not trust raw HTML from external feeds
- sanitize all rendered external text
- validate URLs before rendering links
- ignore unverified social media for emergency confirmation
- do not claim emergency certainty when evidence is incomplete
