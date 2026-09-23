"use strict";
const assert = require("assert");

class El {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.parent = null;
    this.type = "";
    this.className = "";
    this.textContent = "";
    this.value = "";
    this.disabled = false;
    this.style = {};
    this._attrs = {};
    this._listeners = {};
    this._set = new Set();
  }
  get classList() {
    return {
      toggle: (c, force) => {
        const has = this._set.has(c);
        if (force === undefined ? !has : force) this._set.add(c);
        else this._set.delete(c);
      },
      add: (c) => this._set.add(c),
      remove: (c) => this._set.delete(c),
      contains: (c) => this._set.has(c)
    };
  }
  setAttribute(k, v) { this._attrs[k] = v; }
  getAttribute(k) { return k in this._attrs ? this._attrs[k] : null; }
  appendChild(c) { c.parent = this; this.children.push(c); return c; }
  insertBefore(c, ref) {
    const i = this.children.indexOf(ref);
    if (i === -1) this.children.push(c);
    else this.children.splice(i, 0, c);
    c.parent = this;
    return c;
  }
  addEventListener(ev, fn) {
    (this._listeners[ev] = this._listeners[ev] || []).push(fn);
  }
  _fire(ev) {
    (this._listeners[ev] || []).forEach((fn) => fn({ type: ev, target: this }));
  }
  set innerHTML(v) { this.children = []; }
  querySelectorAll(sel) {
    const out = [];
    const walk = (n) => {
      for (const c of n.children) {
        if (sel === ".option" && c.className.split(" ").includes("option")) out.push(c);
        walk(c);
      }
    };
    walk(this);
    return out;
  }
}

const app = new El("div");
const documentShim = {
  listeners: {},
  createElement: (tag) => new El(tag),
  getElementById: (id) => (id === "app" ? app : null),
  addEventListener: (ev, fn) => {
    (documentShim.listeners[ev] = documentShim.listeners[ev] || []).push(fn);
  }
};

const engine = require("./src/engine.js");
const budgetEngine = require("./src/budget.js");
const ongoingCostsEngine = require("./src/ongoing-costs.js");
global.window = {
  APP_DATA: null,
  ScaleEngine: engine,
  BudgetEngine: budgetEngine,
  OngoingCostsEngine: ongoingCostsEngine
};
global.document = documentShim;

require("./data/questions.js");
require("./src/app.js");

assert.strictEqual(engine.determineScale({ q1: "online-tool", "tool-clarify": "no" }).status, "one-page", "D: tool-clarify no -> one-page");
assert.strictEqual(engine.determineScale({ q1: "online-tool", "tool-clarify": "yes" }).status, "multi-page", "E: tool-clarify yes -> multi-page");
assert.strictEqual(engine.determineScale({ q1: "online-tool", "tool-clarify": "not-sure" }).status, "clarify", "F: tool-clarify not-sure -> clarify");

const ONLINE_TOOL = "Онлайн-инструмент: тест, калькулятор, личный кабинет и т.\u00A0п.";
const MAX_URL =
  "https://max.ru/u/f9LHodD0cOKvRb6ASZXZUlk2WX_vHmc6OCVphosOEus9wVCne4ydknETbgQ";

documentShim.listeners.DOMContentLoaded[0]();

const resetApp = () => documentShim.listeners.DOMContentLoaded[0]();

function allNodes(root, list) {
  if (!list) list = [];
  list.push(root);
  root.children.forEach((c) => allNodes(c, list));
  return list;
}
function byTag(root, tag) { return allNodes(root).filter((n) => n.tag === tag); }
function buttonByText(root, text) {
  return byTag(root, "button").find((b) => b.textContent === text);
}
function optionByText(root, text) {
  return byTag(root, "button").find(
    (b) => b.className.split(" ").includes("option") && b.textContent === text
  );
}
function optionsAll() {
  return byTag(app, "button").filter(
    (b) => b.className.split(" ").includes("option") && !b.className.split(" ").includes("option--toggle")
  );
}
const click = (el) => el._fire("click");
function type(el, value) { el.value = value; el._fire("input"); }
function h1() { return byTag(app, "h1").map((n) => n.textContent)[0]; }
function stepLabel() {
  return byTag(app, "p").filter((n) => n.className.includes("screen__step")).map((n) => n.textContent)[0];
}
const nextBtn = () => buttonByText(app, "Дальше");
const backBtn = () => buttonByText(app, "Назад");
const adv = () => click(nextBtn());
const restartBtn = () => buttonByText(app, "Пройти ещё раз");
const FINAL_TITLES = [
  "Вам подойдёт:",
  "Здесь лучше уточнить задачу вместе"
];
const isComplete = () => FINAL_TITLES.indexOf(h1()) !== -1;

function pick(label) { click(optionByText(app, label)); }
function advAfter(label) { pick(label); adv(); }

function finishAndRestart() {
  let guard = 0;
  while (!isComplete() && guard++ < 80) {
    if (byTag(app, "input").length > 0) {
      const inp = byTag(app, "input")[0];
      if (!inp.value) type(inp, "150000");
      else adv();
      continue;
    }
    const n = nextBtn();
    if (n && !n.disabled) { adv(); continue; }
    const unselected = optionsAll().find((o) => !o.classList.contains("option--selected"));
    if (unselected) { click(unselected); continue; }
    throw new Error("cannot advance from: " + h1());
  }
  assert(isComplete(), "should have reached a final screen");
  assert(restartBtn(), "final screen has restart button");
  click(restartBtn());
  assert(h1() === "Какой сайт вам нужен?", "restarted to start");
}

function fillBudgetAndAdv(amount) {
  const inp = byTag(app, "input")[0];
  type(inp, String(amount));
  adv();
}

function bodyTexts() {
  return allNodes(app)
    .filter((n) => n.tag === "p" || n.tag === "h1" || n.tag === "h2" || n.tag === "h3" || n.tag === "a" || n.tag === "li")
    .map((n) => n.textContent);
}

function cardName() {
  const n = byTag(app, "h2").filter((x) => x.className.includes("card__name"))[0];
  return n ? n.textContent : "";
}

function expectResult(scaleLabel, implLabel, tag) {
  assert(h1() === "Вам подойдёт:", tag + ": result screen");
  const name = cardName();
  if (implLabel === "Taplink") {
    assert(name === scaleLabel + " на Taplink", tag + ": name");
  } else if (implLabel === "Tilda") {
    assert(name === scaleLabel + " на Tilda", tag + ": name");
  } else {
    assert(name === implLabel, tag + ": name");
  }
  assert(bodyTexts().some((t) => t === "Почему такой вариант"), tag + ": why heading");
  assert(restartBtn(), tag + ": restart present");
}

function toQ3() {
  click(buttonByText(app, "Начать"));
  advAfter("Себя и свои услуги");
  advAfter("Есть одна основная тема или предложение");
}
function toQ5() {
  toQ3();
  advAfter("Оставить заявку");
  advAfter("Мне не принципиально");
}

// Scenario 1: Q3 without booking/shop/calculator -> straight to Q4
toQ3();
assert(h1() === "Что человек должен сделать на сайте?", "on Q3");
assert(stepLabel() === "Вопрос 3 из 6", "base step label remains");
advAfter("Оставить заявку");
assert(h1() === "Как вы хотите, чтобы сайт выглядел на компьютере?", "S1: straight to Q4");
finishAndRestart();
console.log("S1 OK");

// Scenario 2: Q3 -> booking only
toQ3();
advAfter("Записаться");
assert(h1() === "Как должна работать запись?", "S2: booking branch");
assert(stepLabel() === "Уточняющий вопрос", "S2: branch label");
assert(nextBtn().disabled, "S2: next disabled before answer");
advAfter("Достаточно кнопки, чтобы написать или позвонить");
assert(h1() === "Как вы хотите, чтобы сайт выглядел на компьютере?", "S2: to Q4");
finishAndRestart();
console.log("S2 OK");

// Scenario 3: Q3 -> shop only
toQ3();
advAfter("Купить товар");
assert(h1() === "Примерно сколько товаров будет на сайте?", "S3: shop-count");
advAfter("До 10");
assert(h1() === "Как часто будет меняться ассортимент?", "S3: shop-updates");
advAfter("Редко");
assert(h1() === "Что нужно для продажи?", "S3: shop-needs");
assert(byTag(app, "p").some((p) => p.textContent === "Можно выбрать несколько вариантов."), "S3: multi hint");
pick("Корзина");
pick("Оплата на сайте");
pick("Корзина");
assert(!nextBtn().disabled, "S3: at least one selected -> enabled");
adv();
assert(h1() === "Как вы хотите, чтобы сайт выглядел на компьютере?", "S3: to Q4");
finishAndRestart();
console.log("S3 OK");

// Scenario 4: Q3 -> calculator only
toQ3();
advAfter("Получить расчёт, результат теста или другую персональную информацию");
assert(h1() === "Что должен делать сайт?", "S4: calculator branch");
assert(stepLabel() === "Уточняющий вопрос");
advAfter("Сам рассчитать результат");
assert(h1() === "Как вы хотите, чтобы сайт выглядел на компьютере?", "S4: calculator -> Q4, no account");
finishAndRestart();
console.log("S4 OK");

// Scenario 5: Q3 -> booking + shop, sequential
toQ3();
pick("Записаться");
pick("Купить товар");
adv();
assert(h1() === "Как должна работать запись?", "S5: booking first");
advAfter("Человек сам выбирает дату и время");
assert(h1() === "Примерно сколько товаров будет на сайте?", "S5: shop-count after booking");
advAfter("10–50");
assert(h1() === "Как часто будет меняться ассортимент?", "S5: shop-updates");
advAfter("Регулярно");
assert(h1() === "Что нужно для продажи?", "S5: shop-needs");
advAfter("Корзина");
assert(h1() === "Как вы хотите, чтобы сайт выглядел на компьютере?", "S5: to Q4");
finishAndRestart();
console.log("S5 OK");

