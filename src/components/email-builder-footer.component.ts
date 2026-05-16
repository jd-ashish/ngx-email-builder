import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-email-builder-footer',
  standalone: true,
  template: `
    <footer class="status-bar">
      <div class="status-left">
        <span class="status-indicator" [class.saving]="isSaving"></span>
        <span class="status-text">Status: {{ isSaving ? 'Saving...' : 'Ready' }}</span>
        <span class="save-time">Last saved: {{ lastSaved }}</span>
      </div>
      
      <div class="status-center">
        <a href="https://nowmail.in" target="_blank" class="powered-by">
          Powered by <span>NowMail</span>
        </a>
      </div>
      
      <div class="status-right">
        <div class="save-mode-toggle" (click)="toggleAutoSave()">
           <span class="toggle-label">{{ autoSaveEnabled ? 'Auto Save' : 'Manual Save' }}</span>
           <div class="toggle-track" [class.enabled]="autoSaveEnabled">
             <div class="toggle-thumb"></div>
           </div>
        </div>
        <span class="stats">{{ blockCount }} blocks · {{ variableCount }} variables</span>
        <div class="version-tag">v{{ version }}</div>
      </div>
    </footer>
  `,
})
export class EmailBuilderFooterComponent {
  @Input({ required: true }) version!: string;
  @Input() isSaving = false;
  @Input({ required: true }) autoSaveEnabled = true;
  @Input({ required: true }) lastSaved!: string;
  @Input({ required: true }) blockCount!: number;
  @Input({ required: true }) variableCount!: number;

  @Output() autoSaveToggle = new EventEmitter<boolean>();

  toggleAutoSave(): void {
    this.autoSaveToggle.emit(!this.autoSaveEnabled);
  }
}
