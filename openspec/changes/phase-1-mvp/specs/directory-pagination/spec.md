# Directory Pagination Specification

## Purpose

Define numbered pagination for the public directory so visitors can browse through the approved startup list.

## Requirements

### Requirement: Fixed page size

The system MUST display exactly eight startups per page.

#### Scenario: Directory contains more than eight startups

- GIVEN 20 approved startups match the active filters
- WHEN the directory renders
- THEN page 1 shows startups 1 through 8
- AND page 2 shows startups 9 through 16
- AND page 3 shows startups 17 through 20

### Requirement: Numbered pagination controls

The system MUST render a numbered pagination control that lists available page numbers.

#### Scenario: Visitor views pagination

- GIVEN 20 approved startups match the active filters
- WHEN the directory renders
- THEN the pagination control displays page numbers 1, 2, and 3
- AND the current page is visually highlighted

### Requirement: Page navigation

The system MUST allow visitors to navigate to any available page by selecting its number.

#### Scenario: Visitor selects page 2

- GIVEN the visitor is on page 1
- WHEN they click page number 2
- THEN the directory displays the second page of results
- AND the URL reflects page 2

### Requirement: First and last page boundaries

The system MUST disable or hide navigation to pages before `1` and beyond the last page.

#### Scenario: Visitor is on the first page

- GIVEN the visitor is on page 1
- THEN the previous-page control is disabled or absent
- AND only pages `1` through `N` are selectable

#### Scenario: Visitor is on the last page

- GIVEN the last page is page 3
- WHEN the visitor is on page 3
- THEN the next-page control is disabled or absent

### Requirement: Pagination reset on filter change

The system MUST reset the active page to `1` whenever filters or search change.

#### Scenario: Visitor changes search while on page 3

- GIVEN the visitor is on page 3
- WHEN they enter a search term
- THEN the directory jumps to page 1
- AND the pagination control updates
