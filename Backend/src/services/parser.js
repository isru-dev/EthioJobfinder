// Keyword dictionary for automatic category classification
const CATEGORY_MAP = {
  "Software / IT": [
    "developer", "software", "frontend", "backend", "fullstack", "react",
    "node", "python", "java", "tech", "web", "ui/ux", "designer", "data"
  ],
  "Finance & Accounting": [
    "accountant", "finance", "auditor", "banking", "tax", "payroll"
  ],
  "Sales & Marketing": [
    "marketing", "sales", "social media", "content", "manager", "business"
  ],
  "Healthcare": [
    "nurse", "doctor", "health", "clinical", "pharmacy"
  ]
};

export const parseRawJobText = (rawText) => {
  if (!rawText) return {};

  const lines = rawText.split("\n").map(line => line.trim()).filter(Boolean);

  // 1. Extract Title (Usually the first non-empty line or explicitly labeled line)
  let title = "Uncategorized Vacancy";
  const titleLine = lines.find(l => /^job title|^position|^role/i.test(l));
  if (titleLine) {
    title = titleLine.replace(/^job title:?|^position:?|^role:?/i, "").trim();
  } else if (lines.length > 0) {
    title = lines[0].slice(0, 80); // Fallback to first line
  }

  // 2. Extract Company Name
  let company = "Not Specified";
  const companyLine = lines.find(l => /^company|^organization|^employer/i.test(l));
  if (companyLine) {
    company = companyLine.replace(/^company:?|^organization:?|^employer:?/i, "").trim();
  }

  // 3. Extract Emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = rawText.match(emailRegex) || [];

  // 4. Extract Ethiopian Phone Numbers (+251 or 09/07...)
  const phoneRegex = /(?:\+251|0)(?:9|7)\d{8}/g;
  const phones = rawText.match(phoneRegex) || [];

  // 5. Categorize based on keywords
  let category = "General / Other";
  const lowerText = rawText.toLowerCase();

  for (const [catName, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      category = catName;
      break;
    }
  }

  // 6. Generate Search Tags
  const tags = Array.from(
    new Set([
      ...title.toLowerCase().split(/\s+/),
      ...category.toLowerCase().split(/[\s\/]+/)
    ])
  ).filter(tag => tag.length > 2);

  return {
    title,
    company,
    category,
    contactEmail: emails[0] || null,
    contactPhone: phones[0] || null,
    tags
  };
};