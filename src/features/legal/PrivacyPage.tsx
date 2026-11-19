import LegalLayout from '../../components/LegalLayout'
import { LEGAL, orToComplete } from '../../lib/legal'

export default function PrivacyPage() {
  const contact = orToComplete(LEGAL.contactEmail)

  return (
    <LegalLayout title="Politique de confidentialité">
      <h2>Qui est responsable de vos données ?</h2>
      <p>
        Le responsable du traitement est {orToComplete(LEGAL.editorName)}, éditeur de {LEGAL.siteName}{' '}
        (voir les <a href="/mentions-legales">mentions légales</a>). Contact pour toute question sur vos
        données : {contact}.
      </p>

      <h2>Quelles données sont collectées ?</h2>
      <ul>
        <li>À la création du compte : prénom, nom, numéro de téléphone, adresse email, mot de passe (conservé uniquement sous forme chiffrée, il n'est jamais lisible).</li>
        <li>Lors d'une réservation : l'article concerné, la quantité, la date et l'état de la réservation.</li>
        <li>Si vous activez les notifications : l'identifiant technique de votre appareil nécessaire pour vous envoyer les notifications.</li>
      </ul>

      <h2>Pourquoi ces données ?</h2>
      <ul>
        <li><strong>Gérer votre compte et vos réservations</strong> — nécessaire pour utiliser le service.</li>
        <li><strong>Vous rappeler par téléphone</strong> pour confirmer la vente : c'est la raison pour laquelle le numéro est obligatoire.</li>
        <li><strong>Vous envoyer des notifications</strong> sur les nouveaux articles, uniquement si vous les avez activées. Vous pouvez les désactiver à tout moment depuis l'application ou les réglages de votre appareil.</li>
      </ul>
      <p>
        Vos données ne sont ni vendues, ni utilisées pour de la publicité ou du suivi comportemental.
      </p>

      <h2>Qui peut voir vos données ?</h2>
      <ul>
        <li>L'éditeur du site (le vendeur), qui voit votre nom, téléphone, email et vos réservations.</li>
        <li>Nos prestataires techniques, qui agissent pour notre compte : Supabase (base de données et comptes) et Vercel (hébergement du site). Ils peuvent traiter des données en dehors de l'Union européenne, avec les garanties prévues par le RGPD (clauses contractuelles types).</li>
      </ul>

      <h2>Combien de temps ?</h2>
      <p>
        Vos données sont conservées tant que votre compte existe. Sur simple demande, votre compte et
        vos données sont supprimés.
      </p>

      <h2>Cookies et stockage local</h2>
      <p>
        Le site n'utilise aucun cookie publicitaire ni outil de mesure d'audience. Il enregistre
        seulement dans votre navigateur les informations techniques nécessaires à votre connexion
        (session) et au fonctionnement de l'application installée.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous pouvez demander à tout moment l'accès à vos données, leur rectification, leur suppression,
        la limitation ou l'opposition à leur traitement, ainsi que leur portabilité, en écrivant à{' '}
        {contact}. Une réponse vous est apportée dans un délai d'un mois.
      </p>
      <p>
        Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL :{' '}
        <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer">
          cnil.fr/fr/plaintes
        </a>
        .
      </p>
    </LegalLayout>
  )
}
