# Pathway research: Internationally Educated Nurse to Registered Nurse, Ontario (CNO)

Accessed: 2026-09-26. Primary source: College of Nurses of Ontario (CNO), "Outside Canada" registration guide (page last modified 2026-06-24) and "Timelines for registration processes" (last modified 2026-06-02). Everything marked **VERIFY** must be checked against the linked official page during Step 2 before it goes into `on-rn-ien.json`. Anything still unverified at Gate 4 ships with an "Estimate" badge.

## 1. Who this pathway covers (official)
- Graduated from a nursing program outside Canada, and
- Not currently registered as a nurse in the same category anywhere in Canada.
- Applies to non-Canadians and to Canadian citizens educated abroad.
- CNO does not accept other medical qualifications (e.g., a physician or midwife degree) as a basis for nurse registration. **Portage must say this plainly if the profile indicates a non-nursing credential.**
- Source: https://www.cno.org/become-a-nurse/registration-guides/outside-canada

## 2. The nine registration requirements (official)
1. Nursing education (approved or recognized baccalaureate for RN, diploma for RPN)
2. Evidence of practice (practised as a nurse in the same category within the past 3 years)
3. Registration examination (NCLEX-RN for RN, REx-PN for RPN)
4. Transition to Practice (e.g., a CNO-approved TTP course offered by Ontario schools)
5. Jurisprudence examination (online; laws, regulations, by-laws, standards)
6. Proficiency in English or French
7. Citizenship or immigration status authorizing nursing practice in Ontario
8. Past offences and findings (declaration + recent police criminal record check)
9. Health and conduct (declaration)

Source: Outside Canada guide, "Registration requirements" table.

## 3. Process facts that drive the engine (official)
| Fact | Value | Source |
|---|---|---|
| Overall guideline | Approximately 12 months, guideline only | Outside Canada guide |
| ECA before application | CNO must receive the report from an approved education credential assessment provider **before** you can submit your application | Timelines page |
| Application acknowledgement and review | Up to 15 days | Timelines page |
| Language evidence processed | Up to 15 days after CNO receives results or evidence | Timelines page |
| Registration exam result posted | Up to 5 days after CNO receives notice (results come from exam provider, not applicant) | Timelines page |
| Exam results from another nursing jurisdiction | Up to 15 days | Timelines page |
| Jurisprudence exam | Can be written any time after the application is opened; result within 24 hours | Timelines page |
| Police criminal record check processed | Up to 5 days | Timelines page |
| Criminal record check validity | 6 months from date of issue | Outside Canada guide |
| Transition to Practice processed | Up to 15 days after verification received | Timelines page |
| Authorization to work processed | Up to 15 days | Timelines page |
| Eligibility confirmed and registration | Immediate once all requirements are met, after paying the fee online | Timelines page |
| Application window | 2 years from opening and paying the fee; otherwise closed | Outside Canada guide |
| Documents from official sources | Must be sent directly to CNO by the source (e.g., employer verification of practice), not by the applicant | Outside Canada guide |
| Translation | All documents must be in English or French; translations by the source, a consulate/embassy, or an accredited translator, sent directly to CNO | Outside Canada guide |
| Name mismatch | Legal name change document required if any supporting document shows a different name | Outside Canada guide |
| Third parties | Applicant must complete and submit the application themselves; never share login or let anyone submit on their behalf | Outside Canada guide (notice) |
| Temporary Class | If applied for General Class but not yet meeting requirements, may apply for Temporary Class (if its requirements are met) to work while completing | Outside Canada guide |
| SPEP | Supervised Practice Experience Partnership: option to complete supervised practice in Ontario (evidence of practice route) | Outside Canada guide, further resources |
| Upgrading | Some Ontario colleges offer programs to update education/practice to meet evidence of practice | Outside Canada guide |
| Annual fee | Full year fee due on registration, not pro-rated | Outside Canada guide |

## 4. Warning rules (deterministic, from the facts above)
- `evidence_of_practice_window`: if `lastPractisedAt + 36 months` is before the projected parallel finish date, **critical**: "Your evidence of practice may expire before you finish." Offer SPEP and upgrading programs, link the Evidence of Practice page.
- `crc_validity`: criminal record check valid 6 months; the engine schedules it late. If the profile has a check dated more than 6 months before projected submission, **warn**.
- `application_window`: if weeks from `cno_application` finish to overall finish exceed 104, **warn** about the 2-year closure.
- `direct_from_source`: **info** on the third-party documents node: "These must be sent to CNO by your employer or regulator, not uploaded by you."
- `translation_needed`: if `documentsLanguage` is `other` or `mixed`, add the translations node and an **info** warning.
- `non_nursing_credential`: if the profile indicates a non-nursing health credential, **critical**: CNO does not accept other medical qualifications for nurse registration; link the guide.
- `authorization_unsure_or_no`: **info** only: "Registration requires authorization to practise in Canada. Portage does not give immigration advice." Link the Authorization to Work page. No further guidance.

## 5. Draft node graph (to become `on-rn-ien.json`)
Durations: `official` = CNO processing time from the Timelines page. `estimate` = applicant-side time, must cite where the estimate came from (provider page, course page) or be clearly marked as a team estimate.

