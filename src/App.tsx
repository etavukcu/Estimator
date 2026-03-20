import React, { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Home,
  ChefHat,
  Bath,
  Building2,
  ArrowRight,
  ArrowLeft,
  Download,
  Mail,
  Phone,
  User,
  CheckCircle2,
  CalendarClock,
  MapPin,
  Loader2,
  X,
} from 'lucide-react'
import jsPDF from 'jspdf'
import logo from './assets/peaceful-haven-logo.svg'
import { insertConsultationRequest } from './lib/supabaseClient'

type TierKey = 'good' | 'better' | 'best'

type Option = {
  value: string
  label: string
  helper?: string
  adj: [number, number]
  tiers?: TierKey[]
}

type Question = {
  id: string
  label: string
  options: Option[]
}

type Section = {
  title: string
  questions: Question[]
}

type Project = {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string; size?: number }>
  description: string
  baseRanges: Record<TierKey, [number, number]>
  sections: Section[]
}

type EstimateSummary = {
  projectType: string
  finishLevel: string
  estimatedRange: string
  selections: Array<{ section: string; question: string; answer: string }>
  preparedFor: string
}

const BRAND = {
  ink: '#1F2A37',
  forest: '#365D87',
  sage: '#74D6CF',
  sand: '#D9E9F8',
  cream: '#F4F7FA',
}

const TIERS: Record<TierKey, { label: string; subtitle: string; description: string; highlight: boolean }> = {
  good: {
    label: 'Good',
    subtitle: 'Smart investment',
    description: 'Value-focused materials with a simpler scope and standard finish selections.',
    highlight: false,
  },
  better: {
    label: 'Better',
    subtitle: 'Most popular',
    description: 'Upgraded finishes, stronger customization, and balanced value.',
    highlight: true,
  },
  best: {
    label: 'Best',
    subtitle: 'Luxury custom',
    description: 'Premium materials, elevated detailing, and top-end craftsmanship.',
    highlight: false,
  },
}

