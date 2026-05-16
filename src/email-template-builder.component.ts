import {
  Component,
  HostListener,
  ViewEncapsulation,
  computed,
  signal,
  inject,
  Input,
  Output,
  EventEmitter,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime } from 'rxjs';
import Swal from 'sweetalert2';
import { EmailBuilderStorageService, EmailBuilderApiConfig } from './email-builder-storage.service';
import { VersionService } from './version.service';
import { EmailBuilderFooterComponent } from './components/email-builder-footer.component';
import { EmailBuilderHeaderComponent } from './components/email-builder-header.component';
import { EmailBuilderInspectorComponent } from './components/email-builder-inspector.component';
import { EmailBuilderSidebarComponent } from './components/email-builder-sidebar.component';
import { EmailBuilderTemplateDrawerComponent } from './components/email-builder-template-drawer.component';
import { EmailTemplateCanvasComponent } from './components/email-template-canvas.component';
import { EMAIL_BLOCK_LIBRARY } from './email-template-builder.library';
import { EMAIL_SAMPLE_TEMPLATES } from './email-template-builder.templates';
import {
  BlockPreset,
  EditorView,
  ResizeSide,
  SampleTemplate,
  TemplateBlock,
  TemplateBlockType,
  TemplateVariable,
  ViewportSize,
} from './email-template-builder.models';

