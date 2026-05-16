import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EditorView,
  TemplateBlock,
  TemplateBlockType,
  ViewportSize,
} from '../email-template-builder.models';
import { CodeEditorComponent } from '../shared/components/code-editor/code-editor.component';

@Component({
  selector: 'app-email-template-canvas',
  standalone: true,
  imports: [FormsModule, CodeEditorComponent],
  template: `
    <main class="canvas-panel">
      <div class="canvas-header">
        <div>
          <strong>Campaign Template</strong>
          <span>
            {{
              editorView === 'canvas'
                ? viewport === 'desktop'
                  ? '600px desktop email'
                  : viewport === 'tablet'
                    ? '480px tablet preview'
                    : '375px mobile preview'
                : sourceStatus
            }}
          </span>
        </div>
        <div class="view-tabs" aria-label="Builder view">
          <button type="button" [class.active]="editorView === 'canvas'" (click)="editorViewChange.emit('canvas')">
            <span class="material-symbols-outlined">dashboard_customize</span>
          </button>
          <button type="button" [class.active]="editorView === 'source'" (click)="editorViewChange.emit('source')">
            <span class="material-symbols-outlined">code_blocks</span>
          </button>
        </div>
      </div>

      <!-- @if (editorView === 'canvas' && selectedBlock()) {
        @if (selectedBlock()?.type === 'columns') {
        <div class="canvas-settings">

            <label class="column-stepper">
              <span>Columns</span>
              <input
                type="number"
                min="1"
                max="12"
                [ngModel]="selectedBlock()?.columnCount"
                (ngModelChange)="columnCountChange.emit({ blockId: selectedBlockId, columnCount: +$event })" />
            </label>
          </div>
        }
      } -->

      @if (editorView === 'canvas') {
        <div
          class="canvas-stage"
          [class.mobile-stage]="viewport === 'mobile'"
          [class.tablet-stage]="viewport === 'tablet'"
          (dragover)="dragOver.emit({ event: $event })"
          (drop)="drop.emit({ event: $event })"
          (dragleave)="dropTargetIndexChange.emit(null)">
          <article
            class="email-preview"
            [class.mobile-preview]="viewport === 'mobile'"
            [class.tablet-preview]="viewport === 'tablet'"
            [class.drop-at-end]="dropTargetIndex === blocks.length">
            @for (block of blocks; track block.id; let index = $index) {
              <section
                class="email-block"
                [class.selected]="selectedBlockId === block.id && !previewMode"
                [class.previewing]="previewMode"
                [class.dragging]="draggedBlockId === block.id"
                [class.drop-before]="dropTargetIndex === index"
                [style.background-color]="block.backgroundColor"
                [style.color]="block.textColor"
                [style.text-align]="block.textAlign"
                [style.padding.px]="block.type === 'hero' ? null : block.padding"
                draggable="true"
                (dragstart)="blockDragStart.emit({ blockId: block.id, event: $event })"
                (dragover)="dragOver.emit({ event: $event, index })"
                (drop)="drop.emit({ event: $event, index })"
                (dragend)="clearDragState.emit()"
                (click)="selectBlock.emit(block.id)">
                @if (!previewMode) {
                  <div class="block-tools">
                    <button type="button" (click)="moveBlock.emit({ blockId: block.id, direction: -1, event: $event })" [disabled]="index === 0" title="Move up">
                      <span class="material-symbols-outlined">keyboard_arrow_up</span>
                    </button>
                    <button type="button" (click)="moveBlock.emit({ blockId: block.id, direction: 1, event: $event })" [disabled]="index === blocks.length - 1" title="Move down">
                      <span class="material-symbols-outlined">keyboard_arrow_down</span>
                    </button>
                    <button type="button" (click)="duplicateBlock.emit({ blockId: block.id, event: $event })" title="Duplicate">
                      <span class="material-symbols-outlined">content_copy</span>
                    </button>
                    <button type="button" class="danger" (click)="deleteBlock.emit({ blockId: block.id, event: $event })" [disabled]="blocks.length === 1" title="Delete">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                }

                @if (block.type === 'header') {
                  <div class="header-block" [style.justify-content]="justifyHeader(block.textAlign)">
                    <strong [style.color]="block.titleColor || block.textColor">{{ resolveText(block.title) }}</strong>
                    <a [href]="block.url || '#'" (click)="$event.preventDefault()" [style.color]="block.textColor">{{ resolveText(block.text) }}</a>
                  </div>
                }

                @if (block.type === 'hero') {
                  <img class="hero-image" [src]="block.imageUrl" alt="" />
                  <div class="hero-copy" [style.padding.px]="block.padding">
                    <h2 [style.color]="block.titleColor || block.textColor">{{ resolveText(block.title) }}</h2>
                    <p [style.color]="block.textColor">{{ resolveText(block.text) }}</p>
                  </div>
                }

                @if (block.type === 'text') {
                  <div class="text-block">
                    <h3 [style.color]="block.titleColor || block.textColor">{{ resolveText(block.title) }}</h3>
                    <p [style.color]="block.textColor">{{ resolveText(block.text) }}</p>
                  </div>
                }

                @if (block.type === 'paragraph') {
                  <div class="paragraph-block">
                    <p>{{ resolveText(block.text) }}</p>
                  </div>
                }

                @if (block.type === 'image') {
                  <img class="single-image" [src]="block.imageUrl" alt="" />
                  <p class="image-caption">{{ resolveText(block.text) }}</p>
                }

                @if (block.type === 'columns') {
                  <div class="columns-block" [style.grid-template-columns]="columnsTemplate(block)">
                    @for (column of normalizedColumns(block); track $index; let columnIndex = $index) {
                      <div class="email-column">
                        <div class="column-actions">
                          <button type="button" (click)="addColumnContent.emit({ blockId: block.id, columnIndex, type: 'text' })" title="Add text">
                            <span class="material-symbols-outlined">subject</span>
                          </button>
                          <button type="button" (click)="addColumnContent.emit({ blockId: block.id, columnIndex, type: 'image' })" title="Add image">
                            <span class="material-symbols-outlined">image</span>
                          </button>
                          <button type="button" (click)="addColumnContent.emit({ blockId: block.id, columnIndex, type: 'quote' })" title="Add quote">
                            <span class="material-symbols-outlined">format_quote</span>
                          </button>
                          <button type="button" (click)="addColumnContent.emit({ blockId: block.id, columnIndex, type: 'button' })" title="Add button">
                            <span class="material-symbols-outlined">smart_button</span>
                          </button>
                          <button type="button" (click)="addColumnContent.emit({ blockId: block.id, columnIndex, type: 'list' })" title="Add list">
                            <span class="material-symbols-outlined">format_list_bulleted</span>
                          </button>
                          <button type="button" (click)="addColumnContent.emit({ blockId: block.id, columnIndex, type: 'badge' })" title="Add badge">
                            <span class="material-symbols-outlined">verified</span>
                          </button>
                        </div>

                        @for (child of column; track child.id) {
                          <div class="column-child">
                            <button
                              type="button"
                              class="column-child-remove"
                              title="Remove item"
                              (click)="removeColumnContent.emit({ blockId: block.id, columnIndex, childId: child.id })">
                              <span class="material-symbols-outlined">close</span>
                            </button>
                            @if (child.type === 'image') {
                              <img class="column-image" [src]="child.imageUrl" alt="" />
                            } @else if (child.type === 'quote') {
                              <blockquote class="column-quote">{{ resolveText(child.text) }}</blockquote>
                            } @else if (child.type === 'button') {
                              <a
                                class="column-button"
                                [href]="child.url || '#'"
                                [style.background-color]="child.buttonColor"
                                [style.color]="child.buttonTextColor"
                                (click)="$event.preventDefault()">
                                {{ resolveText(child.text) }}
                              </a>
                            } @else if (child.type === 'badge') {
                              <span class="column-badge" [style.background-color]="child.backgroundColor" [style.color]="child.textColor">
                                {{ resolveText(child.text) }}
                              </span>
                            } @else if (child.type === 'list') {
                              <ul class="column-list">
                                @for (item of listItems(child.text); track item) {
                                  <li>{{ resolveText(item) }}</li>
                                }
                              </ul>
                            } @else {
                              <h4 [style.color]="block.titleColor || block.textColor">{{ resolveText(child.title) }}</h4>
                              <p [style.color]="block.textColor">{{ resolveText(child.text) }}</p>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                }

                @if (block.type === 'quote') {
                  <blockquote class="quote-block">
                    <p [style.color]="block.textColor">{{ resolveText(block.text) }}</p>
                    <cite [style.color]="block.titleColor || block.textColor">{{ resolveText(block.title) }}</cite>
                  </blockquote>
                }

                @if (block.type === 'button') {
                  <a
                    class="cta-button"
                    [href]="block.url || '#'"
                    [style.background-color]="block.buttonColor"
                    [style.color]="block.buttonTextColor"
                    [style.border-radius.px]="block.radius"
                    (click)="$event.preventDefault()">
                    {{ resolveText(block.text) }}
                  </a>
                }

                @if (block.type === 'coupon') {
                  <div class="coupon-block">
                    <span [style.color]="block.textColor">{{ resolveText(block.title) }}</span>
                    <strong [style.color]="block.titleColor || block.textColor">{{ resolveText(block.text) }}</strong>
                    <small [style.color]="block.textColor">{{ resolveText(block.secondaryText) }}</small>
                  </div>
                }

                @if (block.type === 'list') {
                  <div class="list-block">
                    <h3 [style.color]="block.titleColor || block.textColor">{{ resolveText(block.title) }}</h3>
                    <ul [style.color]="block.textColor">
                      @for (item of listItems(block.text); track item) {
                        <li>{{ resolveText(item) }}</li>
                      }
                    </ul>
                  </div>
                }

                @if (block.type === 'badge') {
                  <span
                    class="badge-block"
                    [style.background-color]="block.backgroundColor"
                    [style.color]="block.textColor"
                    [style.border-radius.px]="block.radius">
                    {{ resolveText(block.text) }}
                  </span>
                }

                @if (block.type === 'divider') {
                  <div class="divider-line" [style.border-color]="block.textColor"></div>
                }

                @if (block.type === 'spacer') {
                  <div class="spacer-block"></div>
                }

                @if (block.type === 'social') {
                  <div class="social-footer">
                    <div class="social-icons">
                      @for (link of block.socialLinks; track $index) {
                        <a [href]="link.url" target="_blank" (click)="$event.preventDefault()">
                          @if ((link.iconType || 'material') === 'material') {
                            <span class="material-symbols-outlined">{{ link.icon || getSocialIcon(link.type) }}</span>
                          } @else if (link.iconType === 'url') {
                            <img [src]="link.icon" [alt]="link.type" class="social-custom-icon" />
                          } @else if (link.iconType === 'svg') {
                            <div class="social-svg-icon" [innerHTML]="link.icon"></div>
                          }
                        </a>
                      } @empty {
                        <div class="social-placeholder">
                          <span class="material-symbols-outlined">share</span>
                          <span class="material-symbols-outlined">public</span>
                          <span class="material-symbols-outlined">mail</span>
                        </div>
                      }
                    </div>
                    <p>{{ resolveText(block.text) }}</p>
                  </div>
                }

                @if (block.type === 'footer') {
                  <p class="footer-block">{{ resolveText(block.text) }}</p>
                }
              </section>
            }
          </article>
        </div>
      } @else {
        <div class="source-workspace">
          <div class="source-editor-panel">
            <div class="source-panel-header">
              <strong>Generated HTML Source</strong>
              <span>{{ sourceStatus }}</span>
            </div>
            <app-code-editor
              class="source-code-monaco"
              language="html"
              [code]="sourceCode"
              (codeChange)="sourceCodeChange.emit($event)" />
          </div>
          <div class="source-preview-panel">
            <div class="source-panel-header">
              <strong>Email Preview</strong>
              <span>Live from source</span>
            </div>
            <iframe
              class="source-preview-frame"
              title="Generated email HTML preview"
              [srcdoc]="sourceCode"></iframe>
          </div>
        </div>
      }
    </main>
  `,
})
export class EmailTemplateCanvasComponent {
  @Input({ required: true }) blocks!: TemplateBlock[];
  @Input({ required: true }) selectedBlockId!: number;
  @Input({ required: true }) viewport!: ViewportSize;
  @Input({ required: true }) previewMode!: boolean;
  @Input({ required: true }) editorView!: EditorView;
  @Input({ required: true }) sourceCode!: string;
  @Input({ required: true }) sourceStatus!: string;
  @Input({ required: true }) variableValues!: Record<string, string>;
  @Input() draggedBlockId: number | null = null;
  @Input() dropTargetIndex: number | null = null;

