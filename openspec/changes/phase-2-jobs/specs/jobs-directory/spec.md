# Specification: Jobs Directory (`/jobs`)

## Description

The `/jobs` page provides a public, searchable, and filterable index of all active job openings across approved Latin American startups.

## Requirements

### R1: Data Retrieval
- The server SHALL fetch all jobs with `status = 'active'` belonging to startups with `status = 'approved'`.
- The returned data MUST include job details (`id`, `title`, `area`, `location`, `modality`, `salary_range`, `apply_url`) and parent startup metadata (`name`, `slug`, `logo_url`, `country`, `city`).

### R2: SEO & Metadata
- The `/jobs` route SHALL export standard `metadata` including:
  - `title`: "Empleos en startups de Latinoamérica | Col/Labs"
  - `description`: "Todas las vacantes abiertas en startups de LatAm: ingeniería, producto, datos, comercial y operaciones."
  - `alternates.canonical`: canonical URL matching the domain base.
  - `openGraph`: title, description, url, siteName, type `website`, locale `es_CO`.

### R3: Presentation
- Each job item SHALL render:
  - Job title with clear visual hierarchy.
  - Startup name linking to the startup's profile at `/startups/[slug]`.
  - Tags or indicators for area, modality (`remoto`, `híbrido`, `presencial`), location, and salary range if present.
  - Direct "Postular" / "Apply" button or link pointing to `apply_url` with `rel="noopener noreferrer"` and `target="_blank"`.
- The page header SHALL display the total number of open vacancies.

## Scenarios

### Scenario 1: Visitor browses jobs directory
- **Given** approved startups have active vacancies in the database
- **When** a visitor navigates to `/jobs`
- **Then** the page displays the list of vacancies with startup names, modalities, and locations
- **And** the count of open positions is clearly visible in the header.

### Scenario 2: Visitor navigates to startup from job row
- **Given** a job row displayed on `/jobs`
- **When** the visitor clicks the startup's name
- **Then** the browser navigates to `/startups/[slug]`.

### Scenario 3: Visitor applies to a role
- **Given** a job row with an external application URL
- **When** the visitor clicks "Postular"
- **Then** the application URL opens in a new browser tab with safe security attributes.
