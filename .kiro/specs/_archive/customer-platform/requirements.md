# Requirements Document

## Introduction

The Janine Customer Platform is a customer-facing account system and lightweight CRM layer that enables customers to participate in loyalty programs, track purchases, receive event invitations, and access exclusive content. The system uses Janine as the primary identity provider, with customer accounts owned and managed by Janine. When customers need to make purchases through Shopify, the system uses Shopify Multipass to provide seamless single sign-on to the Shopify checkout experience. This architecture ensures Janine owns the customer relationship and all CRM data, while Shopify handles commerce operations (checkout, payments, fulfillment). Purchase data flows back from Shopify to Janine via webhooks to maintain a unified customer view. The platform is designed to be phone-native, frictionless, and physical-store-friendly using wallet cards and QR codes rather than requiring app downloads or complex authentication.

## Glossary

- **Customer_Account_System**: The Janine-owned customer account management system that serves as the primary identity provider
- **Janine_Account**: The customer identity and authentication system owned and managed by Janine (primary identity system)
- **Janine_Auth_Service**: The authentication service that handles login, registration, password management, and session management for Janine accounts
- **Multipass_Service**: The service that generates Shopify Multipass tokens for seamless single sign-on to Shopify checkout
- **Multipass_Token**: A cryptographically signed token that authenticates a customer to Shopify without requiring separate login
- **Shopify_Customer_Record**: The Shopify-side customer record created automatically via Multipass for commerce operations
- **Loyalty_Service**: The service that manages loyalty points, stamps, and rewards
- **Wallet_Pass_Service**: The service that generates and updates Apple Wallet and Google Wallet passes
- **CRM_System**: The customer relationship management interface for Janine staff
- **Membership_Service**: The service that manages membership tiers and perks
- **Event_Service**: The service that manages event invitations and RSVPs
- **Referral_Service**: The service that tracks and rewards customer referrals
- **Rating_Service**: The service that manages flavour ratings and reviews
- **Messaging_Service**: The service that sends notifications via email, SMS, and push
- **Shopify_Integration**: The integration layer that generates Multipass tokens for checkout and syncs order data from Shopify via webhooks
- **Loyalty_Scanner**: The QR/barcode scanning interface used by staff
- **Mobile_App**: The native iOS and Android customer application that authenticates with Janine backend
- **Receipt_Scanner**: The mobile app feature that captures and processes receipt images
- **OCR_Service**: The optical character recognition service that extracts text from receipt images
- **Receipt_Parser**: The service that interprets receipt text and extracts purchase data
- **Receipt_Validator**: The service that validates receipt authenticity and prevents fraud
- **Clover_Integration**: The integration layer that communicates with Clover POS
- **Receipt_Code**: A unique identifier printed on Clover receipts for verification
- **Purchase_Record**: A validated purchase transaction linked to a customer account
- **Customer**: A registered user with a Janine account
- **Loyalty_Profile**: The loyalty-specific data associated with a customer
- **Stamp**: A unit of loyalty progress earned per eligible purchase or visit
- **Reward**: A benefit that can be redeemed after earning sufficient stamps or points
- **Membership_Tier**: A level of membership with associated perks (Free, Regular, Super Taster, Founders Club)
- **Drop**: A limited-release flavour available to members early or exclusively

## Requirements

### Requirement 1: Customer Account Creation

**User Story:** As a customer, I want to create a Janine account quickly, so that I can participate in loyalty programs and track my purchases.

#### Acceptance Criteria

1. THE Customer_Account_System SHALL use Janine_Auth_Service as the primary authentication method
2. WHEN a customer creates an account online, THE Janine_Auth_Service SHALL create a Janine_Account with email and password
3. WHEN a customer creates an account in-store without an existing Janine account, THE Janine_Auth_Service SHALL create a Janine_Account using email or phone with OTP verification
4. THE Customer_Account_System SHALL collect: name, email or phone, preferred store, and marketing consent during account creation
5. THE Customer_Account_System SHALL store customer data in the Janine database including: customer ID, name, email, phone, preferred store, marketing consent, and account creation date
6. WHEN a Janine_Account is created, THE Loyalty_Service SHALL automatically create a Loyalty_Profile linked via Janine customer ID
7. WHEN a Loyalty_Profile is created, THE Wallet_Pass_Service SHALL generate a digital loyalty card
8. THE Customer_Account_System SHALL allow account creation via: website loyalty signup, QR scan in store, wallet card registration, event signup, or mobile app
9. THE Janine_Auth_Service SHALL support authentication methods including: email and password, magic link (passwordless email), and OTP (one-time password via SMS)

### Requirement 2: Customer Account Dashboard

