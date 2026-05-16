import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EditorView, ViewportSize } from '../email-template-builder.models';

@Component({
  selector: 'app-email-builder-header',
  standalone: true,
  imports: [FormsModule],
  template: `
    <header class="builder-topbar">
      <div class="brand-cluster">
        <div class="brand-mark">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 302.041 294.626" class="logo-svg">
            <defs>
              <linearGradient data-v-fde0c5aa="" gradientTransform="rotate(25)" id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop data-v-fde0c5aa="" offset="0" stop-color="#5F2517" stop-opacity="1"/>
                <stop data-v-fde0c5aa="" offset="1" stop-color="#CAB08D" stop-opacity="1"/>
              </linearGradient>
            </defs>
            <g data-v-fde0c5aa="" id="logo-group" stroke="none" fill="url(#logo-gradient)" transform="matrix(2.71537, 0, 0, 3.20261, 16.46262, -17.726465)">
              <path d="M28.696 37.22a4.55 4.55 0 01-4.55 4.546H13.537a4.554 4.554 0 01-4.55-4.546c0-2.51 2.041-4.55 4.55-4.55h10.609c2.514 0 4.55 2.04 4.55 4.55zM40.332 53.107a4.55 4.55 0 01-4.55 4.546H25.173a4.554 4.554 0 01-4.55-4.546c0-2.51 2.041-4.55 4.55-4.55h10.609a4.552 4.552 0 014.55 4.55zM51.239 68.996a4.55 4.55 0 01-4.55 4.546H36.08a4.554 4.554 0 01-4.55-4.546 4.555 4.555 0 014.55-4.551h10.609a4.552 4.552 0 014.55 4.551z"/>
              <path d="M83.101 12.878H17.026c-.038 0-.068-.021-.106-.021H6.311a4.555 4.555 0 00-4.55 4.55 4.554 4.554 0 004.55 4.546H24.504l23.268 23.574c6.059 6.14 15.973 6.203 22.112.145l19.429-19.173c.209.639.35 1.308.35 2.015v45.683a6.57 6.57 0 01-6.562 6.562H55.624c-.072-.005-.133-.043-.209-.043H44.806a4.555 4.555 0 00-4.55 4.551 4.554 4.554 0 004.55 4.546h2.625v.021h35.67c8.624 0 15.637-7.013 15.637-15.636V28.514c-.001-8.623-7.013-15.636-15.637-15.636zm-19.59 26.335c-2.574 2.543-6.741 2.514-9.28-.06l-16.979-17.2h43.744l-17.485 17.26z"/>
            </g>
          </svg>
        </div>
        <div>
           <input 
            type="text" 
            class="template-name-input" 
            [ngModel]="templateName" 
            (ngModelChange)="templateNameChange.emit($event)"
            placeholder="Untitled Template" />
          <p>Design, preview and export reusable email HTML</p>
        </div>
      </div>

      <div class="topbar-actions">
        <div class="viewport-toggle" aria-label="Preview size">
          <button
            type="button"
            [class.active]="viewport === 'desktop'"
            (click)="viewportChange.emit('desktop')"
            title="Desktop preview">
            <span class="material-symbols-outlined">desktop_windows</span>
          </button>
          <button
            type="button"
            [class.active]="viewport === 'tablet'"
            (click)="viewportChange.emit('tablet')"
            title="Tablet preview">
            <span class="material-symbols-outlined">tablet</span>
          </button>
          <button
            type="button"
            [class.active]="viewport === 'mobile'"
            (click)="viewportChange.emit('mobile')"
            title="Mobile preview">
            <span class="material-symbols-outlined">smartphone</span>
          </button>
        </div>
        <button type="button" class="ghost-button" (click)="openMyTemplates.emit()">
          <span class="material-symbols-outlined">folder_open</span>
          My Templates
        </button>
        <button type="button" class="ghost-button" (click)="previewModeChange.emit(!previewMode)">
          <span class="material-symbols-outlined">{{ previewMode ? 'edit' : 'visibility' }}</span>
          {{ previewMode ? 'Edit' : 'Preview' }}
        </button>
        <button
          type="button"
          class="ghost-button"
          [class.active-button]="editorView === 'source'"
          (click)="editorViewChange.emit(editorView === 'source' ? 'canvas' : 'source')">
          <span class="material-symbols-outlined">code</span>
          {{ editorView === 'source' ? 'Canvas' : 'Source' }}
        </button>
        <button type="button" class="ghost-button danger-text" (click)="clearCanvas.emit()">
          <span class="material-symbols-outlined">delete_sweep</span>
          Clear
        </button>
        <button type="button" class="ghost-button" (click)="copyTemplate.emit()">
          <span class="material-symbols-outlined">content_copy</span>
          Copy HTML
        </button>
        <button type="button" class="ghost-button" (click)="saveTemplate.emit()">
          <span class="material-symbols-outlined">cloud_done</span>
          Save
        </button>
        <button type="button" class="primary-button" (click)="exportTemplate.emit()">
          <span class="material-symbols-outlined">download</span>
          Export
        </button>
      </div>
    </header>
  `,
})
export class EmailBuilderHeaderComponent {
  @Input({ required: true }) viewport!: ViewportSize;
  @Input({ required: true }) previewMode!: boolean;
  @Input({ required: true }) editorView!: EditorView;

  @Input({ required: true }) templateName!: string;

  @Output() viewportChange = new EventEmitter<ViewportSize>();
  @Output() previewModeChange = new EventEmitter<boolean>();
  @Output() editorViewChange = new EventEmitter<EditorView>();
  @Output() copyTemplate = new EventEmitter<void>();
  @Output() saveTemplate = new EventEmitter<void>();
  @Output() clearCanvas = new EventEmitter<void>();
  @Output() exportTemplate = new EventEmitter<void>();
  @Output() templateNameChange = new EventEmitter<string>();
  @Output() openMyTemplates = new EventEmitter<void>();
}
