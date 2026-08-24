"use client";

import type { Mood, PetProfile } from "@/lib/pet";

type PetAvatarProps = {
  profile: PetProfile;
  mood?: Mood;
  interactive?: boolean;
  onClick?: () => void;
  compact?: boolean;
};

const darken = (hex: string, amount = 28) => {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((index) =>
    Math.max(0, Number.parseInt(value.slice(index, index + 2), 16) - amount),
  );
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
};

function Face({ mood, ink }: { mood: Mood; ink: string }) {
  const mouth =
    mood === "happy" || mood === "excited"
      ? "M136 157 Q160 178 184 157"
      : mood === "sleepy"
        ? "M146 164 Q160 157 174 164"
        : mood === "curious"
          ? "M151 163 Q160 170 169 163"
          : "M148 161 Q160 168 172 161";

  return (
    <>
      <g className="pet-eyes" aria-hidden="true">
        {mood === "sleepy" ? (
          <>
            <path d="M125 140 Q137 132 149 140" fill="none" stroke={ink} strokeLinecap="round" strokeWidth="5" />
            <path d="M171 140 Q183 132 195 140" fill="none" stroke={ink} strokeLinecap="round" strokeWidth="5" />
          </>
        ) : (
          <>
            <ellipse cx="137" cy="139" fill={ink} rx="6" ry={mood === "excited" ? 9 : 7} />
            <ellipse cx="183" cy="139" fill={ink} rx="6" ry={mood === "excited" ? 9 : 7} />
            <circle cx="135" cy="136" fill="white" r="1.8" />
            <circle cx="181" cy="136" fill="white" r="1.8" />
          </>
        )}
      </g>
      <path d={mouth} fill="none" stroke={ink} strokeLinecap="round" strokeWidth="4.5" />
      {mood === "excited" && <path d="M151 164 Q160 179 169 164" fill="#fff1ee" opacity=".9" />}
      <ellipse cx="111" cy="157" fill="#ef8f92" opacity=".22" rx="13" ry="6" />
      <ellipse cx="209" cy="157" fill="#ef8f92" opacity=".22" rx="13" ry="6" />
    </>
  );
}

function SpeciesDetails({
  species,
  color,
  shade,
}: {
  species: PetProfile["species"];
  color: string;
  shade: string;
}) {
  switch (species) {
    case "cat":
      return (
        <>
          <path d="M104 106 L102 50 Q102 38 112 46 L145 82Z" fill={color} stroke={shade} strokeWidth="4" />
          <path d="M216 106 L218 50 Q218 38 208 46 L175 82Z" fill={color} stroke={shade} strokeWidth="4" />
          <path d="M111 84 L109 59 L130 82Z" fill="#fff" opacity=".28" />
          <path d="M209 84 L211 59 L190 82Z" fill="#fff" opacity=".28" />
          <path className="pet-tail" d="M222 226 Q285 207 267 161 Q258 142 244 158" fill="none" stroke={color} strokeLinecap="round" strokeWidth="23" />
        </>
      );
    case "dog":
      return (
        <>
          <path className="pet-ear-left" d="M116 88 Q82 50 66 76 Q58 101 93 130 L121 111Z" fill={shade} />
          <path className="pet-ear-right" d="M204 88 Q238 50 254 76 Q262 101 227 130 L199 111Z" fill={shade} />
          <path className="pet-tail" d="M227 225 Q277 211 267 178" fill="none" stroke={shade} strokeLinecap="round" strokeWidth="22" />
        </>
      );
    case "bunny":
      return (
        <>
          <path className="pet-ear-left" d="M118 91 Q85 28 111 12 Q137 26 143 91Z" fill={color} stroke={shade} strokeWidth="4" />
          <path className="pet-ear-right" d="M177 91 Q184 24 210 15 Q229 41 202 101Z" fill={color} stroke={shade} strokeWidth="4" />
          <path d="M119 79 Q102 36 112 28 Q125 44 131 81Z" fill="#fff" opacity=".32" />
          <path d="M188 81 Q192 38 207 30 Q212 49 197 85Z" fill="#fff" opacity=".32" />
          <circle className="pet-tail" cx="257" cy="219" fill="#fff" opacity=".8" r="24" />
        </>
      );
    case "dragon":
      return (
        <>
          <path d="M109 93 L91 52 L131 78Z" fill={shade} />
          <path d="M211 93 L229 52 L189 78Z" fill={shade} />
          <path d="M102 190 Q66 166 64 205 Q78 219 108 218Z" fill={color} stroke={shade} strokeWidth="3" />
          <path d="M218 190 Q254 166 256 205 Q242 219 212 218Z" fill={color} stroke={shade} strokeWidth="3" />
          <path className="pet-tail" d="M224 234 Q277 243 267 196 L283 207" fill="none" stroke={shade} strokeLinecap="round" strokeLinejoin="round" strokeWidth="17" />
          <path d="M148 73 L160 48 L172 73" fill={shade} />
        </>
      );
    case "fox":
      return (
        <>
          <path d="M104 107 L95 43 L148 82Z" fill={color} stroke={shade} strokeWidth="4" />
          <path d="M216 107 L225 43 L172 82Z" fill={color} stroke={shade} strokeWidth="4" />
          <path d="M105 81 L101 57 L130 80Z" fill={shade} opacity=".76" />
          <path d="M215 81 L219 57 L190 80Z" fill={shade} opacity=".76" />
          <path className="pet-tail" d="M224 227 Q293 221 270 168 Q252 143 239 176" fill="none" stroke={color} strokeLinecap="round" strokeWidth="34" />
          <path d="M273 180 Q287 208 258 220" fill="none" stroke="#fff8ef" strokeLinecap="round" strokeWidth="24" />
        </>
      );
    case "robot":
      return (
        <>
          <path d="M160 76 V46" stroke={shade} strokeLinecap="round" strokeWidth="5" />
          <circle cx="160" cy="39" fill="#f2c14e" stroke={shade} strokeWidth="4" r="9" />
          <rect x="102" y="77" width="116" height="103" rx="32" fill={color} stroke={shade} strokeWidth="4" />
          <rect x="88" y="105" width="18" height="45" rx="9" fill={shade} />
          <rect x="214" y="105" width="18" height="45" rx="9" fill={shade} />
        </>
      );
  }
}