**User Story:** As a customer, I want to view my account information and activity, so that I can track my loyalty progress and engagement.

#### Acceptance Criteria

1. THE Customer_Account_System SHALL display: loyalty points or stamps, available rewards, upcoming events, purchased flavours, flavour ratings, and membership status
2. THE Customer_Account_System SHALL display visit history and points transaction history
3. THE Customer_Account_System SHALL display referral history and referral rewards
4. THE Customer_Account_System SHALL allow customers to update: name, email, phone, and preferred store
5. THE Customer_Account_System SHALL allow customers to manage marketing consent preferences

### Requirement 3: Loyalty Card Generation

**User Story:** As a customer, I want to receive a digital loyalty card, so that I can easily earn rewards in-store without carrying a physical card.

#### Acceptance Criteria

1. WHEN a Loyalty_Profile is created, THE Wallet_Pass_Service SHALL generate a unique customer ID and QR code
2. THE Wallet_Pass_Service SHALL generate an Apple Wallet pass containing: customer name or member ID, QR code, stamp or points count, next reward progress, and membership tier
3. THE Wallet_Pass_Service SHALL generate a Google Wallet pass with equivalent information
4. THE Customer_Account_System SHALL display a web-based loyalty card with QR code for customers who do not add to wallet
5. THE Wallet_Pass_Service SHALL support dynamic updates to wallet passes when loyalty balance changes

### Requirement 4: In-Store Loyalty Scanning

**User Story:** As a staff member, I want to scan customer loyalty cards quickly, so that I can award loyalty progress without slowing down checkout.

#### Acceptance Criteria

1. THE Loyalty_Scanner SHALL support QR code scanning via: POS camera, staff phone, or admin tablet
2. WHEN a loyalty QR code is scanned, THE Loyalty_Scanner SHALL complete the scan operation within 2 seconds
3. WHEN a loyalty QR code is scanned, THE Loyalty_Service SHALL look up the associated Loyalty_Profile
4. WHEN a valid Loyalty_Profile is found, THE Loyalty_Scanner SHALL display: customer name, current stamp or points balance, and available rewards
5. THE Loyalty_Scanner SHALL allow staff to: add a visit or stamp, add bonus points, or redeem a reward

### Requirement 5: Visit-Based Loyalty Model

**User Story:** As a customer, I want to earn stamps for eligible purchases, so that I can work toward free rewards.

#### Acceptance Criteria

1. WHEN a staff member records a visit, THE Loyalty_Service SHALL add 1 stamp to the customer's Loyalty_Profile
2. THE Loyalty_Service SHALL track stamp count and reward progress
3. WHEN a customer reaches 10 stamps, THE Loyalty_Service SHALL unlock a free scoop reward
4. THE Loyalty_Service SHALL record each stamp transaction with: timestamp, staff member, and location
5. WHEN a stamp is added, THE Wallet_Pass_Service SHALL update the customer's wallet pass within 5 seconds

### Requirement 6: Points-Based Loyalty Model

**User Story:** As a customer, I want to earn points for various activities, so that I can unlock rewards beyond just purchases.

#### Acceptance Criteria

1. THE Loyalty_Service SHALL support points-based loyalty in addition to or instead of stamps
2. THE Loyalty_Service SHALL allow points to be awarded for: merch purchases, member tasting attendance, referrals, flavour ratings, and birthday bonuses
3. THE Loyalty_Service SHALL record each points transaction with: amount, reason, timestamp, and source
4. THE Loyalty_Service SHALL calculate total points balance across all transactions
5. WHEN points are added or redeemed, THE Wallet_Pass_Service SHALL update the customer's wallet pass within 5 seconds

### Requirement 7: Reward Redemption

**User Story:** As a customer, I want to redeem my earned rewards, so that I can receive the benefits I've earned.

#### Acceptance Criteria

1. WHEN a customer has sufficient stamps or points, THE Loyalty_Service SHALL mark the corresponding reward as available
2. THE Customer_Account_System SHALL display available rewards in the customer dashboard
3. THE Wallet_Pass_Service SHALL display "Reward available" on the customer's wallet pass
4. WHEN a staff member scans a customer's loyalty card, THE Loyalty_Scanner SHALL display available rewards
5. WHEN a staff member redeems a reward, THE Loyalty_Service SHALL mark the reward as used and record: timestamp, staff member, and location
6. WHEN a reward is redeemed, THE Loyalty_Service SHALL deduct the required stamps or points
7. WHEN a reward is redeemed, THE Wallet_Pass_Service SHALL update the customer's wallet pass within 5 seconds

### Requirement 8: Reward Types

