# Pathway verification: IEN to RN, Ontario (CNO)

Verification of the VERIFY list in `docs/PATHWAY_ON_RN_IEN.md` section 6. All pages accessed **2026-09-26**.
None of the CNO pages checked show a "last modified" date in their content, so the access date is the only date recorded.

Status legend:
- **CONFIRMED**: the number or rule is stated on the linked official page (CNO, or the provider's own page for provider fees and times).
- **PARTIAL**: the official page supports part of the fact; the rest is noted.
- **UNCONFIRMED**: could not be confirmed on an official page; what was tried is listed. Anything built on it ships as `kind: "estimate"`.

All CNO fees below are in CAD. The CNO fees page says all CNO fees are **subject to 13% HST**, and the jurisprudence page says "$40 plus applicable taxes", so amounts are listed **before HST**.

## 1. Fees

| Item | Value | Source | Status |
|---|---|---|---|
| CNO application fee, General Class (RN) | $433.00 in 2026, $454.00 in 2027, plus HST, non-refundable | https://www.cno.org/become-a-nurse/fees/application-membership-fees | CONFIRMED |
| CNO application fee, Temporary Class | $73.00 in 2026, $76.00 in 2027, plus HST | same | CONFIRMED |
| Jurisprudence exam fee | $40.00 in 2026, $42.00 in 2027, plus applicable taxes; covers unlimited attempts within 30 days of payment | fees page + https://www.cno.org/become-a-nurse/examinations/jurisprudence-examination | CONFIRMED |
| Initial registration fee (RN/RPN) | $69.00 in 2026, $72.00 in 2027, covers until Dec 31 of the year you register | fees page | CONFIRMED |
| Annual renewal fee (General/Temporary) | $368.00 in 2026, $386.00 in 2027, not pro-rated | fees page | CONFIRMED |
| Which fee is "the full registration fee for the year you become registered" in the Outside Canada guide | The guide says the fee is not pro-rated; the fees page lists the $69 initial registration fee "until December 31 of the year you become registered". Most likely the $69 fee, but the two pages do not name the same line item | Outside Canada guide + fees page | PARTIAL |
| NCLEX-RN registration fee (paid to Pearson, not CNO) | CAD $360 (excludes local taxes). From Feb 1, 2027: CAD $570. International scheduling fee CAD $150 if written outside Canada/US. Change of regulatory body CAD $50 | https://www.nclex.com/fees-payment.page | CONFIRMED |
| Competency Assessment Supplement (only if CNO finds education not substantially equivalent) | RN (French): $719.00 in 2026 | fees page | CONFIRMED (edge case, not modelled) |
| Police criminal record check (Sterling Backcheck) fee | Not published on the CNO page | CNO CRC page | UNCONFIRMED: tried the CNO page; the provider fee is shown only inside the Sterling Backcheck flow, which starts from the applicant portal |
| Language test fees | Not published by CNO; set by each test provider | CNO language page | UNCONFIRMED: not researched per provider (out of time box) |

## 2. Approved ECA providers

CNO must receive the ECA report **before** the applicant can submit the CNO application. Once the provider confirms it sent the information to CNO, the applicant may start the application. CNO still accepts NNAS expedited reports prepared by CGFNS (now TruMerit). People with an ECA from a listed provider dated before April 1, 2025 must follow their provider's instructions.
Source: https://www.cno.org/become-a-nurse/approved-educational-credential-assessment-service-providers

| Provider | Report for CNO | Posted processing time | Posted fee | Source | Status |
|---|---|---|---|---|---|
| WES | Document-by-Document (ICAP recommended), purpose "Licensing" | Document verification typically 2 weeks after all documents arrive, then DxD evaluation typically 1 week (complex up to 2 weeks) | DxD ICAP C$175, DxD Basic C$133, plus delivery C$14 to C$97 and 13% HST | https://www.wes.org/evaluations-and-fees/education/instructions-for-the-candidates-for-registration-with-the-college-of-nurses-of-ontario/ , https://www.wes.org/current-processing/ , https://wes.org/ca/evaluations-and-fees/professional-license-certification/business | CONFIRMED (fees read from the rendered WES page; the page is script-rendered and could not be cross-checked from raw HTML) |
| ICAS | General Assessment Report on official documents, transmitted to CNO | 8 to 10 weeks for a General Assessment Report after all documents are received | $132 (tax included) per the ICAS services page; a search snippet for the same site showed $165 for a "Postsecondary General Assessment Report" and mentions fee increases on Sept 1, 2026 | https://www.icascanada.ca/new/nursing-registration.aspx , https://www.icascanada.ca/new/main-application.aspx/services.aspx | Time CONFIRMED, fee UNCONFIRMED (two conflicting figures) |
| ICES (BCIT) | ECA, sent electronically to CNO | 7 weeks from receipt of all documents, including ECAs for CNO; no rush service | $200 per credential (new), $150 if you already hold an ICES ECA | https://www.bcit.ca/ices/processing-time/ , https://www.bcit.ca/ices/eca/service-fees/ | CONFIRMED |

Not included in any provider time: how long the nursing school takes to send documents to the provider. No official source for that; it is a team estimate.

## 3. Transition to Practice (TTP)

Ways to meet it (any one):
1. Canadian nursing degree or diploma completed within the past 3 years.
2. Current registration as a nurse in the same category in another Canadian jurisdiction.
3. Practice as a nurse in Canada within the past 3 years.
4. A CNO-approved TTP course, valid 5 years from completion.
5. The Education Pathway program offered by schools, valid 3 years from completion.

- Internationally educated applicants meet it by completing a TTP course. Courses are online, have no clinical component, and **typically run 7 to 14 weeks** (one term).
- **Can it be done before applying?** CNO's SPEP page states "The transition to practice course can be taken at any time." The TTP page itself does not say the course must follow the application. Treated as: can start before the CNO application.
- CNO processes the school's Verification of Course Completion within **up to 15 days** (Timelines page).
- Temporary Class practice does not count toward TTP.
- Approved providers (8): Centennial College, Conestoga College, Georgian College, Ontario IEN Course Consortium, Ontario Public College Consortium (all 24 public colleges), Seneca Polytechnic, Toronto Metropolitan University, University of Toronto.
- Sample course fees (provider pages): Conestoga NURS8963 **$390.00**, 42 hours, about 6 to 7 weeks, online asynchronous; Centennial NCNO-100 **$450.85**, about 14 to 16 weeks per section.

Sources: https://www.cno.org/become-a-nurse/registration-requirements/transition-to-practice , https://www.cno.org/become-a-nurse/approved-nursing-programs/transition-to-practice-courses , https://www.cno.org/become-a-nurse/registration-requirements/evidence-of-practice/supervised-practice-experience-partnership , https://continuing-education.conestogac.on.ca/courses/NURS8963 , https://secure.centennialcollege.ca/webreg/coursedetail.do?CourseCode=NCNO-100
Status: CONFIRMED (course fees are two samples, not an exhaustive list).

## 4. NCLEX-RN eligibility

- Eligibility: open an RN application on the Maintain Your Membership portal and **pay the application fee**; submit any accommodation request first. CNO sends a portal message when you are eligible, then you register and pay Pearson Professional Assessments, get an Authorization to Test (which expires), and book a seat.
- Results reach the applicant through the portal **within one week**; CNO updates the application **up to 5 days** after it receives the pass/fail notice. CNO does not accept results sent by the applicant.
- No limit on attempts; at least 45 days between attempts, up to 8 per year. The application stays open a maximum of 2 years.
- Can be written in person at a Pearson centre in Ontario, another province, or abroad (extra fee outside Canada/US).
- A criminal record check is **not** required before writing the registration or jurisprudence exam.

Sources: https://www.cno.org/become-a-nurse/examinations/registered-nurse-examinations , https://www.cno.org/become-a-nurse/timelines-for-registration-processes , CRC page.
Status: CONFIRMED.

## 5. Language proficiency

One form of evidence, gained **no more than 2 years before opening the application**, is enough:
- nursing education in English or French with a clinical component, in the past 2 years;
- practice as a nurse where English or French was a primary language, in the past 2 years (or SPEP);
- health care or health care support education or work in English or French in Canada, in the past 2 years;
- current or recent (past 2 years) registration as a nurse in a Canadian jurisdiction;
- an approved language test (results sent directly by the test organisation).

If the evidence expires before registration, CNO grants a **one-time 1-year extension** automatically.

| Test | Minimum scores | Accepted if written | Status |
|---|---|---|---|
| CELBAN | Reading 8, Writing 7, Listening 9, Speaking 8 | within 2 years before registering | CONFIRMED |
| IELTS General Training | Reading 6.5, Writing 6.5, Listening 7, Speaking 7, Overall 7 (One Skill Retake within 60 days accepted) | within 2 years before applying | CONFIRMED |
| IELTS Academic | same scores | within 2 years of registering | CONFIRMED |
| OET | Reading C+ (330), Writing C+ (320), Listening B (350), Speaking B (350) | within 2 years of registering | CONFIRMED |
| PTE Academic | Reading 66, Writing 68, Listening 73, Speaking 75 | within 2 years of registering | CONFIRMED |
| TEF Canada | Reading 400, Writing 400, Listening 400, Speaking 500 | 2 years before applying, or within 2 years of registering | CONFIRMED |
| TCF Canada | Reading 453, Writing 10, Listening 503, Speaking 12 | within 2 years before applying | CONFIRMED |

CNO processes test results up to 15 days after receiving them. Time to book a test and receive results is **not** on any CNO page: UNCONFIRMED, team estimate.
Source: https://www.cno.org/become-a-nurse/registration-requirements/proficiency-in-english-or-french , Timelines page.

## 6. Evidence of practice, SPEP and upgrading

- Evidence of practice = nursing practice (or nursing education with a clinical component) in the **past 3 years**, in the category applied for.
- **Since January 12, 2026**, practice outside Ontario only counts if it was **paid** nursing employment; volunteer practice no longer counts for initial registration. (New since the research doc; affects the product copy.)
- Proof: a Verification of Nursing Practice form sent **directly by the employer** to CNO, plus a Verification of Registration from the regulator where the applicant practised.
- If expired, CNO gives a status update and next steps within up to 15 days.
- RN options if not met: SPEP; paid nursing employment; specified additional education: **3 to 10 years** out of practice needs **400 hours** of clinical/consolidation experience plus listed course content, **10 to 15 years** needs **600 hours**.
- **SPEP**: partnership between CNO, Ontario Health and approved organisations. Eligible only when every other requirement is met except evidence of practice (optionally also language and/or TTP), and the evidence of practice expired **no more than 5 years** before applying to SPEP. Minimum **140 hours** of supervised practice with an RN or NP preceptor. CNO notifies eligible applicants through the portal. No SPEP fee is published on the CNO pages.
- Upgrading: some Ontario community colleges offer programs to update education or practice (no specific durations on the CNO page).

Sources: https://www.cno.org/become-a-nurse/registration-requirements/evidence-of-practice , https://www.cno.org/become-a-nurse/registration-requirements/evidence-of-practice/supervised-practice-experience-partnership , Outside Canada guide.
Status: CONFIRMED (no official SPEP duration in weeks; 140 hours is a minimum).

## 7. Police criminal record check

- Only **Sterling Backcheck** (a First Advantage company) checks are accepted, started from the CNO portal ("Start my police criminal record check"), using the same email as the CNO account. Paper checks and other online sources are not accepted unless CNO says so.
- Type: Canadian, international, or both, depending on residence history (table on the CNO page). Both requires asking CNO for a second link.
- **When**: CNO recommends getting it **closer to the end** of the registration process. Not needed before the registration or jurisprudence exams.
- 30 days to complete the check once started; valid **6 months** from issue; CNO processes a result within **up to 5 days**.

Source: https://www.cno.org/become-a-nurse/registration-requirements/past-offences-and-findings--health-and-conduct/police-criminal-record-check
Status: CONFIRMED.

## 8. Temporary Class

Requirements: nursing education approved/recognised in any jurisdiction; recent evidence of practice; jurisprudence exam passed; English or French proficiency; authorisation to work in Ontario; declarations on offences, findings, health and conduct; **an offer of employment from an approved facility** (hospitals, long-term care homes, boards of health, school boards, psychiatric facilities, CHCs, NP-led clinics, family health teams, post-secondary institutions, and others listed). **Not** required: the registration exam and TTP (TTP must still be met before moving to the General Class).
- Not eligible if you have already failed the registration exam **twice or more**. Registration ends at the expiry date CNO sets or at a second exam failure.
- Practice limits: approved employer only, monitored and directed by a General or Extended Class nurse, title "RN (Temp)", no controlled acts unless ordered, no RN prescribing, must hold professional liability protection.
- Fees: application $73.00 (2026) plus HST; annual fee $368.00 (2026).

Source: https://www.cno.org/become-a-nurse/classes-of-registration/temporary-class , fees page. Status: CONFIRMED.

## 9. Exam results from another jurisdiction ("Marco" persona)

- CNO's RN exam page: if you passed the NCLEX-RN before applying to CNO, "you may not need to write it again", but you must meet every other requirement and should contact CNO.
- Timelines page: CNO updates the application up to **15 days** after it receives results **from another nursing jurisdiction** (results must come from the jurisdiction or exam provider, never from the applicant).
- CNO counts all earlier attempts, wherever written, and applicants must disclose every attempt.
- Also accepted: Quebec Professional Examination (passed within 3 attempts), CRNE passed before January 2015 (within 3 attempts).

Sources: registered-nurse-examinations page, Timelines page, https://www.cno.org/become-a-nurse/registration-requirements/registration-examination
Status: **PARTIAL**. A prior NCLEX-RN pass generally carries over, with a 15-day CNO update once the other jurisdiction sends results. The wording "may not need", plus "contact CNO", means it is decided case by case. Model Marco's exam node as `done` only when `registrationExamPassed` is true, and show "Confirm with CNO".

Note: an automated summary of the Outside Canada guide claimed results "do not transfer". The raw page text contains no such sentence, so that claim is rejected.

## 10. Applicant statistics (real aggregate numbers for the insights view)

Active applicants to RPN General, RN General and RN Extended classes who live in Ontario and hold no current CNO registration, **as of September 1, 2026**:

| Application type | Count |
|---|---|
| Ontario | 5,842 |
| Canadian (outside Ontario) | 499 |
| International | 7,957 |
| Total | 14,298 |

SPEP since launch, **as of September 18, 2026**: 8,885 eligible applicants, 8,406 applied, 6,738 completed and registered.
Source: https://www.cno.org/what-is-cno/nursing-demographics/applicant-statistics . Status: CONFIRMED. These are real and can replace illustrative numbers for Ontario (label with the "as of" date). There is no stage-by-stage funnel, so the funnel stays illustrative.

## 11. CNO processing times (re-checked, Timelines page)

https://www.cno.org/become-a-nurse/timelines-for-registration-processes (note: the URL in the research doc, under `/registration-guides/`, now returns 404).

| Step | Official time |
|---|---|
| Application acknowledged and reviewed | up to 15 days (ECA report must already be at CNO) |
| Language evidence (education/work) processed | up to 15 days |
| Language test results processed | up to 15 days after receipt |
| Evidence of practice expired: status update | up to 15 days |
| Registration exam pass or fail recorded | up to 5 days after notice |
| Exam results from another nursing jurisdiction | up to 15 days |
| Jurisprudence result | up to 24 hours; can write any time after opening the application |
| Police criminal record check | up to 5 days |
| Transition to Practice verification | up to 15 days |
| Authorization to work | up to 15 days |
| Eligibility confirmed, then registration | immediate |

Outside Canada guide (https://www.cno.org/become-a-nurse/registration-guides/outside-canada): overall guideline approximately **12 months**; application closes **2 years** after CNO confirms receiving both application and fee; documents from official sources go **directly to CNO**; translations by the source, a consulate/embassy or a certified translator, sent directly to CNO; authorization to work can be sent any time (recommended at application); name changes need a written request. All CONFIRMED.

## 12. Estimates used in `on-rn-ien.json` and why

| Node | Estimate (min / typical / max weeks) | Basis |
|---|---|---|
| `cno_account` | 0 / 0.5 / 1 | Team estimate: online account creation; no official time |
| `school_documents` | 2 / 6 / 12 | Team estimate: time for the nursing school to send documents to the ECA provider; provider times start only after all documents arrive (WES, ICAS pages) |
| `third_party_docs` | 2 / 8 / 16 | Team estimate: depends on foreign employers and regulators; no official time published anywhere |
| `eca` | 3 / 7 / 10 | Provider-posted times: WES about 2 + 1 weeks, ICES 7 weeks, ICAS 8 to 10 weeks. The school's time to send documents is `school_documents` |
| `translations` | 1 / 3 / 6 | Team estimate; no official time |
| `language_test` | 2 / 4 / 8 | Team estimate for booking a seat and receiving results; unverified with test providers |
| `ttp_course` | 7 / 10 / 14 | CNO: courses typically 7 to 14 weeks; typical 10 is a team midpoint |
| `jurisprudence` | 0.5 / 1 / 4.3 | Team estimate for preparation; exam access lasts 30 days after payment (4.3 weeks, official) and the result arrives within 24 hours |
| `registration_exam` | 4 / 8 / 16 | Team estimate for eligibility message, preparation, booking and result (1 week, official); retakes need 45 days |
| `criminal_record_check` | 0.7 / 2 / 5 | Official: 30 days to complete once started, CNO processes within 5 days; typical 2 is a team estimate |

## 13. Side-lane ("While you wait") sources

Not scheduled; shown beside the plan. All accessed 2026-09-26.

| Node | Fact | Source | Status |
|---|---|---|---|
| `temporary_class` | Temporary Class requirements and limits (section 8); application fee $73 (2026) plus HST | https://www.cno.org/become-a-nurse/classes-of-registration/temporary-class | CONFIRMED |
| `bridge_role` | London Health Sciences Centre hires IENs into non-nursing roles while they work toward CNO registration, partners with CARE Centre, and hosts SPEP | https://www.lhsc.on.ca/nursing/internationally-educated-nurses | CONFIRMED |
| `support_orgs` | CARE Centre: free case management, exam prep and mentoring (funded by IRCC and Ontario); STARS program for IENs living in Ontario | https://care4nurses.org/ | CONFIRMED |
| `support_orgs` | Occupation-Specific Language Training: free health care communication courses at Ontario public colleges for eligible newcomers (PR, protected persons and others; CLB 5+) | https://www.co-oslt.org/en/ | CONFIRMED |
| HealthForceOntario Access Centre (listed in the research doc) | Not added: not re-verified that the service still exists | - | UNCONFIRMED |
