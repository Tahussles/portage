import { addMonths, toUtcDate, tryUtcDate } from "./dates";
import type { DocExtraction, DocFinding, Plan, Profile } from "./types";

// Deterministic document rules (PLAN.md Step 6). Every rule comes from a CNO page listed in
// docs/PATHWAY_VERIFIED.md. The model never produces findings; it only extracts fields.

const SRC = {
  outsideCanada: "https://www.cno.org/become-a-nurse/registration-guides/outside-canada",
  evidenceOfPractice: "https://www.cno.org/become-a-nurse/registration-requirements/evidence-of-practice",
  eca: "https://www.cno.org/become-a-nurse/approved-educational-credential-assessment-service-providers",
  language: "https://www.cno.org/become-a-nurse/registration-requirements/proficiency-in-english-or-french",
  policeCheck:
    "https://www.cno.org/become-a-nurse/registration-requirements/past-offences-and-findings--health-and-conduct/police-criminal-record-check",
};

const MONTHS = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juill.", "août", "sept.", "oct.", "nov.", "déc."],
};
const month = (d: Date, locale: "en" | "fr") => `${MONTHS[locale][d.getUTCMonth()]} ${d.getUTCFullYear()}`;

/** Lowercase, accent-free name tokens, so "Priya A. Deshpande" and "PRIYA DESHPANDE" compare fairly. */
export function nameTokens(name: string): string[] {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\s'-]/gu, " ")
    .split(/[\s'-]+/)
    .filter((t) => t.length > 1);
}

function sameName(a: string, b: string): boolean {
  const x = [...new Set(nameTokens(a))].sort().join(" ");
  const y = [...new Set(nameTokens(b))].sort().join(" ");
  return x.length > 0 && x === y;
}

export type DocRuleInput = {
  extraction: DocExtraction;
  today: string | Date;
  profile?: Profile | null;
  plan?: Plan | null;
  /** Legal name as on the passport, typed by the applicant. */
  legalName?: string | null;
};

const ORDER: Record<DocFinding["severity"], number> = { critical: 0, warn: 1, info: 2, ok: 3 };

export function docRules({ extraction, today, profile, plan, legalName }: DocRuleInput): DocFinding[] {
  const now = toUtcDate(today);
  const findings: DocFinding[] = [];
  const add = (f: DocFinding) => findings.push(f);

  // 1. Who must send this document.
  switch (extraction.docType) {
    case "employment_letter":
      add({
        id: "must_come_from_employer",
        severity: "critical",
        title: { en: "Must be sent directly by your employer", fr: "Doit être envoyé directement par votre employeur" },
        body: {
          en: "CNO only accepts employment verifications, job descriptions and reference letters sent directly by your employer. Ask your employer to send it to CNO. Uploading it yourself does not count.",
          fr: "L'OIIO n'accepte que les attestations d'emploi, descriptions de poste et lettres de référence envoyées directement par votre employeur. Demandez à votre employeur de l'envoyer à l'OIIO. Le téléverser vous-même ne compte pas.",
        },
        relatedNodes: ["third_party_docs", "evidence_of_practice"],
        sourceUrl: SRC.outsideCanada,
      });
      break;
    case "registration_verification":
    case "nursing_licence":
      add({
        id: "must_come_from_regulator",
        severity: "critical",
        title: { en: "Must be sent directly by your regulator", fr: "Doit être envoyé directement par votre ordre professionnel" },
        body: {
          en: "CNO needs a Verification of Registration form sent directly by the nursing regulator where you practised. A copy of your licence uploaded by you does not count.",
          fr: "L'OIIO exige un formulaire de vérification de l'inscription envoyé directement par l'ordre infirmier où vous avez exercé. Une copie de votre permis téléversée par vous ne compte pas.",
        },
        relatedNodes: ["third_party_docs", "evidence_of_practice"],
        sourceUrl: SRC.evidenceOfPractice,
      });
      break;
    case "education_transcript":
    case "diploma":
      add({
        id: "school_sends_to_eca",
        severity: "info",
        title: { en: "Your school sends this to the assessment provider", fr: "Votre école l'envoie au fournisseur d'évaluation" },
        body: {
          en: "Education documents go from your school to WES, ICAS or ICES, following the provider's rules. The provider then sends its report to CNO.",
          fr: "Les documents scolaires sont envoyés par votre école à WES, à ICAS ou à ICES, selon les règles du fournisseur. Le fournisseur envoie ensuite son rapport à l'OIIO.",
        },
        relatedNodes: ["school_documents", "eca"],
        sourceUrl: SRC.eca,
      });
      break;
    case "language_test_report": {
      add({
        id: "test_centre_sends_results",
        severity: "info",
        title: { en: "Results must come from the test centre", fr: "Les résultats doivent venir du centre d'examen" },
        body: {
          en: "CNO only accepts language test results sent directly by the test centre or test organization.",
          fr: "L'OIIO n'accepte que les résultats envoyés directement par le centre d'examen ou l'organisme responsable du test.",
        },
        relatedNodes: ["language_test", "language"],
        sourceUrl: SRC.language,
      });
      const tested = tryUtcDate(extraction.issueDate);
      if (tested && addMonths(tested, 24) < now) {
        add({
          id: "language_test_old",
          severity: "warn",
          title: { en: "This test may be too old", fr: "Ce test est peut-être trop ancien" },
          body: {
            en: "CNO accepts language evidence from the past 2 years; the exact window depends on the test. Check the rules for your test before relying on it.",
            fr: "L'OIIO accepte une preuve de compétence linguistique datant des 2 dernières années; la période exacte dépend du test. Vérifiez les règles de votre test avant de vous y fier.",
          },
          relatedNodes: ["language_test"],
          sourceUrl: SRC.language,
        });
      }
      break;
    }
  }

  // 2. Police check: provider and 6-month validity.
  if (extraction.docType === "criminal_record_check") {
    if (!/sterling|backcheck|first advantage/i.test(extraction.issuer ?? "")) {
      add({
        id: "crc_provider",
        severity: "warn",
        title: { en: "CNO only accepts Sterling Backcheck checks", fr: "L'OIIO n'accepte que les vérifications de Sterling Backcheck" },
        body: {
          en: "Start your police check from your CNO portal through Sterling Backcheck. Paper checks and other online checks are not accepted unless CNO asks for them.",
          fr: "Lancez votre vérification policière à partir de votre portail de l'OIIO, par l'intermédiaire de Sterling Backcheck. Les vérifications papier et les autres vérifications en ligne ne sont pas acceptées, sauf si l'OIIO les demande.",
        },
        relatedNodes: ["criminal_record_check"],
        sourceUrl: SRC.policeCheck,
      });
    }
    const issued = tryUtcDate(extraction.issueDate);
    if (issued) {
      const expires = addMonths(issued, 6);
      const finish = plan ? toUtcDate(plan.parallel.finishDate) : null;
      if (expires < now) {
        add({
          id: "crc_expired",
          severity: "critical",
          title: { en: "This police check has expired", fr: "Cette vérification policière est expirée" },
          body: {
            en: `A police check is valid for 6 months. This one expired in ${month(expires, "en")}. Get a new one near the end of your process.`,
            fr: `Une vérification policière est valide pendant 6 mois. Celle-ci a expiré en ${month(expires, "fr")}. Obtenez-en une nouvelle vers la fin de votre démarche.`,
          },
          relatedNodes: ["criminal_record_check"],
          sourceUrl: SRC.policeCheck,
        });
      } else if (finish && expires < finish) {
        add({
          id: "crc_expires_early",
          severity: "warn",
          title: { en: "Too early: it will expire before you register", fr: "Trop tôt : elle expirera avant votre inscription" },
          body: {
            en: `A police check is valid for 6 months. This one expires in ${month(expires, "en")}, but your plan finishes around ${month(finish, "en")}. Get it near the end of your process.`,
            fr: `Une vérification policière est valide pendant 6 mois. Celle-ci expire en ${month(expires, "fr")}, mais votre plan se termine vers ${month(finish, "fr")}. Obtenez-la vers la fin de votre démarche.`,
          },
          relatedNodes: ["criminal_record_check"],
          sourceUrl: SRC.policeCheck,
        });
      } else {
        add({
          id: "crc_valid",
          severity: "ok",
          title: { en: "Valid for 6 months from its issue date", fr: "Valide pendant 6 mois à compter de sa délivrance" },
          body: {
            en: `This check is valid until ${month(expires, "en")}.${finish ? " That covers your projected registration." : ""}`,
            fr: `Cette vérification est valide jusqu'en ${month(expires, "fr")}.${finish ? " Cela couvre votre inscription prévue." : ""}`,
          },
          relatedNodes: ["criminal_record_check"],
          sourceUrl: SRC.policeCheck,
        });
      }
    }
  }

  // 3. Language of the document.
  const lang = extraction.documentLanguage?.toLowerCase() ?? null;
  if (lang === "en" || lang === "fr") {
    add({
      id: "language_ok",
      severity: "ok",
      title: { en: "In English or French", fr: "En anglais ou en français" },
      body: { en: "No translation needed.", fr: "Aucune traduction n'est nécessaire." },
      relatedNodes: [],
      sourceUrl: SRC.outsideCanada,
    });
  } else if (lang) {
    add({
      id: "translation_needed",
      severity: "warn",
      title: { en: "Needs a certified translation", fr: "Nécessite une traduction certifiée" },
      body: {
        en: "Documents not in English or French must be translated by the source, a consulate or embassy, or a certified translator, and sent directly to CNO.",
        fr: "Les documents qui ne sont ni en anglais ni en français doivent être traduits par la source, un consulat ou une ambassade, ou un traducteur agréé, puis envoyés directement à l'OIIO.",
      },
      relatedNodes: ["translations"],
      sourceUrl: SRC.outsideCanada,
    });
  }

  // 4. Name on the document vs legal name.
  const docName = extraction.nameOnDocument?.trim();
  const legal = legalName?.trim();
  if (docName && legal) {
    if (sameName(docName, legal)) {
      add({
        id: "name_matches",
        severity: "ok",
        title: { en: "Name matches your passport", fr: "Le nom correspond à votre passeport" },
        body: { en: `"${docName}"`, fr: `« ${docName} »` },
        relatedNodes: [],
        sourceUrl: SRC.outsideCanada,
      });
    } else {
      add({
        id: "name_mismatch",
        severity: "warn",
        title: { en: "Name differs from your passport", fr: "Le nom diffère de celui de votre passeport" },
        body: {
          en: `This document says "${docName}", your passport says "${legal}". Tell CNO about the difference in writing, with a legal name change document if you have one.`,
          fr: `Ce document indique « ${docName} », votre passeport indique « ${legal} ». Signalez cet écart par écrit à l'OIIO, avec un document de changement de nom officiel si vous en avez un.`,
        },
        relatedNodes: ["cno_application"],
        sourceUrl: SRC.outsideCanada,
      });
    }
  } else if (profile?.nameOnDocumentsMatches === false) {
    add({
      id: "name_mismatch",
      severity: "warn",
      title: { en: "Check the name on your documents", fr: "Vérifiez le nom sur vos documents" },
      body: {
        en: "You said your documents do not all show the same name. Tell CNO about the difference in writing, with a legal name change document if you have one.",
        fr: "Vous avez indiqué que vos documents ne portent pas tous le même nom. Signalez cet écart par écrit à l'OIIO, avec un document de changement de nom officiel si vous en avez un.",
      },
      relatedNodes: ["cno_application"],
      sourceUrl: SRC.outsideCanada,
    });
  }

  return findings.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
}