**User Story:** As an administrator, I want to configure different types of rewards, so that I can offer varied incentives to customers.

#### Acceptance Criteria

1. THE Loyalty_Service SHALL support reward types including: free scoop, topping, discount, merch discount, event access, and early flavour drops
2. THE Loyalty_Service SHALL allow administrators to define: reward name, description, required stamps or points, and expiration rules
3. THE Loyalty_Service SHALL track reward inventory for limited-quantity rewards
4. THE Loyalty_Service SHALL prevent redemption of expired or out-of-stock rewards

### Requirement 9: Membership Tiers

**User Story:** As a customer, I want to progress through membership tiers, so that I can unlock additional perks and benefits.

#### Acceptance Criteria

1. THE Membership_Service SHALL support membership tiers: Free Member, Regular, Super Taster, and Founders Club
2. THE Membership_Service SHALL associate each tier with: perks list, reward multipliers, and event access levels
3. WHEN a customer meets tier requirements, THE Membership_Service SHALL automatically upgrade their membership tier
4. THE Membership_Service SHALL record tier changes with timestamp and reason
5. THE Customer_Account_System SHALL display current membership tier and progress to next tier
6. THE Wallet_Pass_Service SHALL display membership tier on the customer's wallet pass

### Requirement 10: Membership Perks

**User Story:** As a member, I want to receive tier-specific perks, so that I benefit from my loyalty and engagement.

#### Acceptance Criteria

1. THE Membership_Service SHALL grant perks including: merch discounts, priority tasting invites, exclusive flavours, birthday rewards, and early drop access
2. WHEN a customer reaches a new tier, THE Messaging_Service SHALL send a notification about unlocked perks
3. THE Customer_Account_System SHALL display active perks in the customer dashboard
4. THE Loyalty_Service SHALL apply perk benefits automatically when applicable (e.g., discount at checkout, bonus points)

### Requirement 11: CRM Customer Profiles

**User Story:** As a staff member, I want to view detailed customer profiles, so that I can provide personalized service and understand customer preferences.

#### Acceptance Criteria

1. THE CRM_System SHALL display customer profiles including: name, contact info, signup date, loyalty history, flavour ratings, referrals, event attendance, and purchase history
2. THE CRM_System SHALL display visit frequency and last visit date
3. THE CRM_System SHALL display favourite flavours based on ratings and purchase history
4. THE CRM_System SHALL display current points or stamps balance and membership status
5. THE CRM_System SHALL allow staff to add notes to customer profiles
6. THE CRM_System SHALL restrict access to customer profiles based on staff permissions

### Requirement 12: Customer Segmentation

**User Story:** As an administrator, I want to segment customers by behavior and attributes, so that I can target communications and promotions effectively.

#### Acceptance Criteria

1. THE CRM_System SHALL support segmentation by: membership tier, visit frequency, loyalty balance, favourite flavours, event attendance, and referral activity
2. THE CRM_System SHALL allow administrators to create custom segments with multiple criteria
3. THE CRM_System SHALL display segment size and member list
4. THE CRM_System SHALL allow exporting segment data for use in campaigns

### Requirement 13: Messaging to Customers

**User Story:** As an administrator, I want to send messages to customers, so that I can notify them about flavour drops, events, and rewards.

#### Acceptance Criteria

1. THE Messaging_Service SHALL support message types: flavour drops, event invitations, reward notifications, loyalty updates, and membership perks
2. THE Messaging_Service SHALL support delivery channels: email, SMS, push notifications, and wallet pass updates
3. THE Messaging_Service SHALL allow administrators to: compose messages, select recipient segments, schedule delivery, and preview messages
4. THE Messaging_Service SHALL track message delivery status and open rates
5. THE Messaging_Service SHALL respect customer communication preferences and consent

### Requirement 14: Event Management

**User Story:** As an administrator, I want to create and manage events, so that I can invite customers to tastings and launches.

#### Acceptance Criteria

1. THE Event_Service SHALL allow administrators to create events with: name, description, date, time, location, capacity, and eligibility criteria
2. THE Event_Service SHALL support event types: tasting nights, flavour launches, and member-only events
3. THE Event_Service SHALL allow administrators to invite specific customer segments
4. WHEN an event is created, THE Messaging_Service SHALL send invitations to eligible customers
5. THE Event_Service SHALL track RSVPs and attendance capacity
6. THE Event_Service SHALL prevent RSVPs when an event reaches capacity

### Requirement 15: Event RSVP and Check-In

**User Story:** As a customer, I want to RSVP to events and check in when I arrive, so that I can participate in Janine events.

#### Acceptance Criteria

