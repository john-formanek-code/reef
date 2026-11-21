# Generates index.html and 404.html (same shell; 404.html boots straight into the lost-at-sea view).
import json, pathlib
root = pathlib.Path(__file__).resolve().parents[2]

person = {
  "@context": "https://schema.org", "@type": "Person",
  "name": "Jan Formánek", "jobTitle": "Founder & CEO",
  "address": {"@type": "PostalAddress", "addressCountry": "CZ"},
  "email": "mailto:ceo@lawielabs.com",
  "worksFor": [
    {"@type": "Organization", "name": "Lawie Labs", "url": "https://lawielabs.com/en"},
    {"@type": "Organization", "name": "Noesea", "url": "https://noesea.com/"},
    {"@type": "Organization", "name": "Eraivo", "url": "https://www.eraivo.com/"},
    {"@type": "Organization", "name": "Corthex Capital", "url": "https://corthexcapital.com"}],
  "sameAs": ["https://www.linkedin.com/in/formanekfounder", "https://github.com/john-formanek-code", "https://x.com/0xjohnfx",
             "https://lawielabs.com/en/about/founder", "https://noesea.com/protocol/founder"]
}

FACTS = {'lawie': [('b2b/b2g', 'Hybrid Threat Defense: OSINT/FIMI, procurement and ownership networks turned into temporal campaign maps and reviewable assessments'), ('b2c', 'Civic Guard: citizen-submitted evidence, incident mapping, independently reviewed public findings, walled off from restricted intel'), ('b2b', 'Legal-entity digital twins: effective-dated ownership, statutory obligations, scenario analysis of regulatory change')], 'noesea': [('truth layer', 'immutable evidence and provenance, competing interpretations, challenges, appeals; evidence integrity kept apart from claims of truth'), ('consensus', 'bonded jurors, commit-reveal voting, multi-round disputes, collusion resistance, stake-based incentives'), ('constitution', 'hard limits on governance powers, append-only corrections, independently replayable decisions')], 'eraivo': [('control plane', 'multi-wallet execution and treasury orchestration for autonomous software'), ('mandates', 'delegated authority, capital allocation, policy-gated transactions, approvals, settlement'), ('model', 'enterprise software that monetizes control and assurance, not the payment rails')], 'corthex': [('thesis', 'capacity-constrained DEX and smaller-cap markets, where fragmentation and liquidity friction beat scale'), ('stack', 'Rust and Python research-to-execution: market data, DEX microstructure, simulation'), ('discipline', 'point-in-time validation, execution-cost modeling, independent risk controls')]}
V = [
 dict(slug="lawie", name="Lawie Labs", mark="lawie labs", skin="gold", since="Nov 2025", role="founder &amp; ceo", url="https://lawielabs.com/en", host="lawielabs.com",
      tag="Where legal work becomes leverage.", quote="execution,|not advice.",
      body=["Lawie is agent-first legal execution infrastructure for companies, law firms and high-stakes legal workflows.",
            "It exists to move legal AI from plausible text to defensible work: source-grounded reasoning, controlled tool use, human approval gates and durable audit records."],
      fine="65 specialist agents · twelve front-line specialists · Civic Guard, the open public-interest product"),
 dict(slug="noesea", name="Noesea", mark="noesea", skin="teal", since="Jan 2026", role="founder &amp; protocol architect", url="https://noesea.com/", host="noesea.com",
      tag="Proof infrastructure for digital claims.", quote="protocol infrastructure,|not a conventional software company.",
      body=["Noesea is a proof infrastructure protocol for digital claims, provenance, verification and evidence records.",
            "Five layers: claim registry, evidence records, review logic, participant controls, verification outputs."],
      fine="Pre-launch. No token sale, exchange listing, or promise of profit implied."),
 dict(slug="eraivo", name="Eraivo", mark="eraivo", skin="lavender", since="Mar 2025", role="founder", url="https://www.eraivo.com/", host="eraivo.com",
      tag="Give agents buying power.", quote="the policy path|is the product.",
      body=["Governed accounts for payments, escrow, settlement, approvals, risk checks, reputation and audit trails. One programmable control plane between an agent and real money.",
            "Every request comes back allowed, approval required, or rejected, with the policy decision and evidence attached."],
      fine=""),
 dict(slug="corthex", name="Corthex Capital", mark="corthex", skin="steel", since="Apr 2025", role="founder", url="https://corthexcapital.com", host="corthexcapital.com",
      tag="Global markets. Emerging technology. Digital assets.", quote="research first.|risk frames every decision.",
      body=["A global markets company focused on emerging technology, digital assets and disciplined, risk-driven research."],
      fine="Corthex Capital makes no performance claims and does not promise returns."),
]
STUDIES = [
 ("hover", "coral", None, "Hover", "mostly still, slowly breathing"),
 ("jet", "purple", "jet", "Jet", "contract, kick, glide"),
 ("ink", "orange", "ink", "Ink", "startled, gone"),
 ("reach", "salmon", "reach", "Reach", "one arm, curious"),
 ("feed", "teal", "feed", "Feeding", "tip to mouth"),
 ("pair", "gold,lavender", None, "Pair", "keeping a polite distance"),
]
GH = "https://github.com/john-formanek-code/"
P = [
 dict(slug="openedge", name="OpenEdge", mark="openedge", skin="orange", since="Feb 2026", role="typescript", gh=GH+"OpenEdge", live="https://openedge.vercel.app/",
      tag="A trading terminal that holds you to your own rules.", quote="monitor the world,|predict it more precisely.",
      body=["A trading terminal and workflow engine for high-conviction traders and small teams. It sits between raw market data and execution: write the hypothesis, follow the rules, review how the trade was actually executed."],
      facts=[("tape", "live quotes and breaking news from Yahoo Finance, CNBC and CoinGecko, next to a synced TradingView chart grid"),
             ("guardrails", "rules that flag FOMO, revenge trading and drift; hypotheses tracked from plan to review"),
             ("stack", "Next.js 15, React 19, Drizzle ORM on libSQL, Tailwind, Framer Motion")], fine=""),
 dict(slug="snake", name="AI Snake Lab", mark="snake ai lab", skin="teal", since="Dec 2025", role="python · typescript", gh=GH+"AI-snake-lab", live=None,
      tag="Classical search against reinforcement learning, on Snake.", quote="same game,|many minds.",
      body=["A playground for comparing AI algorithms on one simple game. A Python engine runs the agents; a Next.js dashboard shows live what each one sees and decides, with survival and food efficiency side by side."],
      facts=[("classical", "A*, BFS, DFS, Hamiltonian cycle, hand-written heuristics"),
             ("learning", "DQN with experience replay, PPO, A2C, NEAT, MCTS, a CNN agent that reads the grid as pixels"),
             ("stack", "Python, PyTorch, Pygame · Next.js 14, Recharts, Socket.io")], fine=""),
 dict(slug="poker", name="Poker Lab", mark="poker lab", skin="coral", since="Apr 2026", role="python · c++", gh=GH+"poker-lab", live=None,
      tag="Blackjack and Hold'em engines behind one desktop app.", quote="two engines,|one table.",
      body=["A desktop card-games suite: a C++ blackjack engine and a Texas Hold'em environment, unified under one custom PySide6 interface."],
      facts=[("blackjack", "Libre Blackjack, a fast C++ engine with strategy support, built with make"),
             ("poker", "Neuron Poker, a Hold'em environment on OpenAI Gym"),
             ("ui", "PySide6 window with sidebar navigation and a QPainter-drawn poker table")],
      fine="Engines by Jeremy Theler (Libre Blackjack) and Dick Reuter (Neuron Poker)."),
 dict(slug="cscookbook", name="csCookbook", mark="cscookbook", skin="gold", since="2023", role="java · php · js · sql · vba", gh=GH+"csCookbook", live=None,
      tag="IT school coursework, organized by subject.", quote="coursework,|kept where it can be found.",
      body=["Everything from SSPŠ Jihlava, sorted by subject instead of by year, so a topic can be found again in seconds."],
      facts=[("code", "Java in fifteen topics up to SQL, PHP forms, cookies and sessions, JS/PWA apps with a database and a weather API"),
             ("systems", "computer networks, hardware, OS installation and system administration"),
             ("office", "Excel and VBA macros, Access databases")],
      fine="Teacher repositories are linked as submodules. My own work lives in my-work/."),
 dict(slug="rsa-sha", name="RSA-SHA", mark="rsa-sha", skin="steel", since="Feb 2025", role="python", gh=GH+"RSA-SHA", live=None,
      tag="Encrypt for one party, sign as another.", quote="encrypt for b,|sign as a.",
      body=["Public-key crypto between two parties. A encrypts a message with B's public key and signs it with its own private key, so only B can read it and B can prove it came from A."],
      facts=[("encryption", "RSA with PKCS#1 OAEP"),
             ("signature", "PKCS#1 v1.5 over a SHA-256 hash"),
             ("library", "PyCryptodome; keys generated per party and stored as PEM")], fine=""),
 dict(slug="starbase", name="Starbase", mark="starbase", skin="purple", since="Apr 2026", role="typescript · docker", gh=GH+"starbase", live=None,
      tag="A homelab operating system with one command center.", quote="twelve pillars,|one command center.",
      body=["A homelab operating system: twelve Docker Compose pillars and a React command center that starts and stops them. Without Docker it runs in demo mode, so every pillar can still be clicked through."],
      facts=[("pillars", "identity, private cloud, network lab, cyber defense, automation, media, backup, DevOps, AI, observability, business"),
             ("inside", "Portainer, Nextcloud, Pi-hole, WireGuard, Wazuh, Vaultwarden, Grafana, Prometheus, Loki, Authentik, Ollama"),
             ("control", "React UI and Express API, one lab.sh entry point for every stack")], fine=""),
]
NAV = [("/", "reef"), ("/ventures", "ventures"), ("/projects", "projects"), ("/gallery", "gallery"), ("/writing", "writing"), ("/cv", "cv")]

