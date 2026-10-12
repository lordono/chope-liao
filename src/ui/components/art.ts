/**
 * Original inline SVG artwork. Colours come from CSS custom properties so
 * everything follows light/dark themes.
 *
 * Characters: "Kopi" (a cheerful kopi cup) and "Kaya" (a slice of kaya
 * toast). Both are original designs, not existing mascots.
 */

export const SKYLINE_SVG = `
<svg class="skyline" viewBox="0 0 400 260" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--sky-top)"/>
      <stop offset="1" stop-color="var(--sky-bottom)"/>
    </linearGradient>
  </defs>
  <rect width="400" height="260" fill="url(#sky)"/>
  <circle class="sun" cx="300" cy="70" r="26" fill="var(--sun)"/>
  <g class="layer-far" fill="var(--city-far)">
    <rect x="10" y="120" width="26" height="90"/><rect x="40" y="96" width="18" height="114"/>
    <rect x="62" y="130" width="30" height="80"/><rect x="96" y="80" width="14" height="130"/>
    <rect x="114" y="110" width="24" height="100"/><rect x="142" y="100" width="20" height="110"/>
    <path d="M168 210 V92 l12 -14 l12 14 V210z"/><rect x="198" y="118" width="28" height="92"/>
    <rect x="232" y="88" width="16" height="122"/><rect x="252" y="124" width="34" height="86"/>
    <rect x="292" y="104" width="22" height="106"/><rect x="318" y="132" width="30" height="78"/>
    <rect x="352" y="98" width="18" height="112"/><rect x="374" y="120" width="26" height="90"/>
  </g>
  <g class="layer-mid" fill="var(--city-mid)">
    <rect x="0" y="150" width="54" height="70" rx="2"/><rect x="60" y="138" width="44" height="82" rx="2"/>
    <rect x="200" y="146" width="50" height="74" rx="2"/><rect x="256" y="160" width="40" height="60" rx="2"/>
    <g fill="var(--window)" opacity=".75">
      <rect x="6" y="158" width="6" height="5"/><rect x="18" y="158" width="6" height="5"/><rect x="30" y="158" width="6" height="5"/><rect x="42" y="158" width="6" height="5"/>
      <rect x="6" y="170" width="6" height="5"/><rect x="18" y="170" width="6" height="5"/><rect x="42" y="170" width="6" height="5"/>
      <rect x="66" y="146" width="6" height="5"/><rect x="78" y="146" width="6" height="5"/><rect x="90" y="146" width="6" height="5"/>
      <rect x="66" y="158" width="6" height="5"/><rect x="90" y="158" width="6" height="5"/><rect x="78" y="170" width="6" height="5"/>
      <rect x="206" y="154" width="6" height="5"/><rect x="218" y="154" width="6" height="5"/><rect x="230" y="154" width="6" height="5"/>
      <rect x="206" y="166" width="6" height="5"/><rect x="230" y="166" width="6" height="5"/><rect x="262" y="168" width="6" height="5"/><rect x="274" y="168" width="6" height="5"/>
    </g>
    <!-- shophouse row -->
    <path d="M108 220 V172 l14 -10 l14 10 l14 -10 l14 10 l14 -10 l14 10 V220z"/>
  </g>
  <g class="merlion-wrap" transform="translate(326 120) scale(1.3)"><g class="merlion">
    <path class="spout" d="M-4 6 C -30 -10, -52 4, -60 30" fill="none" stroke="var(--water-light)" stroke-width="4" stroke-linecap="round" stroke-dasharray="3 5"/>
    <path d="M10 70 C 2 50, 6 30, 18 22 C 30 30, 34 52, 26 70 z" fill="var(--merlion)"/>
    <path d="M26 70 C 40 66, 46 56, 44 46 C 52 54, 52 66, 40 74 z" fill="var(--merlion-shade)"/>
    <circle cx="12" cy="10" r="15" fill="var(--merlion-shade)"/>
    <circle cx="10" cy="11" r="10" fill="var(--merlion)"/>
    <circle cx="6" cy="8" r="1.6" fill="var(--ink)"/>
    <path d="M2 14 q 3 3 6 0" stroke="var(--ink)" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M18 34 q 4 6 0 12 M22 42 q 4 6 0 12" stroke="var(--merlion-shade)" stroke-width="2" fill="none"/>
    <rect x="-6" y="70" width="58" height="10" rx="3" fill="var(--city-mid)"/>
  </g></g>
  <rect class="water" x="0" y="216" width="400" height="44" fill="var(--water)"/>
  <g class="ripples" stroke="var(--water-light)" stroke-width="2" stroke-linecap="round" opacity=".6">
    <path d="M30 232 h24 M120 244 h30 M220 230 h18 M300 246 h28 M360 234 h20"/>
  </g>
</svg>`;

