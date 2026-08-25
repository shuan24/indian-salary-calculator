"use strict";

/*
 * Indian Salary Calculator V2
 * Frontend application logic
 *
 * API:
 * https://bluekeep.pythonanywhere.com/api/v2/calculate
 */

let salaryChart = null;
let regimeChart = null;


/* =========================================================
   DOM HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}

function getNumber(id, defaultValue = 0) {
    const element = $(id);

    if (!element) {
        return defaultValue;
    }

    const value = Number(element.value);

    return Number.isFinite(value) ? value : defaultValue;
}


/* =========================================================
   FORMATTERS
   ========================================================= */

function formatCurrency(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "₹0";
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(number);
}


function formatNumber(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "0";
    }

    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 0
    }).format(number);
}


/*
 * Converts a decimal percentage returned by the API.
 *
 * Example:
 *
 * 0.40 → 40
 * 0.50 → 50
 * 0.12 → 12
 *
 * Never returns NaN.
 */
function safePercent(value, fallback = 0) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return fallback;
    }

    return number * 100;
}


/* =========================================================
   INPUT PERIOD
   ========================================================= */

function annualize(value, period) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return period === "monthly" ? number * 12 : number;
}


/* =========================================================
   COLLECT FORM DATA
   ========================================================= */

function collectPayload() {

    const periodElement = $("period");

    const period = periodElement
        ? periodElement.value
        : "annual";

    const manualModeElement = $("manualMode");

    const manualBreakdown = manualModeElement
        ? manualModeElement.checked
        : false;


    /*
     * Salary components
     */

    const salary = {
        basic: getNumber("basic"),
        hra: getNumber("hra"),
        flexi: getNumber("flexi"),
        travel: getNumber("travel"),
        bonus: getNumber("bonus"),
        employee_pf: getNumber("employeePf"),
        gratuity: getNumber("gratuity"),
        insurance: getNumber("insurance"),
        other_ctc: getNumber("otherCtc")
    };


    /*
     * Employer PF is optional in Manual Mode.
     */

    const employerPfElement = $("employerPf");

    if (
        employerPfElement &&
        employerPfElement.value !== ""
    ) {
        salary.employer_pf = getNumber("employerPf");
    }


    /*
     * Tax deductions
     */

    const deductions = {
        section_80c: getNumber("80c"),
        section_80ccd_1b: getNumber("80ccd1b"),
        section_80d_self: getNumber("80dself"),
        section_80d_parents: getNumber("80dparents"),
        section_80e: getNumber("80e"),
        section_80g: getNumber("80g"),
        section_80tta: getNumber("80tta"),
        home_loan_interest: getNumber("homeLoanInterest"),
        employer_nps: getNumber("employerNps")
    };


    const parentSeniorElement = $("parentSenior");

    deductions.parent_is_senior =
        parentSeniorElement
            ? parentSeniorElement.checked
            : false;


    /*
     * Complete API payload
     */

    return {

        financial_year: "2026-27",

        period: period,

        ctc: getNumber("ctc"),

        manual_breakdown: manualBreakdown,

        age: getNumber("age", 31),

        city_type: $("cityType")
            ? $("cityType").value
            : "metro",

        rent_paid: getNumber("rentPaid"),

        professional_tax: getNumber(
            "professionalTax",
            200
        ),

        salary: salary,

        deductions: deductions
    };
}


/* =========================================================
   DISPLAY ASSUMPTIONS
   ========================================================= */

