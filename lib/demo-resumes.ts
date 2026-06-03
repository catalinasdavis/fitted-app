// fitted. — Demo Resume Library
// 10 fields × 2 gender sets = 20 personas.
// getDemoResume(field, gender) dispatches to the right one.
//
// Personas have deliberate imperfections: gaps, title-scope mismatches,
// transferable experience that doesn't yet read as corporate.
// No fake jobs — job feed is handled by lib/jobs.ts.

export interface DemoResume {
  id: string
  name: string
  title: string
  field: string
  school: string
  gradYear: string
  resumeText: string
  tags: string[]
}

// ══════════════════════════════════════════════════════════════════════════════
// FEMALE PERSONAS
// ══════════════════════════════════════════════════════════════════════════════

// ─── 1. MARKETING ─────────────────────────────────────────────────────────────
export const SOFIA_CHEN: DemoResume = {
  id: 'demo-marketing',
  name: 'Sofia Chen',
  title: 'Marketing & Content',
  field: 'marketing',
  school: 'Cal State Long Beach',
  gradYear: '2022',
  tags: ['marketing', 'content', 'brand', 'SEO', 'email'],
  resumeText: `Sofia Chen
Los Angeles, CA | sofia.chen@email.com | linkedin.com/in/sofiac

EDUCATION
B.A. Communication Studies, California State University, Long Beach — 2022
GPA: 3.5 | Dean's List | Women in Marketing Club, VP

EXPERIENCE
Marketing Coordinator — Bloom Skincare (DTC startup) (Jan 2023–present)
- Manage social content calendar across Instagram and TikTok (combined 32k followers)
- Write and schedule biweekly email newsletter to 14,000 subscribers; avg 34% open rate
- Conduct SEO keyword research and rewrite product page copy; organic traffic up 22% in 6 months
- Own influencer gifting program — sourced, briefed, and managed 40+ micro-influencers
- Coordinate with freelance designer and photographer for campaign asset production

Freelance Content Creator — Self-employed (June–Dec 2022)
- Created social media content and email copy for 5 small businesses while job-searching full-time
- Managed client briefs, revision cycles, and final deliverables independently

Brand & Communications Intern — SoCal Media Group (Spring 2022)
- Drafted social copy and blog posts for 3 lifestyle brand accounts
- Assisted with community management and monthly analytics reporting

SKILLS
HubSpot, Mailchimp, Google Analytics, SEMrush (basic), Canva, Notion,
Instagram, TikTok, email marketing, content calendars, SEO copywriting,
brand voice, influencer outreach, campaign coordination, social media strategy`,
}

// ─── 2. BUSINESS ──────────────────────────────────────────────────────────────
export const RACHEL_TORRES: DemoResume = {
  id: 'demo-business',
  name: 'Rachel Torres',
  title: 'Operations & Business Coordination',
  field: 'business',
  school: 'University of New Mexico',
  gradYear: '2016',
  tags: ['operations', 'business', 'management', 'coordination', 'project management'],
  resumeText: `Rachel Torres
Albuquerque, NM | rachel.torres@email.com | linkedin.com/in/rachelmt

EDUCATION
B.A. Health Promotion & Exercise Science, University of New Mexico — 2016

EXPERIENCE
Store Manager — Athleta (Gap Inc.) (2020–2023)
- Managed $1.2M annual inventory, full P&L accountability, and weekly financial reporting
- Hired, trained, and developed team of 14 associates; reduced turnover 30% year-over-year
- Designed shift scheduling system that eliminated $18k/year in overtime costs
- Coordinated with 6 vendors and district team on stock replenishment and seasonal rollouts
- Mentored 3 assistant managers; 2 promoted to store manager within 18 months

Assistant Store Manager — Anthropologie (2018–2020)
- Supervised 8–12 associates across sales, operations, and visual merchandising
- Managed back-office operations: payroll processing, compliance documentation, inventory audits
- Coordinated regional events, floor sets, and cross-store communication

Sales Lead → Keyholder — Lululemon (2016–2018)
- Promoted from sales associate to keyholder within 11 months
- Opened and closed store; handled daily cash reports and escalated issues to management

SKILLS
Team management and development, P&L oversight, inventory control,
vendor coordination, scheduling, process documentation, Excel, Google Sheets,
hiring and onboarding, operational reporting, cross-functional communication,
Asana (basic), customer escalation handling, loss prevention`,
}

