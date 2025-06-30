# ContentSection Pattern

## Overview

The `ContentSection` component is the standardized way to create consistent content sections across the application. It provides a uniform header with border-bottom styling, proper spacing, and support for various content types.

## Why ContentSection?

- **Semantic Naming**: Unlike `SidebarSection`, `ContentSection` accurately describes its purpose
- **Consistent Styling**: All sections have the same header styling with border-bottom line
- **Flexible**: Supports headers, footers, expandable content, and various content types
- **Maintainable**: Centralized styling makes updates easier across the application

## Usage

### Basic Usage

```tsx
import { ContentSection } from "@/components/ui/content-section"

<ContentSection title="Section Title">
  <div>Your content here</div>
</ContentSection>
```

### With Header Actions

```tsx
<ContentSection
  title="Book Details"
  headerRight={
    <Button variant="ghost" size="sm" asChild>
      <Link href="/edit">Edit</Link>
    </Button>
  }
>
  <div>Content with header action</div>
</ContentSection>
```

### With Footer

```tsx
<ContentSection
  title="More Books"
  footer={
    <div className="text-center">
      <Button variant="outline">View All</Button>
    </div>
  }
>
  <div>Content with footer</div>
</ContentSection>
```

### Expandable Content

```tsx
<ContentSection
  title="About"
  isExpandable
  defaultExpanded={false}
>
  <div>Long content that can be expanded/collapsed</div>
</ContentSection>
```

## Page-Specific Class Names

Each page should use descriptive class names following this pattern:

### Books Page
- `book-page` - Main container
- `book-page__content` - Content wrapper
- `book-page__timeline-tab` - Timeline tab container
- `book-page__details-tab` - Details tab container
- `book-page__sidebar` - Left sidebar
- `book-page__main-content` - Main content area
- `book-page__about-section` - About section
- `book-page__followers-section` - Followers section
- `book-page__book-details-section` - Book details section
- `book-page__more-books-section` - More books section
- `book-page__reviews-section` - Reviews section
- `book-page__photos-section` - Photos section
- `book-page__groups-section` - Groups section
- `book-page__pages-section` - Pages section

### Authors Page
- `author-page` - Main container
- `author-page__content` - Content wrapper
- `author-page__timeline-tab` - Timeline tab container
- `author-page__about-tab` - About tab container
- `author-page__sidebar` - Left sidebar
- `author-page__main-content` - Main content area
- `author-page__about-section` - About section
- `author-page__followers-section` - Followers section
- `author-page__books-section` - Books section
- `author-page__reviews-section` - Reviews section

### Publishers Page
- `publisher-page` - Main container
- `publisher-page__content` - Content wrapper
- `publisher-page__timeline-tab` - Timeline tab container
- `publisher-page__about-tab` - About tab container
- `publisher-page__sidebar` - Left sidebar
- `publisher-page__main-content` - Main content area
- `publisher-page__about-section` - About section
- `publisher-page__followers-section` - Followers section
- `publisher-page__books-section` - Books section

### Profile Page
- `profile-page` - Main container
- `profile-page__content` - Content wrapper
- `profile-page__timeline-tab` - Timeline tab container
- `profile-page__about-tab` - About tab container
- `profile-page__sidebar` - Left sidebar
- `profile-page__main-content` - Main content area
- `profile-page__about-section` - About section
- `profile-page__currently-reading-section` - Currently reading section
- `profile-page__photos-section` - Photos section
- `profile-page__friends-section` - Friends section

### Groups Page
- `group-page` - Main container
- `group-page__content` - Content wrapper
- `group-page__timeline-tab` - Timeline tab container
- `group-page__about-tab` - About tab container
- `group-page__sidebar` - Left sidebar
- `group-page__main-content` - Main content area
- `group-page__about-section` - About section
- `group-page__followers-section` - Followers section
- `group-page__members-section` - Members section
- `group-page__events-section` - Events section

## Migration Guide

### From SidebarSection to ContentSection

1. **Update Import**:
   ```tsx
   // Old
   import { SidebarSection } from "@/components/ui/sidebar-section"
   
   // New
   import { ContentSection } from "@/components/ui/content-section"
   ```

2. **Update Component Usage**:
   ```tsx
   // Old
   <SidebarSection title="Section Title">
     <div>Content</div>
   </SidebarSection>
   
   // New
   <ContentSection title="Section Title">
     <div>Content</div>
   </ContentSection>
   ```

3. **Add Descriptive Class Names**:
   ```tsx
   <ContentSection 
     title="Section Title"
     className="page-name__section-name"
   >
     <div>Content</div>
   </ContentSection>
   ```

## Benefits

1. **Consistency**: All sections look and behave the same way
2. **Maintainability**: Changes to section styling are centralized
3. **Semantic Clarity**: Component name accurately describes its purpose
4. **Flexibility**: Supports various use cases with props
5. **Accessibility**: Built-in accessibility features
6. **Performance**: Optimized rendering and state management

## Best Practices

1. **Always use descriptive class names** for each section
2. **Use headerRight for actions** instead of custom header layouts
3. **Use footer for action buttons** at the bottom of sections
4. **Use isExpandable for long content** that should be collapsible
5. **Keep content focused** - one main purpose per section
6. **Use consistent spacing** - let the component handle padding/margins

## Implementation Status

- ✅ Books Page - Fully migrated
- 🔄 Authors Page - Needs migration
- 🔄 Publishers Page - Needs migration
- 🔄 Profile Page - Needs migration
- 🔄 Groups Page - Needs migration
- 🔄 Photos Page - Needs migration
- 🔄 Discussions Page - Needs migration 