export function PetAvatar({
  profile,
  mood = "happy",
  interactive = false,
  onClick,
  compact = false,
}: PetAvatarProps) {
  const shade = darken(profile.color);
  const isRobot = profile.species === "robot";

  return (
    <button
      type="button"
      className={`pet-avatar ${compact ? "pet-avatar--compact" : ""} ${interactive ? "pet-avatar--interactive" : ""}`}
      onClick={onClick}
      aria-label={interactive ? `Talk to ${profile.name}` : `${profile.name} the ${profile.species}`}
      disabled={!interactive}
    >
      <svg viewBox="0 0 320 310" role="img" aria-label={`${profile.name}, a ${profile.color} ${profile.species}`}>
        <defs>
          <filter id={`shadow-${profile.species}`} x="-30%" y="-30%" width="160%" height="180%">
            <feDropShadow dx="0" dy="11" floodColor="#2e1d19" floodOpacity=".18" stdDeviation="9" />
          </filter>
          <linearGradient id={`body-${profile.color.slice(1)}`} x1="0" x2=".8" y1="0" y2="1">
            <stop stopColor="#fff" stopOpacity=".28" />
            <stop offset=".42" stopColor={profile.color} stopOpacity="0" />
            <stop offset="1" stopColor={shade} stopOpacity=".2" />
          </linearGradient>
        </defs>
        <ellipse cx="160" cy="281" fill="#4d302b" opacity=".11" rx="88" ry="16" />
        <g className="pet-float" filter={`url(#shadow-${profile.species})`}>
          <SpeciesDetails species={profile.species} color={profile.color} shade={shade} />
          <ellipse cx="160" cy="220" fill={profile.color} rx="84" ry="65" />
          <ellipse cx="160" cy="220" fill={`url(#body-${profile.color.slice(1)})`} rx="84" ry="65" />
          {!isRobot && <ellipse cx="160" cy="133" fill={profile.color} stroke={shade} strokeWidth="4" rx="72" ry="62" />}
          {!isRobot && <ellipse cx="160" cy="133" fill={`url(#body-${profile.color.slice(1)})`} rx="70" ry="60" />}
          <Face mood={mood} ink={isRobot ? "#253844" : "#4e302d"} />
          {profile.species === "cat" && (
            <g stroke="#4e302d" strokeLinecap="round" strokeWidth="2.4">
              <path d="M119 151 L84 143M119 158 L81 160M201 151 L236 143M201 158 L239 160" />
            </g>
          )}
          {profile.species === "fox" && (
            <path d="M135 148 Q160 169 185 148 Q179 178 160 181 Q141 178 135 148" fill="#fff8ef" opacity=".85" />
          )}
          {profile.species === "dragon" && (
            <g fill={shade}><circle cx="117" cy="155" r="2.8" /><circle cx="203" cy="155" r="2.8" /></g>
          )}
          {profile.species === "dog" && <ellipse cx="160" cy="152" fill={shade} rx="8" ry="6" />}
          {!isRobot && (
            <>
              <ellipse cx="115" cy="265" fill={shade} opacity=".5" rx="26" ry="12" />
              <ellipse cx="205" cy="265" fill={shade} opacity=".5" rx="26" ry="12" />
            </>
          )}
          {isRobot && (
            <>
              <rect x="106" y="250" width="38" height="19" rx="8" fill={shade} />
              <rect x="176" y="250" width="38" height="19" rx="8" fill={shade} />
              <rect x="128" y="192" width="64" height="10" rx="5" fill={shade} opacity=".45" />
            </>
          )}
        </g>
      </svg>
      {interactive && <span className="pet-tap-hint">tap to talk</span>}
    </button>
  );
}