def links(cls=""):
    return "\n".join(f'  <a href="#{p}" data-route="{p}">{n}</a>' for p, n in NAV)

def cards(items, base):
    out = []
    for v in items:
        out.append(f'''    <li><a class="card" href="#/{base}/{v["slug"]}">
      <span class="card-art"><canvas class="mini" data-skin="{v["skin"]}" data-noclick role="img" aria-label="{v["name"]}: one live ASCII octopus"></canvas><span class="mark">{v["mark"]}</span></span>
      <span class="cap"><span class="cap-name">{v["name"]}</span><span class="cap-year">{v["since"]}</span></span>
      <span class="cap-tag">{v["tag"]}</span>
    </a></li>''')
    return "\n".join(out)

def subpages(items, base):
    out = []
    for v in items:
        body = "\n".join(f"    <p>{b}</p>" for b in v["body"])
        facts = v.get("facts") or FACTS[v["slug"]]
        fl = "\n".join(f'      <li><span>{k}</span><span>{t}</span></li>' for k, t in facts)
        fine = f'\n    <ul class="facts">\n{fl}\n    </ul>'
        if v["fine"]: fine += f'\n    <p class="fine">{v["fine"]}</p>'
        if "gh" in v:
            ext = f'<a href="{v["gh"]}" rel="noopener">github</a>' + (f' / <a href="{v["live"]}" rel="noopener">live</a>' if v["live"] else "")
            kick = f'{v["role"]} · {v["since"].lower()}'
        else:
            ext = f'<a href="{v["url"]}" rel="noopener">{v["host"]}</a>'
            kick = f'{v["role"]} · since {v["since"].lower()}'
        out.append(f'''<section class="page" data-page="/{base}/{v["slug"]}" data-skin="{v["skin"]}" hidden>
  <blockquote class="quote" data-avoid><span class="tw" data-lines="{v["quote"]}"></span><span class="caret" aria-hidden="true"></span></blockquote>
  <div class="prose" data-avoid>
    <p class="kicker">{kick}</p>
    <h1>{v["name"]}</h1>
{body}{fine}
    <p class="links">{ext} / <a href="#/{base}">{base}</a></p>
  </div>
</section>''')
    return "\n\n".join(out)

