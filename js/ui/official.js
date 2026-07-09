export function renderOfficial() {
  const groups = [
    ["Tier 1: Official Sources", [["IMD", "https://mausam.imd.gov.in/"], ["Pune District Administration", "https://pune.gov.in/"], ["PMC", "https://www.pmc.gov.in/"], ["PCMC", "https://www.pcmcindia.gov.in/"], ["Pune Police", "https://punepolice.gov.in/"], ["NHAI", "https://nhai.gov.in/"], ["Pune Metro", "https://www.punemetrorail.org/"]]],
    ["Tier 2: Trusted Media", [["Sakal", "https://www.esakal.com/"], ["Lokmat", "https://www.lokmat.com/"], ["Loksatta", "https://www.loksatta.com/"], ["Maharashtra Times", "https://maharashtratimes.com/"], ["Indian Express Pune", "https://indianexpress.com/section/cities/pune/"], ["ABP Majha", "https://marathi.abplive.com/"], ["TV9 Marathi", "https://www.tv9marathi.com/"], ["Zee 24 Taas", "https://zeenews.india.com/marathi"]]]
  ];

  document.getElementById("tab-official").innerHTML = `
    <section class="card feature">
      <div class="section-kicker">Verification</div>
      <h2>Official</h2>
      <p>Use official sources for confirmation. Trusted media is used for early awareness and developing situations.</p>
    </section>
  ` + groups.map(([title, links]) => `
    <section class="card"><details open><summary>${title}</summary>${links.map(([name, url]) => `<p><a href="${url}" target="_blank" rel="noopener">${name}</a></p>`).join("")}</details></section>
  `).join("");
}
