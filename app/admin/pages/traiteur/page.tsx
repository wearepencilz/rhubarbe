import FormPageEditor from '../form-page-editor';

export default function TraiteurAdmin() {
  return (
    <FormPageEditor
      pageKey="traiteur"
      label="Traiteur / Catering"
      defaults={{
        heading: 'Traiteur / Catering',
        intro: 'Rhubarbe offre un service de traiteur pour tous types d\'événements.',
        menuNote: 'télécharger le menu (bientôt disponible)',
        contactNote: 'contactez-nous via le formulaire ci-dessous',
      }}
    />
  );
}
