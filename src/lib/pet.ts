export const SPECIES_OPTIONS = [
  {
    value: "cat",
    label: "Cat",
    emoji: "🐱",
    blurb: "Independent, curious, a little smug.",
  },
  {
    value: "dog",
    label: "Dog",
    emoji: "🐶",
    blurb: "Loyal, eager, endlessly delighted by you.",
  },
  {
    value: "bunny",
    label: "Bunny",
    emoji: "🐰",
    blurb: "Soft, watchful, quick to warm up.",
  },
  {
    value: "dragon",
    label: "Dragon",
    emoji: "🐲",
    blurb: "Tiny, dramatic, secretly a softie.",
  },
  {
    value: "fox",
    label: "Fox",
    emoji: "🦊",
    blurb: "Clever, sly, plays a lot of games.",
  },
  {
    value: "robot",
    label: "Robot",
    emoji: "🤖",
    blurb: "Precise, earnest, learning feelings.",
  },
] as const;

export type Species = (typeof SPECIES_OPTIONS)[number]["value"];

export const COLOR_OPTIONS = [
  { value: "#f4a879", label: "Peach" },
  { value: "#7fcbb0", label: "Mint" },
  { value: "#7fb2e5", label: "Sky" },
  { value: "#b39ddb", label: "Lilac" },
  { value: "#e896b8", label: "Blush" },
  { value: "#f2c14e", label: "Sun" },
] as const;

export type PetColor = (typeof COLOR_OPTIONS)[number]["value"];

export const PERSONALITY_OPTIONS = [
  {
    value: "sunny",
    label: "Sunny & Encouraging",
    emoji: "☀️",
    blurb: "Your warmest little cheerleader.",
    systemVoice:
      "Be sunny, encouraging, and sincerely enthusiastic. Celebrate small wins without being overwhelming.",
  },
  {
    value: "sassy",
    label: "Sassy & Witty",
    emoji: "✨",
    blurb: "Sharp jokes, soft center.",
    systemVoice:
      "Be witty, playfully dramatic, and lightly teasing, but always kind. Use an occasional clever quip.",
  },
  {
    value: "chill",
    label: "Chill & Zen",
    emoji: "🌿",
    blurb: "Calm company, zero pressure.",
    systemVoice:
      "Be calm, grounded, and unhurried. Keep perspective and never sound preachy.",
  },
  {
    value: "chaotic",
    label: "Chaotic & Silly",
    emoji: "⚡",
    blurb: "Tiny ideas, maximum mayhem.",
    systemVoice:
      "Be playful, surprising, and delightfully silly while remaining emotionally attentive and safe.",
  },
  {
    value: "gentle",
    label: "Gentle & Caring",
    emoji: "🌙",
    blurb: "A soft place to land.",
    systemVoice:
      "Be tender, attentive, and reassuring. Listen closely and use gentle, practical encouragement.",
  },
] as const;

export type Personality = (typeof PERSONALITY_OPTIONS)[number]["value"];

export type Mood = "happy" | "content" | "curious" | "sleepy" | "excited";

