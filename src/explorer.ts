import { debounce, type Workspace } from "obsidian";
import { COLOR_STYLES, type ColorStyle } from "./settings/model";

export interface ResolvedColor {
  /** Hex color. */
  value: string;
  recursive: boolean;
}

export interface ExplorerAppearance {
  /** Assigned color per vault path. */
  colors: ReadonlyMap<string, ResolvedColor>;
  folderStyle: ColorStyle;
  fileStyle: ColorStyle;
  backgroundOpacity: number;
}

const TITLE_SELECTOR = ".nav-file-title[data-path], .nav-folder-title[data-path]";
const ITEM_CLASSES = ["cfn-colored", "cfn-inherited", "cfn-cascade"];
const CONTAINER_CLASSES = [
  "cfn-explorer",
  ...COLOR_STYLES.flatMap((style) => [`cfn-folder-style-${style}`, `cfn-file-style-${style}`]),
];

/**
 * Applies colors to the file explorer. The explorer renders items lazily while
 * scrolling and expanding folders, so a MutationObserver re-applies colors to new items.
 */
export class ExplorerColorizer {
  private readonly workspace: Workspace;
  private readonly getAppearance: () => ExplorerAppearance;
  private readonly observers = new Map<HTMLElement, MutationObserver>();

  readonly refresh = debounce(() => this.applyAll(), 50, true);

  constructor(workspace: Workspace, getAppearance: () => ExplorerAppearance) {
    this.workspace = workspace;
    this.getAppearance = getAppearance;
  }

  /** Starts observing all open file explorers and applies colors. */
  attach(): void {
    const containers = new Set(this.workspace.getLeavesOfType("file-explorer").map((leaf) => leaf.view.containerEl));

    for (const [container, observer] of this.observers) {
      if (!containers.has(container)) {
        observer.disconnect();
        this.observers.delete(container);
      }
    }

    for (const container of containers) {
      if (this.observers.has(container)) continue;
      const observer = new MutationObserver(() => this.refresh());
      observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-path"] });
      this.observers.set(container, observer);
    }

    this.applyAll();
  }

  applyAll(): void {
    const appearance = this.getAppearance();
    for (const container of this.observers.keys()) {
      container.removeClasses(CONTAINER_CLASSES);
      container.addClasses([
        "cfn-explorer",
        `cfn-folder-style-${appearance.folderStyle}`,
        `cfn-file-style-${appearance.fileStyle}`,
      ]);
      container.setCssProps({ "--cfn-background-opacity": `${appearance.backgroundOpacity}%` });

      container.querySelectorAll<HTMLElement>(TITLE_SELECTOR).forEach((title) => applyToTitle(title, appearance));
    }
  }

  /** Stops observing and removes all colors. */
  detach(): void {
    for (const [container, observer] of this.observers) {
      observer.disconnect();
      container.removeClasses(CONTAINER_CLASSES);
      container.setCssProps({ "--cfn-background-opacity": "" });
      container.querySelectorAll<HTMLElement>(TITLE_SELECTOR).forEach((title) => {
        const item = title.parentElement;
        item?.removeClasses(ITEM_CLASSES);
        item?.setCssProps({ "--cfn-color": "" });
      });
    }
    this.observers.clear();
  }
}

function applyToTitle(title: HTMLElement, appearance: ExplorerAppearance): void {
  const item = title.parentElement;
  const path = title.getAttr("data-path");
  if (!item || path === null) return;

  const own = appearance.colors.get(path);
  const color = own?.value ?? inheritedColor(path, appearance.colors);
  const isFolder = title.hasClass("nav-folder-title");

  item.toggleClass("cfn-colored", color !== undefined);
  item.toggleClass("cfn-inherited", own === undefined && color !== undefined);
  item.toggleClass("cfn-cascade", own?.recursive === true && isFolder);
  item.setCssProps({ "--cfn-color": color ?? "" });
}

/** Color of the closest ancestor folder that is colored recursively. */
function inheritedColor(path: string, colors: ReadonlyMap<string, ResolvedColor>): string | undefined {
  for (let index = path.lastIndexOf("/"); index > 0; index = path.lastIndexOf("/", index - 1)) {
    const ancestor = colors.get(path.slice(0, index));
    if (ancestor?.recursive) return ancestor.value;
  }
  return undefined;
}