| id | Title | Actor | Depends on | Duration (weeks) | Kind | Notes |
|---|---|---|---|---|---|---|
| `cno_account` | Create your CNO online account | you | none | 0 to 1 (typ 0.5) | estimate | Can start before arrival |
| `third_party_docs` | Ask your home regulator and employers to send verifications to CNO | third_party | none | **VERIFY** (team estimate wide range) | estimate | Start ASAP; can start before arrival; direct-from-source warning |
| `eca` | Validate your nursing education with a CNO-approved ECA provider | you, third_party | none | **VERIFY per provider** | estimate | Provider sends to CNO; can start before arrival |
| `translations` | Get accredited translations sent to CNO | third_party | none | **VERIFY** | estimate | Applies if documents are not EN/FR |
| `cno_application` | Submit your CNO application and fee | you, cno | `cno_account`, `eca` | 0 to 2.1 (typ 2.1) | official | "Up to 15 days" acknowledgement and review |
| `authorization_to_work` | Submit proof of authorization to practise | you, cno | `cno_application` | 0 to 2.1 | official | Recommended at application time |
| `language` | Meet the English or French requirement | you, test_provider, cno | none | test booking and results **VERIFY** + 2.1 official | mixed: split into `language_test` (estimate) and CNO processing (official) | Can start before arrival; **VERIFY** result validity window |
| `evidence_of_practice` | Show practice within the past 3 years | third_party, cno | `cno_application` | 0 to 2.1 | official | If expired: `blocked`, alternatives SPEP/upgrading |
| `ttp` | Complete Transition to Practice | you, school, cno | **VERIFY** (can the course be taken before applying?) | course length **VERIFY** + 2.1 official | mixed | Five ways to meet TTP exist per a secondary source; confirm on the official TTP page |
| `jurisprudence` | Pass the jurisprudence exam | you, cno | `cno_application` | prep **estimate** + result within 1 day | mixed | Online, any time after application is opened |
| `registration_exam` | Pass the NCLEX-RN | you, test_provider, cno | **VERIFY** eligibility trigger | prep **estimate** + 0.7 official | mixed | CNO does not accept results sent by the applicant |
| `criminal_record_check` | Get a police criminal record check | you, third_party, cno | `cno_application` | **VERIFY** issuance time + 0.7 official | mixed | `scheduleHint: late` (6-month validity) |
| `registration` | Complete registration and pay the annual fee | you, cno | all applicable nodes | 0 to 0.5 | official | Immediate once eligible; fee not pro-rated |

Optional side-lane nodes (shown as "While you wait", not on the critical path):
- `temporary_class`: apply for Temporary Class to work as a nurse while completing requirements (**VERIFY** eligibility).
- `bridge_role`: non-nursing roles in hospitals while working toward registration (e.g., London Health Sciences Centre hires IENs into non-nursing roles and partners with CARE Centre). Source: https://www.lhsc.on.ca/nursing/internationally-educated-nurses
- `support_orgs`: CARE Centre for Internationally Educated Nurses (https://care4nurses.org/), HealthForceOntario Access Centre, Occupation-Specific Language Training (http://co-oslt.org/en/).

## 6. VERIFY list (Step 2, in priority order for the demo)
1. **Fees**: https://www.cno.org/become-a-nurse/fees/application-membership-fees
2. **ECA providers and their posted processing times**: https://www.cno.org/become-a-nurse/approved-educational-credential-assessment-service-providers
3. **Transition to Practice**: ways to meet it and whether it can be done before applying: https://www.cno.org/become-a-nurse/registration-requirements/transition-to-practice and course list/length: https://www.cno.org/become-a-nurse/approved-nursing-programs/transition-to-practice-courses
4. **NCLEX-RN eligibility trigger and fees**: https://www.cno.org/become-a-nurse/examinations/registered-nurse-examinations
5. **Language proficiency**: accepted tests, minimum scores, result validity window: https://www.cno.org/become-a-nurse/registration-requirements/proficiency-in-english-or-french
6. **Evidence of practice + SPEP details**: https://www.cno.org/become-a-nurse/registration-requirements/evidence-of-practice
7. **Criminal record check**: when to submit, accepted types: https://www.cno.org/become-a-nurse/registration-requirements/past-offences-and-findings--health-and-conduct/police-criminal-record-check
8. **Temporary Class** requirements: https://www.cno.org/become-a-nurse/classes-of-registration/temporary-class
9. **Real aggregate numbers for the insights view**: https://www.cno.org/what-is-cno/nursing-demographics/applicant-statistics
10. **Exam results from other jurisdictions** (Marco persona): confirm on the registration exam page.

Secondary sources seen during research (useful for cross-checking only, never cite in the product):
- internationalhealthprofessionals.ca (lists five ways to meet TTP, accepted language tests)
- brandednurses.com (April 1, 2025 requirement changes summary)
- nursingmanthra.com (older NNAS-based flow; **outdated**: CNO now uses approved ECA providers, and asks pre-April-2025 ECA holders to have their provider send info to CNO)

## 7. Demo persona: Priya (composite, fictional)
- BSc Nursing, India. 8 years ICU experience. Last practised: July 2024 (paid ICU work), when she moved to Canada. Lives in Waterloo, ON. Authorized to work: yes. No language test yet. Nothing started with CNO. Documents partly in Hindi. Name on diploma includes a middle name missing from her passport (triggers name-change finding in the doc-check demo).
- Record her intake line in Hindi (script below), 30 to 45 seconds, native speaker, quiet room.

Suggested English script to translate for the recording:
"My name is Priya. I studied nursing in Pune and finished my bachelor's degree in 2014. I worked in an ICU for eight years. I stopped working in July 2024 when we moved to Canada. I live in Waterloo now and I can work here. I have not taken an English test yet. Some of my documents are in Hindi. I want to work as a nurse again."
