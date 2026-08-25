# Indian Salary & Net Take-Home Calculator — V1

## Stack
- Frontend: HTML/CSS/JavaScript, GitHub Pages ready
- Backend: Python + Flask
- Backend hosting: PythonAnywhere ready
- Tax rules: FY/Tax Year 2026-27
- API: REST/JSON
- Charts: Chart.js

## V1 features
- Annual / monthly CTC input
- Auto salary breakdown
- Manual detailed breakdown toggle
- Basic / HRA / Flexi / Travel
- Employee and employer PF
- HRA exemption
- Old vs New tax regime
- Standard deductions
- Old-regime deduction inputs
- Section 87A rebate framework
- Cess and surcharge framework
- Monthly and annual take-home
- Salary distribution chart
- Calculation assumptions

## Run backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
python app.py
```

Then open `frontend/index.html`.

The frontend currently points to `http://127.0.0.1:5000`.
Before deployment, change `API_BASE_URL` in `frontend/js/api.js` to the PythonAnywhere HTTPS API.

## Run tests

```bash
cd backend
pytest
```

## Production hardening before deployment
1. Replace wildcard Flask CORS with the exact GitHub Pages origin.
2. Add rate limiting.
3. Disable Flask debug mode.
4. Add HTTPS-only production configuration.
5. Add request validation and maximum numeric bounds.
6. Add more tax regression tests against official examples.
7. Version the rules by tax year.


## Verification
The V1 tax rules were checked against current Income Tax Department material for AY/Tax Year 2026-27, including:
- New-regime slabs: ₹0–4L, ₹4–8L, ₹8–12L, ₹12–16L, ₹16–20L, ₹20–24L, >₹24L.
- New-regime Section 87A rebate: up to ₹60,000 when total income does not exceed ₹12L.
- Old-regime Section 87A rebate: up to ₹12,500 when total income does not exceed ₹5L.
- 4% Health & Education Cess.
- Surcharge bands, including the 25% new-regime maximum above ₹5 crore and 37% old-regime maximum.


## Deployment
- GitHub Pages deployment workflow: `.github/workflows/deploy-pages.yml`
- GitHub Pages guide: `GITHUB_PAGES.md`
- PythonAnywhere guide: `DEPLOYMENT.md`
- Set the production API origin in `frontend/js/api.js`.
