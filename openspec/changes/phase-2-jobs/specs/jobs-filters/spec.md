# Specification: Jobs Filtering & Search

## Description

The `/jobs` page supports real-time filtering and search through URL search parameters as the single source of truth.

## Requirements

### R1: Search & Filter Fields
- The filter system SHALL support:
  - `q`: free-text search matching job title, startup name, area, location, or city (case-insensitive, trimmed).
  - `country`: single country filter code (`CO`, `BR`, `CL`, `AR`, `MX` or all).
  - `modality`: modality filter (`remote`, `hybrid`, `onsite` or all).

### R2: URL State Synchronization
- The URL query string MUST be the single source of truth for active filter criteria.
- Text search input MUST be debounced (~250ms) before updating the URL.
- When all filters are cleared, extraneous search parameters MUST be removed from the URL.

### R3: Empty & Loading States
- When no jobs match the active criteria, the page MUST display an empty state encouraging the user to reset filters.
- A "Limpiar filtros" action MUST be provided to reset all filters to their default values.

## Scenarios

### Scenario 1: Filtering by keyword
- **Given** active jobs from diverse areas
- **When** the visitor types "Frontend" into the search bar
- **Then** only jobs containing "Frontend" in title, area, or description remain visible
- **And** the URL updates with `?q=Frontend`.

### Scenario 2: Filtering by modality
- **Given** the visitor is browsing `/jobs`
- **When** the visitor selects "Remoto"
- **Then** only remote jobs are displayed
- **And** the URL updates with `?modality=remote`.

### Scenario 3: Combining search and filters with no match
- **Given** no jobs match a specific combination
- **When** the user applies those filters
- **Then** a friendly empty state is displayed
- **And** clicking "Limpiar filtros" resets the criteria and restores the full job listing.
