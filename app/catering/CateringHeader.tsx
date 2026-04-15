/**
 * CateringHeader — type tabs as large text, sub-filters, ordering rules.
 * 180px top spacing, 24px horizontal / 8px vertical between sub-filters,
 * 80px before ordering rules.
 */

export interface CateringTypeConfig {
  orderScope: 'variant' | 'order';
  orderMinimum: number;
  variantMinimum: number;
  increment: number;
  unitLabel: 'quantity' | 'people';
}

interface SubFilter {
  value: string;
  label: string;
  count: number;
}

interface TypeTab {
  key: string;
  label: string;
  count: number;
  subFilters: SubFilter[];
  config: CateringTypeConfig | null;
}

export default function CateringHeader({
  types,
  activeType,
  onTypeChange,
  activeSubFilter,
  onSubFilterChange,
  temperatureFilters,
  activeTemperature,
  onTemperatureChange,
  hasMinViolation,
  locale,
}: {
  types: TypeTab[];
  activeType: string;
  onTypeChange: (type: string) => void;
  activeSubFilter: string[];
  onSubFilterChange: (filters: string[]) => void;
  temperatureFilters: SubFilter[];
  activeTemperature: string[];
  onTemperatureChange: (filters: string[]) => void;
  hasMinViolation: boolean;
  locale: string;
}) {
  const isFr = locale === 'fr';
  const active = types.find((t) => t.key === activeType);
  const subs = active?.subFilters ?? [];
  const config = active?.config ?? null;

  return (
    <div style={{ paddingTop: 80 }}>
      {/* Type tabs — each is a column; sub-filters stack vertically under the active one */}
      <div className="flex flex-col md:flex-row md:flex-wrap items-start" style={{ gap: '24px' }}>
        {types.map((t) => {
          const isActive = t.key === activeType;
          const showSubs = isActive && subs.length > 0;
          return (
            <div key={t.key} className="flex flex-col">
              <button
                type="button"
                onClick={() => { onTypeChange(t.key); onSubFilterChange([]); }}
                className="transition-colors leading-none text-left"
                style={{
                  color: isActive ? '#1A3821' : 'rgba(26,56,33,0.4)',
                  fontSize: 48,
                  fontWeight: 400,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = '#D49BCB'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'rgba(26,56,33,0.4)'; }}
              >
                {t.label}
                <sup
                  className="ml-[2px]"
                  style={{ fontSize: 24, verticalAlign: 'super', position: 'relative', top: '-0.2em', opacity: isActive && showSubs ? 0 : 1 }}
                >
                  ({t.count})
                </sup>
              </button>
              {showSubs && (
                <div className="flex items-start" style={{ marginTop: 20, gap: 40 }}>
                  <div className="flex flex-col" style={{ gap: 8 }}>
                    {subs.map((s) => {
                      const isSubActive = activeSubFilter.includes(s.value);
                      const disabled = s.count === 0 && !isSubActive;
                      return (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => {
                            if (disabled) return;
                            onSubFilterChange(isSubActive ? [] : [s.value]);
                          }}
                          className="transition-colors leading-none text-left"
                          style={{
                            color: isSubActive ? '#1A3821' : 'rgba(26,56,33,0.4)',
                            fontSize: 24, fontWeight: 400, background: 'none', border: 'none', padding: 0,
                            cursor: disabled ? 'default' : 'pointer',
                            opacity: disabled ? 0.25 : 1,
                          }}
                          onMouseEnter={(e) => { if (!isSubActive && !disabled) e.currentTarget.style.color = '#D49BCB'; }}
                          onMouseLeave={(e) => { if (!isSubActive && !disabled) e.currentTarget.style.color = 'rgba(26,56,33,0.4)'; }}
                        >
                          {s.label}
                          <sup className="ml-[2px]" style={{ fontSize: 14, verticalAlign: 'super', position: 'relative', top: '-0.1em' }}>
                            ({s.count})
                          </sup>
                        </button>
                      );
                    })}
                  </div>
                  {temperatureFilters?.length > 0 && (
                    <div className="flex flex-col" style={{ gap: 8 }}>
                      {temperatureFilters.map((tf) => {
                        const isTempActive = activeTemperature.includes(tf.value);
                        const disabled = tf.count === 0 && !isTempActive;
                        return (
                          <button
                            key={tf.value}
                            type="button"
                            onClick={() => {
                              if (disabled) return;
                              onTemperatureChange(isTempActive ? [] : [tf.value]);
                            }}
                            className="transition-colors leading-none text-left"
                            style={{
                              color: isTempActive ? '#1A3821' : 'rgba(26,56,33,0.4)',
                              fontSize: 24, fontWeight: 400, background: 'none', border: 'none', padding: 0,
                              cursor: disabled ? 'default' : 'pointer',
                              opacity: disabled ? 0.25 : 1,
                            }}
                            onMouseEnter={(e) => { if (!isTempActive && !disabled) e.currentTarget.style.color = '#D49BCB'; }}
                            onMouseLeave={(e) => { if (!isTempActive && !disabled) e.currentTarget.style.color = 'rgba(26,56,33,0.4)'; }}
                          >
                            {tf.label}
                            <sup className="ml-[2px]" style={{ fontSize: 14, verticalAlign: 'super', position: 'relative', top: '-0.1em' }}>
                              ({tf.count})
                            </sup>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ marginBottom: 80 }} />
    </div>
  );
}

export function formatRules(config: CateringTypeConfig, isFr: boolean): string {
  const parts: string[] = [];

  if (config.orderScope === 'variant' && config.variantMinimum > 0) {
    parts.push(isFr ? `Minimum de ${config.variantMinimum} par item` : `Minimum of ${config.variantMinimum} per item`);
  }
  if (config.increment > 1) {
    parts.push(isFr ? `multiples de ${config.increment}` : `multiples of ${config.increment}`);
  }
  if (config.orderScope === 'order' && config.orderMinimum > 0) {
    parts.push(isFr ? `Minimum de ${config.orderMinimum} items` : `Minimum of ${config.orderMinimum} items`);
  }

  return parts.join(', ');
}
