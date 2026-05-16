import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BlockUpdate,
  TemplateBlock,
  TemplateVariable,
  VariableUpdate,
} from '../email-template-builder.models';

@Component({
  selector: 'app-email-builder-inspector',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="inspector-tabs-container">
      <div class="inspector-main-content">
        <section class="panel-section inspector-header">
          <div class="section-title">
            <span>Inspector</span>
          </div>

          @if (block) {
            <div class="selected-card">
              <span class="material-symbols-outlined">{{ block.icon }}</span>
              <div>
                <strong>{{ block.label }}</strong>
                <small>{{ block.type }} block</small>
              </div>
            </div>
          }
        </section>

        @if (block) {
          <div class="inspector-tab-content" (click)="onPanelClick($event)">
            @if (selectedTab === 'basics') {
              <section class="panel-section controls active-tab-panel">
                <label>
                  <span>Layer Name</span>
                  <input
                    type="text"
                    [ngModel]="block.label"
                    (ngModelChange)="update.emit({ key: 'label', value: $event })" />
                </label>

                @if (block.type === 'hero' || block.type === 'image') {
                  <label class="mt-3">
                    <span>Image URL</span>
                    <div class="url-upload-group">
                      <input
                        type="url"
                        [ngModel]="block.imageUrl"
                        (ngModelChange)="update.emit({ key: 'imageUrl', value: $event })" />
                      <button type="button" class="upload-btn" (click)="fileInput.click()" title="Upload Image">
                        <span class="material-symbols-outlined">upload</span>
                      </button>
                      <input
                        #fileInput
                        type="file"
                        accept="image/*"
                        class="hidden-file-input"
                        (change)="onFileSelected($event)" />
                    </div>
                  </label>
                }

                @if (block.type === 'hero' || block.type === 'text' || block.type === 'header' || block.type === 'quote' || block.type === 'coupon' || block.type === 'list') {
                  <div class="input-with-tooltip mt-3">
                    <label>
                      <span>{{ block.type === 'quote' ? 'Attribution' : 'Title' }}</span>
                      <input
                        #titleInput
                        type="text"
                        [ngModel]="block.title"
                        (focus)="onFieldFocus('title', titleInput)"
                        (click)="updateCursor(titleInput)"
                        (keyup)="updateCursor(titleInput)"
                        (keydown.escape)="showVariablePicker.set(false)"
                        (ngModelChange)="update.emit({ key: 'title', value: $event })" />
                    </label>
                    @if (showVariablePicker() && activeFieldName === 'title') {
                      <ng-container *ngTemplateOutlet="variablePicker"></ng-container>
                    }
                  </div>
                }

                @if (block.type !== 'divider' && block.type !== 'spacer' && block.type !== 'columns') {
                  <div class="input-with-tooltip mt-3">
                    <label>
                      <span>{{ block.type === 'button' ? 'Button Text' : block.type === 'paragraph' ? 'Paragraph Text' : 'Body Text' }}</span>
                      <textarea
                        #textInput
                        rows="4"
                        [ngModel]="block.text"
                        (focus)="onFieldFocus('text', textInput)"
                        (blur)="showVariablePicker.set(false)"
                        (click)="updateCursor(textInput)"
                        (keyup)="updateCursor(textInput)"
                        (keydown.escape)="showVariablePicker.set(false)"
                        (ngModelChange)="update.emit({ key: 'text', value: $event })"></textarea>
                    </label>
                    @if (showVariablePicker() && activeFieldName === 'text') {
                      <ng-container *ngTemplateOutlet="variablePicker"></ng-container>
                    }
                  </div>
                }

                @if (block.type === 'coupon') {
                  <label class="mt-3">
                    <span>Coupon Note</span>
                    <textarea
                      rows="3"
                      [ngModel]="block.secondaryText"
                      (focus)="focusField.emit('secondaryText')"
                      (ngModelChange)="update.emit({ key: 'secondaryText', value: $event })"></textarea>
                  </label>
                }

                @if (block.type === 'columns') {
                  <label class="mt-3">
                    <span>Columns: {{ block.columnCount }}</span>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      [ngModel]="block.columnCount"
                      (ngModelChange)="update.emit({ key: 'columnCount', value: +$event })" />
                  </label>
                }

                @if (block.type === 'button' || block.type === 'header') {
                  <label class="mt-3">
                    <span>Destination URL</span>
                    <input
                      type="url"
                      [ngModel]="block.url"
                      (ngModelChange)="update.emit({ key: 'url', value: $event })" />
                  </label>
                }

                <div class="control-group mt-3">
                  <span>Colors</span>
                  <label class="color-row">
                    <span>Background</span>
                    <input
                      type="color"
                      [value]="block.backgroundColor || '#ffffff'"
                      (input)="update.emit({ key: 'backgroundColor', value: $any($event.target).value })" />
                  </label>

                  @if (block.type === 'hero' || block.type === 'text' || block.type === 'header' || block.type === 'quote' || block.type === 'coupon' || block.type === 'list') {
                    <label class="color-row">
                      <span>Title Color</span>
                      <input
                        type="color"
                        [value]="block.titleColor || '#111827'"
                        (input)="update.emit({ key: 'titleColor', value: $any($event.target).value })" />
                    </label>
                  }

                  @if (block.type === 'button') {
                    <label class="color-row">
                      <span>Button Fill</span>
                      <input
                        type="color"
                        [value]="block.buttonColor || '#1167ff'"
                        (input)="update.emit({ key: 'buttonColor', value: $any($event.target).value })" />
                    </label>
                    <label class="color-row">
                      <span>Button Text</span>
                      <input
                        type="color"
                        [value]="block.buttonTextColor || '#ffffff'"
                        (input)="update.emit({ key: 'buttonTextColor', value: $any($event.target).value })" />
                    </label>
                  } @else if (block.type === 'divider') {
                    <label class="color-row">
                      <span>Line Color</span>
                      <input
                        type="color"
                        [value]="block.textColor || '#dbe3ef'"
                        (input)="update.emit({ key: 'textColor', value: $any($event.target).value })" />
                    </label>
                  } @else {
                    <label class="color-row">
                      <span>Text Color</span>
                      <input
                        type="color"
                        [value]="block.textColor || '#111827'"
                        (input)="update.emit({ key: 'textColor', value: $any($event.target).value })" />
                    </label>
                  }
                </div>

                <label class="mt-3">
                  <span>Padding: {{ block.padding }}px</span>
                  <input
                    type="range"
                    min="0"
                    max="72"
                    [ngModel]="block.padding"
                    (ngModelChange)="update.emit({ key: 'padding', value: +$event })" />
                </label>

                <div class="control-group mt-3">
                  <span>Text Alignment</span>
                  <div class="segmented-control">
                    @for (align of textAlignments; track align.value) {
                      <button
                        type="button"
                        [class.active]="block.textAlign === align.value"
                        (click)="update.emit({ key: 'textAlign', value: align.value })">
                        <span class="material-symbols-outlined">{{ align.icon }}</span>
                      </button>
                    }
                  </div>
                </div>

                @if (block.type === 'button' || block.type === 'coupon') {
                  <label class="mt-3">
                    <span>Corner Radius: {{ block.radius }}px</span>
                    <input
                      type="range"
                      min="0"
                      max="32"
                      [ngModel]="block.radius"
                      (ngModelChange)="update.emit({ key: 'radius', value: +$event })" />
                  </label>
                }

                @if (block.type === 'social') {
                  <div class="control-group">
                    <p class="tab-hint">Social links have been moved to the Social tab.</p>
                  </div>
                }
              </section>
            }

            @if (selectedTab === 'social' && block.type === 'social') {
              <section class="panel-section controls active-tab-panel">
                <div class="control-group social-links-manager">
                  <div class="section-title compact-title">
                    <span>Social Links</span>
                    <button type="button" class="mini-action" (click)="addSocialLink()">Add</button>
                  </div>
                  <div class="social-links-list">
                    @for (link of block.socialLinks; track $index; let i = $index) {
                      <div class="social-link-item">
                        <div class="link-row">
                          <select
                            aria-label="Platform"
                            [ngModel]="link.type"
                            (ngModelChange)="updateSocialLink(i, 'type', $event)">
                            <option value="facebook">Facebook</option>
                            <option value="twitter">Twitter</option>
                            <option value="instagram">Instagram</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="youtube">YouTube</option>
                            <option value="website">Website</option>
                            <option value="email">Email</option>
                            <option value="custom">Custom</option>
                          </select>
                          <button type="button" class="danger-mini" (click)="removeSocialLink(i)">
                            <span class="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                        <div class="link-row">
                          <select
                            aria-label="Icon Type"
                            [ngModel]="link.iconType || 'material'"
                            (ngModelChange)="updateSocialLink(i, 'iconType', $event)">
                            <option value="material">Material Icon</option>
                            <option value="url">Image URL</option>
                            <option value="svg">SVG Code</option>
                          </select>
                        </div>

                        @if ((link.iconType || 'material') === 'material') {
                          <input
                            type="text"
                            placeholder="Material icon name (e.g. facebook)"
                            [ngModel]="link.icon"
                            (ngModelChange)="updateSocialLink(i, 'icon', $event)" />
                        } @else if (link.iconType === 'url') {
                          <div class="url-upload-group">
                            <input
                              type="url"
                              placeholder="Image URL"
                              [ngModel]="link.icon"
                              (ngModelChange)="updateSocialLink(i, 'icon', $event)" />
                            <button type="button" class="upload-btn" (click)="socialIconInput.click()" title="Upload Icon">
                              <span class="material-symbols-outlined">upload</span>
                            </button>
                            <input
                              #socialIconInput
                              type="file"
                              accept="image/*"
                              class="hidden-file-input"
                              (change)="onSocialIconSelected($event, i)" />
                          </div>
                        } @else if (link.iconType === 'svg') {
                          <textarea
                            rows="3"
                            placeholder="Paste SVG code here"
                            [ngModel]="link.icon"
                            (ngModelChange)="updateSocialLink(i, 'icon', $event)"></textarea>
                        }

                        <input
                          type="url"
                          placeholder="Destination URL"
                          [ngModel]="link.url"
                          (ngModelChange)="updateSocialLink(i, 'url', $event)" />
                      </div>
                    }
                  </div>
                </div>
              </section>
            }

            @if (selectedTab === 'variable') {
              <section class="panel-section controls variables-panel active-tab-panel">
                <div class="section-title compact-title">
                  <span>Variables</span>
                  <button type="button" class="mini-action" (click)="addVariable.emit()">Add</button>
                </div>

                <div class="variable-list">
                  @for (variable of variables; track variable.id) {
                    <div class="variable-item">
                      <input
                        type="text"
                        aria-label="Variable name"
                        [ngModel]="variable.name"
                        (ngModelChange)="updateVariable.emit({ id: variable.id, key: 'name', value: $event })" />
                      <input
                        type="text"
                        aria-label="Preview value"
                        [ngModel]="variable.value"
                        (ngModelChange)="updateVariable.emit({ id: variable.id, key: 'value', value: $event })" />
                      <button type="button" title="Insert variable" (click)="insertVariable.emit(variable.name)">
                        <span class="material-symbols-outlined">data_object</span>
                      </button>
                      <button type="button" class="danger-mini" title="Delete variable" (click)="deleteVariable.emit(variable.id)">
                        <span class="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  }
                </div>
              </section>
            }
          </div>
        }
      </div>

      @if (block) {
        <aside class="inspector-tab-bar">
          <button
            type="button"
            class="tab-btn"
            [class.active]="selectedTab === 'basics'"
            (click)="selectedTab = 'basics'"
            title="Basics">
            <span class="material-symbols-outlined">settings</span>
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="selectedTab === 'variable'"
            (click)="selectedTab = 'variable'"
            title="Variables">
            <span class="material-symbols-outlined">data_object</span>
          </button>
          @if (block.type === 'social') {
            <button
              type="button"
              class="tab-btn"
              [class.active]="selectedTab === 'social'"
              (click)="selectedTab = 'social'"
              title="Social">
              <span class="material-symbols-outlined">share</span>
            </button>
          }
        </aside>
      }
    </div>

    <ng-template #variablePicker>
      <div class="advanced-variable-panel" (click)="$event.stopPropagation()" (keydown.escape)="showVariablePicker.set(false)">
        <div class="panel-header">
          <span>Content</span>
          <div class="header-actions">
            <button type="button" class="mini-action" (click)="addVariable.emit()">+ New</button>
            <button type="button" class="close-panel" (click)="showVariablePicker.set(false)">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        <div class="variable-search">
          <span class="material-symbols-outlined">search</span>
          <input type="text" placeholder="Search variables..." #searchBox (input)="0" />
        </div>
        <div class="variable-grid">
          @for (variable of variables; track variable.id) {
            @if (!searchBox.value || variable.name.toLowerCase().includes(searchBox.value.toLowerCase())) {
              <div class="variable-row-item cursor-pointer" (click)="onVariableSelect(variable.name, 'name')">
                <div class="chip-info">
                  <strong>{{ variable.name }}</strong>
                  <small>{{ variable.value }}</small>
                </div>
              </div>
            }
          }
        </div>
        <div class="panel-footer">
          <small>Insert variable or value at cursor position</small>
        </div>
      </div>
    </ng-template>
  `,
})
export class EmailBuilderInspectorComponent {
  @Input() block: TemplateBlock | undefined;
  @Input({ required: true }) variables!: TemplateVariable[];

  selectedTab: 'basics' | 'variable' | 'social' = 'basics';
  
  // Advanced Variable Tooltip State
  readonly showVariablePicker = signal(false);
  activeFieldName: string | null = null;
  activeElement: HTMLInputElement | HTMLTextAreaElement | null = null;
  cursorPos = 0;

  @Output() update = new EventEmitter<BlockUpdate>();
  @Output() addVariable = new EventEmitter<void>();
  @Output() updateVariable = new EventEmitter<VariableUpdate>();
  @Output() deleteVariable = new EventEmitter<number>();
  @Output() insertVariable = new EventEmitter<string>();
  @Output() focusField = new EventEmitter<string>();
  @Output() uploadImage = new EventEmitter<File>();
  @Output() uploadSocialIcon = new EventEmitter<{ file: File; index: number }>();

  readonly textAlignments: Array<{
    value: NonNullable<TemplateBlock['textAlign']>;
    icon: string;
  }> = [
    { value: 'left', icon: 'format_align_left' },
    { value: 'center', icon: 'format_align_center' },
    { value: 'right', icon: 'format_align_right' },
    { value: 'justify', icon: 'format_align_justify' },
  ];

  onFieldFocus(fieldName: string, element: HTMLInputElement | HTMLTextAreaElement): void {
    this.activeFieldName = fieldName;
    this.activeElement = element;
    this.cursorPos = element.selectionStart || 0;
    this.showVariablePicker.set(true);
    this.focusField.emit(fieldName);
  }

  updateCursor(element: HTMLInputElement | HTMLTextAreaElement): void {
    this.cursorPos = element.selectionStart || 0;
  }

  onPanelClick(event: MouseEvent): void {
    // If clicking outside the input or the tooltip, hide tooltip
    const target = event.target as HTMLElement;
    if (!target.closest('.input-with-tooltip') && !target.closest('.advanced-variable-panel')) {
      this.showVariablePicker.set(false);
    }
  }

  onVariableSelect(variableData: string, type: 'name' | 'value'): void {
    if (!this.activeElement || !this.block) return;

    const value = (this.block as any)[this.activeFieldName!] || '';
    const token = type === 'name' ? `{{${variableData}}}` : variableData;
    const newValue = value.substring(0, this.cursorPos) + token + value.substring(this.cursorPos);
    
    this.update.emit({ key: this.activeFieldName as keyof TemplateBlock, value: newValue });
    
    // Focus back and move cursor
    setTimeout(() => {
      this.activeElement?.focus();
      const newPos = this.cursorPos + token.length;
      this.activeElement?.setSelectionRange(newPos, newPos);
      this.cursorPos = newPos;
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadImage.emit(input.files[0]);
      // Reset input so the same file can be uploaded again if needed
      input.value = '';
    }
  }

  onSocialIconSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadSocialIcon.emit({ file: input.files[0], index });
      input.value = '';
    }
  }

  addSocialLink(): void {
    if (!this.block) return;
    const links = [...(this.block.socialLinks || [])];
    links.push({ type: 'website', url: 'https://', iconType: 'material', icon: 'public' });
    this.update.emit({ key: 'socialLinks', value: links });
  }

  updateSocialLink(index: number, key: string, value: any): void {
    if (!this.block || !this.block.socialLinks) return;
    const links = this.block.socialLinks.map((link, i) => {
      if (i === index) {
        return { ...link, [key]: value };
      }
      return link;
    });
    this.update.emit({ key: 'socialLinks', value: links });
  }

  removeSocialLink(index: number): void {
    if (!this.block || !this.block.socialLinks) return;
    const links = this.block.socialLinks.filter((_, i) => i !== index);
    this.update.emit({ key: 'socialLinks', value: links });
  }
}
