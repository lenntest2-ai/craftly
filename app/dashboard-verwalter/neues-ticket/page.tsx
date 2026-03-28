"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button, Input, Select, Textarea, Card } from "@/components/ui"
import { GEWERK_LABELS, UserProfile } from "@/types"
import { berechnePreisfaktor, berechneRichtpreis } from "@/lib/preisfaktor"

export default function NeuesTicketPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    titel: "", beschreibung: "", wohnung: "",
    prioritaet: "normal", gewerk: "allgemein",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [hwCount, setHwCount] = useState(0)
  const [hwPreview, setHwPreview] = useState<UserProfile[]>([])
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    async function checkSupply() {
      const supabase = createClient()
      let query = supabase.from("profiles")
        .select("id, name, firma, gewerk, bewertung_avg, basis_preis, auftraege_anzahl")
        .eq("rolle", "handwerker")
      if (form.gewerk !== "allgemein") {
        query = query.eq("gewerk", form.gewerk)
      }
      const { data } = await query.order("bewertung_avg", { ascending: false }).limit(10)
      setHwPreview(data || [])
      setHwCount(data?.length || 0)
    }
    checkSupply()
  }, [form.gewerk])

  const pf = berechnePreisfaktor(
    form.prioritaet as "normal" | "hoch" | "dringend",
    hwCount
  )

  async function handleCreate() {
    if (!form.titel) { setError("Bitte Titel eingeben"); return }
    setLoading(true); setError("")
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const { data, error: insertErr } = await supabase.from("tickets").insert({
      titel: form.titel,
      beschreibung: form.beschreibung,
      wohnung: form.wohnung,
      prioritaet: form.prioritaet,
      gewerk: form.gewerk,
      vergabemodus: "auktion",
      status: "offen",
      erstellt_von: user.id,
    }).select().single()

    if (insertErr) { setError("Fehler: " + insertErr.message); setLoading(false); return }
    router.push(`/dashboard-verwalter/tickets/${data.id}/handwerker`)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 mb-3 flex items-center gap-1">
          ← Zurück
        </button>
        <h1 className="text-xl font-medium">Neues Ticket erstellen</h1>
        <p className="text-sm text-gray-500 mt-0.5">Schaden melden und passende Handwerker finden</p>
      </div>

      <Card className="mb-4">
        <div className="flex flex-col gap-4">
          <Input label="Titel / Schadensbeschreibung *" placeholder="z.B. Heizung ausgefallen"
            value={form.titel} onChange={e => set("titel", e.target.value)} />
          <Textarea label="Detailbeschreibung" placeholder="Was genau ist passiert? Wann ist es aufgetreten?"
            value={form.beschreibung} onChange={e => set("beschreibung", e.target.value)} />
          <Input label="Wohnung / Bereich" placeholder="z.B. Whg. 3 oder Treppenhaus"
            value={form.wohnung} onChange={e => set("wohnung", e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Gewerk *" value={form.gewerk} onChange={e => set("gewerk", e.target.value)}>
              {Object.entries(GEWERK_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
            <Select label="Dringlichkeit" value={form.prioritaet} onChange={e => set("prioritaet", e.target.value)}>
              <option value="normal">Normal (7 Tage)</option>
              <option value="hoch">Hoch (2–3 Tage)</option>
              <option value="dringend">Dringend (heute/morgen)</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="text-sm font-medium mb-3">Marktpreis-Einschätzung</h2>
        <div className="flex items-center gap-3 mb-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${pf.color}`}>
            {pf.label}
          </span>
          <span className="text-xs text-gray-400">
            Faktor {pf.faktor}× · {hwCount} Handwerker verfügbar
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 rounded-lg p-2.5">
            <div className="text-gray-400 mb-0.5">Dringlichkeit</div>
            <div className="font-medium text-gray-700">{pf.dringlichkeitsFaktor}×</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5">
            <div className="text-gray-400 mb-0.5">Verfügbarkeit</div>
            <div className="font-medium text-gray-700">{pf.angebotsFaktor}×</div>
          </div>
        </div>
        {hwCount === 0 && (
          <p className="text-xs text-amber-600 mt-3">
            Keine Handwerker für dieses Gewerk gefunden. Versuche „Allgemein" oder erstelle das Ticket trotzdem.
          </p>
        )}
      </Card>

      {hwPreview.length > 0 && (
        <Card className="mb-4">
          <h2 className="text-sm font-medium mb-3">
            Verfügbare Handwerker ({hwPreview.length})
          </h2>
          <div className="flex flex-col gap-2">
            {hwPreview.slice(0, 5).map(hw => {
              const richtpreis = berechneRichtpreis(hw.basis_preis || 50, pf.faktor)
              return (
                <div key={hw.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{hw.firma || hw.name}</div>
                    <div className="text-xs text-gray-500">
                      {hw.bewertung_avg ? `★ ${hw.bewertung_avg}` : "Neu"} · {hw.auftraege_anzahl || 0} Aufträge
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">~€ {richtpreis}</div>
                    <div className="text-xs text-gray-400">Richtpreis</div>
                  </div>
                </div>
              )
            })}
          </div>
          {hwPreview.length > 5 && (
            <p className="text-xs text-gray-400 mt-2 text-center">+ {hwPreview.length - 5} weitere</p>
          )}
        </Card>
      )}

      {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}

      <div className="flex gap-2">
        <Button onClick={handleCreate} disabled={loading}>
          {loading ? "Wird erstellt..." : "Weiter — Handwerker auswählen"}
        </Button>
        <Button variant="ghost" onClick={() => router.back()}>Abbrechen</Button>
      </div>
    </div>
  )
}
