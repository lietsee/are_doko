/**
 * 認証ストア
 */

import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

interface AuthActions {
  initialize: () => Promise<void>
  signInWithMagicLink: (email: string) => Promise<boolean>
  signOut: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      // 現在のセッションを取得
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error

      set({
        user: session?.user ?? null,
        session,
        loading: false,
      })

      // 認証状態の変更を監視
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          user: session?.user ?? null,
          session,
        })
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ loading: false, error: '認証の初期化に失敗しました' })
    }
  },

  signInWithMagicLink: async (email: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) throw error
      set({ loading: false })
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ログインに失敗しました'
      set({ loading: false, error: message })
      return false
    }
  },

  signOut: async () => {
    set({ loading: true })
    try {
      await supabase.auth.signOut()
      set({ user: null, session: null, loading: false })
    } catch (error) {
      console.error('Sign out error:', error)
      set({ loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
