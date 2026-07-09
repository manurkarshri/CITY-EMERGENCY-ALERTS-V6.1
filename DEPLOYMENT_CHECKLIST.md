# CITY EMERGENCY ALERTS V6.1 — Deployment Checklist

## New repository setup

1. Create a new GitHub repository, for example:
   `CITY-EMERGENCY-ALERTS-V6.1`

2. Upload all files from this package repository root.

3. Go to:
   Settings → Pages

4. Select:
   Source: Deploy from branch  
   Branch: main  
   Folder: /root

5. Wait for GitHub Pages deployment.

## Actions

Run these workflows:

1. V6.1 Update All Intelligence
2. V6.1 Validate Data
3. V6.1 Build Status

## User test checklist

- Situation tab loads.
- Weather card shows Pune City/PCMC/Mulshi intelligence.
- Snapshot loads.
- Alerts tab shows warning cards.
- Incidents tab shows traffic/incident cards.
- Journey tab accepts start/destination and creates an assessment.
- Official tab shows official and trusted sources.
- Emergency tab shows emergency dial and nearby services.
- App works on mobile.
- App works after hard refresh.
