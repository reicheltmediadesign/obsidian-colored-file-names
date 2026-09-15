import { type App, Modal, Setting } from "obsidian";

export class ImportModal extends Modal {
  private readonly onSubmit: (json: string) => Promise<boolean>;

  constructor(app: App, onSubmit: (json: string) => Promise<boolean>) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    this.setTitle("Import colors");
    const { contentEl } = this;

    contentEl.createEl("p", {
      text: "Paste an export of this plugin or the data.json file from the obsidian-file-color plugin folder. Palette colors and colors for the same path are overwritten, everything else is kept.",
    });

    const input = contentEl.createEl("textarea", {
      cls: "cfn-import-input",
      attr: { placeholder: "{ \"palette\": [...], \"assignments\": [...] }", spellcheck: "false" },
    });

    new Setting(contentEl).addButton((button) =>
      button
        .setButtonText("Import")
        .setCta()
        .onClick(async () => {
          if (await this.onSubmit(input.value)) this.close();
        }),
    );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
