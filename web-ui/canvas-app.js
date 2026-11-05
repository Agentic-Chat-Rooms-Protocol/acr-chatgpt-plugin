const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));

function selectTab(selected) {
  for (const tab of tabs) {
    const active = tab === selected;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    tab.classList.toggle("active", active);
  }
  for (const panel of panels) {
    const active = panel.id === selected.getAttribute("aria-controls");
    panel.hidden = !active;
    panel.classList.toggle("active", active);
  }
}

for (const [index, tab] of tabs.entries()) {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (event) => {
    let target;
    if (event.key === "ArrowRight") target = tabs[(index + 1) % tabs.length];
    else if (event.key === "ArrowLeft") target = tabs[(index + tabs.length - 1) % tabs.length];
    else if (event.key === "Home") target = tabs[0];
    else if (event.key === "End") target = tabs[tabs.length - 1];
    else return;
    event.preventDefault();
    selectTab(target);
    target.focus();
  });
}

const form = document.getElementById("vote-form");
const choice = document.getElementById("vote-choice");
const rationale = document.getElementById("vote-rationale");
const status = document.getElementById("vote-status");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  choice.setAttribute("aria-invalid", "false");
  rationale.setAttribute("aria-invalid", "false");
  if (!["APPROVE", "REJECT", "DISSENT"].includes(choice.value)) {
    status.textContent = "Choose APPROVE, REJECT, or DISSENT.";
    choice.setAttribute("aria-invalid", "true");
    choice.focus();
    return;
  }
  const reason = rationale.value.trim();
  if (choice.value === "DISSENT" && !reason) {
    status.textContent = "DISSENT requires a non-empty rationale under RFC-0002.";
    rationale.setAttribute("aria-invalid", "true");
    rationale.focus();
    return;
  }
  if (rationale.value.length > 2000) {
    status.textContent = "Rationale must be at most 2000 characters.";
    rationale.setAttribute("aria-invalid", "true");
    rationale.focus();
    return;
  }
  status.textContent = `Preview only: ${choice.value}${reason ? ` - ${reason}` : ""}. No ballot was sent.`;
});
