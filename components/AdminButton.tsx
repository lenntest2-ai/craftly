"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"

export default function AdminButton() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from("profiles").select("rolle").eq("id", user.id).single()
      if (data?.rolle === "admin") setIsAdmin(true)
    }
    check()
  }, [])

  if (!isAdmin) return null

  return (
    <a href="/admin"
      className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white text-xs font-medium px-3 py-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors flex items-center gap-1.5"
      title="Zurück zur Admin-Übersicht">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
      Admin
    </a>
  )
}