function renderAssumptions(data) {

    const container =
        $("assumptions");

    if (!container) {
        return;
    }


    const assumptions =
        data.assumptions || {};


    /*
     * IMPORTANT:
     *
     * The API returns decimal values:
     *
     * 0.40 = 40%
     * 0.50 = 50%
     * 0.12 = 12%
     *
     * safePercent() prevents NaN.
     */

    const basicPercent =
        safePercent(
            assumptions.auto_basic_percent_of_gross,
            40
        );


    const hraPercent =
        safePercent(
            assumptions.auto_hra_percent_of_basic,
            50
        );


    const employeePfPercent =
        safePercent(
            assumptions.employee_pf_rate,
            12
        );


    const employerPfPercent =
        safePercent(
            assumptions.employer_pf_rate,
            12
        );


    const gratuityPercent =
        safePercent(
            assumptions.auto_gratuity_rate_of_basic,
            4.81
        );


    const oldStandardDeduction =
        Number(
            assumptions.old_standard_deduction
        );


    const newStandardDeduction =
        Number(
            assumptions.new_standard_deduction
        );


    const cessRate =
        safePercent(
            assumptions.cess_rate,
            4
        );


    const npsRate =
        safePercent(
            assumptions.new_80ccd2_rate,
            14
        );


    container.innerHTML = `

        <li>
            Basic = ${basicPercent.toFixed(0)}%
            of gross salary
        </li>

        <li>
            HRA = ${hraPercent.toFixed(0)}%
            of Basic
        </li>

        <li>
            Employee PF = ${employeePfPercent.toFixed(0)}%
            of Basic
        </li>

        <li>
            Employer PF = ${employerPfPercent.toFixed(0)}%
            of Basic
        </li>

        <li>
            Auto gratuity model =
            ${gratuityPercent.toFixed(2)}%
            of Basic
        </li>

        <li>
            Old-regime standard deduction =
            ${formatCurrency(
                Number.isFinite(oldStandardDeduction)
                    ? oldStandardDeduction
                    : 0
            )}
        </li>

        <li>
            New-regime standard deduction =
            ${formatCurrency(
                Number.isFinite(newStandardDeduction)
                    ? newStandardDeduction
                    : 0
            )}
        </li>

        <li>
            Health & Education Cess =
            ${cessRate.toFixed(0)}%
        </li>

        <li>
            New-regime employer NPS limit =
            ${npsRate.toFixed(0)}%
            of Basic + DA
        </li>
    `;
}


/* =========================================================
   SALARY BREAKDOWN TABLE
   ========================================================= */

function renderSalaryBreakdown(data) {

    const table =
        $("salaryTable");

    if (!table) {
        return;
    }


    const salary =
        data.salary || {};


    const rows = [

        ["Annual CTC", salary.annual_ctc],

        ["Gross Salary", salary.annual_gross_salary],

        ["Basic Salary", salary.basic],

        ["HRA", salary.hra],

        ["Flexi / Special Allowance", salary.flexi],

        ["Travel / LTA", salary.travel],

        ["Bonus / Variable Pay", salary.bonus],

        ["Employer PF", salary.employer_pf],

        ["Gratuity", salary.gratuity],

        ["Insurance / Benefits", salary.insurance],

        ["Other CTC Components", salary.other_ctc],

        ["Employee PF", salary.employee_pf]
    ];


    table.innerHTML =
        rows.map(row => {

            return `
                <tr>
                    <td>${row[0]}</td>
                    <td>${formatCurrency(row[1])}</td>
                </tr>
            `;

        }).join("");
}


/* =========================================================
   CTC RECONCILIATION
   ========================================================= */

function renderReconciliation(data) {

    const element =
        $("reconciliation");

    if (!element) {
        return;
    }


    const reconciliation =
        data.salary_reconciliation || {};


    const gap =
        Number(reconciliation.gap);


    if (
        Number.isFinite(gap) &&
        Math.abs(gap) < 1
    ) {

        element.textContent =
            "✓ CTC components reconcile correctly.";

        return;
    }


    element.textContent =
        `CTC reconciliation gap: ${formatCurrency(
            Number.isFinite(gap) ? gap : 0
        )}`;
}


/* =========================================================
   OLD / NEW REGIME RESULTS
   ========================================================= */

