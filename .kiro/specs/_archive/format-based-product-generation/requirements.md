# Requirements Document: Format-Based Product Generation

## Introduction

This feature extends the existing launch-first CMS model to enable intelligent product generation based on format eligibility rules. Currently, product generation from launch flavours is hardcoded to check flavour types (gelato vs sorbet). This feature makes format eligibility explicit and configurable through the CMS, allowing formats to declare which flavour types they accept via taxonomy relationships.

The system will enable administrators to quickly generate products from launch flavours by automatically determining which formats are compatible with each flavour based on taxonomy-driven eligibility rules.

## Glossary

- **Format**: A product template that defines structure, serving style, and flavour requirements (e.g., "Scoop", "Twist", "Take Home Pint")
- **Flavour**: A recipe entity with a type taxonomy (e.g., gelato, sorbet, soft-serve-base)
- **Product**: A sellable offering created by combining a format with specific flavours
- **Launch**: A collection of flavours being released together
- **Taxonomy**: A CMS-managed categorization system (e.g., flavourTypes: gelato, sorbet)
- **Eligibility_Rule**: A relationship between a format and the flavour types it accepts
- **Product_Generator**: The system component that creates products from launch flavours
- **Format_Manager**: The CMS interface for managing format configuration

## Requirements

### Requirement 1: Format Eligibility Configuration

**User Story:** As an administrator, I want to configure which flavour types each format accepts, so that product generation respects format constraints.

#### Acceptance Criteria

1. THE Format_Manager SHALL display an "Eligible Flavour Types" field in the format edit interface
2. THE Format_Manager SHALL allow selection of multiple flavour types from the flavourTypes taxonomy
3. WHEN a format is saved with eligible flavour types, THE Format_Manager SHALL persist the eligibility rules
4. THE Format_Manager SHALL display currently selected eligible flavour types as removable tags
5. WHERE no eligible flavour types are selected, THE Format SHALL accept all flavour types by default

### Requirement 2: Format Eligibility Validation

**User Story:** As an administrator, I want the system to validate format eligibility rules, so that configuration errors are caught early.

#### Acceptance Criteria

1. WHEN a format requires flavours but has no eligible types selected, THE Format_Manager SHALL display a warning message
2. THE Format_Manager SHALL validate that selected eligible types exist in the flavourTypes taxonomy
3. IF a flavour type is archived in the taxonomy, THEN THE Format_Manager SHALL display it with an archived indicator
4. THE Format_Manager SHALL prevent saving formats with invalid taxonomy references

### Requirement 3: Eligibility-Based Product Generation

**User Story:** As an administrator, I want to generate products that respect format eligibility rules, so that only valid format-flavour combinations are created.

#### Acceptance Criteria

1. WHEN the generate products action is triggered, THE Product_Generator SHALL retrieve all active formats
2. FOR EACH selected flavour, THE Product_Generator SHALL identify eligible formats based on the flavour's type
3. THE Product_Generator SHALL create products only for format-flavour combinations where the flavour type matches the format's eligible types
4. WHERE a format has no eligible types configured, THE Product_Generator SHALL treat it as accepting all flavour types
5. THE Product_Generator SHALL skip creating duplicate products that already exist

### Requirement 4: Multi-Flavour Format Eligibility

**User Story:** As an administrator, I want multi-flavour formats to validate all flavours meet eligibility rules, so that twist products only combine compatible flavours.

#### Acceptance Criteria

1. WHEN a format requires multiple flavours, THE Product_Generator SHALL verify each flavour's type is in the format's eligible types list
2. WHERE a format allows mixed types, THE Product_Generator SHALL accept flavours with different types if all types are eligible
3. WHERE a format does not allow mixed types, THE Product_Generator SHALL only create products when all flavours have the same type
4. THE Product_Generator SHALL skip format-flavour combinations where any flavour is ineligible

### Requirement 5: Generation Results Reporting

**User Story:** As an administrator, I want to see which products were generated and why some were skipped, so that I understand the generation outcome.

#### Acceptance Criteria

1. WHEN product generation completes, THE Product_Generator SHALL return a count of products created per format
2. THE Product_Generator SHALL return a count of products skipped due to eligibility rules
3. THE Product_Generator SHALL return a breakdown showing which formats were used for which flavour types
4. THE Product_Generator SHALL include a human-readable summary message describing the generation results

### Requirement 6: Backward Compatibility

**User Story:** As a system maintainer, I want existing formats without eligibility rules to continue working, so that the migration is non-breaking.

#### Acceptance Criteria

1. WHERE a format has no eligibleFlavourTypes field, THE Product_Generator SHALL treat it as accepting all flavour types
2. WHERE a format has an empty eligibleFlavourTypes array, THE Product_Generator SHALL treat it as accepting all flavour types
3. THE Product_Generator SHALL maintain existing product generation behavior for formats without eligibility configuration
4. THE Format_Manager SHALL allow saving formats without specifying eligible flavour types

### Requirement 7: Settings-Based Eligibility Defaults

**User Story:** As an administrator, I want to define default eligibility rules in settings, so that common patterns can be applied quickly.

#### Acceptance Criteria

1. THE Settings interface SHALL provide a "Format Eligibility Rules" section
2. THE Settings interface SHALL allow mapping flavour types to default format categories
3. WHEN creating a new format, THE Format_Manager SHALL suggest eligible flavour types based on the format's category
4. THE Format_Manager SHALL allow overriding suggested defaults with custom eligibility rules
5. THE Settings SHALL persist eligibility rule defaults in the settings.json file
