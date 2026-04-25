# Requirements Document

## Introduction

A CMS-driven page builder that lets admins compose storefront pages from a library of 19 reusable section types (derived from the Rhubarbe-Sections Figma file). Replaces the current hardcoded per-page editors in `/admin/pages` with a flexible section-based builder supporting drag-and-drop reordering, bilingual content editing (EN/FR), and live preview. Also includes renaming the existing "Stories" content type to "Journal" and "News" to "Recipes" across the admin UI, API routes, database, and storefront URLs.

## Glossary

- **Page_Builder**: The admin UI at `/admin/pages/[pageName]` that allows composing a page from an ordered list of sections
- **Section**: A reusable content block with a defined type, schema, and storefront rendering component. One of 19 types from the Figma section library
- **Section_Library**: The catalogue of all available section types that an admin can add to a page
- **Section_Schema**: The typed data structure defining the editable fields for a given section type, including bilingual fields
- **Page_Record**: A database row in the `pages` table identified by `pageName`, storing an ordered array of sections as JSONB in the `content` column
- **Dynamic_Section**: A section type (Content_Journal, Content_Brief, Content_2Up) that pulls entries from the CMS at render time based on configured filters
- **Static_Section**: A section type whose content is fully defined inline by the admin (e.g. FAQ, Quote, Text)
- **Journal**: The content type formerly known as "Stories" — editorial entries with slug, title, blocks, category, status, and cover image
- **Recipe**: The content type formerly known as "News" — content entries with title, content, date, and image
- **Storefront_Renderer**: The Next.js server component that reads a Page_Record and renders each section in order using the appropriate React component
- **Section_Editor**: The admin form component for editing a single section's content fields inline within the Page_Builder
- **Migration_Script**: A database migration that renames tables, columns, or updates references from old names (stories/news) to new names (journal/recipes)
- **RequestForm**: The existing React component at `components/RequestForm` used for catering/cake inquiry forms

## Requirements

### Requirement 1: Section Data Model

**User Story:** As a developer, I want a well-defined section data model, so that sections can be stored, validated, and rendered consistently.

#### Acceptance Criteria

1. THE Section_Schema SHALL define a discriminated union type where each section variant is identified by a `type` string literal matching one of the 19 section types: `faq-simple`, `faq-grouped`, `image-carousel`, `image-2up`, `image-hero`, `image-with-icons`, `content-brief`, `content-journal`, `content-2up`, `heading-articles`, `heading-page`, `heading-content`, `quote`, `text`, `instructions`, `two-column-text`, `steps`, `image-with-text`, `contact-form`
2. THE Section_Schema SHALL include a unique `id` field (string) on every section instance for stable identity during reordering
3. WHEN a section contains user-facing text fields, THE Section_Schema SHALL represent those fields as bilingual objects with `en` and `fr` string properties
4. WHEN a section contains image references, THE Section_Schema SHALL store each image as an object with `url` (string), `alt` (bilingual object), and optional `caption` (bilingual object)
5. THE Page_Record SHALL store sections as an ordered JSON array in the existing `content` JSONB column of the `pages` table
6. FOR ALL valid Page_Record content arrays, serializing to JSON then parsing back SHALL produce an equivalent array (round-trip property)

### Requirement 2: Section Library — FAQ Sections

**User Story:** As an admin, I want FAQ section types, so that I can add frequently asked questions to any page.

#### Acceptance Criteria

1. THE Section_Editor for `faq-simple` SHALL provide fields for a bilingual title and an ordered list of question/answer pairs, each with bilingual question and bilingual answer fields
2. THE Section_Editor for `faq-simple` SHALL allow adding, removing, and reordering question/answer pairs
3. THE Storefront_Renderer for `faq-simple` SHALL render each question/answer pair as an accordion with a +/− toggle
4. THE Section_Editor for `faq-grouped` SHALL provide fields for a bilingual title and an ordered list of topic groups, each containing a bilingual group heading and an ordered list of question/answer pairs
5. THE Storefront_Renderer for `faq-grouped` SHALL render questions grouped under their topic headings with accordion toggles

### Requirement 3: Section Library — Image Sections

**User Story:** As an admin, I want image section types, so that I can showcase photography and visual content on pages.

#### Acceptance Criteria

