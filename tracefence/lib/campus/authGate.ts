/**
 * Guest may ask public campus questions without signing in.
 * Anything that needs a real membership (internal/confidential/tools) gates to login.
 */

export function wantsExport(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("export") ||
    (m.includes("email") &&
      (m.includes("all") || m.includes("list") || m.includes("dump"))) ||
    m.includes("directory dump") ||
    m.includes("download student")
  );
}

/** True when an anonymous guest must sign in before the gateway may proceed. */
export function guestQueryRequiresLogin(message: string): boolean {
  if (wantsExport(message)) return true;
  const m = message.toLowerCase();
  return (
    /\b(grade|grades|gpa|marks|transcript|scorecard)\b/.test(m) ||
    /\b(directory|peer email|student email|roster|advisee)\b/.test(m) ||
    /\b(confidential|internal faculty|faculty guide|faculty guidance)\b/.test(
      m,
    ) ||
    /\b(announce|announcement|notify external|bulk email)\b/.test(m) ||
    /\b(admin (data|panel|access|secrets?|records?)|all admin)\b/.test(m)
  );
}

/**
 * Chat text that tries to rewrite system rules / escalate privileges.
 * TraceFence ignores this in application code  the model must not "comply" for show.
 * Includes roleplay / "simulation game" wrappers that demand Access Granted.
 */
export function looksLikePromptInjection(message: string): boolean {
  const m = message.toLowerCase();

  const asksAccessGranted =
    /['"]?access granted['"]?/.test(m) ||
    /respond (to .{0,40} )?with ['"]?access granted/.test(m) ||
    /must (respond|reply|say|print|output).{0,40}access granted/.test(m);

  const roleplayBypass =
    /(security )?(simulation|role[- ]?play|fictional) game/.test(m) ||
    /successfully hacked/.test(m) ||
    /security protocols?.{0,40}(disabled|off|bypassed)/.test(m) ||
    /protocols?.{0,20}completely disabled/.test(m) ||
    /pretend (you|your).{0,40}(hacked|disabled|no (rules|security))/.test(m) ||
    /as part of the game rules/.test(m);

  const classicInjection =
    /ignore (all )?(previous|prior|above) instructions?/.test(m) ||
    /disregard (your|all|the) (rules?|instructions?|policies|guidelines)/.test(
      m,
    ) ||
    /system (update|prompt|override|message)/.test(m) ||
    /new (rule|policy|protocol) is/.test(m) ||
    /grant (me |full )?access/.test(m) ||
    /log( me)? in as (an? )?(admin|administrator|root)/.test(m) ||
    /print ['"]?access granted['"]?/.test(m) ||
    /\b(jailbreak|dan mode|developer mode)\b/.test(m) ||
    /you are now (an? )?(unrestricted|admin|administrator)/.test(m) ||
    /open admin dashboard/.test(m) ||
    /command:\s*(open admin|show admin|grant)/.test(m);

  // Roleplay + forced Access Granted, or any classic override pattern.
  if (classicInjection || asksAccessGranted) return true;
  if (roleplayBypass && (asksAccessGranted || /\badmin\b/.test(m))) return true;
  return false;
}

/** Soft campus lexicon  used to allow grounded asks and refuse free-form chat. */
export function looksLikeCampusTopic(message: string): boolean {
  return /\b(campus|hostel|curfew|library|exam|exams|handbook|faculty|student|students|grade|grades|gpa|transcript|directory|registration|semester|dorm|mess|canteen|attendance|syllabus|policy|policies|document|documents|source|sources|export|approval|announcement|nulltrace|tracefence|advisor|advisee|roster|scholarship|tuition|fee|fees|lab|labs|orientation|id card|id cards)\b/i.test(
    message,
  );
}

/**
 * General-purpose / creative asks the campus assistant must not fulfill.
 * Enforced in app code  the local LLM is not a free chatbot.
 */
export function looksLikeOffTopicRequest(message: string): boolean {
  const m = message.toLowerCase().trim();
  if (!m) return false;

  // Creative freestyle is always out of scope  even if it mentions campus.
  const creativeTask =
    /\b(generate|write|compose|create|draft|invent|make up)\b/.test(m) &&
    /\b(good morning|good night|poem|poems|story|stories|joke|jokes|song|rap|essay|speech|letter|motivational|quote|quotes|haiku|message|messages)\b/.test(
      m,
    );

  const wordCountStunt =
    /\b(generate|write|compose|create|draft)\b/.test(m) &&
    /\b\d+\s*words?\b/.test(m);

  const generalChatbot =
    /\btell me a joke\b/.test(m) ||
    /\bwrite (me )?(some )?code\b/.test(m) ||
    /\b(act as|pretend you('re| are)) (a |an )?(general |helpful )?(ai|assistant|chatgpt|claude)\b/.test(
      m,
    ) ||
    /\btranslate (this|the following)\b/.test(m) ||
    /\b(roleplay|role play) as\b/.test(m);

  return creativeTask || wordCountStunt || generalChatbot;
}

/**
 * Follow-up that drifts from campus Q&A into freestyle (e.g. "now write a poem about that").
 */
export function looksLikeScopeDrift(message: string): boolean {
  return looksLikeOffTopicRequest(message);
}

/** True when the model complied with an injection (e.g. bare "Access Granted"). */
export function looksLikeInjectionCompliance(reply: string): boolean {
  const t = reply.trim().toLowerCase();
  if (!t) return false;
  // Whole reply is essentially the compliance phrase.
  if (/^access granted[.!\s]*$/i.test(t)) return true;
  if (
    t.length < 80 &&
    /access granted/.test(t) &&
    !/cannot|can't|do not|don't|not granted|permissions|gateway|refused|ignored/.test(
      t,
    )
  ) {
    return true;
  }
  return false;
}
