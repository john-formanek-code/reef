# jan-site-final — Jan Formánek

The octopus site (v4) expanded into a full personal site. It is static: there is no build step and
every path is relative. Open `index.html` or put the folder on any static host. Geist Mono is
self-hosted. The page shell is the daoho.dev one, unchanged: dark warm grey, a small top-centre nav,
a text column at the bottom left, a typewriter quote, underlined links, a light/dark toggle and a
mobile pill header.

## Pages (hash routes, all in `index.html`)

| route | what |
|---|---|
| `#/` reef | Home, as in v4: 3 octopuses on desktop, 4 above 1.6 MP, 2 on phones (kept in the top half, clear of the text). You can feed them and use the counter. |
| `#/ventures` | A carousel of 4 cards, like daoho's projects page. Each card has a live mini canvas with one octopus in the venture's colour, plus the name, the start month and a tagline. |
| `#/ventures/lawie` · `/noesea` · `/eraivo` · `/corthex` | Venture pages in the bottom-left column: a quote, the role and start date, the venture's own copy, the fine print, then the site and a link back to ventures. A single dimmed octopus in the accent colour stays top-right. |
| `#/gallery` | Six live octopus studies (hover, jet, ink, reach, feeding, pair) in a masonry grid like daoho's gallery. Each one plays by itself and also responds to the cursor and to clicks. |
| `#/writing` | Shows `soon.` as the empty state, like daoho's blog. No posts are faked. |
| `#/projects` | Same carousel as ventures, for GitHub projects: OpenEdge, AI Snake Lab, Poker Lab, csCookbook, RSA-SHA, Starbase. |
| `#/projects/openedge` · `/snake` · `/poker` · `/cscookbook` · `/rsa-sha` · `/starbase` | Project pages, same layout as venture pages, with github (and live) links. |
| `#/cv` | CV with a Download CV button (`Jan_Formanek_CV.pdf`), then Experience, Security, Engineering, Skills, Education, Recognition, Languages, Contact. `#/about` redirects here. |
| any unknown route + `404.html` | "lost at sea." with one octopus, which you can feed. |

Octopuses appear on every page. When you change pages, the extra octopuses swim off an edge and new
ones swim in. Content pages get a single octopus at 40–60 % strength, kept top-right and dimmed
anywhere near text. On ventures and gallery, the live cards and tiles are the octopuses.

Accent colours: Lawie is gold, Noesea teal, Eraivo lavender and Corthex steel. The reef uses coral,
orange-red, purple and salmon.

## Mouse and touch

| you do | the octopus does |
|---|---|
| move the cursor anywhere | eyes track it: the slit pupils slide toward the cursor, and they blink now and then |
| come close (within about 3.4R) | turns its arms toward you, and the nearest arm reaches out by inverse kinematics; close up, the tip curls around the cursor |
| linger | more arms join, up to 4 |
| move slowly over the mantle (petting) | chromatophores ripple outward from the cursor in a pink blush, the arms relax, it stops moving and the eyes widen |
| click or tap the body (poke) | it flinches: the skin flashes, the mantle shrinks briefly, the arms pull in, it blinks and backs off a little |
| press and hold or drag on it (grab) | the cursor changes to a grab cursor; up to 5 arms wrap the cursor and the body follows on an elastic leash with stretching arms. Let go and it jets away with a playful spin |
| fast flick | ink and dart, as before |
| click empty water | food, as before; clicking an octopus never drops food |
| touch | a tap pokes, press and drag grabs; touches on an octopus don't scroll the page |
| hover over a ventures card | the card's octopus swims to the cursor and reaches toward it (no grab or poke on cards, because they are links) |

All of this applies to the dimmed octopus on the content pages, the 404 octopus and the gallery tiles.

## Ventures row

- **Mouse wheel and trackpad:** a vertical wheel (deltaY), a horizontal trackpad swipe (deltaX) and shift+wheel all scroll the row sideways with eased motion, then settle on the nearest card.
- **Keyboard:** ← and → move one card at a time; Home and End jump to the first and last card.
- **Mouse drag:** click and drag the row (grab cursor) with a fling. A drag never opens a card.
- **Touch:** native swipe with snap.

The wheel listener sits on `window` with `passive:false`, so the background canvas and the gaps between cards can't swallow it.

## Engine (`assets/reef.js`)

The behaviour is v4's, unchanged: verlet arms, the web, chromatophores, suckers, jet pulses,
curiosity, reaching, ink and flee, and feeding tip-to-mouth. New in this version:
- `Reef(canvas, {mini, count, skins, dim, zone, feed, auto})`
- `configure()`, called on every route change, which handles octopuses swimming in and out
- named skins
- arm tips drawn as `- | / \` line glyphs instead of tiles, so arms taper smoothly
- `data-avoid-box`
- the draw loop stops while the tab is hidden; mini canvases also stop when they are off-screen
  (IntersectionObserver)
- canvas-local input for the minis

`prefers-reduced-motion` slows everything to 30 %, types the quote instantly and stops the caret
blinking.

Other details:
- **Accessibility:** skip link, visible focus outlines, focus moves to `<main>` on navigation,
  `role="img"` and `aria-label` on every mini canvas, `aria-hidden` on the background canvas.
- **Head:** favicon (`favicon.svg` with PNG fallbacks: a tiny cell-grid octopus), `og.png`
  (1200×630), OG/Twitter meta tags, and `Person` JSON-LD with sameAs entries for LinkedIn, GitHub and
  the founder pages on Lawie Labs and Noesea.

## Before deploying

- **og:image / twitter:image** are set to the relative `og.png`. Most crawlers need an **absolute
  URL**. Once there is a domain, change both to `https://<domain>/og.png`, and add
  `<link rel="canonical">` and `og:url`.
