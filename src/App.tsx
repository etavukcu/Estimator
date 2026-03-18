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
} from 'lucide-react'
import jsPDF from 'jspdf'
import logo from './assets/peaceful-haven-logo.svg'

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

type LeadPayload = {
  fullName: string
  email: string
  phone: string
  notes: string
  projectName: string
  tierLabel: string
  estimateRange: string
  summary: Array<{ section: string; answer: string }>
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
    description: 'Cabinetry, countertops, layout updates, appliances, and finishes.',
    baseRanges: { good: [35000, 55000], better: [55000, 85000], best: [85000, 150000] },
    sections: [
      {
        title: 'Scope',
        questions: [
          {
            id: 'size',
            label: 'What size is your kitchen?',
            options: [
              { value: 'small', label: 'Small', helper: 'Under 150 sq ft', adj: [0, 0] },
              { value: 'medium', label: 'Medium', helper: '150-250 sq ft', adj: [8000, 12000] },
              { value: 'large', label: 'Large', helper: '250+ sq ft', adj: [15000, 25000] },
            ],
          },
          {
            id: 'layout',
            label: 'Will the layout stay the same?',
            options: [
              { value: 'same', label: 'Keep layout', adj: [0, 0] },
              { value: 'minor', label: 'Minor changes', adj: [5000, 10000] },
              { value: 'major', label: 'Major layout change', adj: [15000, 30000] },
            ],
          },
        ],
      },
      {
        title: 'Cabinetry',
        questions: [
          {
            id: 'cabinetType',
            label: 'What cabinet type are you considering?',
            options: [
              { value: 'stock', label: 'Stock', adj: [5000, 10000], tiers: ['good'] },
              { value: 'semi', label: 'Semi-custom', adj: [12000, 25000], tiers: ['good', 'better'] },
              { value: 'custom', label: 'Custom', adj: [30000, 70000], tiers: ['better', 'best'] },
            ],
          },
          {
            id: 'cabinetMaterial',
            label: 'What cabinet material or finish do you want?',
            options: [
              { value: 'mdf', label: 'MDF Painted', adj: [0, 1500], tiers: ['good'] },
              { value: 'paint', label: 'Paint Grade', adj: [0, 3000], tiers: ['good', 'better'] },
              { value: 'maple', label: 'Maple', adj: [2000, 4000], tiers: ['better'] },
              { value: 'oak', label: 'White Oak', adj: [6000, 12000], tiers: ['better', 'best'] },
              { value: 'walnut', label: 'Walnut', adj: [10000, 20000], tiers: ['best'] },
            ],
          },
        ],
      },
      {
        title: 'Surfaces',
        questions: [
          {
            id: 'countertop',
            label: 'What countertop material are you considering?',
            options: [
              { value: 'laminate', label: 'Laminate', adj: [0, 0], tiers: ['good'] },
              { value: 'butcher', label: 'Butcher Block', adj: [2000, 4000], tiers: ['good'] },
              { value: 'entryQuartz', label: 'Entry Quartz', adj: [4000, 7000], tiers: ['good', 'better'] },
              { value: 'quartz', label: 'Quartz', adj: [4000, 8000], tiers: ['better', 'best'] },
              { value: 'granite', label: 'Granite', adj: [5000, 9000], tiers: ['better', 'best'] },
              { value: 'quartzite', label: 'Quartzite', adj: [10000, 20000], tiers: ['best'] },
              { value: 'marble', label: 'Marble', adj: [10000, 20000], tiers: ['best'] },
            ],
          },
          {
            id: 'backsplash',
            label: 'Would you like a backsplash upgrade?',
            options: [
              { value: 'none', label: 'No backsplash', adj: [0, 0] },
              { value: 'standard', label: 'Standard tile', adj: [2000, 4000] },
              { value: 'custom', label: 'Custom tile', adj: [5000, 10000] },
            ],
          },
          {
            id: 'flooring',
            label: 'What flooring scope should we include?',
            options: [
              { value: 'existing', label: 'Keep existing', adj: [0, 0] },
              { value: 'lvp', label: 'LVP / Laminate', adj: [3000, 6000], tiers: ['good', 'better'] },
              { value: 'tile', label: 'Tile', adj: [6000, 12000], tiers: ['better', 'best'] },
              { value: 'hardwood', label: 'Hardwood', adj: [8000, 15000], tiers: ['better', 'best'] },
            ],
          },
        ],
      },
      {
        title: 'Appliances & Extras',
        questions: [
          {
            id: 'appliances',
            label: 'Should appliances be included?',
            options: [
              { value: 'none', label: 'No appliances', adj: [0, 0] },
              { value: 'standard', label: 'Standard package', adj: [5000, 8000], tiers: ['good', 'better'] },
              { value: 'premium', label: 'Premium package', adj: [12000, 25000], tiers: ['better', 'best'] },
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
    baseRanges: { good: [15000, 25000], better: [25000, 45000], best: [45000, 90000] },
    sections: [
      {
        title: 'Bathroom Type',
        questions: [
          {
            id: 'bathroomType',
            label: 'Which bathroom are you remodeling?',
            options: [
              { value: 'powder', label: 'Powder room', adj: [0, 0] },
              { value: 'hall', label: 'Hall bath', adj: [5000, 10000] },
              { value: 'primary', label: 'Primary bath', adj: [15000, 30000] },
            ],
          },
          {
            id: 'bathLayout',
            label: 'Will the layout stay the same?',
            options: [
              { value: 'same', label: 'Keep layout', adj: [0, 0] },
              { value: 'minor', label: 'Minor changes', adj: [4000, 8000] },
              { value: 'major', label: 'Major changes', adj: [12000, 20000] },
            ],
          },
        ],
      },
      {
        title: 'Wet Area',
        questions: [
          {
            id: 'showerTub',
            label: 'What wet-area scope should we include?',
            options: [
              { value: 'tub', label: 'Replace tub', adj: [3000, 6000], tiers: ['good', 'better'] },
              { value: 'alcoveShower', label: 'Standard alcove shower', adj: [5000, 9000], tiers: ['good', 'better'] },
              { value: 'fiberglassShower', label: 'Fiberglass shower unit', adj: [4000, 8000], tiers: ['good'] },
              { value: 'shower', label: 'Walk-in shower', adj: [8000, 15000], tiers: ['better', 'best'] },
              { value: 'both', label: 'Tub + shower', adj: [12000, 25000], tiers: ['better', 'best'] },
              { value: 'other', label: 'Other', helper: 'We can discuss a custom wet-area setup.', adj: [6000, 12000] },
            ],
          },
          {
            id: 'glass',
            label: 'What shower glass level do you want?',
            options: [
              { value: 'framed', label: 'Framed', adj: [1000, 2000], tiers: ['good'] },
              { value: 'semiFrameless', label: 'Semi-frameless', adj: [1500, 3000], tiers: ['good', 'better'] },
              { value: 'slider', label: 'Sliding glass door', adj: [1500, 3500], tiers: ['good', 'better'] },
              { value: 'frameless', label: 'Frameless', adj: [2000, 5000], tiers: ['better', 'best'] },
              { value: 'custom', label: 'Custom frameless', adj: [6000, 12000], tiers: ['best'] },
              { value: 'other', label: 'Other', helper: 'We can discuss a custom glass option.', adj: [2000, 5000] },
            ],
          },
        ],
      },
      {
        title: 'Vanity & Finishes',
        questions: [
          {
            id: 'vanity',
            label: 'What vanity level are you considering?',
            options: [
              { value: 'stock', label: 'Stock vanity', adj: [2000, 4000], tiers: ['good'] },
              { value: 'freestanding', label: 'Freestanding vanity', adj: [2500, 4500], tiers: ['good', 'better'] },
              { value: 'builderDouble', label: 'Builder-grade double vanity', adj: [3500, 6000], tiers: ['good', 'better'] },
              { value: 'semi', label: 'Semi-custom vanity', adj: [4000, 8000], tiers: ['good', 'better'] },
              { value: 'custom', label: 'Custom vanity', adj: [10000, 20000], tiers: ['better', 'best'] },
              { value: 'other', label: 'Other', helper: 'We can discuss a custom vanity style.', adj: [4000, 9000] },
            ],
          },
          {
            id: 'tile',
            label: 'What tile level should we include?',
            options: [
              { value: 'basic', label: 'Basic tile', adj: [4000, 8000], tiers: ['good'] },
              { value: 'ceramic', label: 'Ceramic tile', adj: [5000, 9000], tiers: ['good', 'better'] },
              { value: 'porcelain', label: 'Porcelain tile', adj: [6000, 11000], tiers: ['good', 'better'] },
              { value: 'mid', label: 'Mid-range tile', adj: [8000, 15000], tiers: ['better'] },
              { value: 'premium', label: 'Premium tile', adj: [15000, 30000], tiers: ['best'] },
              { value: 'other', label: 'Other', helper: 'We can discuss another tile selection.', adj: [7000, 14000] },
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

function getFilteredOptions(question: Question, tier: string) {
  return (question.options || []).filter((option) => !option.tiers || option.tiers.includes(tier as TierKey))
}

function getAllQuestions(project: Project | undefined, tier: string) {
  if (!project?.sections || !tier) return [] as (Question & { sectionTitle: string })[]
  return project.sections.flatMap((section) =>
    section.questions.map((question) => ({
      ...question,
      sectionTitle: section.title,
      options: getFilteredOptions(question, tier),
    }))
  )
}

function calculateEstimate(project: Project | undefined, tier: string, answers: Record<string, string>) {
  if (!project || !tier) return null
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

  return { low, high, summary }
}

function runEstimatorSmokeTests() {
  console.assert(rangeToText([1000, 2000]) === '$1,000 - $2,000', 'rangeToText should format a currency range')
  console.assert(getProject('kitchen')?.name === 'Kitchen Remodel', 'getProject should find kitchen project')
  const goodQuestions = getAllQuestions(getProject('bathroom'), 'good')
  const wetArea = goodQuestions.find((q) => q.id === 'showerTub')?.options.map((o) => o.value) || []
  console.assert(wetArea.includes('alcoveShower'), 'good bathroom tier should include alcove shower')
  console.assert(wetArea.includes('other'), 'good bathroom tier should include other option')
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
  question,
  value,
  onChange,
}: { question: Question; value?: string; onChange: (value: string) => void }) {
  return (
    <div className="grid-two">
      {question.options.map((option) => {
        const active = value === option.value
        return (
          <SelectCard key={option.value} type="button" active={active} onClick={() => onChange(option.value)}>
            <div className="row-between top-gap">
              <div>
                <div className="option-title">{option.label}</div>
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
  const [isSubmittingLead, setIsSubmittingLead] = useState(false)
  const [leadSubmitError, setLeadSubmitError] = useState('')
  const [leadSubmitted, setLeadSubmitted] = useState(false)

  const project = useMemo(() => getProject(projectId), [projectId])
  const activeQuestions = useMemo(() => getAllQuestions(project, tier), [project, tier])
  const estimate = useMemo(() => calculateEstimate(project, tier, answers), [project, tier, answers])
  const stages = ['welcome', 'project', 'tier', ...activeQuestions.map((q) => q.id), 'lead', 'results']
  const currentStage = stages[step] || 'welcome'
  const currentQuestion = activeQuestions.find((q) => q.id === currentStage)
  const progress = Math.round((step / Math.max(stages.length - 1, 1)) * 100)

  function canContinue() {
    if (currentStage === 'welcome') return true
    if (currentStage === 'project') return Boolean(projectId)
    if (currentStage === 'tier') return Boolean(tier)
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

  async function submitLead() {
    if (!project || !tier || !estimate) return false
    if (leadSubmitted) return true

    const payload: LeadPayload = {
      fullName: lead.fullName.trim(),
      email: lead.email.trim(),
      phone: lead.phone.trim(),
      notes: lead.notes.trim(),
      projectName: project.name,
      tierLabel: TIERS[tier as TierKey].label,
      estimateRange: rangeToText([estimate.low, estimate.high]),
      summary: estimate.summary,
    }

    setIsSubmittingLead(true)
    setLeadSubmitError('')
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || ''
      const response = await fetch(`${apiBase}/api/estimate-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const body = await response.json().catch(async () => ({ error: await response.text() }))
        const fallbackMessage = response.status === 404
          ? 'Submission API not found. Please verify the server/API is running.'
          : 'Unable to submit your details right now.'
        throw new Error(body?.error || fallbackMessage)
      }

      setLeadSubmitted(true)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit your details right now.'
      setLeadSubmitError(message)
      return false
    } finally {
      setIsSubmittingLead(false)
    }
  }

  function downloadPdf() {
    if (!project || !tier || !estimate) return
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
    pdf.text(`Selected tier: ${TIERS[tier as TierKey].label}`, marginX + 16, y + 58)
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
    writeLine('This estimate is a planning range based on the selections above. Final pricing depends on field conditions, structural requirements, measurements, permits, engineering, and material availability.', 11, 16)
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
          <div className="feature-chip" style={{ backgroundColor: BRAND.sand, color: BRAND.ink }}>Good • Better • Best pricing paths</div>
          <h2 className="hero-title" style={{ color: BRAND.ink }}>Get a planning range for your remodel.</h2>
          <p className="hero-copy">Answer a few guided questions and receive a tailored project range based on your project type, finish level, and selections.</p>
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
            {['Choose your project type', 'Select Good, Better, or Best', 'Answer dynamic project questions', 'Enter contact details', 'Download your PDF summary'].map((item, index) => (
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
        <div className="kicker" style={{ color: BRAND.forest }}>{currentQuestion.sectionTitle}</div>
        <div className="section-title top-sm" style={{ color: BRAND.ink }}>{currentQuestion.label}</div>
        <div className="section-copy">Your selected tier filters the options shown below.</div>
        <div className="top-lg">
          <OptionCards
            question={currentQuestion}
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
          <div className="section-copy">We securely send this info to our team and also include it in your PDF.</div>
          <div className="form-stack top-lg">
            <Field label="Full name" icon={<User className="field-icon" />} value={lead.fullName} onChange={(v) => setLead((p) => ({ ...p, fullName: v }))} placeholder="Your full name" />
            <Field label="Email" icon={<Mail className="field-icon" />} value={lead.email} onChange={(v) => setLead((p) => ({ ...p, email: v }))} placeholder="you@example.com" type="email" />
            <Field label="Phone" icon={<Phone className="field-icon" />} value={lead.phone} onChange={(v) => setLead((p) => ({ ...p, phone: v }))} placeholder="(555) 555-5555" />
            <div>
              <label className="label">Anything else you want us to know? (optional)</label>
              <textarea className="textarea" value={lead.notes} onChange={(e) => setLead((p) => ({ ...p, notes: e.target.value }))} placeholder="Tell us about timing, goals, or special requests." />
            </div>
            {leadSubmitError ? <div className="section-copy" style={{ color: '#b91c1c' }}>{leadSubmitError}</div> : null}
          </div>
        </div>
      </Card>
      <Card className="text-white" style={{ background: `linear-gradient(135deg, ${BRAND.ink}, ${BRAND.forest})` }}>
        <div className="card-pad">
          <div className="kicker light">Estimate preview</div>
          <div className="stack-md top-lg">
            <InfoBlock label="Project" value={project?.name || '-'} />
            <InfoBlock label="Selected tier" value={tier ? TIERS[tier as TierKey].label : '-'} pill />
            <InfoBlock label="Current planning range" value={estimate ? rangeToText([estimate.low, estimate.high]) : '-'} range />
          </div>
          <div className="info-box top-xl">When you continue, your details and project summary are sent directly to Peaceful Haven Homes.</div>
        </div>
      </Card>
    </div>
  )

  const resultsStep = estimate && project && tier ? (
    <div className="layout-two-results">
      <Card>
        <div className="card-pad">
          <div className="kicker" style={{ color: BRAND.forest }}>Your Planning Range</div>
          <div className="range-title" style={{ backgroundColor: BRAND.ink, color: 'white' }}>{rangeToText([estimate.low, estimate.high])}</div>
          <div className="section-copy">Based on your selected scope, finish level, and project type.</div>
          <div className="grid-three top-lg">
            <SummaryPill label="Project type" value={project.name} />
            <SummaryPill label="Selected tier" value={TIERS[tier as TierKey].label} highlight />
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
            This estimate is a planning range based on the selections above. Final pricing depends on field conditions, structural requirements, measurements, permits, engineering, and material availability.
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
            <Button variant="outline" className="full">Schedule Consultation</Button>
            <Button variant="outline" className="full">Request Detailed Estimate</Button>
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
                onClick={async () => {
                  const isSent = await submitLead()
                  if (isSent) setStep(stages.length - 1)
                }}
                disabled={!canContinue() || isSubmittingLead}
              >
                {isSubmittingLead ? 'Sending…' : 'See My Estimate'} <ArrowRight className="icon-inline" />
              </Button>
            ) : (
              <Button className="text-white" style={{ backgroundColor: BRAND.ink }} onClick={next} disabled={!canContinue()}>
                Continue <ArrowRight className="icon-inline" />
              </Button>
            )}
          </div>
        ) : null}
      </div>
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