  @Output() editorViewChange = new EventEmitter<EditorView>();
  @Output() sourceCodeChange = new EventEmitter<string>();
  @Output() selectBlock = new EventEmitter<number>();
  @Output() blockDragStart = new EventEmitter<{ blockId: number; event: DragEvent }>();
  @Output() dragOver = new EventEmitter<{ event: DragEvent; index?: number }>();
  @Output() drop = new EventEmitter<{ event: DragEvent; index?: number }>();
  @Output() clearDragState = new EventEmitter<void>();
  @Output() dropTargetIndexChange = new EventEmitter<number | null>();
  @Output() updateBlock = new EventEmitter<{ key: keyof TemplateBlock; value: TemplateBlock[keyof TemplateBlock] }>();
  @Output() columnCountChange = new EventEmitter<{ blockId: number; columnCount: number }>();
  @Output() addColumnContent = new EventEmitter<{ blockId: number; columnIndex: number; type: TemplateBlockType }>();
  @Output() removeColumnContent = new EventEmitter<{ blockId: number; columnIndex: number; childId: number }>();
  @Output() moveBlock = new EventEmitter<{ blockId: number; direction: -1 | 1; event: Event }>();
  @Output() duplicateBlock = new EventEmitter<{ blockId: number; event: Event }>();
  @Output() deleteBlock = new EventEmitter<{ blockId: number; event: Event }>();

