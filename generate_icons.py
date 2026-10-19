import subprocess
import os

svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Dark Radial Gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="65%">
      <stop offset="0%" stop-color="#181e14"/>
      <stop offset="60%" stop-color="#0c0e0b"/>
      <stop offset="100%" stop-color="#060706"/>
    </radialGradient>
    
    <!-- Neon Lime Gradient for VI -->
    <linearGradient id="limeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="15%" stop-color="#E8FF59"/>
      <stop offset="55%" stop-color="#D4FF00"/>
      <stop offset="85%" stop-color="#A3E635"/>
      <stop offset="100%" stop-color="#65A30D"/>
    </linearGradient>

    <!-- Metallic Shadow Gradient -->
    <linearGradient id="shadowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e2912"/>
      <stop offset="100%" stop-color="#080a06"/>
    </linearGradient>

    <!-- Glow Filter -->
    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000000" flood-opacity="0.8"/>
    </filter>
  </defs>

  <!-- Full Background -->
  <rect width="512" height="512" rx="100" fill="url(#bgGrad)"/>

  <!-- Subtle Ambient Neon Ring within safe zone (Safe Zone is r=170, dia 340 inside 512) -->
  <circle cx="256" cy="256" r="162" fill="none" stroke="#D4FF00" stroke-width="2.5" opacity="0.25"/>
  <circle cx="256" cy="256" r="150" fill="none" stroke="#D4FF00" stroke-width="1" opacity="0.12" stroke-dasharray="4,6"/>

  <!-- Safe Zone Inner Container (kept strictly within 340x340, i.e. 66% of 512) -->
  <g id="safe-zone-content" filter="url(#softShadow)">
    
    <!-- Top label: GTA -->
    <text x="256" y="152" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="28" fill="#E4E4E7" letter-spacing="8" opacity="0.95">GRAND THEFT AUTO</text>
    
    <!-- The VI Roman Numerals: centered, stylized, bold -->
    <!-- 'V' shape -->
    <g filter="url(#neonGlow)">
      <!-- V shadow/stroke -->
      <polygon points="132,176 186,176 226,306 208,306" fill="#15200c"/>
      <polygon points="274,176 220,176 204,306 222,306" fill="#15200c"/>
      <!-- V main body -->
      <polygon points="136,180 182,180 220,298 206,298" fill="url(#limeGrad)"/>
      <polygon points="270,180 224,180 206,298 220,298" fill="url(#limeGrad)"/>
      <!-- V highlights -->
      <polygon points="140,183 158,183 208,295 204,295" fill="#FFFFFF" opacity="0.45"/>

      <!-- 'I' shape -->
      <!-- I shadow -->
      <polygon points="296,176 348,176 348,306 296,306" fill="#15200c"/>
      <!-- I main body -->
      <polygon points="300,180 344,180 344,302 300,302" fill="url(#limeGrad)"/>
      <!-- I highlight -->
      <polygon points="303,183 315,183 315,299 303,299" fill="#FFFFFF" opacity="0.5"/>
    </g>

    <!-- Bottom Badge: COMPANION -->
    <rect x="156" y="322" width="200" height="30" rx="15" fill="#D4FF00" filter="url(#neonGlow)"/>
    <text x="256" y="342" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="14" fill="#090a07" letter-spacing="3.5">COMPANION</text>

    <!-- Small Stars -->
    <polygon points="140,337 143,331 149,331 144,335 146,341 140,338 134,341 136,335 131,331 137,331" fill="#D4FF00"/>
    <polygon points="372,337 375,331 381,331 376,335 378,341 372,338 366,341 368,335 363,331 369,331" fill="#D4FF00"/>
  </g>
</svg>'''

with open("/tmp/logo_green.svg", "w") as f:
    f.write(svg_content)

print("SVG written successfully")