def tiles():
    out = []
    for slug, skin, auto, title, cap in STUDIES:
        a = f' data-auto="{auto}"' if auto else ""
        cnt = ' data-count="2"' if slug == "pair" else ""
        out.append(f'''    <figure class="tile tile-{slug}"><canvas class="mini" data-skin="{skin}"{a}{cnt} data-noclick role="img" aria-label="Octopus study: {title.lower()}, {cap}"></canvas>
      <figcaption><span>{title}</span> <span class="dim">{cap} · live · 2026</span></figcaption></figure>''')
    return "\n".join(out)

HEAD = '''<!doctype html>
<html lang="en" class="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Jan Formánek</title>
<meta name="description" content="Jan Formánek, founder from Czechia. Building Lawie Labs, Noesea, Eraivo and Corthex Capital across law, markets, trust and software infrastructure.">
<meta name="author" content="Jan Formánek">
<meta name="theme-color" content="#1a1917">
<meta property="og:type" content="profile">
<meta property="og:title" content="Jan Formánek">
<meta property="og:description" content="Founder from Czechia. Lawie Labs · Noesea · Eraivo · Corthex Capital.">
<meta property="og:image" content="og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Jan Formánek, with ASCII octopuses">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Jan Formánek">
<meta name="twitter:description" content="Founder from Czechia. Lawie Labs · Noesea · Eraivo · Corthex Capital.">
<meta name="twitter:image" content="og.png">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="preload" href="assets/fonts/geist-mono-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/style.css">
<script>try{if(localStorage.getItem("jf:theme")==="light")document.documentElement.classList.remove("dark")}catch(e){}</script>
<script type="application/ld+json">
%s
</script>
</head>''' % json.dumps(person, ensure_ascii=False, indent=1)

