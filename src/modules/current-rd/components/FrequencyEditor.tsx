import React from 'react';

export interface SubFreq {
  id: string;
  name: string;
  value: number; // 0..100
}

interface Props {
  subcomponents: SubFreq[];
  onChange: (next: SubFreq[]) => void;
  onCommit?: (changedId: string, newValue: number) => Promise<void> | void;
}

// A simple horizontal stacked bar with draggable segments.
// Dragging a segment changes its value and proportionally squeezes/expands the remaining ones
// so the total remains 100.
const FrequencyEditor: React.FC<Props> = ({ subcomponents, onChange, onCommit }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [local, setLocal] = React.useState<SubFreq[]>(subcomponents);

  React.useEffect(() => {
    setLocal(subcomponents);
  }, [subcomponents]);

  const total = React.useMemo(() => local.reduce((s, x) => s + (x.value || 0), 0), [local]);

  const startDrag = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveId(id);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!activeId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    const percent = (relX / rect.width) * 100;
    // Determine new value for active segment based on cursor position relative to its start
    let start = 0;
    const idx = local.findIndex(s => s.id === activeId);
    if (idx === -1) return;
    for (let i = 0; i < idx; i++) start += local[i].value;
    const newVal = Math.max(0, Math.min(100, percent - start));

    const delta = newVal - local[idx].value;
    if (Math.abs(delta) < 0.1) return; // ignore tiny moves

    // Adjust others proportionally to keep total 100
    const others = local.filter((_, i) => i !== idx);
    const othersTotal = others.reduce((s, x) => s + x.value, 0);
    if (othersTotal <= 0) return;

    const next = local.map((s, i) => ({ ...s }));
    next[idx].value = newVal;
    const factor = (othersTotal - delta) / othersTotal; // new sum for others
    let remainder = 100 - newVal;
    // Distribute proportionally, ensuring non-negative
    let distributed = 0;
    for (let i = 0; i < next.length; i++) {
      if (i === idx) continue;
      const orig = local[i].value;
      const v = Math.max(0, orig * factor);
      next[i].value = v;
      distributed += v;
    }
    // Normalize tiny rounding differences
    const diff = (newVal + distributed) - 100;
    if (Math.abs(diff) > 0.001) {
      // push correction into the last other segment
      for (let i = next.length - 1; i >= 0; i--) {
        if (i === idx) continue;
        next[i].value = Math.max(0, next[i].value - diff);
        break;
      }
    }
    setLocal(next);
    onChange(next);
  };

  const endDrag = async () => {
    if (activeId) {
      const seg = local.find(s => s.id === activeId);
      if (seg && onCommit) await onCommit(activeId, Number(seg.value.toFixed(2)));
    }
    setActiveId(null);
  };

  const colors = ['#1D4ED8', '#059669', '#7C3AED', '#F59E0B', '#EF4444', '#0EA5E9', '#84CC16'];

  return (
    <div className="space-y-2 select-none" onMouseMove={onMouseMove} onMouseUp={endDrag} onMouseLeave={endDrag}>
      <div ref={containerRef} className="relative h-6 bg-gray-100 rounded overflow-hidden border">
        {local.map((seg, idx) => {
          const left = local.slice(0, idx).reduce((s, x) => s + x.value, 0);
          return (
            <div
              key={seg.id}
              className="absolute top-0 h-full flex items-center justify-center cursor-ew-resize"
              style={{ left: `${left}%`, width: `${seg.value}%`, backgroundColor: colors[idx % colors.length] }}
              onMouseDown={startDrag(seg.id)}
              title={`${seg.name} (${seg.value.toFixed(1)}%)`}
            >
              {seg.value > 10 && <span className="text-[10px] text-white font-semibold px-1 truncate">{seg.name} {seg.value.toFixed(1)}%</span>}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {local.map((seg, idx) => (
          <div key={`lg-${seg.id}`} className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
            <span className="text-gray-700">{seg.name} – {seg.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FrequencyEditor;


