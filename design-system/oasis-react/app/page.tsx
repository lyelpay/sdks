"use client";

import { useState } from "react";
import {
  OasisButton,
  OasisAlert,
  OasisInput,
  OasisCard,
  OasisContainer,
  OasisAccordion,
  OasisAvatar,
  OasisBadge,
  OasisBreadcrumbs,
  OasisDivider,
  OasisDropdown,
  OasisModal,
  OasisPopover,
  OasisTooltip,
  OasisProgress,
  OasisTabs,
  OasisButtonGroup,
  OasisGrid,
  OasisHeading,
  OasisText,
  OasisLink,
  OasisList,
  OasisPagination,
  OasisTextarea,
  OasisSelect,
  OasisCheckbox,
  OasisRadio,
  OasisSwitch,
  OasisTable,
  OasisEmptyState,
  OasisSkeleton,
  OasisDrawer,
  useOasisToast,
} from "@/src";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const showToast = useOasisToast();

  return (
    <OasisContainer
      style={{ paddingTop: "var(--oasis-spacing-8)", paddingBottom: "var(--oasis-spacing-8)" }}
    >
      <OasisHeading level={1}>Oasis React</OasisHeading>
      <div style={{ marginBottom: "var(--oasis-spacing-8)" }}>
        <OasisText>
          Composants <code>@lyel/oasis-react</code> – Next 16, CVE-safe, responsive. Tokens
          inchangés.
        </OasisText>
      </div>

      <section style={{ marginBottom: "var(--oasis-spacing-10)" }}>
        <OasisHeading level={2}>Boutons</OasisHeading>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--oasis-spacing-3)" }}>
          <OasisButton variant="primary">Primary</OasisButton>
          <OasisButton variant="secondary">Secondary</OasisButton>
          <OasisButton variant="outline">Outline</OasisButton>
          <OasisButton variant="ghost">Ghost</OasisButton>
          <OasisButton variant="destructive">Destructive</OasisButton>
        </div>
        <div style={{ marginTop: "var(--oasis-spacing-4)" }}>
          <OasisButtonGroup>
            <OasisButton variant="outline" size="sm">
              Annuler
            </OasisButton>
            <OasisButton variant="primary" size="sm">
              Enregistrer
            </OasisButton>
          </OasisButtonGroup>
        </div>
      </section>

      <section style={{ marginBottom: "var(--oasis-spacing-10)" }}>
        <OasisHeading level={2}>Alertes</OasisHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--oasis-spacing-3)" }}>
          <OasisAlert variant="success" title="Succès">
            Opération réussie.
          </OasisAlert>
          <OasisAlert variant="warning" title="Attention">
            Vérifiez les champs.
          </OasisAlert>
          <OasisAlert variant="error" title="Erreur">
            Une erreur est survenue.
          </OasisAlert>
          <OasisAlert variant="info" title="Info">
            Tokens depuis @lyel/oasis.
          </OasisAlert>
        </div>
      </section>

      <section style={{ marginBottom: "var(--oasis-spacing-10)" }}>
        <OasisHeading level={2}>Accordion, Avatar, Badge, Breadcrumbs</OasisHeading>
        <div style={{ marginBottom: "var(--oasis-spacing-4)" }}>
          <OasisBreadcrumbs items={[{ label: "Accueil", href: "#" }, { label: "Composants" }]} />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--oasis-spacing-4)",
            marginBottom: "var(--oasis-spacing-4)",
          }}
        >
          <OasisAvatar fallback="AB" size="sm" />
          <OasisAvatar fallback="CD" size="md" />
          <OasisAvatar fallback="EF" size="lg" />
          <OasisBadge variant="primary">Badge</OasisBadge>
          <OasisBadge variant="secondary">Count</OasisBadge>
        </div>
        <OasisAccordion
          items={[
            { value: "a", trigger: "Section 1", children: "Contenu 1." },
            { value: "b", trigger: "Section 2", children: "Contenu 2." },
          ]}
        />
      </section>

      <section style={{ marginBottom: "var(--oasis-spacing-10)" }}>
        <OasisHeading level={2}>Dropdown, Modal, Popover, Tooltip</OasisHeading>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--oasis-spacing-3)" }}>
          <OasisDropdown
            trigger={<OasisButton variant="outline">Menu</OasisButton>}
            items={[
              { label: "Action 1", onClick: () => {} },
              { label: "Supprimer", danger: true, onClick: () => {} },
            ]}
          />
          <OasisButton variant="outline" onClick={() => setModalOpen(true)}>
            Ouvrir modal
          </OasisButton>
          <OasisModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Titre modal"
            footer={
              <OasisButton size="sm" onClick={() => setModalOpen(false)}>
                Fermer
              </OasisButton>
            }
          >
            Contenu du modal.
          </OasisModal>
          <OasisPopover trigger={<OasisButton variant="ghost">Popover</OasisButton>}>
            <OasisText>Contenu du popover.</OasisText>
          </OasisPopover>
          <OasisTooltip content="Info au survol">
            <OasisButton variant="ghost">Survol</OasisButton>
          </OasisTooltip>
        </div>
      </section>

      <section style={{ marginBottom: "var(--oasis-spacing-10)" }}>
        <OasisHeading level={2}>Progress, Tabs</OasisHeading>
        <div style={{ marginBottom: "var(--oasis-spacing-4)" }}>
          <OasisProgress value={60} max={100} />
        </div>
        <OasisTabs
          items={[
            { value: "tab1", label: "Onglet 1", panel: <OasisText>Contenu onglet 1.</OasisText> },
            { value: "tab2", label: "Onglet 2", panel: <OasisText>Contenu onglet 2.</OasisText> },
          ]}
        />
      </section>

      <section style={{ marginBottom: "var(--oasis-spacing-10)" }}>
        <OasisHeading level={2}>Formulaires</OasisHeading>
        <div
          style={{
            maxWidth: 400,
            display: "flex",
            flexDirection: "column",
            gap: "var(--oasis-spacing-4)",
          }}
        >
          <OasisInput label="Email" placeholder="vous@exemple.com" type="email" />
          <OasisInput
            label="Mot de passe"
            placeholder="••••••••"
            type="password"
            error="Mot de passe requis."
          />
          <OasisTextarea label="Message" placeholder="Votre message" />
          <OasisSelect
            label="Choix"
            options={[
              { value: "a", label: "Option A" },
              { value: "b", label: "Option B" },
            ]}
            placeholder="Sélectionner"
          />
          <OasisCheckbox label="Accepter les conditions" />
          <OasisRadio name="r" value="1" label="Option 1" />
          <OasisRadio name="r" value="2" label="Option 2" />
          <OasisSwitch checked={true} onCheckedChange={() => {}} label="Activer" />
        </div>
      </section>

      <section style={{ marginBottom: "var(--oasis-spacing-10)" }}>
        <OasisHeading level={2}>Table, List, Grid</OasisHeading>
        <div style={{ marginBottom: "var(--oasis-spacing-4)" }}>
          <OasisTable
            columns={[
              { key: "name", header: "Nom", cellKey: "name" },
              { key: "role", header: "Rôle", cellKey: "role" },
            ]}
            data={[
              { name: "Alice", role: "Admin" },
              { name: "Bob", role: "User" },
            ]}
          />
        </div>
        <OasisList items={["Item 1", "Item 2", "Item 3"]} striped />
        <OasisDivider />
        <div style={{ marginTop: "var(--oasis-spacing-4)" }}>
          <OasisGrid cols={2}>
            <OasisCard header="Carte 1">Contenu.</OasisCard>
            <OasisCard header="Carte 2">Contenu.</OasisCard>
          </OasisGrid>
        </div>
      </section>

      <section style={{ marginBottom: "var(--oasis-spacing-10)" }}>
        <OasisHeading level={2}>Empty, Skeleton, Drawer, Pagination, Toast</OasisHeading>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--oasis-spacing-3)" }}>
          <OasisEmptyState
            title="Aucune donnée"
            description="Ajoutez un élément."
            action={<OasisButton size="sm">Ajouter</OasisButton>}
          />
          <OasisSkeleton width={200} height={24} />
          <OasisButton variant="outline" onClick={() => setDrawerOpen(true)}>
            Ouvrir drawer
          </OasisButton>
          <OasisDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            title="Tiroir"
            side="right"
          >
            <OasisText>Contenu du drawer.</OasisText>
          </OasisDrawer>
          <OasisPagination page={page} totalPages={5} onPageChange={setPage} />
          <OasisButton variant="primary" onClick={() => showToast("Toast affiché !", "success")}>
            Afficher toast
          </OasisButton>
        </div>
      </section>
    </OasisContainer>
  );
}
