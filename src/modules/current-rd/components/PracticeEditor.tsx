import React from 'react';

export interface PracticeSeg {
  id: string; // activity id or 'non-rd'
  name: string;
  value: number; // 0..100
}

interface Props {
  segments: PracticeSeg[]; // activities + a trailing non-rd
  minNonRd?: number; // default 10
  onChange: (next: PracticeSeg[]) => void;
  onCommit?: (changedId: string, newValue: number) => Promise<void> | void;
}

const PracticeEditor: React.FC<Props> = ({ segments, minNonRd = 10, onChange, onCommit }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [local, setLocal] = React.useState<PracticeSeg[]>(segments);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  React.useEffect(() => setLocal(segments), [segments]);

  const totalActivities = React.useMemo(() => local.filter(s => s.id !== 'non-rd').reduce((s, x) => s + x.value, 0), [local]);
  const nonRdIdx = React.useMemo(() => local.findIndex(s => s.id === 'non-rd'), [local]);

  const startDrag = (id: string) => (e: React.MouseEvent) => {
    if (id === 'non-rd') return; // non-rd not directly draggable
    e.preventDefault();
    setActiveId(id);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!activeId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    const percent = (relX / rect.width) * 100;

    // Compute left offset of active segment
    const idx = local.findIndex(s => s.id === activeId);
    if (idx === -1) return;
    let start = 0;
    for (let i = 0; i < idx; i++) start += local[i].value;
    let newVal = Math.max(0, Math.min(100, percent - start));

    // Adjust others (including non-rd) to keep total 100 and non-rd >= minNonRd
    const next = local.map(s => ({ ...s }));
    const oldVal = next[idx].value;
    const delta = newVal - oldVal;
    if (Math.abs(delta) < 0.1) return;

    // Available to take from: all except idx; but non-rd cannot drop below minNonRd
    const currentNonRd = next[nonRdIdx]?.value || 0;
    const maxReductionFromNonRd = Math.max(0, currentNonRd - minNonRd);

    // First apply delta against non-rd up to maxReductionFromNonRd
    let remainingDelta = delta;
    if (remainingDelta > 0 && nonRdIdx >= 0) {
      const take = Math.min(maxReductionFromNonRd, remainingDelta);
      next[nonRdIdx].value = currentNonRd - take;
      remainingDelta -= take;
    }

    // Distribute remaining delta proportionally across other activities (excluding idx)
    const othersIdx = next.map((_, i) => i).filter(i => i !== idx && i !== nonRdIdx);
    const othersTotal = othersIdx.reduce((s, i) => s + next[i].value, 0);
    if (othersTotal > 0 && Math.abs(remainingDelta) > 0.001) {
      for (const i of othersIdx) {
        const share = (next[i].value / othersTotal) * remainingDelta;
        next[i].value = Math.max(0, next[i].value - share);
      }
    }

    // Set active
    next[idx].value = newVal;

    // Normalize rounding so total = 100
    const totalNow = next.reduce((s, x) => s + x.value, 0);
    const diff = totalNow - 100;
    if (Math.abs(diff) > 0.001) {
      // push correction into non-rd respecting min
      if (nonRdIdx >= 0) {
        next[nonRdIdx].value = Math.max(minNonRd, next[nonRdIdx].value - diff);
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

  const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#0EA5E9'];

  return (
    <div className="space-y-2 select-none" onMouseMove={onMouseMove} onMouseUp={endDrag} onMouseLeave={endDrag}>
      <div ref={containerRef} className="relative h-8 bg-gray-100 rounded overflow-hidden border">
        {local.map((seg, idx) => {
          const left = local.slice(0, idx).reduce((s, x) => s + x.value, 0);
          const bg = seg.id === 'non-rd' ? '#9CA3AF' : colors[idx % colors.length];
          return (
            <div
              key={seg.id}
              className={"absolute top-0 h-full flex items-center justify-center " + (seg.id === 'non-rd' ? 'cursor-not-allowed' : 'cursor-ew-resize')}
              style={{ left: `${left}%`, width: `${seg.value}%`, backgroundColor: bg }}
              onMouseDown={startDrag(seg.id)}
              title={seg.id === 'non-rd' ? 'Non‑R&D (min 10%)' : `${seg.name} (${seg.value.toFixed(1)}%)`}
            >
              {seg.value > 6 && <span className="text-[11px] text-white font-semibold px-1 truncate">{seg.id === 'non-rd' ? 'Non‑R&D' : seg.name} {seg.value.toFixed(1)}%</span>}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {local.map((seg, idx) => (
          <div key={`lg-${seg.id}`} className="flex items-center gap-2" title={seg.id === 'non-rd' ? 'Time that the business uses for administrative purposes.' : undefined}>
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.id === 'non-rd' ? '#9CA3AF' : colors[idx % colors.length] }} />
            <span className="text-gray-700">{seg.id === 'non-rd' ? 'Non‑R&D' : seg.name} – {seg.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PracticeEditor;