1. THE Customer_Account_System SHALL display event invitations in the customer dashboard
2. THE Customer_Account_System SHALL allow customers to RSVP yes or no to events
3. WHEN a customer RSVPs, THE Event_Service SHALL record the RSVP with timestamp
4. THE Event_Service SHALL generate a QR code for event check-in
5. WHEN a customer arrives at an event, THE Event_Service SHALL allow staff to scan the check-in QR code
6. WHEN a customer checks in, THE Event_Service SHALL record attendance with timestamp
7. WHERE event attendance earns bonus points, THE Loyalty_Service SHALL award points after check-in

### Requirement 16: Referral System

**User Story:** As a customer, I want to refer friends to Janine, so that we both receive rewards.

#### Acceptance Criteria

1. THE Referral_Service SHALL generate a unique referral link for each customer
2. THE Customer_Account_System SHALL display the customer's referral link and referral history
3. WHEN a new customer signs up using a referral link, THE Referral_Service SHALL record the referral relationship
4. WHEN a referred customer completes their first visit, THE Referral_Service SHALL award rewards to both the referrer and the referred customer
5. THE Referral_Service SHALL track: referral count, successful referrals, and referral rewards earned
6. THE Referral_Service SHALL prevent referral abuse by detecting: self-referrals, duplicate accounts, and suspicious patterns

### Requirement 17: Flavour Rating System

**User Story:** As a customer, I want to rate flavours I've tried, so that I can share my preferences and help Janine understand popular flavours.

#### Acceptance Criteria

1. THE Rating_Service SHALL allow customers to rate flavours on a 1-5 scale
2. THE Rating_Service SHALL allow customers to add optional text reviews
3. THE Customer_Account_System SHALL display the customer's flavour ratings history
4. THE Rating_Service SHALL calculate average ratings across all customers for each flavour
5. WHERE flavour ratings earn bonus points, THE Loyalty_Service SHALL award points after rating submission
6. THE Rating_Service SHALL prevent duplicate ratings for the same flavour by the same customer

### Requirement 18: Member-Only Drops

**User Story:** As a member, I want early access to limited flavour drops, so that I can try exclusive flavours before they sell out.

#### Acceptance Criteria

1. THE Membership_Service SHALL allow administrators to designate flavours as member-only drops
2. THE Membership_Service SHALL define eligibility criteria for drops based on membership tier
3. WHEN a drop is announced, THE Messaging_Service SHALL notify eligible members
4. THE Membership_Service SHALL allow members to reserve drop items with pickup window
5. THE Membership_Service SHALL track drop reservations and prevent over-allocation
6. WHEN a drop reservation window expires, THE Membership_Service SHALL release unreserved inventory

### Requirement 19: Analytics Dashboard

**User Story:** As an administrator, I want to view analytics about customer behavior, so that I can make data-driven decisions about loyalty and engagement.

#### Acceptance Criteria

1. THE CRM_System SHALL display analytics including: repeat visit rate, loyalty participation rate, reward redemption rate, top-rated flavours, referral growth, event attendance, and membership conversions
2. THE CRM_System SHALL allow administrators to filter analytics by: date range, location, and customer segment
3. THE CRM_System SHALL display trend charts for key metrics over time
4. THE CRM_System SHALL allow exporting analytics data for external analysis

### Requirement 20: Privacy and Data Management

**User Story:** As a customer, I want control over my personal data, so that I can protect my privacy and comply with my preferences.

#### Acceptance Criteria

1. THE Customer_Account_System SHALL allow customers to view all stored personal data
2. THE Customer_Account_System SHALL allow customers to request data deletion
3. WHEN a customer requests data deletion, THE Customer_Account_System SHALL delete all personal data within 30 days
4. THE Customer_Account_System SHALL anonymize loyalty and analytics data after deletion
5. THE Customer_Account_System SHALL comply with GDPR and applicable privacy regulations
6. THE Customer_Account_System SHALL store minimal personal data necessary for functionality

### Requirement 21: Wallet Pass Updates

**User Story:** As a customer, I want my wallet pass to update automatically, so that I always see current loyalty information without manual refresh.

#### Acceptance Criteria

1. WHEN loyalty balance changes, THE Wallet_Pass_Service SHALL push an update to the customer's wallet pass
2. WHEN a reward becomes available, THE Wallet_Pass_Service SHALL push an update to the customer's wallet pass
3. WHEN membership tier changes, THE Wallet_Pass_Service SHALL push an update to the customer's wallet pass
4. THE Wallet_Pass_Service SHALL implement Apple Wallet pass update protocol for iOS devices
5. THE Wallet_Pass_Service SHALL implement Google Wallet pass update protocol for Android devices
6. THE Wallet_Pass_Service SHALL handle pass update failures gracefully and retry within 1 hour