def page(is404):
    flag = '<script>window.JF_404 = true;</script>\n' if is404 else ""
    return f'''{HEAD}
<body>
<a class="skip" href="#main">skip to content</a>
<canvas id="reef" aria-hidden="true"></canvas>

<nav class="nav" data-avoid aria-label="Main">
{links()}
  <span class="nav-theme"><button type="button" class="theme-toggle" aria-label="Toggle light and dark"></button></span>
</nav>

<header class="mhead">
  <a href="#/" class="mhead-name">Jan Formánek</a>
  <button type="button" class="mhead-menu" aria-label="Menu" aria-expanded="false" aria-controls="mpanel"><svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><circle cx="3" cy="3" r="1.4"/><circle cx="11" cy="3" r="1.4"/><circle cx="3" cy="11" r="1.4"/><circle cx="11" cy="11" r="1.4"/></svg></button>
  <div class="mhead-panel" id="mpanel">
{links()}
    <button type="button" class="theme-toggle" aria-label="Toggle light and dark"></button>
  </div>
</header>

<div class="counter" aria-hidden="true"><div class="c-octo">4</div><div class="c-food">food</div></div>

<main id="main" tabindex="-1">
<section class="page" data-page="/">
  <blockquote class="quote" data-avoid><span class="tw" data-lines="everything is a claim,|until it survives a challenge"></span><span class="caret" aria-hidden="true"></span></blockquote>
  <div class="prose" data-avoid>
    <h1>Ahoj, I'm Jan.</h1>
    <p>Founder from Czechia, building across law, markets, trust and software.</p>
    <p>Founder &amp; CEO @ <a href="#/ventures/lawie">Lawie Labs</a>. Founder @ <a href="#/ventures/noesea">Noesea</a>.</p>
    <p>Also building <a href="#/ventures/eraivo">Eraivo</a> and <a href="#/ventures/corthex">Corthex Capital</a>.</p>
    <p class="links"><a href="https://www.linkedin.com/in/formanekfounder" rel="me noopener">linkedin</a> / <a href="https://github.com/john-formanek-code" rel="me noopener">github</a> / <a href="mailto:ceo@lawielabs.com">email</a></p>
  </div>
</section>

<section class="page page-ventures" data-page="/ventures" hidden>
  <h1 class="sr">Ventures</h1>
  <ul class="cards" data-noclick>
{cards(V, "ventures")}
  </ul>
</section>

{subpages(V, "ventures")}

{subpages(P, "projects")}

<section class="page page-gallery" data-page="/gallery" hidden>
  <header class="g-head" data-avoid>
    <p class="g-kicker">quiet animals.</p>
    <div class="g-row"><h1>Octopus studies, drawn live in text.</h1><a href="#/">reef</a></div>
  </header>
  <div class="tiles">
{tiles()}
  </div>
</section>

<section class="page page-writing" data-page="/writing" hidden>
  <h1 class="soon" data-avoid>soon.</h1>
</section>

<section class="page page-ventures" data-page="/projects" hidden>
  <h1 class="sr">Projects</h1>
  <ul class="cards" data-noclick>
{cards(P, "projects")}
  </ul>
</section>

<section class="page page-list" data-page="/cv" hidden>
  <div class="l-head" data-avoid>
    <p class="kicker">cv</p>
    <h1>Jan Formánek</h1>
    <p class="l-sub">Technology founder &amp; CEO. Software and AI systems architect. Independent trader. Czechia.</p>
    <a class="dl" href="Jan_Formanek_CV.pdf" download="Jan_Formanek_CV.pdf"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M7 1.5v8M3.5 6.5 7 10l3.5-3.5M2 12.5h10"/></svg><span>Download CV</span><span class="dl-meta">pdf · 2 pages</span></a>
  </div>
  <div class="cv" data-avoid>
    <section class="cv-sec"><h2>Experience</h2>
      <div class="cv-item"><span class="cv-t"><a href="#/ventures/lawie">Lawie Labs</a></span><span class="cv-d">Nov 2025 – now</span><span class="cv-r">Founder &amp; CEO</span><span class="cv-p">Hybrid threat defense, civic intelligence and legal-entity digital twins.</span></div>\n      <div class="cv-item"><span class="cv-t"><a href="#/ventures/noesea">Noesea</a></span><span class="cv-d">Jan 2026 – now</span><span class="cv-r">Founder &amp; Protocol Architect</span><span class="cv-p">Dispute protocol: bonded jurors, commit-reveal voting, replayable decisions.</span></div>\n      <div class="cv-item"><span class="cv-t"><a href="#/ventures/corthex">Corthex Capital</a></span><span class="cv-d">Apr 2025 – now</span><span class="cv-r">Founder &amp; CEO</span><span class="cv-p">Rust/Python DEX research with point-in-time validation and independent risk controls.</span></div>\n      <div class="cv-item"><span class="cv-t"><a href="#/ventures/eraivo">Eraivo</a></span><span class="cv-d">Mar 2025 – now</span><span class="cv-r">Founder &amp; CEO</span><span class="cv-p">Policy-gated treasury and multi-wallet execution for autonomous software.</span></div>\n      <div class="cv-item"><span class="cv-t"><a href="https://x.com/0xjohnfx">johnFX</a></span><span class="cv-d">ongoing</span><span class="cv-r">Independent Trader</span><span class="cv-p">Crypto derivatives and macro: volume profile, CVD, funding, open interest. Scenarios published with invalidation levels.</span></div>
    </section>
    <section class="cv-sec"><h2>Security</h2>
      <div class="cv-item"><span class="cv-t">Cyber Verification Program</span><span class="cv-d">Anthropic</span><span class="cv-r">Defense Access</span><span class="cv-p">Approved, with active Claude Mythos access for authorized defensive code research.</span></div>\n      <div class="cv-item"><span class="cv-t">White-box assessments</span><span class="cv-d">Strix + Venice AI</span><span class="cv-p">Local source analysis and reproducible triage. Lawie PR #302 hardened service-JWT identity binding, MFA rate limits and secret handling.</span></div>
    </section>
    <section class="cv-sec"><h2>Engineering</h2>
      <div class="cv-item"><span class="cv-t">AI-assisted development</span><span class="cv-d">4 ventures</span><span class="cv-p">Subsystem ownership per agent, concurrent Git worktrees, PRs reconciled against one canonical main.</span></div>\n      <div class="cv-item"><span class="cv-t">CI &amp; infrastructure</span><span class="cv-d">self-hosted</span><span class="cv-p">Linux runners and containerized validation for Rust, Solidity, TypeScript and PostgreSQL.</span></div>
    </section>
    <section class="cv-sec"><h2>Skills</h2>
      <div class="cv-skill"><span class="cv-sl">languages</span><span class="chips"><span>Rust</span><span>Python</span><span>TypeScript</span><span>Java</span><span>SQL</span><span>Solidity</span></span></div>\n      <div class="cv-skill"><span class="cv-sl">web &amp; data</span><span class="chips"><span>Node.js</span><span>Next.js</span><span>PostgreSQL</span><span>Redis</span><span>ClickHouse</span></span></div>\n      <div class="cv-skill"><span class="cv-sl">protocols</span><span class="chips"><span>EVM / Foundry</span><span>commit-reveal</span><span>staking &amp; slashing</span><span>DEX microstructure</span></span></div>\n      <div class="cv-skill"><span class="cv-sl">infra</span><span class="chips"><span>Linux</span><span>Docker</span><span>Proxmox</span><span>CI/CD</span><span>VLANs</span><span>Cisco IOS</span></span></div>\n      <div class="cv-skill"><span class="cv-sl">ai &amp; security</span><span class="chips"><span>MCP</span><span>agent orchestration</span><span>vulnerability triage</span><span>AuthN/AuthZ</span></span></div>
    </section>
    <section class="cv-sec"><h2>Education</h2>
      <div class="cv-item"><span class="cv-t">SSPŠ Jihlava</span><span class="cv-d">2023 – 2027</span><span class="cv-r">Information Technology</span><span class="cv-p">Software development, algorithms, databases, networking.</span></div>
    </section>
    <section class="cv-sec"><h2>Recognition</h2>
      <div class="cv-item"><span class="cv-t">Investománie</span><span class="cv-d">2025 – 2026</span><span class="cv-r">Semifinalist</span><span class="cv-p">Investment strategy competition.</span></div>
    </section>
    <section class="cv-sec"><h2>Languages</h2>
      <div class="cv-langs"><span><b>Czech</b><i>native</i></span><span><b>English</b><i>B2, Cambridge B2 First in preparation</i></span><span><b>German</b><i>basic</i></span></div>
    </section>
    <section class="cv-sec"><h2>Contact</h2>
      <p class="cv-contact"><a href="mailto:ceo@lawielabs.com">ceo@lawielabs.com</a> / <a href="https://www.linkedin.com/in/formanekfounder" rel="me noopener">linkedin</a> / <a href="https://github.com/john-formanek-code" rel="me noopener">github</a> / <a href="https://x.com/0xjohnfx" rel="me noopener">x</a></p>
    </section>
  </div>
</section>

<section class="page" data-page="404" hidden>
  <blockquote class="quote" data-avoid><span class="tw" data-lines="lost at sea."></span><span class="caret" aria-hidden="true"></span></blockquote>
  <div class="prose" data-avoid>
    <h1>404</h1>
    <p>Nothing lives at this address. Just one octopus.</p>
    <p class="links"><a href="./#/">back to the reef</a></p>
  </div>
</section>
</main>

<noscript><p class="nojs">Jan Formánek, founder from Czechia: Lawie Labs, Noesea, Eraivo, Corthex Capital. <a href="https://www.linkedin.com/in/formanekfounder">linkedin</a> · <a href="mailto:ceo@lawielabs.com">email</a></p></noscript>
{flag}<script src="assets/reef.js"></script>
<script src="assets/app.js"></script>
</body>
</html>
'''

(root / "index.html").write_text(page(False))
(root / "404.html").write_text(page(True))
print("ok")