// ─── 3. TECH ──────────────────────────────────────────────────────────────────
export const PRIYA_NAIR: DemoResume = {
  id: 'demo-tech',
  name: 'Priya Nair',
  title: 'Operations & Project Coordination',
  field: 'tech',
  school: 'Georgia Tech',
  gradYear: '2023',
  tags: ['tech', 'operations', 'project management', 'data', 'SQL'],
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
- Built Notion workspace and Airtable tracker for 80-member organization
- Automated weekly reporting using Zapier, saving 3 hrs/week

SKILLS
SQL (intermediate), Excel (advanced), Python (basic), Asana, Notion, Airtable,
Zapier, process documentation, data analysis, Jira, Tableau, IT support,
project coordination, technical program management, operations analysis`,
}

// ─── 4. CREATIVE ──────────────────────────────────────────────────────────────
export const RIVER_CASTILLO: DemoResume = {
  id: 'demo-creative',
  name: 'River Castillo',
  title: 'Visual Design & Brand Identity',
  field: 'creative',
  school: 'Rhode Island School of Design',
  gradYear: '2024',
  tags: ['design', 'brand', 'UX', 'Figma', 'creative direction'],
  resumeText: `River Castillo
Providence, RI | river@rivercastillo.co | rivercastillo.co

EDUCATION
B.F.A. Graphic Design, Rhode Island School of Design (RISD) — 2024
Thesis: "Brand Identity Systems for Emerging Cultural Institutions"

EXPERIENCE
Brand Identity Intern — Anchor Creative Studio (Spring 2023)
- Designed logos, color systems, and brand guides for 4 small business clients
- Presented concepts directly to clients through 3 revision cycles
- Delivered final brand kits in Figma; exported assets for web, print, and social

Freelance Graphic Designer — Self-employed (2022–present)
- Visual identities, social media templates, and pitch decks for 8+ clients
- $12,400 revenue across 14 projects

Design Lead — RISD Student Gallery Committee
- Directed visual identity for annual student exhibition: signage, printed catalog, digital
- Coordinated with printers and fabricators within a $3,000 budget

SKILLS
Adobe Illustrator, Photoshop, InDesign, Figma, typography,
brand identity, color theory, art direction, mockup design, print production,
social media graphics, visual design, brand guidelines, creative direction`,
}

// ─── 5. HEALTHCARE ────────────────────────────────────────────────────────────
export const DANIELLE_PARK: DemoResume = {
  id: 'demo-healthcare',
  name: 'Danielle Park',
  title: 'Healthcare & Clinical Research',
  field: 'healthcare',
  school: 'University of Michigan',
  gradYear: '2023',
  tags: ['healthcare', 'clinical', 'research', 'HIPAA', 'patient care'],
  resumeText: `Danielle Park
Ann Arbor, MI | danielle.park@email.com | linkedin.com/in/daniellepark

EDUCATION
B.S. Biology, University of Michigan — 2023
GPA: 3.8 | Honors Graduate | Pre-Health Advising Program

EXPERIENCE
Clinical Research Assistant — Michigan Medicine (2022–2023)
- Assisted in Phase II oncology trial with 45+ enrolled participants
- Collected and entered patient data in REDCap; maintained 99.8% accuracy
- Coordinated scheduling, consent procedures, and follow-up visits

Pharmacy Technician — CVS Pharmacy (Part-time, 2021–2023)
- Processed 80–100 prescriptions daily; verified insurance and patient records
- Trained 3 new technicians on HIPAA protocols and dispensing procedures

Hospital Volunteer — University of Michigan Health System (2020–2021)
- Assisted nursing staff in cardiology and oncology; 180+ hours

SKILLS
REDCap, Epic EMR, medical terminology, HIPAA compliance, patient communication,
lab documentation, phlebotomy, Excel, data entry, IRB protocols,
clinical research, healthcare operations, pharmacy

CERTIFICATIONS
HIPAA Compliance — Michigan Medicine (2022)
BLS/CPR Certified — American Heart Association (2022)`,
}

// ─── 6. LEGAL ─────────────────────────────────────────────────────────────────
export const NADIA_OKONKWO: DemoResume = {
  id: 'demo-legal',
  name: 'Nadia Okonkwo',
  title: 'Legal Research & Policy',
  field: 'legal',
  school: 'Georgetown University',
  gradYear: '2023',
  tags: ['legal', 'policy', 'compliance', 'research', 'government'],
  resumeText: `Nadia Okonkwo
Washington, D.C. | nadia.okonkwo@email.com | linkedin.com/in/nadiaokonkwo

EDUCATION
B.A. Political Science, Georgetown University — 2023
Minor: Legal Studies | GPA: 3.75 | Pre-Law Certificate Program

EXPERIENCE
Legal Clinic Intern — Georgetown Law Innocence Project (Spring 2023)
- Conducted case research and summarized appellate records for 6 active cases
- Drafted client intake memos and assisted attorneys with case preparation
- Used Westlaw and LexisNexis for statutory and case law research

Policy Research Intern — National Women's Law Center (Summer 2022)
- Researched legislative history and court decisions on Title IX enforcement
- Drafted a 12-page policy brief on gender pay equity legislation for senior staff
- Assisted communications team in translating policy research for public-facing materials

Debate Team Captain — Georgetown University (2021–2023)
- Led team of 14 to regional championship; coached 6 novice members

SKILLS
Legal research, Westlaw, LexisNexis, policy writing, case summarization,
legislative analysis, public speaking, constituent communication,
Microsoft Office, paralegal, compliance, regulatory affairs`,
}

// ─── 7. ENGINEERING ───────────────────────────────────────────────────────────
export const SOFIA_REYES: DemoResume = {
  id: 'demo-engineering',
  name: 'Sofia Reyes',
  title: 'Civil Engineering & Architecture',
  field: 'engineering',
  school: 'UT Austin',
  gradYear: '2023',
  tags: ['engineering', 'civil', 'AutoCAD', 'Revit', 'project coordination'],
  resumeText: `Sofia Reyes
Austin, TX | sofia.reyes@email.com | linkedin.com/in/sofiareyes

EDUCATION
B.S. Civil Engineering, University of Texas at Austin — 2023
GPA: 3.6 | Engineering Honors Program

EXPERIENCE
Structural Engineering Intern — AECOM (Summer 2022)
- Assisted senior engineers with structural load calculations and drawing reviews
- Used AutoCAD and Revit to update construction documents for 2 bridge projects
- Attended weekly coordination meetings with contractors and project managers

CAD Drafter — Thompson Architecture + Design (Part-time, 2022–2023)
- Created architectural drawings and 3D models for residential projects
- Coordinated with contractors to resolve plan discrepancies

VP — UT Engineering Leadership Council (2022–2023)
- Organized 4 industry events with 200+ total attendees; managed $8k budget

SKILLS
AutoCAD, Revit, SketchUp, MATLAB, structural analysis, technical documentation,
project coordination, construction management, Microsoft Project,
civil engineering, infrastructure, sustainability

CERTIFICATIONS
Engineer-in-Training (EIT) — Texas Board of Professional Engineers (2023)`,
}

// ─── 8. FINANCE ───────────────────────────────────────────────────────────────
export const CAMILLE_PARK: DemoResume = {
  id: 'demo-finance',
  name: 'Camille Park',
  title: 'Finance & Financial Analysis',
  field: 'finance',
  school: 'NYU Stern',
  gradYear: '2023',
  tags: ['finance', 'accounting', 'financial modeling', 'Excel', 'FP&A'],
  resumeText: `Camille Park
New York, NY | camille.park@email.com | linkedin.com/in/camillepark

EDUCATION
B.S. Finance, NYU Stern School of Business — 2023
GPA: 3.6 | Dean's List | First-generation college graduate
Coursework: Corporate Finance, Financial Modeling, Investment Analysis, Accounting

EXPERIENCE
Financial Analyst Intern — Pfizer Treasury (Summer 2022)
- Built 3-statement financial model and monthly cash flow variance analysis
- Assisted with FX exposure reporting for 4 international subsidiaries
- Prepared weekly cash positioning report for treasury team

Accounting Intern — PwC (Spring 2022, through Sponsors for Educational Opportunity)
- Assisted audit team with workpaper documentation for 2 mid-market clients
- Reconciled accounts payable and receivable ledgers using Excel and SAP
- Completed PwC's internal training on GAAP standards and audit methodology

Finance Club Treasurer — NYU Stern (2022–2023)
- Managed $18,000 annual budget and presented monthly reports to 250-member org

SKILLS
Excel (advanced, financial modeling), Bloomberg Terminal, SAP, QuickBooks,
PowerPoint, GAAP, DCF modeling, 3-statement modeling, variance analysis,
VLOOKUP, pivot tables, corporate finance, FP&A, accounting, audit

CERTIFICATIONS
Bloomberg Market Concepts (BMC) — 2022`,
}

// ─── 9. HR ────────────────────────────────────────────────────────────────────
export const MAYA_WILLIAMS: DemoResume = {
  id: 'demo-hr',
  name: 'Maya Williams',
  title: 'Human Resources & People Operations',
  field: 'hr',
  school: 'Howard University',
  gradYear: '2013',
  tags: ['HR', 'people ops', 'onboarding', 'HRIS', 'talent acquisition'],
  resumeText: `Maya Williams
Baltimore, MD | maya.m.williams@email.com | linkedin.com/in/mayawilliamshr

EDUCATION
B.S. Psychology (Organizational Behavior Concentration), Howard University — 2013

EXPERIENCE
HR Contract Consultant — Independent (2022–2024)
- Supported 3 small businesses with onboarding builds, handbook revisions, and benefits audits
- Redesigned hiring process for a 60-person nonprofit; reduced time-to-hire from 38 to 22 days
- Assisted a healthcare services client with FMLA administration and compliance documentation

Career Break — Parental Leave & Family Caregiving (2020–2022)

HR Generalist — Celerity Technologies (2016–2020)
- Managed full-cycle onboarding for 60–80 new hires/year across 3 offices
- Administered benefits enrollment and served as primary contact for 200+ employees on HR matters
- Processed FMLA, ADA accommodations, and PTO policy questions; maintained 100% compliance record
- Supported talent acquisition: phone screens, offer letter drafting, background check coordination
- Led BambooHR platform rollout for 300-person company; trained 12 managers

HR Coordinator — Celerity Technologies (2014–2016)
- Managed new hire paperwork, I-9 verification, and employee file management
- Ran monthly HR metrics reporting for CHRO

SKILLS
BambooHR, Workday, ADP, onboarding, benefits administration,
HRIS management, employee relations, FMLA and ADA administration,
talent acquisition, compliance, HR policy writing,
Google Workspace, Excel, conflict resolution, people operations

CERTIFICATIONS
SHRM-CP — Society for Human Resource Management (2018)
Mental Health First Aid — National Council (2023, recertified)`,
}

// ─── 10. NONPROFIT ────────────────────────────────────────────────────────────
export const ISABEL_NGUYEN: DemoResume = {
  id: 'demo-nonprofit',
  name: 'Isabel Nguyen',
  title: 'Education & Program Coordination',
  field: 'nonprofit',
  school: 'UCLA',
  gradYear: '2014',
  tags: ['program coordination', 'L&D', 'nonprofit', 'community', 'education'],
  resumeText: `Isabel Nguyen
San Francisco, CA | isabel.nguyen@email.com | linkedin.com/in/isabelnguyen

EDUCATION
B.A. Spanish and Education, UCLA — 2014
Teaching Credential (CLAD), San Francisco State University — 2015

EXPERIENCE
Curriculum Consultant & Facilitator — Self-employed (2022–present)
- Design individualized learning plans and deliver workshops for 8 students and 2 nonprofit clients
- Created a 6-week financial literacy curriculum adopted by a Bay Area community organization
- Facilitate adult learning workshops on communication and goal-setting for a workforce dev org

3rd Grade Lead Teacher — San Francisco Unified School District (2015–2022)
- Led instruction, behavioral support, and social-emotional development for 28–32 students per year
- Designed differentiated curriculum across 5 subjects, aligned to district and state standards
- Managed weekly communication with 28+ families via email, conferences, and progress reports
- Mentored 3 SFUSD teacher residents through structured observation, coaching, and feedback cycles
- Served on School Site Council for 4 years, contributing to budget planning and improvement goals
- Collected, analyzed, and presented quarterly assessment data to admin and teaching team

SKILLS
Curriculum design, workshop facilitation, adult learning, coaching and mentorship,
stakeholder communication, needs assessment, program coordination,
data tracking and reporting, Google Workspace, Notion,
conflict resolution, cross-functional collaboration, project management

LANGUAGES
English (native), Spanish (professional proficiency)`,
}

// ══════════════════════════════════════════════════════════════════════════════
// MALE PERSONAS
// ══════════════════════════════════════════════════════════════════════════════

// ─── 1. MARKETING ─────────────────────────────────────────────────────────────
export const SAMUEL_TORRES: DemoResume = {
  id: 'demo-marketing-m',
  name: 'Samuel Torres',
  title: 'Growth Marketing & Content',
  field: 'marketing',
  school: 'University of Southern California',
  gradYear: '2022',
  tags: ['marketing', 'content', 'growth', 'SEO', 'paid media'],
  resumeText: `Samuel Torres
Los Angeles, CA | sam.torres@email.com | linkedin.com/in/samueljtorres

EDUCATION
B.A. Communication & Marketing, University of Southern California — 2022
GPA: 3.4 | Annenberg School for Communication

EXPERIENCE
Growth Marketing Coordinator — Rivet (B2B SaaS) (Feb 2023–present)
- Manage paid LinkedIn and Google Ads campaigns; $24k monthly budget, 3.1x ROAS
- Write and A/B test email sequences for trial-to-paid funnel (27% lift on best variation)
- Publish 2 SEO blog posts/week; organic traffic grew 38% in 10 months
- Own reporting dashboard in HubSpot; present weekly metrics to marketing director

Freelance Digital Marketer — Self-employed (June–Jan 2022–2023)
- Ran paid social and content for 4 clients (real estate, fitness, consumer goods) while job searching
- Managed $3k–$8k monthly ad budgets; avg 2.4x ROAS across accounts

Marketing Intern — Ogilvy LA (Spring 2022)
- Supported campaigns for 2 CPG clients; drafted copy, assisted with media planning
- Built weekly competitive intelligence reports for account team

SKILLS
HubSpot, Google Ads, LinkedIn Campaign Manager, Meta Ads,
SEMrush, Mailchimp, Google Analytics, content marketing,
paid media, SEO, email marketing, growth marketing, copywriting, A/B testing`,
}

// ─── 2. BUSINESS ──────────────────────────────────────────────────────────────
export const MARCUS_WEBB: DemoResume = {
  id: 'demo-business-m',
  name: 'Marcus Webb',
  title: 'Sales & Business Development',
  field: 'business',
  school: 'University of Maryland',
  gradYear: '2019',
  tags: ['sales', 'business development', 'account management', 'CRM', 'partnerships'],
  resumeText: `Marcus Webb
Washington, D.C. | marcus.webb@email.com | linkedin.com/in/marcuswebb

EDUCATION
B.S. Business Administration, University of Maryland, College Park — 2019
Robert H. Smith School of Business | Concentration: Marketing & Sales

EXPERIENCE
Account Executive — Clearfield Software (B2B SaaS) (2021–present)
- Manage a $1.4M ARR book of business; 118% quota attainment in 2023
- Run full sales cycle from outbound prospecting through contract close for mid-market accounts
- Expanded 6 existing accounts totaling $280k in net-new ARR through upsell/expansion
- Partner with CS team on QBRs; reduced churn in my book from 14% to 8% in 12 months

Business Development Rep — Clearfield Software (2020–2021)
- Sourced and qualified 40+ leads/month via cold outbound, LinkedIn, and events
- Promoted to AE after 14 months as top-performing BDR (131% to quota, Q4 2020)

Sales Associate — Enterprise Rent-A-Car (2019–2020)
- Managed rental fleet logistics, upsell conversations, and customer escalations
- Ranked top 10% nationally in upsell attach rate across first 6 months

SKILLS
Salesforce, HubSpot, Outreach, LinkedIn Sales Navigator, Gong,
full-cycle sales, account management, pipeline management, CRM,
contract negotiation, territory planning, customer success, partnerships`,
}

// ─── 3. TECH ──────────────────────────────────────────────────────────────────
export const ALEX_RIVERA: DemoResume = {
  id: 'demo-tech-m',
  name: 'Alex Rivera',
  title: 'Software Engineering',
  field: 'tech',
  school: 'Boston University',
  gradYear: '2023',
  tags: ['software', 'engineering', 'developer', 'Python', 'React'],
  resumeText: `Alex Rivera
Boston, MA | alex.rivera@email.com | github.com/alexrivera

EDUCATION
B.S. Computer Science, Boston University — 2023
GPA: 3.5 | Hariri Institute Research Fellowship

EXPERIENCE
Software Engineer I — Meridian Health Tech (Jan 2024–present)
- Build and maintain React + TypeScript frontend for a clinical workflow platform (12k active users)
- Wrote Python data pipeline that reduced report generation time from 4 hours to 18 minutes
- Led migration of 3 legacy API endpoints to GraphQL; improved average response time 34%
- Participate in on-call rotation; resolved 8 P1 incidents in first 6 months with <20 min MTTR

Software Engineering Intern — HubSpot (Summer 2022)
- Built internal tooling feature in Java that reduced customer ticket routing time by 22%
- Shipped 2 frontend fixes in React; reviewed by senior engineers and merged to production

Teaching Assistant — BU Computer Science Dept (2022–2023)
- Led weekly lab section for 30+ students in CS 112 (Intro to CS)

SKILLS
Python, JavaScript, TypeScript, React, Node.js, Java, SQL, PostgreSQL,
GraphQL, REST APIs, Git, Docker, AWS (S3, Lambda), Jira,
data pipelines, system design, agile, code review`,
}

// ─── 4. CREATIVE ──────────────────────────────────────────────────────────────
export const OWEN_KIM: DemoResume = {
  id: 'demo-creative-m',
  name: 'Owen Kim',
  title: 'Product Design & UX',
  field: 'creative',
  school: 'Parsons School of Design',
  gradYear: '2023',
  tags: ['design', 'UX', 'product design', 'Figma', 'user research'],
  resumeText: `Owen Kim
New York, NY | owenkim.design@gmail.com | owenkim.co

EDUCATION
B.F.A. Communication Design, Parsons School of Design — 2023
Focus: Digital Product & Interaction Design

EXPERIENCE
Product Design Intern — Carta (FinTech) (Summer 2022)
- Redesigned 3 onboarding flows; usability testing showed 41% reduction in task completion time
- Collaborated with PMs and engineers in a 2-week sprint cycle
- Delivered Figma specs, component library updates, and annotated handoffs to engineering

Freelance UI/UX Designer — Self-employed (2022–present)
- End-to-end design for a mobile wellness app (iOS): research, wireframes, prototype, handoff
- Brand identity and web design for 5 small businesses; $9,800 revenue
- Designed 3 pitch deck presentations used in fundraising rounds totaling $2.1M

Design Systems Intern — Parsons x NYC Department of Education (Spring 2022)
- Built accessible UI components for an internal teacher portal used by 500+ educators

SKILLS
Figma, Adobe Illustrator, Photoshop, Principle, Maze,
UX research, wireframing, prototyping, design systems, accessibility,
typography, color theory, mobile design, web design, user testing`,
}

// ─── 5. HEALTHCARE ────────────────────────────────────────────────────────────
export const JAMES_CHEN: DemoResume = {
  id: 'demo-healthcare-m',
  name: 'James Chen',
  title: 'Healthcare & Clinical Research',
  field: 'healthcare',
  school: 'UCLA',
  gradYear: '2023',
  tags: ['healthcare', 'clinical', 'research', 'HIPAA', 'patient care'],
  resumeText: `James Chen
Los Angeles, CA | james.chen@email.com | linkedin.com/in/jameswchen

EDUCATION
B.S. Neuroscience, UCLA — 2023
GPA: 3.7 | Honors | Pre-Med Advisory Program

EXPERIENCE
Clinical Research Coordinator — Cedar-Sinai Research Institute (2023–present)
- Coordinate Phase III cardiovascular trial with 60+ active participants
- Manage IRB submissions, consent documentation, and adverse event reporting
- Enter and audit data in REDCap; zero data queries since joining

Medical Scribe — ScribeAmerica / UCLA Health (2021–2023)
- Documented physician-patient encounters across emergency medicine and internal medicine
- Produced accurate SOAP notes and medical histories under time pressure (40+ notes/shift)
- Trained 4 new scribes on documentation protocols and EMR workflow

Hospital Volunteer — UCLA Health System (2020–2021)
- Patient transport, family communication liaison, and supply management; 200+ hours

SKILLS
REDCap, Epic EMR, HIPAA compliance, clinical documentation,
IRB protocol, medical terminology, patient communication,
research coordination, phlebotomy (certified), Excel, data entry

CERTIFICATIONS
BLS/CPR — American Heart Association (2022)
HIPAA Privacy & Security — Cedar-Sinai (2023)`,
}

// ─── 6. LEGAL ─────────────────────────────────────────────────────────────────
export const MICHAEL_SANTOS: DemoResume = {
  id: 'demo-legal-m',
  name: 'Michael Santos',
  title: 'Legal Research & Policy',
  field: 'legal',
  school: 'George Washington University',
  gradYear: '2023',
  tags: ['legal', 'policy', 'compliance', 'research', 'government'],
  resumeText: `Michael Santos
Washington, D.C. | michael.santos@email.com | linkedin.com/in/michaelrsantos

EDUCATION
B.A. Political Science & Philosophy, George Washington University — 2023
GPA: 3.7 | Columbian College Honors Program | Pre-Law Track

EXPERIENCE
Legal Research Intern — U.S. Senate Judiciary Committee (Summer 2022)
- Researched statutory and case law for 4 pending legislative initiatives
- Drafted 8 legal memos on topics including antitrust reform and data privacy
- Used Westlaw to compile legislative history and comparative law analysis

Policy Intern — Electronic Privacy Information Center (EPIC) (Spring 2023)
- Analyzed FTC rulemakings and drafted 2 public comment submissions
- Summarized regulatory proceedings in weekly policy briefs for staff attorneys
- Maintained case tracking database for 30+ active regulatory dockets

Moot Court — GWU National Law Center Clinic (2022–2023)
- Competed in 3 regional moot court tournaments; semifinalist in ABA regional

SKILLS
Westlaw, LexisNexis, PACER, legal writing, legislative research,
regulatory analysis, policy memos, case summarization, statutory interpretation,
public speaking, Microsoft Office, compliance, government affairs`,
}

// ─── 7. ENGINEERING ───────────────────────────────────────────────────────────
export const RYAN_COOPER: DemoResume = {
  id: 'demo-engineering-m',
  name: 'Ryan Cooper',
  title: 'Mechanical Engineering',
  field: 'engineering',
  school: 'Purdue University',
  gradYear: '2023',
  tags: ['engineering', 'mechanical', 'AutoCAD', 'SolidWorks', 'manufacturing'],
  resumeText: `Ryan Cooper
Indianapolis, IN | ryan.cooper@email.com | linkedin.com/in/ryancoopereng

EDUCATION
B.S. Mechanical Engineering, Purdue University — 2023
GPA: 3.5 | Dean's List | SAE Formula Team, chassis subteam lead

EXPERIENCE
Mechanical Engineering Intern — Cummins Inc. (Summer 2022)
- Designed tooling fixture for diesel engine assembly line using SolidWorks; reduced setup time 15%
- Ran FEA simulations to validate bracket redesigns; presented findings to senior engineers
- Supported root cause analysis on 3 field failure reports; documented corrective actions

Manufacturing Engineer Co-op — Rolls-Royce (Spring 2022)
- Supported process optimization for turbine blade machining cell
- Updated work instructions and BOMs in SAP; coordinated with QA team on NCR resolutions
- Shadowed 6-sigma black belt on a DMAIC project; contributed to measurement system analysis

SAE Formula Team — Purdue (2020–2023)
- Led chassis subteam of 8; designed and fabricated steel space frame for FSAE competition
- Car placed 12th overall (of 80+ entries) at Michigan 2023

SKILLS
SolidWorks, AutoCAD, CATIA (basic), MATLAB, FEA, GD&T,
manufacturing processes, machining, SAP, Excel, root cause analysis,
project coordination, technical documentation, quality systems (ISO 9001)

CERTIFICATIONS
Engineer-in-Training (EIT) — Indiana (2023)`,
}

// ─── 8. FINANCE ───────────────────────────────────────────────────────────────
export const DAVID_KIM: DemoResume = {
  id: 'demo-finance-m',
  name: 'David Kim',
  title: 'Finance & Investment Analysis',
  field: 'finance',
  school: 'University of Pennsylvania',
  gradYear: '2023',
  tags: ['finance', 'investment', 'financial modeling', 'Excel', 'FP&A'],
  resumeText: `David Kim
New York, NY | david.kim@email.com | linkedin.com/in/davidjkim

EDUCATION
B.S. Economics, University of Pennsylvania (The College) — 2023
GPA: 3.6 | Wharton Minor in Finance | Coursework: Valuation, M&A, Derivatives

EXPERIENCE
Investment Banking Analyst (Summer) — Jefferies (Summer 2022)
- Built LBO and DCF models for 3 consumer deals totaling $2.4B in transaction value
- Prepared CIMs, management presentations, and board materials for 2 live processes
- Participated in client calls and site visits; drafted Q&A responses for roadshow prep

Corporate Finance Intern — Johnson & Johnson (Spring 2022)
- Supported FP&A team with monthly variance analysis and budget vs. actual reporting
- Modeled 5-year revenue projections for consumer segment using regression analysis
- Automated monthly report assembly using Excel macros; saved 4 hrs/month

Wharton Finance Club — VP of Equity Research (2022–2023)
- Led 6-person team in 13F analysis; pitched 3 equities at inter-school competitions

SKILLS
Excel (advanced), PowerPoint, Bloomberg Terminal, Capital IQ, Pitchbook,
DCF, LBO, 3-statement modeling, comparable company analysis,
M&A, FP&A, GAAP, variance analysis, financial reporting, investment research`,
}

// ─── 9. HR ────────────────────────────────────────────────────────────────────
export const CHRIS_MORGAN: DemoResume = {
  id: 'demo-hr-m',
  name: 'Chris Morgan',
  title: 'Human Resources & Talent Acquisition',
  field: 'hr',
  school: 'University of Illinois Urbana-Champaign',
  gradYear: '2018',
  tags: ['HR', 'recruiting', 'talent acquisition', 'HRIS', 'people ops'],
  resumeText: `Chris Morgan
Chicago, IL | chris.morgan@email.com | linkedin.com/in/chrismorgan

EDUCATION
B.S. Psychology (Industrial-Organizational Concentration), University of Illinois — 2018

EXPERIENCE
Senior Recruiter — Grubhub (2022–present)
- Full-cycle recruiting for 80+ engineering, product, and operations roles/year
- Reduced avg time-to-fill from 52 to 34 days through structured interview process redesign
- Built and maintained pipeline of 200+ passive candidates via LinkedIn and sourcing events
- Partner with hiring managers on JD scoping, interview calibration, and offer strategy

Recruiter — Workday (2020–2022)
- Managed 30–40 open requisitions at a time across enterprise software sales and CS teams
- Implemented structured scoring rubrics adopted by 6-person TA team; reduced interview bias feedback by 40%
- Conducted hiring manager training sessions on competency-based interviewing

HR Coordinator — Blue Cross Blue Shield of Illinois (2018–2020)
- Supported onboarding for 100+ new hires/year; owned I-9 compliance and background checks
- Ran monthly new hire orientation and 90-day check-in program for corporate offices

SKILLS
Workday, Greenhouse, Lever, LinkedIn Recruiter, ADP,
full-cycle recruiting, talent acquisition, sourcing, onboarding,
HRIS management, compensation benchmarking, HR compliance,
structured interviewing, offer negotiation, people analytics`,
}

// ─── 10. NONPROFIT ────────────────────────────────────────────────────────────
export const MARCUS_DAVIS: DemoResume = {
  id: 'demo-nonprofit-m',
  name: 'Marcus Davis',
  title: 'Program Coordination & Community Impact',
  field: 'nonprofit',
  school: 'Spelman College (exchange) / Morehouse College',
  gradYear: '2016',
  tags: ['program coordination', 'nonprofit', 'community', 'grants', 'outreach'],
  resumeText: `Marcus Davis
Atlanta, GA | marcus.davis@email.com | linkedin.com/in/marcusdavisatl

EDUCATION
B.A. Sociology & Urban Studies, Morehouse College — 2016
AmeriCorps VISTA Fellow, Atlanta — 2016–2017

EXPERIENCE
Program Manager — Year Up Atlanta (2021–present)
- Manage 3 cohorts/year of 25–30 young adults in workforce development programming
- Oversee curriculum delivery, employer partner coordination, and graduate placement (87% placed rate)
- Manage $380k program budget; write and report on 4 foundation and government grants
- Supervise 2 program coordinators and 1 AmeriCorps member

Program Coordinator — United Way of Greater Atlanta (2018–2021)
- Coordinated grant disbursement for 22 community partner agencies ($1.8M portfolio)
- Designed and ran quarterly learning community sessions for 60+ nonprofit partners
- Reported program outcomes to 5 major funders including Coca-Cola Foundation and City of Atlanta

AmeriCorps VISTA — Atlanta Neighborhood Development Partnership (2016–2018)
- Managed volunteer recruitment, training, and scheduling for affordable housing initiative
- Built resident needs assessment database; findings shaped $200k in new programming

SKILLS
Grant writing and reporting, program management, curriculum design,
community outreach, stakeholder communication, Salesforce, Excel,
volunteer management, nonprofit compliance, workforce development,
coalition building, adult education, data collection and reporting`,
}

// ══════════════════════════════════════════════════════════════════════════════
// ROUTING TABLES & DISPATCHER
// ══════════════════════════════════════════════════════════════════════════════

export const DEMO_RESUMES_FEMALE: Record<string, DemoResume> = {
  marketing:   SOFIA_CHEN,
  business:    RACHEL_TORRES,
  tech:        PRIYA_NAIR,
  creative:    RIVER_CASTILLO,
  healthcare:  DANIELLE_PARK,
  legal:       NADIA_OKONKWO,
  engineering: SOFIA_REYES,
  finance:     CAMILLE_PARK,
  hr:          MAYA_WILLIAMS,
  nonprofit:   ISABEL_NGUYEN,
}

export const DEMO_RESUMES_MALE: Record<string, DemoResume> = {
  marketing:   SAMUEL_TORRES,
  business:    MARCUS_WEBB,
  tech:        ALEX_RIVERA,
  creative:    OWEN_KIM,
  healthcare:  JAMES_CHEN,
  legal:       MICHAEL_SANTOS,
  engineering: RYAN_COOPER,
  finance:     DAVID_KIM,
  hr:          CHRIS_MORGAN,
  nonprofit:   MARCUS_DAVIS,
}

// Legacy single-map kept for any code that imports it directly
export const DEMO_RESUMES: Record<string, DemoResume> = DEMO_RESUMES_FEMALE

export function getDemoResume(field: string, gender?: string): DemoResume {
  const map = gender === 'man' ? DEMO_RESUMES_MALE : DEMO_RESUMES_FEMALE
  return map[field] ?? SOFIA_CHEN
}

export function getAllDemoFields(): string[] {
  return Object.keys(DEMO_RESUMES_FEMALE)
}