### Requirement 22: Shopify Multipass Integration

**User Story:** As a customer, I want to seamlessly access Shopify checkout from Janine, so that I can make purchases without creating a separate Shopify account.

#### Acceptance Criteria

1. WHEN a customer initiates a Shopify checkout from Janine, THE Multipass_Service SHALL generate a Multipass_Token containing: customer email, name, and Janine customer ID
2. THE Multipass_Service SHALL sign the Multipass_Token using the Shopify Multipass secret key
3. THE Multipass_Service SHALL redirect the customer to Shopify with the Multipass_Token as a URL parameter
4. WHEN Shopify receives a valid Multipass_Token, Shopify SHALL automatically log the customer in and create or update the Shopify_Customer_Record
5. THE Shopify_Integration SHALL use Shopify webhooks to receive real-time notifications of: order creation, order fulfillment, and customer data updates
6. WHEN a Shopify order is created, THE Shopify_Integration SHALL sync the order data to Janine and link it to the customer's Loyalty_Profile using the Janine customer ID stored in Shopify customer metafields
7. THE Shopify_Integration SHALL store the Shopify customer ID in the Janine customer record for bidirectional linking
8. WHEN customer contact information changes in Janine, THE Shopify_Integration SHALL update the corresponding Shopify_Customer_Record via Shopify Admin API on the next Multipass login
9. THE Multipass_Service SHALL set Multipass_Token expiration to 10 seconds to prevent token reuse
10. THE Shopify_Integration SHALL handle Multipass authentication failures gracefully and prompt customers to retry or contact support

### Requirement 22.1: Shopify Order Data Sync

**User Story:** As a customer, I want my Shopify purchases to automatically appear in my Janine account, so that I have a unified view of all my purchases and loyalty activity.

#### Acceptance Criteria

1. WHEN a Shopify order webhook is received, THE Shopify_Integration SHALL extract: order ID, customer email, order date, line items, total amount, and fulfillment status
2. THE Shopify_Integration SHALL match the order to a Janine customer using: Shopify customer ID (if available) or email address
3. WHEN an order is matched to a Janine customer, THE Shopify_Integration SHALL create a Purchase_Record in the Janine database
4. THE Purchase_Record SHALL include: Shopify order ID, order date, line items, total amount, fulfillment status, and link to Loyalty_Profile
5. WHEN a Purchase_Record is created for an eligible purchase, THE Loyalty_Service SHALL evaluate loyalty reward eligibility and award stamps or points
6. THE Customer_Account_System SHALL display Shopify orders in the customer's purchase history
7. WHEN a Shopify order fulfillment status changes, THE Shopify_Integration SHALL update the corresponding Purchase_Record in Janine
8. THE Shopify_Integration SHALL store Shopify order data for at least 2 years for customer reference

### Requirement 23: Birthday Rewards

**User Story:** As a customer, I want to receive a birthday reward, so that I feel valued and have a reason to visit during my birthday month.

#### Acceptance Criteria

1. WHERE a customer provides their birthday during account creation, THE Customer_Account_System SHALL store the birthday
2. WHEN a customer's birthday month begins, THE Loyalty_Service SHALL automatically add a birthday reward to their account
3. WHEN a birthday reward is added, THE Messaging_Service SHALL send a birthday notification
4. THE Loyalty_Service SHALL set birthday rewards to expire at the end of the birthday month
5. THE Wallet_Pass_Service SHALL display birthday rewards on the customer's wallet pass

### Requirement 24: Fraud Prevention

**User Story:** As an administrator, I want to prevent loyalty fraud, so that the program remains fair and sustainable.

#### Acceptance Criteria

1. THE Loyalty_Service SHALL detect suspicious patterns including: multiple accounts from same device, rapid stamp accumulation, and unusual redemption patterns
2. THE Loyalty_Service SHALL flag suspicious accounts for administrator review
3. THE Loyalty_Service SHALL allow administrators to freeze accounts pending investigation
4. THE Referral_Service SHALL prevent self-referrals by detecting matching email, phone, or device identifiers
5. THE Loyalty_Service SHALL rate-limit stamp earning to prevent gaming (e.g., maximum 3 stamps per day per customer)

### Requirement 25: Staff Permissions

**User Story:** As an administrator, I want to control staff access to customer data, so that I can protect customer privacy and prevent unauthorized actions.

#### Acceptance Criteria

