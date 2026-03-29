// Maps product categories to relevant accessory search queries
// Used to auto-suggest accessories after product recommendations

interface CrossSellEntry {
  keywords: string[]; // matched against category name or product name
  accessories: { query: string; label: string }[];
}

const CROSS_SELL_MAP: CrossSellEntry[] = [
  {
    keywords: ["laptop", "notebook", "computer", "pc"],
    accessories: [
      { query: "laptop bag", label: "Laptop Bags" },
      { query: "wireless mouse", label: "Wireless Mice" },
      { query: "laptop cooling pad", label: "Cooling Pads" },
      { query: "antivirus software", label: "Antivirus" },
    ],
  },
  {
    keywords: ["smartphone", "phone", "mobile"],
    accessories: [
      { query: "phone case", label: "Phone Cases" },
      { query: "screen protector tempered glass", label: "Screen Protectors" },
      { query: "earbuds wireless", label: "Earbuds" },
      { query: "power bank", label: "Power Banks" },
    ],
  },
  {
    keywords: ["printer"],
    accessories: [
      { query: "ink cartridge", label: "Ink Cartridges" },
      { query: "printer paper a4", label: "Printer Paper" },
      { query: "usb printer cable", label: "Printer Cables" },
    ],
  },
  {
    keywords: ["tv", "television", "smart tv"],
    accessories: [
      { query: "tv wall bracket mount", label: "Wall Brackets" },
      { query: "hdmi cable", label: "HDMI Cables" },
      { query: "soundbar speaker", label: "Soundbars" },
      { query: "voltage stabilizer", label: "Stabilizers" },
    ],
  },
  {
    keywords: ["camera", "dslr", "mirrorless"],
    accessories: [
      { query: "camera bag", label: "Camera Bags" },
      { query: "memory card sd", label: "Memory Cards" },
      { query: "camera tripod", label: "Tripods" },
      { query: "camera lens", label: "Lenses" },
    ],
  },
  {
    keywords: ["tablet", "ipad"],
    accessories: [
      { query: "tablet case cover", label: "Tablet Cases" },
      { query: "stylus pen tablet", label: "Stylus Pens" },
      { query: "bluetooth keyboard tablet", label: "Keyboard Cases" },
    ],
  },
  {
    keywords: ["headphone", "headset", "earphone"],
    accessories: [
      { query: "headphone stand", label: "Headphone Stands" },
      { query: "audio cable adapter", label: "Audio Adapters" },
    ],
  },
  {
    keywords: ["speaker", "bluetooth speaker"],
    accessories: [
      { query: "aux cable audio", label: "Aux Cables" },
      { query: "bluetooth adapter", label: "Bluetooth Adapters" },
    ],
  },
  {
    keywords: ["desktop", "workstation"],
    accessories: [
      { query: "wireless keyboard mouse combo", label: "Keyboard & Mouse" },
      { query: "monitor screen", label: "Monitors" },
      { query: "webcam hd", label: "Webcams" },
      { query: "ups uninterruptible power", label: "UPS Backup" },
    ],
  },
];

export interface AccessorySuggestion {
  query: string;
  label: string;
}

/**
 * Returns accessory queries based on a product name or category name.
 * Returns up to 3 suggestions.
 */
export function getAccessorySuggestions(
  productName: string,
  categoryName?: string
): AccessorySuggestion[] {
  const haystack = `${productName} ${categoryName ?? ""}`.toLowerCase();

  for (const entry of CROSS_SELL_MAP) {
    if (entry.keywords.some((kw) => haystack.includes(kw))) {
      return entry.accessories.slice(0, 3);
    }
  }
  return [];
}

/**
 * Returns the best single accessory category for a given category slug or name.
 */
export function getCrossSellLabel(categoryName: string): string | null {
  const lower = categoryName.toLowerCase();
  for (const entry of CROSS_SELL_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.accessories[0]?.label ?? null;
    }
  }
  return null;
}
