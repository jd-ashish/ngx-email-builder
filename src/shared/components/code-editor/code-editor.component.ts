import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  ViewChild,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-code-editor',
  standalone: true,
  template: `
    <div #editorContainer class="editor-container"></div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .editor-container {
      width: 100%;
      height: 100%;
    }
  `],
})
export class CodeEditorComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() language: string = 'html';
  @Input() theme: string = 'vs-dark';
  @Input() code: string = '';
  @Input() readonly: boolean = false;

  @Output() codeChange = new EventEmitter<string>();

  @ViewChild('editorContainer') editorContainer!: ElementRef;

  private editorInstance: any;
  private monaco: any;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  async ngAfterViewInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      this.monaco = await import('monaco-editor');

      (window as any).MonacoEnvironment = {
        getWorkerUrl: (_moduleId: string, label: string) => {
          if (label === 'json')
            return 'assets/vs/language/json/json.worker.js';
          if (label === 'css' || label === 'scss' || label === 'less')
            return 'assets/vs/language/css/css.worker.js';
          if (label === 'html' || label === 'handlebars' || label === 'razor')
            return 'assets/vs/language/html/html.worker.js';
          if (label === 'typescript' || label === 'javascript')
            return 'assets/vs/language/typescript/ts.worker.js';
          return 'assets/vs/editor/editor.worker.js';
        },
      };

      this.editorInstance = this.monaco.editor.create(
        this.editorContainer.nativeElement,
        {
          value: this.code,
          language: this.language,
          theme: this.theme,
          automaticLayout: true,
          readOnly: this.readonly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
        },
      );

      this.editorInstance.onDidChangeModelContent(() => {
        const newValue = this.editorInstance.getValue();
        if (this.code !== newValue) {
          this.code = newValue;
          this.codeChange.emit(newValue);
        }
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.editorInstance && changes['code'] && !changes['code'].firstChange) {
      const currentValue = this.editorInstance.getValue();
      if (changes['code'].currentValue !== currentValue) {
        this.editorInstance.setValue(changes['code'].currentValue);
      }
    }
    if (this.editorInstance && changes['language'] && !changes['language'].firstChange) {
      this.monaco.editor.setModelLanguage(this.editorInstance.getModel(), changes['language'].currentValue);
    }
    if (this.editorInstance && changes['readonly']) {
      this.editorInstance.updateOptions({ readOnly: changes['readonly'].currentValue });
    }
  }

  ngOnDestroy(): void {
    if (this.editorInstance) {
      this.editorInstance.dispose();
    }
  }
}
