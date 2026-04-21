import { promises as dns } from "dns";

function argValue(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length).trim() : "";
}

async function readTxtRecord(host) {
  try {
    const rows = await dns.resolveTxt(host);
    return rows.map((parts) => parts.join("")).filter(Boolean);
  } catch (err) {
    return [`ERROR: ${err instanceof Error ? err.message : String(err)}`];
  }
}

async function main() {
  const domain = argValue("domain");
  const selector = argValue("selector") || "default";

  if (!domain) {
    console.error("Usage: npm run mail:dns -- --domain=example.com [--selector=default]");
    process.exit(1);
  }

  const spfHost = domain;
  const dmarcHost = `_dmarc.${domain}`;
  const dkimHost = `${selector}._domainkey.${domain}`;

  const [spfRecords, dmarcRecords, dkimRecords, mxRecords] = await Promise.all([
    readTxtRecord(spfHost),
    readTxtRecord(dmarcHost),
    readTxtRecord(dkimHost),
    dns.resolveMx(domain).catch((err) => [{ exchange: `ERROR: ${err instanceof Error ? err.message : String(err)}`, priority: 0 }]),
  ]);

  const spf = spfRecords.filter((r) => /^v=spf1/i.test(r));
  const dmarc = dmarcRecords.filter((r) => /^v=dmarc1/i.test(r));
  const dkim = dkimRecords.filter((r) => /v=dkim1/i.test(r));

  console.log(`\n[mail:dns] Domain: ${domain}`);
  console.log(`[mail:dns] DKIM selector: ${selector}\n`);

  console.log("[mail:dns] MX Records:");
  for (const mx of mxRecords) {
    console.log(`  - ${mx.priority} ${mx.exchange}`);
  }

  console.log("\n[mail:dns] SPF:");
  if (!spf.length) console.log("  - Not found");
  else spf.forEach((r) => console.log(`  - ${r}`));

  console.log("\n[mail:dns] DMARC:");
  if (!dmarc.length) console.log("  - Not found");
  else dmarc.forEach((r) => console.log(`  - ${r}`));

  console.log("\n[mail:dns] DKIM:");
  if (!dkim.length) console.log(`  - Not found at ${dkimHost}`);
  else dkim.forEach((r) => console.log(`  - ${r}`));

  console.log("\n[mail:dns] Raw TXT lookup:");
  console.log(`  ${spfHost}: ${spfRecords.join(" | ") || "(none)"}`);
  console.log(`  ${dmarcHost}: ${dmarcRecords.join(" | ") || "(none)"}`);
  console.log(`  ${dkimHost}: ${dkimRecords.join(" | ") || "(none)"}`);
}

main().catch((err) => {
  console.error("[mail:dns] FAILED:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
