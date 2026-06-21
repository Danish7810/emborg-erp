export type Module = {
  id: string;
  name: string;
  problem: string;
  outcome: string;
};

export const modules: Module[] = [
  { id: "inventory", name: "Inventory Management", problem: "Stock counts drift from reality the moment they leave a spreadsheet.", outcome: "EMBORG keeps every warehouse in sync, in real time." },
  { id: "finance", name: "Accounting and Finance", problem: "Invoices get chased by memory, and reports take days to assemble.", outcome: "EMBORG automates billing and gives you live financial reports." },
  { id: "crm", name: "CRM", problem: "Leads fall through the cracks between calls, emails, and sticky notes.", outcome: "EMBORG keeps every customer and deal in one pipeline." },
  { id: "hr", name: "HR and Payroll", problem: "Payroll runs late when attendance and leave live in different tools.", outcome: "EMBORG pays people correctly and on time, every cycle." },
  { id: "sales", name: "Sales Management", problem: "Sales teams chase quota with no visibility into what is actually selling.", outcome: "EMBORG shows performance and orders as they happen." },
  { id: "projects", name: "Project Management", problem: "Deadlines slip when tasks live outside the systems that track work.", outcome: "EMBORG keeps plans, tasks, and teams moving together." }
];
