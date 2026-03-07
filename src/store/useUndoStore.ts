import { create } from 'zustand'
import { supabase } from '../api/supabase'
import type { Transaction, TransactionType } from '../types'

interface UndoEntry {
  transaction: Transaction
  undoFn: () => Promise<void>
}

interface UndoStore {
  stack: UndoEntry[]
  push: (entry: UndoEntry) => void
  undo: () => Promise<void>
  canUndo: boolean
}

export const useUndoStore = create<UndoStore>((set, get) => ({
  stack: [],
  canUndo: false,

  push(entry) {
    set(s => ({ stack: [...s.stack, entry], canUndo: true }))
  },

  async undo() {
    const { stack } = get()
    if (!stack.length) return
    const last = stack[stack.length - 1]
    await last.undoFn()
    set(s => {
      const newStack = s.stack.slice(0, -1)
      return { stack: newStack, canUndo: newStack.length > 0 }
    })
  },
}))

/** Helper: log a transaction and push undo entry to the store */
export async function logAndPush(
  type: TransactionType,
  entityId: string,
  entityType: string,
  payloadBefore: Record<string, unknown> | null,
  payloadAfter: Record<string, unknown> | null,
  undoFn: () => Promise<void>,
) {
  const { data } = await supabase
    .from('transactions')
    .insert({ type, entity_id: entityId, entity_type: entityType, payload_before: payloadBefore, payload_after: payloadAfter })
    .select()
    .single()

  if (data) {
    useUndoStore.getState().push({ transaction: data as Transaction, undoFn })
  }
}