// Scenario 6: deselect parent -> orphan branch cleared
toQ3();
pick("Записаться");
pick("Купить товар");
adv();
advAfter("Человек сам выбирает дату и время");
advAfter("До 10");
advAfter("Редко");
advAfter("Корзина");
assert(h1() === "Как вы хотите, чтобы сайт выглядел на компьютере?", "at Q4");
click(backBtn()); // shop-needs
click(backBtn()); // shop-updates
click(backBtn()); // shop-count
click(backBtn()); // booking
click(backBtn()); // Q3
assert(h1() === "Что человек должен сделать на сайте?", "back at Q3");
pick("Записаться"); // deselect
assert(!optionByText(app, "Записаться").classList.contains("option--selected"));
adv();
assert(h1() === "Примерно сколько товаров будет на сайте?", "S6: booking skipped, shop kept");
click(backBtn()); // Q3
pick("Записаться"); // re-select
adv();
assert(h1() === "Как должна работать запись?", "S6: booking again");
assert(nextBtn().disabled, "S6: stale booking answer cleared");
finishAndRestart();
console.log("S6 OK");

// Scenario 7: Q5 -> editing branch, multiple
toQ5();
advAfter("Хочу регулярно самостоятельно обновлять сайт");
assert(h1() === "Что вы планируете менять?", "S7: editing branch");
assert(stepLabel() === "Уточняющий вопрос");
assert(optionsAll().length === 10, "S7: 10 options");
pick("Цены");
pick("Новости или статьи");
adv();
assert(h1() === "На какой бюджет на создание сайта вы ориентируетесь?", "S7: Q6 after editing");
finishAndRestart();
console.log("S7 OK");

// Scenario 8: Q5 -> no editing branch for rarely / via-specialist
toQ5();
advAfter("Почти ничего менять не планирую");
assert(h1() === "На какой бюджет на создание сайта вы ориентируетесь?", "S8a: no editing");
finishAndRestart();
toQ5();
advAfter("Мне удобнее передавать изменения специалисту");
assert(h1() === "На какой бюджет на создание сайта вы ориентируетесь?", "S8b: no editing");
finishAndRestart();
console.log("S8 OK");

// Scenario 9: back/forward through base + branches preserves answers
toQ3();
advAfter("Записаться");
advAfter("Нужно выбрать специалиста, дату и время");
assert(h1() === "Как вы хотите, чтобы сайт выглядел на компьютере?", "at Q4");
advAfter("Мне подходит компактная аккуратная страница");
assert(h1() === "Как вам удобнее обновлять сайт после запуска?", "at Q5");
advAfter("Почти ничего менять не планирую");
assert(h1() === "На какой бюджет на создание сайта вы ориентируетесь?", "at Q6");
type(byTag(app, "input")[0], "70000");
// go back through the stack
click(backBtn()); // Q5
assert(h1() === "Как вам удобнее обновлять сайт после запуска?");
assert(optionByText(app, "Почти ничего менять не планирую").classList.contains("option--selected"), "S9: Q5 restored");
click(backBtn()); // Q4
assert(optionByText(app, "Мне подходит компактная аккуратная страница").classList.contains("option--selected"), "S9: Q4 restored");
click(backBtn()); // booking
assert(h1() === "Как должна работать запись?");
assert(optionByText(app, "Нужно выбрать специалиста, дату и время").classList.contains("option--selected"), "S9: booking restored");
assert(!nextBtn().disabled, "S9: booking Дальше enabled");
click(backBtn()); // Q3
assert(optionByText(app, "Записаться").classList.contains("option--selected"), "S9: Q3 restored");
adv(); // forward -> booking
assert(h1() === "Как должна работать запись?", "S9: forward again");
assert(!nextBtn().disabled, "S9: saved booking answer kept");
adv(); // Q4
adv(); // Q5
adv(); // Q6
assert(byTag(app, "input")[0].value === "70000", "S9: budget kept");
adv();
assert(isComplete(), "S9: completed with preserved answers");
finishAndRestart();
console.log("S9 OK");

// Scenario 10: restart clears everything
toQ3();
advAfter("Записаться");
assert(nextBtn().disabled, "S10: booking cleared after restart");
finishAndRestart();
console.log("S10 OK");

// Iteration 3.2: independent account option
// A: only расчёт -> calculator, no account
toQ3();
pick("Получить расчёт, результат теста или другую персональную информацию");
adv();
assert(h1() === "Что должен делать сайт?", "A: calculator shown");
advAfter("Сам рассчитать результат");
assert(h1() === "Как вы хотите, чтобы сайт выглядел на компьютере?", "A: no account -> Q4");
finishAndRestart();
console.log("S11 A OK");

// B: only личный кабинет -> account, no calculator
toQ3();
assert(optionsAll().length === 8, "B: 8 Q3 options");
pick("Входить в личный кабинет");
adv();
assert(h1() === "Что человек должен делать в личном кабинете?", "B: account shown");
assert(stepLabel() === "Уточняющий вопрос", "B: branch label");
assert(optionsAll().length === 8, "B: 8 account options");
assert(byTag(app, "p").some((p) => p.textContent === "Можно выбрать несколько вариантов."), "B: multi hint");
["Смотреть свои данные", "Смотреть историю заявок или заказов", "Получать результаты", "Загружать или скачивать файлы", "Оплачивать услуги", "Менять свои данные", "Другое", "Пока не знаю"].forEach((l) => {
  pick(l);
  assert(optionByText(app, l).classList.contains("option--selected"), "B: selectable " + l);
});
assert(!nextBtn().disabled, "B: multiple answers -> enabled");
adv();
assert(h1() === "Как вы хотите, чтобы сайт выглядел на компьютере?", "B: no calculator -> Q4");
finishAndRestart();
console.log("S12 B OK");

// C: расчёт + личный кабинет -> calculator then account
toQ3();
pick("Входить в личный кабинет");
pick("Получить расчёт, результат теста или другую персональную информацию");
adv();
assert(h1() === "Что должен делать сайт?", "C: calculator first");
advAfter("Сам рассчитать результат");
assert(h1() === "Что человек должен делать в личном кабинете?", "C: account after calculator");
assert(nextBtn().disabled, "C: account fresh -> next disabled");
pick("Получать результаты");
adv();
assert(h1() === "Как вы хотите, чтобы сайт выглядел на компьютере?", "C: to Q4");
finishAndRestart();
console.log("S13 C OK");

// D: deselect расчёт -> calculator cleared, account preserved
toQ3();
pick("Входить в личный кабинет");
pick("Получить расчёт, результат теста или другую персональную информацию");
adv();
advAfter("Сам рассчитать результат");
assert(h1() === "Что человек должен делать в личном кабинете?", "D: account");
pick("Менять свои данные");
adv();
assert(h1() === "Как вы хотите, чтобы сайт выглядел на компьютере?", "D: at Q4");
click(backBtn()); // account
click(backBtn()); // calculator
click(backBtn()); // Q3
pick("Получить расчёт, результат теста или другую персональную информацию"); // deselect, keep account
assert(!optionByText(app, "Получить расчёт, результат теста или другую персональную информацию").classList.contains("option--selected"), "D: deselected");
assert(optionByText(app, "Входить в личный кабинет").classList.contains("option--selected"), "D: account kept");
adv();
assert(h1() === "Что человек должен делать в личном кабинете?", "D: calculator skipped, only account");
assert(!nextBtn().disabled, "D: account answer preserved");
adv();
assert(h1() === "Как вы хотите, чтобы сайт выглядел на компьютере?", "D: to Q4");
finishAndRestart();
console.log("S14 D OK");

// E: deselect личный кабинет -> account cleared, calculator preserved
toQ3();
pick("Входить в личный кабинет");
pick("Получить расчёт, результат теста или другую персональную информацию");
adv();
advAfter("Сам рассчитать результат");
assert(h1() === "Что человек должен делать в личном кабинете?", "E: account");
pick("Получать результаты");
adv();
assert(h1() === "Как вы хотите, чтобы сайт выглядел на компьютере?", "E: at Q4");
click(backBtn()); // account
click(backBtn()); // calculator
click(backBtn()); // Q3
pick("Входить в личный кабинет"); // deselect, keep расчёт
assert(!optionByText(app, "Входить в личный кабинет").classList.contains("option--selected"), "E: deselected");
assert(optionByText(app, "Получить расчёт, результат теста или другую персональную информацию").classList.contains("option--selected"), "E: расчёт kept");
adv();
assert(h1() === "Что должен делать сайт?", "E: account skipped, only calculator");
assert(!nextBtn().disabled, "E: calculator answer preserved");
adv();
assert(h1() === "Как вы хотите, чтобы сайт выглядел на компьютере?", "E: to Q4");
click(backBtn()); // calculator
click(backBtn()); // Q3
pick("Входить в личный кабинет"); // re-select
adv();
assert(h1() === "Что должен делать сайт?", "E: calculator again");
adv();
assert(h1() === "Что человек должен делать в личном кабинете?", "E: account again");
assert(nextBtn().disabled, "E: stale account answer cleared");
finishAndRestart();
console.log("S15 E OK");

// G: restart clears both answers
toQ3();
pick("Входить в личный кабинет");
adv();
assert(h1() === "Что человек должен делать в личном кабинете?", "G: account");
pick("Получать результаты");
adv();
assert(stepLabel() === "Вопрос 4 из 6");
finishAndRestart();
toQ3();
pick("Входить в личный кабинет");
adv();
assert(h1() === "Что человек должен делать в личном кабинете?", "G: account after restart");
assert(nextBtn().disabled, "G: account fresh after restart");
console.log("S16 G OK");

