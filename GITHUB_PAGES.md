# GitHub Pages deployment

GitHub Pages hosts the static frontend from the `frontend/` directory.

## 1. Create repository

Example:

```text
indian-salary-calculator
├── .github/
│   └── workflows/
│       └── deploy-pages.yml
├── backend/
├── frontend/
└── README.md
```

## 2. Configure API URL

Edit:

```text
frontend/js/api.js
```

Replace:

```js
const API_BASE_URL = "https://YOUR_USERNAME.pythonanywhere.com";
```

with the actual PythonAnywhere HTTPS origin.

## 3. Push to main

The included GitHub Actions workflow deploys only the `frontend/` directory.

GitHub's Pages documentation supports deploying static content with `actions/upload-pages-artifact` and `actions/deploy-pages`.

## 4. Enable Pages

Repository → Settings → Pages → Build and deployment → Source: GitHub Actions.

After the first successful workflow, GitHub will show the published URL.

## 5. PythonAnywhere CORS

Set the API environment/configuration to the GitHub Pages **origin**, for example:

```text
https://YOUR_GITHUB_USERNAME.github.io
```

For a project site, the origin remains the domain without the repository path.

## 6. Local development

Start the Flask API locally, then temporarily change API_BASE_URL to:

```text
http://127.0.0.1:5000
```

Do not commit the local URL to your production branch.
