# v40 source notes - Internet Pro pressure, operator rents, and no public restoration

Observed: 2026-05-02T04:44:00Z

Question followed: `q:iran-cracks:20260502:6c2c5eed` - does official pressure over Internet Pro produce a real public rollback and restoration path for ordinary users, or only punish visible profiteers while preserving tiered access under a narrower crisis-service label?

Fresh crawl/search set:

- Existing KNB source `src:iran-cracks:20260502:d14c647a` (Bank Eghtesad / KhabarOnline / Jamaran, 2026-04-20) was re-crawled to `raw/crawl18-bankeghtesad-snscc-internet-pro.txt`. It says Reza Alizadeh framed international-internet scope and limits as a security-body/SNSC matter; access began through the Chamber of Commerce for business-card holders, then production/industry/commerce bodies; smaller production units were being authenticated; and all three mobile operators were obligated to implement the scheme.
- Iran International, 2026-04-28 (`raw/crawl18-iranintl-ministry-advisor-internet-pro.txt`), quotes Mohammad-Hafez Hokmi saying Internet Pro was not presented by the government, some operators implemented it for some businesses, violations occurred, and the government rejects tiered internet in communications policy. This is official distancing, not restoration.
- AbanDaily, 2026-04-20 (`raw/crawl18-abandaily-internet-pro-pricing.txt`), gives the clearest operator mechanics found in v40: RighTel quoted 2,176,000 toman before tax for 50GB/year with 2GB/day cap; 50GB lasts 25 days at that cap, implying roughly 14 repurchases and about 32m toman/year for daily 2GB use; ordinary 50GB is cited at 383k toman. It also reports company-letter/user-list activation, no proof that listed users are employees, and MCI around 2.04m toman for 50GB/year.
- Farnet, 2026-04-29 (`raw/crawl18-farnet-internet-pro-committee.txt`), synthesizes the committee mechanics: requests go through official letters plus Excel lists of names/SIMs/IDs to a committee formed under SNSC direction and involving the Communications Ministry and National Cyberspace Center; tariff is 1,980,000 toman plus 10% VAT and 50GB gift; the regulator reportedly says it did not set the tariff; access level varies by role/service; white SIM lists are being reviewed. Treat as analysis/secondary but useful for mechanics.

xPool v40:

- Job `c86a656a-c60e-4f98-b3b6-cd011873e35a`
- Query: `(اینترنت پرو OR اینترنت طبقاتی OR "سیم کارت سفید" OR "اینترنت سفید" OR "اینترنت بین‌الملل") (وزارت ارتباطات OR اپراتور OR تعرفه OR پرستاری OR وکلا OR طراحان OR "تجارت الکترونیک" OR تبعیض OR قطعی OR بازگشت OR وصل) since:2026-05-01 lang:fa`
- Status: completed, stop reason `MAX_PAGES_REACHED`, 10 pages completed, 62 emitted items. Result saved to `raw/xpool-internet-pro-v40-result.json`; extracted text saved to `raw/xpool-internet-pro-v40-texts.tsv`.
- Counts from emitted tweet text: 40 Internet Pro, 7 tiered internet, 7 white-SIM/white-line, 10 ministry/adviser, 4 operator, 41 cutoff/restoration terms, 1 professional-refusal-coded item.
- Manual read: discourse clusters around 62-63 days of cutoff, resentment of Internet Pro/white SIMs, refusal to legitimize tiered access, ministry denials, black-market/activation claims including a 60m toman activation story, and ordinary users saying internet is still not restored. One post claimed Internet Pro sales were currently closed from the infrastructure side, but no source-near rollback or public restoration directive surfaced.

Read:

v40 strengthens the v27 read. The pressure is real: professional bodies, e-commerce actors, Article 90, judiciary language, and social discourse all make Internet Pro politically toxic. But the visible response is not public restoration. The state is splitting responsibility: security/SNSC bodies own the exception channel, operators monetize and implement it, the Communications Ministry disowns the label and blames violations, and Parliament/judiciary threaten scrutiny of discrimination/profiteering. Ordinary users remain behind cutoff/filtering while selective access is narrowed, priced, authenticated, and renamed as crisis service.
