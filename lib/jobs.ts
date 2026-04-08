// Job data for fitted.
// Structure matches what the dashboard and job detail pages expect.
// Replace with Indeed API feed when ready.

export interface Skill {
  name: string
  found?: boolean
}

export interface Job {
  id: string
  title: string
  company: string
  location: string
  type: 'Remote' | 'Hybrid' | 'On-site'
  pay: string
  payNum: number        // annual salary in thousands (for sorting/comparison)
  match: number         // 0-100 match score
  logo: string          // 2-3 letter abbreviation
  logoBg: string        // logo background color
  logoColor: string     // logo text color
  tags: string[]
  posted: string
  isNew: boolean
  url: string
  description: string
  skills: Skill[]
}

// ─── JOB DATA BY FIELD ────────────────────────────────────────────────────────

const JOBS: Job[] = [
  // Brand & Marketing
  {
    id: 'im1',
    title: 'Campaign Coordinator',
    company: 'Hearst Corporation',
    location: 'San Francisco, CA',
    type: 'Hybrid',
    pay: '$50–52k/yr',
    payNum: 51,
    match: 71,
    logo: 'HC',
    logoBg: '#f0e8e8',
    logoColor: '#801a1a',
    tags: ['brand', 'marketing'],
    posted: 'Feb 2, 2026',
    isNew: false,
    url: 'https://www.indeed.com',
    description: 'Support brand campaigns and cross-channel marketing at one of the world\'s largest media companies. Coordinate with creative, digital, and editorial teams to execute integrated campaigns across print, digital, and social platforms.',
    skills: [
      { name: 'campaign management' },
      { name: 'cross-channel marketing' },
      { name: 'brand strategy' },
      { name: 'content calendar' },
      { name: 'Salesforce' },
      { name: 'media planning' },
      { name: 'budget tracking' },
    ],
  },
  {
    id: 'im2',
    title: 'Marketing Coordinator',
    company: 'HDR Remodeling',
    location: 'Emeryville, CA',
    type: 'Hybrid',
    pay: '$35–45/hr',
    payNum: 42,
    match: 62,
    logo: 'HD',
    logoBg: '#e8f0e8',
    logoColor: '#1a501a',
    tags: ['marketing'],
    posted: 'Mar 3, 2026',
    isNew: false,
    url: 'https://www.indeed.com',
    description: 'Full-time marketing coordinator role supporting campaign planning and brand consistency across all channels.',
    skills: [
      { name: 'marketing strategy' },
      { name: 'brand consistency' },
      { name: 'social media' },
      { name: 'email marketing' },
      { name: 'analytics' },
    ],
  },
  {
    id: 'im3',
    title: 'Coordinator, Talent Development',
    company: 'Kendo Brands',
    location: 'San Francisco, CA',
    type: 'Hybrid',
    pay: '$33.50–37.25/hr',
    payNum: 35,
    match: 54,
    logo: 'KB',
    logoBg: '#f5ede6',
    logoColor: '#7a3d20',
    tags: ['brand', 'marketing'],
    posted: 'Mar 19, 2026',
    isNew: true,
    url: 'https://www.indeed.com',
    description: 'Kendo Brands (LVMH) is hiring a coordinator to support brand and talent development across their portfolio of beauty brands.',
    skills: [
      { name: 'talent development' },
      { name: 'brand management' },
      { name: 'project coordination' },
      { name: 'stakeholder communication' },
    ],
  },
  {
    id: 'im4',
    title: 'Social Media Coordinator',
    company: 'Reformation',
    location: 'Los Angeles, CA',
    type: 'Hybrid',
    pay: '$48–56k/yr',
    payNum: 52,
    match: 78,
    logo: 'RF',
    logoBg: '#e8f0e8',
    logoColor: '#1a501a',
    tags: ['marketing', 'comms'],
    posted: 'Jan 27, 2026',
    isNew: false,
    url: 'https://www.indeed.com',
    description: 'Own Reformation\'s social media presence end-to-end — content creation, community management, and brand voice across Instagram, TikTok, and Pinterest.',
    skills: [
      { name: 'social media management' },
      { name: 'content creation' },
      { name: 'community management' },
      { name: 'brand voice' },
      { name: 'Instagram' },
      { name: 'TikTok' },
      { name: 'analytics' },
    ],
  },
  {
    id: 'im5',
    title: 'Brand Coordinator',
    company: 'Aritzia',
    location: 'Remote',
    type: 'Remote',
    pay: '$50–60k/yr',
    payNum: 55,
    match: 68,
    logo: 'Az',
    logoBg: '#f4f2ed',
    logoColor: '#3d3d45',
    tags: ['brand'],
    posted: 'Mar 15, 2026',
    isNew: true,
    url: 'https://www.indeed.com',
    description: 'Support brand strategy and visual merchandising coordination for Aritzia\'s growing remote team.',
    skills: [
      { name: 'brand strategy' },
      { name: 'visual merchandising' },
      { name: 'project management' },
      { name: 'cross-functional collaboration' },
    ],
  },
  // Comms
  {
    id: 'ic1',
    title: 'Marketing & Communications Coordinator',
    company: 'Loti AI',
    location: 'San Francisco, CA',
    type: 'Remote',
    pay: 'Part-time · flex',
    payNum: 28,
    match: 52,
    logo: 'LA',
    logoBg: '#eaeffe',
    logoColor: '#2d5be3',
    tags: ['comms', 'marketing'],
    posted: 'Jan 16, 2026',
    isNew: false,
    url: 'https://www.indeed.com',
    description: 'Part-time comms coordinator for an AI startup — writing, social content, and stakeholder communications.',
    skills: [
      { name: 'communications' },
      { name: 'writing' },
      { name: 'social content' },
      { name: 'stakeholder management' },
    ],
  },
  {
    id: 'ic2',
    title: 'Marketing & Communications Associate',
    company: 'Sensei Ag',
    location: 'Austin, TX',
    type: 'Remote',
    pay: '$26.35–38.45/hr',
    payNum: 32,
    match: 69,
    logo: 'SA',
    logoBg: '#e8f0e8',
    logoColor: '#1a501a',
    tags: ['comms', 'marketing'],
    posted: 'Feb 12, 2026',
    isNew: false,
    url: 'https://www.indeed.com',
    description: 'Communications and marketing associate role supporting brand storytelling and content strategy.',
    skills: [
      { name: 'brand storytelling' },
      { name: 'content strategy' },
      { name: 'marketing communications' },
      { name: 'writing' },
    ],
  },
  {
    id: 'ic3',
    title: 'Influencer Marketing Coordinator',
    company: 'Confidential',
    location: 'Remote',
    type: 'Remote',
    pay: '$44–59k/yr',
    payNum: 51,
    match: 73,
    logo: 'IM',
    logoBg: '#fdf0ec',
    logoColor: '#c44520',
    tags: ['marketing'],
    posted: 'Jan 16, 2026',
    isNew: false,
    url: 'https://www.indeed.com',
    description: 'Coordinate influencer relationships, campaign briefs, and performance tracking for a growing consumer brand.',
    skills: [
      { name: 'influencer marketing' },
      { name: 'campaign management' },
      { name: 'performance tracking' },
      { name: 'relationship management' },
      { name: 'briefs' },
    ],
  },
]

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

export function getAllJobs(): Job[] {
  return JOBS
}

export function getJobsForField(field: string): Job[] {
  const f = field.toLowerCase()
  if (f.includes('brand') || f.includes('marketing')) {
    return JOBS.filter(j => j.tags.some(t => ['brand', 'marketing', 'comms'].includes(t)))
  }
  return JOBS
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