1. THE Section_Editor for `image-carousel` SHALL provide fields for a bilingual title, bilingual description, and an ordered list of images (each with url, alt, and caption)
2. THE Storefront_Renderer for `image-carousel` SHALL render the title and description on the left with a numbered image grid on the right (two small stacked images and one large image with caption)
3. THE Section_Editor for `image-2up` SHALL provide fields for exactly two images with equal-height display
4. THE Storefront_Renderer for `image-2up` SHALL render two side-by-side images with consistent padding
5. THE Section_Editor for `image-hero` SHALL provide a single full-width image field with no text overlay fields
6. THE Storefront_Renderer for `image-hero` SHALL render the image at full viewport width
7. THE Section_Editor for `image-with-icons` SHALL provide a full-width background image field and an SVG overlay image field
8. THE Storefront_Renderer for `image-with-icons` SHALL render the background image at full width with the SVG overlay positioned on top

### Requirement 4: Section Library — Dynamic Content Sections

**User Story:** As an admin, I want dynamic content sections that pull from the CMS, so that pages automatically reflect the latest journal entries and recipes.

#### Acceptance Criteria

1. THE Section_Editor for `content-journal` SHALL provide fields for a bilingual title and a configurable maximum number of entries to display (default 3)
2. THE Storefront_Renderer for `content-journal` SHALL query the Journal table for the most recent published entries up to the configured maximum and render each as a card with image, category, date, title, and excerpt
3. THE Section_Editor for `content-brief` SHALL provide fields for a bilingual title and an ordered list of brief items, each with an image, a bilingual numbered label (e.g. "01."), and bilingual body text
4. THE Storefront_Renderer for `content-brief` SHALL render items in a 3-up card grid
5. THE Section_Editor for `content-2up` SHALL provide fields for a bilingual title and a configurable content source (Journal or Recipe) with a maximum number of entries (default 2)
6. THE Storefront_Renderer for `content-2up` SHALL query the selected content source for the most recent published entries and render each as a tall-image card with category label and title
7. WHEN a Dynamic_Section references Journal or Recipe entries, THE Storefront_Renderer SHALL display a graceful empty state if no published entries exist

### Requirement 5: Section Library — Heading Sections

**User Story:** As an admin, I want heading section types, so that I can add prominent titles and navigation elements to pages.

#### Acceptance Criteria

1. THE Section_Editor for `heading-articles` SHALL provide fields for a bilingual title and an ordered list of category filter tabs, each with a bilingual label
2. THE Storefront_Renderer for `heading-articles` SHALL render the title with clickable category filter tabs showing entry counts per category
3. THE Section_Editor for `heading-page` SHALL provide a single bilingual title field
4. THE Storefront_Renderer for `heading-page` SHALL render the title right-aligned in large display typography
5. THE Section_Editor for `heading-content` SHALL provide fields for a bilingual title, a bilingual category label, and a date field
6. THE Storefront_Renderer for `heading-content` SHALL render the title with category and date metadata below

### Requirement 6: Section Library — Text Sections

**User Story:** As an admin, I want text section types, so that I can add written content in various layouts.

#### Acceptance Criteria

1. THE Section_Editor for `quote` SHALL provide a bilingual quote text field
2. THE Storefront_Renderer for `quote` SHALL render the quote as large centered pull-quote typography
3. THE Section_Editor for `text` SHALL provide a bilingual title field and a bilingual rich-text body field
4. THE Storefront_Renderer for `text` SHALL render the title followed by body paragraphs
5. THE Section_Editor for `instructions` SHALL provide a bilingual title field and an ordered list of bilingual instruction steps
6. THE Storefront_Renderer for `instructions` SHALL render the title followed by numbered instruction steps
7. THE Section_Editor for `two-column-text` SHALL provide a bilingual title field and two bilingual text column fields
8. THE Storefront_Renderer for `two-column-text` SHALL render the title above two side-by-side text columns
9. THE Section_Editor for `steps` SHALL provide an ordered list of steps, each with a bilingual step number label (e.g. "01") and bilingual body text
10. THE Storefront_Renderer for `steps` SHALL render each step with a large number and body text

### Requirement 7: Section Library — Mixed Sections

**User Story:** As an admin, I want mixed content sections, so that I can combine images, text, and forms on pages.

#### Acceptance Criteria

1. THE Section_Editor for `image-with-text` SHALL provide fields for an image, a bilingual title, bilingual body text, and a background color picker
2. THE Storefront_Renderer for `image-with-text` SHALL render the image on the left with title and body text on the right over the selected background color
3. THE Section_Editor for `contact-form` SHALL provide fields for a bilingual title, bilingual contact info (phone, email), and bilingual social media links
4. THE Storefront_Renderer for `contact-form` SHALL render a contact form with email, name, inquiry type, and message fields alongside a contact info sidebar
5. WHEN a visitor submits the contact form rendered by the `contact-form` section, THE Storefront_Renderer SHALL submit the form data to the existing `/api/requests` endpoint


