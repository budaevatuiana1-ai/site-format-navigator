(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else if (root) {
    root.TUIANA_PRICES = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  return {
    "taplink-compact": {
      id: "taplink-compact",
      label: "Taplink: компактный одностраничный мини-сайт",
      minimumPrice: 15000
    },
    "taplink-structured": {
      id: "taplink-structured",
      label: "Taplink: несколько страниц или более сложная структура",
      minimumPrice: 20000
    },
    "tilda-one-page": {
      id: "tilda-one-page",
      label: "Одностраничный сайт на Tilda",
      minimumPrice: 25000
    },
    "tilda-multi-page": {
      id: "tilda-multi-page",
      label: "Многостраничный сайт на Tilda",
      minimumPrice: 35000
    },
    "code-one-page": {
      id: "code-one-page",
      label: "Простой одностраничный сайт кодом",
      minimumPrice: 30000
    },
    "code-multi-page": {
      id: "code-multi-page",
      label: "Многостраничный информационный сайт кодом",
      minimumPrice: 40000
    },
    "code-interactive": {
      id: "code-interactive",
      label: "Интерактивный инструмент с логикой",
      minimumPrice: 45000
    },
    "code-service": {
      id: "code-service",
      label: "Сложный веб-сервис с данными, личным кабинетом и историей",
      minimumPrice: 60000
    }
  };
});