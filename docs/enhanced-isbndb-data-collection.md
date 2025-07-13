# Enhanced ISBNdb Data Collection System

## Overview

This system provides comprehensive data collection from the ISBNdb API, capturing ALL available fields and providing detailed analytics about data quality and completeness.

## Available Data Fields

Based on the ISBNdb API documentation, the system collects the following comprehensive data:

### Core Book Information
- `title` - Book title
- `title_long` - Extended book title
- `isbn` - ISBN-10 identifier
- `isbn13` - ISBN-13 identifier

### Classification and Metadata
- `dewey_decimal` - Dewey Decimal Classification numbers
- `binding` - Book binding type (hardcover, paperback, etc.)
- `publisher` - Publisher name
- `language` - Language code (ISO-639 format)
- `date_published` - Publication date
- `edition` - Edition information

### Physical Characteristics
- `pages` - Number of pages
- `dimensions` - Physical dimensions as string
- `dimensions_structured` - Structured dimension data:
  - `length` - Length with unit and value
  - `width` - Width with unit and value
  - `height` - Height with unit and value
  - `weight` - Weight with unit and value

### Content and Description
- `overview` - Book overview/summary
- `excerpt` - Book excerpt
- `synopsis` - Detailed synopsis

### Media and Images
- `image` - Cover image URL
- `image_original` - High-quality cover image URL (valid for 2 hours)

### Pricing and Commerce
- `msrp` - Manufacturer's Suggested Retail Price
- `prices` - Real-time pricing information (Pro plan only):
  - `condition` - Book condition
  - `merchant` - Merchant name
  - `merchant_logo` - Merchant logo URL
  - `merchant_logo_offset` - Logo positioning
  - `shipping` - Shipping information
  - `price` - Book price
  - `total` - Total price including shipping
  - `link` - Purchase link

### Relationships and Metadata
- `authors` - Array of author names
- `subjects` - Array of subject categories
- `reviews` - Array of review texts
- `related` - Related book information
- `other_isbns` - Other ISBNs for the same book:
  - `isbn` - ISBN number
  - `binding` - Binding type

## API Endpoints

### 1. Comprehensive Data Collection
**Endpoint:** `POST /api/isbn/comprehensive-data-collection`

Collects ALL available data from ISBNdb for given ISBNs.

**Request Body:**
```json
{
  "isbns": ["9780123456789", "9780987654321"],
  "withPrices": false,
  "includeStats": true,
  "storeInDatabase": false
}
```

**Response:**
```json
{
  "books": [...],
  "summary": {
    "totalRequested": 2,
    "totalFound": 2,
    "totalNotFound": 0,
    "successRate": "100.0%",
    "dataFieldsCollected": 15,
    "processingTime": "1250ms"
  },
  "stats": {
    "dataFieldsCollected": ["title", "isbn", "isbn13", "authors", ...],
    "missingFields": ["prices"],
    "dataQuality": {
      "completeRecords": 1,
      "partialRecords": 1,
      "minimalRecords": 0
    },
    "fieldBreakdown": {
      "title": 2,
      "isbn": 2,
      "authors": 2
    }
  }
}
```

### 2. Enhanced ISBN Fetch
**Endpoint:** `POST /api/isbn/fetch-by-isbn`

Enhanced version with comprehensive data collection.

**Request Body:**
```json
{
  "isbns": ["9780123456789"],
  "withPrices": true
}
```

### 3. Enhanced Year-based Fetch
**Endpoint:** `GET /api/isbn/fetch-by-year`

Enhanced version with comprehensive data collection.

**Query Parameters:**
- `year` - Publication year
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20)
- `searchType` - 'recent' or 'year' (default: 'recent')
- `withPrices` - Include pricing data (default: false)

## Data Quality Analysis

The system provides comprehensive data quality analysis:

### Data Quality Levels
- **Complete Records**: 80%+ of expected fields present
- **Partial Records**: 50-79% of expected fields present
- **Minimal Records**: <50% of expected fields present

### Field Coverage Analysis
- Tracks which fields are present across all books
- Identifies missing fields
- Provides field-by-field breakdown

### Success Metrics
- Success rate for data retrieval
- Processing time analysis
- Database storage success rate

## Database Integration

### Storage Strategy
1. **Raw Data Storage**: All ISBNdb data stored in `raw_isbndb_data` JSONB field
2. **Structured Storage**: Key fields extracted to dedicated columns
3. **Relationship Processing**: Authors and subjects linked to separate tables
4. **Version Tracking**: ISBNdb API version and last update timestamp

### Database Schema Extensions
The system uses existing database functions:
- `process_complete_isbndb_book_data()` - Processes comprehensive ISBNdb data
- `books_complete` view - Provides unified view of all book data

## Usage Examples

### Basic Data Collection
```javascript
const response = await fetch('/api/isbn/comprehensive-data-collection', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    isbns: ['9780123456789'],
    withPrices: false,
    includeStats: true
  })
});
```

### Search with Comprehensive Data
```javascript
const response = await fetch('/api/isbn/comprehensive-data-collection?query=programming&withPrices=true&includeStats=true');
```

### Year-based Collection
```javascript
const response = await fetch('/api/isbn/fetch-by-year?year=2024&withPrices=true&pageSize=50');
```

## Enterprise Features

### 1. Data Quality Monitoring
- Real-time data quality scoring
- Field coverage analysis
- Missing data identification

### 2. Performance Optimization
- Batch processing capabilities
- Rate limiting compliance
- Error handling and retry logic

### 3. Analytics and Reporting
- Processing time tracking
- Success rate monitoring
- Data completeness metrics

### 4. Database Integration
- Automatic author/subject linking
- Comprehensive data storage
- Version control and audit trails

## Best Practices

### 1. Rate Limiting
- Respect ISBNdb API limits (1 request/second for Basic plan)
- Use batch processing for multiple ISBNs
- Implement exponential backoff for retries

### 2. Data Quality
- Always check `includeStats` for quality analysis
- Monitor missing fields for data gaps
- Use `withPrices` only when needed (Pro plan required)

### 3. Error Handling
- Check response status and error messages
- Implement retry logic for failed requests
- Log errors for debugging

### 4. Database Storage
- Use `storeInDatabase: true` for permanent storage
- Monitor storage success rates
- Check for duplicate ISBNs

## API Plan Considerations

### Basic Plan
- 1 request per second limit
- No pricing data available
- Up to 100 ISBNs per bulk request

### Pro Plan
- 5 requests per second limit
- Pricing data available with `withPrices=true`
- Up to 1,000 ISBNs per bulk request

### Premium Plan
- 3 requests per second limit
- Pricing data available
- Up to 1,000 ISBNs per bulk request

## Troubleshooting

### Common Issues
1. **API Key Errors**: Check environment variables
2. **Rate Limiting**: Implement delays between requests
3. **Missing Data**: Some books may not have complete data
4. **Database Errors**: Check foreign key constraints

### Debug Information
- Enable `includeStats: true` for detailed analysis
- Check console logs for field collection information
- Monitor processing times for performance issues

## Future Enhancements

1. **Caching Layer**: Implement Redis caching for frequently accessed data
2. **Background Processing**: Queue-based processing for large datasets
3. **Data Enrichment**: Combine with other book data sources
4. **Real-time Updates**: Webhook integration for data updates
5. **Advanced Analytics**: Machine learning for data quality prediction 