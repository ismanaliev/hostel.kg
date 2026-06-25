# Hostel Management Demo

This repository contains a Django backend and a React frontend for a hostel management application.

## Contents

- `backend/` - Django backend application
- `frontend/` - React frontend application
- `manage.py` - Django management script

## Quick Start

1. Create and activate a Python virtual environment.
2. Install backend dependencies.
3. Run Django migrations.
4. Start Django server.
5. Start the React frontend in `frontend/`.

## Notes

- The React app is proxied to the backend on `http://localhost:8765`.
- Secret keys and environment variables should be stored in `demo/.env`.

## Telegram webhook

Use ngrok for a stable public endpoint and dynamic host support.

Start the backend in one terminal:

```powershell
cd C:\Users\user\hostel.kg\backend
python manage.py runserver 8765
```

Then start ngrok in another terminal:

```powershell
ngrok http 8765
```

ngrok will print a public HTTPS URL like `https://abcd-1234.ngrok.io`.

Register the webhook with that URL:

```powershell
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://abcd-1234.ngrok.io/api/integrations/webhook/telegram/"
```

If the ngrok URL changes, re-run the webhook registration with the new URL.

Do not put the bot token or port in `backend/integrations/urls.py`; the URL is only used when registering the webhook.
