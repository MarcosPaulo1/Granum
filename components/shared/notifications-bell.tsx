"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/hooks/use-user"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Bell } from "lucide-react"
import { formatDateTime } from "@/lib/utils/format"

interface Notificacao {
  id_notificacao: number
  tipo: string
  titulo: string
  mensagem: string | null
  link: string | null
  lida: boolean
  created_at: string
}

export function NotificationsBell() {
  const { responsavel } = useUser()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    if (!responsavel) return
    const supabase = createClient()
    const { data } = await supabase
      .from("notificacao")
      .select("*")
      .eq("id_responsavel", responsavel.id_responsavel)
      .order("created_at", { ascending: false })
      .limit(20)
    setNotificacoes((data ?? []) as Notificacao[])
  }, [responsavel])

  useEffect(() => { load() }, [load])

  // Polling a cada 60s para novas notificacoes
  useEffect(() => {
    if (!responsavel) return
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [responsavel, load])

  const naoLidas = notificacoes.filter(n => !n.lida).length

  async function marcarLida(id: number) {
    const supabase = createClient()
    await supabase.from("notificacao").update({ lida: true }).eq("id_notificacao", id)
    setNotificacoes(prev => prev.map(n => n.id_notificacao === id ? { ...n, lida: true } : n))
  }

  async function marcarTodasLidas() {
    if (!responsavel) return
    const supabase = createClient()
    await supabase
      .from("notificacao")
      .update({ lida: true })
      .eq("id_responsavel", responsavel.id_responsavel)
      .eq("lida", false)
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="ghost" size="icon" className="relative" />}
      >
        <Bell className="h-5 w-5" />
        {naoLidas > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold text-sm">Notificações</h4>
          {naoLidas > 0 && (
            <button
              onClick={marcarTodasLidas}
              className="text-xs text-blue-600 hover:underline"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notificacoes.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">Nenhuma notificação</p>
          ) : (
            notificacoes.map(n => (
              <div
                key={n.id_notificacao}
                className={`border-b px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 transition-colors ${!n.lida ? "bg-blue-50" : ""}`}
                onClick={() => {
                  if (!n.lida) marcarLida(n.id_notificacao)
                  if (n.link) {
                    setOpen(false)
                    window.location.href = n.link
                  }
                }}
              >
                <p className={`${!n.lida ? "font-semibold" : ""}`}>{n.titulo}</p>
                {n.mensagem && <p className="text-xs text-muted-foreground mt-0.5">{n.mensagem}</p>}
                <p className="text-xs text-muted-foreground mt-1">{formatDateTime(n.created_at)}</p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