@Component({
  selector: 'ngx-email-builder',
  standalone: true,
  imports: [
    EmailBuilderFooterComponent,
    EmailBuilderHeaderComponent,
    EmailBuilderInspectorComponent,
    EmailBuilderSidebarComponent,
    EmailBuilderTemplateDrawerComponent,
    EmailTemplateCanvasComponent,
  ],
  templateUrl: './email-template-builder.component.html',
  styleUrls: ['./email-template-builder.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class EmailTemplateBuilderComponent implements OnInit {
  @Input() apiConfig?: EmailBuilderApiConfig;
  @Input() autoSave = true;
  @Input() saveInterval = 5000;
  @Input() initialTemplateId?: string;

  @Output() onSaveSuccess = new EventEmitter<any>();
  @Output() onSaveError = new EventEmitter<any>();

  readonly blockLibrary = signal<BlockPreset[]>(EMAIL_BLOCK_LIBRARY);
  readonly sampleTemplates = EMAIL_SAMPLE_TEMPLATES;
  readonly templateDrawerOpen = signal(false);

  readonly viewport = signal<ViewportSize>('desktop');
  readonly previewMode = signal(false);
  readonly editorView = signal<EditorView>('canvas');
  readonly lastSaved = signal('Not saved');
  readonly currentTemplateId = signal<string | null>(null);
  readonly isSaving = signal(false);
  private readonly templateService = inject(EmailBuilderStorageService);
  private readonly versionService = inject(VersionService);
  readonly libVersion = this.versionService.currentVersion;
  private readonly destroyRef = inject(DestroyRef);
  private readonly autoSave$ = new Subject<void>();
  readonly selectedBlockId = signal(2);
  readonly sourceCode = signal('');
  readonly sourceStatus = signal('Generated source is in sync');
  readonly draggedBlockId = signal<number | null>(null);
  readonly dropTargetIndex = signal<number | null>(null);
  readonly leftPanelWidth = signal(300);
  readonly rightPanelWidth = signal(340);
  readonly resizingSide = signal<ResizeSide | null>(null);
  readonly templateName = signal('Untitled Template');
  readonly focusedField = signal<string | null>(null);
  readonly drawerTab = signal<'samples' | 'saved'>('samples');
  readonly autoSaveEnabled = signal(true);
  readonly toastMessage = signal<string | null>(null);
  private isApplying = false;
  readonly variables = signal<TemplateVariable[]>([]);
  readonly blocks = signal<TemplateBlock[]>([
    {
      id: 1,
      type: 'header',
      label: 'Brand Header',
      icon: 'dock_to_left',
      title: 'NowMail',
      text: 'View Online',
      url: 'https://nowmail.app',
      backgroundColor: 'transparent',
      textColor: '#94a3b8',
      titleColor: '#000000',
      padding: 24,
      textAlign: 'center'
    },
    {
      id: 2,
      type: 'hero',
      label: 'Welcome Hero',
      icon: 'image',
      title: 'Welcome to the Future of Email Design',
      text: 'Create stunning, responsive email templates in minutes. Our builder combines power with simplicity to help you reach your audience with style.',
      imageUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&w=1200&q=80',
      backgroundColor: '#1e293b',
      textColor: '#cbd5e1',
      titleColor: '#ffffff',
      padding: 64,
      radius: 12
    },
    {
      id: 3,
      type: 'text',
      label: 'Value Prop',
      icon: 'stars',
      title: 'Built for Performance',
      text: 'Every block is optimized for deliverability and high conversion. Export clean, table-based HTML that looks perfect in every inbox from Gmail to Outlook.',
      backgroundColor: 'transparent',
      textColor: '#4b5563',
      padding: 34,
      radius: 0,
    },
    {
      id: 4,
      type: 'button',
      label: 'Call To Action',
      icon: 'smart_button',
      text: 'Get Started Now',
      url: 'https://nowmail.app/get-started',
      backgroundColor: 'transparent',
      buttonColor: '#1167ff',
      buttonTextColor: '#ffffff',
      padding: 26,
      radius: 8,
    },
    {
      id: 5,
      type: 'social',
      label: 'Social Footer',
      icon: 'share',
      text: '(c) 2026 NowMail. All rights reserved.',
      backgroundColor: 'transparent',
      textColor: '#64748b',
      padding: 28,
      radius: 0,
    },
  ]);

  readonly selectedBlock = computed(() =>
    this.blocks().find((block) => block.id === this.selectedBlockId()),
  );
  readonly workspaceGridColumns = computed(
    () =>
      `${this.leftPanelWidth()}px minmax(360px, 1fr) ${this.rightPanelWidth()}px`,
  );
  readonly variableValues = computed(() =>
    this.variables().reduce<Record<string, string>>((values, variable) => {
      const name = variable.name.trim();
      if (name) {
        values[name] = variable.value;
      }

      return values;
    }, {}),
  );

  constructor() {
    this.syncSourceCode();
  }

  ngOnInit() {
    if (this.apiConfig) {
      this.templateService.setConfig(this.apiConfig);
    }

    this.versionService.checkVersion();

    this.autoSaveEnabled.set(this.autoSave);

    // Setup auto-save listener with dynamic interval
    this.autoSave$
      .pipe(
        debounceTime(this.saveInterval),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        if (this.autoSaveEnabled() && !this.isApplying) {
          this.saveTemplate(true);
        }
      });

    if (this.initialTemplateId) {
      this.templateService.getTemplate(this.initialTemplateId).subscribe({
        next: (tpl) => this.executeLoadSavedTemplate(tpl),
        error: (err) => {
          console.error('Failed to load initial template', err);
          this.onSaveError.emit(err);
        }
      });
    }
  }

  selectBlock(blockId: number): void {
    if (!this.previewMode()) {
      this.selectedBlockId.set(blockId);
    }
  }

  openTemplateDrawer(): void {
    this.templateDrawerOpen.set(true);
  }

  closeTemplateDrawer(): void {
    this.templateDrawerOpen.set(false);
  }

  applyTemplate(template: SampleTemplate): void {
    if (this.blocks().length > 0) {
      Swal.fire({
        title: 'Replace current design?',
        text: 'This will remove all your current blocks.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#1167ff',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, apply it',
        background: '#111c2e',
        color: '#ffffff'
      }).then((result) => {
        if (result.isConfirmed) {
          this.executeApplyTemplate(template);
        }
      });
    } else {
      this.executeApplyTemplate(template);
    }
  }

  private executeApplyTemplate(template: SampleTemplate): void {
    this.isApplying = true;
    const baseId = Math.max(...this.blocks().map((b) => b.id), 0) + 1;
    const remapped = template.blocks.map((block, index) => ({
      ...block,
      id: baseId + index,
    }));
    this.blocks.set(remapped);
    this.templateName.set(template.name);
    this.currentTemplateId.set(null);
    this.selectedBlockId.set(remapped[0]?.id ?? 1);
    this.templateDrawerOpen.set(false);
    this.syncSourceCode();
    setTimeout(() => (this.isApplying = false), 500);
  }

  loadSavedTemplate(template: any): void {
    if (this.blocks().length > 0) {
      Swal.fire({
        title: 'Load this template?',
        text: 'Your current design will be replaced.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#1167ff',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, load it',
        background: '#111c2e',
        color: '#ffffff'
      }).then((result) => {
        if (result.isConfirmed) {
          this.executeLoadSavedTemplate(template);
        }
      });
    } else {
      this.executeLoadSavedTemplate(template);
    }
  }

  private executeLoadSavedTemplate(template: any): void {
    this.isApplying = true;
    if (template.jsonContent) {
      const { blocks, variables } = template.jsonContent;
      this.blocks.set(blocks || []);
      this.variables.set(variables || []);
      this.templateName.set(template.name || 'Untitled Template');
      this.currentTemplateId.set(template.id);
      this.selectedBlockId.set(blocks?.[0]?.id ?? 1);
      this.templateDrawerOpen.set(false);
      this.syncSourceCode();
    }
    setTimeout(() => (this.isApplying = false), 500);
  }

  openMyTemplates(): void {
    this.drawerTab.set('saved');
    this.templateDrawerOpen.set(true);
  }

  openSampleTemplates(): void {
    this.drawerTab.set('samples');
    this.templateDrawerOpen.set(true);
  }

  clearCanvas(): void {
    Swal.fire({
      title: 'Clear Canvas?',
      text: 'This will remove all blocks from your design. You cannot undo this.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, clear it',
      background: '#111c2e',
      color: '#ffffff'
    }).then((result) => {
      if (result.isConfirmed) {
        this.blocks.set([]);
        this.currentTemplateId.set(null);
        this.templateName.set('Untitled Template');
        this.syncSourceCode();
      }
    });
  }

  addBlock(preset: BlockPreset): void {
    this.insertBlock(preset, this.blocks().length);
  }

  patchBlockLibrary(presets: BlockPreset[]): void {
    this.blockLibrary.set(
      presets.filter((preset) => this.isBlockType(preset.type)),
    );
  }

  insertBlock(preset: BlockPreset, index: number): void {
    const nextId = Math.max(...this.blocks().map((block) => block.id), 0) + 1;
    const block = this.createBlock(preset.type, nextId, preset.columnCount);

    this.blocks.update((blocks) => [
      ...blocks.slice(0, index),
      block,
      ...blocks.slice(index),
    ]);
    this.selectedBlockId.set(nextId);
    this.syncSourceCode();
  }

  duplicateBlock(blockId: number, event?: Event): void {
    event?.stopPropagation();

    const block = this.blocks().find((item) => item.id === blockId);
    if (!block) {
      return;
    }

    const nextId = Math.max(...this.blocks().map((item) => item.id), 0) + 1;
    const blockIndex = this.blocks().findIndex((item) => item.id === blockId);
    const copy = {
      ...block,
      id: nextId,
      label: `${block.label} Copy`,
    };

    this.blocks.update((blocks) => [
      ...blocks.slice(0, blockIndex + 1),
      copy,
      ...blocks.slice(blockIndex + 1),
    ]);
    this.selectedBlockId.set(nextId);
    this.syncSourceCode();
  }

  deleteBlock(blockId: number, event?: Event): void {
    event?.stopPropagation();

    if (this.blocks().length === 1) {
      return;
    }

    this.blocks.update((blocks) => blocks.filter((block) => block.id !== blockId));

    if (this.selectedBlockId() === blockId) {
      this.selectedBlockId.set(this.blocks()[0].id);
    }
    this.syncSourceCode();
  }

  moveBlock(blockId: number, direction: -1 | 1, event?: Event): void {
    event?.stopPropagation();

    const blocks = [...this.blocks()];
    const index = blocks.findIndex((block) => block.id === blockId);
    const nextIndex = index + direction;

    if (index < 0 || nextIndex < 0 || nextIndex >= blocks.length) {
      return;
    }

    [blocks[index], blocks[nextIndex]] = [blocks[nextIndex], blocks[index]];
    this.blocks.set(blocks);
    this.syncSourceCode();
  }

  updateSelected(
    key: keyof TemplateBlock,
    value: TemplateBlock[keyof TemplateBlock],
  ): void {
    const selected = this.selectedBlock();
    if (!selected) {
      return;
    }

    if (key === 'columnCount') {
      this.updateColumnCount(selected.id, Number(value));
      return;
    }

    this.blocks.update((blocks) =>
      blocks.map((block) =>
        block.id === selected.id
          ? {
            ...block,
            [key]: value,
          }
          : block,
      ),
    );
    this.syncSourceCode();
  }

  saveTemplate(isAutoSave = false): void {
    if (this.blocks().length === 0) {
      if (!isAutoSave) {
        Swal.fire({
          title: 'Empty Canvas',
          text: 'Please add at least one block before saving.',
          icon: 'info',
          confirmButtonColor: '#1167ff',
          background: '#111c2e',
          color: '#ffffff'
        });
      }
      return;
    }

    const now = new Date();
    const data = {
      id: this.currentTemplateId(),
      name: this.templateName(),
      jsonContent: {
        blocks: this.blocks(),
        variables: this.variables()
      },
      htmlContent: this.sourceCode() || this.buildEmailHtml()
    };

    this.isSaving.set(true);
    this.templateService.saveTemplate(data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.currentTemplateId.set(res.data.id);
          this.lastSaved.set(
            (isAutoSave ? 'Auto-saved at ' : 'Saved at ') +
            now.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
          );

          if (!isAutoSave) {
            Swal.fire({
              title: 'Saved!',
              text: 'Template persisted successfully.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
              background: '#111c2e',
              color: '#ffffff',
            });
          }
          this.onSaveSuccess.emit(res.data);
        }
        this.isSaving.set(false);
      },
      error: (err) => {
        console.error('Save failed', err);
        this.isSaving.set(false);
        this.lastSaved.set('Save failed');
        if (!isAutoSave) {
          Swal.fire({
            title: 'Save Failed',
            text: 'There was an error persisting your template.',
            icon: 'error',
            confirmButtonColor: '#ef4444',
            background: '#111c2e',
            color: '#ffffff',
          });
        }
        this.onSaveError.emit(err);
      },
    });
  }

  exportTemplate(): void {
    const html = this.sourceCode() || this.buildEmailHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = 'email-template.html';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  copyTemplate(): void {
    const html = this.sourceCode() || this.buildEmailHtml();
    navigator.clipboard?.writeText(html).then(() => {
      this.showToast('HTML copied to clipboard!');
    });
    this.lastSaved.set('Copied HTML');
  }

  showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => this.toastMessage.set(null), 3000);
  }

  onLibraryDragStart(preset: BlockPreset, event: DragEvent): void {
    const payload = JSON.stringify(preset);
    event.dataTransfer?.setData('application/x-email-block-preset', payload);
    event.dataTransfer?.setData('application/x-email-block-type', preset.type);
    event.dataTransfer?.setData('text/plain', preset.type);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  onBlockDragStart(blockId: number, event: DragEvent): void {
    event.stopPropagation();
    this.draggedBlockId.set(blockId);
    event.dataTransfer?.setData('application/x-email-block-id', String(blockId));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent, index = this.blocks().length): void {
    if (this.previewMode()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.dropTargetIndex.set(index);
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = this.draggedBlockId() ? 'move' : 'copy';
    }
  }

  onDrop(event: DragEvent, index = this.blocks().length): void {
    if (this.previewMode()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const droppedPreset = this.readDroppedPreset(event);
    const droppedBlockId = Number(
      event.dataTransfer?.getData('application/x-email-block-id'),
    );

    if (droppedPreset) {
      this.insertBlock(droppedPreset, index);
    } else if (Number.isFinite(droppedBlockId)) {
      this.reorderBlock(droppedBlockId, index);
    }

    this.clearDragState();
  }

  clearDragState(): void {
    this.draggedBlockId.set(null);
    this.dropTargetIndex.set(null);
  }

  onSourceCodeChange(html: string): void {
    this.sourceCode.set(html);
    this.applySourceCode(html);
    this.autoSave$.next();
  }

  addVariable(): void {
    const nextId =
      Math.max(...this.variables().map((variable) => variable.id), 0) + 1;

    this.variables.update((variables) => [
      {
        id: nextId,
        name: `variable_${nextId}`,
        value: 'Preview value',
      },
      ...variables,
    ]);
  }

  handleImageUpload(file: File): void {
    const selected = this.selectedBlock();
    if (!selected) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64String = e.target.result;
      this.updateSelected('imageUrl', base64String);
      this.showToast('Image uploaded and applied!');
    };
    reader.onerror = (err) => {
      console.error('File reading failed', err);
      Swal.fire({
        title: 'Read Failed',
        text: 'There was an error reading your image file.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
        background: '#111c2e',
        color: '#ffffff',
      });
    };
    reader.readAsDataURL(file);
  }

  handleSocialIconUpload(event: { file: File; index: number }): void {
    const selected = this.selectedBlock();
    if (!selected || !selected.socialLinks) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64String = e.target.result;
      const links = selected.socialLinks!.map((link, i) => {
        if (i === event.index) {
          return { ...link, icon: base64String, iconType: 'url' as const };
        }
        return link;
      });
      this.updateSelected('socialLinks', links);
      this.showToast('Social icon uploaded!');
    };
    reader.readAsDataURL(event.file);
  }

  updateVariable(id: number, key: 'name' | 'value', value: string): void {
    this.variables.update((variables) =>
      variables.map((variable) =>
        variable.id === id
          ? {
            ...variable,
            [key]: value,
          }
          : variable,
      ),
    );
    this.autoSave$.next();
  }

  deleteVariable(id: number): void {
    if (this.variables().length === 1) {
      return;
    }

    this.variables.update((variables) =>
      variables.filter((variable) => variable.id !== id),
    );
    this.autoSave$.next();
  }

  insertVariableToken(name: string): void {
    const selected = this.selectedBlock();
    const variableName = name.trim();
    if (!selected || !variableName) {
      return;
    }

    let key: keyof TemplateBlock = this.focusedField() as any;

    if (!key || !(key in selected)) {
      key = ['hero', 'header', 'button', 'coupon', 'social', 'quote', 'text', 'paragraph', 'list', 'footer', 'image', 'badge'].includes(selected.type)
        ? 'text'
        : 'title';
    }

    const existing = String(selected[key] ?? '').trim();
    const token = `{{${variableName}}}`;

    this.updateSelected(key, `${existing}${existing ? ' ' : ''}${token}`);
  }

  addColumnContent(
    blockId: number,
    columnIndex: number,
    type: TemplateBlockType,
  ): void {
    const nextId = this.nextBlockId();
    const child = this.createColumnChild(type, nextId);

    this.blocks.update((blocks) =>
      blocks.map((block) => {
        if (block.id !== blockId || block.type !== 'columns') {
          return block;
        }

        const columns = this.normalizeColumns(block);
        columns[columnIndex] = [...(columns[columnIndex] ?? []), child];

        return {
          ...block,
          columns,
        };
      }),
    );
    this.syncSourceCode();
  }

  removeColumnContent(blockId: number, columnIndex: number, childId: number): void {
    this.blocks.update((blocks) =>
      blocks.map((block) => {
        if (block.id !== blockId || block.type !== 'columns') {
          return block;
        }

        const columns = this.normalizeColumns(block);
        columns[columnIndex] = (columns[columnIndex] ?? []).filter(
          (child) => child.id !== childId,
        );

        return {
          ...block,
          columns,
        };
      }),
    );
    this.syncSourceCode();
  }

  updateColumnCount(blockId: number, columnCount: number): void {
    const nextCount = this.clamp(Math.round(columnCount), 1, 12);

    this.blocks.update((blocks) =>
      blocks.map((block) => {
        if (block.id !== blockId || block.type !== 'columns') {
          return block;
        }

        const columns = this.normalizeColumns(block);
        const resizedColumns = Array.from(
          { length: nextCount },
          (_, index) => columns[index] ?? [],
        );

        return {
          ...block,
          label: `${nextCount} Column`,
          columnCount: nextCount,
          columns: resizedColumns,
        };
      }),
    );
    this.syncSourceCode();
  }

  startPanelResize(side: ResizeSide, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.resizingSide.set(side);
  }

  @HostListener('document:mousemove', ['$event'])
  onPanelResize(event: MouseEvent): void {
    const side = this.resizingSide();
    if (!side) {
      return;
    }

    const viewportWidth = window.innerWidth;
    const canvasMinWidth = 360;
    const leftMax = Math.min(480, viewportWidth - this.rightPanelWidth() - canvasMinWidth);
    const rightMax = Math.min(540, viewportWidth - this.leftPanelWidth() - canvasMinWidth);

    if (side === 'left') {
      this.leftPanelWidth.set(this.clamp(event.clientX, 220, leftMax));
      return;
    }

    this.rightPanelWidth.set(
      this.clamp(viewportWidth - event.clientX, 260, rightMax),
    );
  }

  @HostListener('document:mouseup')
  stopPanelResize(): void {
    this.resizingSide.set(null);
  }

  trackByBlockId(_: number, block: TemplateBlock): number {
    return block.id;
  }

  private reorderBlock(blockId: number, targetIndex: number): void {
    const blocks = [...this.blocks()];
    const fromIndex = blocks.findIndex((block) => block.id === blockId);

    if (fromIndex < 0 || fromIndex === targetIndex) {
      return;
    }

    const [movedBlock] = blocks.splice(fromIndex, 1);
    const adjustedIndex = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
    blocks.splice(Math.max(0, adjustedIndex), 0, movedBlock);
    this.blocks.set(blocks);
    this.selectedBlockId.set(blockId);
    this.syncSourceCode();
  }

  private readDroppedPreset(event: DragEvent): BlockPreset | null {
    const rawPreset = event.dataTransfer?.getData('application/x-email-block-preset');
    if (rawPreset) {
      try {
        const preset = JSON.parse(rawPreset) as BlockPreset;
        return this.isBlockType(preset.type) ? preset : null;
      } catch {
        return null;
      }
    }

    const type = event.dataTransfer?.getData(
      'application/x-email-block-type',
    ) as TemplateBlockType;

    return this.isBlockType(type)
      ? (this.blockLibrary().find((block) => block.type === type) ?? {
        type,
        label: type,
        icon: 'widgets',
        description: '',
      })
      : null;
  }

  private syncSourceCode(): void {
    this.sourceCode.set(this.buildEmailHtml());
    this.sourceStatus.set('Generated source is in sync');
    this.autoSave$.next();
  }

  private applySourceCode(html: string): void {
    if (typeof DOMParser === 'undefined') {
      this.sourceStatus.set('Source preview updated');
      return;
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const rows = Array.from(
      doc.querySelectorAll<HTMLTableRowElement>('tr[data-email-block]'),
    );

    if (!rows.length) {
      this.sourceStatus.set('Source preview updated; no editable blocks found');
      return;
    }

    const parsedBlocks = rows
      .map((row, index) => this.parseBlockRow(row, index + 1))
      .filter((block): block is TemplateBlock => Boolean(block));

    if (!parsedBlocks.length) {
      this.sourceStatus.set('Source preview updated; blocks could not be parsed');
      return;
    }

    this.blocks.set(parsedBlocks);
    this.selectedBlockId.set(
      parsedBlocks.some((block) => block.id === this.selectedBlockId())
        ? this.selectedBlockId()
        : parsedBlocks[0].id,
    );
    this.sourceStatus.set('Canvas updated from source');
  }

  private parseBlockRow(row: HTMLTableRowElement, id: number): TemplateBlock | null {
    const type = row.dataset['emailBlock'] as TemplateBlockType;
    if (!this.isBlockType(type)) {
      return null;
    }

    const preset = this.blockLibrary().find((block) => block.type === type);
    const cell = row.querySelector<HTMLTableCellElement>('td');
    const base = this.createBlock(type, id);
    const padding = this.readNumber(row.dataset['padding']) ?? this.readPadding(cell);
    const backgroundColor =
      row.dataset['background'] ?? this.readStyleValue(cell, 'background') ?? base.backgroundColor;
    const textColor =
      row.dataset['textColor'] ?? this.readStyleValue(cell, 'color') ?? base.textColor;
    const textAlign = this.readTextAlign(row.dataset['align']) ?? base.textAlign;

    const block: TemplateBlock = {
      ...base,
      id,
      label: row.dataset['label'] || base.label,
      icon: preset?.icon ?? base.icon,
      backgroundColor,
      textColor,
      textAlign,
      padding: padding ?? base.padding,
    };

    if (type === 'header') {
      const brand = row.querySelector('td td:first-child');
      const link = row.querySelector<HTMLAnchorElement>('a');
      block.title = this.readText(brand) || base.title;
      block.text = this.readText(link) || base.text;
      block.url = link?.getAttribute('href') ?? base.url;
    }

    if (type === 'hero') {
      block.imageUrl =
        row.querySelector<HTMLImageElement>('img')?.getAttribute('src') ??
        base.imageUrl;
      block.title = this.readText(row.querySelector('h1')) || base.title;
      block.text = this.readText(row.querySelector('p')) || base.text;
    }

    if (type === 'text') {
      block.title = this.readText(row.querySelector('h2')) || base.title;
      block.text = this.readText(row.querySelector('p')) || base.text;
    }

    if (type === 'image') {
      block.imageUrl =
        row.querySelector<HTMLImageElement>('img')?.getAttribute('src') ??
        base.imageUrl;
      block.text = this.readText(row.querySelector('p')) || base.text;
    }

    if (type === 'columns') {
      const columnCount = this.readNumber(row.dataset['columnCount']) ?? base.columnCount ?? 3;
      block.columnCount = columnCount;
      block.columns = this.createColumns(columnCount);
    }

    if (type === 'quote') {
      const paragraphs = Array.from(row.querySelectorAll('p'));
      block.text = this.readText(paragraphs[0]) || base.text;
      block.title = this.readText(paragraphs[1]) || base.title;
    }

    if (type === 'button') {
      const button = row.querySelector<HTMLAnchorElement>('a');
      block.text = this.readText(button) || base.text;
      block.url = button?.getAttribute('href') ?? base.url;
      block.buttonColor =
        row.dataset['buttonColor'] ??
        this.readStyleValue(button, 'background') ??
        base.buttonColor;
      block.buttonTextColor =
        row.dataset['buttonTextColor'] ??
        this.readStyleValue(button, 'color') ??
        base.buttonTextColor;
      block.radius =
        this.readNumber(row.dataset['radius']) ??
        this.readPixels(this.readStyleValue(button, 'border-radius')) ??
        base.radius;
    }

    if (type === 'coupon') {
      const paragraphs = Array.from(row.querySelectorAll('p'));
      block.title = this.readText(paragraphs[0]) || base.title;
      block.text = this.readText(paragraphs[1]) || base.text;
      block.secondaryText = this.readText(paragraphs[2]) || base.secondaryText;
      block.radius = this.readNumber(row.dataset['radius']) ?? base.radius;
    }

    if (type === 'divider') {
      const divider = row.querySelector<HTMLDivElement>('div');
      block.textColor =
        row.dataset['textColor'] ??
        this.readBorderColor(divider) ??
        base.textColor;
    }

    if (type === 'spacer') {
      block.padding = padding ?? this.readPixels(this.readStyleValue(cell, 'height')) ?? base.padding;
    }

    if (type === 'social') {
      block.text = this.readText(row.querySelector('p')) || base.text;
    }

    if (type === 'list' || type === 'footer' || type === 'badge') {
      block.title = this.readText(row.querySelector('h2')) || base.title;
      block.text = this.readText(row.querySelector('p, span, li')) || base.text;
    }

    return block;
  }

  private createBlock(
    type: TemplateBlockType,
    id: number,
    columnCount = 3,
  ): TemplateBlock {
    if (type === 'columns') {
      return {
        id,
        type,
        label: `${columnCount} Column`,
        icon: 'view_column',
        backgroundColor: '#ffffff',
        textColor: '#475569',
        textAlign: 'left',
        columnCount,
        columns: this.createColumns(columnCount),
        padding: 30,
        radius: 0,
      };
    }

    const defaults: Record<Exclude<TemplateBlockType, 'columns'>, TemplateBlock> = {
      header: {
        id,
        type,
        label: 'Header',
        icon: 'view_headline',
        title: '{{company_name}}',
        text: 'View online',
        url: 'https://nowmail.app',
        backgroundColor: '#ffffff',
        textColor: '#0f172a',
        textAlign: 'left',
        padding: 22,
        radius: 0,
      },
      hero: {
        id,
        type,
        label: 'Hero Section',
        icon: 'image',
        title: 'A clear headline goes here',
        text: 'Use this space for a campaign promise, announcement or product story.',
        imageUrl:
          'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        textAlign: 'center',
        padding: 32,
        radius: 0,
      },
      text: {
        id,
        type,
        label: 'Text Block',
        icon: 'subject',
        title: 'Section title',
        text: 'Add useful context, supporting details and next steps for your readers.',
        backgroundColor: '#ffffff',
        textColor: '#475569',
        textAlign: 'center',
        padding: 28,
        radius: 0,
      },
      paragraph: {
        id,
        type,
        label: 'Paragraph',
        icon: 'short_text',
        title: '',
        text: 'Write your paragraph text here. You can include links, formatting, and any supporting details your readers need.',
        backgroundColor: '#ffffff',
        textColor: '#475569',
        textAlign: 'left',
        padding: 28,
        radius: 0,
      },
      image: {
        id,
        type,
        label: 'Image',
        icon: 'add_photo_alternate',
        text: 'Product update preview',
        imageUrl:
          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
        backgroundColor: '#ffffff',
        textColor: '#64748b',
        textAlign: 'center',
        padding: 24,
        radius: 0,
      },
      quote: {
        id,
        type,
        label: 'Quote',
        icon: 'format_quote',
        title: 'Customer Success Team',
        text: 'This editor helps us move from idea to production-ready email in minutes.',
        backgroundColor: '#f8fafc',
        textColor: '#334155',
        textAlign: 'center',
        padding: 32,
        radius: 0,
      },
      button: {
        id,
        type,
        label: 'Call To Action',
        icon: 'smart_button',
        text: 'Open Dashboard',
        url: 'https://nowmail.app',
        backgroundColor: '#ffffff',
        buttonColor: '#1167ff',
        buttonTextColor: '#ffffff',
        textAlign: 'center',
        padding: 24,
        radius: 8,
      },
      coupon: {
        id,
        type,
        label: 'Coupon',
        icon: 'sell',
        title: 'Limited offer',
        text: 'SAVE20',
        secondaryText: 'Use this code before Friday',
        backgroundColor: '#eef6ff',
        textColor: '#0f172a',
        textAlign: 'center',
        padding: 28,
        radius: 10,
      },
      list: {
        id,
        type,
        label: 'List',
        icon: 'format_list_bulleted',
        title: 'What you get',
        text: 'Reusable sections\nResponsive email layout\nEditable source code',
        backgroundColor: '#ffffff',
        textColor: '#475569',
        textAlign: 'left',
        padding: 28,
        radius: 0,
      },
      badge: {
        id,
        type,
        label: 'Badge',
        icon: 'verified',
        text: 'New Feature',
        backgroundColor: '#e8f1ff',
        textColor: '#0f4fbf',
        textAlign: 'center',
        padding: 18,
        radius: 999,
      },
      divider: {
        id,
        type,
        label: 'Divider',
        icon: 'horizontal_rule',
        backgroundColor: '#ffffff',
        textColor: '#dbe3ef',
        textAlign: 'center',
        padding: 18,
        radius: 0,
      },
      spacer: {
        id,
        type,
        label: 'Spacer',
        icon: 'height',
        backgroundColor: '#ffffff',
        textColor: '#ffffff',
        textAlign: 'center',
        padding: 32,
        radius: 0,
      },
      footer: {
        id,
        type,
        label: 'Footer',
        icon: 'notes',
        text: 'You are receiving this email from {{company_name}}. Unsubscribe: {{unsubscribe_url}}',
        backgroundColor: '#f4f7fb',
        textColor: '#64748b',
        textAlign: 'center',
        padding: 26,
        radius: 0,
      },
      social: {
        id,
        type,
        label: 'Social Links',
        icon: 'share',
        text: 'Follow us on social media',
        backgroundColor: '#f8fafc',
        textColor: '#64748b',
        textAlign: 'center',
        padding: 28,
        radius: 0,
        socialLinks: [
          { type: 'facebook', url: 'https://facebook.com', iconType: 'material' },
          { type: 'twitter', url: 'https://twitter.com', iconType: 'material' },
          { type: 'linkedin', url: 'https://linkedin.com', iconType: 'material' },
        ],
      },
    };

    return defaults[type];
  }

  private createColumns(columnCount: number): TemplateBlock[][] {
    return Array.from({ length: columnCount }, (_, index) => [
      this.createColumnChild(index === 0 ? 'text' : 'image', -(index + 1)),
    ]);
  }

  private normalizeColumns(block: TemplateBlock): TemplateBlock[][] {
    const columnCount = block.columnCount ?? block.columns?.length ?? 3;

    return Array.from(
      { length: columnCount },
      (_, index) => [...(block.columns?.[index] ?? [])],
    );
  }

  private createColumnChild(type: TemplateBlockType, id: number): TemplateBlock {
    const supportedType = ['text', 'image', 'quote', 'button', 'badge', 'list'].includes(type)
      ? type
      : 'text';
    const block = this.createBlock(supportedType as TemplateBlockType, id);

    return {
      ...block,
      label: block.label.replace(' Block', ''),
      padding: supportedType === 'image' ? 0 : 10,
    };
  }

  private nextBlockId(): number {
    const childIds = this.blocks().reduce<number[]>((acc, block) => {
      const ids = (block.columns ?? []).reduce<number[]>((cAcc, column) => {
        return [...cAcc, ...column.map((child) => child.id)];
      }, []);
      return [...acc, ...ids];
    }, []);

    return Math.max(...this.blocks().map((block) => block.id), ...childIds, 0) + 1;
  }

  private renderColumnChildHtml(child: TemplateBlock): string {
    const color = child.textColor ?? '#475569';
    const align = child.textAlign ?? 'left';

    if (child.type === 'image') {
      return `                      <img src="${this.escapeHtml(child.imageUrl ?? '')}" alt="" width="160" style="display:block;width:100%;height:auto;border-radius:${child.radius ?? 8}px;">`;
    }

    if (child.type === 'quote') {
      return `                      <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:${color};font-style:italic;text-align:${align};">"${this.escapeHtml(child.text ?? '')}"</p>`;
    }

    if (child.type === 'button') {
      return `                      <p style="margin:0 0 10px;text-align:${align};"><a href="${this.escapeHtml(child.url ?? '#')}" style="display:inline-block;background:${child.buttonColor};color:${child.buttonTextColor};text-decoration:none;font-weight:700;font-size:13px;padding:10px 16px;border-radius:${child.radius ?? 8}px;">${this.escapeHtml(child.text ?? '')}</a></p>`;
    }

    if (child.type === 'badge') {
      return `                      <p style="margin:0 0 10px;text-align:${align};"><span style="display:inline-block;background:${child.backgroundColor};color:${color};padding:7px 10px;border-radius:${child.radius ?? 999}px;font-size:12px;font-weight:700;">${this.escapeHtml(child.text ?? '')}</span></p>`;
    }

    if (child.type === 'list') {
      const items = (child.text ?? '')
        .split('\n')
        .filter(Boolean)
        .map((item) => `<li>${this.escapeHtml(item)}</li>`)
        .join('');

      return `                      <ul style="margin:0 0 10px;padding-left:18px;font-size:13px;line-height:1.55;color:${color};text-align:${align};">${items}</ul>`;
    }

    return `                      <h3 style="margin:0 0 8px;font-size:16px;line-height:1.3;color:#111827;text-align:${align};">${this.escapeHtml(child.title ?? '')}</h3>
                      <p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:${color};text-align:${align};">${this.escapeHtml(child.text ?? '')}</p>`;
  }

  private buildEmailHtml(): string {
    const body = this.blocks()
      .map((block) => this.renderBlockHtml(block))
      .join('\n');

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Email Template</title>
  </head>
  <body style="margin:0;padding:0;background:#eef3f8;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef3f8;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
${body}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  private renderBlockHtml(block: TemplateBlock): string {
    const padding = block.padding ?? 24;
    const background = block.backgroundColor ?? '#ffffff';
    const color = block.textColor ?? '#111827';
    const align = block.textAlign ?? 'center';
    const metadata = `data-email-block="${block.type}" data-label="${this.escapeHtml(block.label)}" data-padding="${padding}" data-background="${background}" data-text-color="${color}" data-align="${align}"`;

    if (block.type === 'header') {
      return `            <tr ${metadata}>
              <td style="background:${background};padding:${padding}px 32px;color:${color};text-align:${align};">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="left" style="font-size:20px;font-weight:700;color:${color};">${this.escapeHtml(block.title ?? '')}</td>
                    <td align="right" style="font-size:13px;"><a href="${this.escapeHtml(block.url ?? '#')}" style="color:${color};text-decoration:none;">${this.escapeHtml(block.text ?? '')}</a></td>
                  </tr>
                </table>
              </td>
            </tr>`;
    }

    if (block.type === 'hero') {
      return `            <tr ${metadata}>
              <td align="${align === 'justify' ? 'left' : align}" style="background:${background};padding:0 0 ${padding}px;color:${color};text-align:${align};">
                <img src="${this.escapeHtml(block.imageUrl ?? '')}" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto;">
                <h1 style="margin:${padding}px 36px 14px;font-size:30px;line-height:1.2;color:${color};">${this.escapeHtml(block.title ?? '')}</h1>
                <p style="margin:0;font-size:16px;line-height:1.6;color:${color};">${this.escapeHtml(block.text ?? '')}</p>
              </td>
            </tr>`;
    }

    if (block.type === 'text') {
      return `            <tr ${metadata}>
              <td align="${align === 'justify' ? 'left' : align}" style="background:${background};padding:${padding}px 40px;color:${color};text-align:${align};">
                <h2 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:${color};">${this.escapeHtml(block.title ?? '')}</h2>
                <p style="margin:0;font-size:15px;line-height:1.7;color:${color};">${this.escapeHtml(block.text ?? '')}</p>
              </td>
            </tr>`;
    }

    if (block.type === 'image') {
      return `            <tr ${metadata}>
              <td align="${align === 'justify' ? 'left' : align}" style="background:${background};padding:${padding}px 32px;color:${color};text-align:${align};">
                <img src="${this.escapeHtml(block.imageUrl ?? '')}" alt="" width="536" style="display:block;width:100%;max-width:536px;height:auto;border-radius:${block.radius ?? 0}px;">
                <p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:${color};">${this.escapeHtml(block.text ?? '')}</p>
              </td>
            </tr>`;
    }

    if (block.type === 'columns') {
      const columns = this.normalizeColumns(block);
      const columnWidth = Math.floor(100 / columns.length);
      const cells = columns
        .map(
          (column, index) => `                    <td width="${columnWidth}%" valign="top" style="padding:${index === 0 ? '0 10px 0 0' : index === columns.length - 1 ? '0 0 0 10px' : '0 10px'};color:${color};text-align:${align};">
${column.map((child) => this.renderColumnChildHtml(child)).join('\n')}
                    </td>`,
        )
        .join('\n');

      return `            <tr ${metadata} data-column-count="${columns.length}">
              <td style="background:${background};padding:${padding}px 32px;color:${color};">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
${cells}
                  </tr>
                </table>
              </td>
            </tr>`;
    }

    if (block.type === 'quote') {
      return `            <tr ${metadata}>
              <td align="${align === 'justify' ? 'left' : align}" style="background:${background};padding:${padding}px 40px;color:${color};text-align:${align};">
                <p style="margin:0;font-size:20px;line-height:1.55;color:${color};font-style:italic;">"${this.escapeHtml(block.text ?? '')}"</p>
                <p style="margin:14px 0 0;font-size:13px;font-weight:700;color:${color};">${this.escapeHtml(block.title ?? '')}</p>
              </td>
            </tr>`;
    }

    if (block.type === 'button') {
      const buttonMetadata = `${metadata} data-button-color="${block.buttonColor}" data-button-text-color="${block.buttonTextColor}" data-radius="${block.radius ?? 8}"`;

      return `            <tr ${buttonMetadata}>
              <td align="${align === 'justify' ? 'left' : align}" style="background:${background};padding:${padding}px 40px;text-align:${align};">
                <a href="${this.escapeHtml(block.url ?? '#')}" style="display:inline-block;background:${block.buttonColor};color:${block.buttonTextColor};text-decoration:none;font-weight:700;font-size:15px;padding:15px 34px;border-radius:${block.radius ?? 8}px;">${this.escapeHtml(block.text ?? '')}</a>
              </td>
            </tr>`;
    }

    if (block.type === 'coupon') {
      return `            <tr ${metadata} data-radius="${block.radius ?? 10}">
              <td align="${align === 'justify' ? 'left' : align}" style="background:${background};padding:${padding}px 40px;color:${color};text-align:${align};">
                <div style="border:1px dashed ${color};border-radius:${block.radius ?? 10}px;padding:18px 20px;">
                  <p style="margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:${color};">${this.escapeHtml(block.title ?? '')}</p>
                  <p style="margin:0;font-size:28px;font-weight:800;letter-spacing:.08em;color:${color};">${this.escapeHtml(block.text ?? '')}</p>
                  <p style="margin:8px 0 0;font-size:13px;color:${color};">${this.escapeHtml(block.secondaryText ?? '')}</p>
                </div>
              </td>
            </tr>`;
    }

    if (block.type === 'list') {
      const items = (block.text ?? '')
        .split('\n')
        .filter(Boolean)
        .map((item) => `<li style="margin:0 0 8px;">${this.escapeHtml(item)}</li>`)
        .join('');

      return `            <tr ${metadata}>
              <td style="background:${background};padding:${padding}px 40px;color:${color};text-align:${align};">
                <h2 style="margin:0 0 12px;font-size:22px;color:${color};">${this.escapeHtml(block.title ?? '')}</h2>
                <ul style="margin:0;padding-left:20px;font-size:15px;line-height:1.6;color:${color};">${items}</ul>
              </td>
            </tr>`;
    }

    if (block.type === 'badge') {
      return `            <tr ${metadata}>
              <td align="${align === 'justify' ? 'left' : align}" style="background:#ffffff;padding:${padding}px 40px;text-align:${align};">
                <span style="display:inline-block;background:${background};color:${color};padding:8px 14px;border-radius:${block.radius ?? 999}px;font-size:13px;font-weight:700;">${this.escapeHtml(block.text ?? '')}</span>
              </td>
            </tr>`;
    }

    if (block.type === 'divider') {
      return `            <tr ${metadata}>
              <td style="background:${background};padding:${padding}px 40px;">
                <div style="border-top:1px solid ${color};font-size:1px;line-height:1px;">&nbsp;</div>
              </td>
            </tr>`;
    }

    if (block.type === 'spacer') {
      return `            <tr ${metadata}>
              <td style="background:${background};font-size:1px;line-height:1px;height:${padding}px;">&nbsp;</td>
            </tr>`;
    }

    if (block.type === 'footer') {
      return `            <tr ${metadata}>
              <td align="${align === 'justify' ? 'left' : align}" style="background:${background};padding:${padding}px 32px;color:${color};text-align:${align};">
                <p style="margin:0;font-size:12px;line-height:1.6;color:${color};">${this.escapeHtml(block.text ?? '')}</p>
              </td>
            </tr>`;
    }

    if (block.type === 'paragraph') {
      return `            <tr ${metadata}>
              <td align="${align === 'justify' ? 'left' : align}" style="background:${background};padding:${padding}px 40px;color:${color};text-align:${align};">
                <p style="margin:0;font-size:15px;line-height:1.75;color:${color};">${this.escapeHtml(block.text ?? '')}</p>
              </td>
            </tr>`;
    }

    return `            <tr ${metadata}>
              <td align="${align === 'justify' ? 'left' : align}" style="background:${background};padding:${padding}px 32px;color:${color};text-align:${align};">
                <p style="margin:0 0 14px;font-size:14px;color:${color};">${this.escapeHtml(block.text ?? '')}</p>
                <p style="margin:0;font-size:13px;">
                  <a href="#" style="color:${color};text-decoration:none;margin:0 8px;">Twitter</a>
                  <a href="#" style="color:${color};text-decoration:none;margin:0 8px;">LinkedIn</a>
                  <a href="#" style="color:${color};text-decoration:none;margin:0 8px;">Website</a>
                </p>
              </td>
            </tr>`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private isBlockType(value: string): value is TemplateBlockType {
    return [
      'hero',
      'header',
      'text',
      'image',
      'columns',
      'quote',
      'button',
      'coupon',
      'list',
      'badge',
      'divider',
      'spacer',
      'footer',
      'social',
      'paragraph',
    ].includes(value);
  }

  private readTextAlign(
    value: string | undefined,
  ): TemplateBlock['textAlign'] | undefined {
    return value === 'left' ||
      value === 'center' ||
      value === 'right' ||
      value === 'justify'
      ? value
      : undefined;
  }

  private readText(element: Element | null): string {
    return element?.textContent?.trim() ?? '';
  }

  private readStyleValue(element: HTMLElement | null, property: string): string | undefined {
    return element?.style.getPropertyValue(property).trim() || undefined;
  }

  private readPadding(element: HTMLElement | null): number | undefined {
    return this.readPixels(this.readStyleValue(element, 'padding'));
  }

  private readPixels(value: string | undefined): number | undefined {
    const match = value?.match(/(\d+(?:\.\d+)?)px/);
    return match ? Number(match[1]) : undefined;
  }

  private readNumber(value: string | undefined): number | undefined {
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }

  private readBorderColor(element: HTMLElement | null): string | undefined {
    const border = this.readStyleValue(element, 'border-top');
    return border?.match(/#[0-9a-f]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)/i)?.[0];
  }

  private clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) {
      return min;
    }

    return Math.min(Math.max(value, min), Math.max(min, max));
  }
}
