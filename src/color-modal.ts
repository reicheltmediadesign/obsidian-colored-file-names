import { type App, setTooltip, SuggestModal } from "obsidian";
import type { PaletteColor } from "./settings/model";

interface ColorChoice {
  color: PaletteColor | null;
}

export interface RecursiveOption {
  /** False if no folder is selected; the checkbox is then shown disabled. */
  available: boolean;
  checked: boolean;
}

export class ColorModal extends SuggestModal<ColorChoice> {
  private readonly palette: readonly PaletteColor[];
  private readonly currentColorId: string | null;
  private readonly onChoose: (colorId: string | null, recursive: boolean) => void;
  private readonly recursiveEl: HTMLInputElement;

  constructor(
    app: App,
    palette: readonly PaletteColor[],
    currentColorId: string | null,
    itemLabel: string,
    recursive: RecursiveOption,
    onChoose: (colorId: string | null, recursive: boolean) => void,
  ) {
    super(app);
    this.palette = palette;
    this.currentColorId = currentColorId;
    this.onChoose = onChoose;
    this.setPlaceholder(`Choose a color for ${itemLabel}`);
    this.emptyStateText = "No matching color. Add colors to the palette in the plugin settings.";

    const label = createEl("label", { cls: "cfn-recursive" });
    label.toggleClass("is-disabled", !recursive.available);
    this.recursiveEl = label.createEl("input", { type: "checkbox" });
    this.recursiveEl.checked = recursive.available && recursive.checked;
    this.recursiveEl.disabled = !recursive.available;
    this.recursiveEl.addEventListener("change", () => this.inputEl.focus());
    label.appendText("Recursive");
    setTooltip(
      label,
      recursive.available
        ? "Also color all files and subfolders inside, unless they have their own color."
        : "Only available for folders.",
    );
    this.resultContainerEl.before(label);
  }

  getSuggestions(query: string): ColorChoice[] {
    const search = query.trim().toLowerCase();
    const choices: ColorChoice[] = [{ color: null }, ...this.palette.map((color) => ({ color }))];
    if (search === "") return choices;
    return choices.filter(({ color }) => (color ? color.name : "no color").toLowerCase().includes(search));
  }

  renderSuggestion({ color }: ColorChoice, el: HTMLElement): void {
    el.addClass("cfn-suggestion");
    const swatch = el.createSpan({ cls: "cfn-swatch" });
    if (color) {
      swatch.setCssProps({ "--cfn-color": color.value });
    } else {
      swatch.addClass("cfn-swatch-none");
    }
    el.createSpan({ cls: "cfn-suggestion-name", text: color ? color.name || color.value : "No color" });

    const isCurrent = (color?.id ?? null) === this.currentColorId;
    if (isCurrent) el.createSpan({ cls: "cfn-suggestion-current", text: "Current" });
  }

  onChooseSuggestion({ color }: ColorChoice): void {
    this.onChoose(color?.id ?? null, this.recursiveEl.checked);
  }
}
