# PROJECT_CONTEXT.md

# CITY EMERGENCY ALERTS V6.1
## Project Handover Context for Codex / AI Coding Agent

## 1. Project purpose

CITY EMERGENCY ALERTS is a Progressive Web App for Pune City, PCMC, Pune District, nearby highways, ghats, rivers, and dams.

The app should help a citizen answer six questions quickly:

1. What happened?
2. Where did it happen?
3. How serious is it?
4. Does it affect me?
5. What should I do?
6. Is my journey safe?

The app is not a replacement for emergency services. It must present trustworthy information, prioritize official sources, remain calm and actionable, and work well on mobile and desktop.

## 2. Approved product requirements

### Frozen tabs

- Situation
- Alerts
- Incidents
- Journey
- Official
- Emergency

No new tabs should be added without explicit product approval.

### Situation tab

Required order:

1. Weather
2. Snapshot
3. Since Your Last Visit
4. Updated timestamp

Do not duplicate full Alert or Incident lists on Situation.

### Location hierarchy

User-facing hierarchy:

- Region
- Taluka
- Locality

Pune City must be available as a Taluka.

The current locality mapping is incomplete and must be corrected. Missing or wrongly placed examples include:

- Kalas
- Vishrantwadi
- Sadashiv Peth
- Deccan / Deccan Gymkhana
- other Pune City localities

Aliases must support common spellings such as:

- Hinjawadi / Hinjewadi
- Sinhgad / Sinhagad
- Deccan / Deccan Gymkhana

### Alerts and Incidents

Each event should contain:

- title
- summary
- category
- severity
- affected area
- published time
- last verified time
- source
- source trust
- confidence
- recommended action
- lifecycle status
- source link

Alerts and Incidents must use fresh data and expire stale events automatically.

### Journey Assistance

Required user experience:

- Use My Current Location
- Start location autocomplete
- Destination autocomplete
- Departure choice
- multiple route alternatives
- route-specific risks
- traffic-aware travel time
- route-specific Journey Suitability Index
- best-route recommendation
- explanation of why the route is recommended
- handoff to map navigation

Blocked route must score 0.

Journey suitability must consider:

- traffic
- closures
- accidents
- flooding/waterlogging
- weather
- river/dam impact
- alerts
- incidents
- source confidence
- freshness

### Official tab

Tier 1 official sources must appear before Tier 2 trusted media.

Official groups should include:

- Weather and disaster
- Pune District administration
- PMC
- PCMC
- Pune Police / traffic police
- NHAI / highway authorities
- Pune Metro
- River and dam authorities
- Maharashtra Water Resources Department
- Central Water Commission / FloodWatch
- NDMA SACHET
- relevant dam and reservoir information

### Emergency tab

Priority order:

1. Emergency Dial
2. Nearby Emergency Services
3. Share My Location
4. Safety Resources

Safety Resources must be interactive checklists with persistent checkbox state, not plain paragraphs.

Emergency Mode is not part of V6.1 and remains postponed.

## 3. Source trust policy

### Tier 1

Official government, emergency services, police, disaster management, weather, civic, transport, water, and dam authorities.

Use as confirmation sources.

### Tier 2

Trusted news and verified media.

May create a Developing Situation, but must not create or override a confirmed emergency without corroboration.

### Tier 3

Supporting verified signals only.

Unverified social media must not create emergency alerts.

## 4. Current release status

Version: 6.1

Current state:

- repository architecture exists
- modular frontend exists
- intelligence pipeline exists
- GitHub Actions run successfully
- current UI deploys through GitHub Pages
- generated sample intelligence exists

Functional maturity is incomplete.

The current release must not be treated as fully live or production-complete until the acceptance tests in `ACCEPTANCE_TESTS.md` pass.

## 5. Current known defects

- locality hierarchy is incomplete and partly incorrect
- Snapshot remains unchanged because live collectors are not implemented
- Since Your Last Visit is not clickable
- freshness timestamps do not represent true source freshness
- Alerts remain stale/sample-driven
- Incidents remain stale/sample-driven
- Journey Assistance does not perform real routing
- current location is missing
- location autocomplete is missing
- route alternatives and route comparison are incomplete
- Journey Suitability Index is not route-specific enough
- river and dam official sources are missing from the Official tab
- safety checklists were replaced by paragraphs

## 6. Planned external services

### TomTom

Use for:

- search and autocomplete
- current-location reverse geocoding
- routing
- route alternatives
- traffic-aware duration
- traffic incidents

A TomTom API key is required.

Never commit the unrestricted key to the repository.

For GitHub Pages, any browser key may be visible. Restrict the key to required products and monitor usage. A server-side proxy is preferable for stronger security.

### Open-Meteo

Use for:

- current weather
- rain
- precipitation probability
- wind
- gusts
- visibility
- forecast

Free non-commercial usage requires no API key.

Attribution must be included.

## 7. Release rule

A feature is complete only when the user-facing behavior works and its acceptance test passes.

The following do not prove readiness by themselves:

- workflow success
- file generation
- JSON creation
- build status showing healthy
- UI element existing

Release outcomes must be:

- FAIL
- CONDITIONAL PASS
- PASS

Do not call a release production-ready until every mandatory acceptance test passes.
