import { useQuery } from '@tanstack/react-query'
import { type ProgramChoice } from '../types'

// モックデータ - 開発・デモ用
const MOCK_PROGRAMS: ProgramChoice[] = [
  {
    id: 'ai-lab',
    title: 'AI ラボ体験セッション',
    description: '最新のAI研究を体験し、ミニプロジェクトを実施します。機械学習の基礎から応用まで。',
    capacity: 20,
    remaining: 12,
  },
  {
    id: 'robot-workshop',
    title: 'ロボット工学ワークショップ',
    description: '実際にロボットを動かしながら、制御工学の基礎を学びます。',
    capacity: 15,
    remaining: 8,
  },
  {
    id: 'briefing',
    title: '工学部説明会',
    description: '教員・在学生によるガイダンスと質疑応答。入試情報も詳しくご案内します。',
    capacity: 40,
    remaining: 25,
  },
  {
    id: 'campus-tour',
    title: 'キャンパスラボツアー',
    description: '研究設備や実験スペースを巡る限定ツアー。最先端の設備をご覧いただけます。',
    capacity: 20,
    remaining: 5,
  },
  {
    id: 'capstone',
    title: 'ミニキャップストーン体験',
    description: 'KUASのエンジニアリングを体験できる15分間のハンズオン。在学生がサポートします。',
    capacity: 32,
    remaining: 18,
  },
  {
    id: 'vr-experience',
    title: 'VR/AR 技術体験',
    description: '最新のVR/AR技術を使った没入型体験。未来のテクノロジーを先取りできます。',
    capacity: 12,
    remaining: 7,
  },
]

async function fetchPrograms(): Promise<ProgramChoice[]> {
  // 開発環境ではモックデータを返す
  // 本番環境ではAPIから取得
  if (import.meta.env.DEV || !import.meta.env.VITE_API_BASE_URL) {
    // 少し遅延を入れてローディング状態をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 300))
    return MOCK_PROGRAMS
  }
  
  try {
    const { apiClient } = await import('@/services')
    const data = await apiClient.get<{ programs: ProgramChoice[] }>('/programs')
    return data.programs
  } catch {
    // APIエラー時はモックデータにフォールバック
    return MOCK_PROGRAMS
  }
}

export function usePrograms() {
  return useQuery({
    queryKey: ['programs'],
    queryFn: fetchPrograms,
    staleTime: 1000 * 30,
  })
}