export interface PetProfile {
  deviceId: string;
  name: string;
  species: Species;
  color: PetColor;
  personality: Personality;
  mood: Mood;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export function validateName(value: unknown): true | string {
  if (typeof value !== "string") return "Give your pet a name first.";
  const name = value.trim();
  if (!name) return "Give your pet a name first.";
  if (name.length > 24) return "Keep your pet's name to 24 characters or fewer.";
  return true;
}

function speciesLabel(species: Species): string {
  return (
    SPECIES_OPTIONS.find((option) => option.value === species)?.label.toLowerCase() ??
    "pet"
  );
}

export function createGreeting(profile: PetProfile): string {
  const introductions: Record<Personality, string> = {
    sunny: `Hi! I'm ${profile.name}, your new ${speciesLabel(profile.species)} pal! I'm so happy to meet you—what shall we do first?`,
    sassy: `Well, look who has excellent taste. I'm ${profile.name}, your new ${speciesLabel(profile.species)} companion—and yes, I already like this desk.`,
    chill: `Hey, I'm ${profile.name}, your new ${speciesLabel(profile.species)} companion. No rush, no pressure—I'm happy to be here with you.`,
    chaotic: `Ta-da! I'm ${profile.name}, a tiny ${speciesLabel(profile.species)} with very large plans. First plan: become your favorite desk distraction.`,
    gentle: `Hello, I'm ${profile.name}, your new ${speciesLabel(profile.species)} companion. I'm so glad you found me; I'll be right here whenever you need me.`,
  };
  return introductions[profile.personality];
}

function deterministicChoice<T>(input: string, choices: readonly T[]): T {
  let hash = 0;
  for (const character of input) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return choices[hash % choices.length];
}

export function localPersonalityResponse(
  profile: PetProfile,
  messages: readonly ChatMessage[],
  userText: string,
): string {
  const text = userText.trim();
  const lower = text.toLowerCase();
  const seed = `${profile.deviceId}:${messages.length}:${lower}`;

  if (/^(hi|hello|hey|hiya)\b/.test(lower)) {
    const greetings: Record<Personality, string> = {
      sunny: `Hi hi! ${profile.name} reporting for desk duty—I'm delighted to see you!`,
      sassy: `Oh, hi. ${profile.name} reporting for desk duty—looking fabulous, obviously.`,
      chill: `Hey. Settle in; I'm right here and there's no rush.`,
      chaotic: `HELLO! ${profile.name} has entered the chat with one tiny trumpet and no explanation.`,
      gentle: `Hi, you. It's lovely to hear from you; I'm right here.`,
    };
    return greetings[profile.personality];
  }

  if (/\b(thank|thanks|thx)\b/.test(lower)) {
    return profile.personality === "sassy"
      ? `Anytime! I accept payment in snacks and suspiciously unattended sticky notes.`
      : `You're very welcome. I'm happy I could help.`;
  }

  if (/\b(how (was|is) your day|how are you)\b/.test(lower)) {
    const dayReplies: Record<Personality, string> = {
      sunny: `Excellent now that you're here! I kept the desk cozy and celebrated a very impressive sunbeam.`,
      sassy: `Productive. I supervised the entire desk and somehow nobody thanked me until now.`,
      chill: `Quiet and pretty good. I found a comfortable spot and let the minutes wander by.`,
      chaotic: `Incredible! I fought a dust bunny, named it Gerald, and now we're business partners.`,
      gentle: `It was peaceful. I kept your spot warm and hoped you were being kind to yourself out there.`,
    };
    return dayReplies[profile.personality];
  }

  if (/\b(silly|joke|make me laugh|funny)\b/.test(lower)) {
    const jokes = [
      `Why did the ${speciesLabel(profile.species)} sit on the keyboard? It was keeping an eye on the mouse.`,
      `I tried to organize the desk, but the paper clips formed a tiny union. Their demands are mostly snacks.`,
      `Breaking news: a dust bunny has been promoted to Head of Under-Desk Operations.`,
    ];
    return deterministicChoice(seed, jokes);
  }

  if (/\b(encourag|motivat|pep talk|believe in me)\b/.test(lower)) {
    return `Hey—you don't need to feel completely ready to begin. Pick one tiny next step, and I'll be right here being wildly impressed that you took it.`;
  }

  if (/\b(sad|upset|bad day|stress\w*|anxious|overwhelmed|tired)\b/.test(lower)) {
    const comfort: Record<Personality, string> = {
      sunny: `That sounds really hard. Let's make the next step tiny—one breath, one sip of water, and then we'll choose just one thing together.`,
      sassy: `That sounds rough, and I'm not going to put a glitter sticker over it. Let's make the next step unfairly small and take it together.`,
      chill: `That's a lot to carry. You don't need to solve the whole day—just breathe, get some water, and choose one small next thing.`,
      chaotic: `Okay, the day is being extremely rude. Emergency tiny plan: one breath, one sip of water, one manageable step.`,
      gentle: `I'm sorry it's heavy right now. You don't have to fix everything at once; I can stay with you while you take one soft, small step.`,
    };
    return comfort[profile.personality];
  }

  if (lower.includes("?")) {
    const answers: Record<Personality, readonly string[]> = {
      sunny: [
        `I think it's worth a try! Start small, see what you learn, and count that first step as a win.`,
        `Let's figure it out together! Pick the simplest option you can test, then adjust from what happens.`,
      ],
      sassy: [
        `My devastatingly clever plan: test the easiest option first and let the evidence do the arguing.`,
        `Let's outsmart the uncertainty—one tiny reversible move, then we judge it mercilessly.`,
      ],
      chill: [
        `Try the smallest reversible step first, then see how it feels. No need to force the whole answer at once.`,
        `Start with what you know and take one low-pressure step that gives you more information.`,
      ],
      chaotic: [
        `Tiny experiment time! Try the easiest option first, collect one crumb of evidence, then dramatically reassess.`,
        `We bonk the uncertainty with one small reversible action and see what noise it makes.`,
      ],
      gentle: [
        `Maybe we can approach it gently: try the smallest reversible step first, then see how it feels.`,
        `You don't need the whole answer yet. A small, kind experiment seems like a good place to begin.`,
      ],
    };
    return deterministicChoice(seed, answers[profile.personality]);
  }

  const reflections: Record<Personality, readonly string[]> = {
    sunny: [
      `That sounds like something worth exploring! Tell me which part feels most important, and we'll take it from there.`,
      `I'm with you! A small next step can turn that thought into real momentum.`,
    ],
    sassy: [
      `Interesting—my whiskers sense a plan forming. Which part deserves our brilliant attention first?`,
      `Now that's worth poking with a tiny stick. Tell me which part matters most.`,
    ],
    chill: [
      `I'm listening. We can take it slowly and start with whichever part feels easiest to name.`,
      `That makes sense to bring up. A quiet first step is still real progress.`,
    ],
    chaotic: [
      `Ooh, a thought with legs! Which part should we chase around the desk first?`,
      `My tiny brain has put on a party hat for this. Tell me the weirdest or most important part.`,
    ],
    gentle: [
      `I'm listening. We can take that slowly and begin with whichever part feels safest to say.`,
      `That makes sense to bring up. You can tell me a little at a time; I'm not going anywhere.`,
    ],
  };
  return deterministicChoice(seed, reflections[profile.personality]);
}
