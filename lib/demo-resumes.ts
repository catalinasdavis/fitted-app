// fitted. — Demo Resume Library
// 10 profiles covering major career fields.
// The quiz routes users to one based on their field selection (Q2).
// Q3 (priority) influences how jobs are sorted once they land on the dashboard.
//
// NOTE: No fake jobs are embedded here.
// The regular job feed in lib/jobs.ts handles job display.
// Each demo resume's tags and resumeText drive match scoring naturally.

export interface DemoResume {
  id: string
  name: string           // person's name (shows in sidebar as resume label)
  title: string          // their professional title/track
  field: string          // used for routing and job filtering
  school: string
  gradYear: string
  resumeText: string     // full text — used for keyword match scoring
  tags: string[]         // career tags that match job feed filters
}

// ─── 1. MARKETING, BRAND & COMMUNICATIONS ────────────────────────────────────

export const JAMIE_SOLIS: DemoResume = {
  id: 'demo-marketing',
  name: 'Jamie Solis',
  title: 'Marketing & Communications',
  field: 'marketing',
  school: 'UC San Diego',
  gradYear: '2023',
  tags: ['brand', 'marketing', 'comms'],
  resumeText: `Jamie Solis
San Diego, CA | jamie.solis@email.com | linkedin.com/in/jamiesolis

EDUCATION
B.A. Communication, UC San Diego — 2023
GPA: 3.6 | Dean's List

EXPERIENCE
Social Media & Content Intern — Spark Creative Agency (Summer 2022)
- Managed Instagram and TikTok content calendars for 3 lifestyle brand clients
- Wrote captions, drafted email newsletters, and scheduled posts using Hootsuite
- Helped grow a client's Instagram following by 2,200 in 10 weeks

Brand Ambassador — Anthropologie (Part-time, 2021–2023)
- Represented brand at campus events and pop-up activations
- Maintained visual merchandising standards and trained 4 new team members
- Consistently exceeded personal sales targets by 15–20%

Campus Communications Lead — UCSD Student Affairs (2022–2023)
- Produced weekly newsletter reaching 8,000+ students
- Coordinated social content across Instagram, LinkedIn, and email

SKILLS
Canva, Adobe Photoshop (basic), Hootsuite, Mailchimp, Google Analytics,
copywriting, content calendars, brand voice, customer communication, Instagram, TikTok,
cross-channel marketing, brand strategy, campaign management, content calendar

ACTIVITIES
UCSD Marketing & Advertising Club — VP Communications
Volunteer, San Diego Food Bank — Event Coordinator`,
}

// ─── 2. BUSINESS, SALES & PARTNERSHIPS ───────────────────────────────────────

export const MARCUS_WEBB: DemoResume = {
  id: 'demo-business',
  name: 'Marcus Webb',
  title: 'Business Development & Sales',
  field: 'business',
  school: 'Arizona State University',
  gradYear: '2022',
  tags: ['sales', 'business', 'partnerships'],
  resumeText: `Marcus Webb
Phoenix, AZ | marcus.webb@email.com | linkedin.com/in/marcuswebb

EDUCATION
B.S. Business Administration, Arizona State University — 2022
Concentration: Sales & Marketing | GPA: 3.4

EXPERIENCE
Sales Development Representative Intern — CloudBase Technologies (Summer 2021)
- Conducted 40+ cold outreach sequences weekly via email and LinkedIn
- Qualified 28 leads that converted to discovery calls with account executives
- Built and maintained prospect lists in Salesforce CRM

Management Trainee — Enterprise Rent-A-Car (2022–2023)
- Completed 12-month accelerated management program
- Managed fleet operations, customer accounts, and upsell pipeline
- Ranked #2 in branch for customer satisfaction score (Q3 2023)

President — ASU Entrepreneurship & Sales Club (2021–2022)
- Grew membership from 40 to 120 students in one year
- Organized 6 speaker events with local founders and sales leaders

SKILLS
Salesforce, HubSpot, cold outreach, LinkedIn Sales Navigator, pipeline management,
Excel, client communication, negotiation, objection handling, business development,
partnerships, contract basics, account management, revenue growth`,
}

// ─── 3. TECH & OPERATIONS ─────────────────────────────────────────────────────

