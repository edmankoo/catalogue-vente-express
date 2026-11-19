import LegalLayout from '../../components/LegalLayout'
import { LEGAL, orToComplete } from '../../lib/legal'

export default function LegalNoticePage() {
  const isCompany = LEGAL.editorStatus === 'entreprise'

  return (
    <LegalLayout title="Mentions légales">
      <h2>Éditeur du site</h2>
      <p>
        {LEGAL.siteName} — {LEGAL.siteUrl}
      </p>
      <p>
        {isCompany ? 'Raison sociale' : 'Éditeur'} : {orToComplete(LEGAL.editorName)}
      </p>
      <p>Adresse : {orToComplete(LEGAL.editorAddress)}</p>
      <p>Email : {orToComplete(LEGAL.contactEmail)}</p>
      {LEGAL.contactPhone && <p>Téléphone : {LEGAL.contactPhone}</p>}
      {isCompany && (
        <>
          <p>SIRET : {orToComplete(LEGAL.siret)}</p>
          {LEGAL.vatNumber && <p>N° de TVA intracommunautaire : {LEGAL.vatNumber}</p>}
        </>
      )}
      <p>Directeur de la publication : {orToComplete(LEGAL.publicationDirector || LEGAL.editorName)}</p>

      <h2>Hébergement</h2>
      <ul>
        <li>
          Site : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis —{' '}
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
            vercel.com
          </a>
        </li>
        <li>
          Base de données et comptes utilisateurs : Supabase —{' '}
          <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
            supabase.com
          </a>
        </li>
      </ul>

      <h2>Objet du site</h2>
      <p>
        {LEGAL.siteName} présente des articles proposés à la vente par l'éditeur. Un visiteur peut
        consulter le catalogue ; un utilisateur connecté peut réserver un article ou une quantité
        d'articles. Une réservation n'est pas une vente : elle est conservée 72 heures, le temps que
        l'éditeur prenne contact par téléphone pour convenir de la vente. Aucun paiement n'est effectué
        sur le site.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les textes, photos et éléments du site sont la propriété de l'éditeur ou utilisés avec
        l'autorisation de leurs titulaires. Toute reproduction sans accord préalable est interdite.
      </p>

      <h2>Responsabilité</h2>
      <p>
        L'éditeur s'efforce de maintenir des informations exactes (descriptions, prix, disponibilité),
        mais ne peut garantir l'absence d'erreur ou d'indisponibilité temporaire du site. Les articles
        d'occasion sont vendus dans l'état décrit ; les caractéristiques sont précisées lors de la prise
        de contact.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement de vos données est détaillé dans la{' '}
        <a href="/confidentialite">politique de confidentialité</a>.
      </p>

      <h2>Droit applicable</h2>
      <p>Le site est soumis au droit français.</p>
    </LegalLayout>
  )
}
