import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CircleDollarSign,
  Plus,
  ReceiptText,
  WalletCards,
} from 'lucide-react'
import './App.css'
import { fetchEntries, insertEntry, isSupabaseConfigured } from './supabaseClient'

const yen = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 0,
})

const preciseYen = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 2,
})

const settingsSeed = {
  salary: 23000,
  commission: 1711,
  rent: 5250,
  savingsTransfer: 6000,
  monthlyBudget: 14000,
  weeklyBudget: 3150,
  dailyLimit: 500,
  selectedMonth: '2026年6月',
  monthStartDay: 10,
}

const monthRanges = [
  ['2026年5月', '2026-05-10', '2026-06-09', 3150],
  ['2026年6月', '2026-06-10', '2026-07-09', 3150],
  ['2026年7月', '2026-07-10', '2026-08-09', 3150],
  ['2026年8月', '2026-08-10', '2026-09-09', 3150],
  ['2026年9月', '2026-09-10', '2026-10-09', 3150],
  ['2026年10月', '2026-10-10', '2026-11-09', 3150],
  ['2026年11月', '2026-11-10', '2026-12-09', 3150],
  ['2026年12月', '2026-12-10', '2027-01-09', 3150],
  ['2027年1月', '2027-01-10', '2027-02-09', 3150],
  ['2027年2月', '2027-02-10', '2027-03-09', 3150],
  ['2027年3月', '2027-03-10', '2027-04-09', 3150],
  ['2027年4月', '2027-04-10', '2027-05-09', 3150],
  ['2027年5月', '2027-05-10', '2027-06-09', 3150],
].map(([label, start, end, budget]) => ({ label, start, end, budget }))

const recordSeed = [
  ['2026-05-10', 313.05, '2026年5月', 1],
  ['2026-05-11', 324.56, '2026年5月', 1],
  ['2026-05-12', 35.35, '2026年5月', 1],
  ['2026-05-13', 222.51, '2026年5月', 1],
  ['2026-05-14', 1072.62, '2026年5月', 1],
  ['2026-05-15', 221.3, '2026年5月', 1],
  ['2026-05-16', 30.2, '2026年5月', 1],
  ['2026-05-17', 381.15, '2026年5月', 2],
  ['2026-05-18', 1854.64, '2026年5月', 2],
  ['2026-05-19', 80.66, '2026年5月', 2],
  ['2026-05-20', 1409.4, '2026年5月', 2],
  ['2026-05-21', 3082.66, '2026年5月', 2],
  ['2026-05-22', 46.6, '2026年5月', 2],
  ['2026-05-23', 883.9, '2026年5月', 2],
  ['2026-05-24', 704.6, '2026年5月', 3],
  ['2026-05-25', 75, '2026年5月', 3],
  ['2026-05-26', 68, '2026年5月', 3],
  ['2026-05-27', 658, '2026年5月', 3],
  ['2026-05-28', 1003.1, '2026年5月', 3],
  ['2026-05-29', 1203.94, '2026年5月', 3],
  ['2026-05-30', 50.5, '2026年5月', 3],
  ['2026-05-31', 109.3, '2026年5月', 4],
  ['2026-06-01', 437.8, '2026年5月', 4],
  ['2026-06-02', 345.29, '2026年5月', 4],
  ['2026-06-03', 59.25, '2026年5月', 4],
  ['2026-06-04', 424.4, '2026年5月', 4],
  ['2026-06-05', 518.39, '2026年5月', 4],
  ['2026-06-06', 0, '2026年5月', 4],
  ['2026-06-07', 31.6, '2026年5月', 5],
  ['2026-06-08', 237.57, '2026年5月', 5],
  ['2026-06-09', 350.35, '2026年5月', 5],
  ['2026-06-10', 467, '2026年6月', 1],
  ['2026-06-11', 732.3, '2026年6月', 1],
  ['2026-06-12', 43.4, '2026年6月', 1],
  ['2026-06-13', 34.6, '2026年6月', 1],
  ['2026-06-14', 1184.46, '2026年6月', 1],
  ['2026-06-15', 401.8, '2026年6月', 1],
  ['2026-06-16', 85.5, '2026年6月', 1],
  ['2026-06-17', 175.5, '2026年6月', 2],
  ['2026-06-18', 420.2, '2026年6月', 2],
  ['2026-06-19', 2228.4, '2026年6月', 2],
].map(([date, amount, month, week]) => ({
  id: `${date}-${amount}`,
  date,
  amount,
  month,
  week,
}))

