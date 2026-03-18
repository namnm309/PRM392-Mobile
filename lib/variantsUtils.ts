import type { ProductVariant } from '@/constants/productDetailData';

export type ConfigOption = {
  key: string;
  label: string;
  ramGb: number | null;
  storageGb: number | null;
  displayOrder: number;
  inStock: boolean;
};

export type ColorOption = {
  colorName: string;
  colorHex: string | null;
  displayOrder: number;
  inStock: boolean;
};

export type SelectedConfig = { ramGb: number | null; storageGb: number | null };

function normHex(hex?: string | null): string | null {
  if (!hex) return null;
  const h = hex.trim();
  if (!h) return null;
  return h.startsWith('#') ? h : `#${h}`;
}

export function getActiveVariants(variants: ProductVariant[]): ProductVariant[] {
  return (variants ?? [])
    .filter((v) => v?.isActive)
    .slice()
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

function configKey(ramGb: number | null, storageGb: number | null): string {
  return `${ramGb ?? 'na'}-${storageGb ?? 'na'}`;
}

function configLabel(ramGb: number | null, storageGb: number | null): string {
  const parts: string[] = [];
  if (ramGb != null) parts.push(`${ramGb}GB`);
  if (storageGb !=null) parts.push(`${storageGb}GB`);
  return parts.length > 0 ? parts.join(' ') : 'Mặc định';
}

export function getConfigOptions(variants: ProductVariant[]): ConfigOption[] {
  const actives = getActiveVariants(variants);
  const map = new Map<string, ConfigOption>();

  for (const v of actives) {
    const ram = v.ramGb ?? null;
    const storage = v.storageGb ?? null;
    const key = configKey(ram, storage);
    const existing = map.get(key);
    const inStock = (v.stock ?? 0) > 0;
    if (!existing) {
      map.set(key, {
        key,
        label: configLabel(ram, storage),
        ramGb: ram,
        storageGb: storage,
        displayOrder: v.displayOrder ?? 0,
        inStock,
      });
    } else if (inStock) {
      existing.inStock = true;
    }
  }

  return Array.from(map.values()).sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getColorOptions(
  variants: ProductVariant[],
  selectedConfig?: SelectedConfig | null,
): ColorOption[] {
  const actives = getActiveVariants(variants);
  const filtered = selectedConfig
    ? actives.filter(
        (v) =>
          (v.ramGb ?? null) === selectedConfig.ramGb &&
          (v.storageGb ?? null) === selectedConfig.storageGb,
      )
    : actives;

  const map = new Map<string, ColorOption>();
  for (const v of filtered) {
    const name = v.colorName;
    if (!name) continue;
    const existing = map.get(name);
    const inStock = (v.stock ?? 0) > 0;
    if (!existing) {
      map.set(name, {
        colorName: name,
        colorHex: normHex(v.colorHex),
        displayOrder: v.displayOrder ?? 0,
        inStock,
      });
    } else if (inStock) {
      existing.inStock = true;
    }
  }

  return Array.from(map.values()).sort((a, b) => a.displayOrder - b.displayOrder);
}

export function resolveVariantId(
  selectedConfig: SelectedConfig | null | undefined,
  selectedColorName: string | null | undefined,
  variants: ProductVariant[],
): ProductVariant | null {
  if (!selectedConfig || !selectedColorName) return null;
  const actives = getActiveVariants(variants);
  return (
    actives.find(
      (v) =>
        (v.ramGb ?? null) === selectedConfig.ramGb &&
        (v.storageGb ?? null) === selectedConfig.storageGb &&
        v.colorName === selectedColorName,
    ) ?? null
  );
}

export function getDefaultVariant(variants: ProductVariant[]): ProductVariant | null {
  const actives = getActiveVariants(variants);
  return actives.find((v) => (v.stock ?? 0) > 0) ?? actives[0] ?? null;
}

