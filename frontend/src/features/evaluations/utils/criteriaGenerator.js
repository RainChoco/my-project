// Deterministic (no AI/external calls) generation of the four core procurement
// criteria from a free-text job/contract scope. Names, categories, and default
// weights are always fixed - only the description text adapts, based on simple
// keyword matching against the entered scope.
const LIFT_KEYWORDS = /\b(lift|lifts|elevator|elevators)\b/i;
const NETWORK_KEYWORDS = /\b(cable|cables|cabling|network|networks|wiring)\b/i;

export function detectJobDomain(jobScope) {
  const text = jobScope || '';
  if (LIFT_KEYWORDS.test(text)) return 'lift';
  if (NETWORK_KEYWORDS.test(text)) return 'network';
  return 'general';
}

// Price Competitiveness purpose doesn't vary by domain in any of the given
// examples - pricing evaluation is the same regardless of job type.
const CORE_CRITERIA_TEMPLATES = [
  {
    criteria_name: 'Price Competitiveness',
    category: 'price',
    default_weight: 25,
    descriptionByDomain: {
      lift: "Evaluate whether the vendor's quotation provides competitive pricing while still meeting the required scope of work.",
      network: "Evaluate whether the vendor's quotation provides competitive pricing while still meeting the required scope of work.",
      general: "Evaluate whether the vendor's quotation provides competitive pricing while still meeting the required scope of work.",
    },
  },
  {
    criteria_name: 'Quality of Work',
    category: 'quality',
    default_weight: 30,
    descriptionByDomain: {
      lift: 'Assess preventive maintenance methodology, repair quality and ability to minimise lift breakdowns.',
      network: 'Assess maintenance methodology, fault prevention strategy and ability to minimise network outages.',
      general: 'Evaluate the expected workmanship, methodology, service quality and ability to deliver work according to required standards.',
    },
  },
  {
    criteria_name: 'Resource Availability',
    category: 'capability',
    default_weight: 25,
    descriptionByDomain: {
      lift: 'Assess technician availability, maintenance resources and emergency response capability.',
      network: 'Assess availability of technical staff and equipment for scheduled maintenance and emergency repairs.',
      general: 'Evaluate whether the vendor has sufficient manpower, equipment, resources and scheduling capacity to complete the project successfully.',
    },
  },
  {
    criteria_name: 'Relevant Experience',
    category: 'experience',
    default_weight: 20,
    descriptionByDomain: {
      lift: 'Assess previous lift maintenance projects completed for residential developments.',
      network: 'Assess previous experience maintaining similar network or cabling infrastructure.',
      general: 'Evaluate whether the vendor has successfully completed similar projects and possesses the required industry experience.',
    },
  },
];

// Returns the 4 core criteria as fresh, editable rows - nothing is persisted
// here, this only computes what the "Generated Evaluation Criteria" panel shows.
export function generateCoreCriteria(jobScope) {
  const domain = detectJobDomain(jobScope);
  return CORE_CRITERIA_TEMPLATES.map((t) => ({
    criteria_name: t.criteria_name,
    category: t.category,
    weight_percentage: t.default_weight,
    description: t.descriptionByDomain[domain],
  }));
}