  readonly textAlignments: Array<{
    value: NonNullable<TemplateBlock['textAlign']>;
    label: string;
    icon: string;
  }> = [
    { value: 'left', label: 'Align left', icon: 'format_align_left' },
    { value: 'center', label: 'Align center', icon: 'format_align_center' },
    { value: 'right', label: 'Align right', icon: 'format_align_right' },
    { value: 'justify', label: 'Justify', icon: 'format_align_justify' },
  ];

  resolveText(value: string | undefined): string {
    return (value ?? '').replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, name: string) => {
      return this.variableValues[name] ?? `{{${name}}}`;
    });
  }

  selectedBlock(): TemplateBlock | undefined {
    return this.blocks.find((block) => block.id === this.selectedBlockId);
  }

  normalizedColumns(block: TemplateBlock): TemplateBlock[][] {
    const columnCount = block.columnCount ?? block.columns?.length ?? 1;
    return Array.from({ length: columnCount }, (_, index) => block.columns?.[index] ?? []);
  }

  columnsTemplate(block: TemplateBlock): string {
    return `repeat(${block.columnCount ?? block.columns?.length ?? 1}, minmax(0, 1fr))`;
  }

  listItems(value: string | undefined): string[] {
    return (value ?? '').split('\n').filter(Boolean);
  }

  justifyHeader(align: string | undefined): string {
    if (align === 'center') return 'center';
    if (align === 'right') return 'flex-end';
    return 'space-between';
  }

  getSocialIcon(type: string): string {
    switch (type) {
      case 'facebook': return 'facebook';
      case 'twitter': return 'twitter';
      case 'instagram': return 'photo_camera';
      case 'linkedin': return 'group';
      case 'youtube': return 'play_circle';
      case 'email': return 'mail';
      case 'website': return 'public';
      default: return 'link';
    }
  }
}
