# v39 source notes - Starlink enforcement verification and legal opacity

Observed: 2026-05-02T04:30:00Z.

Question tested:
- `q:iran-cracks:20260502:cf0d5ab8`: Can court records, direct police releases, family reports, or lawyer statements verify the Starlink prosecutions, account freezes, and alleged espionage facts beyond state media wording?

Searches, crawls, and datasets:
- `exa17-fa-starlink-yousefabad-spy-base.json`
- `exa17-fa-starlink-fereshteh-arrest-police.json`
- `exa17-fa-starlink-commercial-sealing.json`
- `exa17-fa-starlink-court-account-freeze.json`
- `exa17-fa-starlink-yazd-ilna-direct.json`
- `exa17-fa-starlink-yazd-accounts-law.json`
- `exa17-fa-starlink-prosecutor-indictment.json`
- `exa17-fa-starlink-lawyer-family.json`
- `exa17-fa-starlink-yazd-fars-direct.json`
- `crawl17-mojnews-starlink-fereshteh.txt`
- `crawl17-mojnews-starlink-yousefabad.txt`
- `crawl17-khabaronline-starlink-commercial-complex.txt`
- `crawl17-ilna-radan-139-starlinks-48-arrests.txt`
- `crawl17-ilna-intelligence-hundreds-starlink.txt`
- `crawl17-bartarinha-yazd-61-accounts.txt`
- `crawl17-tabnak-starlink-law-article.txt`
- `exa17-fa-hossam-aladdin-iranwire-starlink.json`
- `exa17-en-hossam-aladdin-starlink.json`
- `exa17-fa-hossam-aladdin-custody-death.json`
- `exa17-fa-hossam-aladdin-iranintl.json`
- `exa17-fa-hossam-iranwire-exact.json`
- `exa17-fa-hossam-date-error-iranwire.json`
- `exa17-en-hossam-aladdin-nypost-direct.json`
- `crawl17-iranwire-hossam-aladdin-starlink-death.txt`
- `crawl17-iranintl-hossam-aladdin-starlink-death.txt`
- `crawl17-gooya-iranwire-hossam-aladdin-starlink-death.txt`
- `xpool-starlink-verification-v39-result.json`

Canonical rows reused:
- `claim:iran-cracks:20260502:97e4c686` - Tehran Starlink enforcement across Fereshteh, three northwest-Tehran guild units, and Yusefabad, explicitly marked contested on espionage allegations.
- `src:iran-cracks:20260502:0b5f48f4` - ILNA Fereshteh arrest/police statement.
- `src:iran-cracks:20260502:ba01e74a` - KhabarOnline/ISNA northwest-Tehran commercial complex sealing.
- `src:iran-cracks:20260502:5ab1fb5e` - Jamejam Yusefabad Starlink-equipped spy-base police statement.
- `claim:iran-cracks:20260502:8a9c8abb` - professional refusal coalition against Internet Pro / tiered internet.

Findings:
- The Fereshteh, northwest-Tehran commercial complex, and Yusefabad leads all trace back to Tehran police / FARAJA information-center wording repeated through ILNA, ISNA/KhabarOnline, MojNews, SNN/Tasnim/Vista, Jamejam, and other outlets.
- v39 searches for `دادگاه`, `دادسرا`, `کیفرخواست`, `وکیل`, `خانواده`, and related terms did not surface court records, indictments, named defense counsel, family statements, or independent evidence verifying the espionage facts behind those police claims.
- ILNA carried a 30 Mar police/Radan report saying that since the war began police had arrested 48 main terrorist/spy-network actors and separately identified/arrested 46 networked Starlink sellers across 19 provinces, with 139 Starlink devices/routers seized.
- ILNA carried a 17 Mar Ministry of Intelligence statement saying hundreds of enemy-sent Starlink systems had been identified/seized and that unlawful Starlink systems would continue to be tracked, with wartime use treated as deserving the harshest punishment for enemy-linked offenders.
- Bartarinha/Fars reported a Yazd police lead: 6 Starlink devices, 6 suspects, 61 bank accounts blocked, and referral to the provincial prosecutor after "judicial coordination." This is useful for account-freeze mechanics but still police/Fars mediated.
- Tabnak/Mehr's legal explainer says Article 5 of the 1404 intensified espionage/cooperation law criminalizes unauthorized satellite-internet tools: personal use/carrying/holding/buying/selling/import gets degree-6 imprisonment and equipment seizure; distribution/installation/import for distribution gets degree-5; intent to confront the system or espionage can trigger very severe penalties including execution or degree-4 imprisonment; wartime/security conditions can increase punishment.
- IranWire and Iran International both reported on 1 May that Hossam Aladdin/Aladdin, about 40 and linked to the Aladdin mall family, died after a Starlink-related arrest/search/beating. IranIntl attributes its details to a received message. IranWire says it learned from sources, but the article contains an impossible burial-date line: "Wednesday 9 Esfand 1405" inside an 11 Ordibehesht 1405 article. Treat the Hossam report as high-importance and contested until family/lawyer/official confirmation appears.
- xPool job `faf52831-b679-47ea-b803-d28f9a0f4467` reached target after 8 pages and emitted 160 items. Keyword/manual review found 68 Hossam/Aladdin-coded posts, 16 judicial/lawyer/prosecutor-coded posts, 26 official-enforcement/place/account-coded posts, and 12 skepticism or alternative-motive posts. The sample was dominated by Hossam amplification and did not surface direct court records or family/lawyer verification.

Read:
- v39 strengthens the enforcement side: Starlink is no longer just a few Tehran anecdotes; official policing claims now span Tehran, Yazd, Qom, border interdiction, national seller networks, and intelligence-ministry tracking.
- The legal-evidence side remains weak: the public record is still mostly police/intelligence statements and media repetition, not case files, court records, lawyers, family confirmation, or independent forensic evidence.
- The Hossam Aladdin report is the politically explosive edge case. If confirmed, Starlink enforcement has crossed from access-control into death-in-custody martyr terrain. Current evidence is not strong enough to mark it confirmed.
- Watch for family/lawyer names, burial images with dates, official denial/confirmation, a coroner or cemetery record, and whether Hossam gets linked to wider anti-execution / Internet Pro refusal discourse.
