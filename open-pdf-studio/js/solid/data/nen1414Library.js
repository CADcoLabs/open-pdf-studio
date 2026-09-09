// MAPI building-safety symbol library — content sourced from the NEN 1414 standard, relabeled/translated for internal MAPI use
// PNG assets bundled in /assets/nen1414/ (converted TIF→PNG)
// Categories by prefix: Tb=Brandbeveiliging, Td=Deuren, Tn=Noodverlichting, Tr=Rook/warmteafvoer, Tv=Ventilatie, Tw=Water/sprinkler

// Import all PNG assets via Vite glob
const pngModules = typeof import.meta.glob === 'function'
  ? import.meta.glob('/assets/nen1414/*.png', { eager: true, query: '?url', import: 'default' })
  : {};

function getAssetUrl(id) {
  const key = `/assets/nen1414/${id}.png`;
  return pngModules[key] || '';
}

// Helper: wrap a raster image URL in an SVG <image> tag for stamp tool compatibility
// Uses absolute URL so it works when the SVG is loaded from a blob: context
function rasterSvg(id) {
  const url = getAssetUrl(id);
  if (!url) return '';
  // Vite inlines PNGs <4KB as data: URIs; larger ones become /assets/*.png paths.
  // blob: context can't resolve relative paths, so only prepend origin for root-relative URLs.
  const absoluteUrl = url.startsWith('/') ? window.location.origin + url : url;
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><image href="${absoluteUrl}" width="64" height="64"/></svg>`;
}

// Human-readable MAPI names for building-safety symbols
const NAMES = {
  'Tb0.003': 'Fire Protection System', 'Tb01': 'Fire Alarm Control Panel (FACP)', 'Tb02': 'FACP Component', 'Tb04': 'Fire Department Entrance', 'Tb05': 'Fire Department Panel',
  'Tb1.001': 'Automatic Detector', 'Tb1.002': 'Heat Detector', 'Tb1.003': 'Smoke Detector', 'Tb1.004': 'Flame Detector', 'Tb1.004a': 'Flame Detector (Alternative)', 'Tb1.005': 'Beam Detector', 'Tb1.006': 'Aspirating Smoke Detection System', 'Tb1.007': 'Gas Detector', 'Tb1.008': 'Multi-Sensor Detector', 'Tb1.009': 'Manual Call Point',
  'Tb2.001': 'Visual Signal (Strobe Light)', 'Tb2.002': 'Audible Signal (Siren)', 'Tb2.003': 'Visual/Audible Signal', 'Tb2.004': 'Voice Alarm System', 'Tb2.005': 'Voice Message', 'Tb2.021': 'Door/Window Contact', 'Tb2.022': 'Door Holder Magnet', 'Tb2.023': 'Door Closer', 'Tb2.041': 'Fire Damper', 'Tb2.042': 'Overpressure Valve', 'Tb2.043': 'Smoke Damper',
  'Tb4.001': 'Fire Hose Reel', 'Tb4.002': 'Dry Riser', 'Tb4.003': 'Wet Riser', 'Tb4.021': 'Sprinkler System', 'Tb4.022': 'Sprinkler (Pendant)', 'Tb4.023': 'Sprinkler (Upright)', 'Tb4.024': 'Sprinkler (Sidewall)', 'Tb4.025': 'Sprinkler (Flush/Concealed)', 'Tb5.001': 'Extinguishing System',
  'Tbk5.001': 'CO2 Extinguishing System', 'Tbk5.002': 'Foam Extinguishing System', 'Tbk5.003': 'Water Extinguishing System', 'Tbk5.004': 'Powder Extinguishing System', 'Tbk7.001': 'Fire Protection Network', 'Tbk7.002': 'Fire Fighting Network', 'Tbk7.003': 'Ring Main', 'Tbk7.004': 'Distribution Network',
  'Td01': 'Single Door', 'Td02': 'Double Door', 'Td03': 'Sliding Door', 'Td04': 'Swing Gate', 'Td05': 'Roller Door (Top)', 'Td06': 'Roller Door (Bottom)', 'Td07': 'Tilt Door', 'Td08': 'Folding Door', 'Td09': 'Pass-Through Hatch', 'Td10': 'Emergency Door',
  'Tn01': 'Emergency Light Fixture', 'Tn02': 'Emergency Lighting (Self-Contained)', 'Tn03': 'Escape Route Sign', 'Tn04': 'Illuminated Transparent Sign', 'Tn05': 'Emergency Lighting (Central)', 'Tn06': 'Anti-Panic Lighting', 'Tn07': 'Task/Workspace Lighting', 'Tn08': 'Safety Lighting', 'Tn09': 'Emergency Power Supply', 'Tn10': 'Battery Unit', 'Tn11': 'Generator', 'Tn12': 'UPS',
  'Tr01': 'Smoke & Heat Exhaust System', 'Tr02': 'Smoke Vent (Roof)', 'Tr03': 'Smoke Vent (Facade)', 'Tr04': 'Smoke Damper (Duct)', 'Tr05': 'Smoke/Heat Exhaust', 'Tr06': 'Outside Air Supply', 'Tr07': 'Overpressure System', 'Tr08': 'Smoke & Heat Exhaust Control Panel', 'Tr09': 'Smoke Detector (Exhaust System)', 'Tr10': 'Heat Detector (Exhaust System)', 'Tr11': 'Manual Call Point (Exhaust System)', 'Tr12': 'Wind Sensor', 'Tr501': 'Smoke/Heat Exhaust (Mechanical)', 'Tr502': 'Fan (Exhaust System)', 'Tr503': 'Supply Fan', 'Tr504': 'Exhaust Fan',
  'Tv017': 'Ventilation System',
  'Tw01': 'Sprinkler System (Water)', 'Tw02': 'Sprinkler Head (Pendant)', 'Tw03': 'Sprinkler Head (Upright)', 'Tw04': 'Sprinkler Head (Sidewall)', 'Tw05': 'Sprinkler Head (Flush/Concealed)', 'Tw07': 'Alarm Valve', 'Tw08': 'Check Valve', 'Tw09': 'Shut-Off Valve', 'Tw10': 'Fire Hydrant (Underground)', 'Tw11': 'Fire Hydrant (Above Ground)', 'Tw12': 'Pump Connection (Siamese Connection)', 'Tw14': 'Sprinkler Control Panel', 'Tw15': 'Water Supply', 'Tw16': 'Water Tank', 'Tw19': 'Booster Pump', 'Tw2.001': 'Water Mist (Open)', 'Tw2.002': 'Water Mist (Closed)', 'Tw20': 'Jockey Pump', 'Tw28': 'Water Motor Gong',
};

// Build categories from prefix
const CATEGORY_META = {
  'Tb': { name: 'MAPI — Fire Protection', color: '#dc2626' },
  'Tbk': { name: 'MAPI — Extinguishing Systems', color: '#b91c1c' },
  'Td': { name: 'MAPI — Doors', color: '#92400e' },
  'Tn': { name: 'MAPI — Emergency Lighting', color: '#ca8a04' },
  'Tr': { name: 'MAPI — Smoke & Heat Exhaust', color: '#6b7280' },
  'Tv': { name: 'MAPI — Ventilation', color: '#059669' },
  'Tw': { name: 'MAPI — Water/Sprinkler', color: '#2563eb' },
};

const ALL_IDS = Object.keys(NAMES);

function getPrefix(id) {
  // Tbk before Tb (longer prefix first)
  if (id.startsWith('Tbk')) return 'Tbk';
  if (id.startsWith('Tb')) return 'Tb';
  if (id.startsWith('Td')) return 'Td';
  if (id.startsWith('Tn')) return 'Tn';
  if (id.startsWith('Tr')) return 'Tr';
  if (id.startsWith('Tv')) return 'Tv';
  if (id.startsWith('Tw')) return 'Tw';
  return 'Tb'; // fallback
}

// Build categories
export const NEN1414_CATEGORIES = (() => {
  const catMap = new Map();
  for (const id of ALL_IDS) {
    const prefix = getPrefix(id);
    if (!catMap.has(prefix)) {
      const meta = CATEGORY_META[prefix] || { name: `MAPI — ${prefix}`, color: '#666' };
      catMap.set(prefix, {
        id: `nen1414-${prefix.toLowerCase()}`,
        name: meta.name,
        industry: 'aec',
        country: 'nl',
        color: meta.color,
        icon: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="1"/><text x="8" y="11" font-size="7" font-weight="bold" fill="currentColor" stroke="none" text-anchor="middle" font-family="sans-serif">N</text></svg>`,
        builtin: true,
        symbols: [],
      });
    }
    catMap.get(prefix).symbols.push({
      id: `nen1414-${id}`,
      name: NAMES[id] || id,
      svg: rasterSvg(id),
    });
  }
  return [...catMap.values()];
})();
