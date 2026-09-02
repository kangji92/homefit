import { PrioritySlider } from "../PrioritySlider";
import { PRIORITY_META } from "../schema";

export function PriorityStep() {
  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm">
        덜 중요하면 낮게, 더 중요하면 높게 두세요. 조정하지 않아도 진행돼요.
      </p>
      {PRIORITY_META.map((m) => (
        <PrioritySlider
          key={m.key}
          name={`priorities.${m.key}`}
          label={m.label}
          note={m.note}
        />
      ))}
    </div>
  );
}
