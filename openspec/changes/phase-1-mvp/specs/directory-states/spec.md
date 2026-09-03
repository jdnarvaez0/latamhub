# Directory States Specification

## Purpose

Define the empty, error, and incomplete-data states of the public directory so visitors always receive clear feedback.

## Requirements

### Requirement: Empty state

The system MUST display a distinct empty state when no approved startups match the active filters or search.

#### Scenario: Filters produce no matches

- GIVEN approved startups exist but none match the selected filters
- WHEN the directory renders the filtered view
- THEN an empty-state message explains that no startups were found
- AND the visitor sees an option to clear filters

#### Scenario: Directory has no approved startups

- GIVEN the database contains zero approved startups
- WHEN the visitor opens `/`
- THEN the empty state is shown
- AND the directory does not display pagination

### Requirement: Supabase error state

The system MUST display a distinct error state when the startup query fails.

#### Scenario: Database query fails

- GIVEN the Supabase query returns an error
- WHEN the directory attempts to load
- THEN an error-state message is displayed
- AND the error state is visually different from the empty state
- AND a retry action is offered

### Requirement: Incomplete-data state

The system MUST display each startup card even when optional fields are missing, without breaking layout or rendering placeholder data as real.

#### Scenario: Startup lacks optional fields

- GIVEN an approved startup is missing `logo`, `website`, and `city`
- WHEN the directory renders the startup card
- THEN the card displays available fields
- AND missing fields are omitted or shown as "Not provided"
- AND the card remains clickable and visually consistent

### Requirement: Distinct visual treatment

The system MUST use visually distinct icons, copy, and colors for empty, error, and incomplete-data states.

#### Scenario: Visitor encounters each state

- GIVEN the directory can render empty, error, and incomplete-data states
- WHEN each state is triggered
- THEN the visitor can distinguish the three states at a glance
- AND no state uses the same icon or headline as another