1. THE CRM_System SHALL support staff roles including: Administrator, Manager, and Staff
2. THE CRM_System SHALL restrict Administrators to: full access to all features and data
3. THE CRM_System SHALL restrict Managers to: view customer profiles, scan loyalty cards, manage events, and view analytics
4. THE CRM_System SHALL restrict Staff to: scan loyalty cards and view basic customer information during transactions
5. THE CRM_System SHALL log all staff actions with: timestamp, staff member, and action type
6. THE CRM_System SHALL allow administrators to audit staff activity

### Requirement 26: Mobile App Platform

**User Story:** As a customer, I want to use a mobile app to manage my loyalty account, so that I can access features on the go without visiting the website.

#### Acceptance Criteria

1. THE Mobile_App SHALL be available for iOS devices running iOS 14 or later
2. THE Mobile_App SHALL be available for Android devices running Android 8.0 or later
3. THE Mobile_App SHALL authenticate with the Janine backend using the Janine_Auth_Service
4. THE Mobile_App SHALL allow customers to log in with their Janine account credentials (email and password)
5. THE Mobile_App SHALL support passwordless authentication via magic link or OTP
6. THE Mobile_App SHALL maintain authenticated sessions using secure JWT tokens stored in device keychain or keystore
7. THE Mobile_App SHALL display: loyalty balance, available rewards, upcoming events, purchase history, and membership status
8. THE Mobile_App SHALL allow customers to: scan receipts, view wallet pass, rate flavours, and manage account settings
9. THE Mobile_App SHALL support push notifications for: loyalty updates, reward availability, event invitations, and flavour drops
10. WHEN a customer taps "Shop" in the Mobile_App, THE Multipass_Service SHALL generate a Multipass_Token and open Shopify checkout in an in-app browser or external browser

### Requirement 27: Receipt Scanning Interface

**User Story:** As a customer, I want to scan my receipt using my phone camera, so that I can automatically record my purchase and earn loyalty rewards without staff assistance.

#### Acceptance Criteria

1. THE Mobile_App SHALL provide a receipt scanning interface accessible from the home screen
2. WHEN a customer initiates receipt scanning, THE Mobile_App SHALL activate the device camera
3. THE Mobile_App SHALL provide visual guidance for receipt positioning and lighting
4. WHEN a customer captures a receipt image, THE Receipt_Scanner SHALL upload the image to the OCR_Service
5. THE Receipt_Scanner SHALL display a loading indicator during processing
6. THE Receipt_Scanner SHALL complete the scan-to-confirmation flow within 10 seconds under normal network conditions
7. THE Mobile_App SHALL allow customers to retake the photo if the image quality is insufficient

### Requirement 28: Receipt OCR Processing

**User Story:** As the system, I want to extract text from receipt images accurately, so that I can parse purchase details for loyalty processing.

#### Acceptance Criteria

1. WHEN a receipt image is uploaded, THE OCR_Service SHALL extract text from the image
2. THE OCR_Service SHALL recognize printed text with at least 95% accuracy for standard thermal receipt paper
3. THE OCR_Service SHALL handle receipt images with: varying lighting conditions, slight rotation (up to 15 degrees), and partial shadows
4. THE OCR_Service SHALL return extracted text within 5 seconds
5. IF the OCR_Service cannot extract readable text, THEN THE Receipt_Scanner SHALL prompt the customer to retake the photo
6. THE OCR_Service SHALL support common receipt fonts used by Clover POS thermal printers

### Requirement 29: Clover Receipt Code Generation

**User Story:** As the system, I want Clover POS to print unique verification codes on receipts, so that I can validate receipt authenticity and prevent fraud.

#### Acceptance Criteria

1. THE Clover_Integration SHALL configure Clover POS to print a unique Receipt_Code on every transaction receipt
2. THE Receipt_Code SHALL be a 12-character alphanumeric code (e.g., "A3F7-K9M2-P5Q8")
3. THE Receipt_Code SHALL be printed near the bottom of the receipt with a label "Loyalty Code:"
4. WHEN a transaction is completed, THE Clover_Integration SHALL generate a Receipt_Code and store it with: transaction ID, timestamp, total amount, line items, and location
5. THE Clover_Integration SHALL store Receipt_Code data for at least 90 days
6. THE Receipt_Code SHALL be cryptographically secure to prevent guessing or generation of valid codes

### Requirement 30: Receipt Parsing

**User Story:** As the system, I want to parse receipt text and extract purchase details, so that I can validate and record the transaction.

#### Acceptance Criteria

1. WHEN OCR text is received, THE Receipt_Parser SHALL extract: Receipt_Code, transaction date and time, total amount, line items with quantities and prices, and store location
2. THE Receipt_Parser SHALL identify the Receipt_Code by locating the "Loyalty Code:" label
3. THE Receipt_Parser SHALL parse transaction date and time in multiple common formats
4. THE Receipt_Parser SHALL parse currency amounts with decimal precision
5. THE Receipt_Parser SHALL extract line items including: item name, quantity, unit price, and line total
6. IF the Receipt_Parser cannot extract required fields, THEN THE Receipt_Scanner SHALL prompt the customer to retake the photo or enter the Receipt_Code manually

