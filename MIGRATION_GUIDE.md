# PageContainer Migration Guide

## Overview

This guide describes how to migrate existing pages to use the new `PageContainer` component, which provides consistent page headers with titles and descriptions across the application.

## Why This Change

1. **Consistency**: Ensures headers look the same across all pages
2. **Removes duplication**: Prevents the PageHeader from being rendered twice
3. **Simplifies page components**: Reduces boilerplate in each page
4. **Centralizes layout control**: Makes future global UI changes easier

## Migration Steps

For each page in your application, follow these steps:

### 1. Import the PageContainer component

```jsx
import { PageContainer } from "@/components/page-container"
```

### 2. Remove the existing PageHeader import and usage

Remove:
```jsx
import { PageHeader } from "@/components/page-header"
// ...
<PageHeader />
```

### 3. Replace page wrapping elements with PageContainer

Replace:
```jsx
<div className="min-h-screen flex flex-col">
  <PageHeader />
  <main className="flex-1 container mx-auto py-8">
    {/* Page content */}
  </main>
</div>
```

With:
```jsx
<PageContainer title="Your Page Title" description="Optional page description">
  {/* Page content */}
</PageContainer>
```

### 4. Remove duplicate h1 headings

If your page had both a `<PageHeader />` and its own `<h1>` heading, remove the duplicate heading. The title will now be handled by the PageContainer.

Remove:
```jsx
<h1 className="text-3xl font-bold">Title</h1>
```

## Example Migration

### Before:

```jsx
export default function BooksPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader />
      <main className="flex-1 container py-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Books</h1>
          {/* Rest of page content */}
        </div>
      </main>
    </div>
  )
}
```

### After:

```jsx
export default function BooksPage() {
  return (
    <PageContainer title="Books">
      <div className="space-y-6">
        {/* Rest of page content */}
      </div>
    </PageContainer>
  )
}
```

## Special Cases

### Detail Pages with Dynamic Titles

For pages that need dynamic titles (like book detail pages), pass the dynamic values to the title and description props:

```jsx
export default async function BookPage({ params }) {
  const bookId = params.id
  const book = await getBookById(bookId)
  
  return (
    <PageContainer 
      title={book.title} 
      description={`Published by ${book.publisher} (${book.year})`}
    >
      {/* Book details content */}
    </PageContainer>
  )
}
```

## Custom Layouts

If a page needs a custom layout that differs from the standard PageContainer, you can still use PageHeader directly with the title and description props:

```jsx
<div className="custom-layout">
  <PageHeader title="Custom Page" description="With custom layout" />
  {/* Custom layout content */}
</div>
``` 