export const PRIYA_NAIR: DemoResume = {
  id: 'demo-tech',
  name: 'Priya Nair',
  title: 'Operations & Project Coordination',
  field: 'tech',
  school: 'Georgia Tech',
  gradYear: '2023',
  tags: ['tech', 'operations', 'project management'],
  resumeText: `Priya Nair
Atlanta, GA | priya.nair@email.com | linkedin.com/in/priyanair

EDUCATION
B.S. Information Systems, Georgia Institute of Technology — 2023
GPA: 3.7 | Zell Miller Scholar

EXPERIENCE
Operations & IT Intern — UPS Supply Chain Solutions (Summer 2022)
- Documented and improved 3 internal workflows, reducing processing time by 18%
- Built Excel dashboards tracking shipment KPIs for regional managers
- Supported helpdesk tickets and assisted with software rollout for 50+ users

Operations Assistant — Campus Logistics, Georgia Tech (2022–2023)
- Coordinated room scheduling, vendor orders, and event logistics for 200+ events
- Created process documentation that reduced onboarding time by 30%

Internal Tools Lead — GT Startup Exchange (student org)
- Built Notion workspace and Airtable tracker for 80-member org
- Automated weekly reporting using Zapier, saving 3 hrs/week

SKILLS
SQL (intermediate), Excel (advanced), Python (basic), Asana, Notion, Airtable,
Zapier, process documentation, data analysis, Jira, Tableau, IT support,
project coordination, technical program management, operations analysis`,
}

// ─── 4. CREATIVE & DESIGN ─────────────────────────────────────────────────────

export const RIVER_CASTILLO: DemoResume = {
  id: 'demo-creative',
  name: 'River Castillo',
  title: 'Creative & Visual Design',
  field: 'creative',
  school: 'Rhode Island School of Design',
  gradYear: '2024',
  tags: ['design', 'creative', 'brand'],
  resumeText: `River Castillo
Providence, RI | river@rivercastillo.co | rivercastillo.co

EDUCATION
B.F.A. Graphic Design, Rhode Island School of Design (RISD) — 2024
Thesis: "Brand Identity Systems for Emerging Cultural Institutions"

EXPERIENCE
Brand Identity Intern — Anchor Creative Studio (Spring 2023)
- Designed logos, color systems, and brand guides for 4 small business clients
- Presented concepts directly to clients across 3 revision cycles
- Delivered final brand kits in Figma and exported assets for web, print, and social

Freelance Graphic Designer — Self-employed (2022–present)
- Designed visual identities, social media templates, and pitch decks for 8+ clients
- $12,400 revenue across 14 projects

Design Lead — RISD Student Gallery Committee
- Directed visual identity for annual student exhibition including signage, printed catalog, digital assets
- Coordinated with printers and fabricators to deliver within $3,000 budget

SKILLS
Adobe Illustrator, Adobe Photoshop, Adobe InDesign, Figma, typography,
brand identity, color theory, art direction, mockup design, print production,
social media graphics, visual design, brand guidelines, creative direction`,
}

// ─── 5. HEALTHCARE & SCIENCE ──────────────────────────────────────────────────

export const DANIELLE_PARK: DemoResume = {
  id: 'demo-healthcare',
  name: 'Danielle Park',
  title: 'Healthcare & Life Sciences',
  field: 'healthcare',
  school: 'University of Michigan',
  gradYear: '2023',
  tags: ['healthcare', 'science', 'clinical'],
  resumeText: `Danielle Park
Ann Arbor, MI | danielle.park@email.com | linkedin.com/in/daniellepark

EDUCATION
B.S. Biology, University of Michigan — 2023
GPA: 3.8 | Honors Graduate
Pre-Health Advising Program Participant

EXPERIENCE
Clinical Research Assistant — Michigan Medicine (2022–2023)
- Assisted in Phase II oncology clinical trial with 45+ enrolled participants
- Collected and entered patient data into REDCap; maintained 99.8% accuracy
- Coordinated patient scheduling, consent procedures, and follow-up visits

Pharmacy Technician — CVS Pharmacy (Part-time, 2021–2023)
- Processed 80–100 prescriptions daily; verified insurance and patient records
- Trained 3 new technicians on HIPAA protocols and dispensing procedures

Hospital Volunteer — University of Michigan Health System (2020–2021)
- Assisted nursing staff with patient transport, intake, and comfort care
- Completed 180+ volunteer hours in cardiology and oncology units

SKILLS
REDCap, Epic EMR, medical terminology, HIPAA compliance, patient communication,
lab documentation, phlebotomy, Microsoft Excel, data entry, IRB protocols,
clinical research, life sciences, healthcare operations, pharmacy

CERTIFICATIONS
HIPAA Compliance — Michigan Medicine (2022)
BLS/CPR Certified — American Heart Association (2022)`,
}

// ─── 6. LEGAL, POLICY & GOVERNMENT ───────────────────────────────────────────

