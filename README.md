# Hostel Management Demo

This repository contains a Django backend and a React frontend for a hostel management application.

## Contents

- `demo/` - Django settings and configuration
- `amenities/`, `audit/`, `hostels/`, `integrations/`, `leads/`, `posts/`, `users/` - Django apps
- `frontend/` - React frontend application
- `manage.py` - Django management script

## Quick Start

1. Create and activate a Python virtual environment.
2. Install backend dependencies.
3. Run Django migrations.
4. Start Django server.
5. Start the React frontend in `frontend/`.

## Notes

- The React app is proxied to the backend on `http://localhost:8000`.
- Secret keys and environment variables should be stored in `demo/.env`.
