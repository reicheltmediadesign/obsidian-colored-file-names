import { type App, SuggestModal } from "obsidian";
import type { PaletteColor } from "./settings/model";

interface ColorChoice {
  color: PaletteColor | null;
}

export class ColorModal extends SuggestModal<ColorChoice> {
  private readonly palette: readonly PaletteColor[];
  private readonly currentColorId: string | null;
  private readonly onChoose: (colorId: string | null) => void;

  constructor(
    app: App,
    palette: readonly PaletteColor[],
    currentColorId: string | null,
    itemLabel: string,
    onChoose: (colorId: string | null) => void,
  ) {
    super(app);
    this.palette = palette;
    this.currentColorId = currentColorId;
    this.onChoose = onChoose;
    this.setPlaceholder(`Choose a color for ${itemLabel}`);
    this.emptyStateText = "No matching color. Add colors to the palette in the plugin settings.";
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
    this.onChoose(color?.id ?? null);
  }
}
