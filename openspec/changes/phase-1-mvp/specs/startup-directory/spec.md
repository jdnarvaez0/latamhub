# Startup Directory Specification

## Purpose

Define the public discovery list at `/` that surfaces approved startups without requiring authentication.

## Requirements

### Requirement: Approved-only public list

The system MUST display only startups whose `status` equals `approved` on the public directory.

#### Scenario: Visitor opens the directory

- GIVEN the database contains approved and pending startups
- WHEN a visitor navigates to `/`
- THEN the directory lists only approved startups
- AND pending or rejected startups are not visible

### Requirement: Server-rendered initial data

The system MUST fetch the approved startup list on the server and render the initial page markup.

#### Scenario: First request to the directory

- GIVEN the visitor has no session state
- WHEN the server handles `GET /`
- THEN the response HTML contains the rendered startup list
- AND no client-side data fetch is required for the initial view

### Requirement: Interactive directory client

The system MUST hydrate the directory with a client component that applies filters, search, and pagination without a full page reload.

#### Scenario: Visitor changes a filter

- GIVEN the server-rendered directory is visible
- WHEN the visitor selects a filter value
- THEN the list updates in place
- AND the URL reflects the selected filter state

### Requirement: Result count

The system MUST display the total number of approved startups matching the active filters.

#### Scenario: Filters narrow the list

- GIVEN 20 approved startups exist and 5 match the active filters
- WHEN the directory renders the filtered view
- THEN the count reads "5 startups"
- AND the count updates when filters change

### Requirement: No authentication required

The system MUST allow unauthenticated visitors to view the directory and startup details.

#### Scenario: Anonymous visitor browses

- GIVEN the visitor is not logged in
- WHEN they open `/`
- THEN the directory loads without redirecting to a login page
- AND all public startups are accessible
