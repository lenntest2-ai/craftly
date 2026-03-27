"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Ticket, TicketStatus } from "@/types"
import { Badge, StatusDot, Button, Card, EmptyState } from "@/components/ui"

const FILTER_OPTIONS: { label: string; value: TicketStatus | "alle" }[] = [
  { label: "Alle", value: "alle" },
  { label: "Offen", value: "offen" },
  { label: "Auktion", value: "auktion" },
  { label: "In Bearbeitung", value: "in_bearbeitung" },
  { label: "Erledigt", value: "erledigt" },
]

export default function TicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filter, setFilter] = useState<TicketStatus | "alle">("alle")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      const { data } = await supabase
        .from("tickets").select("*, angebote(*)")
        .eq("erstellt_von", user.id).order("created_at", { ascending: false })
      setTickets(data || [])
      setLoading(false)
    }
    load()
  }, [router])

  const shown = filter === "alle" ? tickets : tickets.filter(t => t.status === filter)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium">Alle Tickets</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tickets.length} Tickets insgesamt</p>
        </div>
        <Button onClick={() => router.push("/dashboard-verwalter/neues-ticket")}>+ Neues Ticket</Button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTER_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              filter === opt.value
                ? "bg-[#1D9E75] text-white border-[#1D9E75]"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}>
            {opt.label}
            <span className="ml-1.5 opacity-70">
              {opt.value === "alle" ? tickets.length : tickets.filter(t => t.status === opt.value).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-gray-400">Lädt...</div>
      ) : shown.length === 0 ? (
        <EmptyState icon="🎫" title="Keine Tickets" desc="Für diesen Filter gibt es keine Tickets." />
      ) : (
        <div className="flex flex-col gap-2">
          {shown.map(t => (
            <Card key={t.id} className="cursor-pointer hover:border-[#1D9E75] transition-colors !p-3"
              onClick={() => router.push(`/ticket/${t.id}`)}>
              <div className="flex items-center gap-3">
                <StatusDot status={t.status} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.titel}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {t.wohnung && `${t.wohnung} · `}
                    {new Date(t.created_at).toLocaleDateString("de")}
                    {t.angebote?.length ? ` · ${t.angebote.length} Angebot${t.angebote.length !== 1 ? "e" : ""}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {t.angebote && t.angebote.length > 0 && (
                    <span className="text-sm font-medium text-[#1D9E75]">
                      ab € {Math.min(...t.angebote.map((a: any) => a.preis)).toLocaleString("de")}
                    </span>
                  )}
                  <Badge status={t.status} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