### Requirement 31: Receipt Validation

**User Story:** As the system, I want to validate scanned receipts against Clover transaction records, so that I can prevent fraud and ensure accurate loyalty tracking.

#### Acceptance Criteria

1. WHEN a Receipt_Code is extracted, THE Receipt_Validator SHALL query the Clover_Integration for the corresponding transaction
2. IF the Receipt_Code does not exist in Clover records, THEN THE Receipt_Validator SHALL reject the receipt with error message "Invalid receipt code"
3. IF the Receipt_Code has already been scanned by any customer, THEN THE Receipt_Validator SHALL reject the receipt with error message "Receipt already used"
4. THE Receipt_Validator SHALL verify that the parsed total amount matches the Clover transaction amount within $0.50 tolerance
5. THE Receipt_Validator SHALL verify that the parsed transaction date matches the Clover transaction date
6. IF validation fails, THEN THE Receipt_Validator SHALL log the failure with: customer ID, Receipt_Code, failure reason, and timestamp
7. IF validation succeeds, THEN THE Receipt_Validator SHALL mark the Receipt_Code as used and record the customer ID

### Requirement 32: Receipt Fraud Prevention

**User Story:** As an administrator, I want to prevent receipt scanning fraud, so that the loyalty program remains fair and sustainable.

#### Acceptance Criteria

1. THE Receipt_Validator SHALL prevent duplicate receipt scans by tracking used Receipt_Codes
2. THE Receipt_Validator SHALL prevent receipt sharing by allowing each Receipt_Code to be used only once
3. THE Receipt_Validator SHALL detect suspicious patterns including: multiple receipts scanned within 5 minutes, receipts from different locations scanned consecutively, and receipts with timestamps in the future
4. THE Receipt_Validator SHALL flag suspicious activity for administrator review
5. THE Receipt_Validator SHALL rate-limit receipt scanning to maximum 10 receipts per customer per day
6. THE Receipt_Validator SHALL reject receipts older than 7 days from the scan date
7. WHERE suspicious activity is detected, THE Receipt_Validator SHALL temporarily disable receipt scanning for the customer account pending review

### Requirement 33: Purchase Record Creation

**User Story:** As a customer, I want my scanned receipt to automatically update my loyalty account, so that I receive credit for my purchase without manual intervention.

#### Acceptance Criteria

1. WHEN a receipt is validated, THE Receipt_Validator SHALL create a Purchase_Record linked to the customer's Loyalty_Profile
2. THE Purchase_Record SHALL include: Receipt_Code, transaction date and time, total amount, line items, location, and scan timestamp
3. WHEN a Purchase_Record is created, THE Loyalty_Service SHALL evaluate eligibility for loyalty rewards based on purchase criteria
4. WHERE the purchase qualifies for stamps, THE Loyalty_Service SHALL add stamps to the customer's Loyalty_Profile
5. WHERE the purchase qualifies for points, THE Loyalty_Service SHALL add points to the customer's Loyalty_Profile
6. WHEN loyalty rewards are added, THE Wallet_Pass_Service SHALL update the customer's wallet pass within 5 seconds
7. WHEN loyalty rewards are added, THE Mobile_App SHALL display a success message with: stamps or points earned, new balance, and progress to next reward

### Requirement 34: Receipt Scan Confirmation

**User Story:** As a customer, I want to see confirmation of my scanned receipt, so that I know my purchase was recorded and rewards were credited.

#### Acceptance Criteria

1. WHEN a receipt is successfully validated, THE Mobile_App SHALL display a confirmation screen
2. THE confirmation screen SHALL display: transaction date and time, total amount, stamps or points earned, new loyalty balance, and progress to next reward
3. THE confirmation screen SHALL display line items from the receipt for customer verification
4. THE Mobile_App SHALL allow customers to report incorrect receipt processing
5. THE Mobile_App SHALL store receipt scan history in the purchase history section
6. THE Mobile_App SHALL allow customers to view receipt images for past scans for at least 30 days

### Requirement 35: Manual Receipt Code Entry

**User Story:** As a customer, I want to manually enter a receipt code if scanning fails, so that I can still earn loyalty rewards without perfect image quality.

#### Acceptance Criteria

