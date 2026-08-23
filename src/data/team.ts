export type TeamMember = {
  name: string
  role: string
  location: string
  bio: string
  focus: string[]
  portrait: string
}

const sourcePortrait = '/portraits/portrait-source.png'

export const team: TeamMember[] = [
  {
    name: 'Edward Hank',
    role: 'Creative Technologist',
    location: 'London · UK',
    bio: 'Exploring the space between computational graphics, identity and motion.',
    focus: ['WebGL', 'Creative Code', 'Interaction'],
    portrait: sourcePortrait,
  },
  {
    name: 'Marcus Chen',
    role: 'Design Engineer',
    location: 'New York · US',
    bio: 'Building expressive interfaces where typography and realtime graphics meet.',
    focus: ['Product', 'Motion', 'Systems'],
    portrait: sourcePortrait,
  },
  {
    name: 'Théo Laurent',
    role: '3D Artist',
    location: 'Paris · FR',
    bio: 'Working with procedural form, digital materials and image-making systems.',
    focus: ['3D', 'Shaders', 'Art Direction'],
    portrait: sourcePortrait,
  },
  {
    name: 'Priya Anand',
    role: 'Interaction Designer',
    location: 'Singapore · SG',
    bio: 'Designing calm, tactile digital experiences with a strong sense of rhythm.',
    focus: ['UX', 'Prototyping', 'Motion'],
    portrait: sourcePortrait,
  },
  {
    name: 'Samuel Osei',
    role: 'Frontend Developer',
    location: 'Berlin · DE',
    bio: 'Turning ambitious visual concepts into fast, resilient browser experiences.',
    focus: ['React', 'Three.js', 'Performance'],
    portrait: sourcePortrait,
  },
  {
    name: 'Nora Ellis',
    role: 'Visual Designer',
    location: 'Toronto · CA',
    bio: 'Creating identities and digital worlds built around texture, type and movement.',
    focus: ['Identity', 'Editorial', 'Digital'],
    portrait: sourcePortrait,
  },
]