export const KOPI_CHAR = `
<svg class="char char-kopi" viewBox="0 0 100 110" aria-hidden="true" focusable="false">
  <g class="steam" stroke="var(--steam)" stroke-width="3" fill="none" stroke-linecap="round">
    <path d="M38 14 q -6 -6 0 -12"/><path d="M52 16 q -6 -7 0 -14"/><path d="M66 14 q -6 -6 0 -12"/>
  </g>
  <path d="M82 46 q 16 2 14 16 q -2 14 -18 12" fill="none" stroke="var(--cup)" stroke-width="7"/>
  <path d="M18 30 h66 l-6 62 q -1 10 -11 10 h-32 q -10 0 -11 -10z" fill="var(--cup)"/>
  <path d="M20 36 h62" stroke="var(--kopi)" stroke-width="8"/>
  <g class="face">
    <circle class="eye" cx="40" cy="60" r="4" fill="var(--ink)"/>
    <circle class="eye" cx="62" cy="60" r="4" fill="var(--ink)"/>
    <path d="M42 72 q 9 8 18 0" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="33" cy="70" r="4" fill="var(--blush)" opacity=".7"/><circle cx="69" cy="70" r="4" fill="var(--blush)" opacity=".7"/>
  </g>
  <ellipse cx="51" cy="104" rx="36" ry="5" fill="var(--saucer)"/>
</svg>`;

export const KAYA_CHAR = `
<svg class="char char-kaya" viewBox="0 0 100 110" aria-hidden="true" focusable="false">
  <path d="M14 46 q -8 -30 22 -34 q 14 -10 28 0 q 30 4 22 34 v46 q 0 10 -10 10 h-52 q -10 0 -10 -10z" fill="var(--toast-crust)"/>
  <path d="M22 48 q -6 -24 18 -26 q 10 -8 20 0 q 24 2 18 26 v40 q 0 6 -6 6 h-44 q -6 0 -6 -6z" fill="var(--toast)"/>
  <path d="M24 62 h52" stroke="var(--kaya)" stroke-width="6" stroke-linecap="round"/>
  <rect x="40" y="56" width="20" height="10" rx="2" fill="var(--butter)"/>
  <g class="face">
    <circle class="eye" cx="40" cy="76" r="4" fill="var(--ink)"/>
    <circle class="eye" cx="60" cy="76" r="4" fill="var(--ink)"/>
    <path d="M44 86 q 6 5 12 0" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;

/** Kopi cup for the result reveal. `.kopi-fill` is scaled from the bottom. */
export const BREW_CUP = `
<svg class="brew" viewBox="0 0 160 170" role="img" aria-label="A kopi cup filling up">
  <defs>
    <clipPath id="cup-inside"><path d="M30 40 h100 l-10 96 q -2 14 -16 14 h-48 q -14 0 -16 -14z"/></clipPath>
  </defs>
  <g class="brew-steam" stroke="var(--steam)" stroke-width="4" fill="none" stroke-linecap="round" opacity="0">
    <path d="M60 28 q -8 -8 0 -16"/><path d="M80 30 q -8 -9 0 -18"/><path d="M100 28 q -8 -8 0 -16"/>
  </g>
  <path d="M128 64 q 26 2 22 26 q -4 22 -28 18" fill="none" stroke="var(--cup)" stroke-width="9"/>
  <path d="M30 40 h100 l-10 96 q -2 14 -16 14 h-48 q -14 0 -16 -14z" fill="var(--cup-inner)"/>
  <g clip-path="url(#cup-inside)">
    <rect class="kopi-fill" x="20" y="40" width="120" height="112" fill="var(--kopi)"/>
    <path class="kopi-wave" d="M20 40 q 15 -6 30 0 t 30 0 t 30 0 t 30 0 v 6 h-120z" fill="var(--kopi-foam)"/>
  </g>
  <path d="M30 40 h100 l-10 96 q -2 14 -16 14 h-48 q -14 0 -16 -14z" fill="none" stroke="var(--cup)" stroke-width="6"/>
  <ellipse cx="80" cy="160" rx="58" ry="7" fill="var(--saucer)"/>
</svg>`;

export const CONFETTI_CUP = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h12l-1.4 10a2 2 0 0 1-2 1.8H6.4a2 2 0 0 1-2-1.8z" fill="#f5efe6"/><path d="M15 7.5c3 0 3 4.5 0 4.5" stroke="#f5efe6" stroke-width="1.6" fill="none"/><rect x="3.3" y="5" width="11.4" height="2.4" fill="#6b3e26"/></svg>`;
export const CONFETTI_TOAST = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8q-1-5 4-5.5q3-2 6 0q5 .5 4 5.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 16z" fill="#c98b3c"/><path d="M5 9q-.5-3.5 2.6-3.8q2.4-1.4 4.8 0Q15.5 5.5 15 9v6H5z" fill="#f4d58d"/><path d="M5.5 11h9" stroke="#3f8f3a" stroke-width="1.6"/></svg>`;
