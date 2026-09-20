(function (root, factory) {
  var costsConfig;
  var budgetEngine;
  if (typeof module === "object" && module.exports) {
    costsConfig = require("../data/ongoing-costs.js");
    budgetEngine = require("../src/budget.js");
    module.exports = factory(costsConfig, budgetEngine);
  } else if (root) {
    costsConfig = root.TUIANA_ONGOING_COSTS || {};
    budgetEngine = root.BudgetEngine || {};
    root.OngoingCostsEngine = factory(costsConfig, budgetEngine);
  }
})(typeof self !== "undefined" ? self : this, function (costsConfig, budgetEngine) {
  "use strict";

  function costKeyFromPlan(planId) {
    if (planId === "taplink-compact" || planId === "taplink-structured") {
      return "taplink";
    }
    if (planId === "tilda-one-page" || planId === "tilda-multi-page") {
      return "tilda";
    }
    if (planId === "code-interactive") {
      return "code-tool";
    }
    if (planId === "code-service") {
      return "code-service";
    }
    if (planId === "code-one-page" || planId === "code-multi-page") {
      return "code-simple";
    }
    return null;
  }

  function getOngoingCosts(input) {
    var data = input || {};
    var answers = data.answers || {};
    var scaleRes = data.scaleResult || {};
    var implRes = data.implementationResult || {};
    var budgetResult = data.budgetResult || {};

    var planId = budgetResult.planId || null;
    if (!planId && typeof budgetEngine.resolvePlan === "function") {
      planId = budgetEngine.resolvePlan(answers, scaleRes, implRes);
    }
    var key = costKeyFromPlan(planId);
    var variant = costsConfig[key] || costsConfig.individual || null;

    if (!variant) {
      return {
        type: "individual",
        display: "Расходы после запуска рассчитываются индивидуально.",
        details: [],
        note: null
      };
    }

    return {
      type: variant.type,
      display: variant.display,
      details: (variant.details || []).slice(),
      note: variant.note || null
    };
  }

  return {
    getOngoingCosts: getOngoingCosts
  };
});