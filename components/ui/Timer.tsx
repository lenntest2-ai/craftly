"use client"
import { useEffect, useState } from "react"

export function Timer({ end }: { end: string }) {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    const calc = () => Math.max(0, Math.floor((new Date(end).getTime() - Date.now()) / 1000))
    setSecs(calc())
    const id = setInterval(() => setSecs(calc()), 1000)
    return () => clearInterval(id)
  }, [end])
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60
  const fmt = (n: number) => String(n).padStart(2, "0")
  if (secs === 0) return <span className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-medium">Abgelaufen</span>
  return <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium">â± {fmt(h)}:{fmt(m)}:{fmt(s)}</span>
}
