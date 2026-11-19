// Informations légales de l'éditeur du site.
// À REMPLIR avec les informations d'Aymeric (ou de l'éditeur réel) avant
// de communiquer le site. Un champ laissé vide s'affiche « [À compléter] »
// sur les pages légales : rien d'inventé n'est publié.
export const LEGAL = {
  siteName: 'VenteExpress',
  siteUrl: 'https://catalogue-vente-express.vercel.app',

  // Nom et prénom de l'éditeur (ou raison sociale s'il s'agit d'une entreprise)
  editorName: '',
  // 'particulier' ou 'entreprise'
  editorStatus: 'particulier' as 'particulier' | 'entreprise',
  // Adresse postale (obligatoire pour une entreprise ; pour un particulier,
  // elle peut être remplacée par l'hébergeur si l'éditeur demande l'anonymat)
  editorAddress: '',
  // Adresse email de contact (sert aussi pour les demandes RGPD)
  contactEmail: '',
  contactPhone: '',
  // Entreprise uniquement
  siret: '',
  vatNumber: '',
  // Personne qui dirige la publication (en général l'éditeur lui-même)
  publicationDirector: '',

  // Date de dernière mise à jour des pages légales
  updatedAt: '2026-11-19',
}

export const TO_COMPLETE = '[À compléter]'

export function orToComplete(value: string): string {
  return value.trim() || TO_COMPLETE
}
