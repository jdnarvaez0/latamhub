# Startup Detail Specification

## Purpose

Define the public per-startup page at `/startups/[slug]` and its SEO and error behavior.

## Requirements

### Requirement: Approved startup detail page

The system MUST render a dedicated page for each approved startup using its unique slug.

#### Scenario: Visitor opens a valid startup slug

- GIVEN an approved startup exists with slug `acme-corp`
- WHEN a visitor navigates to `/startups/acme-corp`
- THEN the page displays the startup name, description, industry, stage, modality, country, city, and links
- AND the page returns HTTP 200

### Requirement: Unknown or unapproved slug returns 404

The system MUST respond with a 404 page and `noindex` metadata for slugs that do not exist or are not approved.

#### Scenario: Visitor opens an unapproved startup slug

- GIVEN a startup with slug `stealth-corp` has status `pending`
- WHEN a visitor navigates to `/startups/stealth-corp`
- THEN the response is HTTP 404
- AND the page contains `noindex` robots metadata

#### Scenario: Visitor opens a nonexistent slug

- GIVEN no startup exists with slug `missing-corp`
- WHEN a visitor navigates to `/startups/missing-corp`
- THEN the response is HTTP 404
- AND the page contains `noindex` robots metadata

### Requirement: SEO metadata

The system MUST generate `title`, `description`, `canonical`, and `openGraph` metadata for each approved startup detail page.

#### Scenario: Search engine requests the page

- GIVEN an approved startup with name `Acme` and description `Builds rockets`
- WHEN `generateMetadata` runs for `/startups/acme-corp`
- THEN the title contains `Acme`
- AND the description equals `Builds rockets`
- AND the canonical URL points to `/startups/acme-corp`
- AND OpenGraph properties include title and description
