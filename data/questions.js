(function () {
  "use strict";

  var start = {
    title: "Какой сайт вам нужен?",
    description:
      "Ответьте на несколько коротких вопросов о своей задаче — навигатор поможет понять, " +
      "какой формат проекта может вам подойти.",
    button: "Начать"
  };

  var budget = {
    placeholder: "Например, 100 000",
    currency: "₽",
    notSureLabel:
      "Пока не знаю — хочу сначала понять, какой сайт нужен для моей задачи."
  };

  var complete = {
    title: "Базовая часть опроса завершена",
    text:
      "Ответы сохранены. На следующем этапе навигатор сможет " +
      "сформировать рекомендацию.",
    restartLabel: "Пройти заново"
  };

  var questions = [
    {
      id: "q1",
      order: 1,
      type: "single",
      title: "Что вы хотите представить на сайте?",
      nextLabel: "Дальше",
      options: [
        { id: "self-services", label: "Себя и свои услуги" },
        { id: "company", label: "Компанию или команду" },
        {
          id: "several-services",
          label: "Несколько услуг или направлений"
        },
        { id: "products", label: "Товары" },
        {
          id: "online-tool",
          label:
            "Онлайн-инструмент: тест, калькулятор, личный кабинет и т.\u00A0п."
        },
        { id: "not-sure", label: "Пока не знаю" }
      ]
    },
    {
      id: "q2",
      order: 2,
      type: "single",
      title: "Как нужно представить информацию на сайте?",
      nextLabel: "Дальше",
      options: [
        { id: "one-service", label: "Есть одна основная тема или предложение" },
        {
          id: "similar-services",
          label: "Есть несколько связанных частей — их можно показать вместе"
        },
        {
          id: "different-services",
          label:
            "Есть самостоятельные услуги, направления или категории — их лучше раскрыть отдельно"
        },
        {
          id: "many-directions",
          label: "Информации много: несколько направлений, специалистов, категорий или разделов"
        },
        { id: "not-sure", label: "Пока не знаю" }
      ]
    },
    {
      id: "q3",
      order: 3,
      type: "multiple",
      title: "Что человек должен сделать на сайте?",
      hint: "Можно выбрать несколько вариантов.",
      nextLabel: "Дальше",
      options: [
        {
          id: "contact",
          label: "Прочитать информацию и связаться со\u00A0мной"
        },
        { id: "request", label: "Оставить заявку" },
        { id: "book", label: "Записаться" },
        { id: "pay", label: "Оплатить услугу" },
        { id: "buy", label: "Купить товар" },
        {
          id: "personal-result",
          label: "Получить расчёт, результат теста или другую персональную информацию"
        },
        { id: "account", label: "Входить в личный кабинет" },
        { id: "other", label: "Другое" }
      ]
    },
    {
      id: "q4",
      order: 4,
      type: "single",
      title: "Как вы хотите, чтобы сайт выглядел на компьютере?",
      nextLabel: "Дальше",
      options: [
        {
          id: "compact",
          label: "Мне подходит компактная аккуратная страница"
        },
        { id: "wide", label: "Хочу полноценный широкий сайт" },
        {
          id: "unusual-design",
          label: "Для меня особенно важны необычный дизайн, анимация и эффектная подача"
        },
        { id: "no-preference", label: "Мне не принципиально" },
        { id: "show-examples", label: "Не знаю — покажите примеры" }
      ]
    },
    {
      id: "q5",
      order: 5,
      type: "single",
      title: "Как вам удобнее обновлять сайт после запуска?",
      nextLabel: "Дальше",
      options: [
        { id: "rarely", label: "Почти ничего менять не планирую" },
        {
          id: "sometimes",
          label: "Иногда хочу сам(а) менять цены, тексты или фотографии"
        },
        {
          id: "often",
          label: "Хочу регулярно самостоятельно обновлять сайт"
        },
        {
          id: "via-specialist",
          label: "Мне удобнее передавать изменения специалисту"
        },
        {
          id: "mixed",
          label: "Часть изменений сделаю сам(а), сложные передам специалисту"
        },
        { id: "not-sure", label: "Пока не знаю" }
      ]
    },
    {
      id: "q6",
      order: 6,
      type: "budget",
      title: "На какой бюджет на создание сайта вы ориентируетесь?",
      intro:
        "Укажите примерно. Это не окончательная стоимость — навигатор поможет понять, " +
        "что можно реализовать в этом бюджете.",
      nextLabel: "Дальше"
    }
  ];

  var branches = [
    {
      id: "booking",
      type: "single",
      title: "Как должна работать запись?",
      nextLabel: "Дальше",
      options: [
        {
          id: "button-contact",
          label: "Достаточно кнопки, чтобы написать или позвонить"
        },
        {
          id: "leave-contacts",
          label: "Человек оставляет контакты, а мы связываемся с ним"
        },
        {
          id: "choose-date-time",
          label: "Человек сам выбирает дату и время"
        },
        {
          id: "choose-specialist-date-time",
          label: "Нужно выбрать специалиста, дату и время"
        },
        { id: "not-sure", label: "Пока не знаю" }
      ]
    },
    {
      id: "shop-count",
      type: "single",
      title: "Примерно сколько товаров будет на сайте?",
      nextLabel: "Дальше",
      options: [
        { id: "up-to-10", label: "До 10" },
        { id: "10-50", label: "10–50" },
        { id: "50-200", label: "50–200" },
        { id: "more-200", label: "Больше 200" },
        { id: "not-sure", label: "Пока не знаю" }
      ]
    },
    {
      id: "shop-updates",
      type: "single",
      title: "Как часто будет меняться ассортимент?",
      nextLabel: "Дальше",
      options: [
        { id: "rarely", label: "Редко" },
        { id: "sometimes", label: "Иногда" },
        { id: "regularly", label: "Регулярно" },
        { id: "not-sure", label: "Пока не знаю" }
      ]
    },
    {
      id: "shop-needs",
      type: "multiple",
      title: "Что нужно для продажи?",
      hint: "Можно выбрать несколько вариантов.",
      nextLabel: "Дальше",
      options: [
        {
          id: "show-and-request",
          label: "Показать товары и принимать заявки"
        },
        { id: "cart", label: "Корзина" },
        { id: "online-payment", label: "Оплата на сайте" },
        {
          id: "variants",
          label: "Варианты товара: размер, цвет и т.\u00A0п."
        },
        { id: "stock", label: "Учёт наличия" },
        { id: "delivery", label: "Разные способы доставки" },
        { id: "discounts", label: "Скидки или промокоды" },
        { id: "not-sure", label: "Пока не знаю" }
      ]
    },
    {
      id: "calculator",
      type: "single",
      title: "Что должен делать сайт?",
      nextLabel: "Дальше",
      options: [
        { id: "just-send", label: "Просто принять ответы и отправить их" },
        { id: "calculate", label: "Сам рассчитать результат" },
        { id: "show-result", label: "Показать персональный результат" },
        {
          id: "save-result",
          label: "Сохранить результат, чтобы к нему можно было вернуться"
        },
        { id: "history", label: "Хранить историю результатов" },
        { id: "not-sure", label: "Пока не знаю" }
      ]
    },
    {
      id: "account",
      type: "multiple",
      title: "Что человек должен делать в личном кабинете?",
      hint: "Можно выбрать несколько вариантов.",
      nextLabel: "Дальше",
      options: [
        { id: "view-data", label: "Смотреть свои данные" },
        { id: "view-orders", label: "Смотреть историю заявок или заказов" },
        { id: "get-results", label: "Получать результаты" },
        { id: "files", label: "Загружать или скачивать файлы" },
        { id: "pay-services", label: "Оплачивать услуги" },
        { id: "edit-data", label: "Менять свои данные" },
        { id: "other", label: "Другое" },
        { id: "not-sure", label: "Пока не знаю" }
      ]
    },
    {
      id: "editing",
      type: "multiple",
      title: "Что вы планируете менять?",
      hint: "Можно выбрать несколько вариантов.",
      nextLabel: "Дальше",
      options: [
        { id: "prices", label: "Цены" },
        { id: "texts", label: "Тексты" },
        { id: "photos", label: "Фотографии" },
        { id: "services", label: "Услуги" },
        { id: "schedule", label: "Расписание" },
        { id: "specialists", label: "Специалистов" },
        { id: "products", label: "Товары" },
        { id: "pages", label: "Страницы" },
        { id: "news", label: "Новости или статьи" },
        { id: "other", label: "Другое" }
      ]
    }
  ];

  var conditional = {
    q3: {
      book: ["booking"],
      buy: ["shop-count", "shop-updates", "shop-needs"],
      "personal-result": ["calculator"],
      account: ["account"]
    },
    q5: {
      often: ["editing"]
    }
  };

  window.APP_DATA = {
    start: start,
    budget: budget,
    complete: complete,
    questions: questions,
    branches: branches,
    conditional: conditional
  };
})();