// Iteration 4.2
// A: новый универсальный Q2
finishAndRestart();
click(buttonByText(app, "Начать"));
assert(stepLabel() === "Вопрос 1 из 6", "S17: Q1 progress normal");
pick("Себя и свои услуги");
adv();
assert(h1() === "Как нужно представить информацию на сайте?", "S17: new Q2 title");
assert(stepLabel() === "Вопрос 2 из 6", "S17: Q2 progress normal");
assert(optionByText(app, "Есть одна основная тема или предложение"), "S17: option 1");
assert(optionByText(app, "Есть несколько связанных частей — их можно показать вместе"), "S17: option 2");
assert(optionByText(app, "Есть самостоятельные услуги, направления или категории — их лучше раскрыть отдельно"), "S17: option 3");
assert(optionByText(app, "Информации много: несколько направлений, специалистов, категорий или разделов"), "S17: option 4");
assert(optionByText(app, "Пока не знаю"), "S17: option 5");
advAfter("Есть несколько связанных частей — их можно показать вместе");
assert(h1() === "Что человек должен сделать на сайте?", "S17: Q3 after new Q2");
assert(stepLabel() === "Вопрос 3 из 6", "S17: Q3 progress normal");
finishAndRestart();
console.log("S17 OK");

// B: магазин читает новый Q2 естественно, маршрут обычный
click(buttonByText(app, "Начать"));
advAfter("Товары");
assert(h1() === "Как нужно представить информацию на сайте?", "S18: shop reads new Q2");
advAfter("Информации много: несколько направлений, специалистов, категорий или разделов");
assert(h1() === "Что человек должен сделать на сайте?", "S18: Q3");
pick("Купить товар");
adv();
assert(h1() === "Примерно сколько товаров будет на сайте?", "S18: shop branch normal");
assert(stepLabel() === "Уточняющий вопрос", "S18: branch label");
pick("До 10");
adv();
assert(h1() === "Как часто будет меняться ассортимент?", "S18: shop-updates");
pick("Редко");
adv();
assert(h1() === "Что нужно для продажи?", "S18: shop-needs");
pick("Корзина");
adv();
assert(h1() === "Как вы хотите, чтобы сайт выглядел на компьютере?", "S18: to Q4");
finishAndRestart();
console.log("S18 OK");

// C: online-tool -> tool-clarify -> Q3, обычный Q2 не появляется
click(buttonByText(app, "Начать"));
assert(stepLabel() === "Вопрос 1 из 6", "S19: Q1 progress before route");
pick(ONLINE_TOOL);
adv();
assert(h1() === "Нужны ли вашему проекту несколько самостоятельных страниц или разделов?", "S19: tool-clarify instead of Q2");
assert(stepLabel() === "Уточняющий вопрос", "S19: tool-clarify not counted");
assert(optionsAll().length === 3, "S19: 3 options");
assert(nextBtn().disabled, "S19: next disabled before answer");
pick("Да, нужны отдельные самостоятельные страницы или разделы");
adv();
assert(h1() === "Что человек должен сделать на сайте?", "S19: Q3 after tool-clarify");
assert(stepLabel() === "Вопрос 2 из 5", "S19: Q3 progress online");
advAfter("Оставить заявку");
assert(h1() === "Как вы хотите, чтобы сайт выглядел на компьютере?", "S19: Q4");
assert(stepLabel() === "Вопрос 3 из 5", "S19: Q4 progress online");
advAfter("Мне не принципиально");
assert(h1() === "Как вам удобнее обновлять сайт после запуска?", "S19: Q5");
assert(stepLabel() === "Вопрос 4 из 5", "S19: Q5 progress online");
advAfter("Почти ничего менять не планирую");
assert(h1() === "На какой бюджет на создание сайта вы ориентируетесь?", "S19: Q6");
assert(stepLabel() === "Вопрос 5 из 5", "S19: Q6 progress online");
click(backBtn()); // Q5
click(backBtn()); // Q4
click(backBtn()); // Q3
click(backBtn()); // tool-clarify
click(backBtn()); // Q1
assert(stepLabel() === "Вопрос 1 из 5", "S19: Q1 progress within online route");
finishAndRestart();
console.log("S19 OK");

// G: обычный проект -> online-tool очищает q2
toQ3();
click(backBtn()); // Q2
assert(h1() === "Как нужно представить информацию на сайте?", "S20: at Q2");
click(backBtn()); // Q1
pick(ONLINE_TOOL);
adv();
assert(h1() === "Нужны ли вашему проекту несколько самостоятельных страниц или разделов?", "S20: tool-clarify, q2 skipped/cleared");
assert(stepLabel() === "Уточняющий вопрос", "S20: step is clarify");
advAfter("Пока не знаю");
assert(h1() === "Что человек должен сделать на сайте?", "S20: Q3");
finishAndRestart();
console.log("S20 OK");

// H: online-tool -> обычный проект очищает tool-clarify и возвращает Q2
click(buttonByText(app, "Начать"));
pick(ONLINE_TOOL);
adv();
assert(h1() === "Нужны ли вашему проекту несколько самостоятельных страниц или разделов?", "S21: tool-clarify");
pick("Пока не знаю");
adv();
assert(h1() === "Что человек должен сделать на сайте?", "S21: Q3");
click(backBtn()); // tool-clarify
assert(optionByText(app, "Пока не знаю").classList.contains("option--selected"), "S21: tool-clarify answer preserved");
click(backBtn()); // Q1
pick("Товары");
adv();
assert(h1() === "Как нужно представить информацию на сайте?", "S21: Q2 returned for normal");
assert(nextBtn().disabled, "S21: Q2 fresh, tool-clarify cleared");
advAfter("Есть одна основная тема или предложение");
assert(h1() === "Что человек должен сделать на сайте?", "S21: Q3, keine tool-clarify");
assert(stepLabel() === "Вопрос 3 из 6", "S21: progress resets to 6");
finishAndRestart();
console.log("S21 OK");

// I: назад/вперёд сохраняет только актуальные ответы (online-маршрут)
click(buttonByText(app, "Начать"));
pick(ONLINE_TOOL);
adv();
pick("Пока не знаю");
adv();
assert(h1() === "Что человек должен сделать на сайте?", "S22: Q3");
click(backBtn());
assert(h1() === "Нужны ли вашему проекту несколько самостоятельных страниц или разделов?", "S22: back to tool-clarify");
assert(optionByText(app, "Пока не знаю").classList.contains("option--selected"), "S22: tool-clarify preserved");
adv();
assert(h1() === "Что человек должен сделать на сайте?", "S22: forward again");
assert(stepLabel() === "Вопрос 2 из 5", "S22: progress still 5-set");
finishAndRestart();
console.log("S22 OK");

// J: все ветки Q3/Q5 работают без регрессий после изменений
toQ3();
pick("Записаться");
adv();
assert(h1() === "Как должна работать запись?", "S23: booking");
assert(stepLabel() === "Уточняющий вопрос", "S23: branch label");
advAfter("Человек сам выбирает дату и время");
assert(h1() === "Как вы хотите, чтобы сайт выглядел на компьютере?", "S23: Q4");
finishAndRestart();
toQ5();
advAfter("Хочу регулярно самостоятельно обновлять сайт");
assert(h1() === "Что вы планируете менять?", "S23: editing");
pick("Цены");
adv();
assert(h1() === "На какой бюджет на создание сайта вы ориентируетесь?", "S23: Q6");
finishAndRestart();
console.log("S23 OK");

// =========================================================
// Iteration 6: engine-driven user route integration (A–L)
// =========================================================

const SCALE_Q =
  "Есть ли на сайте такие услуги или направления, " +
  "о которых человеку нужно будет читать отдельно, " +
  "не проходя всю остальную страницу?";
const DEV_Q = "Что может появиться на сайте позже?";
const EDIT_Q = "Что для вас важнее после запуска сайта?";
const CONSULT_TITLE = "Здесь лучше уточнить задачу вместе";
const SCALE_UNDEFINED_TITLE = CONSULT_TITLE;

function startOver() {
  resetApp();
  click(buttonByText(app, "Начать"));
}

// A. Психолог: одностраничный + Taplink
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Прочитать информацию и связаться со\u00A0мной");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(150000);
expectResult("Одностраничный сайт", "Taplink", "A");
assert(bodyTexts().some((t) => t === "Почему такой вариант"), "A: why heading");
restartBtn()._fire("click");
assert(h1() === "Какой сайт вам нужен?", "A: restart");
console.log("A OK");

// B. Клиника: многостраничный + Tilda (через booking-ветку)
startOver();
advAfter("Компанию или команду");
advAfter("Информации много: несколько направлений, специалистов, категорий или разделов");
advAfter("Записаться");
assert(h1() === "Как должна работать запись?", "B: booking branch");
advAfter("Человек сам выбирает дату и время");
advAfter("Хочу полноценный широкий сайт");
advAfter("Мне удобнее передавать изменения специалисту");
fillBudgetAndAdv(300000);
expectResult("Многостраничный сайт", "Tilda", "B");
restartBtn()._fire("click");
console.log("B OK");

// C. Эксперт с сильной визуальной подачей: одностраничный + Tilda, не code
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Оставить заявку");
advAfter("Для меня особенно важны необычный дизайн, анимация и эффектная подача");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(200000);
expectResult("Одностраничный сайт", "Tilda", "C");
assert(cardName().indexOf("Tilda") !== -1, "C: not code");
restartBtn()._fire("click");
console.log("C OK");

// D. Магазин: многостраничный + Tilda
startOver();
advAfter("Товары");
advAfter("Информации много: несколько направлений, специалистов, категорий или разделов");
advAfter("Купить товар");
assert(h1() === "Примерно сколько товаров будет на сайте?", "D: shop-count");
advAfter("10–50");
assert(h1() === "Как часто будет меняться ассортимент?", "D: shop-updates");
advAfter("Регулярно");
pick("Корзина");
pick("Оплата на сайте");
adv();
assert(h1() === "Как вы хотите, чтобы сайт выглядел на компьютере?", "D: Q4");
advAfter("Хочу полноценный широкий сайт");
advAfter("Хочу регулярно самостоятельно обновлять сайт");
advAfter("Товары");
assert(h1() === "На какой бюджет на создание сайта вы ориентируетесь?", "D: Q6");
fillBudgetAndAdv(250000);
expectResult("Многостраничный сайт", "Tilda", "D");
restartBtn()._fire("click");
console.log("D OK");

