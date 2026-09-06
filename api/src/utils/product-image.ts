const productPhotos: Record<string, string> = {
  "Air Mineral 600ml": "air-mineral-600ml",
  Americano: "americano",
  "Kopi Susu Gula Aren": "kopi-susu-gula-aren",
  "Matcha Latte": "matcha-latte",
  "Croissant Butter": "croissant-butter",
  "Roti Cokelat": "roti-cokelat",
  "Nasi Goreng Spesial": "nasi-goreng-spesial",
  "Mie Goreng": "mie-goreng",
  "Keripik Kentang": "keripik-kentang",
  "Biskuit Cokelat": "biskuit-cokelat",
  "Kacang Panggang": "kacang-panggang",
  "Cokelat Bar": "cokelat-bar",
  "Sabun Mandi": "sabun-mandi",
  "Sampo 170ml": "sampo-170ml",
  "Tisu Wajah": "tisu-wajah",
  "Deterjen 800g": "deterjen-800g",
  "Kemeja Oxford": "kemeja-oxford",
  "Kaos Basic": "kaos-basic",
  "Kabel USB-C": "kabel-usb-c",
  "Charger 20W": "charger-20w",
};

type ProductImageTheme = {
  icon: string;
  bg: string;
  accent: string;
  soft: string;
};

const productImageThemes: Record<string, ProductImageTheme> = {
  "Kopi Susu Gula Aren": {
    icon: "cup",
    bg: "#f4eadf",
    accent: "#7c3f20",
    soft: "#d8a45f",
  },
  Americano: { icon: "cup", bg: "#eee5dc", accent: "#3c2415", soft: "#b8895b" },
  "Matcha Latte": {
    icon: "cup",
    bg: "#edf5df",
    accent: "#4f7d3a",
    soft: "#a6c86f",
  },
  "Air Mineral 600ml": {
    icon: "bottle",
    bg: "#e7f4fb",
    accent: "#1c78a6",
    soft: "#7cc8e8",
  },
  "Croissant Butter": {
    icon: "croissant",
    bg: "#fff3dc",
    accent: "#c17817",
    soft: "#f2bd58",
  },
  "Roti Cokelat": {
    icon: "bread",
    bg: "#f5e5db",
    accent: "#79432a",
    soft: "#d99563",
  },
  "Nasi Goreng Spesial": {
    icon: "plate",
    bg: "#fff4df",
    accent: "#b95225",
    soft: "#f1b75c",
  },
  "Mie Goreng": {
    icon: "bowl",
    bg: "#fff0d9",
    accent: "#bd5b20",
    soft: "#f0bf66",
  },
  "Keripik Kentang": {
    icon: "bag",
    bg: "#fff4cf",
    accent: "#d18a00",
    soft: "#f6cf57",
  },
  "Biskuit Cokelat": {
    icon: "cookie",
    bg: "#f4e3d8",
    accent: "#6f3e25",
    soft: "#c99161",
  },
  "Kacang Panggang": {
    icon: "nuts",
    bg: "#f8ebd7",
    accent: "#9a5b22",
    soft: "#d5a25e",
  },
  "Cokelat Bar": {
    icon: "bar",
    bg: "#efe0d8",
    accent: "#5b2d1f",
    soft: "#a96d47",
  },
  "Sabun Mandi": {
    icon: "soap",
    bg: "#e9f5f3",
    accent: "#35877f",
    soft: "#98d6cf",
  },
  "Sampo 170ml": {
    icon: "pump",
    bg: "#eef0fb",
    accent: "#596bb2",
    soft: "#a8b4ea",
  },
  "Tisu Wajah": {
    icon: "tissue",
    bg: "#f2f7fb",
    accent: "#5d7f9a",
    soft: "#c8ddea",
  },
  "Deterjen 800g": {
    icon: "jug",
    bg: "#eaf5ff",
    accent: "#2e74b8",
    soft: "#8dc2f0",
  },
  "Kemeja Oxford": {
    icon: "shirt",
    bg: "#edf2f7",
    accent: "#345a78",
    soft: "#9ab2c7",
  },
  "Kaos Basic": {
    icon: "shirt",
    bg: "#f1f5f1",
    accent: "#4d6956",
    soft: "#a7bea9",
  },
  "Kabel USB-C": {
    icon: "cable",
    bg: "#eef2f6",
    accent: "#3f4d5a",
    soft: "#a6b3bf",
  },
  "Charger 20W": {
    icon: "charger",
    bg: "#f1f3f7",
    accent: "#374151",
    soft: "#b8c0cc",
  },
};

