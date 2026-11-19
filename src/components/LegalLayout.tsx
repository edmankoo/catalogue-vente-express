import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LEGAL } from '../lib/legal'

interface Props {
  title: string
  children: ReactNode
}

export default function LegalLayout({ title, children }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-30 pt-safe">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-gray-500 hover:text-gray-800 text-lg" aria-label="Retour">
            ←
          </Link>
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <article className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-sm text-gray-600 leading-relaxed [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_h2]:mb-2 [&_h2:first-child]:mt-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_p+p]:mt-2 [&_a]:text-orange-600 [&_a]:underline">
          {children}
          <p className="mt-8 text-xs text-gray-400">Dernière mise à jour : {LEGAL.updatedAt}</p>
        </article>

        <nav className="mt-4 flex justify-center gap-4 text-xs text-gray-400">
          <Link to="/mentions-legales" className="hover:text-gray-600">
            Mentions légales
          </Link>
          <Link to="/confidentialite" className="hover:text-gray-600">
            Confidentialité
          </Link>
        </nav>
      </main>
    </div>
  )
}
