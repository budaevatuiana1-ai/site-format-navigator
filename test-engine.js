"use strict";
var assert = require("assert");
var engine = require("./src/engine.js");
var determineScale = engine.determineScale;
var determineImplementation = engine.determineImplementation;

var total = 0;

function standardQuestion() {
  return "Есть ли на сайте такие услуги или направления, " +
    "о которых человеку нужно будет читать отдельно, " +
    "не проходя всю остальную страницу?";
}
function toolQuestion() {
  return "Нужны ли вашему проекту несколько самостоятельных страниц или разделов?";
}

function check(label, answers, expectedStatus) {
  total++;
  var result = determineScale(answers);
  assert.strictEqual(result.status, expectedStatus, label + " (got " + result.status + ")");
  assert.ok(Array.isArray(result.reasons) && result.reasons.length > 0, label + " reasons");
  assert.ok("clarification" in result, label + " has clarification field");
  if (expectedStatus === "clarify") {
    assert.ok(result.clarification, label + " clarification present");
    assert.ok(result.clarification.question.length > 0, label + " clarification question");
    assert.ok(Array.isArray(result.clarification.options) && result.clarification.options.length > 0);
    assert.strictEqual(result.clarification.options[0].id, "no");
    assert.strictEqual(result.clarification.options[1].id, "yes");
    assert.strictEqual(result.clarification.options[2].id, "not-sure");
  } else {
    assert.strictEqual(result.clarification, null, label + " no clarification");
  }
  return result;
}

function checkToolClarify(label, answers) {
  var result = check(label, answers, "clarify");
  assert.strictEqual(result.clarification.question, toolQuestion(), label + " uses tool clarification");
  return result;
}

function checkStandardClarify(label, answers) {
  var result = check(label, answers, "clarify");
  assert.strictEqual(result.clarification.question, standardQuestion(), label + " uses standard clarification");
  return result;
}

check(
  "Тест 1 Психолог",
  {
    q1: "self-services",
    q2: "similar-services",
    q3: ["contact", "request", "book"],
    booking: "button-contact",
    q4: "compact",
    q5: "sometimes",
    q6: { notSure: true }
  },
  "one-page"
);

check(
  "Тест 2 Клиника",
  {
    q1: "company",
    q2: "many-directions",
    q3: ["contact", "request", "book"],
    booking: "leave-contacts",
    q4: "wide",
    q5: "often",
    editing: ["prices", "services", "specialists", "photos", "pages", "news"],
    q6: { notSure: true }
  },
  "multi-page"
);

check(
  "Тест 3 Эксперт",
  {
    q1: "self-services",
    q2: "one-service",
    q3: ["contact", "request"],
    q4: "unusual-design",
    q5: "via-specialist",
    q6: { notSure: true }
  },
  "one-page"
);

check(
  "Тест 4 Магазин",
  {
    q1: "products",
    q2: "many-directions",
    q3: ["buy"],
    "shop-count": "10-50",
    "shop-updates": "regularly",
    "shop-needs": ["show-and-request", "cart", "online-payment"],
    q4: "wide",
    q5: "often",
    editing: ["prices", "texts", "photos", "products"],
    q6: { notSure: true }
  },
  "multi-page"
);

// Тест 5. Онлайн-сервис: структура сервиса из ответов об услугах не определяется
checkToolClarify(
  "Тест 5 Онлайн-сервис",
  {
    q1: "online-tool",
    q2: "one-service",
    q3: ["personal-result"],
    calculator: "calculate",
    q4: "wide",
    q5: "rarely",
    q6: { notSure: true }
  }
);

checkStandardClarify("Доп. q2=not-sure", { q1: "self-services", q2: "not-sure" });
checkStandardClarify("Доп. q2 отсутствует", { q1: "self-services" });
checkStandardClarify("Доп. пустые ответы", {});

check("Уточнение -> да", { q1: "self-services", q2: "not-sure", "scale-clarify": "yes" }, "multi-page");
check("Уточнение -> нет", { q1: "self-services", q2: "not-sure", "scale-clarify": "no" }, "one-page");
checkStandardClarify("Уточнение -> не знаю", { q1: "self-services", q2: "not-sure", "scale-clarify": "not-sure" });

