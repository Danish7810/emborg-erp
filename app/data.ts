export type Module = {
  id: string;
  name: string;
  problem: string;
  outcome: string;
  story: string;
};

export const modules: Module[] = [
  {
    id: "inventory",
    name: "Inventory Management",
    problem: "Stock counts drift from reality the moment they leave a spreadsheet.",
    outcome: "EMBORG keeps every warehouse in sync, in real time.",
    story: "A growing distributor was selling stock that had already run out at another branch. After switching to EMBORG, every location reads from the same live count, and overselling stopped within the first week."
  },
  {
    id: "finance",
    name: "Accounting and Finance",
    problem: "Invoices get chased by memory, and reports take days to assemble.",
    outcome: "EMBORG automates billing and gives you live financial reports.",
    story: "A services firm closed their books three days late, every month, by hand. With EMBORG automating invoicing and reporting, their finance lead now closes the month in an afternoon."
  },
  {
    id: "crm",
    name: "CRM",
    problem: "Leads fall through the cracks between calls, emails, and sticky notes.",
    outcome: "EMBORG keeps every customer and deal in one pipeline.",
    story: "A sales team was losing track of follow-ups across three different tools. Once every lead lived in one EMBORG pipeline, their response time dropped and nothing slipped through again."
  },
  {
    id: "hr",
    name: "HR and Payroll",
    problem: "Payroll runs late when attendance and leave live in different tools.",
    outcome: "EMBORG pays people correctly and on time, every cycle.",
    story: "A manufacturer ran payroll manually from punch cards and a separate leave tracker, often missing the cutoff. EMBORG combined both into one source of truth, and payroll now runs on schedule every cycle."
  },
  {
    id: "sales",
    name: "Sales Management",
    problem: "Sales teams chase quota with no visibility into what is actually selling.",
    outcome: "EMBORG shows performance and orders as they happen.",
    story: "A retail chain only learned which products were moving at month-end review. With EMBORG's live order view, managers now adjust stock and promotions the same week, not the month after."
  },
  {
    id: "projects",
    name: "Project Management",
    problem: "Deadlines slip when tasks live outside the systems that track work.",
    outcome: "EMBORG keeps plans, tasks, and teams moving together.",
    story: "A construction firm tracked site milestones in a separate app from the budget. Once both lived in EMBORG, missed handoffs between teams dropped sharply within the first project cycle."
  }
];