const iconSvg = ({ icon, accent, soft }: ProductImageTheme) => {
  if (icon === "bottle")
    return `<rect x="276" y="96" width="88" height="288" rx="28" fill="${soft}"/><rect x="294" y="62" width="52" height="48" rx="10" fill="${accent}"/><path d="M292 170h56v146h-56z" fill="#ffffff" opacity=".62"/><path d="M294 198c16 16 36 16 52 0v42c-16 16-36 16-52 0z" fill="${accent}" opacity=".28"/>`;
  if (icon === "croissant")
    return `<path d="M162 274c34-94 110-144 210-130 66 10 104 54 112 122-54-44-106-40-154 12-54 58-116 58-168-4z" fill="${soft}"/><path d="M204 264c34-54 78-82 132-84M300 292c38-48 80-70 126-64" stroke="${accent}" stroke-width="20" stroke-linecap="round" fill="none"/>`;
  if (icon === "bread")
    return `<path d="M206 178c0-56 52-92 114-92s114 36 114 92v164H206z" fill="${soft}"/><rect x="206" y="212" width="228" height="130" rx="24" fill="${accent}" opacity=".78"/><circle cx="278" cy="254" r="12" fill="#fff" opacity=".3"/><circle cx="354" cy="288" r="10" fill="#fff" opacity=".3"/>`;
  if (icon === "plate")
    return `<ellipse cx="320" cy="290" rx="170" ry="58" fill="#ffffff" opacity=".8"/><ellipse cx="320" cy="274" rx="118" ry="48" fill="${soft}"/><circle cx="282" cy="260" r="18" fill="${accent}"/><path d="M250 284c56-34 104-34 144 0" stroke="${accent}" stroke-width="18" stroke-linecap="round" fill="none"/>`;
  if (icon === "bowl")
    return `<path d="M190 242h260c-12 82-58 130-130 130s-118-48-130-130z" fill="${soft}"/><path d="M220 228c52-36 148-36 200 0" stroke="${accent}" stroke-width="18" stroke-linecap="round" fill="none"/><path d="M250 196c42 28 98 28 140 0" stroke="${accent}" stroke-width="16" stroke-linecap="round" fill="none"/>`;
  if (icon === "bag")
    return `<path d="M230 118h180l34 266H196z" fill="${soft}"/><path d="M244 166h152v164H244z" fill="${accent}" opacity=".82"/><circle cx="320" cy="248" r="42" fill="#fff" opacity=".3"/>`;
  if (icon === "cookie")
    return `<circle cx="320" cy="240" r="116" fill="${soft}"/><circle cx="278" cy="206" r="14" fill="${accent}"/><circle cx="350" cy="190" r="12" fill="${accent}"/><circle cx="374" cy="262" r="15" fill="${accent}"/><circle cx="292" cy="292" r="11" fill="${accent}"/>`;
  if (icon === "nuts")
    return `<ellipse cx="274" cy="242" rx="48" ry="78" fill="${soft}" transform="rotate(22 274 242)"/><ellipse cx="350" cy="252" rx="50" ry="82" fill="${accent}" opacity=".78" transform="rotate(-24 350 252)"/><path d="M274 190c-18 38-16 78 6 120M350 196c18 38 16 82-4 124" stroke="#fff" stroke-width="10" opacity=".35" fill="none"/>`;
  if (icon === "bar")
    return `<rect x="210" y="138" width="220" height="208" rx="20" fill="${accent}"/><path d="M238 174h60v60h-60zM318 174h60v60h-60zM238 254h60v60h-60zM318 254h60v60h-60z" fill="${soft}"/>`;
  if (icon === "soap")
    return `<rect x="208" y="178" width="224" height="120" rx="58" fill="${soft}"/><path d="M258 238h124" stroke="${accent}" stroke-width="18" stroke-linecap="round"/><circle cx="398" cy="164" r="18" fill="${accent}" opacity=".4"/><circle cx="438" cy="204" r="12" fill="${accent}" opacity=".35"/>`;
  if (icon === "pump")
    return `<rect x="258" y="132" width="124" height="224" rx="26" fill="${soft}"/><path d="M288 112h94v26h-94zM320 78v34M320 78h78" stroke="${accent}" stroke-width="18" stroke-linecap="round" fill="none"/><rect x="284" y="204" width="72" height="80" rx="16" fill="#fff" opacity=".45"/>`;
  if (icon === "tissue")
    return `<rect x="204" y="206" width="232" height="126" rx="20" fill="${soft}"/><path d="M270 206c8-64 90-64 100 0z" fill="#fff"/><rect x="246" y="246" width="148" height="22" rx="11" fill="${accent}" opacity=".38"/>`;
  if (icon === "jug")
    return `<path d="M248 138h118l36 64v146c0 20-16 36-36 36H248c-20 0-36-16-36-36V174c0-20 16-36 36-36z" fill="${soft}"/><path d="M366 214h42c32 0 32 82 0 82h-42" stroke="${accent}" stroke-width="20" fill="none"/><rect x="250" y="226" width="96" height="82" rx="14" fill="#fff" opacity=".42"/>`;
  if (icon === "shirt")
    return `<path d="M240 140l44-30h72l44 30 56 58-54 48-30-28v138H268V218l-30 28-54-48z" fill="${soft}"/><path d="M284 110c14 28 58 28 72 0" stroke="${accent}" stroke-width="18" stroke-linecap="round" fill="none"/>`;
  if (icon === "cable")
    return `<path d="M214 282c90-128 138 82 222-46" stroke="${accent}" stroke-width="28" stroke-linecap="round" fill="none"/><rect x="190" y="266" width="58" height="46" rx="10" fill="${soft}"/><rect x="410" y="198" width="58" height="46" rx="10" fill="${soft}"/>`;
  if (icon === "charger")
    return `<rect x="246" y="150" width="148" height="168" rx="24" fill="${soft}"/><path d="M292 150V98M348 150V98" stroke="${accent}" stroke-width="18" stroke-linecap="round"/><path d="M304 202h48l-34 50h42l-62 78 18-58h-38z" fill="${accent}"/>`;

  return `<rect x="224" y="132" width="192" height="210" rx="34" fill="${soft}"/><path d="M268 132c8-38 96-38 104 0M274 226h92" stroke="${accent}" stroke-width="18" stroke-linecap="round" fill="none"/>`;
};

export const productImageUrl = (name: string) => {
  const photo = productPhotos[name];
  if (photo) {
    return new URL(
      `/products/${photo}.webp`,
      process.env.WEB_APP_URL || "https://my-kasirku.vercel.app",
    ).href;
  }
  const theme = productImageThemes[name] || {
    icon: "bag",
    bg: "#eef4f2",
    accent: "#0f766e",
    soft: "#a7d8ce",
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><rect width="640" height="480" fill="${theme.bg}"/><circle cx="510" cy="96" r="74" fill="${theme.soft}" opacity=".3"/><circle cx="134" cy="382" r="92" fill="${theme.accent}" opacity=".08"/>${iconSvg(theme)}<text x="320" y="428" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="700" fill="#111827">${name}</text></svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};