// Итерация 4.1: online-tool всегда требует отдельного уточнения
checkToolClarify("A. online-tool + one-service", { q1: "online-tool", q2: "one-service" });
checkToolClarify("B. online-tool + many-directions", { q1: "online-tool", q2: "many-directions" });
checkToolClarify("B2. online-tool + similar-services", { q1: "online-tool", q2: "similar-services" });
checkToolClarify("B3. online-tool + different-services", { q1: "online-tool", q2: "different-services" });
check("C. online-tool + уточнение Нет", { q1: "online-tool", q2: "many-directions", "tool-clarify": "no" }, "one-page");
check("D. online-tool + уточнение Да", { q1: "online-tool", q2: "one-service", "tool-clarify": "yes" }, "multi-page");
checkToolClarify("E. online-tool + не знаю", { q1: "online-tool", q2: "many-directions", "tool-clarify": "not-sure" });

// Итерация 4.1: противоречие Q1 vs Q2
checkStandardClarify("F. several-services + one-service", { q1: "several-services", q2: "one-service" });

total++;
var noBudgetMulti = determineScale({ q1: "products", q2: "many-directions", q3: ["buy"], q6: { notSure: true } });
var smallBudgetMulti = determineScale({ q1: "products", q2: "many-directions", q3: ["buy"], q6: { amount: "20000" } });
assert.strictEqual(smallBudgetMulti.status, noBudgetMulti.status, "бюджет не влияет на status");
assert.deepStrictEqual(smallBudgetMulti.reasons, noBudgetMulti.reasons, "бюджет не влияет на reasons");
assert.strictEqual(smallBudgetMulti.clarification, noBudgetMulti.clarification, "бюджет не влияет на clarification");

total++;
var noBudgetOne = determineScale({ q1: "self-services", q2: "one-service" });
var smallBudgetOne = determineScale({ q1: "self-services", q2: "one-service", q6: { amount: "20000" } });
assert.strictEqual(smallBudgetOne.status, noBudgetOne.status, "бюджет не влияет на one-page");
assert.deepStrictEqual(smallBudgetOne.reasons, noBudgetOne.reasons, "бюджет не влияет на reasons one-page");

total++;
var withExtras = determineScale({
  q1: "self-services",
  q2: "similar-services",
  q3: ["contact", "book", "buy", "personal-result", "account"],
  booking: "choose-date-time",
  "shop-count": "10-50",
  "shop-updates": "rarely",
  "shop-needs": ["cart"],
  calculator: "calculate",
  account: ["view-data"],
  q4: "unusual-design",
  q5: "often",
  editing: ["pages"],
  q6: { amount: "150000" }
});
var minimal = determineScale({ q1: "self-services", q2: "similar-services" });
assert.strictEqual(withExtras.status, minimal.status, "лишние ключи не меняют результат");
assert.deepStrictEqual(withExtras.reasons, minimal.reasons, "лишние ключи не меняют reasons");

// ============ Итерация 5: determineImplementation ============

function implRecommend(label, answers, expectedPrimary, expectedAlternative) {
  total++;
  var result = determineImplementation(answers);
  assert.strictEqual(result.status, "recommend", label + " status (got " + result.status + ")");
  assert.strictEqual(result.primary, expectedPrimary, label + " primary (got " + result.primary + ")");
  assert.strictEqual(result.alternative, expectedAlternative, label + " alternative (got " + result.alternative + ")");
  assert.ok(Array.isArray(result.reasons) && result.reasons.length > 0, label + " reasons");
  assert.ok(Array.isArray(result.tradeoffs), label + " tradeoffs");
  assert.strictEqual(result.clarification, null, label + " no clarification");
  return result;
}

function implClarify(label, answers, expectedQuestion, expectedClarificationNull, expectedConsultation) {
  total++;
  var result = determineImplementation(answers);
  assert.strictEqual(result.status, "clarify", label + " status (got " + result.status + ")");
  assert.strictEqual(result.primary, null, label + " no primary");
  assert.strictEqual(result.alternative, null, label + " no alternative");
  assert.ok(Array.isArray(result.reasons) && result.reasons.length > 0, label + " reasons");
  if (expectedClarificationNull) {
    assert.strictEqual(result.clarification, null, label + " clarification null");
  } else {
    assert.ok(result.clarification, label + " clarification present");
    assert.strictEqual(result.clarification.question, expectedQuestion, label + " question");
  }
  if (expectedConsultation !== undefined) {
    assert.strictEqual(result.needsConsultation, expectedConsultation, label + " needsConsultation");
  }
  return result;
}

