/** @jsx h */
import { h } from "nano-jsx";
type Prop = {
  toggleExportSelection: (event: MouseEvent) => void;
  selected: boolean;
  dependency: string;
};

function PackageExportAddToImportmapToggle({
  dependency,
  selected,
  toggleExportSelection,
}: Prop) {
  return (
    <button
      data-selected={selected}
      type="button"
      onClick={toggleExportSelection}
      value={dependency}
    >
      {selected ? "−" : "+"}
    </button>
  );
}

export { PackageExportAddToImportmapToggle };
export type { Prop as PackageExportAddToImportmapToggleProp };
