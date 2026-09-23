(function () {
  "use strict";

  var data = window.APP_DATA;
  var engine = window.ScaleEngine;
  var app = document.getElementById("app");

  var UI = {
    nextFallback: "Дальше",
    backLabel: "Назад",
    questionLabel: "Вопрос",
    ofLabel: "из",
    branchLabel: "Уточняющий вопрос",
    budgetInputLabel: "Сумма в рублях",
    restartLabel: "Пройти ещё раз",
    dataMissing: "Не найдены данные опроса."
  };

  var TOOL_CLARIFY_ID = "tool-clarify";
  var SCALE_CLARIFY_ID = "scale-clarify";
  var DEVELOPMENT_ID = "development";
  var EDIT_PRIORITY_ID = "edit-priority";
  var Q1_ONLINE_TOOL = "online-tool";

  var SCALE_LABELS = {
    "one-page": "Одностраничный сайт",
    "multi-page": "Многостраничный сайт"
  };

  var IMPL_LABELS = {
    taplink: "Taplink",
    tilda: "Tilda",
    code: "Индивидуальная разработка"
  };

  var CLARIFY_TITLE = "Здесь лучше уточнить задачу вместе";

  var MAX_URL =
    "https://max.ru/u/f9LHodD0cOKvRb6ASZXZUlk2WX_vHmc6OCVphosOEus9wVCne4ydknETbgQ";

  function hasReasonKeyword(implRes, keyword) {
    var reasons = implRes.reasons || [];
    for (var i = 0; i < reasons.length; i++) {
      if (reasons[i].indexOf(keyword) !== -1) {
        return true;
      }
    }
    return false;
  }

  function recommendationName(scaleRes, implRes, budgetRes) {
    var scaleName = SCALE_LABELS[scaleRes.status] || "";
    if (implRes.primary === "taplink") {
      return scaleName ? scaleName + " на Taplink" : "Taplink";
    }
    if (implRes.primary === "tilda") {
      return scaleName ? scaleName + " на Tilda" : "Tilda";
    }
    if (implRes.primary === "code") {
      if (budgetRes && budgetRes.planId === "code-interactive") {
        return "Интерактивный сайт или онлайн-инструмент";
      }
      if (budgetRes && budgetRes.planId === "code-service") {
        return "Индивидуальный веб-сервис";
      }
      return "Индивидуальная разработка";
    }
    return scaleName;
  }

  function humanizeWhy(scaleRes, implRes, budgetRes) {
    var a = state.answers || {};
    var scale = scaleRes && scaleRes.status;
    var isCode = implRes.primary === "code";
    var planId = budgetRes ? budgetRes.planId : null;
    var s = [];

    if (!isCode) {
      if (scale === "one-page") {
        s.push(
          "У вас одна основная задача — её удобно раскрыть последовательно на одной странице."
        );
      } else if (scale === "multi-page") {
        s.push(
          "У проекта несколько самостоятельных направлений, по которым человеку удобнее переходить отдельно."
        );
      }

      if (implRes.primary === "taplink") {
        if (hasReasonKeyword(implRes, "Каталог действительно маленький")) {
          s.push("Каталог небольшой — до 10 товаров, поэтому полноценный магазин не нужен.");
        } else {
          s.push(
            "Задача компактная: широкий формат на большом экране не нужен, стандартных форм и кнопок связи достаточно."
          );
        }
        s.push("Для такого лендинга достаточно Taplink.");
      } else {
        if (hasReasonKeyword(implRes, "индивидуальная композиция")) {
          s.push("Вам важна индивидуальная визуальная подача — для неё удобнее конструктор Tilda.");
        } else if (
          hasReasonKeyword(implRes, "полноценная широкая") ||
          hasReasonKeyword(implRes, "полноценное отображение")
        ) {
          s.push(
            "Нужна полноценная подача на компьютере с аккуратной адаптацией под разные экраны — это сильная сторона Tilda."
          );
        } else if (hasReasonKeyword(implRes, "самостоятельно обновлять")) {
          s.push("Вы планируете регулярно обновлять контент самостоятельно — в Tilda есть удобный визуальный редактор.");
        } else if (hasReasonKeyword(implRes, "самостоятельных направлений")) {
          s.push("Разделам нужна чёткая структура и удобная навигация — это про Tilda.");
        } else if (hasReasonKeyword(implRes, "стандартный каталог")) {
          s.push("Магазину нужны типовые каталог, корзина и оплата — их удобно вести на Tilda.");
        } else {
          s.push("Для структуры и подачи удобнее конструктор с широкими возможностями дизайна — Tilda.");
        }
      }
      return s.slice(0, 3);
    }

    if (scale === "multi-page") {
      if (planId !== "code-service") {
        s.push(
          "У проекта несколько самостоятельных направлений, по которым человеку удобнее переходить отдельно."
        );
      }
    } else if (scale === "one-page" && a["tool-clarify"] === "no") {
      s.push("Основную задачу можно пройти в одном последовательном сценарии.");
    }

    var q3 = Array.isArray(a.q3) ? a.q3 : [];
    var account = Array.isArray(a.account) ? a.account : [];
    var calculator = a.calculator;
    var accountWithData =
      q3.indexOf("account") !== -1 &&
      account.some(function (id) {
        return id !== "other" && id !== "not-sure";
      });

    if (accountWithData) {
      s.push(
        "Нужен личный кабинет с данными пользователя. Это уже функциональность веб-сервиса, поэтому лучше индивидуальная разработка."
      );
    } else if (calculator === "save-result") {
      s.push(
        "Результат нужно сохранить, чтобы к нему можно было вернуться. Это уже функциональность веб-сервиса, поэтому лучше индивидуальная разработка."
      );
    } else if (calculator === "history") {
      s.push(
        "Нужно хранить историю результатов, чтобы к ней можно было возвращаться. Это уже функциональность веб-сервиса, поэтому лучше индивидуальная разработка."
      );
    } else if (calculator === "calculate") {
      s.push(
        "Сайт должен сам рассчитывать персональный результат. Для этого нужна собственная логика, поэтому лучше индивидуальная разработка."
      );
    } else if (hasReasonKeyword(implRes, "личный кабинет")) {
      s.push(
        "Нужен личный кабинет с данными пользователя. Это уже функциональность веб-сервиса, поэтому лучше индивидуальная разработка."
      );
    } else if (hasReasonKeyword(implRes, "собственную логику")) {
      s.push(
        "Сайт должен сам рассчитывать персональный результат. Для этого нужна собственная логика, поэтому лучше индивидуальная разработка."
      );
    } else if (hasReasonKeyword(implRes, "цифрового сервиса")) {
      s.push(
        "Проект будет развивать собственную цифровую функциональность — это уже не задача для готовой платформы. Поэтому лучше индивидуальная разработка."
      );
    } else {
      s.push(
        "У задачи есть функциональность, которую готовая платформа не покрывает. Поэтому лучше индивидуальная разработка."
      );
    }

    return s.slice(0, 3);
  }

  function alternativeSentence(implRes) {
    var alt = implRes.alternative;
    if (!alt) {
      return null;
    }
    var altLabel =
      alt === "taplink" ? "Taplink" : alt === "tilda" ? "Tilda" : null;
    if (!altLabel) {
      return null;
    }
    var clause = null;
    (implRes.tradeoffs || []).forEach(function (tradeoff) {
      if (clause) {
        return;
      }
      var low = tradeoff.toLowerCase();
      var at = low.indexOf("если");
      if (at !== -1) {
        clause = tradeoff.substring(at);
        if (clause.charAt(0) === "Е") {
          clause = "если" + clause.substring(4);
        }
      }
    });
    if (!clause) {
      return null;
    }
    clause = clause
      .replace(/,?\s*(Taplink|Tilda)\s+будет удобнее\.?$/, ".")
      .replace(/клиенту важнее/g, "вам важнее")
      .replace(/Клиент хочет/g, "Вы хотите")
      .replace(/desktop-композиция/g, "композиция на компьютере")
      .replace(/широкий desktop/g, "широкий экран")
      .replace(/\s+/g, " ")
      .replace(/\s\./g, ".")
      .trim();
    return "Также можно рассмотреть " + altLabel + ", " + clause;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text) {
      node.textContent = text;
    }
    return node;
  }

  var state = {
    answers: {},
    currentStepId: null
  };

  function scaleResult() {
    return engine.determineScale(state.answers);
  }

  function implementationResult() {
    return engine.determineImplementation(state.answers);
  }

  function clarificationFor(id) {
    var res = null;
    if (id === SCALE_CLARIFY_ID || id === TOOL_CLARIFY_ID) {
      res = scaleResult();
    } else if (id === DEVELOPMENT_ID || id === EDIT_PRIORITY_ID) {
      res = implementationResult();
    }
    if (res && res.clarification && res.clarification.key === id) {
      return res.clarification;
    }
    if (typeof engine.getClarificationDefinition === "function") {
      return engine.getClarificationDefinition(id);
    }
    return null;
  }

  function dynamicStepFor(id) {
    if (
      id !== TOOL_CLARIFY_ID &&
      id !== SCALE_CLARIFY_ID &&
      id !== DEVELOPMENT_ID &&
      id !== EDIT_PRIORITY_ID
    ) {
      return null;
    }
    var clarification = clarificationFor(id);
    if (!clarification) {
      return null;
    }
    return toDynamicStep(id, clarification);
  }

  function createButton(label, className, onClick) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  function findQuestion(id) {
    for (var i = 0; i < data.questions.length; i++) {
      if (data.questions[i].id === id) {
        return data.questions[i];
      }
    }
    return null;
  }

  function findBranch(id) {
    for (var i = 0; i < data.branches.length; i++) {
      if (data.branches[i].id === id) {
        return data.branches[i];
      }
    }
    return null;
  }

  function toDynamicStep(id, clarification) {
    return {
      id: id,
      type: clarification.multiple ? "multiple" : "single",
      title: clarification.question,
      nextLabel: UI.nextFallback,
      hint: clarification.hint || null,
      options: clarification.options
    };
  }

  function stepById(id) {
    var q = findQuestion(id);
    if (q) {
      return { kind: "base", step: q };
    }
    var d = dynamicStepFor(id);
    if (d) {
      return { kind: "engine", step: d };
    }
    var b = findBranch(id);
    if (b) {
      return { kind: "branch", step: b };
    }
    return null;
  }

  function chainsFor(questionId) {
    var map = data.conditional[questionId];
    if (!map) {
      return [];
    }
    var out = [];
    var answer = state.answers[questionId];
    Object.keys(map).forEach(function (optionId) {
      var selected = Array.isArray(answer)
        ? answer.indexOf(optionId) !== -1
        : answer === optionId;
      if (selected) {
        out = out.concat(map[optionId]);
      }
    });
    return out;
  }

  function isOnlineToolRoute() {
    return state.answers.q1 === Q1_ONLINE_TOOL;
  }

  function allBaseAnswered() {
    for (var i = 0; i < data.questions.length; i++) {
      var q = data.questions[i];
      if (q.id === "q2" && isOnlineToolRoute()) {
        continue;
      }
      if (!hasAnswer(q)) {
        return false;
      }
    }
    return true;
  }

  function answerPresent(key) {
    var a = state.answers[key];
    if (Array.isArray(a)) {
      return a.length > 0;
    }
    return typeof a === "string" && a !== "";
  }

  function scaleClarifyIncluded() {
    if (isOnlineToolRoute()) {
      return false;
    }
    var q2 = state.answers.q2;
    if (typeof q2 !== "string" || q2 === "") {
      return false;
    }
    if (answerPresent(SCALE_CLARIFY_ID)) {
      return true;
    }
    var res = scaleResult();
    return !!(
      res.status === "clarify" &&
      res.clarification &&
      res.clarification.key === SCALE_CLARIFY_ID
    );
  }

  function implStepsInRoute() {
    if (!allBaseAnswered()) {
      return [];
    }
    var list = [];
    var res = implementationResult();
    if (res && res.status === "clarify" && res.clarification) {
      var key = res.clarification.key;
      if (key === DEVELOPMENT_ID || key === EDIT_PRIORITY_ID) {
        list.push(key);
      }
    }
    [DEVELOPMENT_ID, EDIT_PRIORITY_ID].forEach(function (id) {
      if (answerPresent(id) && list.indexOf(id) === -1) {
        list.push(id);
      }
    });
    return list;
  }

  function buildSteps() {
    var steps = [];
    data.questions.forEach(function (q) {
      if (q.id === "q2" && isOnlineToolRoute()) {
        return;
      }
      steps.push(q.id);
      if (q.id === "q1" && isOnlineToolRoute()) {
        steps.push(TOOL_CLARIFY_ID);
      }
      if (q.id === "q2" && scaleClarifyIncluded()) {
        steps.push(SCALE_CLARIFY_ID);
      }
      chainsFor(q.id).forEach(function (branchId) {
        steps.push(branchId);
      });
    });
    implStepsInRoute().forEach(function (id) {
      steps.push(id);
    });
    return steps;
  }

  function pruneDependents(questionId) {
    var map = data.conditional[questionId];
    if (!map) {
      return;
    }
    var required = chainsFor(questionId);
    Object.keys(map).forEach(function (optionId) {
      map[optionId].forEach(function (branchId) {
        if (required.indexOf(branchId) === -1) {
          delete state.answers[branchId];
        }
      });
    });
  }

  function syncImplementationKeys() {
    [DEVELOPMENT_ID, EDIT_PRIORITY_ID].forEach(function (key) {
      if (!answerPresent(key)) {
        return;
      }
      var without = {};
      Object.keys(state.answers).forEach(function (k) {
        if (k !== key) {
          without[k] = state.answers[k];
        }
      });
      var res = engine.determineImplementation(without);
      if (res.status !== "clarify" || !res.clarification) {
        delete state.answers[key];
        return;
      }
      if (res.clarification.key !== key) {
        delete state.answers[key];
      }
    });
  }

  function onAnswerChanged(id, kind) {
    if (id === "q1") {
      if (isOnlineToolRoute()) {
        delete state.answers.q2;
      }
      delete state.answers[TOOL_CLARIFY_ID];
    }
    if (id === "q1" || id === "q2") {
      delete state.answers[SCALE_CLARIFY_ID];
    }
    if (kind === "base" && data.conditional[id]) {
      pruneDependents(id);
    }
    if (kind !== "engine" && id !== "q6") {
      syncImplementationKeys();
    }
  }

  function selectedIds(step) {
    var a = state.answers[step.id];
    if (step.type === "multiple") {
      return Array.isArray(a) ? a.slice() : [];
    }
    if (step.type === "single") {
      return typeof a === "string" && a.length > 0 ? [a] : [];
    }
    return [];
  }

  function hasAnswer(step) {
    var a = state.answers[step.id];
    if (step.type === "multiple") {
      return Array.isArray(a) && a.length > 0;
    }
    if (step.type === "budget") {
      return (
        !!a &&
        (a.notSure === true ||
          (typeof a.amount === "string" && a.amount.length > 0))
      );
    }
    return typeof a === "string" && a.length > 0;
  }

  function setOptionSelection(optionsList, ids) {
    var nodes = optionsList.querySelectorAll(".option");
    for (var i = 0; i < nodes.length; i++) {
      var selected = ids.indexOf(nodes[i].getAttribute("data-option-id")) !== -1;
      nodes[i].classList.toggle("option--selected", selected);
      nodes[i].setAttribute("aria-checked", String(selected));
    }
  }

  function restartFlow() {
    state.answers = {};
    state.currentStepId = null;
    renderStart();
  }

  function renderStart() {
    app.innerHTML = "";

    var container = document.createElement("section");
    container.className = "screen screen--start";

    container.appendChild(el("p", "screen__badge", "Бесплатный навигатор"));

    var title = document.createElement("h1");
    title.className = "screen__title";
    title.textContent = data.start.title;

    var text = document.createElement("p");
    text.className = "screen__text";
    text.textContent = data.start.description;

    var button = createButton(
      data.start.button,
      "button button--primary button--start",
      function () {
        renderScreen(data.questions[0].id);
      }
    );

    container.appendChild(title);
    container.appendChild(text);
    container.appendChild(button);
    app.appendChild(container);
  }

  function buildBudget(container, step, updateNext) {
    var answer = state.answers[step.id] || { amount: null, notSure: false };
    state.answers[step.id] = answer;
    var b = data.budget;

    if (step.intro) {
      var intro = document.createElement("p");
      intro.className = "screen__text";
      intro.textContent = step.intro;
      container.appendChild(intro);
    }

    var field = document.createElement("div");
    field.className = "budget__field";

    var input = document.createElement("input");
    input.type = "text";
    input.inputMode = "numeric";
    input.className = "budget__input";
    input.placeholder = b.placeholder;
    input.setAttribute("aria-label", UI.budgetInputLabel);
    if (answer.amount) {
      input.value = answer.amount;
    }
    field.appendChild(input);

    var currency = document.createElement("span");
    currency.className = "budget__currency";
    currency.textContent = b.currency;
    field.appendChild(currency);

    var notSure = document.createElement("button");
    notSure.type = "button";
    notSure.className = "option option--toggle";
    notSure.textContent = b.notSureLabel;

    function refresh() {
      notSure.classList.toggle("option--selected", answer.notSure === true);
      notSure.setAttribute("aria-checked", String(answer.notSure === true));
      updateNext();
    }

    input.addEventListener("input", function () {
      var digits = input.value.replace(/\D+/g, "");
      input.value = digits;
      answer.amount = digits === "" ? null : digits;
      if (digits !== "") {
        answer.notSure = false;
      }
      refresh();
    });

    notSure.addEventListener("click", function () {
      answer.notSure = !answer.notSure;
      if (answer.notSure) {
        answer.amount = null;
        input.value = "";
      }
      refresh();
    });

    var wrap = document.createElement("div");
    wrap.className = "budget";
    wrap.appendChild(field);
    wrap.appendChild(notSure);
    container.appendChild(wrap);
    refresh();
  }

  function buildOptions(container, step, updateNext, kind) {
    if (step.hint) {
      var hint = document.createElement("p");
      hint.className = "screen__text";
      hint.textContent = step.hint;
      container.appendChild(hint);
    }

    var optionsList = document.createElement("div");
    optionsList.className = "options";
    optionsList.setAttribute("role", "group");
    var roleName = step.type === "multiple" ? "checkbox" : "radio";

    step.options.forEach(function (option) {
      var opt = document.createElement("button");
      opt.type = "button";
      opt.className = "option";
      opt.setAttribute("role", roleName);
      opt.setAttribute("aria-checked", "false");
      opt.setAttribute("data-option-id", option.id);
      opt.textContent = option.label;
      opt.addEventListener("click", (function (opt) {
        return function () {
          if (step.type === "multiple") {
            var ids = selectedIds(step);
            var pos = ids.indexOf(option.id);
            if (pos === -1) {
              ids.push(option.id);
            } else {
              ids.splice(pos, 1);
            }
            state.answers[step.id] = ids.slice();
          } else {
            state.answers[step.id] = option.id;
          }
          onAnswerChanged(step.id, kind);
          setOptionSelection(optionsList, selectedIds(step));
          updateNext();
        };
      })(opt));
      optionsList.appendChild(opt);
    });

    setOptionSelection(optionsList, selectedIds(step));
    container.appendChild(optionsList);
  }

  function renderResult(scaleRes, implRes) {
    app.innerHTML = "";

    var budgetRes = null;
    if (window.BudgetEngine && typeof window.BudgetEngine.evaluateBudget === "function") {
      budgetRes = window.BudgetEngine.evaluateBudget({
        answers: state.answers,
        scaleResult: scaleRes,
        implementationResult: implRes
      });
    }

    var ongoingRes = null;
    if (
      window.OngoingCostsEngine &&
      typeof window.OngoingCostsEngine.getOngoingCosts === "function"
    ) {
      ongoingRes = window.OngoingCostsEngine.getOngoingCosts({
        answers: state.answers,
        scaleResult: scaleRes,
        implementationResult: implRes,
        budgetResult: budgetRes
      });
    }

    var container = document.createElement("section");
    container.className = "screen card";

    container.appendChild(el("p", "card__badge", "Рекомендация"));
    container.appendChild(el("h1", "screen__title card__title-screen", "Вам подойдёт:"));
    container.appendChild(
      el("h2", "card__name", recommendationName(scaleRes, implRes, budgetRes))
    );

    var why = el("section", "card__block card__why");
    why.appendChild(el("h3", "card__heading", "Почему такой вариант"));
    humanizeWhy(scaleRes, implRes, budgetRes).forEach(function (sentence) {
      why.appendChild(el("p", "card__text", sentence));
    });
    container.appendChild(why);

    var costs = el("div", "card__costs");

    if (budgetRes && budgetRes.displayPrice) {
      var dev = el("section", "card__block card__dev");
      dev.appendChild(el("h3", "card__heading", "Разработка"));
      dev.appendChild(el("p", "card__price", budgetRes.displayPrice));
      if (budgetRes.status === "individual-estimate" && budgetRes.message) {
        dev.appendChild(el("p", "card__caption", budgetRes.message));
      } else {
        dev.appendChild(
          el(
            "p",
            "card__caption",
            "Это предварительный ориентир. Точная стоимость зависит от объёма материалов и функций."
          )
        );
      }
      costs.appendChild(dev);
    }

    if (ongoingRes && ongoingRes.display) {
      var ongoing = el("section", "card__block card__ongoing");
      ongoing.appendChild(el("h3", "card__heading", "После запуска"));
      ongoing.appendChild(el("p", "card__text card__ongoing-cost", ongoingRes.display));
      (ongoingRes.details || []).forEach(function (detail) {
        ongoing.appendChild(el("p", "card__text", detail));
      });
      if (ongoingRes.note) {
        ongoing.appendChild(el("p", "card__caption", ongoingRes.note));
      }
      if (
        ongoingRes.note &&
        ongoingRes.note.indexOf("Тарифы платформ могут меняться.") === -1 &&
        (implRes.primary === "taplink" || implRes.primary === "tilda")
      ) {
        ongoing.appendChild(el("p", "card__caption", "Тарифы платформ могут меняться."));
      }
      costs.appendChild(ongoing);
    }

    if (costs.children.length > 0) {
      container.appendChild(costs);
    }

    if (budgetRes && budgetRes.status === "below") {
      var below = el("section", "card__block card__budget");
      below.appendChild(
        el("h3", "card__heading", "Ваш бюджет сейчас ниже этого ориентира")
      );
      below.appendChild(
        el(
          "p",
          "card__text",
          "Это не значит, что нужно выбирать неподходящую платформу."
        )
      );
      [
        "— Сократить первую версию до самого важного.",
        "— Запустить проект поэтапно."
      ].forEach(function (optionText) {
        below.appendChild(el("p", "card__text card__text--item", optionText));
      });
      container.appendChild(below);
    }

    var altText = alternativeSentence(implRes);
    if (altText) {
      var alt = el("section", "card__block card__alt");
      alt.appendChild(el("h3", "card__heading", "Можно рассмотреть и другой вариант"));
      alt.appendChild(el("p", "card__text", altText));
      container.appendChild(alt);
    }

    var cta = el("section", "card__block card__cta");
    cta.appendChild(el("h3", "card__heading", "Хотите обсудить ваш проект?"));
    cta.appendChild(
      el(
        "p",
        "card__text",
        "Напишите мне — я посмотрю задачу и помогу уточнить формат, объём и следующий шаг."
      )
    );

    var ctaActions = document.createElement("div");
    ctaActions.className = "card__cta-actions";

    var telegram = document.createElement("a");
    telegram.className = "button button--primary card__cta-link";
    telegram.setAttribute("href", "https://t.me/TuianaBudaeva");
    telegram.setAttribute("target", "_blank");
    telegram.setAttribute("rel", "noopener");
    telegram.textContent = "Написать в Telegram";
    ctaActions.appendChild(telegram);

    var max = document.createElement("a");
    max.className = "button button--secondary card__cta-link";
    max.setAttribute("href", MAX_URL);
    max.setAttribute("target", "_blank");
    max.setAttribute("rel", "noopener");
    max.textContent = "Написать в MAX";
    ctaActions.appendChild(max);

    cta.appendChild(ctaActions);

    var restart = createButton(
      UI.restartLabel,
      "button button--secondary card__restart",
      function () {
        restartFlow();
      }
    );
    cta.appendChild(restart);
    container.appendChild(cta);

    container.appendChild(
      el(
        "p",
        "card__disclaimer",
        "Результат навигатора предварительный и не является техническим заданием или окончательным расчётом стоимости."
      )
    );

    app.appendChild(container);
  }

  function renderConsultation(implRes) {
    app.innerHTML = "";

    var container = document.createElement("section");
    container.className = "screen screen--info";

    var badge = document.createElement("p");
    badge.className = "screen__badge";
    badge.textContent = "Нужно уточнение";
    container.appendChild(badge);

    var title = document.createElement("h1");
    title.className = "screen__title";
    title.textContent = CLARIFY_TITLE;
    container.appendChild(title);

    var a = state.answers || {};
    var development = Array.isArray(a.development) ? a.development : [];
    var reason = "";
    if (development.indexOf("not-sure") !== -1) {
      reason =
        "Пока неясно, как проект может развиваться дальше, а это влияет на выбор способа реализации.";
    } else if (a["edit-priority"] === "not-sure") {
      reason =
        "Нужно понять, что для вас важнее: самостоятельно часто менять сайт или получить больше свободы в дизайне.";
    } else if (implRes && implRes.clarification && implRes.clarification.question) {
      reason = "Сейчас не хватает одного ответа: «" + implRes.clarification.question + "».";
    } else {
      reason = "По вашим ответам пока нельзя уверенно выбрать один вариант.";
    }

    var text = document.createElement("p");
    text.className = "screen__text";
    text.textContent = reason;
    container.appendChild(text);

    var ctaActions = document.createElement("div");
    ctaActions.className = "screen__cta-actions";

    var telegram = document.createElement("a");
    telegram.className = "button button--primary screen__cta";
    telegram.setAttribute("href", "https://t.me/TuianaBudaeva");
    telegram.setAttribute("target", "_blank");
    telegram.setAttribute("rel", "noopener");
    telegram.textContent = "Уточнить в Telegram";
    ctaActions.appendChild(telegram);

    var max = document.createElement("a");
    max.className = "button button--secondary screen__cta";
    max.setAttribute("href", MAX_URL);
    max.setAttribute("target", "_blank");
    max.setAttribute("rel", "noopener");
    max.textContent = "Уточнить в MAX";
    ctaActions.appendChild(max);

    container.appendChild(ctaActions);

    var restart = createButton(
      UI.restartLabel,
      "button button--secondary screen__restart",
      function () {
        restartFlow();
      }
    );
    container.appendChild(restart);
    app.appendChild(container);
  }

  function renderScaleUndefined() {
    app.innerHTML = "";

    var container = document.createElement("section");
    container.className = "screen screen--info";

    var badge = document.createElement("p");
    badge.className = "screen__badge";
    badge.textContent = "Нужно уточнение";
    container.appendChild(badge);

    var title = document.createElement("h1");
    title.className = "screen__title";
    title.textContent = CLARIFY_TITLE;
    container.appendChild(title);

    var text = document.createElement("p");
    text.className = "screen__text";
    text.textContent =
      "Пока неясно, достаточно одной страницы или нужны отдельные самостоятельные разделы.";
    container.appendChild(text);

    var ctaActions = document.createElement("div");
    ctaActions.className = "screen__cta-actions";

    var telegram = document.createElement("a");
    telegram.className = "button button--primary screen__cta";
    telegram.setAttribute("href", "https://t.me/TuianaBudaeva");
    telegram.setAttribute("target", "_blank");
    telegram.setAttribute("rel", "noopener");
    telegram.textContent = "Уточнить в Telegram";
    ctaActions.appendChild(telegram);

    var max = document.createElement("a");
    max.className = "button button--secondary screen__cta";
    max.setAttribute("href", MAX_URL);
    max.setAttribute("target", "_blank");
    max.setAttribute("rel", "noopener");
    max.textContent = "Уточнить в MAX";
    ctaActions.appendChild(max);

    container.appendChild(ctaActions);

    var restart = createButton(
      UI.restartLabel,
      "button button--secondary screen__restart",
      function () {
        restartFlow();
      }
    );
    container.appendChild(restart);
    app.appendChild(container);
  }

  function finishRoute() {
    var scaleRes = scaleResult();
    var implRes = implementationResult();

    if (implRes.status === "clarify") {
      if (implRes.needsConsultation || !implRes.clarification) {
        renderConsultation(implRes);
        return;
      }
      var key = implRes.clarification.key;
      if (key === DEVELOPMENT_ID || key === EDIT_PRIORITY_ID) {
        renderScreen(key);
        return;
      }
      renderConsultation(implRes);
      return;
    }

    if (scaleRes.status === "one-page" || scaleRes.status === "multi-page") {
      renderResult(scaleRes, implRes);
      return;
    }

    renderScaleUndefined(implRes);
  }

  function advance(id) {
    var fresh = buildSteps();
    var pos = fresh.indexOf(id);
    if (pos === -1) {
      finishRoute();
      return;
    }
    if (pos + 1 < fresh.length) {
      renderScreen(fresh[pos + 1]);
      return;
    }
    finishRoute();
  }

  function renderScreen(id) {
    var entry = stepById(id);
    if (!entry) {
      renderStart();
      return;
    }
    var step = entry.step;
    var isBase = entry.kind === "base";
    state.currentStepId = id;

    var steps = buildSteps();
    var stepIndex = steps.indexOf(id);
    var baseSteps = steps.filter(function (stepId) {
      return findQuestion(stepId) !== null;
    });
    var baseTotal = baseSteps.length;
    var baseNumber = baseSteps.indexOf(id) + 1;

    app.innerHTML = "";

    var container = document.createElement("section");
    container.className = "screen screen--question";

    var side = document.createElement("div");
    side.className = "screen__side";

    var eyebrow = document.createElement("p");
    eyebrow.className = "screen__step";
    if (isBase) {
      eyebrow.textContent =
        UI.questionLabel +
        " " +
        String(baseNumber) +
        " " +
        UI.ofLabel +
        " " +
        String(baseTotal);
    } else {
      eyebrow.textContent = UI.branchLabel;
    }
    side.appendChild(eyebrow);

    var fraction;
    if (isBase) {
      fraction = baseTotal > 0 ? baseNumber / baseTotal : 0;
    } else {
      var answeredBase = steps
        .slice(0, stepIndex)
        .filter(function (stepId) {
          return findQuestion(stepId) !== null;
        }).length;
      fraction = baseTotal > 0 ? answeredBase / baseTotal : 0;
    }
    var track = document.createElement("div");
    track.className = "progress";
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "100");
    track.setAttribute("aria-valuenow", String(Math.round(fraction * 100)));
    var bar = document.createElement("div");
    bar.className = "progress__bar";
    bar.style.width = Math.round(fraction * 100) + "%";
    track.appendChild(bar);
    side.appendChild(track);
    container.appendChild(side);

    var main = document.createElement("div");
    main.className = "screen__main";

    var title = document.createElement("h1");
    title.className = "screen__title";
    title.textContent = step.title;
    main.appendChild(title);

    var nextButton = createButton(
      step.nextLabel || UI.nextFallback,
      "button button--primary button--next",
      function () {
        if (!hasAnswer(step)) {
          return;
        }
        advance(id);
      }
    );
    nextButton.disabled = true;

    function updateNext() {
      nextButton.disabled = !hasAnswer(step);
    }

    if (step.type === "budget") {
      buildBudget(main, step, updateNext);
    } else {
      buildOptions(main, step, updateNext, entry.kind);
    }

    var buttonsRow = document.createElement("div");
    buttonsRow.className = "buttons";

    if (stepIndex > 0) {
      var back = createButton(
        UI.backLabel,
        "button button--secondary button--back",
        function () {
          var fresh = buildSteps();
          var pos = fresh.indexOf(id);
          if (pos > 0) {
            renderScreen(fresh[pos - 1]);
          }
        }
      );
      buttonsRow.appendChild(back);
    }

    buttonsRow.appendChild(nextButton);
    main.appendChild(buttonsRow);
    container.appendChild(main);
    app.appendChild(container);
    updateNext();
  }

  function boot() {
    var broken =
      !data ||
      !data.start ||
      !data.questions ||
      data.questions.length === 0 ||
      !data.branches ||
      !data.conditional ||
      !engine ||
      typeof engine.determineScale !== "function" ||
      typeof engine.determineImplementation !== "function" ||
      typeof engine.getClarificationDefinition !== "function" ||
      !window.BudgetEngine ||
      typeof window.BudgetEngine.evaluateBudget !== "function" ||
      !window.OngoingCostsEngine ||
      typeof window.OngoingCostsEngine.getOngoingCosts !== "function";
    if (broken) {
      app.innerHTML = "";
      var msg = document.createElement("p");
      msg.textContent = UI.dataMissing;
      app.appendChild(msg);
      return;
    }
    renderStart();
  }

  document.addEventListener("DOMContentLoaded", boot);
})();