export const OWEN_FLETCHER: DemoResume = {
  id: 'demo-legal',
  name: 'Owen Fletcher',
  title: 'Legal & Policy',
  field: 'legal',
  school: 'Georgetown University',
  gradYear: '2023',
  tags: ['legal', 'policy', 'government'],
  resumeText: `Owen Fletcher
Washington, D.C. | owen.fletcher@email.com | linkedin.com/in/owenfletcher

EDUCATION
B.A. Political Science, Georgetown University — 2023
Minor: Legal Studies | GPA: 3.75
Pre-Law Certificate Program

EXPERIENCE
Legal Clinic Intern — Georgetown Law Innocence Project (Spring 2023)
- Conducted case research and summarized appellate records for 6 active cases
- Drafted client intake memos and assisted attorneys with case preparation
- Used Westlaw and LexisNexis for statutory and case law research

Congressional Intern — Office of U.S. Senator (Summer 2022)
- Drafted constituent correspondence on legislative issues (50+ letters/week)
- Attended committee hearings and produced briefing notes for legislative staff
- Researched policy issues and compiled bipartisan precedents for 3 bills

Debate Team Captain — Georgetown University (2021–2023)
- Led team of 14 to regional championship
- Coached 6 novice members in argumentation and research

SKILLS
Legal research, Westlaw, LexisNexis, policy writing, case summarization,
legislative analysis, public speaking, constituent communication, Microsoft Office,
paralegal, compliance, regulatory affairs, government relations`,
}

// ─── 7. ENGINEERING & ARCHITECTURE ───────────────────────────────────────────

export const SOFIA_REYES: DemoResume = {
  id: 'demo-engineering',
  name: 'Sofia Reyes',
  title: 'Engineering & Architecture',
  field: 'engineering',
  school: 'UT Austin',
  gradYear: '2023',
  tags: ['engineering', 'architecture', 'construction'],
  resumeText: `Sofia Reyes
Austin, TX | sofia.reyes@email.com | linkedin.com/in/sofiareyes

EDUCATION
B.S. Civil Engineering, University of Texas at Austin — 2023
GPA: 3.6 | Engineering Honors Program
Coursework: Structural Analysis, Construction Management, Environmental Engineering

EXPERIENCE
Structural Engineering Intern — AECOM (Summer 2022)
- Assisted senior engineers with structural load calculations and drawing reviews
- Used AutoCAD and Revit to update construction documents for 2 bridge projects
- Attended weekly coordination meetings with contractors and project managers

CAD Drafter — Thompson Architecture + Design (Part-time, 2022–2023)
- Created architectural drawings and 3D models for residential projects
- Coordinated with contractors to resolve plan discrepancies

VP — UT Engineering Leadership Council (2022–2023)
- Organized 4 industry networking events with 200+ total attendees
- Managed $8,000 annual budget

SKILLS
AutoCAD, Revit, SketchUp, MATLAB, structural analysis, technical documentation,
project coordination, construction management, site visits, Microsoft Project,
civil engineering, architecture, infrastructure, sustainability, EIT

CERTIFICATIONS
Engineer-in-Training (EIT) — Texas Board of Professional Engineers (2023)`,
}

// ─── 8. FINANCE & ACCOUNTING ──────────────────────────────────────────────────

export const DAVID_KIM: DemoResume = {
  id: 'demo-finance',
  name: 'David Kim',
  title: 'Finance & Accounting',
  field: 'finance',
  school: 'NYU Stern',
  gradYear: '2022',
  tags: ['finance', 'accounting', 'banking'],
  resumeText: `David Kim
New York, NY | david.kim@email.com | linkedin.com/in/davidkim

EDUCATION
B.S. Finance, NYU Stern School of Business — 2022
GPA: 3.5 | Dean's List, 3 semesters
Coursework: Corporate Finance, Financial Modeling, Investment Analysis, Accounting I & II

EXPERIENCE
Investment Banking Summer Analyst — Jefferies (Summer 2021)
- Supported M&A deal team with financial modeling and comparable company analysis
- Built 3-statement financial models for 2 live transactions (TMT sector)
- Collaborated on client pitch materials and due diligence

Accounting Intern — KPMG (Spring 2022)
- Assisted audit team with workpaper documentation for 2 mid-market clients
- Reconciled accounts payable and receivable ledgers using Excel and SAP
- Completed KPMG's internal training on GAAP standards

Treasurer — NYU Finance Society (2021–2022)
- Managed $22,000 annual budget and monthly reporting for 300-member org

SKILLS
Excel (advanced, financial modeling), Bloomberg Terminal, QuickBooks, SAP,
PowerPoint, GAAP, DCF modeling, comparable company analysis, VLOOKUP, pivot tables,
investment banking, private equity, corporate finance, accounting, audit, FP&A

CERTIFICATIONS
Bloomberg Market Concepts (BMC) — 2021
CFA Level I Candidate — 2024`,
}

