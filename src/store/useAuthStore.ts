import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../api/supabase'

interface AuthStore {
  session: Session | null
  loading: boolean
  login: (email: string, password: string, isSignUp: boolean) => Promise<string | null>
  logout: () => Promise<void>
  init: () => () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  loading: true,

  init() {
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, loading: false })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, loading: false })
    })

    return () => subscription.unsubscribe()
  },

  async login(email, password, isSignUp) {
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    return error ? error.message : null
  },

  async logout() {
    await supabase.auth.signOut()
    set({ session: null })
  },
}))