// E. Онлайн-сервис, tool-clarify = «Пока не знаю»: scale остаётся clarify, impl = code
startOver();
advAfter(ONLINE_TOOL);
advAfter("Пока не знаю");
assert(h1() === "Что человек должен сделать на сайте?", "E: tool-clarify not repeated");
assert(stepLabel() === "Вопрос 2 из 5", "E: online base progress");
advAfter("Получить расчёт, результат теста или другую персональную информацию");
advAfter("Сам рассчитать результат");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(400000);
assert(h1() === SCALE_UNDEFINED_TITLE, "E: scale not invented -> structure уточнить");
assert(bodyTexts().every((t) => t !== "Вам подойдёт:"), "E: no full result");
assert(restartBtn(), "E: restart present");
restartBtn()._fire("click");
console.log("E OK");

// F. Scale clarification после Q2 = «Пока не знаю»
// F1: yes -> multi-page
startOver();
advAfter("Себя и свои услуги");
advAfter("Пока не знаю");
assert(h1() === SCALE_Q, "F1: scale-clarify shown");
assert(stepLabel() === "Уточняющий вопрос", "F1: not counted in base");
advAfter("Да, есть несколько самостоятельных направлений");
assert(h1() === "Что человек должен сделать на сайте?", "F1: to Q3");
assert(stepLabel() === "Вопрос 3 из 6", "F1: Q3 progress normal");
advAfter("Оставить заявку");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(100000);
expectResult("Многостраничный сайт", "Taplink", "F1");
restartBtn()._fire("click");
console.log("F1 OK");

// F2: no -> one-page, ответ сохраняется при «Назад»
startOver();
advAfter("Себя и свои услуги");
advAfter("Пока не знаю");
assert(h1() === SCALE_Q, "F2: scale-clarify shown");
advAfter("Нет, всё связано и может идти последовательно");
click(backBtn());
assert(h1() === SCALE_Q, "F2: back to scale-clarify");
click(backBtn());
assert(h1() === "Как нужно представить информацию на сайте?", "F2: back to Q2");
adv();
assert(h1() === SCALE_Q, "F2: scale-clarify preserved on forward");
assert(
  optionByText(app, "Нет, всё связано и может идти последовательно").classList.contains("option--selected"),
  "F2: scale-clarify answer restored"
);
adv();
assert(h1() === "Что человек должен сделать на сайте?", "F2: to Q3");
advAfter("Оставить заявку");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(100000);
expectResult("Одностраничный сайт", "Taplink", "F2");
restartBtn()._fire("click");
console.log("F2 OK");

// F3: not-sure -> вопрос не повторяется, масштаб остаётся clarify
startOver();
advAfter("Себя и свои услуги");
advAfter("Пока не знаю");
assert(h1() === SCALE_Q, "F3: scale-clarify shown");
advAfter("Пока не знаю");
assert(h1() === "Что человек должен сделать на сайте?", "F3: not asked again");
advAfter("Прочитать информацию и связаться со\u00A0мной");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(50000);
assert(h1() === SCALE_UNDEFINED_TITLE, "F3: scale stays undefined");
restartBtn()._fire("click");
console.log("F3 OK");

// G. Development clarification: вопрос от движка, ответ пересчитывается
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Оставить заявку");
advAfter("Мне не принципиально");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(90000);
assert(h1() === DEV_Q, "G: development question after Q6");
assert(stepLabel() === "Уточняющий вопрос", "G: engine clarif not counted");
assert(
  byTag(app, "p").some((p) => p.textContent === "Можно выбрать несколько вариантов."),
  "G: multiple choice"
);
advAfter("Новые услуги или страницы");
expectResult("Одностраничный сайт", "Tilda", "G");
restartBtn()._fire("click");
console.log("G OK");

// H. Development = not-sure -> консультация, без цикла
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Оставить заявку");
advAfter("Мне не принципиально");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(90000);
assert(h1() === DEV_Q, "H: development question");
advAfter("Пока не знаю");
assert(h1() === CONSULT_TITLE, "H: consultation screen");
assert(bodyTexts().every((t) => t !== DEV_Q), "H: question not repeated");
assert(restartBtn(), "H: restart present");
restartBtn()._fire("click");
console.log("H OK");

// I. Edit-priority clarification: необычный дизайн + частое самостоятельное редактирование
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Оставить заявку");
advAfter("Для меня особенно важны необычный дизайн, анимация и эффектная подача");
advAfter("Хочу регулярно самостоятельно обновлять сайт");
advAfter("Цены");
assert(h1() === "На какой бюджет на создание сайта вы ориентируетесь?", "I: Q6");
fillBudgetAndAdv(120000);
assert(h1() === EDIT_Q, "I: edit-priority question");
assert(stepLabel() === "Уточняющий вопрос", "I: engine clarif label");
advAfter("Самостоятельно легко менять большую часть информации");
expectResult("Одностраничный сайт", "Tilda", "I");
restartBtn()._fire("click");
console.log("I OK");

// J. Edit-priority = not-sure -> консультация, без цикла
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Оставить заявку");
advAfter("Для меня особенно важны необычный дизайн, анимация и эффектная подача");
advAfter("Хочу регулярно самостоятельно обновлять сайт");
advAfter("Цены");
fillBudgetAndAdv(120000);
assert(h1() === EDIT_Q, "J: edit-priority question");
advAfter("Пока не знаю");
assert(h1() === CONSULT_TITLE, "J: consultation screen");
assert(bodyTexts().every((t) => t !== EDIT_Q), "J: question not repeated");
restartBtn()._fire("click");
console.log("J OK");

// K. Изменение предыдущего ответа: старый development удаляется
startOver();
advAfter("Товары");
advAfter("Информации много: несколько направлений, специалистов, категорий или разделов");
advAfter("Купить товар");
advAfter("10–50");
advAfter("Редко");
advAfter("Корзина");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(200000);
assert(h1() === DEV_Q, "K: development asked in tie");
pick("Калькулятор или тест");
click(backBtn());
assert(h1() === "На какой бюджет на создание сайта вы ориентируетесь?", "K: back to Q6");
click(backBtn());
assert(h1() === "Как вам удобнее обновлять сайт после запуска?", "K: Q5");
click(backBtn());
assert(h1() === "Как вы хотите, чтобы сайт выглядел на компьютере?", "K: Q4");
click(backBtn());
assert(h1() === "Что нужно для продажи?", "K: shop-needs");
click(backBtn());
assert(h1() === "Как часто будет меняться ассортимент?", "K: shop-updates");
advAfter("Регулярно");
assert(h1() === "Что нужно для продажи?", "K: forward to shop-needs");
adv();
assert(h1() === "Как вы хотите, чтобы сайт выглядел на компьютере?", "K: Q4 again");
adv();
assert(h1() === "Как вам удобнее обновлять сайт после запуска?", "K: Q5 again");
adv();
assert(h1() === "На какой бюджет на создание сайта вы ориентируетесь?", "K: Q6 again");
adv();
assert(h1() === "Вам подойдёт:", "K: no stale development question");
expectResult("Многостраничный сайт", "Tilda", "K");
assert(cardName().indexOf("Tilda") !== -1, "K: stale devService did not force code");
restartBtn()._fire("click");
console.log("K OK");

// L. Restart: абсолютно всё очищено, включая engine-driven clarification
startOver();
advAfter("Товары");
advAfter("Информации много: несколько направлений, специалистов, категорий или разделов");
advAfter("Купить товар");
advAfter("10–50");
advAfter("Редко");
advAfter("Корзина");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(200000);
assert(h1() === DEV_Q, "L: development asked");
advAfter("Новые услуги или страницы");
assert(h1() === "Вам подойдёт:", "L: result reached with dev");
restartBtn()._fire("click");
assert(h1() === "Какой сайт вам нужен?", "L: restarted to start");
startOver();
advAfter("Себя и свои услуги");
advAfter("Пока не знаю");
assert(h1() === SCALE_Q, "L: scale-clarify reappears fresh");
assert(
  optionsAll().every((o) => !o.classList.contains("option--selected")),
  "L: scale-clarify answer cleared by restart"
);
click(backBtn());
assert(h1() === "Как нужно представить информацию на сайте?", "L: Q2 fresh");
assert(
  optionByText(app, "Пока не знаю").classList.contains("option--selected"),
  "L: Q2 answer from current session preserved"
);
assert(
  !optionByText(app, "Информации много: несколько направлений, специалистов, категорий или разделов").classList.contains("option--selected"),
  "L: old session answer not leaked"
);
console.log("L OK");

// =========================================================
// Iteration 6.1: stable clarification key, no string matching
// =========================================================
const fs = require("fs");
const APP_SRC = require("path").join(__dirname, "src", "app.js");
const appSource = fs.readFileSync(APP_SRC, "utf8");

// A. scale clarification -> key scale-clarify
{
  const res = engine.determineScale({});
  assert.strictEqual(res.status, "clarify", "6.1A: clarify");
  assert.strictEqual(res.clarification.key, "scale-clarify", "6.1A: key");
}

// B. online-tool clarification -> key tool-clarify
{
  const res = engine.determineScale({ q1: "online-tool" });
  assert.strictEqual(res.status, "clarify", "6.1B: clarify");
  assert.strictEqual(res.clarification.key, "tool-clarify", "6.1B: key");
}

// C. development clarification -> key development
{
  const res = engine.determineImplementation({
    q1: "products",
    q2: "many-directions",
    q3: ["buy"],
    "shop-count": "10-50",
    q4: "compact",
    q5: "rarely"
  });
  assert.strictEqual(res.status, "clarify", "6.1C: clarify");
  assert.strictEqual(res.clarification.key, "development", "6.1C: key");
}