// ─── 9. HUMAN RESOURCES & PEOPLE OPS ─────────────────────────────────────────

export const AMARA_JOHNSON: DemoResume = {
  id: 'demo-hr',
  name: 'Amara Johnson',
  title: 'Human Resources & People Operations',
  field: 'hr',
  school: 'Michigan State University',
  gradYear: '2023',
  tags: ['hr', 'people ops', 'recruiting'],
  resumeText: `Amara Johnson
East Lansing, MI | amara.johnson@email.com | linkedin.com/in/amarajohnson

EDUCATION
B.S. Psychology with HR Management Concentration, Michigan State University — 2023
GPA: 3.7 | Psi Chi Honor Society

EXPERIENCE
HR Intern — Whirlpool Corporation (Summer 2022)
- Supported talent acquisition team with resume screening, interview scheduling, ATS updates
- Assisted with new hire onboarding: offer letters, I-9 verification, benefits enrollment
- Helped plan 2 employee engagement events for 150+ staff

Peer Mentor Program Coordinator — MSU Office of Student Affairs (2022–2023)
- Matched 60+ students with peer mentors using survey-based compatibility scoring
- Trained 20 mentors on active listening and goal-setting frameworks
- Tracked program outcomes and prepared end-of-year impact report

Campus Wellness Advocate — MSU Health Promotion (2021–2022)
- Led 3 mental health awareness workshops with 40–80 students per session

SKILLS
Workday, Greenhouse ATS, BambooHR, onboarding, benefits administration,
HRIS data entry, employee engagement, DEI awareness, Excel, conflict resolution,
talent acquisition, recruiting, people operations, organizational development

CERTIFICATIONS
SHRM-CP (in progress — 2024)
Mental Health First Aid — National Council (2022)`,
}

// ─── 10. NONPROFIT, EDUCATION & SOCIAL IMPACT ────────────────────────────────

export const THEO_MARTINEZ: DemoResume = {
  id: 'demo-nonprofit',
  name: 'Theo Martinez',
  title: 'Nonprofit & Education',
  field: 'nonprofit',
  school: 'Boston University',
  gradYear: '2023',
  tags: ['nonprofit', 'education', 'social impact'],
  resumeText: `Theo Martinez
Boston, MA | theo.martinez@email.com | linkedin.com/in/theomartinez

EDUCATION
B.A. Sociology with Education Studies Minor, Boston University — 2023
GPA: 3.6 | Community Engagement Scholar

EXPERIENCE
AmeriCorps Member — City Year Boston (2023–present)
- Serve as full-time student success coach at a Boston public middle school
- Provide daily tutoring and mentorship to a caseload of 20 at-risk students
- Track attendance, academic progress, and social-emotional metrics weekly

After-School Program Coordinator — YMCA Greater Boston (2022–2023)
- Designed and delivered weekly STEM and literacy activities for 30 K–8 students
- Hired and supervised 4 program assistants across 2 sites
- Increased program enrollment by 25% through community outreach

Grant Writing Intern — Greater Boston Food Bank (Summer 2022)
- Researched 40+ foundation and government grant opportunities
- Co-wrote 3 grant applications totaling $180,000 in funding requests
- Maintained grant tracking database and compiled compliance reports

SKILLS
Program coordination, community outreach, grant research, grant writing,
volunteer management, impact reporting, Google Workspace, Microsoft Office,
Salesforce Nonprofit, youth development, curriculum design, social impact,
nonprofit management, education, program evaluation

ACTIVITIES
BU Alternative Spring Break — Site Leader, New Orleans 2022
Sociological Research Lab — Undergraduate Researcher`,
}

// ─── ROUTING TABLE: field key → demo resume ───────────────────────────────────

export const DEMO_RESUMES: Record<string, DemoResume> = {
  marketing:   JAMIE_SOLIS,
  business:    MARCUS_WEBB,
  tech:        PRIYA_NAIR,
  creative:    RIVER_CASTILLO,
  healthcare:  DANIELLE_PARK,
  legal:       OWEN_FLETCHER,
  engineering: SOFIA_REYES,
  finance:     DAVID_KIM,
  hr:          AMARA_JOHNSON,
  nonprofit:   THEO_MARTINEZ,
}

export function getDemoResume(field: string): DemoResume {
  return DEMO_RESUMES[field] ?? JAMIE_SOLIS
}

export function getAllDemoFields(): string[] {
  return Object.keys(DEMO_RESUMES)
}
