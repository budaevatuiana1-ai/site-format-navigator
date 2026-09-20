(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else if (root) {
    root.ScaleEngine = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var Q1_ONLINE_TOOL = "online-tool";
  var Q1_SEVERAL_SERVICES = "several-services";
  var Q2_ONE_SERVICE = "one-service";
  var Q2_SIMILAR = "similar-services";
  var Q2_DIFFERENT = "different-services";
  var Q2_MANY = "many-directions";
  var CLARIFY_KEY = "scale-clarify";
  var TOOL_CLARIFY_KEY = "tool-clarify";
  var DEVELOPMENT_KEY = "development";
  var EDIT_PRIORITY_KEY = "edit-priority";

  var CLARIFICATION = {
    key: CLARIFY_KEY,
    question:
      "Есть ли на сайте такие услуги или направления, " +
      "о которых человеку нужно будет читать отдельно, " +
      "не проходя всю остальную страницу?",
    options: [
      { id: "no", label: "Нет, всё связано и может идти последовательно" },
      { id: "yes", label: "Да, есть несколько самостоятельных направлений" },
      { id: "not-sure", label: "Пока не знаю" }
    ]
  };

  var TOOL_CLARIFICATION = {
    key: TOOL_CLARIFY_KEY,
    question:
      "Нужны ли вашему проекту несколько самостоятельных страниц или разделов?",
    options: [
      {
        id: "no",
        label: "Нет, основную задачу можно решить в одном последовательном сценарии"
      },
      {
        id: "yes",
        label: "Да, нужны отдельные самостоятельные страницы или разделы"
      },
      { id: "not-sure", label: "Пока не знаю" }
    ]
  };

  function clarify(reasons, clarification) {
    return {
      status: "clarify",
      reasons: reasons || [],
      clarification: clarification || CLARIFICATION
    };
  }

  function onePage(reasons) {
    return {
      status: "one-page",
      reasons: reasons || [],
      clarification: null
    };
  }

  function multiPage(reasons) {
    return {
      status: "multi-page",
      reasons: reasons || [],
      clarification: null
    };
  }

  function determineScale(answers) {
    var a = answers || {};

    if (a.q1 === Q1_ONLINE_TOOL) {
      if (a[TOOL_CLARIFY_KEY] === "yes") {
        return multiPage([
          "Уточнение подтвердило, что проекту нужны " +
            "отдельные самостоятельные страницы или разделы."
        ]);
      }
      if (a[TOOL_CLARIFY_KEY] === "no") {
        return onePage([
          "Уточнение подтвердило, что основную задачу можно решить " +
            "в одном последовательном сценарии."
        ]);
      }
      return clarify(
        [
          "Проект представляет собой онлайн-инструмент.",
          "Структуру страниц или экранов самого сервиса " +
            "из ответов о количестве или различии услуг не определить."
        ],
        TOOL_CLARIFICATION
      );
    }

    if (a[CLARIFY_KEY] === "yes") {
      return multiPage([
        "Уточнение подтвердило, что есть несколько самостоятельных направлений.",
        "Информацию нужно раскрывать отдельными страницами."
      ]);
    }
    if (a[CLARIFY_KEY] === "no") {
      return onePage([
        "Уточнение подтвердило, что информация в основном связана " +
          "и может идти последовательно в рамках одной страницы."
      ]);
    }
    if (a[CLARIFY_KEY] === "not-sure") {
      return clarify([
        "Ответ на уточняющий вопрос: «Пока не знаю».",
        "Масштаб остаётся неопределённым."
      ]);
    }

    if (a.q1 === Q1_SEVERAL_SERVICES && a.q2 === Q2_ONE_SERVICE) {
      return clarify([
        "Ответы противоречат друг другу: выбрано несколько услуг или направлений, " +
          "но при этом указана одна основная услуга.",
        "Масштаб нельзя определить без дополнительного уточнения."
      ]);
    }

    if (a.q2 === Q2_ONE_SERVICE) {
      return onePage([
        "Выбрана одна основная услуга или предложение.",
        "Нет самостоятельных направлений, которым нужны отдельные страницы."
      ]);
    }
    if (a.q2 === Q2_SIMILAR) {
      return onePage([
        "Несколько близких услуг можно логично раскрыть вместе.",
        "У посетителя один основной пользовательский сценарий."
      ]);
    }
    if (a.q2 === Q2_DIFFERENT) {
      return multiPage([
        "Есть несколько разных услуг или направлений.",
        "Каждое требует подробного самостоятельного раскрытия."
      ]);
    }
    if (a.q2 === Q2_MANY) {
      return multiPage([
        "Присутствует много направлений, специалистов или самостоятельных разделов.",
        "Структура явно требует отдельных страниц."
      ]);
    }

    return clarify([
      "Ответ о структуре услуг и направлений не даёт достаточных данных.",
      "Масштаб нельзя определить без дополнительного уточнения."
    ]);
  }

  var IMPL_TAPLINK = "taplink";
  var IMPL_TILDA = "tilda";
  var IMPL_CODE = "code";

  var CALC_LOGIC_IDS = ["calculate", "save-result", "history"];
  var ACCOUNT_DATA_IDS = [
    "view-data",
    "view-orders",
    "get-results",
    "files",
    "pay-services",
    "edit-data"
  ];
  var DEV_SERVICE_IDS = [
    "calculator-test",
    "personal-account"
  ];
  var DEV_STRUCTURE_IDS = [
    "new-pages-services",
    "new-specialists",
    "products"
  ];
  var DEV_NOTHING_IDS = ["nothing-planned"];

  var DEVELOPMENT_CLARIFICATION = {
    key: DEVELOPMENT_KEY,
    question: "Что может появиться на сайте позже?",
    hint: "Можно выбрать несколько вариантов.",
    multiple: true,
    options: [
      { id: "new-pages-services", label: "Новые услуги или страницы" },
      { id: "new-specialists", label: "Новые специалисты" },
      { id: "products", label: "Товары" },
      { id: "booking", label: "Онлайн-запись" },
      { id: "payment", label: "Оплата" },
      { id: "calculator-test", label: "Калькулятор или тест" },
      { id: "personal-account", label: "Личный кабинет" },
      { id: "other-functions", label: "Другие новые функции" },
      { id: "nothing-planned", label: "Ничего такого пока не планирую" },
      { id: "not-sure", label: "Пока не знаю" }
    ]
  };

  var VISUAL_EDIT_CLARIFICATION = {
    key: EDIT_PRIORITY_KEY,
    question: "Что для вас важнее после запуска сайта?",
    multiple: false,
    options: [
      {
        id: "self-edit",
        label: "Самостоятельно легко менять большую часть информации"
      },
      {
        id: "design-freedom",
        label:
          "Получить больше свободы в дизайне, а изменения при необходимости передавать специалисту"
      },
      { id: "not-sure", label: "Пока не знаю" }
    ]
  };

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

  function recommend(primary, alternative, reasons, tradeoffs) {
    return {
      status: "recommend",
      primary: primary,
      alternative: alternative,
      reasons: reasons || [],
      tradeoffs: tradeoffs || [],
      clarification: null,
      needsConsultation: false
    };
  }

  function clarifyImplementation(reasons, clarification, needsConsultation) {
    return {
      status: "clarify",
      primary: null,
      alternative: null,
      reasons: reasons || [],
      tradeoffs: [],
      clarification: clarification || null,
      needsConsultation: !!needsConsultation
    };
  }

  function determineImplementation(answers) {
    var a = answers || {};
    var q1 = a.q1;
    var q2 = a.q2;
    var q4 = a.q4;
    var q5 = a.q5;

    var q3 = asList(a.q3);
    var account = asList(a.account);
    var development = asList(a.development);

    var reasons = [];
    var tradeoffs = [];

    var codeLogic = CALC_LOGIC_IDS.indexOf(a.calculator) !== -1;
    var accountData =
      q3.indexOf("account") !== -1 &&
      account.length > 0 &&
      hasAny(account, ACCOUNT_DATA_IDS);
    var devService = hasAny(development, DEV_SERVICE_IDS);
    var devStructure = hasAny(development, DEV_STRUCTURE_IDS);
    var devNothing = hasAny(development, DEV_NOTHING_IDS);
    var developmentAnswered = development.length > 0;

    if (codeLogic || accountData) {
      if (codeLogic) {
        reasons.push(
          "Система должна выполнять собственную логику: рассчитывать, сохранять или возвращать персональные результаты."
        );
      }
      if (accountData) {
        reasons.push(
          "Нужен личный кабинет, который работает с данными пользователя: данными, заказами, результатами, файлами или оплатой."
        );
      }
      tradeoffs.push(
        "Tilda и Taplink покрывают информационную часть и стандартные функции, но собственную логику сервиса на них придётся собирать из обходных решений."
      );
      tradeoffs.push(
        "Разовая стоимость выше, зато функциональность не ограничена возможностями конкретного конструктора."
      );
      return recommend(IMPL_CODE, null, reasons, tradeoffs);
    }

    if (q4 === "unusual-design" && q5 === "often") {
      reasons.push(
        "Одновременно важны индивидуальная визуальная подача и частое самостоятельное обновление контента."
      );
      reasons.push(
        "Эти требования ведут к разным акцентам в выборе, нужен приоритет."
      );
      if (a[EDIT_PRIORITY_KEY] === "self-edit") {
        reasons.push(
          "Приоритет отдан самостоятельному обновлению — нужен удобный визуальный редактор платформы."
        );
        tradeoffs.push(
          "Собственной сложной логики нет, поэтому индивидуальная разработка не нужна."
        );
        return recommend(IMPL_TILDA, null, reasons, tradeoffs);
      }
      if (a[EDIT_PRIORITY_KEY] === "design-freedom") {
        reasons.push(
          "Приоритет отдан свободе дизайна — её закрывает построечный редактор Tilda Zero Block, а изменения можно передавать специалисту."
        );
        tradeoffs.push(
          "Собственной сложной логики нет, поэтому индивидуальная разработка не нужна."
        );
        return recommend(IMPL_TILDA, null, reasons, tradeoffs);
      }
      if (a[EDIT_PRIORITY_KEY] === "not-sure") {
        reasons.push(
          "Ответ на уточняющий вопрос: «Пока не знаю»."
        );
        reasons.push(
          "Приоритет остаётся неопределённым, для рекомендации нужна консультация."
        );
        return clarifyImplementation(reasons, null, true);
      }
      return clarifyImplementation(reasons, VISUAL_EDIT_CLARIFICATION);
    }

    var q4Wide = q4 === "wide";
    var q4Unusual = q4 === "unusual-design";
    var q4Compact = q4 === "compact";
    var q4Neutral = q4 === "no-preference" || q4 === "show-examples";
    var q5Often = q5 === "often";
    var structureRich =
      q2 === "different-services" || q2 === "many-directions";
    var onlineTool = q1 === "online-tool";
    var shop =
      q1 === "products" || q3.indexOf("buy") !== -1;
    var shopCount = a["shop-count"];
    var shopLargeCatalog =
      shopCount === "50-200" || shopCount === "more-200";
    var shopRegular = a["shop-updates"] === "regularly";

    if (shop) {
      if (q4Wide || q4Unusual || shopLargeCatalog || shopRegular || q5Often) {
        reasons.push(
          "Интернет-магазину нужен стандартный каталог, корзина и оплата — это типовые функции бизнес-сайта."
        );
        if (q4Wide || q4Unusual) {
          reasons.push(
            "Важно полноценное отображение на компьютере и аккуратная desktop-композиция."
          );
        }
        if (shopRegular || q5Often) {
          reasons.push(
            "Ассортимент, цены и наличие будут регулярно обновляться, и обновления удобно делать самостоятельно."
          );
        }
        if (shopLargeCatalog) {
          reasons.push(
            "Каталог достаточно большой, ему нужно удобное управление ассортиментом."
          );
        }
        tradeoffs.push(
          "Taplink уступает, если нужна широкая desktop-композиция, растущий каталог и регулярные самостоятельные обновления."
        );
        tradeoffs.push(
          "Собственной сложной логики магазина нет, поэтому индивидуальная разработка кодом не даёт практического преимущества."
        );
        return recommend(IMPL_TILDA, null, reasons, tradeoffs);
      }
      if (
        q4Compact &&
        shopCount === "up-to-10" &&
        !shopRegular &&
        !q5Often
      ) {
        reasons.push(
          "Каталог действительно маленький: до 10 товаров."
        );
        reasons.push(
          "Магазин компактно организован, полноценный desktop-каталог не требуется."
        );
        reasons.push(
          "Ассортимент меняется редко или нерегулярно, стандартных возможностей продажи достаточно."
        );
        tradeoffs.push(
          "Если товаров станет заметно больше или понадобятся широкий desktop и полноценный каталог, Tilda будет удобнее."
        );
        return recommend(IMPL_TAPLINK, IMPL_TILDA, reasons, tradeoffs);
      }
      reasons.push(
        "Данных о магазине недостаточно, чтобы уверенно выбрать между Taplink и Tilda: важны композиция на больших экранах, частота обновления и удобство управления каталогом."
      );
      if (devService) {
        reasons.push(
          "Уточнение подтвердило развитие цифрового сервиса: калькулятор, тест или личный кабинет."
        );
        reasons.push(
          "Платформы не покрывают такую собственную функциональность без обходных решений."
        );
        return recommend(IMPL_CODE, null, reasons, tradeoffs);
      }
      if (devStructure) {
        reasons.push(
          "Уточнение подтвердило расширение: новые страницы, специалисты или товары."
        );
        return recommend(IMPL_TILDA, null, reasons, tradeoffs);
      }
      if (devNothing) {
        reasons.push(
          "Уточнение подтвердило, что заметного расширения не планируется — каталогу достаточно управления на готовой платформе."
        );
        return recommend(IMPL_TILDA, null, reasons, tradeoffs);
      }
      if (developmentAnswered) {
        reasons.push(
          "Ответы на уточняющий вопрос о развитии не дают достаточного основания выбрать платформу."
        );
        reasons.push(
          "Автоматического уточнения больше недостаточно, понадобится консультация."
        );
        return clarifyImplementation(reasons, null, true);
      }
      return clarifyImplementation(reasons, DEVELOPMENT_CLARIFICATION);
    }

    if (onlineTool) {
      reasons.push(
        "Проект представляет собой онлайн-инструмент, но сейчас в нём нет сильных признаков собственной логики."
      );
      reasons.push(
        "Он может остаться на готовой платформе или развиться в полноценный сервис — нужно понять планы."
      );
      if (devService) {
        reasons.push(
          "Уточнение подтвердило развитие цифрового сервиса: калькулятор, тест или личный кабинет."
        );
        reasons.push(
          "Платформы не покрывают такую собственную функциональность без обходных решений."
        );
        return recommend(IMPL_CODE, null, reasons, tradeoffs);
      }
      if (devStructure) {
        reasons.push(
          "Уточнение подтвердило расширение контента: новые страницы, специалисты или товары."
        );
        return recommend(IMPL_TILDA, null, reasons, tradeoffs);
      }
      if (devNothing) {
        reasons.push(
          "Уточнение подтвердило, что проект остаётся в текущем объёме — платформы достаточно."
        );
        return recommend(IMPL_TILDA, null, reasons, tradeoffs);
      }
      if (developmentAnswered) {
        reasons.push(
          "Ответы на уточняющий вопрос о развитии не дают достаточного основания выбрать платформу или код."
        );
        reasons.push(
          "Автоматического уточнения больше недостаточно, понадобится консультация."
        );
        return clarifyImplementation(reasons, null, true);
      }
      return clarifyImplementation(reasons, DEVELOPMENT_CLARIFICATION);
    }

    if (q4Wide || q4Unusual) {
      if (q4Unusual) {
        reasons.push(
          "Важны индивидуальная композиция, анимация и эффектная визуальная подача."
        );
      }
      if (q4Wide) {
        reasons.push(
          "Нужна полноценная широкая композиция с качественной адаптацией под разные экраны."
        );
      }
      tradeoffs.push(
        "Компактная композиционная модель Taplink хуже подходит, когда важно активное использование пространства большого экрана."
      );
      tradeoffs.push(
        "Собственной сложной логики нет, поэтому код не нужен: Tilda Zero Block закрывает нестандартную подачу без разработки."
      );
      return recommend(IMPL_TILDA, null, reasons, tradeoffs);
    }

    if (q5Often) {
      reasons.push(
        "Клиент хочет регулярно самостоятельно обновлять значительный объём контента — нужен удобный визуальный редактор."
      );
      if (q4Compact) {
        tradeoffs.push(
          "Taplink остаётся альтернативой, если компактная подача важнее, чем широкий инструмент управления содержимым."
        );
        return recommend(IMPL_TILDA, IMPL_TAPLINK, reasons, tradeoffs);
      }
      tradeoffs.push(
        "Собственной сложной логики нет, поэтому индивидуальная разработка не даёт преимущества перед платформой с визуальным управлением."
      );
      return recommend(IMPL_TILDA, null, reasons, tradeoffs);
    }

    if (structureRich) {
      if (q4Compact) {
        reasons.push(
          "Структура богатая: несколько самостоятельных направлений или разделов, но подача при этом компактная."
        );
        reasons.push(
          "Taplink и Tilda подходят по-своему, решает соотношение компактности и будущего расширения."
        );
        if (devStructure) {
          reasons.push(
            "Уточнение подтвердило, что проект будет заметно расширяться: появятся новые страницы, специалисты или товары."
          );
          return recommend(IMPL_TILDA, null, reasons, tradeoffs);
        }
        if (devNothing) {
          reasons.push(
            "Уточнение подтвердило, что заметного расширения не планируется, компактная подача остаётся актуальной."
          );
          return recommend(IMPL_TAPLINK, null, reasons, tradeoffs);
        }
        if (developmentAnswered) {
          reasons.push(
            "Ответы на уточняющий вопрос о развитии не дают достаточного основания выбрать Taplink или Tilda."
          );
          reasons.push(
            "Автоматического уточнения больше недостаточно, понадобится консультация."
          );
          return clarifyImplementation(reasons, null, true);
        }
        return clarifyImplementation(reasons, DEVELOPMENT_CLARIFICATION);
      }
      reasons.push(
        "Есть несколько самостоятельных направлений, категорий или разделов, которым нужна структура."
      );
      tradeoffs.push(
        "Компактная модель Taplink хуже подходит при заметном количестве самостоятельных разделов."
      );
      tradeoffs.push(
        "Собственной сложной логики нет, поэтому код не обязателен."
      );
      return recommend(IMPL_TILDA, null, reasons, tradeoffs);
    }

    if (q4Compact && !q5Often) {
      reasons.push(
        "Задача компактная, сложная широкая desktop-композиция не требуется."
      );
      reasons.push(
        "Стандартных форм, заявок и подключаемых сервисов достаточно, собственной сложной логики нет."
      );
      tradeoffs.push(
        "Tilda подойдёт как альтернатива, если клиенту важнее более свободная визуальная композиция и полноценное использование большого экрана."
      );
      return recommend(IMPL_TAPLINK, IMPL_TILDA, reasons, tradeoffs);
    }

    if (q4Neutral) {
      if (q5Often) {
        reasons.push(
          "Клиент хочет регулярно самостоятельно обновлять контент — нужен визуальный редактор."
        );
        return recommend(IMPL_TILDA, null, reasons, tradeoffs);
      }
      reasons.push(
        "Обычные требования к визуальной подаче не указаны, поэтому компактный Taplink и полноценная Tilda оба подходят."
      );
      reasons.push(
        "Решение зависит от того, планирует ли проект заметно расширяться."
      );
      if (devStructure) {
        reasons.push(
          "Уточнение подтвердило расширение контента: новые страницы, специалисты или товары."
        );
        return recommend(IMPL_TILDA, null, reasons, tradeoffs);
      }
      if (devNothing) {
        reasons.push(
          "Уточнение подтвердило, что заметного расширения не планируется, компактная подача остаётся актуальной."
        );
        return recommend(IMPL_TAPLINK, null, reasons, tradeoffs);
      }
      if (developmentAnswered) {
        reasons.push(
          "Ответы на уточняющий вопрос о развитии не дают достаточного основания выбрать Taplink или Tilda."
        );
        reasons.push(
          "Автоматического уточнения больше недостаточно, понадобится консультация."
        );
        return clarifyImplementation(reasons, null, true);
      }
      return clarifyImplementation(reasons, DEVELOPMENT_CLARIFICATION);
    }

    return clarifyImplementation([
      "Данных о проекте недостаточно, чтобы уверенно выбрать способ реализации."
    ]);
  }

  // Contract: каждый clarification несёт стабильный key.
// По key его определение можно получить заново для повторного рендера.
var CLARIFICATIONS = {};
  CLARIFICATIONS[CLARIFY_KEY] = CLARIFICATION;
  CLARIFICATIONS[TOOL_CLARIFY_KEY] = TOOL_CLARIFICATION;
  CLARIFICATIONS[DEVELOPMENT_KEY] = DEVELOPMENT_CLARIFICATION;
  CLARIFICATIONS[EDIT_PRIORITY_KEY] = VISUAL_EDIT_CLARIFICATION;

  function getClarificationDefinition(key) {
    return CLARIFICATIONS[key] || null;
  }

  return {
    determineScale: determineScale,
    determineImplementation: determineImplementation,
    getClarificationDefinition: getClarificationDefinition,
    CLARIFICATIONS: CLARIFICATIONS
  };
});