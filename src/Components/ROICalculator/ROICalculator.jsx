import React, { useState, useMemo } from "react";
import "./ROICalculator.css";

const ROICalculator = () => {
  // Input states
  const [teamSize, setTeamSize] = useState(8);
  const [hoursSpentMonthly, setHoursSpentMonthly] = useState(120);
  const [errorRatePercent, setErrorRatePercent] = useState(15);
  const [avgHourlyRate, setAvgHourlyRate] = useState(85);

  // Calculations
  const calculations = useMemo(() => {
    const monthlyHoursSaved = hoursSpentMonthly * 0.65; // 65% automation rate
    const annualHoursSaved = monthlyHoursSaved * 12;
    const annualCostOfManualWork = annualHoursSaved * avgHourlyRate;

    const monthlyErrorCost = (hoursSpentMonthly * errorRatePercent / 100) * avgHourlyRate * 3.5; // 3.5x cost of fixing errors
    const annualErrorCost = monthlyErrorCost * 12;

    const totalAnnualBenefit = annualCostOfManualWork + annualErrorCost;

    // Implementation cost estimate
    const implementationCost = 18000 + teamSize * 2000; // Base + per-person customization

    // Annual maintenance (10% of implementation)
    const annualMaintenanceCost = implementationCost * 0.1;

    // Year 1 vs Year 2+
    const year1NetBenefit = totalAnnualBenefit - implementationCost - annualMaintenanceCost;
    const year2PlusBenefit = totalAnnualBenefit - annualMaintenanceCost;

    const roiYear1 = implementationCost > 0 ? ((year1NetBenefit / implementationCost) * 100).toFixed(0) : 0;
    const paybackMonths = implementationCost > 0 ? Math.ceil((implementationCost / (totalAnnualBenefit / 12))) : 0;

    return {
      monthlyHoursSaved: Math.round(monthlyHoursSaved),
      annualHoursSaved: Math.round(annualHoursSaved),
      annualCostOfManualWork: Math.round(annualCostOfManualWork),
      annualErrorCost: Math.round(annualErrorCost),
      totalAnnualBenefit: Math.round(totalAnnualBenefit),
      implementationCost: Math.round(implementationCost),
      annualMaintenanceCost: Math.round(annualMaintenanceCost),
      year1NetBenefit: Math.round(year1NetBenefit),
      year2PlusBenefit: Math.round(year2PlusBenefit),
      roiYear1,
      paybackMonths,
    };
  }, [teamSize, hoursSpentMonthly, errorRatePercent, avgHourlyRate]);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="roi-calculator">
      <div className="roi-header">
        <h2>ROI Calculator</h2>
        <p>See your potential savings with Animus Scripts automation</p>
      </div>

      <div className="roi-grid">
        {/* Inputs */}
        <div className="roi-inputs">
          <div className="roi-input-group">
            <label htmlFor="teamSize">
              Team size
              <span className="roi-value">{teamSize} people</span>
            </label>
            <input
              id="teamSize"
              type="range"
              min="1"
              max="50"
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
            />
            <span className="roi-input-hint">1 – 50 people involved in manual processes</span>
          </div>

          <div className="roi-input-group">
            <label htmlFor="hoursMonthly">
              Hours spent on manual work / month
              <span className="roi-value">{hoursSpentMonthly} hrs</span>
            </label>
            <input
              id="hoursMonthly"
              type="range"
              min="20"
              max="500"
              step="10"
              value={hoursSpentMonthly}
              onChange={(e) => setHoursSpentMonthly(Number(e.target.value))}
            />
            <span className="roi-input-hint">Reporting, data entry, approvals, reconciliation, etc.</span>
          </div>

          <div className="roi-input-group">
            <label htmlFor="errorRate">
              Error/rework rate
              <span className="roi-value">{errorRatePercent}%</span>
            </label>
            <input
              id="errorRate"
              type="range"
              min="5"
              max="40"
              step="5"
              value={errorRatePercent}
              onChange={(e) => setErrorRatePercent(Number(e.target.value))}
            />
            <span className="roi-input-hint">% of monthly work that needs fixing or verification</span>
          </div>

          <div className="roi-input-group">
            <label htmlFor="hourlyRate">
              Avg team hourly rate
              <span className="roi-value">{formatCurrency(avgHourlyRate)}/hr</span>
            </label>
            <input
              id="hourlyRate"
              type="range"
              min="30"
              max="200"
              step="5"
              value={avgHourlyRate}
              onChange={(e) => setAvgHourlyRate(Number(e.target.value))}
            />
            <span className="roi-input-hint">Fully loaded cost (salary + benefits + overhead)</span>
          </div>
        </div>

        {/* Results */}
        <div className="roi-results">
          <div className="roi-result-header">Annual Impact</div>

          <div className="roi-result-row roi-primary">
            <div className="roi-label">Time savings</div>
            <div className="roi-number">{calculations.annualHoursSaved} hours</div>
            <div className="roi-subtext">{calculations.monthlyHoursSaved} hrs/month</div>
          </div>

          <div className="roi-result-row roi-positive">
            <div className="roi-label">Labor cost reduction</div>
            <div className="roi-number">{formatCurrency(calculations.annualCostOfManualWork)}</div>
            <div className="roi-subtext">From automation</div>
          </div>

          <div className="roi-result-row roi-accent">
            <div className="roi-label">Error/rework savings</div>
            <div className="roi-number">{formatCurrency(calculations.annualErrorCost)}</div>
            <div className="roi-subtext">Fewer mistakes, faster fixes</div>
          </div>

          <div className="roi-divider" />

          <div className="roi-result-row roi-highlight">
            <div className="roi-label">Total annual benefit</div>
            <div className="roi-number" style={{ fontSize: "1.6rem" }}>
              {formatCurrency(calculations.totalAnnualBenefit)}
            </div>
            <div className="roi-subtext">Before implementation costs</div>
          </div>

          <div className="roi-divider" />

          <div className="roi-result-row">
            <div className="roi-label">Implementation cost</div>
            <div className="roi-number roi-cost">{formatCurrency(calculations.implementationCost)}</div>
            <div className="roi-subtext">Includes setup, training, handoff</div>
          </div>

          <div className="roi-result-row">
            <div className="roi-label">Annual support</div>
            <div className="roi-number roi-cost">{formatCurrency(calculations.annualMaintenanceCost)}</div>
            <div className="roi-subtext">Ongoing maintenance & updates</div>
          </div>

          <div className="roi-divider" />

          <div className="roi-result-row roi-final">
            <div className="roi-label">Year 1 net benefit</div>
            <div className="roi-number">{formatCurrency(calculations.year1NetBenefit)}</div>
            <div className="roi-subtext">After implementation</div>
          </div>

          <div className="roi-result-row roi-final">
            <div className="roi-label">Year 2+ annual benefit</div>
            <div className="roi-number">{formatCurrency(calculations.year2PlusBenefit)}</div>
            <div className="roi-subtext">Ongoing savings</div>
          </div>

          <div className="roi-summary">
            <div className="roi-summary-item">
              <span className="roi-summary-label">Payback period</span>
              <span className="roi-summary-value">{calculations.paybackMonths} months</span>
            </div>
            <div className="roi-summary-item">
              <span className="roi-summary-label">Year 1 ROI</span>
              <span className="roi-summary-value">{calculations.roiYear1}%</span>
            </div>
          </div>

          <a href="#contact" className="roi-cta">
            Get a custom proposal based on your numbers
          </a>
        </div>
      </div>

      <div className="roi-footer">
        <p className="roi-footer-text">
          <strong>These estimates are conservative.</strong> Most clients see additional benefits from improved data quality,
          faster decision-making, and reduced compliance risk. We'll refine these numbers in your discovery call.
        </p>
      </div>
    </div>
  );
};

export default ROICalculator;
