# ACCEPTANCE_TESTS.md

# CITY EMERGENCY ALERTS V6.1
## Mandatory Functional Acceptance Tests

A release cannot be marked PASS until every mandatory test below passes.

Use these statuses:

- PASS
- FAIL
- CONDITIONAL PASS
- NOT TESTED

## 1. App shell and navigation

| ID | Test | Expected result | Mandatory |
|---|---|---|---|
| APP-01 | Open live URL on desktop | App loads without raw Markdown or blank screen | Yes |
| APP-02 | Open live URL on mobile | Responsive layout loads correctly | Yes |
| APP-03 | Switch all six tabs | Correct tab appears; no JavaScript error | Yes |
| APP-04 | Hard refresh | App still loads and modules resolve | Yes |
| APP-05 | Offline revisit | Previously cached app shell opens with clear offline state | Yes |
| APP-06 | Browser console | No uncaught errors affecting functionality | Yes |

## 2. Region, Taluka and Locality

| ID | Test | Expected result | Mandatory |
|---|---|---|---|
| LOC-01 | Open location selector | Selector is collapsed by default and expands on Change | Yes |
| LOC-02 | Select Pune City Taluka | Pune City appears as a valid Taluka | Yes |
| LOC-03 | Search/select Kalas | Kalas is present under the correct Pune City grouping | Yes |
| LOC-04 | Search/select Vishrantwadi | Vishrantwadi is present under the correct grouping | Yes |
| LOC-05 | Search/select Sadashiv Peth | Sadashiv Peth is present under Pune City | Yes |
| LOC-06 | Search/select Deccan | Deccan / Deccan Gymkhana alias resolves correctly | Yes |
| LOC-07 | Change Taluka | Locality list changes correctly | Yes |
| LOC-08 | Reload app | Selected location persists | Yes |
| LOC-09 | Alias spellings | Hinjawadi/Hinjewadi and Sinhgad/Sinhagad resolve consistently | Yes |

## 3. Situation tab

| ID | Test | Expected result | Mandatory |
|---|---|---|---|
| SIT-01 | Verify order | Weather → Snapshot → Since Your Last Visit → Updated | Yes |
| SIT-02 | Change active event fixture | Snapshot content changes after rebuild | Yes |
| SIT-03 | No active events | Snapshot clearly states no significant active event | Yes |
| SIT-04 | Stale data | UI clearly marks stale or unavailable data | Yes |
| SIT-05 | Explain Snapshot | Explanation lists key evidence/factors | Yes |
| SIT-06 | Selected locality | Snapshot reflects selected area relevance | Yes |

## 4. Since Your Last Visit

| ID | Test | Expected result | Mandatory |
|---|---|---|---|
| VIS-01 | First visit | Baseline timestamp is stored | Yes |
| VIS-02 | New event after baseline | New event appears in Since Your Last Visit | Yes |
| VIS-03 | Updated event after baseline | Updated event appears once | Yes |
| VIS-04 | Click item | Opens related Alert/Incident card or source | Yes |
| VIS-05 | No changes | Displays “No major changes” | Yes |
| VIS-06 | Reload app | Last-visit logic remains correct | Yes |

## 5. Freshness and lifecycle

| ID | Test | Expected result | Mandatory |
|---|---|---|---|
| FRS-01 | Source poll succeeds | `sourceCheckedAt` updates | Yes |
| FRS-02 | No new event | Build time may update but event published time does not | Yes |
| FRS-03 | Event expires | Event is removed from active Alerts/Incidents | Yes |
| FRS-04 | Source fails | UI shows last successful check and failure state | Yes |
| FRS-05 | Old event | Old event is not presented as current | Yes |
| FRS-06 | Timestamp display | Published, verified, and intelligence times are distinguishable | Yes |

## 6. Alerts

| ID | Test | Expected result | Mandatory |
|---|---|---|---|
| ALT-01 | Current official alert | Appears with official trust level | Yes |
| ALT-02 | Trusted-media-only report | Appears as Developing / Awaiting official confirmation | Yes |
| ALT-03 | Duplicate reports | Combined into one event with multiple sources | Yes |
| ALT-04 | Severity sorting | Highest severity appears first | Yes |
| ALT-05 | Locality filtering | Relevant alert appears for selected locality | Yes |
| ALT-06 | No locality match | Broader district fallback is clearly labelled | Yes |
| ALT-07 | Alert source link | Opens the correct source | Yes |
| ALT-08 | Header size | Alert heading area is compact and appropriate | Yes |
| ALT-09 | Stale alert | Automatically expires or moves out of active list | Yes |

## 7. Incidents

| ID | Test | Expected result | Mandatory |
|---|---|---|---|
| INC-01 | Current incident | Appears with correct source and area | Yes |
| INC-02 | Road accident | Classified as Incident, not Alert unless official warning exists | Yes |
| INC-03 | Human-caused event | Included when supported by official/trusted information | Yes |
| INC-04 | Duplicate news reports | Merged into one incident | Yes |
| INC-05 | Resolved incident | Moves to resolved/expired state | Yes |
| INC-06 | Source link | Opens correct source | Yes |
| INC-07 | Locality filter | Relevant incidents are shown correctly | Yes |

