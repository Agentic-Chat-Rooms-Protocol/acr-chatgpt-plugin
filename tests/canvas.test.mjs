import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

class Element {
  constructor(id) {
    this.id = id;
    this.attributes = new Map();
    this.listeners = new Map();
    this.classes = new Set();
    this.classList = { toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name) };
    this.value = "";
    this.textContent = "";
    this.focused = false;
  }

  setAttribute(name, value) { this.attributes.set(name, value); }
  getAttribute(name) { return this.attributes.get(name); }
  addEventListener(name, callback) { this.listeners.set(name, callback); }
  focus() { this.focused = true; }
  fire(name, key) {
    const event = { key, prevented: false, preventDefault() { this.prevented = true; } };
    this.listeners.get(name)(event);
    return event;
  }
}

function setup() {
  const tabs = ["consensus", "dag", "room"].map((id) => {
    const tab = new Element(`tab-${id}`);
    tab.setAttribute("aria-controls", id);
    return tab;
  });
  const panels = ["consensus", "dag", "room"].map((id) => new Element(id));
  const elements = new Map([...tabs, ...panels].map((element) => [element.id, element]));
  for (const id of ["vote-form", "vote-choice", "vote-rationale", "vote-status"]) elements.set(id, new Element(id));
  elements.get("vote-choice").value = "APPROVE";
  const document = {
    querySelectorAll: (selector) => {
      if (selector === '[role="tab"]') return tabs;
      if (selector === '[role="tabpanel"]') return panels;
      throw new Error(`Unexpected selector: ${selector}`);
    },
    getElementById: (id) => elements.get(id),
  };
  runInNewContext(readFileSync(new URL("../web-ui/canvas-app.js", import.meta.url), "utf-8"), { document });
  return { tabs, panels, form: elements.get("vote-form"), choice: elements.get("vote-choice"), rationale: elements.get("vote-rationale"), status: elements.get("vote-status") };
}

describe("Canvas preview behavior", () => {
  it("switches tabs, hides inactive panels and maintains roving focus", () => {
    const { tabs, panels } = setup();
    tabs[1].fire("click");
    assert.deepEqual(tabs.map((tab) => tab.getAttribute("aria-selected")), ["false", "true", "false"]);
    assert.deepEqual(tabs.map((tab) => tab.tabIndex), [-1, 0, -1]);
    assert.deepEqual(panels.map((panel) => panel.hidden), [true, false, true]);
    assert.equal(tabs[1].fire("keydown", "ArrowRight").prevented, true);
    assert.equal(tabs[2].focused, true);
    tabs[2].fire("keydown", "ArrowRight");
    assert.equal(tabs[0].getAttribute("aria-selected"), "true");
    tabs[0].fire("keydown", "ArrowLeft");
    assert.equal(tabs[2].getAttribute("aria-selected"), "true");
    tabs[2].fire("keydown", "Home");
    assert.equal(tabs[0].getAttribute("aria-selected"), "true");
    tabs[0].fire("keydown", "End");
    assert.equal(tabs[2].getAttribute("aria-selected"), "true");
    assert.equal(tabs[2].fire("keydown", "Tab").prevented, false);
  });

  it("rejects empty or whitespace-only dissent without dispatching a tool", () => {
    for (const value of ["", " \t\n "]) {
      const { choice, rationale, form, status } = setup();
      choice.value = "DISSENT";
      rationale.value = value;
      assert.equal(form.fire("submit").prevented, true);
      assert.match(status.textContent, /non-empty rationale/i);
      assert.equal(rationale.getAttribute("aria-invalid"), "true");
      assert.equal(rationale.focused, true);
    }
  });

  it("renders untrusted rationale literally and labels successful previews as unsent", () => {
    const { choice, rationale, form, status } = setup();
    choice.value = "DISSENT";
    rationale.value = '  <img src=x onerror="throw Error()">  ';
    form.fire("submit");
    assert.match(status.textContent, /<img src=x onerror=/);
    assert.match(status.textContent, /Preview only/);
    assert.match(status.textContent, /No ballot was sent/);
    assert.equal(rationale.getAttribute("aria-invalid"), "false");
  });

  it("previews APPROVE and REJECT without requiring a rationale", () => {
    for (const value of ["APPROVE", "REJECT"]) {
      const { choice, form, status } = setup();
      choice.value = value;
      form.fire("submit");
      assert.match(status.textContent, new RegExp(`Preview only: ${value}`));
      assert.match(status.textContent, /No ballot was sent/);
    }
  });

  it("rejects unknown choices and caps rationale length, including programmatic input", () => {
    const { choice, rationale, form, status } = setup();
    choice.value = "UNRECOGNIZED";
    form.fire("submit");
    assert.match(status.textContent, /Choose APPROVE, REJECT, or DISSENT/);
    choice.value = "DISSENT";
    rationale.value = "x".repeat(2001);
    form.fire("submit");
    assert.match(status.textContent, /2000 characters/);
    rationale.value = "x".repeat(2000);
    form.fire("submit");
    assert.match(status.textContent, /No ballot was sent/);
  });
});
