# PreK Literacy Program - Indianapolis Public Library

A Google Apps Script-based assessment tracking system for the Handwriting Without Tears PreK literacy program. Designed for deployment across 250+ Indianapolis Public Library sites.

## Overview

This system helps teachers and tutors track student progress in letter recognition and formation across two programs:

- **Pre-K**: Tracks Form, Name, and Sound mastery for each letter A-Z
- **Pre-School**: Tracks Letter Sound recognition for each letter A-Z

## Features

### Unified Portal
Access all features from a single landing page:
- **Teacher Portal** - Full assessment and progress tracking
- **Tutor Portal** - Streamlined session-based assessment entry
- **Executive Dashboard** - Program-wide analytics and reporting

### Setup Wizard
Quickly configure new library sites with:
- Site information and branding
- Program selection (Pre-K, Pre-School, or both)
- Student groups and roster
- Staff assignments (teachers and tutors)
- Schedule configuration
- Instructional sequence customization

### Assessment Tracking
- Record Y (mastered) / N (not yet) for each skill
- Track progress by instructional sequence sets
- Visual progress indicators with color coding
- Support for both individual and group assessments

### Reporting
- **Skill Summary Page** - In-progress and cumulative percentages per student
- **Pacing Sheet** - Group progress with Form%, Name%, Sound%, and Overall%
- **Parent Reports** - Visual progress reports with encouraging messages
- **CSV Export** - Download data for external analysis

### Executive Dashboard
- Program enrollment statistics
- Mastery distribution charts
- Skills progress visualization
- Group comparison analytics

## Sheet Structure

The system creates and manages these sheets:

| Sheet | Purpose |
|-------|---------|
| Roster | Student names, groups, and program assignments |
| Pre-K | Assessment data: A-Form, A-Name, A-Sound through Z |
| Pre-School | Assessment data: Letter Sound A through Z |
| Skill Summary Page | Calculated progress percentages |
| Pacing | Group progress tracking |
| Instructional Sequence | Letter teaching order (customizable) |
| Tutors | Staff roster |
| Tutor Log | Session history |
| Site Config | Site information and settings |

## Installation

1. Create a new Google Spreadsheet
2. Open **Extensions > Apps Script**
3. Copy all `.gs` and `.html` files into the Apps Script project
4. Save and refresh the spreadsheet
5. Use **PreK Program > Site Setup Wizard** to configure your site
6. Deploy as a web app:
   - Click **Deploy > New deployment**
   - Select **Web app**
   - Set "Execute as" to your account
   - Set "Who has access" appropriately
   - Click **Deploy**

## URL Parameters

Access different interfaces via URL parameters:

| URL | Interface |
|-----|-----------|
| `[base-url]` | Portal (landing page) |
| `[base-url]?page=teacher` | Teacher Portal |
| `[base-url]?page=tutor` | Tutor Portal |
| `[base-url]?page=dashboard` | Executive Dashboard |
| `[base-url]?page=setup` | Setup Wizard |

## Menu Options

The **PreK Program** menu provides:

- **Site Setup Wizard** - Configure a new site
- **Update Summary Page** - Recalculate all student summaries
- **Update Pacing Progress** - Refresh group progress data
- **Open Executive Dashboard** - View analytics
- **Export Progress Report (CSV)** - Download data
- **Generate Parent Reports** - Create visual or document reports
- **Demo & Testing** - Generate test data or clear all data
- **Quick Fixes** - Utility functions for troubleshooting

## Instructional Sequence

Default letter teaching order (Handwriting Without Tears):

| Set | Letters | Description |
|-----|---------|-------------|
| Set 1 | A, M, S, T | Easy capitals - straight lines |
| Set 2 | C, O, G, Q | Curved letters |
| Set 3 | H, I, E, L | Lines and curves |
| Set 4 | F, D, P, B | Trickier curves |
| Set 5 | R, N, K, J | Diagonal lines |
| Set 6 | U, V, W, X | More diagonals |
| Set 7 | Y, Z | Final letters |

Customize by editing the **Instructional Sequence** sheet directly.

## Branding

Indianapolis Public Library branding:
- **Navy**: #1E3A5F
- **Gold**: #E8B923

## Files

| File | Description |
|------|-------------|
| `MainCode.gs` | Core backend logic and all server-side functions |
| `Portal.html` | Unified landing page |
| `Index.html` | Teacher Portal interface |
| `TutorForm.html` | Tutor Portal interface |
| `Dashboard.html` | Executive Dashboard with charts |
| `ParentReport.html` | Visual parent report template |
| `SetupWizard.html` | Site configuration wizard |

## Support

For questions or issues:
- Contact your site coordinator
- Report issues at the project repository

## License

Developed for Indianapolis Public Library PreK Literacy Program.

---

*Built with Google Apps Script and Google Sheets*
