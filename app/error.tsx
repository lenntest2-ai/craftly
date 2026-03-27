"use client"

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="logo text-3xl mb-4">Craft<span className="text-[#1D9E75]">ly</span></div>
        <h1 className="text-xl font-medium text-gray-800 mb-2">Etwas ist schiefgelaufen</h1>
        <p className="text-sm text-gray-500 mb-6">
          Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
        </p>
        <button onClick={reset}
          className="bg-[#1D9E75] text-white font-medium px-5 py-2.5 rounded-lg hover:bg-[#0F6E56] transition-colors text-sm cursor-pointer">
          Erneut versuchen
        </button>
      </div>
    </div>
  )
}
