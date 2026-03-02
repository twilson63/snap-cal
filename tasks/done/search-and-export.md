# Search and Export Features

## Status: DONE

## Description
Add search functionality to find past entries and export capability for data portability.

## Tasks
- [x] Add search endpoint to backend API (GET /entries/search?q=term)
- [x] Add export endpoint to backend API (GET /entries/export?format=json|csv)
- [x] Update mobile app to support searching past entries
- [x] Add export button to settings screen

## Benefits
- Find past foods easily for quick re-logging
- Export data for backup or analysis
- Better user experience for long-term users

## Implementation Details
- **Backend:** Search and export endpoints already existed in `/entries` route
- **Mobile API:** Added `searchEntries()` and `exportEntries()` methods to api.ts
- **Search Screen:** Created `app/search.tsx` with full-text search UI
- **Settings:** Added export section with JSON and CSV export buttons using expo-sharing
- **Navigation:** Added search icon to header on home and history screens