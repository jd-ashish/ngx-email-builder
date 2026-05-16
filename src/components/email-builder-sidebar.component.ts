import { Component, EventEmitter, Input, Output, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BlockPreset, SampleTemplate, TemplateBlock } from '../email-template-builder.models';

@Component({
  selector: 'app-email-builder-sidebar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <!-- Sample Templates Section -->
    <section class="panel-section templates-section">
      <div class="section-title">
        <span>Sample Templates</span>
        <span class="material-symbols-outlined templates-star">auto_awesome</span>
      </div>

      <div class="sample-template-grid">
        @for (tpl of previewTemplates(); track tpl.id) {
          <button
            type="button"
            class="sample-template-card"
            [style.--accent]="tpl.accentColor"
            (click)="applyTemplate.emit(tpl)">
            <span class="sample-icon" [style.color]="tpl.accentColor">
              <span class="material-symbols-outlined">{{ tpl.icon }}</span>
            </span>
            <span class="sample-label">{{ tpl.name }}</span>
            <span class="sample-category" [style.color]="tpl.accentColor">{{ tpl.category }}</span>
          </button>
        }
        <!-- More Templates tile -->
        <button
          type="button"
          class="sample-template-card more-templates-card"
          (click)="openTemplateDrawer.emit()">
          <span class="sample-icon more-icon">
            <span class="material-symbols-outlined">grid_view</span>
          </span>
          <span class="sample-label">More Templates</span>
          <span class="sample-category more-count">+{{ sampleTemplates.length - 3 }} more</span>
        </button>
      </div>
    </section>

    <!-- Block Library Section -->
    <section class="panel-section">
      <div class="section-title">
        <span>Block Library</span>
      </div>

      <!-- Search -->
      <div class="search-wrap">
        <span class="material-symbols-outlined search-icon">search</span>
        <input
          type="text"
          class="search-input"
          placeholder="Search blocks…"
          [ngModel]="blockSearch()"
          (ngModelChange)="blockSearch.set($event); showAllBlocks.set(false)" />
        @if (blockSearch()) {
          <button type="button" class="search-clear" (click)="blockSearch.set('')">
            <span class="material-symbols-outlined">close</span>
          </button>
        }
      </div>

      <div class="block-grid">
        @for (block of visibleBlocks(); track block.label + block.type + block.columnCount) {
          <button
            type="button"
            class="library-block"
            draggable="true"
            (dragstart)="libraryDragStart.emit({ preset: block, event: $event })"
            (dragend)="clearDragState.emit()"
            (click)="addBlock.emit(block)">
            <span class="material-symbols-outlined">{{ block.icon }}</span>
            <strong>{{ block.label }}</strong>
            <small>{{ block.description }}</small>
          </button>
        }
        @if (filteredBlocks().length === 0) {
          <p class="no-results" style="grid-column:1/-1">No blocks match "{{ blockSearch() }}"</p>
        }
      </div>

      <!-- Show More / Show Less -->
      @if (!blockSearch() && filteredBlocks().length > initialBlockCount) {
        <button
          type="button"
          class="show-more-btn"
          (click)="showAllBlocks.set(!showAllBlocks())">
          <span class="material-symbols-outlined">
            {{ showAllBlocks() ? 'expand_less' : 'expand_more' }}
          </span>
          {{ showAllBlocks() ? 'Show less' : 'Show ' + (filteredBlocks().length - initialBlockCount) + ' more blocks' }}
        </button>
      }
    </section>

    <!-- Template Layers Section -->
    <section class="panel-section layers-section">
      <div class="section-title">
        <span>Template Layers</span>
        <small>{{ blocks.length }} blocks</small>
      </div>

      <div
        class="layers-list"
        [class.drop-at-end]="dropTargetIndex === blocks.length"
        (dragover)="dragOver.emit({ event: $event })"
        (drop)="drop.emit({ event: $event })">
        @for (block of blocks; track block.id; let index = $index) {
          <button
            type="button"
            class="layer-item"
            [class.active]="selectedBlockId === block.id"
            [class.dragging]="draggedBlockId === block.id"
            [class.drop-before]="dropTargetIndex === index"
            draggable="true"
            (dragstart)="blockDragStart.emit({ blockId: block.id, event: $event })"
            (dragover)="dragOver.emit({ event: $event, index })"
            (drop)="drop.emit({ event: $event, index })"
            (dragend)="clearDragState.emit()"
            (click)="selectBlock.emit(block.id)">
            <span class="material-symbols-outlined">{{ block.icon }}</span>
            <span>{{ block.label }}</span>
          </button>
        }
      </div>
    </section>
  `,
  styles: [`
    .templates-section {
      border-bottom: 1px solid var(--border, #24324b);
    }

    .templates-star {
      font-size: 15px !important;
      color: #a78bfa !important;
    }

    /* ── Search ── */
    .search-wrap {
      position: relative;
      margin-bottom: 14px;
    }

    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 16px !important;
      color: #64748b;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 8px 32px 8px 34px;
      border: 1px solid #24324b;
      border-radius: 8px;
      background: #0c1524;
      color: #eef5ff;
      font-size: 12.5px;
      outline: none;
      transition: border-color 0.15s;
    }

    .search-input::placeholder {
      color: #4a5c78;
    }

    .search-input:focus {
      border-color: #4c86ff;
    }

    .search-clear {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      padding: 0;
    }

    .search-clear .material-symbols-outlined {
      font-size: 14px !important;
    }

    /* ── Template Grid ── */
    .sample-template-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      padding: 4px 0 8px;
    }

    .sample-template-card {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1.5px solid #24324b;
      background: #17243a;
      cursor: pointer;
      text-align: left;
      transition: border-color 0.15s, background 0.15s, transform 0.15s, box-shadow 0.15s;
      position: relative;
      overflow: hidden;
    }

    .sample-template-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: var(--accent, #4c6ef5);
      opacity: 0;
      transition: opacity 0.15s;
    }

    .sample-template-card:hover {
      border-color: var(--accent, #4c6ef5);
      background: #1e2d46;
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    }

    .sample-template-card:hover::before {
      opacity: 1;
    }

    /* More Templates tile */
    .more-templates-card {
      border-style: dashed;
      border-color: #2d3f5c;
      background: #111d2e;
    }

    .more-templates-card:hover {
      border-color: #a78bfa;
      background: #19243a;
    }

    .more-templates-card:hover::before {
      background: #a78bfa;
      opacity: 1;
    }

    .more-icon {
      background: rgba(167, 139, 250, 0.12);
      color: #a78bfa !important;
    }

    .more-icon .material-symbols-outlined {
      color: #a78bfa !important;
    }

    .more-count {
      color: #a78bfa !important;
      opacity: 1 !important;
    }

    .sample-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(255,255,255,0.06);
      margin-bottom: 2px;
    }

    .sample-icon .material-symbols-outlined {
      font-size: 18px !important;
    }

    .sample-label {
      font-size: 12px;
      font-weight: 700;
      color: #f1f5f9;
      line-height: 1.3;
    }

    .sample-category {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      opacity: 0.85;
    }

    /* ── Show More Button ── */
    .show-more-btn {
      margin-top: 12px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px;
      border: 1px dashed #2a3a56;
      border-radius: 8px;
      background: transparent;
      color: #74a4ff;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }

    .show-more-btn:hover {
      background: #17243a;
      border-color: #4c86ff;
    }

    .show-more-btn .material-symbols-outlined {
      font-size: 18px !important;
    }

    /* ── No results ── */
    .no-results {
      grid-column: 1 / -1;
      margin: 8px 0 0;
      color: #4a5c78;
      font-size: 12px;
      text-align: center;
    }
  `],
})
export class EmailBuilderSidebarComponent {
  readonly initialBlockCount = 8;
  readonly previewCount = 3;

  @Input({ required: true }) blockLibrary!: BlockPreset[];
  @Input({ required: true }) blocks!: TemplateBlock[];
  @Input({ required: true }) selectedBlockId!: number;
  @Input({ required: true }) sampleTemplates!: SampleTemplate[];
  @Input() draggedBlockId: number | null = null;
  @Input() dropTargetIndex: number | null = null;

  @Output() addBlock = new EventEmitter<BlockPreset>();
  @Output() selectBlock = new EventEmitter<number>();
  @Output() openTemplateDrawer = new EventEmitter<void>();
  @Output() applyTemplate = new EventEmitter<SampleTemplate>();
  @Output() libraryDragStart = new EventEmitter<{ preset: BlockPreset; event: DragEvent }>();
  @Output() blockDragStart = new EventEmitter<{ blockId: number; event: DragEvent }>();
  @Output() dragOver = new EventEmitter<{ event: DragEvent; index?: number }>();
  @Output() drop = new EventEmitter<{ event: DragEvent; index?: number }>();
  @Output() clearDragState = new EventEmitter<void>();

  readonly blockSearch = signal('');
  readonly showAllBlocks = signal(false);

  readonly previewTemplates = computed(() =>
    this.sampleTemplates.slice(0, this.previewCount)
  );

  readonly filteredBlocks = computed(() => {
    const q = this.blockSearch().toLowerCase().trim();
    if (!q) return this.blockLibrary;
    return this.blockLibrary.filter(
      (b) => b.label.toLowerCase().includes(q) || b.description.toLowerCase().includes(q),
    );
  });

  readonly visibleBlocks = computed(() => {
    const all = this.filteredBlocks();
    if (this.blockSearch() || this.showAllBlocks()) return all;
    return all.slice(0, this.initialBlockCount);
  });
}