var devQuestion = "Что может появиться на сайте позже?";
var visualQuestion = "Что для вас важнее после запуска сайта?";

implRecommend(
  "И5 Т1 Психолог -> Taplink",
  {
    q1: "self-services",
    q2: "similar-services",
    q3: ["contact", "request", "book"],
    booking: "button-contact",
    q4: "compact",
    q5: "sometimes",
    q6: { notSure: true }
  },
  "taplink",
  "tilda"
);

implRecommend(
  "И5 Т2 Клиника -> Tilda",
  {
    q1: "company",
    q2: "many-directions",
    q3: ["contact", "request", "book"],
    booking: "leave-contacts",
    q4: "wide",
    q5: "often",
    editing: ["prices", "services", "specialists", "photos", "pages", "news"],
    q6: { notSure: true }
  },
  "tilda",
  null
);

implRecommend(
  "И5 Т3 Эксперт -> Tilda (Zero Block)",
  {
    q1: "self-services",
    q2: "one-service",
    q3: ["contact", "request"],
    q4: "unusual-design",
    q5: "via-specialist",
    q6: { notSure: true }
  },
  "tilda",
  null
);

implRecommend(
  "И5 Т4 Магазин -> Tilda",
  {
    q1: "products",
    q2: "many-directions",
    q3: ["buy"],
    "shop-count": "10-50",
    "shop-updates": "regularly",
    "shop-needs": ["show-and-request", "cart", "online-payment"],
    q4: "wide",
    q5: "often",
    editing: ["prices", "texts", "photos", "products"],
    q6: { notSure: true }
  },
  "tilda",
  null
);

implRecommend(
  "И5 Т5 Онлайн-сервис -> код",
  {
    q1: "online-tool",
    q2: "one-service",
    q3: ["personal-result"],
    calculator: "calculate",
    q4: "wide",
    q5: "rarely",
    q6: { notSure: true }
  },
  "code",
  null
);

implRecommend(
  "И5 А1. Компактный небольшой магазин -> Taplink",
  {
    q1: "products",
    q2: "one-service",
    q3: ["buy"],
    "shop-count": "up-to-10",
    "shop-updates": "rarely",
    "shop-needs": ["show-and-request", "cart"],
    q4: "compact",
    q5: "sometimes",
    q6: { notSure: true }
  },
  "taplink",
  "tilda"
);

implClarify(
  "И5 А2. Multi-page с компактной подачей не должен сразу давать Tilda",
  { q1: "self-services", q2: "many-directions", q4: "compact", q5: "rarely" },
  devQuestion
);

implClarify(
  "И5 А3. Онлайн-инструмент без логики — не код и не Tilda без уточнения",
  { q1: "online-tool", q2: "one-service", q3: ["request"], q4: "wide", q5: "rarely" },
  devQuestion
);

implRecommend(
  "И5 А4. Большой бюджет сам по себе не даёт код",
  {
    q1: "company",
    q2: "many-directions",
    q3: ["contact", "request"],
    q4: "wide",
    q5: "sometimes",
    q6: { amount: "100000" }
  },
  "tilda",
  null
);

implRecommend(
  "И5 А5. Нестандартный дизайн/анимация — не код",
  {
    q1: "self-services",
    q2: "one-service",
    q3: ["contact"],
    q4: "unusual-design",
    q5: "via-specialist"
  },
  "tilda",
  null
);

implRecommend(
  "И5 А6. Оплата в типовой форме — не код",
  {
    q1: "self-services",
    q2: "similar-services",
    q3: ["contact", "pay"],
    q4: "wide",
    q5: "sometimes"
  },
  "tilda",
  null
);

implRecommend(
  "И5 А7. Стандартный магазин — не код",
  {
    q1: "products",
    q2: "one-service",
    q3: ["buy"],
    "shop-count": "10-50",
    "shop-updates": "occasionally",
    "shop-needs": ["show-and-request", "cart", "online-payment"],
    q4: "wide",
    q5: "sometimes"
  },
  "tilda",
  null
);