- **`404.html`** uses relative asset paths. It works when the host serves it for top-level paths
  such as `/foo`. For deep paths such as `/a/b/c`, change `assets/…` to `/assets/…` once the site
  lives at a domain root.
- To regenerate `index.html` and `404.html`, run `python3 qa/tools/build_html.py`. All copy lives in
  that file.

## Facts used and where they came from

- **LinkedIn** (linkedin.com/in/formanekfounder):
  - "Founder at Lawie Labs | Noesea | Corthex Capital & Eraivo — Building an ecosystem across law,
    markets, trust, and software infrastructure"
  - Prague
  - "Purpose-driven founder (unfortunately, an adult). Think big."
  - Start dates: Noesea Jan 2026, Lawie Labs Nov 2025, Corthex Capital Apr 2025, Eraivo Mar 2025
  - Lawie described as "agent-first legal execution infrastructure for companies, law firms, and
    high-stakes legal workflows"
- **lawielabs.com/en/about/founder:**
  - "Founder & CEO"
  - "move legal AI from plausible text to defensible work"
  - "source-grounded reasoning, controlled tool use, human approval gates, and durable audit
    records"
  - 65 specialist agents, twelve front-line specialists
  - "Execution, not advice"
  - "Where legal work becomes leverage"
  - Civic Guard as the open public-interest product
- **noesea.com/protocol/founder:**
  - "Founder & Protocol Architect"
  - "proof infrastructure protocol for digital claims, provenance, verification and evidence
    records"
  - "protocol infrastructure, not a conventional software company"
  - the five layers
  - "Everything is a claim, until it survives a challenge"
  - the pre-launch, no-token-sale disclaimer
- **eraivo.com:**
  - "Give agents buying power."
  - the governed-accounts sentence
  - "allowed, approval required, or rejected — with the policy decision and evidence attached"
  - "The policy path is the product."
- **corthexcapital.com:**
  - "Global Markets. Emerging Technology. Digital Assets."
  - "global markets company focused on emerging technology, digital assets and disciplined
    risk-driven research"
  - "Research first", "risk frames every decision"
  - "makes no performance claims and does not promise returns"
- **Contact:** linkedin.com/in/formanekfounder, github.com/john-formanek-code,
  ceo@lawielabs.com

## TODO: inferred wording Jan should confirm

- [ ] **about → now:** "Building Lawie: legal AI that does defensible work, with humans approving
  what matters." This paraphrases the Lawie founder page. Confirm that it is the current focus.
- [ ] **about → now:** "Taking Noesea from protocol design toward launch." This is inferred from
  "pre-launch".
- [ ] **about → bio:** "I build across law, markets, trust and software infrastructure." This
  paraphrases the LinkedIn headline.
- [ ] **home:** "Founder in Prague, building across law, markets, trust and software." Kept from v4,
  same paraphrase.
- [ ] **ventures → taglines and quotes** were chosen from each venture's own copy. Check that Jan
  agrees with the picks, for example Eraivo's "the policy path is the product" and Lawie's
  "execution, not advice".
- [ ] **gallery:** the captions ("mostly still, slowly breathing", …) and the header "quiet animals.
  / Octopus studies, drawn live in text." are my wording.
- [ ] **writing:** add real posts when they exist. Nothing is faked.
- [ ] **domain:** absolute og:image URL, canonical link and og:url (see above).

## QA (`qa/`)

- `pages-contact.png`: every page at 1440×900 and 390×844, in dark and light.
- `shots/`: the full-size screenshots.
- `interactions-contact.png` and `interact/`: scripted CDP mouse and touch runs (reach, pet, poke, grab, drag, release, ink, card follow, touch drag, ventures wheel) in dark and light, with the measured values in `interact/results-{dark,light}.json`. The ring in these images is a QA-only cursor overlay (`tools/cursor_overlay.js`), because headless capture doesn't draw the OS cursor; it is not part of the site.
- `demo-interact.mp4` (81 s, 30 fps, real time) and `demo-interact-contact.png`: the interactions plus ventures scrolling (wheel, drag, arrow keys).
- `demo.mp4`: a real-time 30 fps navigation demo (CDP screencast resampled to a constant 30 fps).
- `tools/`:
  - `shots.py`: every page × device × theme, collecting console errors.
  - `func.py`: route and octopus counts, feeding, keyboard order and hash-link resolution.
  - `demo.py`, `og.py`/`og.html`, `favicon.py`, `build_html.py`.
