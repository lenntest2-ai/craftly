"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Ticket, UserProfile, Einladung, GEWERK_LABELS } from "@/types"
import { Badge, PrioBadge, MetricCard, Card, Button, EmptyState, LoadingSpinner, Toast } from "@/components/ui"

export default function HandwerkerDashboard() {
  const router = useRouter()
  const [einladungen, setEinladungen] = useState<Einladung[]>([])
  const [meineAuftraege, setMeineAuftraege] = useState<Ticket[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState("")

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const [{ data: prof }, { data: einl }, { data: meine }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("einladungen").select("*, ticket:tickets(*, objekte(*)), handwerker:profiles(*)")
        .eq("handwerker_id", user.id)
        .eq("status", "offen")
        .order("created_at", { ascending: false }),
      supabase.from("tickets").select("*")
        .eq("zugewiesener_hw", user.id)
        .order("created_at", { ascending: false }),
    ])
    setProfile(prof)
    setEinladungen(einl || [])
    setMeineAuftraege(meine || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [router])

  async function handleAntwort(einladungId: string, ticketId: string, annehmen: boolean, preis?: number) {
    const supabase = createClient()

    if (!annehmen) {
      await supabase.from("einladungen").update({ status: "abgelehnt" }).eq("id", einladungId)
      showToast("Anfrage abgelehnt.")
      await load()
      return
    }

    const angebotsPreis = preis || 0
    if (angebotsPreis <= 0) { showToast("Bitte einen gültigen Preis eingeben."); return }

    const { error } = await supabase.from("angebote").insert({
      ticket_id: ticketId,
      handwerker_id: profile!.id,
      preis: angebotsPreis,
      status: "eingereicht",
    })

    if (error) { showToast("Fehler: " + error.message); return }

    await supabase.from("einladungen").update({ status: "angebot" }).eq("id", einladungId)
    showToast("Angebot eingereicht!")
    await load()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-medium">
          Hallo, {profile?.firma || profile?.name}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {profile?.gewerk && `${GEWERK_LABELS[profile.gewerk] || profile.gewerk} · `}
          {profile?.bewertung_avg ? `★ ${profile.bewertung_avg}` : "Noch keine Bewertungen"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <MetricCard label="Neue Anfragen" value={einladungen.length} />
        <MetricCard label="Meine Aufträge" value={meineAuftraege.length} />
        <MetricCard label="Bewertung" value={profile?.bewertung_avg ? `${profile.bewertung_avg} ★` : "—"} />
      </div>

      {/* Einladungen / Anfragen */}
      <h2 className="text-sm font-medium text-gray-700 mb-3">Neue Anfragen</h2>
      {einladungen.length === 0 ? (
        <EmptyState icon="📨" title="Keine neuen Anfragen" desc="Aktuell gibt es keine offenen Einladungen für dich." />
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {einladungen.map(e => (
            <EinladungCard
              key={e.id}
              einladung={e}
              onAntwort={handleAntwort}
              onOpen={() => router.push(`/ticket/${e.ticket_id}`)}
            />
          ))}
        </div>
      )}

      {/* Laufende Aufträge */}
      {meineAuftraege.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-gray-700 mb-3">Meine laufenden Aufträge</h2>
          <div className="flex flex-col gap-2">
            {meineAuftraege.map(t => (
              <Card key={t.id} className="cursor-pointer hover:border-[#1D9E75] transition-colors !p-3"
                onClick={() => router.push(`/ticket/${t.id}`)}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === "erledigt" ? "bg-green-500" : "bg-amber-400"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.titel}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{new Date(t.created_at).toLocaleDateString("de")}</div>
                  </div>
                  <Badge status={t.status} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  )
}

function EinladungCard({ einladung, onAntwort, onOpen }: {
  einladung: Einladung
  onAntwort: (einladungId: string, ticketId: string, annehmen: boolean, preis?: number) => void
  onOpen: () => void
}) {
  const [eigenPreis, setEigenPreis] = useState(String(einladung.empfohlener_preis || ""))
  const [showForm, setShowForm] = useState(false)
  const ticket = einladung.ticket

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 cursor-pointer" onClick={onOpen}>
          <div className="text-sm font-medium">{ticket?.titel}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {ticket?.wohnung && `${ticket.wohnung} · `}
            {ticket?.gewerk && `${GEWERK_LABELS[ticket.gewerk] || ticket.gewerk} · `}
            {new Date(einladung.created_at).toLocaleDateString("de")}
          </div>
          {ticket?.beschreibung && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{ticket.beschreibung}</p>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          {ticket && <PrioBadge prio={ticket.prioritaet} />}
        </div>
      </div>

      {/* Richtpreis */}
      <div className="bg-[#E1F5EE] rounded-lg px-3 py-2 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#0F6E56]">Empfohlener Preis</span>
          <span className="text-sm font-medium text-[#0F6E56]">€ {einladung.empfohlener_preis}</span>
        </div>
      </div>

      {!showForm ? (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onAntwort(einladung.id, einladung.ticket_id, true, einladung.empfohlener_preis)}>
            Zum Richtpreis annehmen
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowForm(true)}>
            Gegenangebot
          </Button>
          <Button size="sm" variant="danger" onClick={() => onAntwort(einladung.id, einladung.ticket_id, false)}>
            Ablehnen
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Mein Preis in €</label>
            <input
              type="number" min="1" step="0.01"
              value={eigenPreis}
              onChange={e => setEigenPreis(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#1D9E75]"
              placeholder="z.B. 420"
            />
          </div>
          <Button size="sm" onClick={() => onAntwort(einladung.id, einladung.ticket_id, true, Number(eigenPreis))}>
            Angebot senden
          </Button>
          <button onClick={() => setShowForm(false)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2">
            ×
          </button>
        </div>
      )}
    </Card>
  )
}