function renderRegimeResults(data) {

    const oldRegime =
        data.old_regime || {};

    const newRegime =
        data.new_regime || {};


    /*
     * Old regime
     */

    if ($("oldTaxable")) {

        $("oldTaxable").textContent =
            formatCurrency(
                oldRegime.taxable_income
            );
    }


    if ($("oldTax")) {

        $("oldTax").textContent =
            formatCurrency(
                oldRegime.total_tax
            );
    }


    if ($("oldTakeHome")) {

        $("oldTakeHome").textContent =
            formatCurrency(
                oldRegime.monthly_take_home
            );
    }


    /*
     * New regime
     */

    if ($("newTaxable")) {

        $("newTaxable").textContent =
            formatCurrency(
                newRegime.taxable_income
            );
    }


    if ($("newTax")) {

        $("newTax").textContent =
            formatCurrency(
                newRegime.total_tax
            );
    }


    if ($("newTakeHome")) {

        $("newTakeHome").textContent =
            formatCurrency(
                newRegime.monthly_take_home
            );
    }
}


/* =========================================================
   REGIME RECOMMENDATION
   ========================================================= */

function renderRecommendation(data) {

    const comparison =
        data.comparison || {};


    const recommended =
        comparison.recommended_regime;


    const element =
        $("recommended");


    if (!element) {
        return;
    }


    if (recommended === "old") {

        element.textContent =
            "Old Regime";

    } else if (recommended === "new") {

        element.textContent =
            "New Regime";

    } else {

        element.textContent =
            "Both Regimes Are Equal";
    }


    /*
     * Annual tax saving
     */

    if ($("taxSaving")) {

        $("taxSaving").textContent =
            formatCurrency(
                comparison.annual_tax_saving
            );
    }


    /*
     * Recommended monthly take-home
     */

    let recommendedRegime;

    if (recommended === "old") {

        recommendedRegime =
            data.old_regime;

    } else {

        recommendedRegime =
            data.new_regime;
    }


    if ($("monthlyTakeHome")) {

        $("monthlyTakeHome").textContent =
            formatCurrency(
                recommendedRegime.monthly_take_home
            );
    }


    if ($("annualTakeHome")) {

        $("annualTakeHome").textContent =
            formatCurrency(
                recommendedRegime.annual_take_home
            );
    }
}


/* =========================================================
   DEDUCTION TABLE
   ========================================================= */

function renderDeductionTable(data) {

    const table =
        $("deductionTable");

    if (!table) {
        return;
    }


    const oldRegime =
        data.old_regime || {};

    const deductions =
        oldRegime.deductions || {};


    const rows = [

        ["80C", deductions.section_80c],

        ["80CCD(1B)", deductions.section_80ccd_1b],

        ["80D", deductions.section_80d],

        ["80E", deductions.section_80e],

        ["80G", deductions.section_80g],

        ["80TTA", deductions.section_80tta],

        ["Home Loan Interest 24(b)",
            deductions.home_loan_interest],

        ["Employer NPS 80CCD(2)",
            deductions.employer_nps],

        ["HRA Exemption",
            oldRegime.hra_exemption],

        ["Total Deductions",
            deductions.total]
    ];


    table.innerHTML =
        rows.map(row => {

            return `
                <tr>
                    <td>${row[0]}</td>
                    <td>${formatCurrency(row[1])}</td>
                </tr>
            `;

        }).join("");
}


/* =========================================================
   SALARY CHART
   ========================================================= */

function renderSalaryChart(data) {

    const canvas =
        $("salaryChart");

    if (!canvas) {
        return;
    }


    const salary =
        data.salary || {};


    if (salaryChart) {

        salaryChart.destroy();

        salaryChart = null;
    }


    salaryChart =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels: [

                    "Basic",

                    "HRA",

                    "Flexi",

                    "Travel",

                    "Bonus",

                    "Employer PF",

                    "Gratuity",

                    "Insurance / Other"
                ],

                datasets: [{

                    data: [

                        Number(salary.basic) || 0,

                        Number(salary.hra) || 0,

                        Number(salary.flexi) || 0,

                        Number(salary.travel) || 0,

                        Number(salary.bonus) || 0,

                        Number(salary.employer_pf) || 0,

                        Number(salary.gratuity) || 0,

                        (
                            Number(salary.insurance) || 0
                        ) +
                        (
                            Number(salary.other_ctc) || 0
                        )
                    ]
                }]
            },

            options: {

                responsive: true,

                maintainAspectRatio: true,

                plugins: {

                    legend: {

                        position: "bottom"
                    },

                    tooltip: {

                        callbacks: {

                            label: function(context) {

                                return `${context.label}: ${formatCurrency(context.raw)}`;
                            }
                        }
                    }
                }
            }
        });
}