implRecommend(
  "И5 А8. Личный кабинет с данными пользователя -> код",
  {
    q1: "online-tool",
    q2: "one-service",
    q3: ["account", "personal-result"],
    account: ["view-data", "get-results"],
    q4: "wide",
    q5: "rarely"
  },
  "code",
  null
);

implRecommend(
  "И5 А9. Индивидуальная работа со специалистом — не код",
  {
    q1: "self-services",
    q2: "one-service",
    q3: ["contact"],
    q4: "unusual-design",
    q5: "via-specialist"
  },
  "tilda",
  null
);

implRecommend(
  "И5 А10. Частое самостоятельное обновление -> визуальный редактор",
  {
    q1: "self-services",
    q2: "one-service",
    q3: ["contact", "news"],
    q4: "compact",
    q5: "often"
  },
  "tilda",
  "taplink"
);

implClarify(
  "И5 А11. Индивидуальный дизайн + частое обновление -> приоритет",
  {
    q1: "self-services",
    q2: "one-service",
    q3: ["contact"],
    q4: "unusual-design",
    q5: "often"
  },
  visualQuestion
);

// ============ Итерация 5.1: устранение недокументированных допущений ============

implClarify(
  "И5.1 A. online-tool + compact без собственной логики -> не Taplink, а уточнение",
  {
    q1: "online-tool",
    q2: "one-service",
    q3: ["request"],
    q4: "compact",
    q5: "rarely"
  },
  devQuestion
);

implRecommend(
  "И5.1 A2. online-tool + compact + стабильный объём -> Tilda",
  {
    q1: "online-tool",
    q2: "one-service",
    q3: ["request"],
    q4: "compact",
    q5: "rarely",
    development: ["nothing-planned"]
  },
  "tilda",
  null
);

implClarify(
  "И5.1 B. Только show-result на онлайн-инструменте -> не код",
  {
    q1: "online-tool",
    q2: "one-service",
    q3: ["personal-result"],
    calculator: "show-result",
    q4: "compact",
    q5: "rarely"
  },
  devQuestion
);

implRecommend(
  "И5.1 B2. show-result в обычном сайте -> не код",
  {
    q1: "self-services",
    q2: "similar-services",
    q3: ["contact"],
    calculator: "show-result",
    q4: "compact",
    q5: "sometimes"
  },
  "taplink",
  "tilda"
);

implRecommend(
  "И5.1 C. calculate -> сильный сигнал code",
  {
    q1: "self-services",
    q2: "one-service",
    q3: ["personal-result"],
    calculator: "calculate",
    q4: "wide",
    q5: "rarely"
  },
  "code",
  null
);

implRecommend(
  "И5.1 D. save-result -> сильный сигнал code",
  {
    q1: "online-tool",
    q2: "one-service",
    q3: ["personal-result"],
    calculator: "save-result",
    q4: "compact",
    q5: "rarely"
  },
  "code",
  null
);

implRecommend(
  "И5.1 E. history -> сильный сигнал code",
  {
    q1: "online-tool",
    q2: "one-service",
    q3: ["personal-result"],
    calculator: "history",
    q4: "wide",
    q5: "rarely"
  },
  "code",
  null
);

implRecommend(
  "И5.1 F. account + пользовательские данные -> сильный сигнал code",
  {
    q1: "online-tool",
    q2: "one-service",
    q3: ["account"],
    account: ["view-orders"],
    q4: "wide",
    q5: "rarely"
  },
  "code",
  null
);

implClarify(
  "И5.1 G. not-sure на development -> clarify + признак консультации",
  {
    q1: "self-services",
    q2: "many-directions",
    q4: "compact",
    q5: "rarely",
    development: ["not-sure"]
  },
  null,
  true,
  true
);

implClarify(
  "И5.1 H. not-sure на визуальное уточнение -> clarify + признак консультации",
  {
    q1: "self-services",
    q2: "one-service",
    q3: ["contact"],
    q4: "unusual-design",
    q5: "often",
    "edit-priority": "not-sure"
  },
  null,
  true,
  true
);

implRecommend(
  "И5.1 H2. Приоритет самостоятельного обновления -> Tilda",
  {
    q1: "self-services",
    q2: "one-service",
    q3: ["contact", "news"],
    q4: "unusual-design",
    q5: "often",
    "edit-priority": "self-edit"
  },
  "tilda",
  null
);

