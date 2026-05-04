// fitted. — Static job data (server-safe, no 'use client')
// 30 jobs × 10 fields — used as fallback when Adzuna is unavailable.
// Importable from both server routes and client components.

import type { Job } from './jobs'

const JOBS: Job[] = [

  // ── Marketing / Brand / Comms ────────────────────────────────────────────
  {
    id: 'm1', title: 'Brand Marketing Coordinator', company: 'Reformation',
    location: 'Los Angeles, CA', type: 'Hybrid',
    pay: '$52–58k/yr', payNum: 55000, match: 78,
    logo: 'RF', logoBg: '#e8f0e8', logoColor: '#1a501a',
    tags: ['marketing','brand','campaign management','content calendar','social media','brand strategy'],
    posted: 'Apr 3, 2026', isNew: true,
    url: 'https://www.linkedin.com/jobs/search/?keywords=brand+marketing+coordinator',
    description: 'Own campaign coordination and brand consistency across all channels. You\'ll manage the editorial calendar, brief creative partners, and track performance across email, social, and paid channels. Collaboration with the product and design teams is a daily part of the job. 2+ years marketing experience and strong copywriting skills required.',
    skills: [{name:'campaign management'},{name:'brand strategy'},{name:'content calendar'},{name:'copywriting'},{name:'social media'}],
  },
  {
    id: 'm2', title: 'Social Media Coordinator', company: 'Aritzia',
    location: 'Remote', type: 'Remote',
    pay: '$48–55k/yr', payNum: 51000, match: 72,
    logo: 'Az', logoBg: '#f4f2ed', logoColor: '#3d3d45',
    tags: ['marketing','social media management','content creation','Instagram','TikTok','brand voice'],
    posted: 'Apr 5, 2026', isNew: true,
    url: 'https://www.linkedin.com/jobs/search/?keywords=social+media+coordinator',
    description: 'Manage social presence across Instagram, TikTok, and Pinterest for a premium fashion brand. You\'ll write captions, schedule posts, monitor community engagement, and report on performance weekly. Strong aesthetic sensibility and experience with a brand-voice-driven feed required. Fashion or lifestyle brand background a plus.',
    skills: [{name:'social media management'},{name:'content creation'},{name:'Instagram'},{name:'TikTok'},{name:'brand voice'}],
  },
  {
    id: 'm3', title: 'Marketing & Communications Associate', company: 'Patagonia',
    location: 'Ventura, CA', type: 'Hybrid',
    pay: '$50–60k/yr', payNum: 55000, match: 68,
    logo: 'Pt', logoBg: '#eaeffe', logoColor: '#2d5be3',
    tags: ['marketing','comms','brand storytelling','content strategy','copywriting','email marketing'],
    posted: 'Mar 24, 2026', isNew: false,
    url: 'https://www.linkedin.com/jobs/search/?keywords=marketing+communications+associate',
    description: 'Support brand storytelling, email campaigns, and press outreach. You\'ll write long-form content, help manage agency relationships, and coordinate cross-functional campaigns. Passion for sustainability and outdoor culture expected. 1–3 years in marketing or communications.',
    skills: [{name:'brand storytelling'},{name:'content strategy'},{name:'copywriting'},{name:'email marketing'},{name:'press relations'}],
  },

  // ── Business / Sales / Partnerships ──────────────────────────────────────
  {
    id: 'b1', title: 'Sales Development Representative', company: 'HubSpot',
    location: 'Remote', type: 'Remote',
    pay: '$55–65k/yr + commission', payNum: 60000, match: 71,
    logo: 'HS', logoBg: '#fdf3e3', logoColor: '#b8750a',
    tags: ['sales','business','cold outreach','Salesforce','pipeline management','SaaS'],
    posted: 'Apr 2, 2026', isNew: true,
    url: 'https://www.linkedin.com/jobs/search/?keywords=sales+development+representative',
    description: 'Source and qualify new business leads for an inbound and outbound SDR motion at a leading CRM company. You\'ll prospect via LinkedIn, cold email, and phone, then hand off qualified opportunities to Account Executives. Salesforce and Outreach proficiency expected. Prior SaaS sales experience a plus but not required.',
    skills: [{name:'cold outreach'},{name:'Salesforce'},{name:'pipeline management'},{name:'LinkedIn Sales Navigator'},{name:'SaaS'}],
  },
  {
    id: 'b2', title: 'Business Development Associate', company: 'Stripe',
    location: 'San Francisco, CA', type: 'Hybrid',
    pay: '$65–78k/yr', payNum: 71000, match: 67,
    logo: 'St', logoBg: '#eaeffe', logoColor: '#2d5be3',
    tags: ['sales','business development','partnerships','negotiation','fintech','API'],
    posted: 'Mar 22, 2026', isNew: false,
    url: 'https://www.linkedin.com/jobs/search/?keywords=business+development+associate+stripe',
    description: 'Identify and close new partnership opportunities across e-commerce, marketplace, and platform verticals. You\'ll build relationships with technical and business stakeholders, run demos, and negotiate commercial terms. Comfort with technical products and API discussions is expected.',
    skills: [{name:'business development'},{name:'partnerships'},{name:'negotiation'},{name:'fintech'},{name:'CRM'}],
  },
  {
    id: 'b3', title: 'Account Manager', company: 'Salesforce',
    location: 'New York, NY', type: 'Hybrid',
    pay: '$70–85k/yr + OTE', payNum: 77000, match: 64,
    logo: 'SF', logoBg: '#e8f4fd', logoColor: '#185fa5',
    tags: ['sales','account management','enterprise','Salesforce','CRM','upsell','renewal'],
    posted: 'Mar 29, 2026', isNew: false,
    url: 'https://www.linkedin.com/jobs/search/?keywords=account+manager+salesforce',
    description: 'Manage a book of 40–60 mid-market accounts, owning renewal, expansion, and executive relationships. You\'ll drive adoption, identify upsell opportunities, and quarterback cross-functional teams to resolve issues. 2+ years in SaaS account management required.',
    skills: [{name:'account management'},{name:'Salesforce'},{name:'enterprise sales'},{name:'renewal'},{name:'upsell'}],
  },

  // ── Tech / Operations / Data ──────────────────────────────────────────────
  {
    id: 't1', title: 'Technical Project Coordinator', company: 'Asana',
    location: 'Remote', type: 'Remote',
    pay: '$60–72k/yr', payNum: 66000, match: 75,
    logo: 'As', logoBg: '#ede9fe', logoColor: '#6d28d9',
    tags: ['tech','operations','project management','Asana','Jira','Agile','Scrum','stakeholder management'],
    posted: 'Apr 4, 2026', isNew: true,
    url: 'https://www.linkedin.com/jobs/search/?keywords=technical+project+coordinator',
    description: 'Keep engineering and product sprints on track across a fully remote team. You\'ll facilitate standups, manage the Jira backlog, document decisions, and surface blockers. No coding required but technical curiosity is essential. PMP or Agile certification a plus.',
    skills: [{name:'Jira'},{name:'Agile'},{name:'Scrum'},{name:'stakeholder management'},{name:'project management'}],
  },
  {
    id: 't2', title: 'Data Analyst', company: 'Spotify',
    location: 'New York, NY', type: 'Hybrid',
    pay: '$72–88k/yr', payNum: 80000, match: 69,
    logo: 'Sp', logoBg: '#e6f5ed', logoColor: '#1a501a',
    tags: ['tech','data analysis','SQL','Python','Tableau','A/B testing','analytics'],
    posted: 'Mar 31, 2026', isNew: false,
    url: 'https://www.linkedin.com/jobs/search/?keywords=data+analyst+spotify',
    description: 'Answer business questions about listener behavior, ad performance, and content strategy using SQL, Python, and Tableau. You\'ll work with PMs and engineers to design and analyze A/B tests and build dashboards for weekly business reviews. Proficiency in SQL required; Python preferred.',
    skills: [{name:'SQL'},{name:'Python'},{name:'Tableau'},{name:'A/B testing'},{name:'data analysis'}],
  },
  {
    id: 't3', title: 'Operations Analyst', company: 'DoorDash',
    location: 'Chicago, IL', type: 'Hybrid',
    pay: '$62–76k/yr', payNum: 69000, match: 65,
    logo: 'DD', logoBg: '#fdecea', logoColor: '#a32d2d',
    tags: ['tech','operations','process improvement','SQL','Excel','cross-functional','logistics'],
    posted: 'Mar 20, 2026', isNew: false,
    url: 'https://www.linkedin.com/jobs/search/?keywords=operations+analyst',
    description: 'Identify and drive operational improvements across the Marketplace team. You\'ll pull data, build models in SQL and Excel, write recommendations, and present findings to senior leadership. Hustle, quantitative reasoning, and strong communication are required.',
    skills: [{name:'SQL'},{name:'Excel'},{name:'operations'},{name:'process improvement'},{name:'data analysis'}],
  },

  // ── Creative / Design ─────────────────────────────────────────────────────
  {
    id: 'c1', title: 'Brand Designer', company: 'Notion',
    location: 'Remote', type: 'Remote',
    pay: '$75–90k/yr', payNum: 82000, match: 80,
    logo: 'No', logoBg: '#f4f2ed', logoColor: '#1a1a1f',
    tags: ['design','creative','Figma','brand identity','typography','visual design','motion graphics'],
    posted: 'Apr 6, 2026', isNew: true,
    url: 'https://www.linkedin.com/jobs/search/?keywords=brand+designer+notion',
    description: 'Shape the visual identity of one of the world\'s fastest-growing productivity tools. You\'ll design across marketing campaigns, product surfaces, and brand guidelines. Deep Figma proficiency and a portfolio demonstrating typographic craft are required. Motion graphics experience a strong plus.',
    skills: [{name:'Figma'},{name:'brand identity'},{name:'typography'},{name:'visual design'},{name:'motion graphics'}],
  },
  {
    id: 'c2', title: 'UX/UI Designer', company: 'Airbnb',
    location: 'San Francisco, CA', type: 'Hybrid',
    pay: '$85–105k/yr', payNum: 95000, match: 73,
    logo: 'Ab', logoBg: '#fdecea', logoColor: '#a32d2d',
    tags: ['design','UX','UI','Figma','user research','prototyping','design systems'],
    posted: 'Mar 28, 2026', isNew: false,
    url: 'https://www.linkedin.com/jobs/search/?keywords=ux+ui+designer+airbnb',
    description: 'Design intuitive experiences for hosts and guests across web and mobile. You\'ll run your own user research, prototype solutions, and partner with engineers to ship pixel-perfect interfaces. 3+ years of product design experience and a strong portfolio of shipped work required.',
    skills: [{name:'Figma'},{name:'UX research'},{name:'prototyping'},{name:'design systems'},{name:'mobile design'}],
  },
  {
    id: 'c3', title: 'Graphic Designer', company: 'Glossier',
    location: 'New York, NY', type: 'Hybrid',
    pay: '$58–70k/yr', payNum: 64000, match: 66,
    logo: 'Gl', logoBg: '#fdecea', logoColor: '#c0392b',
    tags: ['design','creative','Figma','Adobe Creative Suite','illustration','packaging','brand'],
    posted: 'Mar 18, 2026', isNew: false,
    url: 'https://www.linkedin.com/jobs/search/?keywords=graphic+designer+glossier',
    description: 'Create campaign assets, packaging mockups, and digital content for a cult beauty brand. Proficiency in Adobe Illustrator, Photoshop, and InDesign required. You\'ll work closely with the creative director and manage multiple deliverables under tight timelines.',
    skills: [{name:'Adobe Illustrator'},{name:'Photoshop'},{name:'InDesign'},{name:'packaging design'},{name:'brand'}],
  },

  // ── Healthcare / Science ──────────────────────────────────────────────────
  {
    id: 'h1', title: 'Clinical Research Coordinator', company: 'Mayo Clinic',
    location: 'Rochester, MN', type: 'On-site',
    pay: '$48–58k/yr', payNum: 53000, match: 76,
    logo: 'MC', logoBg: '#e6f5ed', logoColor: '#1a501a',
    tags: ['healthcare','clinical','clinical trials','REDCap','HIPAA','IRB','patient communication'],
    posted: 'Apr 1, 2026', isNew: true,
    url: 'https://www.linkedin.com/jobs/search/?keywords=clinical+research+coordinator',
    description: 'Coordinate Phase II–III clinical trials across neurology and oncology. You\'ll screen and consent participants, manage REDCap data entry, liaise with IRBs, and track protocol deviations. Prior clinical research experience and GCP certification required.',
    skills: [{name:'clinical trials'},{name:'REDCap'},{name:'HIPAA'},{name:'IRB'},{name:'patient communication'}],
  },
  {
    id: 'h2', title: 'Healthcare Program Manager', company: 'Kaiser Permanente',
    location: 'Oakland, CA', type: 'Hybrid',
    pay: '$72–88k/yr', payNum: 80000, match: 68,
    logo: 'KP', logoBg: '#e6f5ed', logoColor: '#1a7a4a',
    tags: ['healthcare','program management','operations','EMR','EHR','Epic','HIPAA','clinical operations'],
    posted: 'Mar 26, 2026', isNew: false,
    url: 'https://www.linkedin.com/jobs/search/?keywords=healthcare+program+manager',
    description: 'Lead operational improvement projects across primary care and specialty clinics. You\'ll manage multi-site rollouts, facilitate stakeholder workshops, and report KPIs to executive leadership. PMP and Epic EMR experience preferred.',
    skills: [{name:'program management'},{name:'Epic EMR'},{name:'HIPAA'},{name:'clinical operations'},{name:'stakeholder management'}],
  },
  {
    id: 'h3', title: 'Medical Science Liaison', company: 'Pfizer',
    location: 'Remote', type: 'Remote',
    pay: '$95–120k/yr', payNum: 107000, match: 62,
    logo: 'Pf', logoBg: '#eaeffe', logoColor: '#2d5be3',
    tags: ['healthcare','medical','pharma','clinical','KOL','scientific communication','research'],
    posted: 'Mar 14, 2026', isNew: false,
    url: 'https://www.linkedin.com/jobs/search/?keywords=medical+science+liaison',
    description: 'Build and maintain relationships with Key Opinion Leaders across cardiology. You\'ll deliver scientific presentations, respond to unsolicited medical inquiries, and support clinical research. MD, PharmD, or PhD required plus 2+ years MSL experience.',
    skills: [{name:'scientific communication'},{name:'KOL engagement'},{name:'clinical research'},{name:'pharma'},{name:'oncology/cardiology'}],
  },

  // ── Legal / Policy / Government ───────────────────────────────────────────
  {
    id: 'l1', title: 'Paralegal', company: 'Skadden Arps',
    location: 'New York, NY', type: 'Hybrid',
    pay: '$62–72k/yr', payNum: 67000, match: 74,
    logo: 'SA', logoBg: '#fdf3e3', logoColor: '#854f0b',
    tags: ['legal','paralegal','litigation','Westlaw','LexisNexis','contract review','discovery'],
    posted: 'Apr 3, 2026', isNew: true,
    url: 'https://www.linkedin.com/jobs/search/?keywords=paralegal+skadden',
    description: 'Support litigation and M&A teams in one of the world\'s premier law firms. You\'ll draft motions, conduct Westlaw and LexisNexis research, manage discovery production, and maintain deal rooms. Bachelor\'s degree and 1–2 years paralegal experience required. Paralegal certificate preferred.',
    skills: [{name:'Westlaw'},{name:'LexisNexis'},{name:'litigation support'},{name:'contract review'},{name:'discovery management'}],
  },
  {
    id: 'l2', title: 'Compliance Analyst', company: 'Goldman Sachs',
    location: 'New York, NY', type: 'Hybrid',
    pay: '$75–92k/yr', payNum: 83000, match: 67,
    logo: 'GS', logoBg: '#f4f2ed', logoColor: '#1a1a1f',
    tags: ['legal','compliance','regulatory','financial regulation','SEC','policy','risk management'],
    posted: 'Mar 21, 2026', isNew: false,
    url: 'https://www.linkedin.com/jobs/search/?keywords=compliance+analyst+finance',
    description: 'Monitor trading activity and advise on regulatory requirements across equity and fixed income desks. You\'ll review policies, respond to SEC inquiries, and train staff on compliance obligations. JD or compliance certification preferred.',
    skills: [{name:'compliance'},{name:'SEC regulations'},{name:'risk management'},{name:'policy analysis'},{name:'financial regulation'}],
  },
  {
    id: 'l3', title: 'Policy Associate', company: 'Meta',
    location: 'Washington, DC', type: 'Hybrid',
    pay: '$70–85k/yr', payNum: 77000, match: 61,
    logo: 'Mt', logoBg: '#eaeffe', logoColor: '#185fa5',
    tags: ['legal','policy','government affairs','tech policy','lobbying','regulatory affairs','comms'],
    posted: 'Mar 12, 2026', isNew: false,
    url: 'https://www.linkedin.com/jobs/search/?keywords=policy+associate+tech',
    description: 'Support public policy and government affairs work on AI, privacy, and content governance legislation. You\'ll brief policymakers, draft policy memos, and monitor legislative developments. DC work experience or a background in tech policy strongly preferred.',
    skills: [{name:'policy analysis'},{name:'government affairs'},{name:'tech policy'},{name:'legislative research'},{name:'regulatory affairs'}],
  },

  // ── Engineering / Architecture ────────────────────────────────────────────
  {
    id: 'e1', title: 'Structural Engineer', company: 'Arup',
    location: 'New York, NY', type: 'Hybrid',
    pay: '$72–90k/yr', payNum: 81000, match: 73,
    logo: 'Ar', logoBg: '#e8f0e8', logoColor: '#1a501a',
    tags: ['engineering','structural','AutoCAD','Revit','ETABS','building codes','structural analysis'],
    posted: 'Apr 2, 2026', isNew: true,
    url: 'https://www.linkedin.com/jobs/search/?keywords=structural+engineer',
    description: 'Design and analyze structural systems for commercial and mixed-use projects. You\'ll model in ETABS and Revit, produce construction documents, and coordinate with architects and MEP engineers. PE license or progress toward licensure expected. 2–4 years experience.',
    skills: [{name:'Revit'},{name:'ETABS'},{name:'structural analysis'},{name:'AutoCAD'},{name:'building codes'}],
  },
  {
    id: 'e2', title: 'Civil Engineer – Transportation', company: 'AECOM',
    location: 'Los Angeles, CA', type: 'Hybrid',
    pay: '$68–82k/yr', payNum: 75000, match: 66,
    logo: 'AC', logoBg: '#e8f4fd', logoColor: '#185fa5',
    tags: ['engineering','civil','transportation','AutoCAD','MicroStation','traffic analysis','project coordination'],
    posted: 'Mar 25, 2026', isNew: false,
    url: 'https://www.linkedin.com/jobs/search/?keywords=civil+engineer+transportation',
    description: 'Support highway and transit design projects from 30% through construction document phases. You\'ll run traffic impact analyses, coordinate utility relocations, and review contractor submittals. AutoCAD and MicroStation proficiency required. EIT preferred.',
    skills: [{name:'AutoCAD'},{name:'MicroStation'},{name:'traffic analysis'},{name:'civil design'},{name:'project coordination'}],
  },
  {
    id: 'e3', title: 'Project Engineer', company: 'Turner Construction',
    location: 'Chicago, IL', type: 'On-site',
    pay: '$65–80k/yr', payNum: 72000, match: 60,
    logo: 'TC', logoBg: '#fdf3e3', logoColor: '#b8750a',
    tags: ['engineering','construction','project management','RFIs','submittals','Procore','scheduling'],
    posted: 'Mar 16, 2026', isNew: false,
    url: 'https://www.linkedin.com/jobs/search/?keywords=project+engineer+construction',
    description: 'Manage RFIs, submittals, and daily field coordination on a $180M commercial development. You\'ll track schedules in Primavera P6, process change orders, and interface with trade subcontractors. Engineering degree and 1–3 years construction experience required.',
    skills: [{name:'Procore'},{name:'Primavera P6'},{name:'RFI management'},{name:'submittals'},{name:'construction management'}],
  },

  // ── Finance / Accounting ──────────────────────────────────────────────────
  {
    id: 'f1', title: 'Financial Analyst', company: 'JPMorgan Chase',
    location: 'New York, NY', type: 'Hybrid',
    pay: '$72–88k/yr', payNum: 80000, match: 77,
    logo: 'JP', logoBg: '#f4f2ed', logoColor: '#1a1a1f',
    tags: ['finance','financial modeling','Excel','GAAP','FP&A','reporting','variance analysis'],
    posted: 'Apr 1, 2026', isNew: true,
    url: 'https://www.linkedin.com/jobs/search/?keywords=financial+analyst+jpmorgan',
    description: 'Support FP&A for the Consumer & Community Banking division. You\'ll build monthly close models, analyze budget variances, and present findings to CFO-level stakeholders. Advanced Excel and PowerPoint required. CFA progress a plus.',
    skills: [{name:'financial modeling'},{name:'Excel'},{name:'FP&A'},{name:'GAAP'},{name:'variance analysis'}],
  },
  {
    id: 'f2', title: 'Associate – Investment Banking', company: 'Lazard',
    location: 'New York, NY', type: 'On-site',
    pay: '$110–130k/yr', payNum: 120000, match: 65,
    logo: 'Lz', logoBg: '#fdf3e3', logoColor: '#854f0b',
    tags: ['finance','investment banking','M&A','DCF','LBO','financial modeling','pitchbooks','deal execution'],
    posted: 'Mar 20, 2026', isNew: false,
    url: 'https://www.linkedin.com/jobs/search/?keywords=investment+banking+associate',
    description: 'Execute M&A and restructuring advisory mandates across industrials and healthcare. You\'ll build DCF and LBO models, write pitchbooks, and manage client diligence processes. 2–3 years prior IB analyst or PE experience required. MBA preferred.',
    skills: [{name:'DCF modeling'},{name:'LBO'},{name:'M&A'},{name:'pitchbooks'},{name:'deal execution'}],
  },
  {
    id: 'f3', title: 'Senior Accountant', company: 'Deloitte',
    location: 'Chicago, IL', type: 'Hybrid',
    pay: '$68–82k/yr', payNum: 75000, match: 62,
    logo: 'Dl', logoBg: '#eaeffe', logoColor: '#2d5be3',
    tags: ['finance','accounting','audit','GAAP','Excel','financial statements','CPA'],
    posted: 'Mar 17, 2026', isNew: false,
    url: 'https://www.linkedin.com/jobs/search/?keywords=senior+accountant+deloitte',
    description: 'Lead audit fieldwork for mid-market clients across manufacturing and professional services. You\'ll review financial statements, test internal controls, and mentor junior staff. CPA license required. 3–5 years public accounting experience.',
    skills: [{name:'audit'},{name:'GAAP'},{name:'financial statements'},{name:'internal controls'},{name:'CPA'}],
  },

  // ── Human Resources / People Ops ─────────────────────────────────────────
  {
    id: 'hr1', title: 'Talent Acquisition Specialist', company: 'Shopify',
    location: 'Remote', type: 'Remote',
    pay: '$62–76k/yr', payNum: 69000, match: 78,
    logo: 'Sh', logoBg: '#e6f5ed', logoColor: '#1a7a4a',
    tags: ['hr','recruiting','talent acquisition','Greenhouse','LinkedIn Recruiter','sourcing','onboarding'],
    posted: 'Apr 4, 2026', isNew: true,
    url: 'https://www.linkedin.com/jobs/search/?keywords=talent+acquisition+specialist',
    description: 'Own full-cycle recruiting for engineering and product roles across North America. You\'ll source candidates via LinkedIn Recruiter, manage Greenhouse pipelines, and partner with hiring managers to close offers. 2+ years tech recruiting experience required.',
    skills: [{name:'Greenhouse'},{name:'LinkedIn Recruiter'},{name:'sourcing'},{name:'full-cycle recruiting'},{name:'onboarding'}],
  },
  {
    id: 'hr2', title: 'HR Business Partner', company: 'Google',
    location: 'Mountain View, CA', type: 'Hybrid',
    pay: '$95–115k/yr', payNum: 105000, match: 68,
    logo: 'Go', logoBg: '#fdf3e3', logoColor: '#b8750a',
    tags: ['hr','HRBP','people ops','Workday','performance management','employee relations','org design'],
    posted: 'Mar 27, 2026', isNew: false,
    url: 'https://www.linkedin.com/jobs/search/?keywords=hr+business+partner+google',
    description: 'Support 200+ employees across a core engineering org. You\'ll advise managers on performance management, lead org design projects, investigate employee relations matters, and run quarterly talent reviews. 5+ years HRBP experience and Workday proficiency required.',
    skills: [{name:'Workday'},{name:'performance management'},{name:'employee relations'},{name:'org design'},{name:'talent reviews'}],
  },
  {
    id: 'hr3', title: 'People Operations Coordinator', company: 'Duolingo',
    location: 'Pittsburgh, PA', type: 'Hybrid',
    pay: '$50–62k/yr', payNum: 56000, match: 63,
    logo: 'Du', logoBg: '#e6f5ed', logoColor: '#1a501a',
    tags: ['hr','people ops','onboarding','HRIS','BambooHR','employee experience','benefits'],
    posted: 'Mar 19, 2026', isNew: false,
    url: 'https://www.linkedin.com/jobs/search/?keywords=people+operations+coordinator',
    description: 'Support the full employee lifecycle from offer letters to offboarding. You\'ll administer BambooHR, coordinate onboarding logistics, answer benefits questions, and support engagement programs. 1–2 years HR ops or admin experience required.',
    skills: [{name:'BambooHR'},{name:'onboarding'},{name:'HRIS'},{name:'benefits administration'},{name:'employee experience'}],
  },

  // ── Nonprofit / Education / Social Impact ─────────────────────────────────
  {
    id: 'np1', title: 'Program Coordinator', company: 'Teach For America',
    location: 'New York, NY', type: 'Hybrid',
    pay: '$48–58k/yr', payNum: 53000, match: 75,
    logo: 'TF', logoBg: '#fdecea', logoColor: '#a32d2d',
    tags: ['nonprofit','education','program management','community outreach','training','impact measurement'],
    posted: 'Apr 5, 2026', isNew: true,
    url: 'https://www.linkedin.com/jobs/search/?keywords=program+coordinator+nonprofit',
    description: 'Coordinate training and development programs for 150+ corps members in the New York region. You\'ll plan workshops, track outcomes in Salesforce, support site visits, and build community partnerships. Passion for education equity required; teaching experience a plus.',
    skills: [{name:'program coordination'},{name:'Salesforce'},{name:'community outreach'},{name:'training'},{name:'impact measurement'}],
  },
  {
    id: 'np2', title: 'Development Associate', company: 'ACLU',
    location: 'New York, NY', type: 'Hybrid',
    pay: '$52–62k/yr', payNum: 57000, match: 68,
    logo: 'AC', logoBg: '#eaeffe', logoColor: '#185fa5',
    tags: ['nonprofit','fundraising','grant writing','donor relations','major gifts','prospect research'],
    posted: 'Mar 23, 2026', isNew: false,
    url: 'https://www.linkedin.com/jobs/search/?keywords=development+associate+nonprofit',
    description: 'Support major gifts and foundation relations for one of the country\'s leading civil liberties organizations. You\'ll draft grant proposals, manage donor communications, conduct prospect research, and assist with events. 1–2 years nonprofit fundraising experience preferred.',
    skills: [{name:'grant writing'},{name:'donor relations'},{name:'prospect research'},{name:'major gifts'},{name:'Raiser\'s Edge'}],
  },
  {
    id: 'np3', title: 'Community Outreach Manager', company: 'Planned Parenthood',
    location: 'Chicago, IL', type: 'Hybrid',
    pay: '$55–68k/yr', payNum: 61000, match: 63,
    logo: 'PP', logoBg: '#fdecea', logoColor: '#c0392b',
    tags: ['nonprofit','community outreach','advocacy','communications','social media','coalition building'],
    posted: 'Mar 15, 2026', isNew: false,
    url: 'https://www.linkedin.com/jobs/search/?keywords=community+outreach+manager',
    description: 'Build and manage community coalitions to advance reproductive health access in Illinois. You\'ll plan events, manage social media channels, brief elected officials, and train volunteer advocates. Bilingual (Spanish/English) strongly preferred.',
    skills: [{name:'community outreach'},{name:'coalition building'},{name:'advocacy'},{name:'communications'},{name:'social media'}],
  },
]