/* =========================================================
   OLD VS NEW TAKE-HOME CHART
   ========================================================= */

function renderRegimeChart(data) {

    const canvas =
        $("regimeChart");

    if (!canvas) {
        return;
    }


    if (regimeChart) {

        regimeChart.destroy();

        regimeChart = null;
    }


    regimeChart =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels: [

                    "Old Regime",

                    "New Regime"
                ],

                datasets: [{

                    label: "Monthly Take-home",

                    data: [

                        Number(
                            data.old_regime?.monthly_take_home
                        ) || 0,

                        Number(
                            data.new_regime?.monthly_take_home
                        ) || 0
                    ]
                }]
            },

            options: {

                responsive: true,

                plugins: {

                    legend: {

                        display: false
                    },

                    tooltip: {

                        callbacks: {

                            label: function(context) {

                                return formatCurrency(
                                    context.raw
                                );
                            }
                        }
                    }
                },

                scales: {

                    y: {

                        beginAtZero: true,

                        ticks: {

                            callback: function(value) {

                                return formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
}


/* =========================================================
   RENDER COMPLETE RESULT
   ========================================================= */

function renderResults(data) {

    const results =
        $("results");

    if (results) {

        results.classList.remove("hidden");
    }


    renderRecommendation(data);

    renderRegimeResults(data);

    renderSalaryBreakdown(data);

    renderReconciliation(data);

    renderDeductionTable(data);

    renderAssumptions(data);

    renderSalaryChart(data);

    renderRegimeChart(data);
}


/* =========================================================
   MANUAL MODE TOGGLE
   ========================================================= */

function setupManualMode() {

    const toggle =
        $("manualMode");

    const fields =
        $("manualFields");


    if (!toggle || !fields) {
        return;
    }


    function updateManualMode() {

        if (toggle.checked) {

            fields.classList.remove(
                "hidden"
            );

        } else {

            fields.classList.add(
                "hidden"
            );
        }
    }


    toggle.addEventListener(
        "change",
        updateManualMode
    );


    updateManualMode();
}


/* =========================================================
   ERROR HANDLING
   ========================================================= */

function showError(message) {

    const element =
        $("error");

    if (!element) {
        return;
    }


    element.textContent =
        message || "Something went wrong.";

    element.classList.remove(
        "hidden"
    );
}


function clearError() {

    const element =
        $("error");

    if (!element) {
        return;
    }


    element.textContent = "";

    element.classList.add(
        "hidden"
    );
}


/* =========================================================
   CALCULATE BUTTON
   ========================================================= */

function setupCalculateButton() {

    const button =
        $("calculate");

    if (!button) {
        console.error(
            "Calculate button not found."
        );

        return;
    }


    button.addEventListener(
        "click",
        async function() {

            clearError();


            /*
             * Validate CTC
             */

            const ctc =
                getNumber("ctc");


            if (ctc <= 0) {

                showError(
                    "Please enter a valid CTC greater than zero."
                );

                return;
            }


            /*
             * Disable button
             */

            const originalText =
                button.textContent;


            button.disabled = true;

            button.textContent =
                "Calculating...";


            try {

                const payload =
                    collectPayload();


                console.log(
                    "Salary Calculator Request:",
                    payload
                );


                /*
                 * calculateSalary() comes from api.js
                 */

                const data =
                    await calculateSalary(
                        payload
                    );


                console.log(
                    "Salary Calculator Response:",
                    data
                );


                /*
                 * Render result
                 */

                renderResults(data);


                /*
                 * Scroll to result
                 */

                const results =
                    $("results");

                if (results) {

                    results.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }

            } catch (error) {

                console.error(
                    "Salary calculation error:",
                    error
                );


                showError(
                    error.message ||
                    "Unable to calculate salary. Please try again."
                );

            } finally {

                button.disabled = false;

                button.textContent =
                    originalText;
            }
        }
    );
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "Indian Salary Calculator V2 initialized."
        );


        setupManualMode();

        setupCalculateButton();
    }
);