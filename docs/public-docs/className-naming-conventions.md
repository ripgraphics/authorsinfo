# className Naming Conventions

## Overview

This document defines the standard naming convention for CSS classNames across the entire application. Following this convention ensures components are easily identifiable in React DevTools, browser inspector, and debugging tools.

## Naming Standard

### Format
```
{component-or-page-name}__{element-description}
```

### Pattern
- **BEM-inspired**: Block Element Modifier style naming
- **Semantic**: Names describe purpose, not appearance
- **Descriptive**: Clear about what the element represents
- **Kebab-case**: All lowercase with hyphens

## Rules

### 1. Component-Scoped Naming
For reusable components, use the component name as the block:

```tsx
// Component: FriendRequestsWidget
<div className="friend-requests-widget">
  <div className="friend-requests-widget__header">
    <div className="friend-requests-widget__title">...</div>
  </div>
  <div className="friend-requests-widget__content">
    <div className="friend-requests-widget__request-item">...</div>
  </div>
</div>
```

### 2. Page-Scoped Naming
For page-specific layouts, use the page name as the block:

```tsx
// Page: Home (app/page.tsx)
<div className="home-page">
  <div className="home-page__navigation-buttons">...</div>
  <div className="home-page__content-grid">
    <div className="home-page__featured-events-column">...</div>
    <div className="home-page__friend-requests-column">...</div>
  </div>
</div>
```

### 3. Combining with Tailwind Utilities
Always combine semantic classNames with Tailwind utilities using the `cn()` utility:

```tsx
import { cn } from "@/lib/utils"

<div className={cn(
  "home-page__content-grid",        // Semantic name
  "grid grid-cols-1 lg:grid-cols-4 gap-6"  // Tailwind utilities
)}>
```

### 4. Element Descriptions
Use clear, descriptive names for elements:
- ✅ `friend-requests-widget__request-item`
- ✅ `home-page__featured-events-column`
- ✅ `book-page__sidebar`
- ❌ `friend-requests-widget__item` (too generic)
- ❌ `home-page__col` (not descriptive)

## Common Patterns

### Grid Layouts
```tsx
<div className={cn("page-name__grid", "grid grid-cols-1 md:grid-cols-2 gap-4")}>
  {items.map(item => (
    <div key={item.id} className={cn("page-name__grid-item", "...")}>
      {item.content}
    </div>
  ))}
</div>
```

### Containers/Wrappers
```tsx
<div className={cn("component-name__container", "container mx-auto px-4")}>
  {/* content */}
</div>
```

### Headers
```tsx
<header className={cn("component-name__header", "flex items-center justify-between")}>
  <h2 className={cn("component-name__title", "text-2xl font-bold")}>Title</h2>
</header>
```

### Lists/Items
```tsx
<ul className={cn("component-name__list", "space-y-2")}>
  {items.map(item => (
    <li key={item.id} className={cn("component-name__list-item", "...")}>
      {item.content}
    </li>
  ))}
</ul>
```

### Buttons
```tsx
<Button className={cn("component-name__action-button", "...")}>
  Action
</Button>
```

### Form Elements
```tsx
<input className={cn("component-name__input", "w-full px-4 py-2")} />
<label className={cn("component-name__label", "block text-sm")}>Label</label>
```

## Examples

### Home Page (app/page.tsx)
```tsx
<div className={cn("home-page", "space-y-8")}>
  <div className={cn("home-page__navigation-buttons", "flex justify-center gap-4")}>
    {/* buttons */}
  </div>
  <div className={cn("home-page__content-grid", "grid grid-cols-1 lg:grid-cols-4 gap-6")}>
    <div className={cn("home-page__featured-events-column", "lg:col-span-3")}>
      <FeaturedEvents />
    </div>
    <div className={cn("home-page__friend-requests-column", "lg:col-span-1")}>
      <FriendRequestsWidget />
    </div>
  </div>
</div>
```

### Friend Requests Widget (components/friend-requests-widget.tsx)
```tsx
<Card className={cn("friend-requests-widget", className)}>
  <CardHeader className={cn("friend-requests-widget__header", "pb-3")}>
    <CardTitle className={cn("friend-requests-widget__title", "...")}>
      Friend Requests
    </CardTitle>
  </CardHeader>
  <CardContent className={cn("friend-requests-widget__content", "space-y-3")}>
    {requests.map(request => (
      <div key={request.id} className={cn("friend-requests-widget__request-item", "...")}>
        {/* request content */}
      </div>
    ))}
  </CardContent>
</Card>
```

### Featured Events (components/featured-events.tsx)
```tsx
<section className={cn("featured-events", "py-12 bg-gray-50")}>
  <div className={cn("featured-events__container", "container mx-auto px-4 max-w-6xl")}>
    <div className={cn("featured-events__header", "...")}>
      <h2 className={cn("featured-events__title", "...")}>Upcoming Events</h2>
    </div>
    <div className={cn("featured-events__grid", "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6")}>
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  </div>
</section>
```

