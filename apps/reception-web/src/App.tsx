import { useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell, SidebarNav, TopStatusBar } from '@/components/layout'
import { Badge, Button, EmptyState } from '@/components/ui'
import { Lock } from 'lucide-react'
import {
  ReceptionLanding,
  AttendeeForm,
  ProgramSelectionStep,
  ConfirmationStep,
} from '@/features/reception/components'
import { AdminDashboard, AdminLogin } from '@/features/admin/components'
import { useReceptionStats } from '@/features/admin/hooks/useReceptionStats'
import { usePrograms } from '@/features/reception/hooks/usePrograms'
import { type ProgramChoice, type ReceptionForm } from '@/features/reception/types'
import { useTranslation } from 'react-i18next'

const queryClient = new QueryClient()

type Step = 'landing' | 'attendee' | 'programs' | 'confirm' | 'admin-login' | 'admin-dashboard'

type Mode = 'reserved' | 'walk-in'

function ReceptionApp() {
  const { t, i18n } = useTranslation()
  const [step, setStep] = useState<Step>('landing')
  const [mode, setMode] = useState<Mode>('reserved')
  const [formData, setFormData] = useState<Partial<ReceptionForm>>({})
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([])
  const [adminSession, setAdminSession] = useState<{ email: string } | null>(null)
  const [adminError, setAdminError] = useState<string | null>(null)
  const [isAdminLoading, setIsAdminLoading] = useState(false)

  const { data: fetchedPrograms } = usePrograms()
  const { data: receptionStats } = useReceptionStats()

  const mockPrograms = useMemo<ProgramChoice[]>(
    () => [
      {
        id: 'P1',
        title: t('programs.mock.aiLab.title'),
        capacity: 16,
        remaining: 8,
        description: t('programs.mock.aiLab.description'),
      },
      {
        id: 'P2',
        title: t('programs.mock.briefing.title'),
        capacity: 40,
        remaining: 15,
        description: t('programs.mock.briefing.description'),
      },
      {
        id: 'P3',
        title: t('programs.mock.tour.title'),
        capacity: 20,
        remaining: 2,
        description: t('programs.mock.tour.description'),
      },
    ],
    [i18n.language, t]
  )

  const programs = fetchedPrograms ?? mockPrograms

  const currentAdminLabel = useMemo(
    () => adminSession?.email ?? t('header.defaultAdminLabel'),
    [adminSession, i18n.language, t]
  )

  const handleAdminLogin = async ({ email, password }: { email: string; password: string }) => {
    setIsAdminLoading(true)
    setAdminError(null)
    try {
      if (import.meta.env.DEV) {
        if (email === 'admin@kuas.jp' && password === 'kuas-demo') {
          setAdminSession({ email })
          setStep('admin-dashboard')
        } else {
          throw new Error(t('messages.admin.demoAuthFailed'))
        }
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 800))
      setAdminSession({ email })
      setStep('admin-dashboard')
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : t('messages.admin.loginFailed'))
    } finally {
      setIsAdminLoading(false)
    }
  }

  const handleAdminLogout = () => {
    setAdminSession(null)
    setAdminError(null)
    setStep('landing')
  }

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
            attendeeName={formData.attendee?.name ?? t('common.labels.participant')}
            selectedPrograms={programs.filter((p: ProgramChoice) => selectedProgramIds.includes(p.id))}
            onConfirm={handleConfirm}
            onBack={() => setStep('programs')}
          />
        )
      case 'admin-login':
        return (
          <AdminLogin
            loading={isAdminLoading}
            error={adminError}
            onSubmit={handleAdminLogin}
            allowSelfDemo={import.meta.env.DEV}
          />
        )
      case 'admin-dashboard':
        if (!adminSession) {
          return (
            <EmptyState
              title={t('messages.emptyStates.adminLoginRequired.title')}
              description={t('messages.emptyStates.adminLoginRequired.description')}
              icon={Lock}
              action={
                <Button variant="secondary" onClick={() => setStep('admin-login')}>
                  {t('messages.emptyStates.adminLoginRequired.action')}
                </Button>
              }
            />
          )
        }
        return <AdminDashboard />
      default:
        return null
    }
  }

  const sidebarSections = useMemo(
    () => [
      {
        title: t('layout.sidebar.receptionSection'),
        items: [
          { label: t('layout.sidebar.items.landing'), active: step === 'landing', onClick: () => setStep('landing') },
          { label: t('layout.sidebar.items.attendee'), active: step === 'attendee', onClick: () => setStep('attendee') },
          { label: t('layout.sidebar.items.programs'), active: step === 'programs', onClick: () => setStep('programs') },
          { label: t('layout.sidebar.items.confirm'), active: step === 'confirm', onClick: () => setStep('confirm') },
        ],
      },
      {
        title: t('layout.sidebar.adminSection'),
        items: [
          adminSession
            ? {
                label: t('layout.sidebar.items.dashboard'),
                active: step === 'admin-dashboard',
                badge: t('layout.sidebar.badges.live'),
                onClick: () => setStep('admin-dashboard'),
              }
            : {
                label: t('layout.sidebar.items.login'),
                active: step === 'admin-login',
                onClick: () => setStep('admin-login'),
              },
          ...(adminSession
            ? [
                {
                  label: t('layout.sidebar.items.programSettings'),
                  badge: t('layout.sidebar.badges.comingSoon'),
                  onClick: () => setStep('admin-dashboard'),
                },
                {
                  label: t('layout.sidebar.items.dataExport'),
                  badge: t('layout.sidebar.badges.comingSoon'),
                  onClick: () => setStep('admin-dashboard'),
                },
              ]
            : []),
        ],
      },
    ],
    [adminSession, i18n.language, step, t]
  )

  const headerContent = (
    <TopStatusBar
      statusMessage={mode === 'reserved' ? t('modes.reserved') : t('modes.walkIn')}
      connected
      slot={
        <>
          <Badge variant="brand">{t('header.remainingPrograms', { count: 3 })}</Badge>
          <Badge variant="subtle">{t('header.operator', { name: t('header.defaultOperatorName') })}</Badge>
          <Badge variant={adminSession ? 'brand' : 'subtle'}>
            {t('header.adminWithName', { name: currentAdminLabel })}
          </Badge>
          {adminSession ? (
            <Badge variant="subtle">{t('header.completed', { count: receptionStats?.completed ?? 0 })}</Badge>
          ) : null}
          {adminSession ? (
            <Button size="sm" variant="ghost" onClick={handleAdminLogout}>
              {t('common.actions.logout')}
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setStep('admin-login')}>
              {t('common.actions.adminLogin')}
            </Button>
          )}
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
