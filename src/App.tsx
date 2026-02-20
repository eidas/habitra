import { useState, useEffect } from 'react'

interface Habit {
  id: string
  name: string
  emoji: string
  completedDates: string[]
  createdAt: string
}

const STORAGE_KEY = 'habitra-habits'

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function getYesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function calcStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0
  const sorted = [...completedDates].sort().reverse()
  const today = getTodayStr()
  const yesterday = getYesterdayStr()

  // streak must end today or yesterday
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0

  let streak = 0
  const cur = new Date(sorted[0])
  for (const dateStr of sorted) {
    const d = new Date(dateStr)
    const diff = Math.round((cur.getTime() - d.getTime()) / 86400000)
    if (diff === streak) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

export default function App() {
  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('')

  const today = getTodayStr()

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits))
  }, [habits])

  function addHabit(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    const habit: Habit = {
      id: crypto.randomUUID(),
      name,
      emoji: newEmoji.trim() || '✅',
      completedDates: [],
      createdAt: today,
    }
    setHabits(prev => [habit, ...prev])
    setNewName('')
    setNewEmoji('')
  }

  function toggleToday(id: string) {
    setHabits(prev =>
      prev.map(h => {
        if (h.id !== id) return h
        const done = h.completedDates.includes(today)
        return {
          ...h,
          completedDates: done
            ? h.completedDates.filter(d => d !== today)
            : [...h.completedDates, today],
        }
      })
    )
  }

  function deleteHabit(id: string) {
    setHabits(prev => prev.filter(h => h.id !== id))
  }

  const completedCount = habits.filter(h => h.completedDates.includes(today)).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-emerald-600 tracking-wide">🌿 ハビトラ</h1>
          <span className="text-sm text-gray-500">{formatDate(today)}</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Progress summary */}
        {habits.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">今日の進捗</p>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / habits.length) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-emerald-600">{completedCount}</span>
              <span className="text-gray-400 text-sm">/{habits.length}</span>
              <p className="text-xs text-gray-400">完了</p>
            </div>
          </div>
        )}

        {/* Habits list */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">習慣リスト</h2>
          {habits.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">
              <p className="text-4xl mb-3">🌱</p>
              <p className="font-medium">まだ習慣がありません</p>
              <p className="text-sm mt-1">下のフォームから習慣を追加しましょう！</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {habits.map(habit => {
                const done = habit.completedDates.includes(today)
                const streak = calcStreak(habit.completedDates)
                return (
                  <li
                    key={habit.id}
                    className={`bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 transition-all duration-200 ${
                      done ? 'border-l-4 border-emerald-500' : 'border-l-4 border-transparent'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleToday(habit.id)}
                      aria-label={done ? 'チェックを外す' : '完了にする'}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                        done
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-gray-300 hover:border-emerald-400'
                      }`}
                    >
                      {done && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    {/* Emoji */}
                    <span className="text-2xl">{habit.emoji}</span>

                    {/* Name + streak */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                        {habit.name}
                      </p>
                      {streak > 0 && (
                        <p className="text-xs text-orange-500 font-medium mt-0.5">
                          🔥 {streak}日連続
                        </p>
                      )}
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      aria-label="削除"
                      className="text-gray-300 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Add habit form */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">習慣を追加</h2>
          <form onSubmit={addHabit} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newEmoji}
                onChange={e => setNewEmoji(e.target.value)}
                placeholder="😊"
                maxLength={4}
                className="w-16 text-center text-xl border border-gray-200 rounded-xl px-2 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="習慣の名前を入力..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                required
              />
            </div>
            <button
              type="submit"
              disabled={!newName.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-2.5 rounded-xl transition-colors duration-200 text-sm"
            >
              ＋ 習慣を追加する
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
