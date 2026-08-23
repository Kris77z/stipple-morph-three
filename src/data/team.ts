export type TeamMember = {
  name: string
  role: string
  number: string
  bio: string
  focus: string[]
  portrait: string
}

export const team: TeamMember[] = [
  {
    name: 'Kriswillwin',
    role: 'Product Manager',
    number: '(001)',
    bio: 'Build your own shit mountain',
    focus: ['Product Strategy', 'Roadmapping', 'User Research', 'Analytics', 'Delivery'],
    portrait: '/portraits/kriswillwin.png',
  },
  {
    name: 'Edward Hank',
    role: 'Creative Director',
    number: '(002)',
    bio: 'Shapes brand identity through bold visual direction.',
    focus: ['Moodboarding', 'Typography', 'Visual identity', 'Rebranding', 'Art Direction'],
    portrait: '/portraits/01.jpg',
  },
  {
    name: 'Marcus Chen',
    role: 'Head Of Sales',
    number: '(003)',
    bio: 'Turns client relationships into lasting partnerships.',
    focus: ['Negotiation', 'Client Relations', 'Market Research', 'Pitch Decks', 'CRM Strategy'],
    portrait: '/portraits/02.jpg',
  },
  {
    name: 'Julian Cross',
    role: 'Lead Product Designer',
    number: '(004)',
    bio: 'Designs experiences people actually enjoy using.',
    focus: ['UI/UX Design', 'Prototyping', 'User Research', 'Wireframing', 'Design Systems'],
    portrait: '/portraits/03.jpg',
  },
  {
    name: 'Théo Laurent',
    role: 'Motion Designer',
    number: '(005)',
    bio: 'Brings brands to life through motion and story.',
    focus: ['Motion Graphics', 'After Effects', 'Storyboarding', '3D Animation', 'Video Editing'],
    portrait: '/portraits/04.jpeg',
  },
  {
    name: 'Priya Anand',
    role: 'Front-End Developer',
    number: '(006)',
    bio: 'Builds fast, pixel-perfect web experiences.',
    focus: ['React', 'Framer', 'CSS Animation', 'Responsive Design', 'Performance Optimization'],
    portrait: '/portraits/05.jpg',
  },
  {
    name: 'Samuel Osei',
    role: 'Strategy Consultant',
    number: '(007)',
    bio: 'Sharpens brand positioning in crowded markets.',
    focus: ['Market Positioning', 'Brand Strategy', 'Copywriting', 'Competitive Analysis', 'Storytelling'],
    portrait: '/portraits/06.jpg',
  },
]
