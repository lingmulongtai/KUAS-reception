import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell, SidebarNav, TopStatusBar } from '@/components/layout'
import { Badge } from '@/components/ui'
import {
  ReceptionLanding,
  AttendeeForm,
  ProgramSelectionStep,
  ConfirmationStep,
} from '@/features/reception/components'
import { usePrograms } from '@/features/reception/hooks/usePrograms'
import { type ProgramChoice, type ReceptionForm } from '@/features/reception/types'
import { useThemeSync } from '@/hooks/useThemeSync'

const queryClient = new QueryClient()

type Step = 'landing' | 'attendee' | 'programs' | 'confirm'

type Mode = 'reserved' | 'walk-in'

const mockPrograms: ProgramChoice[] = [
  {
    id: 'P1',
    title: 'AI ラボ体験セッション',
    capacity: 16,
    remaining: 8,
    description: '最新のAI研究を体験し、ミニプロジェクトを実施します。',
  },
  {
    id: 'P2',
    title: '工学部説明会',
    capacity: 40,
    remaining: 15,
    description: '教員・在学生によるガイダンスと質疑応答をご案内します。',
  },
  {
    id: 'P3',
    title: 'キャンパスラボツアー',
    capacity: 20,
    remaining: 2,
    description: '研究設備や実験スペースを巡る限定ツアーです。',
  },
]

function ReceptionApp() {
  const [step, setStep] = useState<Step>('landing')
  const [mode, setMode] = useState<Mode>('reserved')
  const [formData, setFormData] = useState<Partial<ReceptionForm>>({})
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([])
  const { setTheme } = useThemeSync()

  const { data: fetchedPrograms } = usePrograms()

  useEffect(() => {
    setTheme('light')
  }, [setTheme])

  const programs = fetchedPrograms ?? mockPrograms

  const handleStartReserved = () => {
    setMode('reserved')
    setStep('attendee')
  }

  const handleStartWalkIn = () => {
    setMode('walk-in')
    setStep('attendee')
  }

  const handleAttendeeSubmit = (data: ReceptionForm) => {
    setFormData((prev: Partial<ReceptionForm>) => ({
      ...prev,
      attendee: {
        ...data.attendee,
        reserved: mode === 'reserved',
      },
    }))
    setStep('programs')
  }

  const handleToggleProgram = (programId: string) => {
    setSelectedProgramIds((prev: string[]) =>
      prev.includes(programId)
        ? prev.filter((id) => id !== programId)
        : [...prev, programId].slice(0, 3)
    )
  }

  const handleConfirm = () => {
    // TODO: call backend API to confirm reception
    setStep('landing')
    setSelectedProgramIds([])
    setFormData({})
  }

  const renderContent = () => {
    switch (step) {
      case 'landing':
        return <ReceptionLanding onStartReserved={handleStartReserved} onStartWalkIn={handleStartWalkIn} />
      case 'attendee':
        return (
          <AttendeeForm
            defaultValues={formData as ReceptionForm}
            onSubmit={handleAttendeeSubmit}
            onBack={() => setStep('landing')}
          />
        )
      case 'programs':
        return (
          <ProgramSelectionStep
            programs={programs}
            selectedProgramIds={selectedProgramIds}
            onToggleProgram={handleToggleProgram}
            onNext={() => setStep('confirm')}
            onBack={() => setStep('attendee')}
          />
        )
      case 'confirm':
        return (
          <ConfirmationStep
            attendeeName={formData.attendee?.name ?? '参加者'}
            selectedPrograms={programs.filter((p: ProgramChoice) => selectedProgramIds.includes(p.id))}
            onConfirm={handleConfirm}
            onBack={() => setStep('programs')}
          />
        )
      default:
        return null
    }
  }

  const sidebarSections = [
    {
      title: 'Reception',
      items: [
        { label: '受付トップ', active: step === 'landing', onClick: () => setStep('landing') },
        { label: '参加者情報', active: step === 'attendee', onClick: () => setStep('attendee') },
        { label: 'プログラム選択', active: step === 'programs', onClick: () => setStep('programs') },
        { label: '確認と発行', active: step === 'confirm', onClick: () => setStep('confirm') },
      ],
    },
    {
      title: 'Admin',
      items: [
        { label: '受付状況', badge: 'LIVE' },
        { label: 'プログラム設定', badge: 'NEW' },
        { label: 'データエクスポート' },
      ],
    },
  ]

  const headerContent = (
    <TopStatusBar
      statusMessage={mode === 'reserved' ? '予約受付モード' : '当日受付モード'}
      connected
      slot={
        <>
          <Badge variant="brand">残りプログラム 3</Badge>
          <Badge variant="subtle">担当: 鈴木</Badge>
        </>
      }
    />
  )

  return (
    <AppShell header={headerContent} sidebar={<SidebarNav sections={sidebarSections} />}>
      {renderContent()}
    </AppShell>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReceptionApp />
    </QueryClientProvider>
  )
}

export default App
