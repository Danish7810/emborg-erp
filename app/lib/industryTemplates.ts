export type IndustryTemplate = {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  inventoryCategories: string[];
  expenseCategories: string[];
  leadStages: string[];
  sampleContacts: { full_name: string; company_name: string; email: string; phone: string }[];
  sampleLeads: { title: string; value: number; status: string }[];
  sampleInventory: { name: string; sku: string; category: string; quantity: number; price: number; low_stock_alert: number; unit: string }[];
  tips: string[];
};

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    id: "retail",
    name: "Retail & Trading",
    icon: "🛍️",
    description: "Perfect for shops, distributors, and trading companies managing products, suppliers, and customer orders.",
    color: "#3B82F6",
    inventoryCategories: ["Electronics", "Clothing & Apparel", "Food & Beverages", "Home & Kitchen", "Sports & Fitness", "Beauty & Personal Care", "Stationery", "Toys & Games"],
    expenseCategories: ["Rent & Utilities", "Staff Salaries", "Stock Purchase", "Transport & Delivery", "Marketing & Advertising", "Packaging Materials", "Equipment Maintenance", "Miscellaneous"],
    leadStages: ["new", "contacted", "qualified", "won", "lost"],
    sampleContacts: [
      { full_name: "Rajesh Sharma", company_name: "Sharma Wholesale", email: "rajesh@sharmawholesale.com", phone: "9876543210" },
      { full_name: "Priya Mehta", company_name: "Mehta Distributors", email: "priya@mehtadist.com", phone: "9876543211" },
      { full_name: "Arun Kumar", company_name: "Kumar Retail Chain", email: "arun@kumarretail.com", phone: "9876543212" },
    ],
    sampleLeads: [
      { title: "Bulk order — Sharma Wholesale Q3", value: 250000, status: "qualified" },
      { title: "New distributor — South Zone", value: 180000, status: "contacted" },
      { title: "Festival season stock deal", value: 420000, status: "new" },
    ],
    sampleInventory: [
      { name: "Cotton T-Shirt (White, M)", sku: "CLT-001", category: "Clothing & Apparel", quantity: 150, price: 299, low_stock_alert: 20, unit: "pcs" },
      { name: "LED Bulb 9W", sku: "ELC-001", category: "Electronics", quantity: 300, price: 89, low_stock_alert: 50, unit: "pcs" },
      { name: "Stainless Steel Tiffin Box", sku: "HME-001", category: "Home & Kitchen", quantity: 80, price: 449, low_stock_alert: 15, unit: "pcs" },
    ],
    tips: [
      "Set low stock alerts for your fastest-moving products so you never run out during peak season",
      "Track each supplier as a Contact so you can log calls and follow up on delayed shipments",
      "Use the Finance module to track GST on purchases vs sales separately",
    ],
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    icon: "🏭",
    description: "For factories and production units managing raw materials, finished goods, B2B customers, and workforce.",
    color: "#F59E0B",
    inventoryCategories: ["Raw Materials", "Work in Progress", "Finished Goods", "Packaging Materials", "Spare Parts & Machinery", "Tools & Equipment", "Consumables", "Rejected/Scrap"],
    expenseCategories: ["Raw Material Purchase", "Labour & Contract", "Power & Fuel", "Machine Maintenance", "Factory Rent", "Quality Testing", "Logistics & Freight", "Admin & Overhead"],
    leadStages: ["new", "contacted", "qualified", "won", "lost"],
    sampleContacts: [
      { full_name: "Suresh Patel", company_name: "Patel Industries Ltd", email: "suresh@patelindustries.com", phone: "9876543220" },
      { full_name: "Anita Singh", company_name: "Singh Manufacturing", email: "anita@singhmnfg.com", phone: "9876543221" },
      { full_name: "Vikram Joshi", company_name: "Joshi Components", email: "vikram@joshicomp.com", phone: "9876543222" },
    ],
    sampleLeads: [
      { title: "Annual supply contract — Patel Industries", value: 1500000, status: "qualified" },
      { title: "Export order — UAE buyer", value: 800000, status: "contacted" },
      { title: "OEM parts deal — Auto sector", value: 2200000, status: "new" },
    ],
    sampleInventory: [
      { name: "Steel Rods (12mm)", sku: "RM-STL-001", category: "Raw Materials", quantity: 5000, price: 65, low_stock_alert: 500, unit: "kg" },
      { name: "Industrial Lubricant 5L", sku: "CON-LUB-001", category: "Consumables", quantity: 40, price: 850, low_stock_alert: 10, unit: "can" },
      { name: "Finished Product Box A", sku: "FG-BOX-001", category: "Finished Goods", quantity: 200, price: 1200, low_stock_alert: 30, unit: "pcs" },
    ],
    tips: [
      "Separate raw materials and finished goods as inventory categories for accurate stock valuation",
      "Log every B2B inquiry as a lead — manufacturing deals have long cycles and need consistent follow-up",
      "Run payroll from the HR module and tag labour costs in Finance for accurate production cost tracking",
    ],
  },
  {
    id: "services",
    name: "Services & Agency",
    icon: "💼",
    description: "For consultancies, agencies, freelancers with a team, and professional services businesses.",
    color: "#8B5CF6",
    inventoryCategories: ["Software Licenses", "Hardware & Equipment", "Office Supplies", "Marketing Materials", "IT Assets", "Subscriptions"],
    expenseCategories: ["Salaries & Freelancers", "Office Rent", "Software & Tools", "Travel & Client Meetings", "Marketing & Ads", "Legal & Compliance", "Training & Development", "Miscellaneous"],
    leadStages: ["new", "contacted", "qualified", "won", "lost"],
    sampleContacts: [
      { full_name: "Neha Gupta", company_name: "Gupta Consulting Group", email: "neha@guptaconsulting.com", phone: "9876543230" },
      { full_name: "Rohit Verma", company_name: "Verma Tech Solutions", email: "rohit@vermatech.com", phone: "9876543231" },
      { full_name: "Kavya Reddy", company_name: "Reddy Digital Agency", email: "kavya@reddydigital.com", phone: "9876543232" },
    ],
    sampleLeads: [
      { title: "Website redesign — Gupta Consulting", value: 85000, status: "qualified" },
      { title: "6-month retainer — Verma Tech", value: 240000, status: "contacted" },
      { title: "Brand identity project — Startup client", value: 45000, status: "new" },
    ],
    sampleInventory: [
      { name: "MacBook Pro 14 inch", sku: "HW-MBP-001", category: "Hardware & Equipment", quantity: 5, price: 185000, low_stock_alert: 1, unit: "pcs" },
      { name: "Adobe Creative Cloud (Annual)", sku: "SW-ADO-001", category: "Software Licenses", quantity: 3, price: 54000, low_stock_alert: 1, unit: "license" },
      { name: "Notebook (Premium)", sku: "OFF-NB-001", category: "Office Supplies", quantity: 25, price: 120, low_stock_alert: 5, unit: "pcs" },
    ],
    tips: [
      "Track every proposal as a lead with the project value so you always know your pipeline revenue",
      "Create a contact for each client company AND the individual contact person — link them in notes",
      "Invoice immediately after project milestones rather than at month end to improve cash flow",
    ],
  },
  {
    id: "restaurant",
    name: "Restaurant & F&B",
    icon: "🍽️",
    description: "For restaurants, cafes, cloud kitchens, and food businesses managing ingredients, vendors, and operations.",
    color: "#EF4444",
    inventoryCategories: ["Vegetables & Produce", "Meat & Seafood", "Dairy & Eggs", "Dry Goods & Grains", "Beverages", "Cooking Oils & Condiments", "Packaging & Disposables", "Cleaning Supplies"],
    expenseCategories: ["Raw Ingredients", "Staff Wages", "Rent & Utilities", "Gas & Fuel", "Equipment Maintenance", "Packaging & Supplies", "Marketing & Zomato/Swiggy", "Licensing & Permits"],
    leadStages: ["new", "contacted", "qualified", "won", "lost"],
    sampleContacts: [
      { full_name: "Ramesh Yadav", company_name: "Yadav Fresh Supplies", email: "ramesh@yadavfresh.com", phone: "9876543240" },
      { full_name: "Sunita Agarwal", company_name: "Agarwal Dairy", email: "sunita@agarwaldairy.com", phone: "9876543241" },
      { full_name: "Harish Nair", company_name: "Corporate Catering Co", email: "harish@corporatecatering.com", phone: "9876543242" },
    ],
    sampleLeads: [
      { title: "Corporate lunch contract — Tech Park", value: 120000, status: "qualified" },
      { title: "Wedding catering — Dec booking", value: 85000, status: "contacted" },
      { title: "Cloud kitchen franchise inquiry", value: 500000, status: "new" },
    ],
    sampleInventory: [
      { name: "Basmati Rice (Premium)", sku: "DRY-RIC-001", category: "Dry Goods & Grains", quantity: 100, price: 85, low_stock_alert: 20, unit: "kg" },
      { name: "Chicken (Fresh)", sku: "MEA-CHK-001", category: "Meat & Seafood", quantity: 30, price: 280, low_stock_alert: 5, unit: "kg" },
      { name: "Sunflower Oil 15L", sku: "OIL-SNF-001", category: "Cooking Oils & Condiments", quantity: 8, price: 1800, low_stock_alert: 2, unit: "can" },
    ],
    tips: [
      "Set very tight low-stock alerts on perishables like meat and dairy — reorder daily for fresh items",
      "Log every catering inquiry as a lead with full event value to track your B2B revenue pipeline",
      "Track Zomato/Swiggy commission as a separate expense category to see true delivery margin",
    ],
  },
];
