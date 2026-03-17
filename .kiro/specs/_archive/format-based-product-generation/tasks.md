# Implementation Plan: Format-Based Product Generation

## Overview

This feature transforms product generation from hardcoded type checking to a flexible, taxonomy-driven eligibility system. The implementation adds an `eligibleFlavourTypes` field to formats, updates the product generation logic to respect these rules, and provides detailed reporting on what was created or skipped.

## Tasks

- [x] 1. Add eligibleFlavourTypes field to Format UI
  - [x] 1.1 Add TaxonomyMultiSelect component to format edit page
    - Import and integrate TaxonomyMultiSelect component in format edit page
    - Add "Format Eligibility" section after "Flavour Requirements" section
    - Wire up eligibleFlavourTypes state to format object
    - Add warning message when format requires flavours but has no eligible types
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ]* 1.2 Write unit tests for format eligibility UI
    - Test TaxonomyMultiSelect integration
    - Test warning message display logic
    - Test state updates when eligibility changes
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Update Format API to handle eligibleFlavourTypes
  - [x] 2.1 Add eligibleFlavourTypes validation to format API
    - Update PUT /api/formats/[id] to accept eligibleFlavourTypes field
    - Validate that selected types exist in flavourTypes taxonomy
    - Handle empty array as "accept all types"
    - Return validation errors for invalid taxonomy references
    - _Requirements: 2.2, 2.3, 2.4_
  
  - [ ]* 2.2 Write integration tests for format API eligibility validation
    - Test saving format with valid eligibleFlavourTypes
    - Test saving format with invalid taxonomy references
    - Test saving format with empty eligibleFlavourTypes
    - Test backward compatibility (no eligibleFlavourTypes field)
    - _Requirements: 2.2, 2.3, 2.4, 6.1, 6.2, 6.3_

- [x] 3. Implement eligibility checking functions
  - [x] 3.1 Create isFormatEligibleForFlavour function
    - Implement eligibility check for single flavour
    - Handle formats without eligibility rules (accept all)
    - Handle empty eligibleFlavourTypes array (accept all)
    - Return true if flavour type is in format's eligible types
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.1, 6.2_
  
  - [x] 3.2 Create isFormatEligibleForFlavours function for multi-flavour products
    - Check all flavours individually for eligibility
    - Validate mixed type restrictions (allowMixedTypes flag)
    - Return false if any flavour is ineligible
    - Return false if mixed types not allowed and flavours have different types
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 3.3 Write property tests for eligibility functions
    - **Property 1: Eligibility symmetry - if format accepts type A, all flavours of type A are eligible**
    - **Validates: Requirements 3.2, 3.3**
  
  - [ ]* 3.4 Write unit tests for eligibility edge cases
    - Test format with no eligibleFlavourTypes (accepts all)
    - Test format with empty eligibleFlavourTypes array (accepts all)
    - Test format with single eligible type
    - Test format with multiple eligible types
    - Test multi-flavour with mixed types allowed
    - Test multi-flavour with mixed types not allowed
    - _Requirements: 3.4, 4.1, 4.2, 4.3, 4.4, 6.1, 6.2_

- [x] 4. Update product generation logic
  - [x] 4.1 Refactor generate-products API to use eligibility functions
    - Replace hardcoded type checking with isFormatEligibleForFlavour calls
    - Filter format-flavour combinations based on eligibility
    - Track skipped combinations with reasons
    - Maintain backward compatibility for formats without eligibility rules
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.1, 6.2, 6.3_
  
  - [x] 4.2 Update multi-flavour product generation (twist products)
    - Use isFormatEligibleForFlavours for multi-flavour formats
    - Skip combinations where any flavour is ineligible
    - Track skipped twist combinations separately
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 4.3 Write integration tests for product generation with eligibility
    - Test generation with formats that have eligibility rules
    - Test generation with formats without eligibility rules (backward compatibility)
    - Test generation with mixed flavour types
    - Test generation skips ineligible combinations
    - Test generation creates all eligible combinations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 6.1, 6.2, 6.3_

- [x] 5. Implement generation reporting
  - [x] 5.1 Create GenerationReport interface and builder function
    - Define GenerationReport TypeScript interface
    - Create buildGenerationReport function
    - Calculate breakdown by format (created, skipped, flavourTypes)
    - Calculate breakdown by flavour type
    - Generate human-readable summary message
    - Include skipped combinations with reasons in details
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 5.2 Update generate-products API response to use GenerationReport
    - Replace simple response with detailed GenerationReport
    - Include all breakdown information
    - Return skipped combinations in details section
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 5.3 Write unit tests for generation reporting
    - Test report generation with various scenarios
    - Test breakdown calculations
    - Test message generation
    - Test skipped combinations tracking
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 6. Add formatEligibilityRules to settings
  - [x] 6.1 Update settings.json schema with formatEligibilityRules
    - Add formatEligibilityRules field to settings.json
    - Define default mappings (gelato, sorbet, soft-serve-base)
    - Document the structure in comments
    - _Requirements: 7.1, 7.2, 7.5_
  
  - [x] 6.2 Update settings UI to display eligibility rules
    - Add "Format Eligibility Rules" section to settings page
    - Display current mappings in read-only format
    - Add help text explaining the purpose
    - _Requirements: 7.1, 7.2_
  
  - [ ]* 6.3 Write integration tests for settings eligibility rules
    - Test reading formatEligibilityRules from settings
    - Test settings persistence
    - Test backward compatibility (missing formatEligibilityRules)
    - _Requirements: 7.1, 7.2, 7.5_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Update TypeScript types
  - [x] 8.1 Add eligibleFlavourTypes to Format type definition
    - Update Format interface in types file
    - Add JSDoc comments explaining the field
    - Ensure optional field with proper typing
    - _Requirements: 1.1, 1.5, 6.1, 6.2_
  
  - [x] 8.2 Create GenerationReport type definition
    - Define GenerationReport interface
    - Define nested breakdown interfaces
    - Add JSDoc comments with examples
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Focus on MINIMAL implementation - avoid over-engineering
- Maintain backward compatibility throughout
