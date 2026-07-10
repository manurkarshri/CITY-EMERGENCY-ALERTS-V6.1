# PROJECT_CONTEXT.md

# CITY EMERGENCY ALERTS V6.1
## Production Handover Context
Prepared for: Codex / AI Development Assistant

---

# 1. Project Purpose

CITY EMERGENCY ALERTS is a Progressive Web App (PWA) designed to provide a single emergency intelligence platform for Pune District (Pune City, PCMC, and surrounding talukas).

The application aggregates emergency information from multiple trusted sources and assists citizens in making safe decisions.

Primary goals:

- Show current emergency situation.
- Aggregate official alerts.
- Aggregate important incidents.
- Provide Journey Assistance.
- Show weather and environmental intelligence.
- Help citizens during emergencies.
- Work on desktop and mobile.
- Deploy entirely through GitHub Pages.

The app is NOT intended to replace emergency services.

---

# 2. Target Users

Primary:

- Citizens
- Families
- Daily commuters
- Travelers

Secondary:

- Disaster volunteers
- Community groups
- Local authorities

---

# 3. Project Scope

Current geographical scope:

- Pune City
- PCMC
- Pune District
- Nearby highways
- Ghats
- Major dams affecting Pune

Future scope:

- Maharashtra
- India

---

# 4. Current Architecture

Frontend

- HTML5
- Vanilla JavaScript
- Modular JS architecture
- Modular CSS
- Progressive Web App

Backend

None.

Static deployment through GitHub Pages.

Automation

GitHub Actions generate intelligence JSON files.

Data Flow

Official Sources
↓

Trusted Sources

↓

Decision Intelligence

↓

Environmental Intelligence

↓

Journey Intelligence

↓

Generated JSON

↓

Frontend Rendering

---

# 5. Current Tabs

Situation

Alerts

Incidents

Journey

Official

Emergency

---

# 6. Implemented Intelligence

Decision Intelligence

Environmental Intelligence

Weather Intelligence

River Intelligence

Journey Intelligence

Source Trust Model

Source Registry

Build Status

Validation

GitHub Workflows

PWA

---

# 7. Current Repository Structure

.github/

assets/

config/

css/

data/

docs/

js/

scripts/

tests/

index.html

manifest.json

sw.js

package.json

README.md

VERSION

---

# 8. GitHub Workflows

Update All Intelligence

Validate Data

Build Status

GitHub Pages Deploy

---

# 9. Completed Features

✓ PWA

✓ Offline support

✓ Responsive UI

✓ Situation page

✓ Alerts page

✓ Incidents page

✓ Journey UI

✓ Official Sources page

✓ Emergency page

✓ Weather intelligence generation

✓ River intelligence generation

✓ Journey intelligence generation

✓ Build status generation

✓ Source trust hierarchy

✓ GitHub Actions automation

---

# 10. IMPORTANT Technical Decisions

Official sources always have highest trust.

Trusted media may create DEVELOPING situations.

Trusted media must NOT override official emergency information.

Unverified social media must NOT create emergency alerts.

Journey Assistance should always consider:

- Weather

- Traffic

- Flooding

- Road closures

- River intelligence

- Alerts

- Incidents

Journey Suitability Index (JSI)

Range

0-100

Blocked route

JSI = 0

---

# 11. Current Known Limitations

## 1.

Region / Taluka / Locality mapping is incomplete.

Needs complete Pune administrative hierarchy.

Missing localities include (examples):

- Kalas

- Vishrantwadi

- Sadashiv Peth

- Deccan

etc.

---

## 2.

Snapshot is not regenerated from fresh data.

Static/generated output still appears.

---

## 3.

Since Your Last Visit

Currently not clickable.

Should deep-link to corresponding alert/incident.

---

## 4.

Update timestamps

Currently represent workflow generation time rather than actual source freshness.

Need:

Source checked

Event published

Event verified

Intelligence generated

---

## 5.

Alerts

Still mostly generated/sample data.

Needs live collection.

---

## 6.

Incidents

Same issue.

Needs live collection.

---

## 7.

Journey Assistance

Current implementation is placeholder.

Needs:

Current Location

Autocomplete

Alternative routes

Traffic

Route comparison

Real JSI calculation

---

## 8.

Official page

River/Dam sources need restoration.

Missing:

Water Resources

Dam releases

FloodWatch

etc.

---

## 9.

Safety Resources

Should return to interactive checklist.

Checkbox state stored locally.

---

# 12. Planned External Services

## TomTom

Purpose

Location search

Autocomplete

Routing

Traffic

Alternative routes

Journey calculations

Required

API Key

---

## Open-Meteo

Purpose

Weather

Rain

Wind

Forecast

Current conditions

No API key required for free tier.

---

# 13. Desired Journey Flow

User selects:

Current Location

↓

Destination

↓

TomTom Route API

↓

Alternative Routes

↓

Overlay

Traffic

Weather

Alerts

Incidents

Flooding

River Intelligence

↓

Calculate JSI

↓

Recommend Best Route

↓

Open in Google Maps

---

# 14. Live Intelligence Goals

Collect information from:

Tier 1

Official

- IMD

- Pune Police

- PMC

- PCMC

- District Administration

- NHAI

- Metro

- Disaster Management

Tier 2

Trusted Media

- Sakal

- Lokmat

- Loksatta

- Maharashtra Times

- TV9 Marathi

- ABP Majha

- Zee 24 Taas

etc.

---

# 15. Release Philosophy

Previous versions incorrectly treated successful workflows as production readiness.

Going forward:

A feature is COMPLETE only when:

User-facing functionality works.

Generated data is current.

Acceptance tests pass.

Not merely because the code exists.

---

# 16. Immediate Development Priority

Highest priority:

1.

Complete Live Intelligence Integration.

2.

Replace generated/sample Alerts.

3.

Replace generated/sample Incidents.

4.

Implement TomTom Journey Engine.

5.

Complete Pune locality database.

6.

Improve Snapshot generation.

7.

Restore Safety Checklist.

---

# 17. Current Release Status

Version

6.1

Status

Architecture complete.

Engineering pipeline complete.

Production deployment successful.

Functional maturity incomplete.

Next target:

Production-ready user experience with live intelligence.

---

End of handover.
