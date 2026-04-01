import { CONDITIONS, DEFENSES, MOVEMENTS, WEAPONS } from "../data/catalog.js";
import { applyRulePriorities, describeRule } from "../sim/rules.js";

export function renderRuleEditor({ ruleSet, roots, onRuleSetChange }) {
  roots.interrupts.innerHTML = "";
  roots.doctrine.innerHTML = "";

  renderRuleSection("interrupts", roots.interrupts, ruleSet, onRuleSetChange);
  renderRuleSection("doctrine", roots.doctrine, ruleSet, onRuleSetChange);
}

function renderRuleSection(sectionKey, container, ruleSet, onRuleSetChange) {
  ruleSet[sectionKey].forEach((rule, index) => {
    container.appendChild(buildRuleCard(sectionKey, rule, index, ruleSet, onRuleSetChange));
  });
}

function buildRuleCard(sectionKey, rule, index, ruleSet, onRuleSetChange) {
  const card = document.createElement("div");
  card.className = "rule-card" + (rule.enabled ? "" : " disabled");

  const head = document.createElement("div");
  head.className = "rule-head";

  const title = document.createElement("div");
  title.className = "rule-title";
  const indexBadge = document.createElement("span");
  indexBadge.className = "rule-index";
  indexBadge.textContent = String(rule.priority);
  const label = document.createElement("div");
  label.className = "rule-label";
  label.textContent = describeRule(rule, sectionKey);
  title.append(indexBadge, label);

  const actions = document.createElement("div");
  actions.className = "rule-actions";
  actions.append(
    buildSmallButton("Up", () => moveRule(sectionKey, index, -1, ruleSet, onRuleSetChange)),
    buildSmallButton("Down", () => moveRule(sectionKey, index, 1, ruleSet, onRuleSetChange))
  );

  head.append(title, actions);
  card.appendChild(head);

  const toggle = document.createElement("label");
  toggle.className = "rule-toggle";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = rule.enabled;
  checkbox.addEventListener("change", () => {
    rule.enabled = checkbox.checked;
    onRuleSetChange(applyRulePriorities(ruleSet));
  });
  const toggleText = document.createElement("span");
  toggleText.textContent = rule.enabled ? "Rule armed" : "Rule disabled";
  checkbox.addEventListener("change", () => {
    toggleText.textContent = checkbox.checked ? "Rule armed" : "Rule disabled";
  });
  toggle.append(checkbox, toggleText);
  card.appendChild(toggle);

  const grid = document.createElement("div");
  grid.className = "rule-grid";
  grid.append(
    buildSelectField("Condition", CONDITIONS, rule.condition, (value) => {
      rule.condition = value;
      onRuleSetChange(applyRulePriorities(ruleSet));
    }),
    buildSelectField("Movement", MOVEMENTS, rule.movement, (value) => {
      rule.movement = value;
      onRuleSetChange(applyRulePriorities(ruleSet));
    }),
    buildSelectField("Defense", DEFENSES, rule.defense, (value) => {
      rule.defense = value;
      onRuleSetChange(applyRulePriorities(ruleSet));
    }),
    buildSelectField("Weapons", WEAPONS, rule.weapons, (value) => {
      rule.weapons = value;
      onRuleSetChange(applyRulePriorities(ruleSet));
    })
  );

  card.appendChild(grid);
  return card;
}

function moveRule(sectionKey, index, direction, ruleSet, onRuleSetChange) {
  const rules = ruleSet[sectionKey];
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= rules.length) {
    return;
  }
  [rules[index], rules[targetIndex]] = [rules[targetIndex], rules[index]];
  onRuleSetChange(applyRulePriorities(ruleSet));
}

function buildSmallButton(text, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn";
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

function buildSelectField(labelText, options, currentValue, onChange) {
  const wrap = document.createElement("label");
  wrap.className = "field";
  wrap.style.marginBottom = "0";
  const label = document.createElement("span");
  label.textContent = labelText;
  const select = document.createElement("select");
  for (const [value, text] of Object.entries(options)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    select.appendChild(option);
  }
  select.value = currentValue;
  select.addEventListener("change", () => onChange(select.value));
  wrap.append(label, select);
  return wrap;
}
