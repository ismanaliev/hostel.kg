# Hostel Management Frontend

A React frontend for the Hostel Management Django application.

## Features

- User authentication via Telegram Web App
- Posts management (view, create)
- User profile management
- Owner application system

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. The app will be available at `http://localhost:3000`

## API Integration

The frontend communicates with the Django backend API:

- `/api/auth/telegram/` - Telegram authentication
- `/api/posts/` - Posts CRUD operations
- `/api/users/profile/` - User profile management
- `/api/users/become-owner/` - Owner application

## Technologies Used

- React 18
- React Router DOM
- Axios for API calls
- CSS for styling