function calcSummary(records, settings) {
  const monthly = monthRanges.map((month) => {
    const total = records
      .filter((record) => record.month === month.label)
      .reduce((sum, record) => sum + record.amount, 0)
    const remaining = settings.monthlyBudget - total

    return {
      ...month,
      total,
      remaining,
      status: remaining >= 0 ? 'OK' : '超過',
    }
  })

  const weekly = monthRanges.flatMap((month) =>
    [1, 2, 3, 4, 5].map((week) => {
      const total = records
        .filter((record) => record.month === month.label && record.week === week)
        .reduce((sum, record) => sum + record.amount, 0)
      const remaining = settings.weeklyBudget - total

      return {
        month: month.label,
        week,
        total,
        budget: settings.weeklyBudget,
        remaining,
        status: remaining >= 0 ? 'OK' : '超過',
      }
    }),
  )

  return { monthly, weekly }
}

function App() {
  const [settings, setSettings] = useState(settingsSeed)
  const [records, setRecords] = useState(recordSeed)
  const [syncState, setSyncState] = useState(
    isSupabaseConfigured ? 'Supabase同期中' : 'ローカル保存',
  )
  const [form, setForm] = useState({
    date: '2026-06-26',
    amount: '',
  })

  useEffect(() => {
    let mounted = true

    async function loadEntries() {
      if (!isSupabaseConfigured) return

      try {
        const entries = await fetchEntries()
        if (!mounted) return
        if (entries.length > 0) {
          setRecords(entries)
        }
        setSyncState('Supabase同期済み')
      } catch (error) {
        console.error(error)
        if (mounted) setSyncState('ローカル保存')
      }
    }

    loadEntries()

    return () => {
      mounted = false
    }
  }, [])

  const summary = useMemo(() => calcSummary(records, settings), [records, settings])
  const selectedMonth =
    summary.monthly.find((month) => month.label === settings.selectedMonth) ?? summary.monthly[0]
  const selectedRecords = records
    .filter((record) => record.month === selectedMonth.label)
    .sort((a, b) => b.date.localeCompare(a.date))
  const income = settings.salary + settings.commission
  const freeCash = income - settings.rent - settings.savingsTransfer
  const possibleSavings = Math.max(0, freeCash - selectedMonth.total)
  const usage = Math.min(selectedMonth.total / settings.monthlyBudget, 1)
  const overDays = selectedRecords.filter((record) => record.amount > settings.dailyLimit).length
  const averageSpend = selectedRecords.length ? selectedMonth.total / selectedRecords.length : 0

  async function addRecord(event) {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!form.date || !amount) return

    const monthRange =
      monthRanges.find((month) => form.date >= month.start && form.date <= month.end) ??
      monthRanges.find((month) => month.label === settings.selectedMonth)
    const daysFromStart =
      Math.floor((new Date(form.date) - new Date(monthRange.start)) / 86400000) + 1
    const week = Math.max(1, Math.min(5, Math.ceil(daysFromStart / 7)))

    const record = {
      id: `${form.date}-${amount}-${Date.now()}`,
      date: form.date,
      amount,
      month: monthRange.label,
      week,
    }

    setRecords((current) => [...current, record])
    setSettings((current) => ({ ...current, selectedMonth: monthRange.label }))
    setForm((current) => ({ ...current, amount: '' }))

    if (!isSupabaseConfigured) return

    try {
      setSyncState('Supabase同期中')
      const inserted = await insertEntry(record)
      if (inserted?.id) {
        setRecords((current) =>
          current.map((item) => (item.id === record.id ? { ...item, id: inserted.id } : item)),
        )
      }
      setSyncState('Supabase同期済み')
    } catch (error) {
      console.error(error)
      setSyncState('ローカル保存')
    }
  }

  return (
    <main className="simple-shell">
      <section className="simple-app">
        <header className="simple-header">
          <div>
            <p>Charlie 家計簿</p>
            <h1>使った金額だけ入力</h1>
            <span className="sync-label">{syncState}</span>
          </div>

          <div className="month-select">
            <CalendarDays size={17} />
            <select
              value={settings.selectedMonth}
              onChange={(event) =>
                setSettings((current) => ({ ...current, selectedMonth: event.target.value }))
              }
            >
              {monthRanges.map((month) => (
                <option key={month.label}>{month.label}</option>
              ))}
            </select>
          </div>
        </header>

        <section className="entry-panel">
          <div className="entry-copy">
            <CircleDollarSign size={28} />
            <div>
              <p>今日の支出</p>
              <h2>{form.date.replaceAll('-', '/')}</h2>
            </div>
          </div>

          <form className="simple-entry" onSubmit={addRecord}>
            <label>
              日付
              <input
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                type="date"
              />
            </label>
            <label className="amount-field">
              金額
              <input
                autoFocus
                inputMode="decimal"
                placeholder="500"
                value={form.amount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, amount: event.target.value }))
                }
                type="number"
              />
            </label>
            <button className="primary-button" type="submit">
              <Plus size={20} />
              入力
            </button>
          </form>
        </section>

        <section className="summary-strip">
          <Metric label="今月使った金額" value={preciseYen.format(selectedMonth.total)} />
          <Metric label="残り予算" value={preciseYen.format(selectedMonth.remaining)} strong />
          <Metric label="日上限超過" value={`${overDays}日`} />
          <Metric label="平均" value={preciseYen.format(averageSpend)} />
        </section>

        <section className="simple-grid">
          <section className="panel budget-panel">
            <div className="panel-heading">
              <div>
                <p>{settings.selectedMonth}</p>
                <h2>月予算の進み具合</h2>
              </div>
              <span className={selectedMonth.status === 'OK' ? 'status ok' : 'status danger'}>
                {selectedMonth.status}
              </span>
            </div>
            <div className="budget-body">
              <div className="ring" style={{ '--progress': `${usage * 360}deg` }}>
                <strong>{Math.round(usage * 100)}%</strong>
                <span>使用率</span>
              </div>
              <div className="metric-list">
                <Metric label="月予算" value={yen.format(settings.monthlyBudget)} />
                <Metric label="週予算" value={yen.format(settings.weeklyBudget)} />
                <Metric label="日上限" value={yen.format(settings.dailyLimit)} />
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p>貯金目安</p>
                <h2>{preciseYen.format(possibleSavings)}</h2>
              </div>
              <WalletCards size={22} />
            </div>
            <div className="metric-list">
              <Metric label="総収入" value={yen.format(income)} />
              <Metric label="固定費後" value={yen.format(freeCash)} />
              <Metric label="家賃" value={yen.format(settings.rent)} />
            </div>
          </section>

          <section className="panel table-panel history-panel">
            <div className="panel-heading">
              <div>
                <p>最近の入力</p>
                <h2>日別履歴</h2>
              </div>
              <ReceiptText size={22} />
            </div>
            <RecordTable records={selectedRecords.slice(0, 12)} dailyLimit={settings.dailyLimit} />
          </section>
        </section>
      </section>
    </main>
  )
}

function Metric({ label, value, strong = false }) {
  return (
    <div className={strong ? 'metric strong' : 'metric'}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function RecordTable({ records, dailyLimit }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>日付</th>
            <th>支出入力</th>
            <th>週番号</th>
            <th>日判定</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const overLimit = record.amount > dailyLimit
            return (
              <tr key={record.id}>
                <td>{record.date.replaceAll('-', '/')}</td>
                <td>{preciseYen.format(record.amount)}</td>
                <td>{record.week}</td>
                <td>
                  <span className={overLimit ? 'status danger' : 'status ok'}>
                    {overLimit ? '超過' : 'OK'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default App