const PROJECTS: Project[] = [
  {
    id: 'kitchen',
    name: 'Kitchen Remodel',
    icon: ChefHat,
    description: 'Size, layout, cabinetry, surfaces, appliances, and kitchen finishes.',
    baseRanges: { good: [0, 0], better: [0, 0], best: [0, 0] },
    sections: [
      {
        title: 'Kitchen Size',
        questions: [
          {
            id: 'size',
            label: 'What is the approximate size of your kitchen?',
            options: [
              { value: 'under_100', label: 'Under 100 sqft', adj: [0, 0] },
              { value: '100_150', label: '100 – 150 sqft', adj: [0, 0] },
              { value: '150_250', label: '150 – 250 sqft', adj: [0, 0] },
              { value: '250_400', label: '250 – 400 sqft', adj: [0, 0] },
              { value: '400_plus', label: '400+ sqft', adj: [0, 0] },
              { value: 'not_sure', label: 'Not sure', adj: [0, 0] },
            ],
          },
        ],
      },
      {
        title: 'Layout',
        questions: [
          {
            id: 'layout',
            label: 'Are you planning to change the layout?',
            options: [
              { value: 'keep', label: 'Keep existing layout', adj: [0, 0] },
              { value: 'minor', label: 'Minor changes (move appliances/plumbing slightly)', adj: [0, 0] },
              { value: 'full', label: 'Full redesign', adj: [0, 0] },
            ],
          },
        ],
      },
      {
        title: 'Cabinets',
        questions: [
          {
            id: 'cabinets',
            label: 'What type of cabinets are you considering?',
            options: [
              { value: 'refinish', label: 'Refinish existing', adj: [0, 0] },
              { value: 'stock', label: 'Stock cabinets', adj: [0, 0] },
              { value: 'semi_custom', label: 'Semi-custom cabinets', adj: [0, 0] },
              { value: 'custom', label: 'Custom cabinets', adj: [0, 0] },
              { value: 'not_sure', label: 'Not sure', adj: [0, 0] },
            ],
          },
        ],
      },
      {
        title: 'Countertops',
        questions: [
          {
            id: 'countertops',
            label: 'What countertop material do you prefer?',
            options: [
              { value: 'laminate', label: 'Laminate', adj: [0, 0] },
              { value: 'quartz', label: 'Quartz', adj: [0, 0] },
              { value: 'granite', label: 'Granite', adj: [0, 0] },
              { value: 'marble', label: 'Marble / premium stone', adj: [0, 0] },
              { value: 'not_sure', label: 'Not sure', adj: [0, 0] },
            ],
          },
        ],
      },
      {
        title: 'Appliances',
        questions: [
          {
            id: 'appliances',
            label: 'What are you planning for appliances?',
            options: [
              { value: 'keep', label: 'Keep existing', adj: [0, 0] },
              { value: 'standard', label: 'Replace with standard appliances', adj: [0, 0] },
              { value: 'premium', label: 'Upgrade to premium appliances', adj: [0, 0] },
              { value: 'luxury', label: 'High-end / luxury appliances', adj: [0, 0] },
              { value: 'not_sure', label: 'Not sure', adj: [0, 0] },
            ],
          },
        ],
      },
      {
        title: 'Flooring',
        questions: [
          {
            id: 'flooring',
            label: 'What flooring will you have in the kitchen?',
            options: [
              { value: 'keep', label: 'Keep existing', adj: [0, 0] },
              { value: 'lvp', label: 'LVP / laminate', adj: [0, 0] },
              { value: 'tile', label: 'Tile', adj: [0, 0] },
              { value: 'hardwood', label: 'Hardwood', adj: [0, 0] },
              { value: 'not_sure', label: 'Not sure', adj: [0, 0] },
            ],
          },
        ],
      },
      {
        title: 'Backsplash',
        questions: [
          {
            id: 'backsplash',
            label: 'What type of backsplash are you considering?',
            options: [
              { value: 'none', label: 'No backsplash', adj: [0, 0] },
              { value: 'standard', label: 'Standard tile backsplash', adj: [0, 0] },
              { value: 'upgraded', label: 'Upgraded / decorative tile', adj: [0, 0] },
              { value: 'full', label: 'Full-height or custom backsplash', adj: [0, 0] },
              { value: 'not_sure', label: 'Not sure', adj: [0, 0] },
            ],
          },
        ],
      },
      {
        title: 'Island',
        questions: [
          {
            id: 'island',
            label: 'Do you want to add or upgrade a kitchen island?',
            options: [
              { value: 'none', label: 'No island', adj: [0, 0] },
              { value: 'keep', label: 'Keep existing island', adj: [0, 0] },
              { value: 'add', label: 'Add a new island', adj: [0, 0] },
              { value: 'upgrade', label: 'Larger or upgraded island', adj: [0, 0] },
              { value: 'not_sure', label: 'Not sure', adj: [0, 0] },
            ],
          },
        ],
      },
      {
        title: 'Lighting',
        questions: [
          {
            id: 'lighting',
            label: 'What type of lighting do you want?',
            options: [
              { value: 'basic', label: 'Basic lighting', adj: [0, 0] },
              { value: 'recessed', label: 'Recessed lighting', adj: [0, 0] },
              { value: 'designer', label: 'Designer / layered lighting', adj: [0, 0] },
              { value: 'not_sure', label: 'Not sure', adj: [0, 0] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'bathroom',
    name: 'Bathroom Remodel',
    icon: Bath,
    description: 'Vanity, tile, shower, tub, fixtures, and layout decisions.',
    baseRanges: { good: [0, 0], better: [0, 0], best: [0, 0] },
    sections: [
      {
        title: 'Bathroom Type',
        questions: [
          {
            id: 'bathroomType',
            label: 'What type of bathroom remodel are you planning?',
            options: [
              { value: 'half_bath', label: 'Half Bath (Powder Room)', adj: [0, 0] },
              { value: 'full_bathroom', label: 'Full Bathroom', adj: [0, 0] },
              { value: 'primary_bathroom', label: 'Primary Bathroom', adj: [0, 0] },
            ],
          },
        ],
      },
      {
        title: 'Bathroom Size',
        questions: [
          {
            id: 'bathroomSize',
            label: 'What is the approximate size of the bathroom?',
            options: [
              { value: 'under_40', label: 'Under 40 sq ft', adj: [0, 0] },
              { value: '40_80', label: '40–80 sq ft', adj: [0, 0] },
              { value: '80_120', label: '80–120 sq ft', adj: [0, 0] },
              { value: '120_plus', label: '120+ sq ft', adj: [0, 0] },
              { value: 'not_sure', label: 'Not sure — estimate for me', adj: [0, 0] },
            ],
          },
        ],
      },
      {
        title: 'Layout / Plumbing',
        questions: [
          {
            id: 'bathLayout',
            label: 'Will plumbing or layout change?',
            options: [
              { value: 'none', label: 'No changes (same layout)', adj: [0, 0] },
              { value: 'minor', label: 'Minor changes', adj: [0, 0] },
              { value: 'major', label: 'Major changes', adj: [0, 0] },
              { value: 'not_sure', label: 'Not sure — estimate for me', adj: [0, 0] },
            ],
          },
        ],
      },
      {
        title: 'Shower / Tub Scope',
        questions: [
          {
            id: 'showerTub',
            label: 'What type of shower or tub work is included?',
            options: [
              { value: 'refresh', label: 'Keep existing / refresh only', adj: [0, 0] },
              { value: 'standard_replacement', label: 'Standard tub or shower replacement', adj: [0, 0] },
              { value: 'walk_in_tiled', label: 'Walk-in tiled shower', adj: [0, 0] },
              { value: 'luxury_custom', label: 'Luxury custom shower', adj: [0, 0] },
              { value: 'not_sure', label: 'Not sure — estimate for me', adj: [0, 0] },
              { value: 'other', label: 'Other / custom setup', adj: [0, 0] },
            ],
          },
        ],
      },
      {
        title: 'Vanity Type',
        questions: [
          {
            id: 'vanity',
            label: 'What type of vanity are you planning?',
            options: [
              { value: 'basic_prefab', label: 'Basic prefab vanity', adj: [0, 0] },
              { value: 'semi_custom', label: 'Semi-custom vanity', adj: [0, 0] },
              { value: 'custom_double', label: 'Custom vanity / double vanity', adj: [0, 0] },
              { value: 'not_sure', label: 'Not sure — estimate for me', adj: [0, 0] },
              { value: 'other', label: 'Other', adj: [0, 0] },
            ],
          },
        ],
      },
      {
        title: 'Tile Coverage',
        questions: [
          {
            id: 'tile',
            label: 'How much tile work is included?',
            options: [
              { value: 'minimal', label: 'Minimal (floor only)', adj: [0, 0] },
              { value: 'standard', label: 'Standard (floor + shower walls)', adj: [0, 0] },
              { value: 'full', label: 'Full (floor + shower + accent areas)', adj: [0, 0] },
              { value: 'luxury', label: 'Luxury detailed tile work', adj: [0, 0] },
              { value: 'not_sure', label: 'Not sure — estimate for me', adj: [0, 0] },
            ],
          },
        ],
      },
      {
        title: 'Finish Level',
        questions: [
          {
            id: 'finishLevel',
            label: 'What best describes the overall finish level?',
            options: [
              { value: 'budget', label: 'Budget / Rental Grade', adj: [0, 0] },
              { value: 'standard', label: 'Standard / Builder Grade', adj: [0, 0] },
              { value: 'mid_range', label: 'Mid-Range Upgrade', adj: [0, 0] },
              { value: 'high_end', label: 'High-End / Luxury', adj: [0, 0] },
              { value: 'not_sure', label: 'Not sure — estimate for me', adj: [0, 0] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'suite',
    name: 'Mother-in-Law Suite',
    icon: Home,
    description: 'Guest suite, ADU-style conversion, or private living quarters.',
    baseRanges: { good: [80000, 140000], better: [140000, 220000], best: [220000, 350000] },
    sections: [
      {
        title: 'Suite Scope',
        questions: [
          {
            id: 'suiteSize',
            label: 'How large will the suite be?',
            options: [
              { value: 'small', label: 'Under 500 sq ft', adj: [0, 0] },
              { value: 'medium', label: '500-800 sq ft', adj: [30000, 60000] },
              { value: 'large', label: '800-1200 sq ft', adj: [80000, 140000] },
            ],
          },
          {
            id: 'suiteKitchen',
            label: 'Should a kitchen be included?',
            options: [
              { value: 'none', label: 'No kitchen', adj: [0, 0] },
              { value: 'kitchenette', label: 'Kitchenette', adj: [15000, 30000], tiers: ['good', 'better'] },
              { value: 'full', label: 'Full kitchen', adj: [40000, 80000], tiers: ['better', 'best'] },
            ],
          },
        ],
      },
      {
        title: 'Features',
        questions: [
          {
            id: 'suiteBath',
            label: 'What bathroom scope should we include?',
            options: [
              { value: 'half', label: 'Half bath', adj: [8000, 15000], tiers: ['good'] },
              { value: 'full', label: 'Full bath', adj: [20000, 35000], tiers: ['good', 'better'] },
              { value: 'luxury', label: 'Luxury bath', adj: [40000, 70000], tiers: ['best'] },
            ],
          },
          {
            id: 'entrance',
            label: 'Do you want a separate entrance?',
            options: [
              { value: 'no', label: 'No', adj: [0, 0] },
              { value: 'yes', label: 'Yes', adj: [5000, 12000] },
            ],
          },
          {
            id: 'hvac',
            label: 'How should HVAC be handled?',
            options: [
              { value: 'extend', label: 'Extend existing', adj: [4000, 8000], tiers: ['good', 'better'] },
              { value: 'separate', label: 'Separate HVAC', adj: [10000, 20000], tiers: ['better', 'best'] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'addition',
    name: 'House Addition',
    icon: Building2,
    description: 'New living area, bedroom suite, or larger structural addition.',
    baseRanges: { good: [150000, 250000], better: [250000, 400000], best: [400000, 700000] },
    sections: [
      {
        title: 'Addition Size',
        questions: [
          {
            id: 'footprint',
            label: 'What size addition are you planning?',
            options: [
              { value: 'small', label: '400-600 sq ft', adj: [0, 0] },
              { value: 'medium', label: '600-1000 sq ft', adj: [80000, 160000] },
              { value: 'large', label: '1000-1500 sq ft', adj: [200000, 350000] },
            ],
          },
          {
            id: 'additionType',
            label: 'What type of addition is it?',
            options: [
              { value: 'bedroom', label: 'Bedroom', adj: [0, 0], tiers: ['good', 'better'] },
              { value: 'living', label: 'Living room', adj: [10000, 25000], tiers: ['good', 'better'] },
              { value: 'bedBath', label: 'Bedroom + bath', adj: [40000, 90000], tiers: ['better', 'best'] },
              { value: 'apartment', label: 'Full apartment', adj: [120000, 250000], tiers: ['best'] },
            ],
          },
        ],
      },
      {
        title: 'Structure',
        questions: [
          {
            id: 'structureType',
            label: 'How complex is the structure?',
            options: [
              { value: 'slab', label: 'Simple slab', adj: [0, 0], tiers: ['good', 'better'] },
              { value: 'crawl', label: 'Crawlspace', adj: [10000, 25000], tiers: ['better'] },
              { value: 'second', label: 'Second story addition', adj: [80000, 200000], tiers: ['best'] },
            ],
          },
        ],
      },
    ],
  },
]

function currency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function rangeToText([low, high]: [number, number]) {
  return `${currency(low)} - ${currency(high)}`
}

function getProject(projectId: string) {
  return PROJECTS.find((p) => p.id === projectId)
}

const kitchenPricing = {
  sizeMap: {
    under_100: 90,
    '100_150': 125,
    '150_250': 200,
    '250_400': 325,
    '400_plus': 450,
    not_sure: 200,
  },
  pricePerSqft: {
    good: [190, 235],
    better: [235, 295],
    best: [295, 365],
  },
  layout: {
    keep: { score: 1, adjustment: 0 },
    minor: { score: 2, adjustment: 5000 },
    full: { score: 3, adjustment: 12000 },
  },
  cabinets: {
    refinish: { score: 1, adjustment: -3000 },
    stock: { score: 1, adjustment: 0 },
    semi_custom: { score: 2, adjustment: 4000 },
    custom: { score: 3, adjustment: 10000 },
    not_sure: { score: 2, adjustment: 2000 },
  },
  countertops: {
    laminate: { score: 1, adjustment: -2000 },
    quartz: { score: 2, adjustment: 1500 },
    granite: { score: 2, adjustment: 2500 },
    marble: { score: 3, adjustment: 6000 },
    not_sure: { score: 2, adjustment: 1500 },
  },
  appliances: {
    keep: { score: 1, adjustment: -4000 },
    standard: { score: 1, adjustment: 0 },
    premium: { score: 2, adjustment: 4000 },
    luxury: { score: 3, adjustment: 9000 },
    not_sure: { score: 2, adjustment: 2000 },
  },
  flooring: {
    keep: { score: 1, adjustment: -2000 },
    lvp: { score: 1, adjustment: 0 },
    tile: { score: 2, adjustment: 2000 },
    hardwood: { score: 3, adjustment: 5000 },
    not_sure: { score: 2, adjustment: 1500 },
  },
  backsplash: {
    none: { score: 1, adjustment: -1000 },
    standard: { score: 1, adjustment: 0 },
    upgraded: { score: 2, adjustment: 1500 },
    full: { score: 3, adjustment: 4000 },
    not_sure: { score: 2, adjustment: 1000 },
  },
  island: {
    none: { score: 1, adjustment: 0 },
    keep: { score: 1, adjustment: 0 },
    add: { score: 2, adjustment: 4000 },
    upgrade: { score: 3, adjustment: 8000 },
    not_sure: { score: 2, adjustment: 3000 },
  },
  lighting: {
    basic: { score: 1, adjustment: 0 },
    recessed: { score: 2, adjustment: 2000 },
    designer: { score: 3, adjustment: 5000 },
    not_sure: { score: 2, adjustment: 1500 },
  },
} as const

const kitchenScoredCategories = ['layout', 'cabinets', 'countertops', 'appliances', 'flooring', 'backsplash', 'island', 'lighting'] as const
type KitchenScoredCategory = (typeof kitchenScoredCategories)[number]

const kitchenSectionIcons: Record<string, string> = {
  Layout: '🧭',
  Cabinets: '🗄️',
  Countertops: '🪨',
  Appliances: '🍳',
  Flooring: '🧱',
  Backsplash: '🧩',
  Island: '🏝️',
  Lighting: '💡',
}

const derivedTierProjectIds = new Set(['kitchen', 'bathroom'])
const bathroomFallbackValues = new Set(['not_sure', 'other'])

function getBathroomPolishedAnswer(questionId: string, value: string, label: string) {
  if (value === 'not_sure') {
    if (questionId === 'tile') return 'Estimated based on typical scope'
    return 'Allowance included (estimated)'
  }
  if (value === 'other') {
    if (questionId === 'showerTub') return 'Custom shower/tub allowance included'
    if (questionId === 'vanity') return 'Custom vanity allowance included'
  }
  return label
}

const bathroomPricing = {
  baseRangeByType: {
    half_bath: [6000, 12000],
    full_bathroom: [12000, 22000],
    primary_bathroom: [20000, 40000],
  },
  sizeMultiplier: {
    under_40: [0.9, 0.9],
    '40_80': [1, 1],
    '80_120': [1.1, 1.1],
    '120_plus': [1.2, 1.2],
    not_sure: [1, 1.1],
  },
  layoutAdjustments: {
    none: [0, 0],
    minor: [2000, 5000],
    major: [6000, 12000],
    not_sure: [2000, 8000],
  },
  showerTubAdjustments: {
    refresh: [0, 0],
    standard_replacement: [2000, 5000],
    walk_in_tiled: [6000, 12000],
    luxury_custom: [12000, 25000],
    not_sure: [4000, 12000],
    other: [12000, 22000],
  },
  vanityAdjustments: {
    basic_prefab: [500, 1500],
    semi_custom: [2000, 5000],
    custom_double: [5000, 12000],
    not_sure: [2000, 5000],
    other: [5000, 10000],
  },
  tileAdjustments: {
    minimal: [1000, 3000],
    standard: [4000, 8000],
    full: [8000, 15000],
    luxury: [15000, 30000],
    not_sure: [4000, 12000],
  },
  finishWeighting: {
    budget: { min: 0.92, max: 0.96, spread: 0.11, weight: 0.25 },
    standard: { min: 0.96, max: 1, spread: 0.13, weight: 0.45 },
    mid_range: { min: 1.01, max: 1.05, spread: 0.15, weight: 0.65 },
    high_end: { min: 1.05, max: 1.1, spread: 0.12, weight: 0.82 },
    not_sure: { min: 0.98, max: 1.04, spread: 0.14, weight: 0.55 },
  },
} as const

function getFilteredOptions(question: Question, tier: string) {
  return (question.options || []).filter((option) => !option.tiers || option.tiers.includes(tier as TierKey))
}

function getAllQuestions(project: Project | undefined, tier: string) {
  if (!project?.sections) return [] as (Question & { sectionTitle: string })[]
  if (!['kitchen', 'bathroom'].includes(project.id) && !tier) return [] as (Question & { sectionTitle: string })[]
  return project.sections.flatMap((section) =>
    section.questions.map((question) => ({
      ...question,
      sectionTitle: section.title,
      options: ['kitchen', 'bathroom'].includes(project.id) ? question.options : getFilteredOptions(question, tier),
    }))
  )
}

function inferKitchenTier(answers: Record<string, string>): TierKey {
  const totalScore = kitchenScoredCategories.reduce((total, category) => {
    const value = answers[category]
    const option = getKitchenCategoryOption(category, value)
    return total + option.score
  }, 0)
  const avgScore = totalScore / kitchenScoredCategories.length
  if (avgScore < 1.5) return 'good'
  if (avgScore < 2.25) return 'better'
  return 'best'
}

function inferBathroomTier(answers: Record<string, string>): TierKey {
  const scoreMap: Record<string, number> = {
    none: 0,
    minor: 1,
    major: 2,
    basic_prefab: 0,
    semi_custom: 1,
    custom_double: 2,
    minimal: 0,
    standard: 1,
    full: 2,
    luxury: 2,
    refresh: 0,
    standard_replacement: 0,
    walk_in_tiled: 1,
    luxury_custom: 2,
    other: 2,
    budget: 0,
    mid_range: 1,
    high_end: 2,
    not_sure: 1,
  }
  const score =
    (scoreMap[answers.bathLayout] ?? 0) +
    (scoreMap[answers.vanity] ?? 0) +
    (scoreMap[answers.tile] ?? 0) +
    (scoreMap[answers.showerTub] ?? 0) +
    (scoreMap[answers.finishLevel] ?? 0)
  if (score <= 2) return 'good'
  if (score <= 6) return 'better'
  return 'best'
}

function roundPresentation(value: number) {
  return Math.round(value / 500) * 500
}

function getKitchenCategoryOption(category: KitchenScoredCategory, value: string | undefined) {
  const bucket = kitchenPricing[category] as Record<string, { score: number; adjustment: number }>
  if (value && bucket[value]) return bucket[value]
  if (bucket.not_sure) return bucket.not_sure
  return bucket.keep
}

function getBathroomAdjustmentValue(
  map: Record<string, readonly [number, number]>,
  key: string | undefined,
  fallback: string
) {
  if (key && map[key]) return map[key]
  return map[fallback]
}

function calculateEstimate(project: Project | undefined, tier: string, answers: Record<string, string>) {
  if (!project) return null
  if (project.id === 'kitchen') {
    const kitchenTier = inferKitchenTier(answers)
    const sizeKey = (answers.size as keyof typeof kitchenPricing.sizeMap) || 'not_sure'
    const sqft = kitchenPricing.sizeMap[sizeKey] || kitchenPricing.sizeMap.not_sure
    const [minPsf, maxPsf] = kitchenPricing.pricePerSqft[kitchenTier]
    const baseLow = sqft * minPsf
    const baseHigh = sqft * maxPsf
    const adjustments = kitchenScoredCategories.reduce((total, category) => {
      const value = answers[category]
      const option = getKitchenCategoryOption(category, value)
      return total + option.adjustment
    }, 0)
    const rawLow = baseLow + adjustments
    const rawHigh = baseHigh + adjustments
    const mid = (rawLow + rawHigh) / 2
    const finalLow = roundPresentation(mid * 0.9)
    const finalHigh = roundPresentation(mid * 1.1)
    const summary: Array<{ section: string; question: string; answer: string }> = []
    for (const question of getAllQuestions(project, kitchenTier)) {
      const value = answers[question.id]
      if (!value) continue
      const option = question.options.find((o) => o.value === value)
      if (!option) continue
      summary.push({ section: question.sectionTitle, question: question.label, answer: option.label })
    }
    return { low: finalLow, high: Math.max(finalHigh, finalLow + 500), summary, inferredTier: kitchenTier }
  }
  if (project.id === 'bathroom') {
    const bathroomType = answers.bathroomType || 'full_bathroom'
    const size = answers.bathroomSize || '40_80'
    const [baseMin, baseMax] = getBathroomAdjustmentValue(bathroomPricing.baseRangeByType, bathroomType, 'full_bathroom')
    const [sizeMinMultiplier, sizeMaxMultiplier] = getBathroomAdjustmentValue(bathroomPricing.sizeMultiplier, size, '40_80')
    let rawMin = baseMin * sizeMinMultiplier
    let rawMax = baseMax * sizeMaxMultiplier

    const [layoutMin, layoutMax] = getBathroomAdjustmentValue(bathroomPricing.layoutAdjustments, answers.bathLayout, 'none')
    const [showerMin, showerMax] = getBathroomAdjustmentValue(bathroomPricing.showerTubAdjustments, answers.showerTub, 'refresh')
    const [vanityMin, vanityMax] = getBathroomAdjustmentValue(bathroomPricing.vanityAdjustments, answers.vanity, 'basic_prefab')
    const [tileMin, tileMax] = getBathroomAdjustmentValue(bathroomPricing.tileAdjustments, answers.tile, 'minimal')
    rawMin += layoutMin + showerMin + vanityMin + tileMin
    rawMax += layoutMax + showerMax + vanityMax + tileMax

    const finishLevel = answers.finishLevel || 'standard'
    const weighting = bathroomPricing.finishWeighting[finishLevel as keyof typeof bathroomPricing.finishWeighting] || bathroomPricing.finishWeighting.standard
    const weightedMin = rawMin * weighting.min
    const weightedMax = rawMax * weighting.max
    const mid = weightedMin + (weightedMax - weightedMin) * weighting.weight

    const confidenceSelections = [answers.bathLayout, answers.showerTub, answers.vanity, answers.tile, answers.finishLevel].filter(Boolean).length
    const fallbackCount = [answers.bathroomSize, answers.bathLayout, answers.showerTub, answers.vanity, answers.tile, answers.finishLevel].filter(
      (value) => value && bathroomFallbackValues.has(value)
    ).length
    const consistencyBoost =
      answers.finishLevel === 'high_end' && (answers.showerTub === 'luxury_custom' || answers.tile === 'luxury')
        ? 0.85
        : answers.finishLevel === 'budget' && answers.showerTub === 'refresh' && answers.tile === 'minimal'
          ? 0.88
          : 1
    const breadth = Math.min((Math.max(weighting.spread - confidenceSelections * 0.005, 0.1) + fallbackCount * 0.008) * consistencyBoost, 0.2)
    const finalLow = Math.max(roundPresentation(mid * (1 - breadth / 2)), 15000)
    const finalHigh = Math.max(roundPresentation(mid * (1 + breadth / 2)), 15500)

    const summary: Array<{ section: string; question: string; answer: string }> = []
    for (const question of getAllQuestions(project, '')) {
      const value = answers[question.id]
      if (!value) continue
      const option = question.options.find((o) => o.value === value)
      if (!option) continue
      summary.push({
        section: question.sectionTitle,
        question: question.label,
        answer: getBathroomPolishedAnswer(question.id, option.value, option.label),
      })
    }
    return { low: finalLow, high: Math.max(finalHigh, finalLow + 500), summary, inferredTier: inferBathroomTier(answers) }
  }
  if (!tier) return null
  const [baseLow, baseHigh] = project.baseRanges[tier as TierKey] || [0, 0]
  let low = baseLow
  let high = baseHigh
  const summary: Array<{ section: string; question: string; answer: string }> = []

  for (const question of getAllQuestions(project, tier)) {
    const value = answers[question.id]
    if (!value) continue
    const option = question.options.find((o) => o.value === value)
    if (!option) continue
    low += option.adj?.[0] || 0
    high += option.adj?.[1] || 0
    summary.push({ section: question.sectionTitle, question: question.label, answer: option.label })
  }

  return { low, high, summary, inferredTier: tier as TierKey }
}

function buildEstimateSummary(project: Project | undefined, tier: string, estimate: ReturnType<typeof calculateEstimate>, leadName: string): EstimateSummary {
  const inferredTier = estimate?.inferredTier || (tier as TierKey)
  return {
    projectType: project?.name || 'Not selected',
    finishLevel: inferredTier ? TIERS[inferredTier].label : 'Not selected',
    estimatedRange: estimate ? rangeToText([estimate.low, estimate.high]) : 'Not available',
    selections: estimate?.summary || [],
    preparedFor: leadName || 'Prospective Client',
  }
}

function runEstimatorSmokeTests() {
  console.assert(rangeToText([1000, 2000]) === '$1,000 - $2,000', 'rangeToText should format a currency range')
  console.assert(getProject('kitchen')?.name === 'Kitchen Remodel', 'getProject should find kitchen project')
  console.assert(inferKitchenTier({ layout: 'keep', cabinets: 'stock', countertops: 'laminate', appliances: 'standard', flooring: 'lvp', backsplash: 'standard', island: 'none', lighting: 'basic' }) === 'good', 'kitchen tier should infer as good for value selections')
  console.assert(inferBathroomTier({ bathLayout: 'none', vanity: 'basic_prefab', tile: 'minimal', showerTub: 'refresh', finishLevel: 'budget' }) === 'good', 'bathroom tier should infer as good for value selections')
  console.assert(inferBathroomTier({ bathLayout: 'not_sure', vanity: 'not_sure', tile: 'not_sure', showerTub: 'not_sure', finishLevel: 'not_sure' }) === 'better', 'bathroom tier should infer as better for not sure selections')
  const bathroomQuestions = getAllQuestions(getProject('bathroom'), '')
  const showerOptions = bathroomQuestions.find((q) => q.id === 'showerTub')?.options.map((o) => o.value) || []
  console.assert(showerOptions.includes('walk_in_tiled'), 'bathroom options should include walk-in tiled shower')
  console.assert(showerOptions.includes('not_sure') && showerOptions.includes('other'), 'bathroom shower options should include fallback choices')
}

runEstimatorSmokeTests()

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'solid' | 'outline' }) {
  const { variant = 'solid', className = '', style, ...rest } = props
  return (
    <button
      {...rest}
      className={`btn ${variant === 'outline' ? 'btn-outline' : 'btn-solid'} ${className}`.trim()}
      style={style}
    />
  )
}

function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`card ${props.className || ''}`.trim()} />
}

function SelectCard({ active, className = '', children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...props}
      className={`select-card ${active ? 'select-card-active' : ''} ${className}`.trim()}
      style={active ? { background: `linear-gradient(135deg, ${BRAND.ink}, ${BRAND.forest})`, color: 'white' } : undefined}
    >
      {children}
    </button>
  )
}

function OptionCards({
  project,
  tier,
  question,
  answers,
  value,
  onChange,
}: {
  project: Project | undefined
  tier: string
  question: Question
  answers: Record<string, string>
  value?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid-two">
      {question.options.map((option) => {
        const active = value === option.value
        const optionEstimate = calculateEstimate(project, tier, { ...answers, [question.id]: option.value })
        return (
          <SelectCard key={option.value} type="button" active={active} onClick={() => onChange(option.value)}>
            <div className="row-between top-gap">
              <div>
                <div className="option-title">{option.label}</div>
                {optionEstimate ? (
                  <div className={`option-helper ${active ? 'option-helper-active' : ''}`}>
                    Estimated range with this choice: {rangeToText([optionEstimate.low, optionEstimate.high])}
                  </div>
                ) : null}
                {option.helper ? <div className={`option-helper ${active ? 'option-helper-active' : ''}`}>{option.helper}</div> : null}
              </div>
              {active ? <CheckCircle2 className="icon-sm" /> : null}
            </div>
          </SelectCard>
        )
      })}
    </div>
  )
}

function SummaryPill({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="summary-pill" style={{ backgroundColor: highlight ? BRAND.sand : '#f5f5f4' }}>
      <div className="summary-label" style={{ color: highlight ? BRAND.forest : '#78716c' }}>{label}</div>
      {highlight ? (
        <div className="summary-value-highlight" style={{ backgroundColor: BRAND.sage, color: BRAND.ink }}>{value}</div>
      ) : (
        <div className="summary-value">{value}</div>
      )}
    </div>
  )
}

export default function App() {
  const [step, setStep] = useState(0)
  const [projectId, setProjectId] = useState('')
  const [tier, setTier] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [lead, setLead] = useState({ fullName: '', email: '', phone: '', notes: '' })
  const [consultationOpen, setConsultationOpen] = useState(false)
  const [consultationForm, setConsultationForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    preferredCallbackTime: '',
    projectAddress: '',
    notes: '',
  })
  const [consultationError, setConsultationError] = useState('')
  const [consultationSuccess, setConsultationSuccess] = useState('')
  const [consultationSubmitting, setConsultationSubmitting] = useState(false)

  const project = useMemo(() => getProject(projectId), [projectId])
  const requiresTierSelection = project ? !['kitchen', 'bathroom'].includes(project.id) : true
  const activeTier = useMemo(() => {
    if (!project) return tier
    if (requiresTierSelection) return tier
    if (project.id === 'bathroom') return inferBathroomTier(answers)
    return inferKitchenTier(answers)
  }, [project, requiresTierSelection, tier, answers])
  const activeQuestions = useMemo(() => getAllQuestions(project, tier), [project, tier])
  const estimate = useMemo(() => calculateEstimate(project, tier, answers), [project, tier, answers])
  const estimateSummary = useMemo(
    () => buildEstimateSummary(project, tier, estimate, lead.fullName.trim()),
    [project, tier, estimate, lead.fullName]
  )
  const stages = ['welcome', 'project', ...(requiresTierSelection ? ['tier'] : []), ...activeQuestions.map((q) => q.id), 'lead', 'results']
  const currentStage = stages[step] || 'welcome'
  const currentQuestion = activeQuestions.find((q) => q.id === currentStage)
  const progress = Math.round((step / Math.max(stages.length - 1, 1)) * 100)
  const hasBathroomFallbackSelection = project?.id === 'bathroom' && Object.values(answers).some((value) => bathroomFallbackValues.has(value))

  function canContinue() {
    if (currentStage === 'welcome') return true
    if (currentStage === 'project') return Boolean(projectId)
    if (currentStage === 'tier') return requiresTierSelection ? Boolean(tier) : true
    if (currentQuestion) return Boolean(answers[currentQuestion.id])
    if (currentStage === 'lead') return Boolean(lead.fullName.trim() && lead.email.trim() && lead.phone.trim())
    return true
  }

  function next() { if (canContinue()) setStep((s) => Math.min(s + 1, stages.length - 1)) }
  function back() { setStep((s) => Math.max(s - 1, 0)) }
  function start() { setStep(1) }

  function resetAnswersForTier(nextTier: string) {
    if (!project) return {}
    const validQuestions = getAllQuestions(project, nextTier)
    const nextAnswers: Record<string, string> = {}
    for (const q of validQuestions) {
      const current = answers[q.id]
      if (q.options.some((o) => o.value === current)) nextAnswers[q.id] = current
    }
    return nextAnswers
  }

  function handleProjectSelect(id: string) {
    setProjectId(id)
    setTier('')
    setAnswers({})
  }

  function handleTierSelect(nextTier: string) {
    setTier(nextTier)
    setAnswers(resetAnswersForTier(nextTier))
  }

  function updateAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function openConsultationModal() {
    setConsultationOpen(true)
    setConsultationError('')
    setConsultationSuccess('')
    setConsultationForm((prev) => ({
      ...prev,
      fullName: prev.fullName || lead.fullName,
      phone: prev.phone || lead.phone,
      email: prev.email || lead.email,
      notes: prev.notes || lead.notes,
    }))
  }

  function closeConsultationModal() {
    setConsultationOpen(false)
    setConsultationError('')
    setConsultationSuccess('')
    setConsultationSubmitting(false)
  }

  async function submitConsultationRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setConsultationError('')
    setConsultationSuccess('')

    const fullName = consultationForm.fullName.trim()
    const phone = consultationForm.phone.trim()
    const email = consultationForm.email.trim()
    if (!fullName || !phone || !email) {
      setConsultationError('Please enter your full name, phone number, and email address.')
      return
    }

    setConsultationSubmitting(true)
    const payload = {
      full_name: fullName,
      phone,
      email,
      preferred_callback_time: consultationForm.preferredCallbackTime.trim() || null,
      project_address: consultationForm.projectAddress.trim() || null,
      notes: consultationForm.notes.trim() || null,
      estimate_summary: estimateSummary,
      created_at: new Date().toISOString(),
    }

    try {
      await insertConsultationRequest(payload)
    } catch (error) {
      setConsultationSubmitting(false)
      setConsultationError(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
      return
    }

    setConsultationSubmitting(false)
    setConsultationSuccess('Thank you. We received your request and will contact you soon to schedule your consultation.')
    setConsultationForm({
      fullName: '',
      phone: '',
      email: '',
      preferredCallbackTime: '',
      projectAddress: '',
      notes: '',
    })
  }

  function downloadPdf() {
    if (!project || !activeTier || !estimate) return
    const pdf = new jsPDF({ unit: 'pt', format: 'letter' })
    const marginX = 48
    let y = 52
    const writeLine = (text: string, size = 11, gap = 18) => {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(size)
      const lines = pdf.splitTextToSize(text, 520)
      pdf.text(lines, marginX, y)
      y += lines.length * gap
    }
    pdf.setFillColor(31, 42, 55)
    pdf.roundedRect(36, 28, 540, 88, 16, 16, 'F')
    pdf.setTextColor(244, 247, 250)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(20)
    pdf.text('Peaceful Haven Homes', marginX, 62)
    pdf.setFontSize(16)
    pdf.text('Project Planning Range Summary', marginX, 88)
    y = 146
    pdf.setTextColor(31, 42, 55)
    writeLine(`Client: ${lead.fullName || 'Prospective Client'}`)
    writeLine(`Email: ${lead.email || 'Not provided'}`)
    writeLine(`Phone: ${lead.phone || 'Not provided'}`)
    writeLine(`Date: ${new Date().toLocaleDateString()}`)
    y += 8
    pdf.setFillColor(217, 233, 248)
    pdf.roundedRect(marginX, y, 520, 106, 14, 14, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(13)
    pdf.text('Project Overview', marginX + 16, y + 22)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    pdf.text(`Project type: ${project.name}`, marginX + 16, y + 42)
    pdf.text(`${derivedTierProjectIds.has(project.id) ? 'Inferred tier' : 'Selected tier'}: ${TIERS[activeTier as TierKey].label}`, marginX + 16, y + 58)
    pdf.text('Phone: 423-777-6849', marginX + 16, y + 74)
    pdf.setTextColor(54, 93, 135)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(14)
    const rangeLines = pdf.splitTextToSize(`Estimated planning range: ${rangeToText([estimate.low, estimate.high])}`, 220)
    pdf.text(rangeLines, 552, y + 40, { align: 'right' })
    y += 130
    pdf.setTextColor(31, 42, 55)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(13)
    pdf.text('Selections', marginX, y)
    y += 20
    estimate.summary.forEach((item) => writeLine(`${item.section} - ${item.answer}`))
    y += 8
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(13)
    pdf.text('Important Note', marginX, y)
    y += 20
    if (project.id === 'bathroom' && hasBathroomFallbackSelection) {
      writeLine('This estimate is based on your bathroom type, layout complexity, fixture selections, and finish level. Where selections were marked as unsure or custom, we used reasonable planning assumptions to keep the estimate realistic. Final pricing may vary once exact materials and scope are confirmed.', 11, 16)
    } else {
      writeLine('This estimate is a planning range based on the selections above. Final pricing depends on field conditions, structural requirements, measurements, permits, engineering, and material availability.', 11, 16)
    }
    if (lead.notes) {
      y += 8
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(13)
      pdf.text('Client Notes', marginX, y)
      y += 20
      writeLine(lead.notes, 11, 16)
    }
    pdf.save(`peaceful-haven-${project.id}-estimate.pdf`)
  }

  const welcome = (
    <div className="layout-two">
      <Card style={{ backgroundColor: 'white' }}>
        <div className="card-pad-lg">
          <div className="feature-chip" style={{ backgroundColor: BRAND.sand, color: BRAND.ink }}>Guided scope-based pricing paths</div>
          <h2 className="hero-title" style={{ color: BRAND.ink }}>Get a planning range for your remodel.</h2>
          <p className="hero-copy">Answer a few guided questions and receive a tailored project range based on your project type and selections.</p>
          <div className="grid-three">
            {['Tailored to your selections', 'Designed around realistic finish levels', 'Download PDF Summary'].map((item) => (
              <div key={item} className="feature-box" style={{ backgroundColor: BRAND.sand, color: BRAND.ink }}>{item}</div>
            ))}
          </div>
          <div className="row-gap wrap-gap top-xl">
            <Button className="text-white" style={{ backgroundColor: BRAND.ink }} onClick={start}>Start My Estimate <ArrowRight className="icon-inline" /></Button>
            <div className="muted" style={{ color: BRAND.forest }}>Takes about 2-4 minutes</div>
          </div>
        </div>
      </Card>
      <Card className="text-white" style={{ background: `linear-gradient(135deg, ${BRAND.ink}, ${BRAND.forest})` }}>
        <div className="card-pad-lg">
          <div className="kicker light">How it works</div>
          <div className="stack-lg top-lg">
            {['Choose your project type', 'Answer guided project questions', 'We infer the project tier', 'Enter contact details', 'Download your PDF summary'].map((item, index) => (
              <div key={item} className="row-gap">
                <div className="step-bubble">{index + 1}</div>
                <div className="light-copy">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )

  const projectStep = (
    <Card>
      <div className="card-pad">
        <div className="section-title" style={{ color: BRAND.ink }}>What type of project are you planning?</div>
        <div className="section-copy">Start with one of the current estimator categories below.</div>
        <div className="grid-four top-lg">
          {PROJECTS.map((item) => {
            const Icon = item.icon
            const active = projectId === item.id
            return (
              <SelectCard key={item.id} type="button" active={active} onClick={() => handleProjectSelect(item.id)} className="project-card">
                <Icon className="icon-lg" />
                <div className="project-title">{item.name}</div>
                <div className={`project-copy ${active ? 'project-copy-active' : ''}`}>{item.description}</div>
              </SelectCard>
            )
          })}
        </div>
      </div>
    </Card>
  )

  const tierStep = (
    <Card>
      <div className="card-pad">
        <div className="section-title" style={{ color: BRAND.ink }}>Choose your finish level</div>
        <div className="section-copy">This controls both the pricing path and which material options are shown next.</div>
        <div className="grid-three top-lg">
          {Object.entries(TIERS).map(([key, value]) => {
            const active = tier === key
            return (
              <SelectCard key={key} type="button" active={active} onClick={() => handleTierSelect(key)} className="tier-card">
                {value.highlight ? <span className="badge" style={{ backgroundColor: BRAND.sage, color: BRAND.ink }}>Most Popular</span> : null}
                <div className="tier-title">{value.label}</div>
                <div className={`tier-subtitle ${active ? 'tier-subtitle-active' : ''}`}>{value.subtitle}</div>
                <p className={`tier-copy ${active ? 'tier-copy-active' : ''}`}>{value.description}</p>
                {project?.baseRanges?.[key as TierKey] ? <div className="range-badge" style={{ backgroundColor: BRAND.sage }}>Starting range: {rangeToText(project.baseRanges[key as TierKey])}</div> : null}
              </SelectCard>
            )
          })}
        </div>
      </div>
    </Card>
  )

  const questionStep = currentQuestion ? (
    <Card>
      <div className="card-pad">
        <div className="kicker" style={{ color: BRAND.forest }}>
          {project?.id === 'kitchen' && kitchenSectionIcons[currentQuestion.sectionTitle] ? `${kitchenSectionIcons[currentQuestion.sectionTitle]} ` : ''}
          {currentQuestion.sectionTitle}
        </div>
        <div className="section-title top-sm" style={{ color: BRAND.ink }}>{currentQuestion.label}</div>
        <div className="section-copy">
          {project?.id === 'kitchen'
            ? 'Select the option that best matches your planned scope.'
            : project?.id === 'bathroom'
              ? 'Choose the option that best reflects your planned bathroom scope.'
              : 'Your selected tier filters the options shown below.'}
        </div>
        {estimate ? (
          <div className="section-copy top-sm" style={{ color: BRAND.forest }}>
            Current estimated range: {rangeToText([estimate.low, estimate.high])}
          </div>
        ) : null}
        <div className="top-lg">
          <OptionCards
            project={project}
            tier={tier}
            question={currentQuestion}
            answers={answers}
            value={answers[currentQuestion.id]}
            onChange={(value) => updateAnswer(currentQuestion.id, value)}
          />
        </div>
      </div>
    </Card>
  ) : null

  const leadStep = (
    <div className="layout-two">
      <Card>
        <div className="card-pad">
          <div className="section-title" style={{ color: BRAND.ink }}>Where should we label your estimate?</div>
          <div className="section-copy">We include this info in your PDF estimate summary.</div>
          <div className="form-stack top-lg">
            <Field label="Full name" icon={<User className="field-icon" />} value={lead.fullName} onChange={(v) => setLead((p) => ({ ...p, fullName: v }))} placeholder="Your full name" />
            <Field label="Email" icon={<Mail className="field-icon" />} value={lead.email} onChange={(v) => setLead((p) => ({ ...p, email: v }))} placeholder="you@example.com" type="email" />
            <Field label="Phone" icon={<Phone className="field-icon" />} value={lead.phone} onChange={(v) => setLead((p) => ({ ...p, phone: v }))} placeholder="(555) 555-5555" />
            <div>
              <label className="label">Anything else you want us to know? (optional)</label>
              <textarea className="textarea" value={lead.notes} onChange={(e) => setLead((p) => ({ ...p, notes: e.target.value }))} placeholder="Tell us about timing, goals, or special requests." />
            </div>
          </div>
        </div>
      </Card>
      <Card className="text-white" style={{ background: `linear-gradient(135deg, ${BRAND.ink}, ${BRAND.forest})` }}>
        <div className="card-pad">
          <div className="kicker light">Estimate preview</div>
          <div className="stack-md top-lg">
            <InfoBlock label="Project" value={project?.name || '-'} />
            <InfoBlock label={project?.id && derivedTierProjectIds.has(project.id) ? 'Inferred tier' : 'Selected tier'} value={activeTier ? TIERS[activeTier as TierKey].label : '-'} pill />
            <InfoBlock label="Current planning range" value={estimate ? rangeToText([estimate.low, estimate.high]) : '-'} range />
          </div>
          <div className="info-box top-xl">When you continue, we'll generate your planning range and downloadable PDF summary.</div>
        </div>
      </Card>
    </div>
  )

  const resultsStep = estimate && project && activeTier ? (
    <div className="layout-two-results">
      <Card>
        <div className="card-pad">
          <div className="kicker" style={{ color: BRAND.forest }}>Your Planning Range</div>
          <div className="range-title" style={{ backgroundColor: BRAND.ink, color: 'white' }}>
            {project.id === 'kitchen'
              ? `Estimated Kitchen Remodel: ${rangeToText([estimate.low, estimate.high])}`
              : project.id === 'bathroom'
                ? `Estimated Bathroom Remodel: ${rangeToText([estimate.low, estimate.high])}`
                : rangeToText([estimate.low, estimate.high])}
          </div>
          <div className="section-copy">
            {project.id === 'kitchen'
              ? 'Based on similar kitchen projects and your selections'
              : project.id === 'bathroom'
                ? 'Based on your bathroom type, layout complexity, fixture selections, and finish level.'
                : 'Based on your selected scope, finish level, and project type.'}
          </div>
          {project.id === 'kitchen' ? <div className="section-copy">Most homeowners spend around {rangeToText([estimate.low, estimate.high])} for a kitchen like this</div> : null}
          <div className="grid-three top-lg">
            <SummaryPill label="Project type" value={project.name} />
            <SummaryPill label={derivedTierProjectIds.has(project.id) ? 'Inferred tier' : 'Selected tier'} value={TIERS[activeTier as TierKey].label} highlight />
            <SummaryPill label="Prepared for" value={lead.fullName || 'Prospective Client'} />
          </div>
          <div className="top-xl">
            <div className="section-subtitle" style={{ color: BRAND.ink }}>Selections summary</div>
            <div className="stack-sm top-md">
              {estimate.summary.map((item, index) => (
                <div key={`${item.section}-${item.answer}-${index}`} className="summary-row">
                  <div className="summary-row-label" style={{ color: BRAND.forest }}>{item.section}</div>
                  <div className="summary-row-value">{item.answer}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="disclaimer top-xl" style={{ borderColor: BRAND.sand, backgroundColor: BRAND.cream, color: BRAND.forest }}>
            {project.id === 'bathroom'
              ? hasBathroomFallbackSelection
                ? 'This estimate is based on your bathroom type, layout complexity, fixture selections, and finish level. Where selections were marked as unsure or custom, we used reasonable planning assumptions to keep the estimate realistic. Final pricing may vary once exact materials and scope are confirmed.'
                : 'This estimate is based on your bathroom type, layout complexity, fixture selections, and finish level. Most projects with similar selections fall within this range, excluding hidden conditions or structural repairs.'
              : 'This estimate is a planning range based on the selections above. Final pricing depends on field conditions, structural requirements, measurements, permits, engineering, and material availability.'}
          </div>
        </div>
      </Card>
      <Card>
        <div className="card-pad">
          <div className="kicker" style={{ color: BRAND.forest }}>Next step</div>
          <div className="section-subtitle top-sm" style={{ color: BRAND.ink }}>Save your summary and move toward a real proposal.</div>
          <p className="section-copy top-sm">Your result is intended to help set expectations and start the conversation. The next step is a consultation, site review, and detailed scope discussion.</p>
          <div className="form-stack top-xl">
            <Button className="full text-white" style={{ backgroundColor: BRAND.ink }} onClick={downloadPdf}><Download className="icon-inline" /> Download PDF</Button>
            <Button variant="outline" className="full" onClick={openConsultationModal}>Schedule Consultation</Button>
            <Button variant="outline" className="full" onClick={() => { window.location.href = 'mailto:info@peacefulhavenhomes.com' }}>
              <Mail className="icon-inline" /> Email Us
            </Button>
            <Button variant="outline" className="full" onClick={() => { window.location.href = 'tel:+14237776849' }}>
              <Phone className="icon-inline" /> Call Us
            </Button>
          </div>
        </div>
      </Card>
    </div>
  ) : null

  let stepContent: React.ReactNode = welcome
  if (currentStage === 'project') stepContent = projectStep
  else if (currentStage === 'tier') stepContent = tierStep
  else if (currentStage === 'lead') stepContent = leadStep
  else if (currentStage === 'results') stepContent = resultsStep
  else if (currentQuestion) stepContent = questionStep

  return (
    <div className="page" style={{ backgroundColor: BRAND.cream }}>
      <div className="container">
        <div className="header-row">
          <div className="brand-wrap">
            <img src={logo} alt="Peaceful Haven Homes logo" className="brand-logo" />
            <div>
              <div className="brand-kicker" style={{ color: BRAND.forest }}>Peaceful Haven Homes</div>
              <h1 className="app-title" style={{ color: BRAND.ink }}>Project Range Estimator</h1>
            </div>
          </div>
          <div className="header-contact-wrap">
            <a className="header-contact" style={{ color: BRAND.forest }} href="tel:+14237776849" aria-label="Call Peaceful Haven Homes at 423-777-6849">
              <Phone className="icon-inline" />
              423-777-6849
            </a>
          </div>
        </div>

        {step > 0 ? (
          <Card className="progress-card">
            <div className="card-pad-sm">
              <div className="progress-row">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%`, backgroundColor: BRAND.ink }} /></div>
            </div>
          </Card>
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div key={currentStage} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
            {stepContent}
          </motion.div>
        </AnimatePresence>

        {currentStage !== 'welcome' && currentStage !== 'results' ? (
          <div className="nav-row">
            <Button variant="outline" onClick={back} disabled={step === 0} style={{ borderColor: BRAND.sage, color: BRAND.ink }}><ArrowLeft className="icon-inline" /> Back</Button>
            {currentStage === 'lead' ? (
              <Button
                className="text-white"
                style={{ backgroundColor: BRAND.ink }}
                onClick={next}
                disabled={!canContinue()}
              >
                See My Estimate <ArrowRight className="icon-inline" />
              </Button>
            ) : (
              <Button className="text-white" style={{ backgroundColor: BRAND.ink }} onClick={next} disabled={!canContinue()}>
                Continue <ArrowRight className="icon-inline" />
              </Button>
            )}
          </div>
        ) : null}
      </div>
      {consultationOpen ? (
        <ConsultationModal
          form={consultationForm}
          onChange={(patch) => setConsultationForm((prev) => ({ ...prev, ...patch }))}
          onClose={closeConsultationModal}
          onSubmit={submitConsultationRequest}
          summary={estimateSummary}
          error={consultationError}
          success={consultationSuccess}
          submitting={consultationSubmitting}
        />
      ) : null}
    </div>
  )
}

function Field({ label, icon, value, onChange, placeholder, type = 'text' }: { label: string; icon: React.ReactNode; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="field-wrap">
        {icon}
        <input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      </div>
    </div>
  )
}

function ConsultationModal({
  form,
  onChange,
  onClose,
  onSubmit,
  summary,
  error,
  success,
  submitting,
}: {
  form: {
    fullName: string
    phone: string
    email: string
    preferredCallbackTime: string
    projectAddress: string
    notes: string
  }
  onChange: (patch: Partial<{
    fullName: string
    phone: string
    email: string
    preferredCallbackTime: string
    projectAddress: string
    notes: string
  }>) => void
  onClose: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  summary: EstimateSummary
  error: string
  success: string
  submitting: boolean
}) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Schedule Consultation">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <div className="kicker" style={{ color: BRAND.forest }}>Peaceful Haven Homes</div>
            <h3 className="modal-title">Schedule Consultation</h3>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close Schedule Consultation form">
            <X className="icon-inline" />
          </button>
        </div>
        <form className="modal-form top-lg" onSubmit={onSubmit}>
          <div className="grid-two">
            <Field label="Full Name *" icon={<User className="field-icon" />} value={form.fullName} onChange={(value) => onChange({ fullName: value })} placeholder="Your full name" />
            <Field label="Phone Number *" icon={<Phone className="field-icon" />} value={form.phone} onChange={(value) => onChange({ phone: value })} placeholder="(555) 555-5555" />
          </div>
          <Field label="Email Address *" icon={<Mail className="field-icon" />} value={form.email} onChange={(value) => onChange({ email: value })} placeholder="you@example.com" type="email" />
          <div className="grid-two">
            <Field label="Preferred Callback Time" icon={<CalendarClock className="field-icon" />} value={form.preferredCallbackTime} onChange={(value) => onChange({ preferredCallbackTime: value })} placeholder="Weekdays after 4 PM" />
            <Field label="Project Address" icon={<MapPin className="field-icon" />} value={form.projectAddress} onChange={(value) => onChange({ projectAddress: value })} placeholder="123 Main St, City, ST" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="textarea" value={form.notes} onChange={(event) => onChange({ notes: event.target.value })} placeholder="Tell us about your project timing, priorities, and goals." />
          </div>
          <div className="estimate-attachment">
            <div className="section-subtitle attachment-title" style={{ color: BRAND.ink }}>Attached Estimate Summary</div>
            <div className="stack-sm top-md">
              <div className="summary-row">
                <div className="summary-row-label" style={{ color: BRAND.forest }}>Project type</div>
                <div className="summary-row-value">{summary.projectType}</div>
              </div>
              <div className="summary-row">
                <div className="summary-row-label" style={{ color: BRAND.forest }}>Finish level</div>
                <div className="summary-row-value">{summary.finishLevel}</div>
              </div>
              <div className="summary-row">
                <div className="summary-row-label" style={{ color: BRAND.forest }}>Estimated range</div>
                <div className="summary-row-value">{summary.estimatedRange}</div>
              </div>
              <div className="summary-row">
                <div className="summary-row-label" style={{ color: BRAND.forest }}>Selections included</div>
                <div className="summary-row-value">{summary.selections.length}</div>
              </div>
            </div>
          </div>
          {error ? <div className="status-box status-error">{error}</div> : null}
          {success ? <div className="status-box status-success">{success}</div> : null}
          <div className="modal-actions">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="text-white" style={{ backgroundColor: BRAND.ink }} disabled={submitting}>
              {submitting ? <><Loader2 className="icon-inline spin" /> Saving...</> : 'Submit Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function InfoBlock({ label, value, pill = false, range = false }: { label: string; value: string; pill?: boolean; range?: boolean }) {
  return (
    <div>
      <div className="info-label">{label}</div>
      {pill ? <div className="info-pill" style={{ backgroundColor: BRAND.sage, color: BRAND.ink }}>{value}</div> : null}
      {range ? <div className="info-range" style={{ border: `1px solid ${BRAND.sage}` }}>{value}</div> : null}
      {!pill && !range ? <div className="info-value">{value}</div> : null}
    </div>
  )
}
