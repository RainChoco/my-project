# Project Requirements
## Streamlining Group Buy Management for Better Efficiency and Trust
**Meod Farm - AI PoC Initiative**
*Document Date: May 2026*

---

## 1. Problem Statement

**Title:** Streamlining Group Buy Management for Better Efficiency and Trust

### Who
Group buy **hosts** and **end-buyers** participating in bulk vegetable purchases via Meod Farm's online platform.

### What
Our organisation struggles to efficiently manage and coordinate group buys across multiple hosts and buyers. The current process involves tracking orders, managing tiered pricing, communicating updates, and reconciling payments - all at scale and in near real-time. The volume of coordination touchpoints creates significant operational drag and increases the risk of errors, disputes, and missed fulfilment.

### Barriers
- Lack of a unified system that serves both hosts and buyers with role-appropriate views
- Inconsistent communication across channels leading to missed updates or conflicting information
- **Over-reliance on manual workflows (e.g., spreadsheets and messaging apps) that do not scale with group buy volume or complexity**
- Difficulty enforcing pricing tiers fairly and transparently across different buyer groups
- Balancing conflicting priorities between hosts (efficiency, profitability) and buyers (fairness, transparency)

### Cause
- **Over-reliance on manual workflows (e.g., spreadsheets and messaging apps) that introduce human error and require constant intervention**
- Absence of automated logic for tiered pricing, order aggregation, and status updates
- No centralised data layer connecting the e-commerce storefront, communication tools, and order management
- Lack of role-based access controls, resulting in information asymmetry and trust issues

### Emotion
The current state leaves the team feeling **frustrated by inefficiencies**, **anxious about data integrity and fairness**, and concerned about the long-term sustainability of managing group buys manually as the platform scales.

### Outcome of Problem
- **Increased administrative burden on hosts**, reducing their capacity to manage more group buys
- Loss of trust from buyers when pricing feels inconsistent or communication is delayed
- Missed revenue opportunities due to coordination failures or buyer drop-off
- Reputational risk if perceived unfairness in order allocation or pricing goes unaddressed
- Difficulty scaling operations without proportional increases in manual effort

---

## 2. Proposed Solution & Value Proposition

### AI Value Proposition
An AI-powered coordination layer that automates the most friction-heavy parts of group buy management, including:

| Capability | Expected Impact |
|---|---|
| **Automated order tracking and status updates** | Reduce host admin time by an estimated 40–60% per group buy cycle |
| **Tiered pricing logic engine** | Eliminate manual price calculations; ensure consistent, auditable pricing across all buyer tiers |
| **Role-based access and dashboards** | Give hosts and buyers relevant, real-time views without information overload |
| **Automated communication triggers** | Reduce ad-hoc WhatsApp messages; ensure timely, consistent buyer notifications |
| **AI-assisted fairness and profitability balancing** | Explore whether AI can recommend allocation and pricing decisions that optimise for both buyer trust and host profitability |

### Key Research Question
> *Can AI be trained to balance fairness (buyer perspective) vs. profitability (host/farm perspective) in group buy allocation and pricing decisions?*

---

## 3. Scope - Proof of Concept (PoC)

### In Scope
- End-to-end group buy workflow: creation → order collection → fulfilment → close-out
- Tiered pricing logic and automated calculation
- Buyer and host role-based views
- Automated status notifications (order confirmed, minimum met, ready for collection, etc.)
- Integration with existing data sources (Airtable, storefront, WhatsApp)
- Basic AI recommendation layer for allocation/pricing decisions

### Out of Scope (for PoC)
- Full production deployment and scaling
- Payment processing or financial reconciliation
- Multi-farm or multi-vendor extension

---

## 4. System Integration Requirements

The PoC will need to interface with the following existing company systems:

| System | Role in PoC |
|---|---|
| **Airtable** | Primary data store for group buy records, buyer lists, order tracking, and pricing tiers |
| **E-commerce Storefront** | Product listings, buyer-facing order interface, payment capture |
| **WhatsApp (or equivalent messaging tool)** | Automated buyer/host notifications; potential two-way status updates |

### Data Requirements
- This project **will require access to company data**, including historical group buy records, buyer data, pricing structures, and order fulfilment logs from Airtable and the storefront.
- Data privacy and access controls must be scoped appropriately for a PoC environment.

---

## 5. Success Criteria

| Metric | Target |
|---|---|
| Reduction in manual coordination steps per group buy | ≥ 50% |
| Host time saved per group buy cycle | Measurable and documented |
| Buyer-reported satisfaction with communication clarity | Improvement vs. baseline |
| Pricing consistency (zero manual errors in tier calculation) | 100% accuracy in PoC runs |
| AI recommendation acceptance rate (fairness/profitability balance) | To be baselined during PoC |

---

## 6. Stakeholders

| Role | Responsibility |
|---|---|
| Group Buy Hosts | Primary users; validate workflow efficiency and pricing logic |
| End Buyers | Secondary users; validate communication clarity and fairness perception |
| Meod Farm Operations Team | PoC sponsor; owns integration with Airtable and storefront |
| AI/Tech Partner | Builds and iterates on the coordination and recommendation layer |

---

*This document is intended as a living requirements reference for the Meod Farm Group Buy Management AI PoC. It should be reviewed and updated as the project progresses through discovery and build phases.*
