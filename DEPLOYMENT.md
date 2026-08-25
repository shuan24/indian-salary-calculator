# V1 Deployment Guide

## 1. GitHub Pages frontend

Upload the `frontend/` directory to a GitHub repository.

Before publishing, edit:

`frontend/js/api.js`

Change:

```js
const API_BASE_URL = "http://127.0.0.1:5000";
```

to your production PythonAnywhere HTTPS URL, for example:

```js
const API_BASE_URL = "https://YOUR_USERNAME.pythonanywhere.com";
```

Do not put API keys or secrets in the frontend.

## 2. PythonAnywhere backend

PythonAnywhere's standard Flask deployment uses a WSGI file; do not run Flask's development server in production.

Create a PythonAnywhere web app using Manual Configuration, create a virtualenv, upload the `backend/` directory, install:

```bash
pip install -r requirements.txt
```

Edit `backend/wsgi.py` and replace `YOUR_USERNAME`.

## 3. Environment variable

Set:

```text
CORS_ORIGINS=https://YOUR_GITHUB_USERNAME.github.io
```

If the GitHub repository is hosted under a project path, the origin is still the domain only:

```text
https://YOUR_GITHUB_USERNAME.github.io
```

Do not include a trailing slash.

For local testing:

```text
CORS_ORIGINS=http://127.0.0.1:5500,http://localhost:5500
```

## 4. Reload

After changing Python code or the WSGI file, reload the web application from PythonAnywhere.

## 5. Health check

Open:

```text
https://YOUR_USERNAME.pythonanywhere.com/api/v1/health
```

Expected:

```json
{
  "success": true,
  "service": "indian-salary-calculator",
  "version": "v1",
  "financial_year": "2026-27"
}
```

## 6. Production checklist

- [ ] Set exact CORS origin
- [ ] Install dependencies in virtualenv
- [ ] Configure WSGI path
- [ ] Disable debug mode
- [ ] Verify HTTPS
- [ ] Verify health endpoint
- [ ] Test POST `/api/v1/calculate`
- [ ] Test rate limiting
- [ ] Test manual mode
- [ ] Test old/new regime comparison
- [ ] Run pytest before each deployment
