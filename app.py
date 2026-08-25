from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from config import Config
from engine.salary_engine import build_breakdown
from engine.tax_engine import calculate_old_regime, calculate_new_regime
from engine.comparison_engine import compare_regimes
from rules import fy_2026_27 as rules

app = Flask(__name__)
app.config.from_object(Config)

CORS(app, resources={
    r"/api/*": {
        "origins": app.config["CORS_ORIGINS"],
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type"]
    }
})

limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=[app.config["RATELIMIT_DEFAULT"]]
)


def annualize(value, period):
    value = float(value or 0)
    return value * 12 if period == "monthly" else value


def validate_payload(payload):
    if not isinstance(payload, dict):
        raise ValueError("JSON request body is required.")

    if payload.get("financial_year") not in (None, "2026-27"):
        raise ValueError("V1 supports financial year 2026-27.")

    if payload.get("period", "annual") not in ("annual", "monthly"):
        raise ValueError("period must be annual or monthly.")

    if float(payload.get("ctc", 0)) <= 0:
        raise ValueError("CTC must be greater than zero.")


@app.get("/api/v1/health")
def health():
    return jsonify({
        "success": True,
        "service": "indian-salary-calculator",
        "version": "v1",
        "financial_year": rules.FINANCIAL_YEAR,
    })


@app.post("/api/v1/calculate")
@limiter.limit("30 per minute")
def calculate():
    try:
        payload = request.get_json(silent=True)
        validate_payload(payload)

        period = payload.get("period", "annual")
        annual_ctc = annualize(payload["ctc"], period)

        normalized = dict(payload)
        normalized["ctc"] = annual_ctc

        # Manual component inputs are converted to annual amounts.
        if payload.get("manual_breakdown"):
            normalized["salary"] = {
                key: annualize(value, period)
                for key, value in payload.get("salary", {}).items()
            }

        salary = build_breakdown(normalized)

        age = int(payload.get("age", 31))
        city_type = payload.get("city_type", "non_metro")
        rent_paid = annualize(payload.get("rent_paid", 0), period)

        # API accepts professional_tax as a monthly amount.
        # Convert it to annual exactly once regardless of the main salary input period.
        professional_tax_monthly = float(
            payload.get("professional_tax", rules.DEFAULT_PROFESSIONAL_TAX_MONTHLY)
        )
        professional_tax = round(professional_tax_monthly * 12, 2)

        deductions = {
            key: annualize(value, period)
            for key, value in payload.get("deductions", {}).items()
        }

        old = calculate_old_regime(
            gross_salary=salary.annual_gross_salary,
            basic=salary.basic,
            hra=salary.hra,
            rent_paid=rent_paid,
            city_type=city_type,
            professional_tax=professional_tax,
            age=age,
            deductions=deductions,
        )

        new = calculate_new_regime(
            gross_salary=salary.annual_gross_salary,
            professional_tax=professional_tax,
        )

        comparison = compare_regimes(old, new)

        # Take-home excludes employer PF because it is not an employee cash deduction.
        # Income tax is regime-specific.
        def add_take_home(result):
            annual_take_home = (
                salary.annual_gross_salary
                - salary.employee_pf
                - professional_tax
                - result["total_tax"]
            )
            result["annual_take_home"] = round(annual_take_home, 2)
            result["monthly_take_home"] = round(annual_take_home / 12, 2)
            result["monthly_tax"] = round(result["total_tax"] / 12, 2)
            return result

        old = add_take_home(old)
        new = add_take_home(new)

        return jsonify({
            "success": True,
            "financial_year": rules.FINANCIAL_YEAR,
            "period": period,
            "salary": {
                "annual_ctc": salary.annual_ctc,
                "monthly_ctc": round(salary.annual_ctc / 12, 2),
                "annual_gross_salary": salary.annual_gross_salary,
                "monthly_gross_salary": round(salary.annual_gross_salary / 12, 2),
                "basic": salary.basic,
                "monthly_basic": round(salary.basic / 12, 2),
                "hra": salary.hra,
                "monthly_hra": round(salary.hra / 12, 2),
                "flexi": salary.flexi,
                "monthly_flexi": round(salary.flexi / 12, 2),
                "travel": salary.travel,
                "monthly_travel": round(salary.travel / 12, 2),
                "employer_pf": salary.employer_pf,
                "employee_pf": salary.employee_pf,
            },
            "professional_tax": professional_tax,
            "old_regime": old,
            "new_regime": new,
            "comparison": comparison,
            "assumptions": {
                "basic_percent_of_gross": rules.BASIC_PERCENT_OF_GROSS,
                "hra_percent_of_basic": rules.HRA_PERCENT_OF_BASIC,
                "employee_pf_rate": rules.EMPLOYEE_PF_RATE,
                "employer_pf_rate": rules.EMPLOYER_PF_RATE,
                "old_standard_deduction": rules.STANDARD_DEDUCTION_OLD,
                "new_standard_deduction": rules.STANDARD_DEDUCTION_NEW,
                "cess_rate": rules.CESS_RATE,
            },
        })

    except (ValueError, TypeError, KeyError) as exc:
        return jsonify({
            "success": False,
            "error": str(exc)
        }), 400

@app.errorhandler(429)
def rate_limit_error(_exc):
    return jsonify({
        "success": False,
        "error": "Rate limit exceeded. Please try again later."
    }), 429


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
