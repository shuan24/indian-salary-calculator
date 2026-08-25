const $ = id => document.getElementById(id);
let salaryChart = null;

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function amount(id) {
  return Number($(id).value || 0);
}

function annualize(value, period) {
  return period === "monthly" ? value * 12 : value;
}

function collectPayload() {
  const period = $("period").value;
  const manual = $("manualMode").checked;

  const payload = {
    financial_year: $("financialYear").value,
    period,
    ctc: amount("ctc"),
    manual_breakdown: manual,
    age: amount("age"),
    city_type: $("cityType").value,
    rent_paid: amount("rentPaid"),
    professional_tax: amount("professionalTax"),
    salary: {
      basic: amount("basic"),
      hra: amount("hra"),
      flexi: amount("flexi"),
      travel: amount("travel"),
      employee_pf: amount("employeePf")
    },
    deductions: {
      section_80c: amount("80c"),
      section_80d: amount("80d"),
      section_80ccd_1b: amount("80ccd1b"),
      section_80e: amount("80e"),
      section_80g: amount("80g"),
      section_80tta: amount("80tta"),
      home_loan_interest: amount("homeLoanInterest")
    }
  };

  const employerPf = $("employerPf").value;
  if (manual && employerPf !== "") payload.salary.employer_pf = Number(employerPf);
  return payload;
}

function render(data) {
  $("results").classList.remove("hidden");

  const rec = data.comparison.recommended_regime;
  $("recommended").textContent =
    rec === "equal" ? "Old and New regimes are equal" :
    `${rec === "old" ? "Old" : "New"} Tax Regime`;

  const chosen = rec === "old" ? data.old_regime : data.new_regime;
  $("monthlyTakeHome").textContent = money(chosen.monthly_take_home);
  $("annualTakeHome").textContent = money(chosen.annual_take_home);

  $("oldTax").textContent = money(data.old_regime.total_tax);
  $("oldTaxable").textContent = money(data.old_regime.taxable_income);
  $("oldTakeHome").textContent = money(data.old_regime.monthly_take_home);

  $("newTax").textContent = money(data.new_regime.total_tax);
  $("newTaxable").textContent = money(data.new_regime.taxable_income);
  $("newTakeHome").textContent = money(data.new_regime.monthly_take_home);

  $("oldCard").classList.toggle("recommended", rec === "old");
  $("newCard").classList.toggle("recommended", rec === "new");

  const s = data.salary;
  const rows = [
    ["Annual CTC", s.annual_ctc],
    ["Annual Gross Salary", s.annual_gross_salary],
    ["Basic Salary", s.basic],
    ["HRA", s.hra],
    ["Flexi", s.flexi],
    ["Travel / LTA", s.travel],
    ["Employer PF", s.employer_pf],
    ["Employee PF", s.employee_pf],
    ["Professional Tax", data.professional_tax]
  ];
  $("salaryTable").innerHTML = rows.map(r =>
    `<tr><td>${r[0]}</td><td>${money(r[1])}</td></tr>`
  ).join("");

  const a = data.assumptions;
  $("assumptions").innerHTML = [
    `Basic = ${(a.basic_percent_of_gross * 100).toFixed(0)}% of gross salary`,
    `HRA = ${(a.hra_percent_of_basic * 100).toFixed(0)}% of Basic`,
    `Employee PF = ${(a.employee_pf_rate * 100).toFixed(0)}% of Basic`,
    `Employer PF = ${(a.employer_pf_rate * 100).toFixed(0)}% of Basic`,
    `Old-regime standard deduction = ${money(a.old_standard_deduction)}`,
    `New-regime standard deduction = ${money(a.new_standard_deduction)}`,
    `Health & Education Cess = ${(a.cess_rate * 100).toFixed(0)}%`
  ].map(x => `<li>${x}</li>`).join("");

  if (salaryChart) salaryChart.destroy();
  salaryChart = new Chart($("salaryChart"), {
    type: "doughnut",
    data: {
      labels: ["Basic", "HRA", "Flexi", "Travel"],
      datasets: [{
        data: [s.basic, s.hra, s.flexi, s.travel]
      }]
    },
    options: {responsive:true, plugins:{legend:{position:"bottom"}}}
  });
}

$("manualMode").addEventListener("change", e => {
  $("manualFields").classList.toggle("hidden", !e.target.checked);
});

$("calculate").addEventListener("click", async () => {
  $("error").classList.add("hidden");

  const ctc = amount("ctc");
  if (!Number.isFinite(ctc) || ctc <= 0) {
    $("error").textContent = "Please enter a valid CTC greater than zero.";
    $("error").classList.remove("hidden");
    $("ctc").focus();
    return;
  }

  if (ctc > 1_000_000_000) {
    $("error").textContent = "CTC is above the V1 supported input limit.";
    $("error").classList.remove("hidden");
    $("ctc").focus();
    return;
  }

  const button = $("calculate");
  const original = button.textContent;
  button.disabled = true;
  button.textContent = "Calculating…";

  try {
    const data = await calculateSalary(collectPayload());
    render(data);
    window.scrollTo({top: $("results").offsetTop - 20, behavior:"smooth"});
  } catch (err) {
    $("error").textContent = err.message;
    $("error").classList.remove("hidden");
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
});
