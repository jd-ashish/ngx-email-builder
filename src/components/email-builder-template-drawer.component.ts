import { Component, EventEmitter, Input, Output, signal, computed, inject, OnInit } from '@angular/core';
import { EmailBuilderStorageService } from '../email-builder-storage.service';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { SampleTemplate } from '../email-template-builder.models';

@Component({
  selector: 'app-email-builder-template-drawer',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <!-- Backdrop -->
    <div class="drawer-backdrop" (click)="close.emit()"></div>

    <!-- Drawer Panel -->
    <aside class="template-drawer">
      <div class="drawer-header">
        <div class="drawer-title">
          <span class="material-symbols-outlined">auto_awesome</span>
          <div>
            <strong>Sample Templates</strong>
            <small>{{ filteredTemplates().length }} of {{ templates.length }} templates</small>
          </div>
        </div>
        <button type="button" class="drawer-close" (click)="close.emit()" title="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="drawer-tabs">
        <button [class.active]="activeTab() === 'samples'" (click)="activeTab.set('samples')">Samples</button>
        <button [class.active]="activeTab() === 'saved'" (click)="activeTab.set('saved')">Saved Templates</button>
      </div>

      <!-- Search -->
      <div class="drawer-search">
        <span class="material-symbols-outlined drawer-search-icon">search</span>
        <input
          type="text"
          class="drawer-search-input"
          placeholder="Search by name, category or description…"
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)"
          autofocus />
        @if (searchQuery()) {
          <button type="button" class="drawer-search-clear" (click)="searchQuery.set('')">
            <span class="material-symbols-outlined">close</span>
          </button>
        }
      </div>

      <div class="drawer-body">
        @if (filteredTemplates().length === 0) {
          <div class="drawer-no-results">
            <span class="material-symbols-outlined">search_off</span>
            <p>No templates match "{{ searchQuery() }}"</p>
            <button type="button" class="clear-search-btn" (click)="searchQuery.set('')">Clear search</button>
          </div>
        } @else {
          <div class="template-grid">
            @if (activeTab() === 'samples') {
              @for (template of filteredTemplates(); track template.id) {
                <div
                  class="template-card"
                  [class.selected]="selectedId === template.id"
                  (click)="selectedId = template.id">
                  <div class="template-card-header" [style.background]="template.accentColor + '18'">
                    <div class="template-icon-wrap" [style.background]="template.accentColor + '22'" [style.color]="template.accentColor">
                      <span class="material-symbols-outlined">{{ template.icon }}</span>
                    </div>
                    <div class="template-meta">
                      <span class="template-category" [style.color]="template.accentColor">{{ template.category }}</span>
                      <strong class="template-name">{{ template.name }}</strong>
                    </div>
                  </div>

                  <div class="template-card-body">
                    <p class="template-desc">{{ template.description }}</p>
                    
                    <div class="template-id-row">
                      <code class="template-id-text">{{ template.id }}</code>
                      <button type="button" class="copy-id-btn" (click)="copyToClipboard(template.id); $event.stopPropagation()" title="Copy ID">
                        <span class="material-symbols-outlined">content_copy</span>
                      </button>
                    </div>
                    <div class="template-block-pills">
                      @for (block of template.blocks.slice(0, 5); track block.id) {
                        <span class="block-pill">
                          <span class="material-symbols-outlined">{{ block.icon }}</span>
                          {{ block.label }}
                        </span>
                      }
                    </div>
                  </div>

                  <div class="template-card-footer">
                    <span class="block-count">
                      <span class="material-symbols-outlined">layers</span>
                      {{ template.blocks.length }} blocks
                    </span>
                    <button
                      type="button"
                      class="use-template-btn"
                      [style.background]="template.accentColor"
                      (click)="applyTemplate(template); $event.stopPropagation()">
                      <span class="material-symbols-outlined">bolt</span>
                      Use Template
                    </button>
                  </div>
                </div>
              }
            } @else {
              @for (template of savedTemplates(); track template.id) {
                <div class="template-card saved-card" (click)="loadSaved(template)">
                  <div class="template-card-header">
                    <div class="template-icon-wrap" style="background: #3b82f622; color: #3b82f6;">
                      <span class="material-symbols-outlined">history</span>
                    </div>
                    <div class="template-meta">
                      <span class="template-category">Saved Template</span>
                      <strong class="template-name">{{ template.name }}</strong>
                    </div>
                  </div>
                  <div class="template-card-body">
                    <p class="template-desc">Last updated: {{ template.updatedAt | date:'medium' }}</p>
                    <label>Termplate ID:</label>
                    <div class="template-id-row" style="margin-top: 3px !important;">
                      <code class="template-id-text">{{ template.id }}</code>
                      <button type="button" class="copy-id-btn" (click)="copyToClipboard(template.id); $event.stopPropagation()" title="Copy ID">
                        <span class="material-symbols-outlined">content_copy</span>
                      </button>
                    </div>
                  </div>
                  <div class="template-card-footer">
                    <button type="button" class="use-template-btn" style="background: #3b82f6" (click)="loadSaved(template)">
                      Load
                    </button>
                    <button type="button" class="delete-btn" (click)="deleteTemplate(template.id); $event.stopPropagation()">
                       <span class="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              }
              @if (savedTemplates().length === 0) {
                 <div class="empty-saved">No saved templates yet.</div>
              }
            }
          </div>
        }
      </div>

      <!-- Toast Notification -->
      @if (toastMessage()) {
        <div class="drawer-toast" [class.show]="toastMessage()">
          <span class="material-symbols-outlined">check_circle</span>
          {{ toastMessage() }}
        </div>
      }
    </aside>
  `,
  styles: [`
    .drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(2px);
      z-index: 200;
      animation: fadeIn 0.2s ease;
    }

    .template-drawer {
      position: fixed;
      top: 0;
      left: 0;
      width: 780px;
      max-width: 92vw;
      height: 100vh;
      background: var(--surface, #1a1e2e);
      border-right: 1px solid var(--border, #2a2f45);
      z-index: 201;
      display: flex;
      flex-direction: column;
      box-shadow: 4px 0 40px rgba(0, 0, 0, 0.5);
      animation: slideInLeft 0.26s cubic-bezier(0.22, 1, 0.36, 1);
    }

    @keyframes slideInLeft {
      from { transform: translateX(-100%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    /* ── Header ── */
    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border, #2a2f45);
      flex-shrink: 0;
    }

    .drawer-title {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .drawer-title .material-symbols-outlined {
      font-size: 26px;
      color: #a78bfa;
    }

    .drawer-title strong {
      display: block;
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary, #f1f5f9);
      letter-spacing: -0.01em;
    }

    .drawer-title small {
      display: block;
      font-size: 12px;
      color: var(--text-muted, #64748b);
      margin-top: 2px;
    }

    .drawer-close {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 1px solid var(--border, #2a2f45);
      background: transparent;
      color: var(--text-muted, #64748b);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
    }

    .drawer-close:hover {
      background: var(--surface-hover, #252b3b);
      color: var(--text-primary, #f1f5f9);
    }

    /* ── Search ── */
    .drawer-search {
      position: relative;
      padding: 14px 24px;
      border-bottom: 1px solid var(--border, #2a2f45);
      flex-shrink: 0;
    }

    .drawer-search-icon {
      position: absolute;
      left: 36px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 17px !important;
      color: #64748b;
      pointer-events: none;
    }

    .drawer-search-input {
      width: 100%;
      padding: 10px 36px 10px 38px;
      border: 1px solid var(--border, #2a2f45);
      border-radius: 10px;
      background: #0c1524;
      color: #eef5ff;
      font-size: 13px;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      box-sizing: border-box;
    }

    .drawer-search-input::placeholder {
      color: #3d4f6a;
    }

    .drawer-search-input:focus {
      border-color: #a78bfa;
      box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.12);
    }

    .drawer-search-clear {
      position: absolute;
      right: 36px;
      top: 50%;
      transform: translateY(-50%);
      width: 22px;
      height: 22px;
      border-radius: 6px;
      border: none;
      background: #252b3b;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
    }

    .drawer-search-clear:hover {
      background: #2e3a50;
      color: #f1f5f9;
    }

    .drawer-search-clear .material-symbols-outlined {
      font-size: 13px !important;
    }

    /* ── No Results ── */
    .drawer-no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 64px 24px;
      color: #64748b;
      text-align: center;
    }

    .drawer-no-results .material-symbols-outlined {
      font-size: 48px;
      color: #2a3a56;
    }

    .drawer-no-results p {
      font-size: 14px;
      margin: 0;
      color: #64748b;
    }

    .clear-search-btn {
      padding: 8px 20px;
      border: 1px solid #2a3a56;
      border-radius: 8px;
      background: transparent;
      color: #a78bfa;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }

    .clear-search-btn:hover {
      background: rgba(167, 139, 250, 0.1);
      border-color: #a78bfa;
    }

    /* ── Body ── */
    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }

    .template-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 18px;
    }

    /* ── Template Card ── */
    .template-card {
      border-radius: 14px;
      border: 1.5px solid var(--border, #2a2f45);
      background: var(--surface-card, #1e2436);
      cursor: pointer;
      transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .template-card:hover {
      border-color: #4c6ef5;
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.3);
    }

    .template-card.selected {
      border-color: #a78bfa;
      box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.18), 0 8px 28px rgba(0, 0, 0, 0.3);
    }

    .template-card-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 18px;
    }

    .template-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .template-icon-wrap .material-symbols-outlined {
      font-size: 22px;
    }

    .template-meta {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .template-category {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .template-name {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary, #f1f5f9);
      line-height: 1.3;
    }

    .template-card-body {
      padding: 0 18px 16px;
      flex: 1;
    }

    .template-desc {
      font-size: 12.5px;
      line-height: 1.6;
      color: var(--text-muted, #64748b);
      margin: 0 0 14px;
    }

    .template-block-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .block-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 6px;
      background: var(--surface-hover, #252b3b);
      color: var(--text-muted, #64748b);
      font-size: 10.5px;
      font-weight: 500;
    }

    .block-pill .material-symbols-outlined {
      font-size: 12px;
    }

    .block-pill-more {
      color: #a78bfa;
      background: rgba(167, 139, 250, 0.12);
    }

    .template-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      border-top: 1px solid var(--border, #2a2f45);
    }

    .block-count {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11.5px;
      color: var(--text-muted, #64748b);
    }

    .block-count .material-symbols-outlined {
      font-size: 14px;
    }

    .use-template-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      color: #fff;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.15s;
    }

    .use-template-btn:hover {
      opacity: 0.88;
      transform: scale(1.03);
    }

    .use-template-btn .material-symbols-outlined {
      font-size: 15px;
    }
    .drawer-tabs {
      display: flex;
      padding: 10px 24px;
      gap: 10px;
      border-bottom: 1px solid var(--border, #2a2f45);
    }
    .drawer-tabs button {
      background: transparent;
      border: none;
      color: #64748b;
      padding: 8px 16px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      border-radius: 8px;
    }
    .drawer-tabs button.active {
      background: #a78bfa22;
      color: #a78bfa;
    }
    .delete-btn {
      background: transparent;
      border: none;
      color: #ef4444;
      cursor: pointer;
    }
    .empty-saved {
      grid-column: span 2;
      text-align: center;
      padding: 40px;
      color: #64748b;
    }

    /* ── Template ID ── */
    .template-id-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
      padding: 6px 10px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .template-id-text {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 11px;
      color: #94a3b8;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }

    .copy-id-btn {
      width: 26px;
      height: 26px;
      display: grid;
      place-items: center;
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.15s;
    }

    .copy-id-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #a78bfa;
    }

    .copy-id-btn .material-symbols-outlined {
      font-size: 14px;
    }

    /* ── Toast ── */
    .drawer-toast {
      position: absolute;
      top: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      background: #10b981;
      color: white;
      padding: 10px 22px;
      border-radius: 30px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13.5px;
      font-weight: 600;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
      z-index: 220;
      opacity: 0;
      transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      pointer-events: none;
      white-space: nowrap;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .drawer-toast.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  `],
})
export class EmailBuilderTemplateDrawerComponent implements OnInit {
  @Input({ required: true }) templates!: SampleTemplate[];
  @Input() initialTab: 'samples' | 'saved' = 'samples';

  @Output() close = new EventEmitter<void>();
  @Output() useTemplate = new EventEmitter<SampleTemplate>();
  @Output() loadSavedTemplate = new EventEmitter<any>();

  private templateService = inject(EmailBuilderStorageService);
  
  selectedId: string | null = null;
  readonly searchQuery = signal('');
  readonly activeTab = signal<'samples' | 'saved'>('samples');
  readonly savedTemplates = signal<any[]>([]);
  readonly toastMessage = signal<string | null>(null);

  ngOnInit() {
    this.activeTab.set(this.initialTab);
    this.fetchSavedTemplates();
  }

  fetchSavedTemplates() {
    this.templateService.listTemplates().subscribe((res: any) => {
      if (res.success) {
        this.savedTemplates.set(res.data);
      }
    });
  }

  deleteTemplate(id: string) {
    this.templateService.deleteTemplate(id).subscribe((_: any) => {
      this.fetchSavedTemplates();
    });
  }

  loadSaved(template: any) {
    this.loadSavedTemplate.emit(template);
    this.close.emit();
  }

  copyToClipboard(id: string) {
    navigator.clipboard.writeText(id).then(() => {
      this.showToast('Template ID copied to clipboard!');
    });
  }

  private showToast(message: string) {
    this.toastMessage.set(message);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 2500);
  }

  readonly filteredTemplates = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.templates;
    return this.templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q),
    );
  });

  applyTemplate(template: SampleTemplate): void {
    this.useTemplate.emit(template);
    this.close.emit();
  }
}
