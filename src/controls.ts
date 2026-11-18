export interface ParamSpec<K extends string> {
  key: K;
  label: string;
  min: number;
  max: number;
  step: number;
  /** Slider moves in log10 of the value. */
  log?: boolean;
}

/** Add a slider and a number box for each parameter; returns a function that sets all values. */
export function addControls<K extends string>(
  container: HTMLElement,
  specs: ParamSpec<K>[],
  params: Record<K, number>,
  onChange: (key: K) => void,
): (values: Record<K, number>) => void {
  const setters = new Map<K, (v: number) => void>();
  for (const spec of specs) {
    const id = `param-${spec.key}`;
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = spec.label;

    const toSlider = (v: number) => (spec.log ? Math.log10(v) : v);
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(toSlider(spec.min));
    slider.max = String(toSlider(spec.max));
    slider.step = spec.log ? 'any' : String(spec.step);

    const box = document.createElement('input');
    box.type = 'number';
    box.id = id;
    box.min = String(spec.min);
    box.max = String(spec.max);
    box.step = String(spec.step);

    const decimals = (String(spec.step).split('.')[1] ?? '').length;
    const set = (v: number) => {
      if (!Number.isFinite(v)) v = params[spec.key];
      v = Math.min(spec.max, Math.max(spec.min, v));
      v = Number((Math.round(v / spec.step) * spec.step).toFixed(decimals));
      slider.value = String(toSlider(v));
      box.value = String(v);
      if (v !== params[spec.key]) {
        params[spec.key] = v;
        onChange(spec.key);
      }
    };
    slider.addEventListener('input', () => set(spec.log ? 10 ** Number(slider.value) : Number(slider.value)));
    box.addEventListener('change', () => set(box.valueAsNumber));
    slider.value = String(toSlider(params[spec.key]));
    box.value = String(params[spec.key]);
    setters.set(spec.key, set);

    container.append(label, slider, box);
  }
  return (values) => {
    for (const [key, set] of setters) set(values[key]);
  };
}
