// src/services/franchiseAgreement.service.ts
import { api, type FranchiseAgreement, type Paged } from '@drivn-cook/shared';

// ---- Types d'entrée (compat ascendante) ----
type BaseAgreementInput = {
  franchiseeId: string;          // doit être un UUID si le back l'exige
  startDate: string;             // 'YYYY-MM-DD' (z.coerce.date() le parse)
  endDate?: string | null;
  notes?: string | null;
};

type LegacyAmounts = {
  entryFeeAmount: string;        // ignoré avant, mais le back les exige -> on force depuis le service
  revenueSharePct: string;
};

// Montants imposés par ta politique
const AGREEMENT_ENTRY_FEE_EUR = 50_000;  // 50 000 €
const AGREEMENT_REV_SHARE = 0.04;        // 4% (entre 0 et 1)

export async function createFranchiseAgreement(input: BaseAgreementInput): Promise<FranchiseAgreement>;
export async function createFranchiseAgreement(input: BaseAgreementInput & LegacyAmounts): Promise<FranchiseAgreement>;

// Implémentation unique
export async function createFranchiseAgreement(input: BaseAgreementInput & Partial<LegacyAmounts>) {
  // ⚠️ Envoie ce que ton schéma Zod EXIGE
  const payload = {
    franchiseeId: input.franchiseeId,
    startDate: input.startDate,                 // 'YYYY-MM-DD' accepté par z.coerce.date()
    ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
    ...(input.notes   !== undefined ? { notes: input.notes }     : {}),
    entryFeeAmount: AGREEMENT_ENTRY_FEE_EUR,    // ✅ requis par le schéma
    revenueSharePct: AGREEMENT_REV_SHARE,       // ✅ requis par le schéma (0..1)
  };

  const res = await api.post<FranchiseAgreement>('/franchise-agreements', payload);
  return res.data;
}

export async function listFranchiseAgreements(params: {
  franchiseeId: string;
  page?: number;
  pageSize?: number;
}) {
  const res = await api.get<Paged<FranchiseAgreement>>('/franchise-agreements', { params });
  return res.data;
}

export async function downloadFranchiseAgreementPdf(params: {
  franchiseeId: string;
  agreementId: string;
  filename?: string;
}) {
  const { agreementId, filename = 'Contrat.pdf' } = params;
  const res = await api.get(`/franchise-agreements/${encodeURIComponent(agreementId)}/pdf`, {
    responseType: 'blob',
  });

  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function deleteFranchiseAgreement(params: {
  franchiseeId: string;
  agreementId: string;
}) {
  await api.delete(`/franchise-agreements/${encodeURIComponent(params.agreementId)}`);
  return true;
}