// D. edit-priority clarification -> key edit-priority
{
  const res = engine.determineImplementation({
    q1: "self-services",
    q2: "one-service",
    q3: ["contact"],
    q4: "unusual-design",
    q5: "often"
  });
  assert.strictEqual(res.status, "clarify", "6.1D: clarify");
  assert.strictEqual(res.clarification.key, "edit-priority", "6.1D: key");
}

// E. по каждому key можно получить то же question/options для повторного рендера
{
  ["scale-clarify", "tool-clarify", "development", "edit-priority"].forEach(
    (key) => {
      const def = engine.CLARIFICATIONS[key];
      assert(def, "6.1E: catalog has " + key);
      assert.strictEqual(def.key, key, "6.1E: def.key " + key);
      assert(def.question && def.options && def.options.length > 0, "6.1E: content " + key);
      assert.strictEqual(engine.getClarificationDefinition(key), def, "6.1E: getter " + key);
    }
  );
  const live = engine.determineScale({ q1: "self-services", q2: "not-sure" });
  assert.strictEqual(
    live.clarification.question,
    engine.CLARIFICATIONS["scale-clarify"].question,
    "6.1E: live matches catalog"
  );
}

// F. string matching и дубли definitions исчезли из app.js
{
  assert(appSource.indexOf("clarificationKey") === -1, "6.1F: no clarificationKey");
  assert(appSource.indexOf("Что может появиться на сайте позже?") === -1, "6.1F: dev text absent");
  assert(appSource.indexOf("Есть ли на сайте такие услуги") === -1, "6.1F: scale text absent");
  assert(appSource.indexOf("Что для вас важнее после запуска сайта?") === -1, "6.1F: edit text absent");
  assert(appSource.indexOf("Нужны ли вашему проекту несколько самостоятельных") === -1, "6.1F: tool text absent");
  assert(appSource.indexOf("SCALE_CLARIFY_FALLBACK") === -1, "6.1F: no fallback constants");
  assert(appSource.indexOf("data.toolClarify") === -1, "6.1F: no data.toolClarify");
  assert(appSource.indexOf("clarification.key") !== -1, "6.1F: uses clarification.key");
  assert(appSource.indexOf("getClarificationDefinition") !== -1, "6.1F: uses engine catalog");
}
console.log("6.1A-E PASSED");
console.log("6.1F PASSED");

// G. «Назад» на отвеченные development/edit-priority перерисовывает вопрос и выбор из каталога
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Оставить заявку");
advAfter("Для меня особенно важны необычный дизайн, анимация и эффектная подача");
advAfter("Хочу регулярно самостоятельно обновлять сайт");
advAfter("Цены");
fillBudgetAndAdv(120000);
assert(h1() === EDIT_Q, "6.1G: edit-priority shown");
pick("Самостоятельно легко менять большую часть информации");
click(backBtn());
assert(h1() === "На какой бюджет на создание сайта вы ориентируетесь?", "6.1G: back to Q6");
adv();
assert(h1() === EDIT_Q, "6.1G: edit-priority re-rendered from catalog");
assert(
  optionByText(app, "Самостоятельно легко менять большую часть информации").classList.contains("option--selected"),
  "6.1G: edit answer preserved"
);
adv();
assert(h1() === "Вам подойдёт:", "6.1G: result after edit");
restartBtn()._fire("click");

startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Оставить заявку");
advAfter("Мне не принципиально");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(90000);
assert(h1() === DEV_Q, "6.1G: development shown");
pick("Новые услуги или страницы");
click(backBtn());
assert(h1() === "На какой бюджет на создание сайта вы ориентируетесь?", "6.1G: dev back to Q6");
adv();
assert(h1() === DEV_Q, "6.1G: development re-rendered from catalog");
assert(
  optionByText(app, "Новые услуги или страницы").classList.contains("option--selected"),
  "6.1G: dev answer preserved"
);
adv();
assert(h1() === "Вам подойдёт:", "6.1G: result after dev");
restartBtn()._fire("click");
console.log("6.1G PASSED");

// H. очистка устаревших clarification — покрыто сценарием K выше
// I. сценарии A–L итерации 6 — выполнены выше
// J. 72 engine-теста — запускаются отдельно: node test-engine.js

// =========================================================
// Iteration 7: бюджетная логика
// =========================================================
const DS = engine.determineScale;
const DI = engine.determineImplementation;

function budgetWithQ6(answers, q6) {
  const withBudget = Object.assign({}, answers, { q6: q6 });
  return budgetEngine.evaluateBudget({
    answers: withBudget,
    scaleResult: DS(answers),
    implementationResult: DI(answers)
  });
}
function budgetFor(answers, amount) {
  return budgetWithQ6(answers, { amount: String(amount), notSure: false });
}

const A_TILDA_ONE = {
  q1: "self-services",
  q2: "one-service",
  q3: ["contact"],
  q4: "unusual-design",
  q5: "via-specialist"
};
const C_TILDA_MULTI = {
  q1: "company",
  q2: "many-directions",
  q3: ["contact"],
  q4: "wide",
  q5: "sometimes"
};
const D_TAPLINK_ONE = {
  q1: "self-services",
  q2: "one-service",
  q3: ["contact"],
  q4: "compact",
  q5: "rarely"
};
const F_TOOL = {
  q1: "online-tool",
  q2: "one-service",
  q3: ["personal-result"],
  calculator: "calculate",
  q4: "compact",
  q5: "rarely"
};
const G_SERVICE = {
  q1: "online-tool",
  q2: "one-service",
  q3: ["account"],
  account: ["view-orders"],
  q4: "compact",
  q5: "rarely"
};

// A: Tilda one-page + 25 000 -> fits
{
  const r = budgetFor(A_TILDA_ONE, 25000);
  assert.strictEqual(r.status, "fits", "7A: fits");
  assert.strictEqual(r.minimumPrice, 25000, "7A: min");
  assert.strictEqual(r.displayPrice, "от 25 000 ₽", "7A: display");
  assert.strictEqual(r.planId, "tilda-one-page", "7A: plan");
}

// B: Tilda one-page + 15 000 -> below, рекомендация Tilda не меняется
{
  const impl = DI(A_TILDA_ONE);
  assert.strictEqual(impl.primary, "tilda", "7B: primary tilda");
  const r = budgetFor(A_TILDA_ONE, 15000);
  assert.strictEqual(r.status, "below", "7B: below");
  assert.strictEqual(r.planId, "tilda-one-page", "7B: plan stays tilda");
  assert(impl.primary === "tilda", "7B: not replaced by taplink");
  assert(r.suggestions.length > 0, "7B: has suggestions");
}

// C: Tilda multi-page + 35 000 -> fits
{
  const r = budgetFor(C_TILDA_MULTI, 35000);
  assert.strictEqual(r.status, "fits", "7C: fits");
  assert.strictEqual(r.minimumPrice, 35000, "7C: min");
  assert.strictEqual(r.planId, "tilda-multi-page", "7C: plan");
}

// D: Taplink one-page + 15 000 -> fits
{
  const r = budgetFor(D_TAPLINK_ONE, 15000);
  assert.strictEqual(r.status, "fits", "7D: fits");
  assert.strictEqual(r.minimumPrice, 15000, "7D: min");
  assert.strictEqual(r.planId, "taplink-compact", "7D: plan");
}

// E: Code one-page + 30 000 -> fits
{
  const codeOne = {
    status: "recommend",
    primary: "code",
    alternative: null,
    reasons: ["тест"],
    tradeoffs: [],
    clarification: null,
    needsConsultation: false
  };
  const r = budgetEngine.evaluateBudget({
    answers: { q6: { amount: "30000", notSure: false } },
    scaleResult: { status: "one-page" },
    implementationResult: codeOne
  });
  assert.strictEqual(r.status, "fits", "7E: fits");
  assert.strictEqual(r.minimumPrice, 30000, "7E: min");
  assert.strictEqual(r.planId, "code-one-page", "7E: plan");
}

// F: интерактивный инструмент + 45 000 -> fits
{
  assert.strictEqual(DI(F_TOOL).primary, "code", "7F: code tool");
  const r = budgetFor(F_TOOL, 45000);
  assert.strictEqual(r.status, "fits", "7F: fits");
  assert.strictEqual(r.minimumPrice, 45000, "7F: min");
  assert.strictEqual(r.planId, "code-interactive", "7F: plan");
}

// G: сложный веб-сервис + 60 000 -> individual-estimate, ориентир соблюдён
{
  assert.strictEqual(DI(G_SERVICE).primary, "code", "7G: code service");
  const r = budgetFor(G_SERVICE, 60000);
  assert.strictEqual(r.status, "individual-estimate", "7G: individual-estimate");
  assert.strictEqual(r.minimumPrice, 60000, "7G: min");
  assert.strictEqual(r.planId, "code-service", "7G: plan");
}

// H: бюджет 100 000 не превращает Taplink в Tilda или code
{
  const impl = DI(D_TAPLINK_ONE);
  const r = budgetFor(D_TAPLINK_ONE, 100000);
  assert.strictEqual(r.status, "fits", "7H: fits");
  assert.strictEqual(impl.primary, "taplink", "7H: recommendation unchanged");
  assert(r.planId.indexOf("taplink") === 0, "7H: plan stays taplink");
}

// I: бюджет 10 000 не превращает Tilda в Taplink
{
  const impl = DI(C_TILDA_MULTI);
  const r = budgetFor(C_TILDA_MULTI, 10000);
  assert.strictEqual(r.status, "below", "7I: below");
  assert.strictEqual(impl.primary, "tilda", "7I: recommendation unchanged");
  assert(r.planId.indexOf("tilda") === 0, "7I: plan stays tilda");
}

