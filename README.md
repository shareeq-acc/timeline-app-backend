# Timeline Application

[API Hosted Link](https://timeline-backend-tau.vercel.app/api/auth)

[Video: Code Demo](https://drive.google.com/file/d/1ZtrU5Pyi-TqShoUQ56YDwEp3uSvWg2Sv/view) 

[Video: Postman Demo](https://drive.google.com/file/d/1dEJC5X80AJUCl9ifMHQlIRGUK__2_0DH/view)

A robust timeline management application that allows users to create, manage, and share different types of timelines. Built with Node.js, Express, TypeScript, and PostgreSQL.

## Features

- **User Authentication**
  - Secure JWT-based authentication
  - User registration and login
  - Token refresh mechanism

- **Timeline Management**
  - Create different types of timelines (Roadmap, Project)
  - Set timeline visibility (public/private)
  - Support for daily, weekly, and monthly time units
  - Timeline forking capabilities
  - Version tracking
  - Enable/disable scheduling for timelines

- **Segment Management**
  - Create and manage timeline segments
  - Set segment goals and references
  - Sequential segment scheduling
  - Segment completion tracking
  - Bulk segment creation
  - Segment forking support

- **Data Organization**
  - Structured timeline segments
  - Flexible duration settings
  - Rich text descriptions
  - AI-generated timeline support

## Tech Stack

- **Backend**
  - Node.js
  - Express.js
  - TypeScript
  - PostgreSQL
  - JWT Authentication

- **Development Tools**
  - TypeScript for type safety
  - ESLint for code quality
  - Prettier for code formatting
  - Jest for testing

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_USER=your_db_user
DB_HOST=localhost
DB_NAME=your_db_name
DB_PASS=your_db_password
DB_PORT=5432

# JWT Configuration
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/shareeq-acc/timeline-app-backend
cd timeline-application
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up the database:
```bash
npm run db:setup
# or
yarn db:setup
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## API Endpoints

Full Api Documentation: [Api Documentation](https://frost-petroleum-f94.notion.site/API-Documentation-Timeline-App-1b06b12c876680388e5ecbe541130a30) 

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token

### Timelines
- `POST /api/timelines` - Create a new timeline
- `GET /api/timelines` - Get user's timelines
- `GET /api/timelines/:id` - Get timeline by ID
- `POST /api/timelines/:id/fork` - Fork a timeline

### Segments
- `POST /api/segments` - Create a new segment
- `POST /api/segments/bulk` - Create multiple segments
- `GET /api/segments/:segmentId` - Get segment by ID
- `GET /api/segments/timeline/:timelineId` - Get segments by timeline ID
- `PUT /api/segments/:segmentId` - Update segment
- `DELETE /api/segments/:segmentId` - Delete segment
- `PUT /api/segments/:segmentId/complete` - Mark segment as complete
- `POST /api/segments/:segmentId/schedule` - Schedule a segment

## Project Structure

```
src/
├── modules/
│   ├── auth/          # Authentication module
│   ├── timeline/      # Timeline management
│   ├── segment/       # Segment management
│   └── user/          # User management
├── shared/
│   ├── config/        # Configuration files
│   ├── middleware/    # Express middleware
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Contact

Project Link: [TimeLine Application](https://github.com/shareeq-acc/timeline-app-backend) 