// ── Field tag index (mirrors adzuna.ts FIELD_TAGS for static scoring) ────────

const FIELD_TAGS: Record<string, string[]> = {
  marketing:   ['marketing','brand','comms','campaign management','content creation','social media','brand strategy','copywriting','brand voice'],
  business:    ['sales','business','partnerships','cold outreach','Salesforce','pipeline management','negotiation'],
  tech:        ['tech','operations','project coordination','SQL','data analysis','Asana','Jira','Python'],
  creative:    ['design','creative','Figma','brand identity','typography','visual design','UX','UI'],
  healthcare:  ['healthcare','clinical','REDCap','patient communication','HIPAA','clinical trials','pharma'],
  legal:       ['legal','policy','Westlaw','LexisNexis','compliance','regulatory affairs','paralegal'],
  engineering: ['engineering','AutoCAD','Revit','structural analysis','project coordination','construction'],
  finance:     ['finance','accounting','financial modeling','Excel','GAAP','FP&A','investment','audit'],
  hr:          ['hr','recruiting','onboarding','Workday','Greenhouse','employee engagement','people ops'],
  nonprofit:   ['nonprofit','education','program coordination','grant writing','community outreach','advocacy'],
}

// ── Exports ───────────────────────────────────────────────────────────────────

export function getAllJobs(): Job[] { return JOBS }

export function getJobsForField(field: string): Job[] {
  const target = FIELD_TAGS[field.toLowerCase()] ?? []
  if (!target.length) return JOBS

  const scored = JOBS.map(job => ({
    job,
    score: job.tags.filter(t =>
      target.some(tt => t.toLowerCase().includes(tt.toLowerCase()) || tt.toLowerCase().includes(t.toLowerCase()))
    ).length,
  }))

  const matched   = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score || b.job.match - a.job.match).map(s => s.job)
  const unmatched = scored.filter(s => s.score === 0).sort((a, b) => b.job.match - a.job.match).map(s => s.job)

  return matched.length >= 4 ? matched : [...matched, ...unmatched.slice(0, 8 - matched.length)]
}

export function getJob(id: string): Job | undefined {
  return JOBS.find(j => j.id === id)
}

export function getSimilarJobs(job: Job, limit = 3): Job[] {
  return JOBS
    .filter(j => j.id !== job.id && j.tags.some(t => job.tags.includes(t)))
    .sort((a, b) => b.match - a.match)
    .slice(0, limit)
}