### Requirement 8: Page Builder Admin UI

**User Story:** As an admin, I want a visual page builder, so that I can compose pages by adding, editing, reordering, and removing sections without writing code.

#### Acceptance Criteria

1. WHEN an admin navigates to `/admin/pages/[pageName]`, THE Page_Builder SHALL load the existing Page_Record sections from the API and display each section as an editable card in order
2. THE Page_Builder SHALL display an "Add section" control that opens the Section_Library showing all 19 section types grouped by category (FAQ, Image, Dynamic Content, Heading, Text, Mixed)
3. WHEN an admin selects a section type from the Section_Library, THE Page_Builder SHALL append a new section instance with default empty fields to the end of the section list
4. THE Page_Builder SHALL allow reordering sections via drag-and-drop, updating the visual order immediately
5. THE Page_Builder SHALL allow removing a section with a confirmation prompt before deletion
6. WHEN an admin clicks "Save", THE Page_Builder SHALL serialize all sections to JSON and send a PUT request to `/api/pages/[pageName]`
7. IF the save request fails, THEN THE Page_Builder SHALL display an error toast and preserve the unsaved state
8. THE Page_Builder SHALL provide a collapse/expand toggle on each section card so admins can focus on one section at a time
9. THE Page_Builder SHALL display each section card with a header showing the section type icon, type label, and a summary of the section content (e.g. the title text)

### Requirement 9: Bilingual Content Editing

**User Story:** As an admin, I want to edit content in both French and English, so that the storefront serves the correct language to each visitor.

#### Acceptance Criteria

1. THE Section_Editor SHALL display French and English fields side by side for every bilingual text field within a section
2. THE Section_Editor SHALL display a locale flag indicator (🇫🇷 / 🇬🇧) next to each language column
3. WHEN a bilingual field is filled in one language but empty in the other, THE Section_Editor SHALL display a visual warning indicator on the incomplete field
4. THE Section_Editor SHALL integrate the existing AiTranslateButton component to allow one-click translation from one language to the other for all text fields in a section

### Requirement 10: Page Preview

**User Story:** As an admin, I want to preview a page before publishing, so that I can verify the layout and content look correct.

#### Acceptance Criteria

1. THE Page_Builder SHALL provide a "Preview" button that opens the composed page in a new browser tab
2. WHEN the admin clicks "Preview", THE Page_Builder SHALL save the current section state to the API before opening the preview
3. THE preview SHALL render the page using the same Storefront_Renderer components used on the live site

### Requirement 11: Storefront Page Rendering

**User Story:** As a visitor, I want pages to render their sections in order, so that I see the content the admin composed.

#### Acceptance Criteria

1. WHEN a storefront page is requested, THE Storefront_Renderer SHALL read the Page_Record for that page and render each section in array order using the matching section component
2. IF a Page_Record contains zero sections, THEN THE Storefront_Renderer SHALL render a minimal empty page without errors
3. IF a Page_Record contains a section with an unrecognized type, THEN THE Storefront_Renderer SHALL skip that section and continue rendering the remaining sections
4. THE Storefront_Renderer SHALL apply responsive layouts to all section components, adapting from the desktop Figma designs to mobile viewports
5. THE Storefront_Renderer SHALL use the visitor's active locale (FR or EN) to select the correct language from bilingual fields

### Requirement 12: Content Type Rename — Stories to Journal

**User Story:** As an admin, I want the "Stories" content type renamed to "Journal", so that the terminology matches the brand's editorial direction.

#### Acceptance Criteria

1. THE Migration_Script SHALL rename the `stories` database table to `journal`
2. THE Migration_Script SHALL update all database indexes referencing the old table name
3. THE Migration_Script SHALL preserve all existing data rows during the rename
4. WHEN the migration completes, THE admin sidebar SHALL display "Journal" with the 📖 icon instead of "Stories"
5. THE admin route `/admin/journal` SHALL replace `/admin/stories` for listing, creating, and editing journal entries
6. THE API route `/api/journal` SHALL replace `/api/stories` for all CRUD operations
7. THE storefront route `/journal` SHALL replace `/stories` for the public listing page
8. THE storefront route `/journal/[slug]` SHALL replace `/stories/[slug]` for individual entry pages
9. WHEN a visitor requests `/stories` or `/stories/[slug]`, THE application SHALL return a 301 permanent redirect to the corresponding `/journal` URL

