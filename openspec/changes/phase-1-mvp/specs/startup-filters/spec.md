# Startup Filters Specification

## Purpose

Define the discovery filters that let visitors narrow the public directory by industry, country, city, stage, modality, and free-text search.

## Requirements

### Requirement: Industry filter

The system MUST allow visitors to filter the directory by one or more industry values.

#### Scenario: Visitor selects an industry

- GIVEN approved startups exist in `fintech` and `healthcare`
- WHEN the visitor selects `fintech`
- THEN only `fintech` startups remain visible
- AND the count updates to reflect the filtered set

### Requirement: Country filter

The system MUST allow visitors to filter the directory by country.

#### Scenario: Visitor selects Colombia

- GIVEN approved startups exist in Colombia and Mexico
- WHEN the visitor selects `Colombia`
- THEN only Colombian startups remain visible
- AND the count updates accordingly

### Requirement: Coming-soon countries are disabled

The system MUST display countries other than Colombia as disabled with a "Próximamente" tooltip and count zero.

#### Scenario: Visitor hovers over Brazil

- GIVEN the country filter includes `Brazil`, `Chile`, `Argentina`, and `Mexico`
- WHEN the visitor interacts with the Brazil option
- THEN the option is not selectable
- AND a tooltip reading "Próximamente" is shown
- AND the count badge reads `0`

### Requirement: City filter depends on country

The system MUST allow visitors to filter by city when a supported country is selected.

#### Scenario: Visitor selects Colombia then a city

- GIVEN Colombia is selected and approved startups exist in `Bogotá` and `Medellín`
- WHEN the visitor selects `Bogotá`
- THEN only Bogotá startups remain visible
- AND the count updates accordingly

#### Scenario: Visitor clears country selection

- GIVEN a country and city are selected
- WHEN the visitor clears the country filter
- THEN the city filter is also cleared
- AND the directory returns to the unfiltered country view

### Requirement: Stage filter

The system MUST allow visitors to filter the directory by startup stage.

#### Scenario: Visitor selects a stage

- GIVEN approved startups exist at `seed` and `series-a`
- WHEN the visitor selects `seed`
- THEN only seed-stage startups remain visible

### Requirement: Modality filter

The system MUST allow visitors to filter the directory by work modality.

#### Scenario: Visitor selects a modality

- GIVEN approved startups exist with modalities `remote` and `hybrid`
- WHEN the visitor selects `remote`
- THEN only remote startups remain visible

### Requirement: Debounced free-text search

The system MUST filter the directory by free-text search using a debounce of approximately 250 ms.

#### Scenario: Visitor types a search term

- GIVEN approved startups include `Acme Rockets` and `Beta Labs`
- WHEN the visitor types `acme` in the search field
- THEN after approximately 250 ms only `Acme Rockets` remains visible
- AND no filtering occurs between each keystroke

#### Scenario: Visitor clears the search field

- GIVEN a search term is active and filters have narrowed the list
- WHEN the visitor clears the search field
- THEN the directory returns to the state defined by the remaining filters

### Requirement: Pagination reset on filter change

The system MUST reset the active page to `1` whenever any filter or search value changes.

#### Scenario: Visitor changes a filter on page 3

- GIVEN the visitor is on page 3 of the directory
- WHEN the visitor selects a different industry
- THEN the directory jumps to page 1
- AND the pagination control reflects page 1
