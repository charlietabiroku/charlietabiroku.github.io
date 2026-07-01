import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

export async function ensureAnonymousSession() {
  if (!supabase) return null

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userData?.user) return userData.user

  if (userError && userError.name !== 'AuthSessionMissingError') {
    throw userError
  }

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return data.user
}

export async function fetchEntries() {
  if (!supabase) return []

  const user = await ensureAnonymousSession()
  const { data, error } = await supabase
    .from('budget_entries')
    .select('id, spent_on, amount, month_tag, week_number')
    .eq('user_id', user.id)
    .order('spent_on', { ascending: true })

  if (error) throw error

  return data.map((entry) => ({
    id: entry.id,
    date: entry.spent_on,
    amount: Number(entry.amount),
    month: entry.month_tag,
    week: entry.week_number,
  }))
}

export async function fetchMonthlySettings() {
  if (!supabase) return {}

  const user = await ensureAnonymousSession()
  const { data, error } = await supabase
    .from('budget_month_settings')
    .select('month_tag, income')
    .eq('user_id', user.id)

  if (error) throw error

  return Object.fromEntries(data.map((setting) => [setting.month_tag, Number(setting.income)]))
}

export async function subscribeToBudgetUpdates(onChange) {
  if (!supabase) return null

  const user = await ensureAnonymousSession()
  const channel = supabase
    .channel(`budget-updates-${user.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'budget_entries',
        filter: `user_id=eq.${user.id}`,
      },
      onChange,
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'budget_month_settings',
        filter: `user_id=eq.${user.id}`,
      },
      onChange,
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function insertEntry(record) {
  if (!supabase) return null

  const user = await ensureAnonymousSession()
  const { data, error } = await supabase
    .from('budget_entries')
    .insert({
      user_id: user.id,
      spent_on: record.date,
      amount: record.amount,
      month_tag: record.month,
      week_number: record.week,
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}

export async function saveMonthlyIncome(month, income) {
  if (!supabase) return null

  const user = await ensureAnonymousSession()
  const { error } = await supabase.from('budget_month_settings').upsert(
    {
      user_id: user.id,
      month_tag: month,
      income,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,month_tag',
    },
  )

  if (error) throw error
  return true
}
