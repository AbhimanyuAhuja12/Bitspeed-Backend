# Bitespeed Identity Reconciliation Backend

A production-grade TypeScript backend service for identity reconciliation using Node.js, Express, and PostgreSQL.

## Features

- **MVC Architecture**: Clean separation of concerns with controllers, services, and models
- **SOLID Principles**: Well-structured, maintainable code following SOLID design principles
- **TypeScript**: Full type safety and modern JavaScript features
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **Logging**: Comprehensive logging with Winston
- **Error Handling**: Global error handling with custom error types
- **Validation**: Request validation middleware
- **Security**: Helmet and CORS for security headers
- **Code Quality**: ESLint and Prettier for consistent code formatting

## API Endpoints

### POST /identify

Identifies and reconciles contact information based on email and/or phone number.

**Request Body:**
```json
{
  "email": "optional@example.com",
  "phoneNumber": "optional_phone"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["primaryEmail", "otherEmail1"],
    "phoneNumbers": ["primaryPhone", "otherPhone1"],
    "secondaryContactIds": [2, 3]
  }
}
```

### GET /health

Health check endpoint to verify service status.

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AbhimanyuAhuja12/Bitspeed-Backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your database connection string and other configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/bitespeed_db"
   PORT=3000
   NODE_ENV=development
   LOG_LEVEL=info
   ```

4. **Database Setup:**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Or run migrations (for production)
   npm run db:migrate
   ```

5. **Build the project:**
   ```bash
   npm run build
   ```

### Running the Application

**Development mode:**
```bash
npm run dev
```


The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## Project Structure

```
src/
├── config/
│   └── database.ts          # Database configuration and connection
├── controllers/
│   └── contact.controller.ts # Request handlers
├── middlewares/
│   ├── error.middleware.ts   # Global error handling
│   └── validation.middleware.ts # Request validation
├── routes/
│   └── contact.routes.ts     # Route definitions
├── services/
│   └── contact.service.ts    # Business logic
├── types/
│   ├── contact.types.ts      # Contact-related types
│   └── error.types.ts        # Error types
├── utils/
│   ├── errorHandler.ts       # Error utility functions
│   └── logger.ts             # Winston logger configuration
├── app.ts                    # Express app setup
└── index.ts                  # Application entry point
```

## Business Logic

The identity reconciliation system works as follows:

1. **Contact Linking**: Contacts are linked if they share the same email or phone number
2. **Primary/Secondary Hierarchy**: The oldest contact (by `createdAt`) becomes primary, others become secondary
3. **New Contact Creation**: If no matching contact exists, a new primary contact is created
4. **Secondary Contact Creation**: If new information is provided for an existing contact, a secondary contact is created
5. **Primary Contact Merging**: If two different primary contacts match the email and phone respectively, they are merged with the oldest becoming primary

## Scripts

- `npm run build` - Build the TypeScript project
- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot reload
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations

## Testing

You can test the API using curl, Postman, or any HTTP client:

```bash
# Test the identify endpoint
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "phoneNumber": "1234567890"}'

# Health check
curl http://localhost:3000/health
```

## Logging

The application uses Winston for logging with the following features:

- **File Logging**: Separate files for errors and combined logs
- **Console Logging**: Colorized console output in development
- **Structured Logging**: JSON format for easy parsing
- **Log Levels**: Configurable log levels via environment variables

Logs are stored in the `logs/` directory:
- `error.log` - Error level logs only
- `combined.log` - All log levels

## Error Handling

The application implements comprehensive error handling:

- **Custom Error Classes**: `AppError` class for operational errors
- **Global Error Middleware**: Centralized error handling
- **Validation Errors**: Proper validation with meaningful error messages
- **HTTP Status Codes**: Consistent use of standard HTTP status codes
- **Error Logging**: All errors are logged with context information


## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
