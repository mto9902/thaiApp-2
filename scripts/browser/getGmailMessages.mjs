import { chromium } from "playwright";

function parseArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--today") {
      options.today = true;
      continue;
    }

    if (token === "--count") {
      options.count = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--query") {
      options.query = argv[index + 1];
      index += 1;
    }
  }

  return options;
}

function formatDateForGmail(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function buildTargetUrl({ today, query }) {
  if (query) {
    return `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(query)}`;
  }

  if (today) {
    const todayQuery = `in:inbox after:${formatDateForGmail(new Date())}`;
    return `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(todayQuery)}`;
  }

  return "https://mail.google.com/mail/u/0/#inbox";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cdpPort = process.env.CHROME_CDP_PORT || "9333";
  const cdpUrl = process.env.CHROME_CDP_URL || `http://127.0.0.1:${cdpPort}`;
  const count = Math.max(1, Number.parseInt(args.count || "5", 10) || 5);
  const targetUrl = buildTargetUrl(args);

  const browser = await chromium.connectOverCDP(cdpUrl);

  try {
    const context = browser.contexts()[0] || (await browser.newContext());
    const existingPages = context.pages();
    const page =
      existingPages.find((candidate) => /mail\.google\.com|accounts\.google\.com/.test(candidate.url())) ||
      existingPages[0] ||
      (await context.newPage());

    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    if (page.url().includes("accounts.google.com")) {
      throw new Error(
        "Gmail is not signed in in the automation browser. Run `npm run browser:gmail:open`, sign in once, and then retry.",
      );
    }

    await page.waitForSelector("tr.zA", { timeout: 30000 });
    await page.waitForTimeout(1500);

    const rows = page.locator("tr.zA");
    const rowCount = await rows.count();
    const messages = [];

    for (let index = 0; index < Math.min(count, rowCount); index += 1) {
      const row = rows.nth(index);
      const rowClass = (await row.getAttribute("class").catch(() => "")) || "";
      const sender =
        ((await row.locator(".yP, .yW span").first().textContent().catch(() => "")) || "").trim();
      const subject = ((await row.locator(".bog").first().textContent().catch(() => "")) || "").trim();
      const snippet = ((await row.locator(".y2").first().textContent().catch(() => "")) || "")
        .replace(/^\-\s*/, "")
        .trim();
      const timeLocator = row.locator("td.xW span").first();
      const time =
        ((await timeLocator.getAttribute("title").catch(() => "")) ||
          (await timeLocator.textContent().catch(() => "")) ||
          "")
          .trim();

      messages.push({
        index: index + 1,
        sender,
        subject,
        snippet,
        time,
        unread: rowClass.includes("zE"),
      });
    }

    console.log(
      JSON.stringify(
        {
          cdpUrl,
          targetUrl,
          count: messages.length,
          messages,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
