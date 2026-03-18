import FormPageEditor from '../form-page-editor';

export default function GateauxAdmin() {
  return (
    <FormPageEditor
      pageKey="gateaux"
      label="Gâteaux signatures / Signature Cakes"
      defaults={{
        heading: 'Gâteaux signatures / Signature Cakes',
        intro: 'Rhubarbe offre un service de gâteaux signatures pour les mariages et occasions spéciales.',
        menuNote: 'télécharger le menu (bientôt disponible)',
        contactNote: 'contactez-nous via le formulaire ci-dessous',
      }}
    />
  );
}
