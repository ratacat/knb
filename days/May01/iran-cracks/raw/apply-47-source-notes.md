# v41 source notes - network measurement check on Internet Pro and restoration

Observed: 2026-05-02T04:50:00Z

Question followed: `q:iran-cracks:20260502:6c2c5eed` - does official pressure over Internet Pro produce public restoration, or only preserve a narrowed exception channel?

Measurement and near-measurement sources:

- IODA / Georgia Tech, 2026-04-27 (`raw/crawl19-ioda-tiered-internet-iran.txt`): describes Iran on day 59 of a global-internet shutdown after the February 28 US/Israel strikes. IODA says active probing fell to about 3% on February 28 and had not recovered. It separates three visible signals: global internet still largely shut down; Google Search/Images restored through the NIN; and slight Google Maps / Telescope / IranCell recovery indicating Internet Pro or whitelist access, cross-checked by Cloudflare Radar and Kentik.
- Internet Society Pulse (`raw/crawl19-isoc-pulse-iran-shutdown.txt`): classifies Iran as an ongoing national shutdown, starting 8 January 2026. Its timeline says partial restoration on 28 January was patchy and filtered, mid-February traffic recovered only to about 50-60% of normal, and a fresh February 28 blackout dropped traffic nearly to zero. It describes selective sectors, fixed-IP allowlists, controlled gateways, and partial/asymmetric recovery rather than open restoration.
- CHN / KhabarOnline / NetBlocks, 2026-05-01 (`raw/crawl19-chn-internet-day63-netblocks.txt`): says the broad shutdown entered day 63 / 1,488 hours and that connectivity during the period had fallen to only 1-2%.
- Safhe Eghtesad / CITNA, 2026-05-01 (`raw/crawl19-safheeghtesad-internet-10pct-pro.txt`): says some estimates show global-internet access above 10% of normal, but explicitly attributes that higher estimate mainly to non-public paths: Internet Pro, special access, organizational access, and particular network routes. It says NetBlocks' broad national metric remains around 1-2%, and the two numbers are not contradictory.
- AP, 2026-05-01 (`raw/crawl19-ap-internet-business-shutdown.txt`): reports 90m people cut off from the global internet for most of 2026, the shutdown not reversed despite a truce, and "white SIM" / limited professional access alongside most people being left with the national net. It gives daily direct losses of $30-40m, potential indirect losses twice that, and 10m jobs tied to internet connectivity.

Read:

v41 closes the measurement gap left by v40. Independent measurement framing does not support a public restoration claim. The apparent recovery signals are exactly where the Internet Pro model predicts them: whitelisted services, selected business/professional users, Google product slivers, fixed-IP or organizational paths, and mobile-operator exceptions. NetBlocks/Safhe/CHN keep the broad ordinary-user metric near 1-2%; IODA's active probing is about 3% and not recovered; the "above 10%" claim is better read as privileged/special-path recovery, not public access.
