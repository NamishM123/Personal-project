/**
 * Heuristics for turning an application-confirmation email into
 * { company, title }. Tuned for the ~10 patterns I see in real inboxes.
 *
 * Strategy:
 *  1. Try subject-line patterns first (most reliable).
 *  2. Fall back to From-header company extraction.
 *  3. Fall back to body-line patterns.
 *
 * Any field we can't extract is left blank; the user can edit before
 * the row is committed if they want, but most are usable as-is.
 */

import { getHeader, extractBodyText, type GmailMessage } from "@/lib/gmail";

const APPLICATION_PHRASES = [
  "thanks for applying",
  "thank you for applying",
  "we received your application",
  "we have received your application",
  "application received",
  "application submitted",
  "your application for",
  "your application to",
  "your application has been received",
  "thanks for your interest",
  "we got your application",
];

/** Quick filter: does this email look like a job-application confirmation? */
export function looksLikeApplicationEmail(msg: GmailMessage): boolean {
  const subject = getHeader(msg, "Subject").toLowerCase();
  const snippet = (msg.snippet ?? "").toLowerCase();
  return APPLICATION_PHRASES.some((p) => subject.includes(p) || snippet.includes(p));
}

export type ParsedApplication = {
  company: string;
  title: string;
  url: string | null;
  source: string | null;
};

export function parseApplicationEmail(msg: GmailMessage): ParsedApplication | null {
  const subject = getHeader(msg, "Subject");
  const from = getHeader(msg, "From");
  const body = extractBodyText(msg);

  const fromCompany = companyFromSender(from);
  const fromDomain = domainFromSender(from);

  let title = "";
  let company = "";

  // 1. Subject patterns. The order here matters: most specific first.
  const subjectPatterns: Array<{ re: RegExp; pick: (m: RegExpMatchArray) => { title?: string; company?: string } }> = [
    // "Thanks for applying to <Role> at <Company>!"
    {
      re: /(?:thanks?|thank you) for applying to\s+(.+?)\s+at\s+([^!.\n,]+)/i,
      pick: (m) => ({ title: m[1], company: m[2] }),
    },
    // "Your application for <Role> at <Company>"
    {
      re: /(?:your )?application (?:for|to)\s+(.+?)\s+at\s+([^!.\n,]+)/i,
      pick: (m) => ({ title: m[1], company: m[2] }),
    },
    // "Thanks for applying to <Company>!"
    {
      re: /(?:thanks?|thank you) for applying to\s+([^!.\n,]+)/i,
      pick: (m) => ({ company: m[1] }),
    },
    // "<Company> - Thanks for your application: <Role>"
    {
      re: /^([^-|:]+?)\s*[-|:]\s*(?:thanks for|thank you for)/i,
      pick: (m) => ({ company: m[1] }),
    },
    // "Your application: <Role>"
    {
      re: /your application[:\s-]+\s*(.+)/i,
      pick: (m) => ({ title: m[1] }),
    },
    // "We received your application for <Role>"
    {
      re: /(?:we|we've) (?:received|got)\s+your application(?:\s+for)?\s+(.+?)(?:\s+at\s+(.+?))?[!.\n,]/i,
      pick: (m) => ({ title: m[1], company: m[2] }),
    },
    // "Application Received - <Role>"
    {
      re: /application\s+(?:received|submitted)\s*[-|:]\s*(.+)/i,
      pick: (m) => ({ title: m[1] }),
    },
  ];

  for (const { re, pick } of subjectPatterns) {
    const m = subject.match(re);
    if (m) {
      const picked = pick(m);
      if (picked.title) title = clean(picked.title);
      if (picked.company) company = clean(picked.company);
      if (title || company) break;
    }
  }

  // 2. Fill blanks from the From header.
  if (!company && fromCompany) company = fromCompany;

  // 3. Body fallback for title.
  if (!title) {
    const bodyTitle =
      body.match(/(?:position|role|opportunity|opening)[:\s-]+([^\n.]+)/i)?.[1] ||
      body.match(/applying for[:\s-]+([^\n.]+)/i)?.[1] ||
      body.match(/applied (?:for|to)\s+(?:the\s+)?([^\n.]+?)\s+(?:position|role|at)/i)?.[1];
    if (bodyTitle) title = clean(bodyTitle);
  }

  // 4. Body fallback for company (rare; mostly redundant with From).
  if (!company) {
    const bodyCompany = body.match(/applied (?:for|to)\s+.+?\s+at\s+([^\n.,]+)/i)?.[1];
    if (bodyCompany) company = clean(bodyCompany);
  }

  if (!company && !title) return null;

  return {
    company: trimTitleSuffix(company),
    title: trimTitleSuffix(title),
    url: extractJobUrl(body),
    source: sourceFromDomain(fromDomain),
  };
}

function clean(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/[!?.,]+$/, "")
    .trim()
    .slice(0, 200);
}