// J: «Пока не знаю» -> unknown + показ ориентира
{
  const r = budgetWithQ6(A_TILDA_ONE, { amount: null, notSure: true });
  assert.strictEqual(r.status, "unknown", "7J: unknown");
  assert.strictEqual(r.minimumPrice, 25000, "7J: orientir shown");
  assert.strictEqual(r.displayPrice, "от 25 000 ₽", "7J: display");
}

// K: determineScale / determineImplementation не менялись (сигнатуры работают)
assert.strictEqual(typeof DS, "function", "7K: determineScale");
assert.strictEqual(typeof DI, "function", "7K: determineImplementation");

// UI: на временном экране результат показывает стоимость и замечание о бюджете ниже
resetApp();
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Прочитать информацию и связаться со\u00A0мной");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(10000);
assert(h1() === "Вам подойдёт:", "7UI: result");
assert(cardName() === "Одностраничный сайт на Taplink", "7UI: name");
assert(
  bodyTexts().some((t) => t === "от 15 000 ₽"),
  "7UI: price line"
);
assert(
  bodyTexts().some((t) => t === "Ваш бюджет сейчас ниже этого ориентира"),
  "7UI: below note"
);
restartBtn()._fire("click");
console.log("7A-K PASSED");
console.log("7UI PASSED");

// 7UI2: code-service + 60 000 -> individual-estimate, пояснение видно
resetApp();
startOver();
advAfter(ONLINE_TOOL);
advAfter("Да, нужны отдельные самостоятельные страницы или разделы");
advAfter("Входить в личный кабинет");
assert(h1() === "Что человек должен делать в личном кабинете?", "7UI2: account branch");
advAfter("Смотреть историю заявок или заказов");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(60000);
assert(h1() === "Вам подойдёт:", "7UI2: result");
assert(cardName() === "Индивидуальный веб-сервис", "7UI2: code shown");
assert(
  bodyTexts().some((t) => t === "от 60 000 ₽"),
  "7UI2: price line"
);
assert(
  bodyTexts().some((t) =>
    t.indexOf("точную стоимость такого решения не определить") !== -1
  ),
  "7UI2: individual-estimate explanation visible"
);
restartBtn()._fire("click");
console.log("7UI2 PASSED");

// =========================================================
// Iteration 8: расходы после запуска (getOngoingCosts)
// =========================================================

function ongoingFor(answers, implOverride) {
  const scaleRes = DS(answers);
  const implRes = implOverride || DI(answers);
  const budgetRes = budgetEngine.evaluateBudget({
    answers: answers,
    scaleResult: scaleRes,
    implementationResult: implRes
  });
  return ongoingCostsEngine.getOngoingCosts({
    answers: answers,
    scaleResult: scaleRes,
    implementationResult: implRes,
    budgetResult: budgetRes
  });
}

// A: Taplink -> расходы платформы отдельно от стоимости разработки
{
  const impl = DI(D_TAPLINK_ONE);
  const scaleRes = DS(D_TAPLINK_ONE);
  const budgetRes = budgetFor(D_TAPLINK_ONE, 15000);
  const o = ongoingCostsEngine.getOngoingCosts({
    answers: D_TAPLINK_ONE,
    scaleResult: scaleRes,
    implementationResult: impl,
    budgetResult: budgetRes
  });
  assert.strictEqual(o.type, "from", "8A: type from");
  assert(o.display.indexOf("1 080") !== -1, "8A: platform tariff shown");
  assert.strictEqual(budgetRes.displayPrice, "от 15 000 ₽", "8A: dev price present");
  assert(o.display.indexOf("15 000") === -1, "8A: ongoing separate from dev price");
}

// B: Tilda -> около 6 000 ₽ в год + домен отдельно
{
  const impl = DI(A_TILDA_ONE);
  const scaleRes = DS(A_TILDA_ONE);
  const budgetRes = budgetFor(A_TILDA_ONE, 25000);
  const o = ongoingCostsEngine.getOngoingCosts({
    answers: A_TILDA_ONE,
    scaleResult: scaleRes,
    implementationResult: impl,
    budgetResult: budgetRes
  });
  assert.strictEqual(o.type, "from", "8B: type from");
  assert(o.display.indexOf("6 000") !== -1, "8B: around 6 000 per year");
  assert(
    o.details.some((d) => d.indexOf("Домен оплачивается отдельно") !== -1),
    "8B: domain separate"
  );
}

// C: Простой code-site -> ориентир 400–1 000 ₽/год
{
  const codeOne = {
    status: "recommend",
    primary: "code",
    alternative: null,
    reasons: [],
    tradeoffs: [],
    clarification: null,
    needsConsultation: false
  };
  const budgetRes = budgetEngine.evaluateBudget({
    answers: {},
    scaleResult: { status: "one-page" },
    implementationResult: codeOne
  });
  assert.strictEqual(budgetRes.planId, "code-one-page", "8C: plan one-page");
  const o = ongoingCostsEngine.getOngoingCosts({
    answers: {},
    scaleResult: { status: "one-page" },
    implementationResult: codeOne,
    budgetResult: budgetRes
  });
  assert.strictEqual(o.type, "range", "8C: type range");
  assert(o.display.indexOf("400") !== -1 && o.display.indexOf("1 000") !== -1, "8C: 400-1000 range");
  assert(
    o.details.some((d) => d.indexOf("домена") !== -1) &&
      o.details.some((d) => d.indexOf("бесплатн") !== -1),
    "8C: domain-based, hosting may be free"
  );
}

// D: Интерактивный code-tool -> нет выдуманной фиксированной суммы
{
  assert.strictEqual(DI(F_TOOL).primary, "code", "8D: code tool");
  const budgetRes = budgetFor(F_TOOL, 45000);
  const o = ongoingFor(F_TOOL);
  assert.strictEqual(budgetRes.planId, "code-interactive", "8D: plan interactive");
  assert.strictEqual(o.type, "individual", "8D: individual");
  assert(/\d{3}/.test(o.display) === false, "8D: no invented fixed sum");
  assert(o.display.indexOf("индивидуально") !== -1, "8D: individual wording");
}

// E: Сложный code-service -> individual
{
  assert.strictEqual(DI(G_SERVICE).primary, "code", "8E: code service");
  const budgetRes = budgetFor(G_SERVICE, 60000);
  const o = ongoingFor(G_SERVICE);
  assert.strictEqual(budgetRes.planId, "code-service", "8E: plan service");
  assert.strictEqual(o.type, "individual", "8E: individual");
  assert(o.display.indexOf("индивидуально") !== -1, "8E: individual wording");
  assert(
    o.details.some((d) => d.indexOf("хостинга") !== -1 && d.indexOf("базы данных") !== -1),
    "8E: hosting/db/usage mention"
  );
}

// F: Высокий или низкий бюджет не меняет расходы после запуска
{
  const high = budgetFor(D_TAPLINK_ONE, 100000);
  const low = budgetFor(D_TAPLINK_ONE, 5000);
  assert.strictEqual(high.status, "fits", "8F: high fits");
  assert.strictEqual(low.status, "below", "8F: low below");
  const shared = { answers: D_TAPLINK_ONE, scaleResult: DS(D_TAPLINK_ONE), implementationResult: DI(D_TAPLINK_ONE) };
  const oHigh = ongoingCostsEngine.getOngoingCosts(Object.assign({}, shared, { budgetResult: high }));
  const oLow = ongoingCostsEngine.getOngoingCosts(Object.assign({}, shared, { budgetResult: low }));
  assert.strictEqual(oHigh.type, oLow.type, "8F: same type");
  assert.strictEqual(oHigh.display, oLow.display, "8F: same display");
}

// G: Стоимость разработки и расходы после запуска не складываются в одну сумму
{
  const impl = DI(A_TILDA_ONE);
  const scaleRes = DS(A_TILDA_ONE);
  const budgetRes = budgetFor(A_TILDA_ONE, 25000);
  const o = ongoingCostsEngine.getOngoingCosts({
    answers: A_TILDA_ONE,
    scaleResult: scaleRes,
    implementationResult: impl,
    budgetResult: budgetRes
  });
  assert.strictEqual(budgetRes.minimumPrice, 25000, "8G: dev estimate unchanged");
  assert.strictEqual(budgetRes.displayPrice, "от 25 000 ₽", "8G: dev price present");
  assert(o.display !== budgetRes.displayPrice, "8G: not merged into one sum");
  assert(o.display.indexOf("в год") !== -1, "8G: ongoing is per-year");
}
console.log("8A-G PASSED");

// 8UI: на временном экране два смысловых блока — «Разработка» и «После запуска»
resetApp();
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Оставить заявку");
advAfter("Для меня особенно важны необычный дизайн, анимация и эффектная подача");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(30000);
assert(h1() === "Вам подойдёт:", "8UI: result");
assert(cardName() === "Одностраничный сайт на Tilda", "8UI: name");
assert(
  bodyTexts().some((t) => t === "Разработка"),
  "8UI: dev block heading"
);
assert(
  bodyTexts().some((t) => t === "После запуска"),
  "8UI: ongoing block heading"
);
assert(
  bodyTexts().some((t) => t === "от 25 000 ₽"),
  "8UI: dev price line"
);
assert(
  bodyTexts().some((t) => t === "Около 6 000 ₽ в год за платформу."),
  "8UI: tilda ongoing display"
);
assert(
  bodyTexts().some((t) => t === "Домен оплачивается отдельно."),
  "8UI: domain separate"
);
assert(
  bodyTexts().some((t) => t === "Тарифы платформ могут меняться."),
  "8UI: platform tariffs caption"
);
restartBtn()._fire("click");
console.log("8UI PASSED");

// =========================================================
// Iteration 9: финальная клиентская карточка результата
// =========================================================

// startOver для итерации 9 первым делом полностью очищает предыдущую сессию
startOver = () => {
  const restart = buttonByText(app, "Пройти ещё раз");
  if (restart) click(restart);
  else resetApp();
  click(buttonByText(app, "Начать"));
};