### Requirement 13: Content Type Rename — News to Recipes

**User Story:** As an admin, I want the "News" content type renamed to "Recipes", so that the content type reflects its actual use.

#### Acceptance Criteria

1. THE Migration_Script SHALL rename the `news` database table to `recipes`
2. THE Migration_Script SHALL update all database indexes referencing the old table name
3. THE Migration_Script SHALL preserve all existing data rows during the rename
4. WHEN the migration completes, THE admin sidebar SHALL display "Recipes" with the 🍳 icon instead of "News"
5. THE admin route `/admin/recipes` SHALL replace `/admin/news` for listing, creating, and editing recipe entries
6. THE API route `/api/recipes` SHALL replace `/api/news` for all CRUD operations
7. THE Recipe data model SHALL be extended with the following fields: `slug` (text, unique), `category` (text), `coverImage` (text), `status` (text: draft/published), `publishedAt` (timestamp) to match the richer Journal model
8. THE Migration_Script SHALL set `status` to `published` and generate a slug from the title for all existing news rows during migration

### Requirement 14: Admin Navigation Update

**User Story:** As an admin, I want the sidebar navigation to reflect the renamed content types and the new page builder, so that I can find everything in the right place.

#### Acceptance Criteria

1. THE admin sidebar Content section SHALL list items in this order: Journal, Recipes, Pages, Requests
2. WHEN an admin clicks "Pages" in the sidebar, THE admin SHALL see a list of composable pages (Home, About, Contact, Journal, Recipes, and any custom pages) each linking to the Page_Builder
3. THE admin sidebar SHALL no longer display "Stories" or "News" as navigation items

### Requirement 15: Composable Page Registry

**User Story:** As an admin, I want to manage which pages are available for composition, so that I can create new custom pages beyond the predefined set.

#### Acceptance Criteria

1. THE Page_Builder SHALL support a predefined set of pages: `home`, `about`, `contact`, `journal`, `recipes`
2. THE admin pages index SHALL display each predefined page with its label and a link to the Page_Builder
3. WHEN an admin creates a new custom page, THE Page_Builder SHALL require a unique page name (kebab-case) and a bilingual display title
4. THE admin pages index SHALL list custom pages alongside predefined pages
5. THE admin SHALL be able to delete custom pages but not predefined pages
6. WHEN a custom page is created, THE Storefront_Renderer SHALL make it accessible at a URL derived from the page name

### Requirement 16: Section Image Handling

**User Story:** As an admin, I want to upload and manage images within sections, so that I can add visual content without leaving the page builder.

#### Acceptance Criteria

1. THE Section_Editor SHALL integrate the existing ImageUploader component for all image fields within sections
2. WHEN an admin uploads an image through a section's image field, THE ImageUploader SHALL upload the file to the existing `/api/upload` endpoint and store the returned URL in the section data
3. THE Section_Editor SHALL display a thumbnail preview of uploaded images within the section card
4. THE Section_Editor SHALL allow replacing an uploaded image by clicking the existing thumbnail

### Requirement 17: Storefront Typography and Styling

**User Story:** As a developer, I want the storefront section components to match the Figma designs, so that the rendered pages are visually consistent with the brand.

#### Acceptance Criteria

1. THE Storefront_Renderer SHALL use the ABC Solar Display font (Semibold 600) for all heading and display text within sections
2. THE Storefront_Renderer SHALL use `#1A3821` as the primary text color, `#F7F6F3` as the light background color, and `#D49BCB` / `#CB9EC9` as accent colors
3. THE Storefront_Renderer SHALL use `#000000` for border elements as specified in the Figma designs
4. THE Storefront_Renderer SHALL apply consistent spacing and padding between sections matching the Figma vertical rhythm

### Requirement 18: CMS Steering File Update

**User Story:** As a developer, I want the CMS model steering file updated, so that documentation reflects the renamed content types and new page builder data model.

#### Acceptance Criteria

1. WHEN the feature is complete, THE `.kiro/steering/cms-model.md` file SHALL reference "Journal" instead of "Story" in the Content Types section
2. THE `.kiro/steering/cms-model.md` file SHALL include a "Recipe" content type definition with the extended fields (slug, category, coverImage, status, publishedAt)
3. THE `.kiro/steering/cms-model.md` file SHALL document the Page_Record section array structure under a "Pages" content type entry
4. THE `.kiro/steering/cms-model.md` file SHALL update the API Routes section to list `/api/journal` and `/api/recipes` instead of `/api/stories` and `/api/news`