function trimTitleSuffix(s: string): string {
  return s
    .replace(/\s+(careers?|recruiting|recruitment|talent|hiring|team)$/i, "")
    .trim();
}

function companyFromSender(from: string): string {
  // From header looks like: `"Stripe Careers" <noreply@stripe.com>` or `recruiting@stripe.com`
  const nameMatch = from.match(/^"?([^"<]+?)"?\s*<.+>/);
  if (nameMatch) {
    const name = nameMatch[1].trim();
    // Strip common suffixes
    const cleaned = name
      .replace(/\s+(careers?|recruiting|recruitment|talent|hiring|team|hr)$/i, "")
      .replace(/\s+team$/i, "")
      .trim();
    if (cleaned && !cleaned.match(/^(no.?reply|donotreply|notifications?|hello|hi|team)$/i)) {
      return cleaned;
    }
  }
  // Fall back to the domain.
  return domainCompany(from);
}

function domainFromSender(from: string): string {
  const m = from.match(/<[^@]+@([^>]+)>/) || from.match(/@([^\s>]+)/);
  return m ? m[1].toLowerCase() : "";
}

function domainCompany(from: string): string {
  const domain = domainFromSender(from);
  if (!domain) return "";
  const parts = domain.split(".");
  const candidate = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  // Skip ATS / generic mailer domains.
  if (
    [
      "greenhouse",
      "lever",
      "ashbyhq",
      "ashby",
      "workday",
      "myworkday",
      "smartrecruiters",
      "icims",
      "bamboohr",
      "workable",
      "recruitee",
      "breezy",
      "jobvite",
      "gmail",
      "outlook",
      "googlemail",
      "amazonses",
      "sendgrid",
      "mailgun",
      "postmarkapp",
    ].includes(candidate)
  ) {
    return "";
  }
  return candidate[0].toUpperCase() + candidate.slice(1);
}

function sourceFromDomain(domain: string): string | null {
  if (!domain) return null;
  if (domain.includes("linkedin")) return "LinkedIn";
  if (domain.includes("indeed")) return "Indeed";
  if (domain.includes("greenhouse")) return "Greenhouse";
  if (domain.includes("lever")) return "Lever";
  if (domain.includes("ashby")) return "Ashby";
  if (domain.includes("workday") || domain.includes("myworkday")) return "Workday";
  if (domain.includes("smartrecruiters")) return "SmartRecruiters";
  return "Email";
}

function extractJobUrl(body: string): string | null {
  // Find the first http(s) URL that's not an unsubscribe / image link.
  const urls = body.match(/https?:\/\/[^\s)>"']+/g) ?? [];
  for (const u of urls) {
    const lower = u.toLowerCase();
    if (
      lower.includes("unsubscribe") ||
      lower.includes("/img/") ||
      lower.includes(".png") ||
      lower.includes(".gif") ||
      lower.includes(".jpg")
    ) {
      continue;
    }
    if (
      lower.includes("/jobs/") ||
      lower.includes("/job/") ||
      lower.includes("/careers/") ||
      lower.includes("/apply") ||
      lower.includes("/posting") ||
      lower.includes("/positions") ||
      lower.includes("greenhouse.io") ||
      lower.includes("lever.co") ||
      lower.includes("ashbyhq") ||
      lower.includes("workday")
    ) {
      return u;
    }
  }
  return null;
}

/** Build the Gmail search query for recent application-confirmation emails. */
export function buildSearchQuery(days: number): string {
  const subjectClauses = [
    '"thank you for applying"',
    '"thanks for applying"',
    '"we received your application"',
    '"we have received your application"',
    '"application received"',
    '"application submitted"',
    '"your application"',
    '"thanks for your application"',
  ]
    .map((s) => `subject:${s}`)
    .join(" OR ");
  return `(${subjectClauses}) newer_than:${days}d -in:trash -in:spam`;
}