// A. Психолог: one-page + Taplink + 15 000
resetApp();
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Прочитать информацию и связаться со\u00A0мной");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(15000);
assert(h1() === "Вам подойдёт:", "9A: title");
assert(cardName() === "Одностраничный сайт на Taplink", "9A: name");
assert(bodyTexts().some((t) => t === "от 15 000 ₽"), "9A: dev price");
assert(
  bodyTexts().every((t) => t !== "Ваш бюджет сейчас ниже этого ориентира"),
  "9A: no below block (fits)"
);

// B. Визуальный эксперт: one-page + Tilda + 25 000
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Оставить заявку");
advAfter("Для меня особенно важны необычный дизайн, анимация и эффектная подача");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(25000);
assert(h1() === "Вам подойдёт:", "9B: title");
assert(cardName() === "Одностраничный сайт на Tilda", "9B: name");
assert(bodyTexts().some((t) => t === "от 25 000 ₽"), "9B: dev price");

// C. Клиника: multi-page + Tilda + 35 000
startOver();
advAfter("Компанию или команду");
advAfter("Информации много: несколько направлений, специалистов, категорий или разделов");
advAfter("Записаться");
advAfter("Человек сам выбирает дату и время");
advAfter("Хочу полноценный широкий сайт");
advAfter("Мне удобнее передавать изменения специалисту");
fillBudgetAndAdv(35000);
assert(h1() === "Вам подойдёт:", "9C: title");
assert(cardName() === "Многостраничный сайт на Tilda", "9C: name");
assert(bodyTexts().some((t) => t === "от 35 000 ₽"), "9C: dev price");
assert(
  bodyTexts().some((t) => t === "Почему такой вариант"),
  "9C: why heading"
);

// D. Tilda при бюджете 15 000: рекомендация остаётся Tilda, спокойный блок о бюджете
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Оставить заявку");
advAfter("Для меня особенно важны необычный дизайн, анимация и эффектная подача");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(15000);
assert(h1() === "Вам подойдёт:", "9D: title");
assert(cardName() === "Одностраничный сайт на Tilda", "9D: recommendation stays Tilda");
assert(bodyTexts().some((t) => t === "от 25 000 ₽"), "9D: dev price still shown");
assert(
  bodyTexts().some((t) => t === "Ваш бюджет сейчас ниже этого ориентира"),
  "9D: calm below block"
);
assert(
  bodyTexts().some((t) => t.indexOf("не значит, что нужно выбирать неподходящую платформу") !== -1),
  "9D: no switch to platform"
);

// E. Интерактивный инструмент: без выдуманной фиксированной суммы после запуска
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Получить расчёт, результат теста или другую персональную информацию");
advAfter("Сам рассчитать результат");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(45000);
assert(h1() === "Вам подойдёт:", "9E: title");
assert(cardName() === "Интерактивный сайт или онлайн-инструмент", "9E: name");
assert(bodyTexts().some((t) => t === "от 45 000 ₽"), "9E: dev price");
assert(
  bodyTexts().some((t) => t === "Домен и размещение — индивидуально."),
  "9E: ongoing individual, no invented sum"
);
assert(
  bodyTexts().every((t) => t.indexOf("в год") === -1),
  "9E: no invented yearly fixed sum"
);
assert(
  bodyTexts().every((t) => t !== "Индивидуальный веб-сервис"),
  "9E: not a service"
);

// F. Сложный сервис: индивидуальная оценка видна явно
startOver();
advAfter(ONLINE_TOOL);
advAfter("Да, нужны отдельные самостоятельные страницы или разделы");
advAfter("Входить в личный кабинет");
advAfter("Смотреть историю заявок или заказов");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(60000);
assert(h1() === "Вам подойдёт:", "9F: title");
assert(cardName() === "Индивидуальный веб-сервис", "9F: name");
assert(bodyTexts().some((t) => t === "от 60 000 ₽"), "9F: dev price");
assert(
  bodyTexts().some((t) => t.indexOf("точную стоимость такого решения не определить") !== -1),
  "9F: individual-estimate caption"
);
assert(
  bodyTexts().some((t) => t === "Расходы после запуска рассчитываются индивидуально."),
  "9F: ongoing individual"
);

// G. Реализация с alternative: основной вариант главный, альтернатива вторична
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Прочитать информацию и связаться со\u00A0мной");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(20000);
assert(h1() === "Вам подойдёт:", "9G: title");
assert(cardName() === "Одностраничный сайт на Taplink", "9G: main is taplink");
assert(
  bodyTexts().some((t) => t === "Можно рассмотреть и другой вариант"),
  "9G: alternative block shown"
);
assert(
  bodyTexts().some((t) => t.indexOf("Также можно рассмотреть Tilda, если") !== -1),
  "9G: alternative wording grounded"
);
{
  const order = allNodes(app).map((n) => n.textContent);
  assert(
    order.indexOf("Одностраничный сайт на Taplink") <
      order.indexOf("Можно рассмотреть и другой вариант"),
    "9G: main visually first"
  );
  assert(
    order.indexOf("Можно рассмотреть и другой вариант") <
      order.indexOf("Хотите обсудить ваш проект?"),
    "9G: alternative before CTA"
  );
}

// H. needsConsultation: никакой платформы и цены не выдумывается
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Оставить заявку");
advAfter("Мне не принципиально");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(90000);
assert(h1() === DEV_Q, "9H: development question");
advAfter("Пока не знаю");
assert(h1() === CONSULT_TITLE, "9H: consultation screen");
assert(cardName() === "", "9H: no invented name");
assert(
  bodyTexts().every((t) => /^от \d/.test(t) === false),
  "9H: no invented price"
);
assert(restartBtn(), "9H: restart present");

// I. Restart полностью очищает результат
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Прочитать информацию и связаться со\u00A0мной");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(15000);
assert(h1() === "Вам подойдёт:", "9I: result before restart");
click(restartBtn());
assert(h1() === "Какой сайт вам нужен?", "9I: restarted to start");
assert(cardName() === "", "9I: card fully cleared");
assert(byTag(app, "a").filter((a) => a.textContent === "Написать в Telegram").length === 0, "9I: no leftover CTA");

// J. Telegram-кнопка имеет правильную ссылку и открывается в новой вкладке
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Прочитать информацию и связаться со\u00A0мной");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(15000);
assert(h1() === "Вам подойдёт:", "9J: result");
assert(
  bodyTexts().some((t) => t === "Хотите обсудить ваш проект?"),
  "9J: CTA heading"
);
{
  const link = byTag(app, "a").filter((a) => a.textContent === "Написать в Telegram")[0];
  assert(link, "9J: telegram link present");
  assert.strictEqual(link.getAttribute("href"), "https://t.me/TuianaBudaeva", "9J: href");
  assert.strictEqual(link.getAttribute("target"), "_blank", "9J: new tab");
  assert(
    bodyTexts().some((t) => t.indexOf("предварительный") !== -1),
    "9J: disclaimer present"
  );
}
restartBtn()._fire("click");
console.log("9A-J PASSED");

// =========================================================
// 9.2. MAX-кнопка: обычный результат + экраны уточнения
// =========================================================

// A. Обычный результат: Telegram сохранён, MAX добавлен рядом
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Прочитать информацию и связаться со\u00A0мной");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(15000);
assert(h1() === "Вам подойдёт:", "9.2A: result");
{
  const tg = byTag(app, "a").filter((a) => a.textContent === "Написать в Telegram")[0];
  assert(tg, "9.2A: telegram link present");
  assert.strictEqual(tg.getAttribute("href"), "https://t.me/TuianaBudaeva", "9.2A: tg href");
  assert.strictEqual(tg.getAttribute("target"), "_blank", "9.2A: tg new tab");
  assert.strictEqual(tg.getAttribute("rel"), "noopener", "9.2A: tg noopener");
  const max = byTag(app, "a").filter((a) => a.textContent === "Написать в MAX")[0];
  assert(max, "9.2A: max link present on result");
  assert.strictEqual(max.getAttribute("href"), MAX_URL, "9.2A: max href");
  assert.strictEqual(max.getAttribute("target"), "_blank", "9.2A: max new tab");
  assert.strictEqual(max.getAttribute("rel"), "noopener", "9.2A: max noopener");
}
restartBtn()._fire("click");

// B. renderConsultation: оба канала связи
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Оставить заявку");
advAfter("Мне не принципиально");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(90000);
advAfter("Пока не знаю");
assert(h1() === CONSULT_TITLE, "9.2B: consultation screen");
{
  const tg = byTag(app, "a").filter((a) => a.textContent === "Уточнить в Telegram")[0];
  assert(tg, "9.2B: tg present on consultation");
  const max = byTag(app, "a").filter((a) => a.textContent === "Уточнить в MAX")[0];
  assert(max, "9.2B: max present on consultation");
  assert.strictEqual(max.getAttribute("href"), MAX_URL, "9.2B: max href");
  assert.strictEqual(max.getAttribute("target"), "_blank", "9.2B: max new tab");
  assert.strictEqual(max.getAttribute("rel"), "noopener", "9.2B: max noopener");
}
restartBtn()._fire("click");

// C. renderScaleUndefined: оба канала связи
startOver();
advAfter(ONLINE_TOOL);
advAfter("Пока не знаю");
advAfter("Получить расчёт, результат теста или другую персональную информацию");
advAfter("Сам рассчитать результат");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(400000);
assert(h1() === SCALE_UNDEFINED_TITLE, "9.2C: scale undefined screen");
{
  const tg = byTag(app, "a").filter((a) => a.textContent === "Уточнить в Telegram")[0];
  assert(tg, "9.2C: tg present on scale undefined");
  const max = byTag(app, "a").filter((a) => a.textContent === "Уточнить в MAX")[0];
  assert(max, "9.2C: max present on scale undefined");
  assert.strictEqual(max.getAttribute("href"), MAX_URL, "9.2C: max href");
  assert.strictEqual(max.getAttribute("target"), "_blank", "9.2C: max new tab");
  assert.strictEqual(max.getAttribute("rel"), "noopener", "9.2C: max noopener");
}
restartBtn()._fire("click");

