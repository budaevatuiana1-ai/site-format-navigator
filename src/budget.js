(function (root, factory) {
  var prices;
  if (typeof module === "object" && module.exports) {
    prices = require("../data/prices.js");
    module.exports = factory(prices);
  } else if (root) {
    prices = root.TUIANA_PRICES || {};
    root.BudgetEngine = factory(prices);
  }
})(typeof self !== "undefined" ? self : this, function (prices) {
  "use strict";

  var CALC_INTERACTIVE_IDS = ["calculate"];
  var CALC_SERVICE_IDS = ["save-result", "history"];
  var ACCOUNT_DATA_IDS = [
    "view-data",
    "view-orders",
    "get-results",
    "files",
    "pay-services",
    "edit-data"
  ];
  var DEV_INTERACTIVE_IDS = ["calculator-test"];
  var DEV_SERVICE_IDS = ["personal-account"];

  var SUGGESTIONS = [
    "Сократить первую версию до ключевых функций",
    "Убрать второстепенные функции",
    "Уменьшить количество страниц",
    "Разбить проект на этапы",
    "Обсудить альтернативу, только если она действительно подходит"
  ];

  function asList(value) {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === "string") {
      return [value];
    }
    return [];
  }

  function hasAny(list, ids) {
    for (var i = 0; i < ids.length; i++) {
      if (list.indexOf(ids[i]) !== -1) {
        return true;
      }
    }
    return false;
  }

  function codePath(a) {
    var q3 = asList(a.q3);
    var account = asList(a.account);
    var development = asList(a.development);
    var calculator = a.calculator;

    if (q3.indexOf("account") !== -1 && hasAny(account, ACCOUNT_DATA_IDS)) {
      return "service";
    }
    if (hasAny([calculator], CALC_SERVICE_IDS)) {
      return "service";
    }
    if (hasAny(development, DEV_SERVICE_IDS)) {
      return "service";
    }
    if (hasAny([calculator], CALC_INTERACTIVE_IDS)) {
      return "interactive";
    }
    if (hasAny(development, DEV_INTERACTIVE_IDS)) {
      return "interactive";
    }
    return null;
  }

  function resolvePlan(a, scaleRes, implRes) {
    var primary = implRes.primary;
    if (primary === "tilda") {
      return scaleRes.status === "multi-page"
        ? "tilda-multi-page"
        : "tilda-one-page";
    }
    if (primary === "taplink") {
      return scaleRes.status === "multi-page"
        ? "taplink-structured"
        : "taplink-compact";
    }
    if (primary === "code") {
      var path = codePath(a);
      if (path === "service") {
        return "code-service";
      }
      if (path === "interactive") {
        return "code-interactive";
      }
      return scaleRes.status === "multi-page"
        ? "code-multi-page"
        : "code-one-page";
    }
    return null;
  }

  function numericBudget(q6) {
    if (!q6 || typeof q6 !== "object") {
      return null;
    }
    if (q6.notSure === true) {
      return null;
    }
    var amount = q6.amount;
    if (typeof amount === "string" && amount.length > 0) {
      var parsed = parseInt(amount, 10);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  function formatPrice(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  function evaluateBudget(input) {
    var answers = input && input.answers ? input.answers : {};
    var scaleRes = input && input.scaleResult ? input.scaleResult : {};
    var implRes = input && input.implementationResult ? input.implementationResult : {};

    var planId = resolvePlan(answers, scaleRes, implRes);
    var plan = prices[planId] || null;
    var individual = planId === "code-service";

    var budget = numericBudget(answers.q6);

    var result = {
      status: null,
      planId: planId,
      planLabel: plan ? plan.label : null,
      minimumPrice: plan ? plan.minimumPrice : null,
      displayPrice: plan
        ? "от " + formatPrice(plan.minimumPrice) + " ₽"
        : null,
      message: "",
      suggestions: []
    };

    if (!plan) {
      result.status = "unknown";
      result.message = "Пока не хватает данных для оценки стоимости.";
      return result;
    }

    if (budget === null) {
      result.status = "unknown";
      result.message =
        "Бюджет пока не указан — показываем ориентир для рекомендованного решения.";
      return result;
    }

    if (individual) {
      result.status = "individual-estimate";
      result.message =
        "По опросу точную стоимость такого решения не определить — " +
        "нужна индивидуальная оценка. Ниже минимальный ориентир.";
      return result;
    }

    if (budget >= result.minimumPrice) {
      result.status = "fits";
      result.message =
        "Указанный бюджет укладывается в минимальный ориентир для рекомендованного решения.";
      return result;
    }

    result.status = "below";
    result.message =
      "Указанный бюджет ниже ориентира для рекомендованного решения.";
    result.suggestions = SUGGESTIONS.slice();
    return result;
  }

  return {
    evaluateBudget: evaluateBudget,
    resolvePlan: resolvePlan
  };
});