implRecommend(
  "И5.1 H3. Приоритет свободы дизайна -> Tilda Zero Block",
  {
    q1: "self-services",
    q2: "one-service",
    q3: ["contact"],
    q4: "unusual-design",
    q5: "often",
    "edit-priority": "design-freedom"
  },
  "tilda",
  null
);

// ============ Итерация 5.2: обработка ответов development ============

implClarify(
  "И5.2 A. development=booking в ничьей -> консультация без повтора вопроса",
  {
    q1: "self-services",
    q2: "many-directions",
    q4: "compact",
    q5: "rarely",
    development: ["booking"]
  },
  null,
  true,
  true
);

implClarify(
  "И5.2 B. development=payment в ничьей -> консультация без повтора вопроса",
  {
    q1: "self-services",
    q2: "similar-services",
    q4: "no-preference",
    q5: "sometimes",
    development: ["payment"]
  },
  null,
  true,
  true
);

implClarify(
  "И5.2 C. development=other-functions без кода -> не код, консультация",
  {
    q1: "online-tool",
    q2: "one-service",
    q3: ["request"],
    q4: "wide",
    q5: "rarely",
    development: ["other-functions"]
  },
  null,
  true,
  true
);

implRecommend(
  "И5.2 D. new-pages-services в споре Taplink/Tilda -> Tilda",
  {
    q1: "self-services",
    q2: "similar-services",
    q4: "no-preference",
    q5: "sometimes",
    development: ["new-pages-services"]
  },
  "tilda",
  null
);

implRecommend(
  "И5.2 E. new-specialists в споре Taplink/Tilda -> Tilda",
  {
    q1: "self-services",
    q2: "similar-services",
    q4: "no-preference",
    q5: "sometimes",
    development: ["new-specialists"]
  },
  "tilda",
  null
);

implRecommend(
  "И5.2 F. products в споре Taplink/Tilda -> Tilda",
  {
    q1: "self-services",
    q2: "similar-services",
    q4: "no-preference",
    q5: "sometimes",
    development: ["products"]
  },
  "tilda",
  null
);

implRecommend(
  "И5.2 G. calculator-test в споре Tilda/code -> код",
  {
    q1: "online-tool",
    q2: "one-service",
    q3: ["request"],
    q4: "wide",
    q5: "rarely",
    development: ["calculator-test"]
  },
  "code",
  null
);

implRecommend(
  "И5.2 H. personal-account в споре Tilda/code -> код",
  {
    q1: "online-tool",
    q2: "one-service",
    q3: ["request"],
    q4: "wide",
    q5: "rarely",
    development: ["personal-account"]
  },
  "code",
  null
);

implClarify(
  "И5.2 I. development=not-sure -> консультация без повтора",
  {
    q1: "self-services",
    q2: "similar-services",
    q4: "no-preference",
    q5: "sometimes",
    development: ["not-sure"]
  },
  null,
  true,
  true
);

implClarify(
  "И5.2 I2. Комбинация нейтральных ответов -> консультация без повтора",
  {
    q1: "self-services",
    q2: "many-directions",
    q4: "compact",
    q5: "rarely",
    development: ["booking", "payment"]
  },
  null,
  true,
  true
);

// ============ Итерация 5.3: магазинные пороги ============

implRecommend(
  "И5.3 A. up-to-10 + compact + редкие изменения + стандарт -> Taplink",
  {
    q1: "products",
    q2: "one-service",
    q3: ["buy"],
    "shop-count": "up-to-10",
    "shop-updates": "rarely",
    "shop-needs": ["show-and-request", "cart"],
    q4: "compact",
    q5: "sometimes"
  },
  "taplink",
  "tilda"
);

implClarify(
  "И5.3 B. 10-50 само по себе -> не Taplink, а уточнение",
  {
    q1: "products",
    q2: "one-service",
    q3: ["buy"],
    "shop-count": "10-50"
  },
  devQuestion
);

implRecommend(
  "И5.3 C. 10-50 + wide + регулярное обновление -> Tilda",
  {
    q1: "products",
    q2: "one-service",
    q3: ["buy"],
    "shop-count": "10-50",
    "shop-updates": "regularly",
    "shop-needs": ["show-and-request", "cart", "online-payment"],
    q4: "wide",
    q5: "often"
  },
  "tilda",
  null
);