console.log("9.2A-C PASSED");

// =========================================================
// Iteration 9.1: формулировки, тупики и воспроизводимость
// =========================================================

// A. Калькулятор без сохранения/истории/кабинета: только расчёт, без «работы с данными»
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Получить расчёт, результат теста или другую персональную информацию");
advAfter("Сам рассчитать результат");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(45000);
assert(h1() === "Вам подойдёт:", "9.1A: title");
assert(cardName() === "Интерактивный сайт или онлайн-инструмент", "9.1A: interactive name");
assert(
  bodyTexts().some(
    (t) =>
      t ===
      "Сайт должен сам рассчитывать персональный результат. Для этого нужна собственная логика, поэтому лучше индивидуальная разработка."
  ),
  "9.1A: calculate wording"
);
assert(
  bodyTexts().every((t) => t.indexOf("работать с данными") === -1),
  "9.1A: no data-handling claim"
);
assert(
  bodyTexts().every(
    (t) => t.indexOf("сохранить") === -1 && t.indexOf("истори") === -1
  ),
  "9.1A: no save/history claim"
);
assert(
  bodyTexts().every((t) => t.indexOf("обходн") === -1),
  "9.1A: no workaround wording"
);

// B. Сохранение результата — о сохранении, а не о кабинете/расчёте
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Получить расчёт, результат теста или другую персональную информацию");
advAfter("Сохранить результат, чтобы к нему можно было вернуться");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(45000);
assert(cardName() === "Индивидуальный веб-сервис", "9.1B: service");
assert(
  bodyTexts().some(
    (t) =>
      t ===
      "Результат нужно сохранить, чтобы к нему можно было вернуться. Это уже функциональность веб-сервиса, поэтому лучше индивидуальная разработка."
  ),
  "9.1B: save wording"
);
assert(
  bodyTexts().every((t) => t.indexOf("личный кабинет с данными") === -1),
  "9.1B: not account wording"
);

// B2. История результатов — текст про историю, а не про кабинет/расчёт
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Получить расчёт, результат теста или другую персональную информацию");
advAfter("Хранить историю результатов");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(45000);
assert(cardName() === "Индивидуальный веб-сервис", "9.1B2: service");
assert(
  bodyTexts().some(
    (t) =>
      t ===
      "Нужно хранить историю результатов, чтобы к ней можно было возвращаться. Это уже функциональность веб-сервиса, поэтому лучше индивидуальная разработка."
  ),
  "9.1B2: history wording"
);
assert(
  bodyTexts().every((t) => t.indexOf("личный кабинет с данными") === -1),
  "9.1B2: not account wording"
);

// C. Личный кабинет: веб-сервис без «обходных решений»
startOver();
advAfter(ONLINE_TOOL);
advAfter("Да, нужны отдельные самостоятельные страницы или разделы");
advAfter("Входить в личный кабинет");
advAfter("Смотреть историю заявок или заказов");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(60000);
assert(cardName() === "Индивидуальный веб-сервис", "9.1C: service");
assert(
  bodyTexts().some(
    (t) =>
      t ===
      "Нужен личный кабинет с данными пользователя. Это уже функциональность веб-сервиса, поэтому лучше индивидуальная разработка."
  ),
  "9.1C: account wording"
);
assert(
  bodyTexts().every((t) => t.indexOf("обходн") === -1),
  "9.1C: no workaround claim"
);

// D. Taplink: бесплатный тариф и платный ориентир без противоречия
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Прочитать информацию и связаться со\u00A0мной");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(15000);
assert(h1() === "Вам подойдёт:", "9.1D: title");
assert(cardName() === "Одностраничный сайт на Taplink", "9.1D: name");
assert(
  bodyTexts().some((t) => t.indexOf("У Taplink есть бесплатный тариф") !== -1),
  "9.1D: free tier"
);
assert(
  bodyTexts().some((t) => t.indexOf("от 1 080 ₽ в год") !== -1),
  "9.1D: paid orientir"
);
assert(
  bodyTexts().every((t) => t.indexOf("Базовый тариф") === -1),
  "9.1D: no contradiction"
);
assert(
  bodyTexts().some((t) => t.indexOf("Домен оплачивается отдельно") !== -1),
  "9.1D: domain separate"
);

// E. Блок «бюджет ниже»: спокойная формулировка без повторений
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Оставить заявку");
advAfter("Для меня особенно важны необычный дизайн, анимация и эффектная подача");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(15000);
assert(h1() === "Вам подойдёт:", "9.1E: title");
assert(
  bodyTexts().some((t) => t === "Ваш бюджет сейчас ниже этого ориентира"),
  "9.1E: heading without period"
);
assert(
  bodyTexts().some(
    (t) => t === "Это не значит, что нужно выбирать неподходящую платформу."
  ),
  "9.1E: calm text"
);
assert(
  bodyTexts().some((t) => t === "— Сократить первую версию до самого важного."),
  "9.1E: item 1"
);
assert(
  bodyTexts().some((t) => t === "— Запустить проект поэтапно."),
  "9.1E: item 2"
);
assert(
  bodyTexts().every((t) => t.indexOf("Можно обсудить более компактную") === -1),
  "9.1E: no repeated advice"
);

// F. development = «Пока не знаю»: причина + Telegram CTA + перезапуск
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Оставить заявку");
advAfter("Мне не принципиально");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(90000);
assert(h1() === DEV_Q, "9.1F: development question");
advAfter("Пока не знаю");
assert(h1() === CONSULT_TITLE, "9.1F: consultation screen");
assert(cardName() === "", "9.1F: no invented name");
assert(
  bodyTexts().every((t) => /^от \d/.test(t) === false),
  "9.1F: no invented price"
);
assert(
  bodyTexts().some(
    (t) =>
      t ===
      "Пока неясно, как проект может развиваться дальше, а это влияет на выбор способа реализации."
  ),
  "9.1F: development reason"
);
{
  const link = byTag(app, "a").filter((a) => a.textContent === "Уточнить в Telegram")[0];
  assert(link, "9.1F: telegram cta");
  assert.strictEqual(link.getAttribute("href"), "https://t.me/TuianaBudaeva", "9.1F: href");
  assert.strictEqual(link.getAttribute("target"), "_blank", "9.1F: new tab");
  assert.strictEqual(link.getAttribute("rel"), "noopener", "9.1F: noopener");
}
assert(restartBtn(), "9.1F: restart present");
restartBtn()._fire("click");

// G. Масштаб не определён: причина + Telegram CTA, без выдуманных имени/цены
startOver();
advAfter(ONLINE_TOOL);
advAfter("Пока не знаю");
assert(h1() === "Что человек должен сделать на сайте?", "9.1G: tool-clarify not repeated");
advAfter("Получить расчёт, результат теста или другую персональную информацию");
advAfter("Сам рассчитать результат");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(400000);
assert(h1() === SCALE_UNDEFINED_TITLE, "9.1G: scale undef screen");
assert(
  bodyTexts().some(
    (t) =>
      t === "Пока неясно, достаточно одной страницы или нужны отдельные самостоятельные разделы."
  ),
  "9.1G: scale reason"
);
assert(bodyTexts().every((t) => t !== "Вам подойдёт:"), "9.1G: no invented result");
assert(
  bodyTexts().every((t) => /^от \d/.test(t) === false),
  "9.1G: no invented price"
);
{
  const link = byTag(app, "a").filter((a) => a.textContent === "Уточнить в Telegram")[0];
  assert(link, "9.1G: telegram cta");
  assert.strictEqual(link.getAttribute("href"), "https://t.me/TuianaBudaeva", "9.1G: href");
}
assert(restartBtn(), "9.1G: restart present");
restartBtn()._fire("click");

// H. edit-priority = «Пока не знаю»: объяснение + Telegram CTA
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Оставить заявку");
advAfter("Для меня особенно важны необычный дизайн, анимация и эффектная подача");
advAfter("Хочу регулярно самостоятельно обновлять сайт");
advAfter("Цены");
fillBudgetAndAdv(120000);
assert(h1() === EDIT_Q, "9.1H: edit question");
advAfter("Пока не знаю");
assert(h1() === CONSULT_TITLE, "9.1H: consultation screen");
assert(
  bodyTexts().some(
    (t) =>
      t ===
      "Нужно понять, что для вас важнее: самостоятельно часто менять сайт или получить больше свободы в дизайне."
  ),
  "9.1H: edit reason"
);
assert(
  byTag(app, "a").some((a) => a.textContent === "Уточнить в Telegram"),
  "9.1H: telegram cta"
);
assert(restartBtn(), "9.1H: restart present");
restartBtn()._fire("click");

// I. CTA обычного результата: без обещания «прислать результат», без копирования
startOver();
advAfter("Себя и свои услуги");
advAfter("Есть одна основная тема или предложение");
advAfter("Прочитать информацию и связаться со\u00A0мной");
advAfter("Мне подходит компактная аккуратная страница");
advAfter("Почти ничего менять не планирую");
fillBudgetAndAdv(15000);
assert(h1() === "Вам подойдёт:", "9.1I: title");
assert(
  bodyTexts().some(
    (t) =>
      t === "Напишите мне — я посмотрю задачу и помогу уточнить формат, объём и следующий шаг."
  ),
  "9.1I: new CTA text"
);
assert(
  bodyTexts().every((t) => t.indexOf("прислать мне результат") === -1),
  "9.1I: no auto-transfer claim"
);
assert(
  byTag(app, "button").filter((b) => /копир|copy/i.test(b.textContent)).length === 0,
  "9.1I: no copy button"
);
restartBtn()._fire("click");

console.log("9.1A-I PASSED");

console.log("ALL SCENARIOS PASSED");