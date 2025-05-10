# Database Migrations

This directory contains SQL migration files to set up the database schema and functions.

## Available Migrations

1. `activity-triggers.sql` - Sets up triggers for generating activities for various entities
2. `table-info-function.sql` - Adds a utility function to query table schema information
3. `add_entity_id_columns.sql` - Adds dedicated columns for user profiles, groups, and events to the activities table
4. `event_system.sql` - Creates a comprehensive event management system
5. `event_system_enhancement.sql` - Adds advanced ticketing, payment processing, and permission controls
6. `event_system_advanced_features.sql` - Adds livestreaming, waitlists, feedback, and more enterprise features

## How to Apply Migrations

### Using the Supabase Web Interface

1. Open your Supabase project dashboard
2. Navigate to the "SQL Editor" section
3. Create a new query
4. Copy and paste the contents of the migration file you want to run
5. Execute the query

### Using the Supabase CLI

If you have the Supabase CLI installed, you can run:

```bash
supabase db push --db-url <your-db-url>
```

## Troubleshooting

If you encounter the error "Could not find the function public.get_table_columns(table_name_param) in the schema cache", apply the `table-info-function.sql` migration which creates this function.

## Schema Best Practices

We follow these best practices for database schema design:

1. **Use dedicated columns for entity IDs** - This provides better performance, data integrity, and query simplicity
2. **Add foreign key constraints** - Ensures referential integrity between tables
3. **Create indexes for frequently queried columns** - Improves query performance
4. **Use JSONB for flexible attributes** - Store additional metadata in the data column

## Event System

The `event_system.sql` migration creates a comprehensive event management system with the following features:

### Core Components
- Events (physical, virtual, and hybrid)
- Event categories and types
- Event sessions and speakers
- Event locations and virtual meeting info
- Recurring events with pattern definition

### User Interaction
- Event registration and attendance tracking
- Session-specific registration
- Interest tracking (interested, maybe)
- Event likes, shares, and comments
- Personalized event recommendations

### Integration
- Integration with books, authors, publishers, and groups
- Featured books for events
- User notifications for followed authors' events
- Activity timeline integration

### Analytics and Reporting
- Event view tracking
- Daily analytics aggregation
- Trending/popular events view
- User interest-based recommendations

## Event System Enhancements

The `event_system_enhancement.sql` migration adds enterprise-level features to the base event system:

### Advanced Ticketing
- Multiple ticket types/tiers with different price points
- Ticket benefits and features per ticket type
- Promo codes and discounts
- QR codes and digital tickets
- Ticket quantity management
- Sales periods with start/end dates
- Private/invite-only tickets with access codes

### Payment Processing
- Support for multiple payment methods (credit card, PayPal, etc.)
- Complete transaction tracking
- Refund management
- Invoice generation
- Tax handling
- Receipt generation

### Event Creator Controls
- Permission-based event creation
- Approval workflows for user-created events
- Category-specific permissions
- Staff/organizer role management
- Paid event permissions

### Financial Management
- Complete financial reporting
- Revenue tracking by ticket type
- Fee calculations
- Tax reporting
- Payout tracking

## Advanced Event Features

The `event_system_advanced_features.sql` migration adds high-value additions for a complete enterprise platform:

### Livestreaming Integration
- Support for multiple streaming providers (YouTube, Vimeo, Twitch, etc.)
- Stream key and URL management
- Recording storage
- Viewer metrics
- Ticket-gated access control

### Waitlist Management
- Automatic waitlist position management
- Waitlist notifications when tickets become available
- Conversion tracking
- Per-ticket-type waitlists

### Event Feedback System
- Customizable surveys with multiple question types
- Anonymous feedback options
- Required question enforcement
- Response analytics and satisfaction tracking

### Author Reading Series
- Group related events into series
- Series-level metrics and analytics
- Automatic numbering of events within series
- Author and publisher association

### Event Sponsorship
- Multi-tier sponsor management (platinum, gold, silver, etc.)
- Sponsor benefits tracking
- Financial contribution recording
- Featured sponsor highlighting

### Advanced Analytics
- Performance metrics views
- Series performance tracking
- Author event metrics
- Satisfaction and engagement analytics

### Real-time Event Chat
- Event-specific chat rooms
- Moderation controls
- Ticket-gated access
- Message management

This enhanced system provides enterprise-level event management capabilities similar to platforms like Eventbrite or Meetup, while integrating seamlessly with the book platform's existing features. 