1. THE Mobile_App SHALL provide a manual entry option on the receipt scanning interface
2. THE Mobile_App SHALL accept Receipt_Code input in the format "A3F7-K9M2-P5Q8" with or without hyphens
3. WHEN a Receipt_Code is manually entered, THE Receipt_Validator SHALL validate the code using the same validation rules as scanned receipts
4. THE Receipt_Validator SHALL not require OCR text validation for manually entered codes
5. WHEN a manually entered code is validated, THE Receipt_Validator SHALL retrieve transaction details from Clover_Integration
6. THE Mobile_App SHALL display the same confirmation screen for manual entry as for scanned receipts

### Requirement 36: Receipt Scanning Analytics

**User Story:** As an administrator, I want to view analytics about receipt scanning usage, so that I can understand adoption and identify issues.

#### Acceptance Criteria

1. THE CRM_System SHALL display receipt scanning analytics including: total scans, successful scans, failed scans, fraud attempts, and average processing time
2. THE CRM_System SHALL display receipt scanning adoption rate (percentage of customers who have scanned at least one receipt)
3. THE CRM_System SHALL display common failure reasons with counts
4. THE CRM_System SHALL allow administrators to filter analytics by: date range, location, and customer segment
5. THE CRM_System SHALL display trend charts for receipt scanning volume over time
6. THE CRM_System SHALL allow exporting receipt scanning data for external analysis

### Requirement 37: Receipt Scanning Eligibility Rules

**User Story:** As an administrator, I want to configure which purchases qualify for loyalty rewards via receipt scanning, so that I can align with business rules and promotions.

#### Acceptance Criteria

1. THE Loyalty_Service SHALL allow administrators to define eligibility rules for receipt scanning rewards
2. THE Loyalty_Service SHALL support eligibility criteria including: minimum purchase amount, eligible product categories, excluded items, and time-based promotions
3. WHEN a receipt is validated, THE Loyalty_Service SHALL evaluate all eligibility rules before awarding rewards
4. THE Loyalty_Service SHALL allow administrators to configure: stamps per qualifying purchase, points per dollar spent, and bonus multipliers for specific items
5. WHERE a purchase does not meet eligibility criteria, THE Mobile_App SHALL display an explanation message
6. THE Loyalty_Service SHALL log all eligibility evaluations with: Receipt_Code, rules applied, and outcome

### Requirement 38: Clover POS Integration Architecture

**User Story:** As a developer, I want a robust integration with Clover POS, so that receipt codes are reliably generated and transaction data is accessible for validation.

#### Acceptance Criteria

1. THE Clover_Integration SHALL use Clover REST API for transaction data retrieval
2. THE Clover_Integration SHALL use Clover Print API or receipt customization to add Receipt_Codes to printed receipts
3. THE Clover_Integration SHALL implement webhook listeners for real-time transaction notifications
4. WHEN a transaction is completed in Clover, THE Clover_Integration SHALL receive a webhook notification within 5 seconds
5. THE Clover_Integration SHALL store transaction data in the Customer_Account_System database for fast validation lookups
6. THE Clover_Integration SHALL implement retry logic with exponential backoff for failed API calls
7. THE Clover_Integration SHALL handle Clover API rate limits gracefully without data loss

### Requirement 39: Receipt Image Storage and Privacy

**User Story:** As a customer, I want my receipt images handled securely, so that my purchase information remains private.

#### Acceptance Criteria

1. THE Receipt_Scanner SHALL encrypt receipt images during upload using TLS 1.3 or higher
2. THE Receipt_Scanner SHALL store receipt images in secure cloud storage with encryption at rest
3. THE Receipt_Scanner SHALL delete receipt images after 30 days
4. THE Receipt_Scanner SHALL allow customers to delete their receipt images immediately after successful processing
5. THE Receipt_Scanner SHALL not share receipt images with third parties except the OCR_Service
6. THE Receipt_Scanner SHALL comply with PCI DSS requirements for handling payment card information visible on receipts
7. THE Receipt_Scanner SHALL redact or blur payment card numbers in stored receipt images

### Requirement 40: Offline Receipt Scanning

**User Story:** As a customer, I want to scan receipts when offline, so that I can process them later when I have internet connectivity.

#### Acceptance Criteria

1. WHERE the Mobile_App detects no internet connectivity, THE Receipt_Scanner SHALL allow receipt capture and queue for later processing
2. THE Mobile_App SHALL store queued receipt images locally with encryption
3. WHEN internet connectivity is restored, THE Receipt_Scanner SHALL automatically process queued receipts
4. THE Mobile_App SHALL display queued receipts with "Pending" status in the purchase history
5. THE Mobile_App SHALL notify customers when queued receipts are successfully processed
6. THE Mobile_App SHALL limit offline queue to maximum 10 receipts to prevent storage issues