## Page-Specific Naming Reference

### Home Page (`home-page`)
- `home-page` - Main container
- `home-page__navigation-buttons` - Top navigation buttons
- `home-page__content-tabs` - Tabs container
- `home-page__tabs-list` - Tabs list
- `home-page__books-tab` - Books tab content
- `home-page__authors-tab` - Authors tab content
- `home-page__publishers-tab` - Publishers tab content
- `home-page__content-grid` - Main content grid layout
- `home-page__featured-events-column` - Featured events column
- `home-page__friend-requests-column` - Friend requests column
- `home-page__recent-books` - Recent books section
- `home-page__books-grid` - Books grid layout
- `home-page__books-view-all` - View all books button wrapper
- `home-page__recent-authors` - Recent authors section
- `home-page__authors-grid` - Authors grid layout
- `home-page__authors-view-all` - View all authors button wrapper
- `home-page__recent-publishers` - Recent publishers section
- `home-page__publishers-grid` - Publishers grid layout
- `home-page__publishers-view-all` - View all publishers button wrapper

### Books Page (`book-page`)
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

### Authors Page (`author-page`)
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

### Publishers Page (`publisher-page`)
- `publisher-page` - Main container
- `publisher-page__content` - Content wrapper
- `publisher-page__timeline-tab` - Timeline tab container
- `publisher-page__about-tab` - About tab container
- `publisher-page__sidebar` - Left sidebar
- `publisher-page__main-content` - Main content area
- `publisher-page__about-section` - About section
- `publisher-page__followers-section` - Followers section
- `publisher-page__books-section` - Books section

### Profile Page (`profile-page`)
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

### Groups Page (`group-page`)
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

## Component-Specific Naming Reference

### Friend Requests Widget (`friend-requests-widget`)
- `friend-requests-widget` - Main widget container
- `friend-requests-widget__header` - Widget header
- `friend-requests-widget__title` - Widget title
- `friend-requests-widget__title-content` - Title content wrapper
- `friend-requests-widget__badge` - Request count badge
- `friend-requests-widget__content` - Widget content area
- `friend-requests-widget__request-item` - Individual request item
- `friend-requests-widget__request-info` - Request info section
- `friend-requests-widget__request-avatar` - Request avatar
- `friend-requests-widget__request-details` - Request details wrapper
- `friend-requests-widget__request-name` - Request user name
- `friend-requests-widget__request-time` - Request time ago text
- `friend-requests-widget__request-actions` - Request action buttons
- `friend-requests-widget__accept-button` - Accept button
- `friend-requests-widget__reject-button` - Reject button
- `friend-requests-widget__footer` - Widget footer
- `friend-requests-widget__view-all-button` - View all requests button
- `friend-requests-widget__loading-content` - Loading state content
- `friend-requests-widget__loading-spinner` - Loading spinner wrapper

### Featured Events (`featured-events`)
- `featured-events` - Main section container
- `featured-events__container` - Inner container
- `featured-events__header` - Section header
- `featured-events__title-wrapper` - Title wrapper
- `featured-events__title` - Section title
- `featured-events__view-all-link` - View all events link
- `featured-events__grid` - Events grid layout
- `featured-events__empty-state` - Empty state container
- `featured-events__empty-message` - Empty state message
- `featured-events__create-link` - Create event link

## Migration Checklist

When updating components to follow this convention:

- [ ] Import `cn` utility from `@/lib/utils`
- [ ] Identify the component/page name for the block
- [ ] Add semantic className to root element
- [ ] Add semantic classNames to major child elements
- [ ] Combine semantic names with Tailwind utilities using `cn()`
- [ ] Test that styling remains unchanged
- [ ] Verify classNames appear correctly in browser DevTools
- [ ] Update any related documentation

## Benefits

1. **Debugging**: Easy to identify components in React DevTools and browser inspector
2. **Maintainability**: Clear structure makes code easier to understand and modify
3. **Consistency**: Uniform naming across the entire application
4. **Scalability**: Pattern works for any component size or complexity
5. **Developer Experience**: Faster navigation and debugging during development

## Best Practices

1. **Always use `cn()`** to combine semantic names with Tailwind utilities
2. **Be descriptive** - names should clearly indicate purpose
3. **Use kebab-case** - consistent with CSS conventions
4. **Scope appropriately** - component-scoped for reusable components, page-scoped for layouts
5. **Don't skip semantic names** - even simple elements benefit from descriptive names
6. **Maintain Tailwind utilities** - semantic names don't replace styling utilities

## Questions?

If you're unsure about naming:
1. Check this document first
2. Look for similar patterns in existing components
3. Ask: "What is this element's purpose?" - name it accordingly
4. When in doubt, be more descriptive rather than less