## 8. Journey Assistance

| ID | Test | Expected result | Mandatory |
|---|---|---|---|
| JRN-01 | Use My Current Location | Browser asks permission and fills the start location | Yes |
| JRN-02 | Deny location | App shows a clear fallback without breaking | Yes |
| JRN-03 | Type start location | TomTom autocomplete returns Pune-area suggestions | Yes |
| JRN-04 | Type destination | TomTom autocomplete returns valid suggestions | Yes |
| JRN-05 | Analyse journey | Real route request succeeds | Yes |
| JRN-06 | Alternatives available | At least two routes shown when API returns alternatives | Yes |
| JRN-07 | Traffic duration | Route duration reflects traffic-aware time | Yes |
| JRN-08 | Route incidents | Route-specific incidents are shown | Yes |
| JRN-09 | Weather exposure | Route-specific weather risk is shown | Yes |
| JRN-10 | Flood/river exposure | Route crossing affected zones receives penalty | Yes |
| JRN-11 | Blocked route | JSI equals 0 | Yes |
| JRN-12 | Separate scoring | Every route receives its own JSI | Yes |
| JRN-13 | Best-route recommendation | Lowest-risk suitable route is recommended | Yes |
| JRN-14 | Explanation | Recommendation explains key risks and trade-offs | Yes |
| JRN-15 | Navigation handoff | Opens map navigation for selected route | Yes |
| JRN-16 | Invalid input | Clear validation message appears | Yes |
| JRN-17 | API failure | App shows honest error/fallback; no fabricated score | Yes |
| JRN-18 | Multiple test pairs | Pune City, PCMC, ghat/highway routes all tested | Yes |

Recommended journey test pairs:

- Deccan → Hinjawadi
- Kalas → Swargate
- Vishrantwadi → Kothrud
- Pune → Lonavala
- Pune → Sinhagad Road
- PCMC → Pune Railway Station

## 9. Official sources

| ID | Test | Expected result | Mandatory |
|---|---|---|---|
| OFF-01 | Official sources first | Tier 1 appears before Tier 2 | Yes |
| OFF-02 | River and dam group | Water Resources / CWC / FloodWatch / dam sources appear | Yes |
| OFF-03 | Weather/disaster group | IMD and NDMA SACHET appear | Yes |
| OFF-04 | Civic group | PMC and PCMC appear | Yes |
| OFF-05 | Transport group | NHAI and Pune Metro appear | Yes |
| OFF-06 | Broken links | No required source link is broken | Yes |
| OFF-07 | Trusted media label | Tier 2 role is clearly explained | Yes |

## 10. Emergency and safety

| ID | Test | Expected result | Mandatory |
|---|---|---|---|
| EMR-01 | 112 action | Opens phone dialer on supported device | Yes |
| EMR-02 | Police/Fire/Ambulance | Correct numbers shown | Yes |
| EMR-03 | Nearby hospital | Opens nearby map search | Yes |
| EMR-04 | Nearby police/fire | Opens correct map search | Yes |
| EMR-05 | Share location | Shares or copies current coordinates | Yes |
| EMR-06 | Safety checklists | Interactive checkboxes are shown | Yes |
| EMR-07 | Checklist persistence | Checkbox state remains after reload | Yes |
| EMR-08 | Safety sections | Flood, Fire, Lightning, Heatwave, Earthquake, Road Accident, Emergency Kit, Family Check included | Yes |

## 11. Source collection and trust

| ID | Test | Expected result | Mandatory |
|---|---|---|---|
| SRC-01 | Official collector | At least one real official source produces current data | Yes |
| SRC-02 | Trusted-media collector | At least one real Tier 2 source produces a developing event | Yes |
| SRC-03 | Source conflict | Official source overrides conflicting media status | Yes |
| SRC-04 | Unsupported social post | Does not create confirmed event | Yes |
| SRC-05 | Source health | Success/failure and last-check time recorded | Yes |
| SRC-06 | Collector failure | Other collectors continue; workflow does not silently claim freshness | Yes |

## 12. Performance and reliability

| ID | Test | Expected result | Mandatory |
|---|---|---|---|
| PER-01 | Initial load | Usable content appears within reasonable time on mobile data | Yes |
| PER-02 | No repeated blocking fetches | UI remains responsive while data loads | Yes |
| PER-03 | Scheduled workflow | Runs and commits generated data | Yes |
| PER-04 | Schedule delay | UI shows actual source freshness, not promised schedule time | Yes |
| PER-05 | PWA update | New service-worker version updates cleanly | Yes |
| PER-06 | Accessibility | Keyboard navigation and labels work for major controls | Yes |

## 13. Release decision

### PASS

All mandatory tests pass.

### CONDITIONAL PASS

Only non-critical, documented limitations remain. No limitation may affect:

- current alerts
- current incidents
- journey safety
- emergency actions
- source truthfulness
- freshness

### FAIL

Any mandatory test involving live data, Journey Assistance, lifecycle, freshness, emergency actions, or source trust fails.