implRecommend(
  "И5.3 D. 50-200 + стандартный магазин -> Tilda, не код только из-за количества",
  {
    q1: "products",
    q2: "one-service",
    q3: ["buy"],
    "shop-count": "50-200",
    "shop-updates": "rarely",
    "shop-needs": ["show-and-request", "cart", "online-payment"],
    q4: "wide",
    q5: "sometimes"
  },
  "tilda",
  null
);

implRecommend(
  "И5.3 E. Больше 200 + стандартные функции -> Tilda, не код из-за масштаба",
  {
    q1: "products",
    q2: "one-service",
    q3: ["buy"],
    "shop-count": "more-200",
    "shop-updates": "sometimes",
    "shop-needs": ["show-and-request", "cart", "online-payment"],
    q4: "wide",
    q5: "sometimes"
  },
  "tilda",
  null
);

implRecommend(
  "И5.3 F. Собственная логика магазина -> код по функциональным сигналам, не по количеству",
  {
    q1: "products",
    q2: "one-service",
    q3: ["buy", "account"],
    account: ["view-orders"],
    "shop-count": "more-200",
    "shop-updates": "regularly",
    "shop-needs": ["cart", "online-payment"],
    q4: "wide",
    q5: "often"
  },
  "code",
  null
);

implRecommend(
  "И5 А12. Tie Taplink/Tilda + расширение товарами -> Tilda",
  {
    q1: "self-services",
    q2: "many-directions",
    q4: "compact",
    q5: "rarely",
    development: ["products"]
  },
  "tilda",
  null
);

implRecommend(
  "И5 А13. Tie Taplink/Tilda + ничего не планируется -> Taplink",
  {
    q1: "self-services",
    q2: "many-directions",
    q4: "compact",
    q5: "rarely",
    development: ["nothing-planned"]
  },
  "taplink",
  null
);

implRecommend(
  "И5 А14. Нейтральная подача + расширение -> Tilda",
  {
    q1: "self-services",
    q2: "similar-services",
    q3: ["contact"],
    q4: "no-preference",
    q5: "sometimes",
    development: ["new-pages-services"]
  },
  "tilda",
  null
);

implRecommend(
  "И5 А15. Онлайн-инструмент без логики + стабильный объём -> Tilda",
  {
    q1: "online-tool",
    q2: "one-service",
    q3: ["request"],
    q4: "wide",
    q5: "rarely",
    development: ["nothing-planned"]
  },
  "tilda",
  null
);

implClarify(
  "И5 А16. Недостаточно данных -> статус clarify без придуманного вопроса",
  {},
  null,
  true
);

total++;
var budgetFreeShop = determineImplementation({
  q1: "products",
  q2: "one-service",
  q3: ["buy"],
  "shop-count": "10-50",
  "shop-updates": "regularly",
  "shop-needs": ["cart", "online-payment"],
  q4: "wide",
  q5: "sometimes",
  q6: { notSure: true }
});
var mediumBudgetShop = determineImplementation({
  q1: "products",
  q2: "one-service",
  q3: ["buy"],
  "shop-count": "10-50",
  "shop-updates": "regularly",
  "shop-needs": ["cart", "online-payment"],
  q4: "wide",
  q5: "sometimes",
  q6: { amount: "15000" }
});
var bigBudgetShop = determineImplementation({
  q1: "products",
  q2: "one-service",
  q3: ["buy"],
  "shop-count": "10-50",
  "shop-updates": "regularly",
  "shop-needs": ["cart", "online-payment"],
  q4: "wide",
  q5: "sometimes",
  q6: { amount: "100000" }
});
assert.strictEqual(budgetFreeShop.primary, bigBudgetShop.primary, "бюджет не меняет primary");
assert.strictEqual(mediumBudgetShop.primary, bigBudgetShop.primary, "бюджет 15000 не меняет primary");
assert.strictEqual(mediumBudgetShop.primary, budgetFreeShop.primary, "бюджет 15000 = no budget");
assert.deepStrictEqual(mediumBudgetShop.reasons, bigBudgetShop.reasons, "бюджет не меняет reasons");
assert.deepStrictEqual(mediumBudgetShop.tradeoffs, bigBudgetShop.tradeoffs, "бюджет не меняет tradeoffs");

console.log("ALL " + total + " ENGINE TESTS PASSED");