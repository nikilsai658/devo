import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild, ChangeDetectionStrategy
} from '@angular/core';

import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CodeSubmission {
  languageId: number;
  sourceCode: string;
  stdin: string | null;
}

@Component({
  selector: 'app-code-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './code-editor.html',
  styleUrls: ['./code-editor.css']
})
export class CodeEditorComponent implements AfterViewInit, OnChanges {

  @ViewChild('editorContainer', { static: true })
  editorContainer!: ElementRef<HTMLDivElement>;

  @Input() isRunning = false;
  @Input() isSubmitting = false;

  @Input() runResult: any = null;
  @Input() submitResult: any = null;
  @Input() submitMessage: string | null = null;
  @Input() runError: string | null = null;
  @Input() submitError: string | null = null;

  // Seeds stdin with the assignment's sample test-case input, so a
  // student can Run/Submit without typing anything. Only applied while
  // stdin is still untouched — never overwrites what the student typed.
  @Input() defaultStdin: string | null = null;

  private stdinTouched = false;

  showCustomInput = false;

  @Output() run = new EventEmitter<CodeSubmission>();
  @Output() submit = new EventEmitter<CodeSubmission>();

  editor: any;
  monaco: any;

  selectedLanguage = 'python';

  // File name shown on the editor tab / terminal prompt, per language.
  private readonly fileNames: Record<string, string> = {
    python: 'main.py',
    javascript: 'main.js',
    java: 'Main.java',
    cpp: 'main.cpp',
    csharp: 'Program.cs'
  };

  get fileName(): string {
    return this.fileNames[this.selectedLanguage] ?? 'main';
  }

  // State shown on the terminal tab: idle, running, success or error.
  get terminalState(): 'idle' | 'running' | 'success' | 'error' {
    if (this.isRunning || this.isSubmitting) return 'running';
    if (this.runError || this.submitError) return 'error';
    if (this.submitResult) return this.submitResult.isAccepted ? 'success' : 'error';
    if (this.runResult) return this.runResult.status === 'Accepted' && !this.runResult.error ? 'success' : 'error';
    return 'idle';
  }

  stdin = '';

  // Judge0 language IDs (from this backend's live /languages endpoint),
  // not sequential — Judge0's own id=1 is archived Bash, not Python.
  readonly languageIds: Record<string, number> = {
    python: 71,
    javascript: 63,
    java: 62,
    cpp: 54,
    csharp: 51
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnChanges(changes: SimpleChanges): void {

    if (
      changes['defaultStdin'] &&
      !this.stdinTouched &&
      this.defaultStdin
    ) {
      this.stdin = this.defaultStdin;
    }

  }

  onStdinChange(value: string): void {
    this.stdin = value;
    this.stdinTouched = true;
  }

  async ngAfterViewInit() {

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.configureMonacoWorkers();

    // Import only the editor core plus plain syntax-highlighting
    // (Monarch grammar, no worker involved) for the languages this
    // judge platform supports. The full 'monaco-editor' barrel also
    // auto-registers the TypeScript language *service*, which needs
    // a worker-side module loader this ESM/Vite setup doesn't provide
    // and throws even when the active language is something else.
    this.monaco = await import('monaco-editor/esm/vs/editor/editor.api');

    await Promise.all([
      import('monaco-editor/esm/vs/basic-languages/python/python.contribution'),
      import('monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'),
      import('monaco-editor/esm/vs/basic-languages/java/java.contribution'),
      import('monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution'),
      import('monaco-editor/esm/vs/basic-languages/csharp/csharp.contribution')
    ]);

    // IDE-style dark theme matching the page (same in light and dark app
    // themes — the component re-inverts itself in light mode).
    this.monaco.editor.defineTheme('tripledot-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0b0b0e',
        'editor.lineHighlightBackground': '#16161b',
        'editor.lineHighlightBorder': '#16161b',
        'editorLineNumber.foreground': '#3f3f46',
        'editorLineNumber.activeForeground': '#a1a1aa',
        'editorCursor.foreground': '#e4e4e7',
        'editor.selectionBackground': '#6B21D055',
        'editorIndentGuide.background1': '#1f1f24',
        'editorGutter.background': '#0b0b0e',
        'minimap.background': '#0b0b0e',
        'scrollbarSlider.background': '#ffffff14',
        'scrollbarSlider.hoverBackground': '#ffffff24',
        'editorWidget.background': '#141418',
        'editorWidget.border': '#27272a',
        'editorSuggestWidget.background': '#141418',
        'editorSuggestWidget.border': '#27272a',
        'editorSuggestWidget.selectedBackground': '#6B21D040'
      }
    });

    this.editor = this.monaco.editor.create(
      this.editorContainer.nativeElement,
      {
        value: this.getDefaultCode('python'),
        language: 'python',
        theme: 'tripledot-dark',
        automaticLayout: true,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace",
        fontSize: 14,
        lineHeight: 22,
        fontLigatures: true,
        padding: { top: 16, bottom: 16 },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        renderLineHighlight: 'all',
        roundedSelection: true,
        bracketPairColorization: { enabled: true },
        minimap: {
          enabled: true,
          renderCharacters: false
        }
      }
    );
  }

  private configureMonacoWorkers(): void {

    // None of the languages we register (Python/JS/Java/C++/C#) use
    // anything beyond plain Monarch tokenization, so the generic
    // editor worker (bracket matching, folding, etc.) is the only
    // one ever requested.
    (window as any).MonacoEnvironment = {

      getWorker: () =>
        new Worker(
          new URL('../../../../../node_modules/monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url),
          { type: 'module' }
        )

    };
  }

  changeLanguage(language: string) {

    this.selectedLanguage = language;

    this.monaco.editor.setModelLanguage(
      this.editor.getModel(),
      language
    );

    this.editor.setValue(this.getDefaultCode(language));
  }

  resetCode(): void {

    this.editor.setValue(
      this.getDefaultCode(this.selectedLanguage)
    );
  }

  onRunClick(): void {

    this.run.emit({
      languageId: this.languageIds[this.selectedLanguage],
      sourceCode: this.editor.getValue(),
      stdin: this.stdin.trim() ? this.stdin : null
    });
  }

  onSubmitClick(): void {

    this.submit.emit({
      languageId: this.languageIds[this.selectedLanguage],
      sourceCode: this.editor.getValue(),
      stdin: this.stdin.trim() ? this.stdin : null
    });
  }

  getDefaultCode(language: string): string {

    switch (language) {

      case 'python':
        return `print("Hello World")`;

      case 'javascript':
        return `console.log("Hello World");`;

      case 'java':
        return `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}`;

      case 'cpp':
        return `#include <iostream>
using namespace std;

int main() {
    cout << "Hello World";
}`;

      case 'csharp':
        return `using System;

class Program
{
    static void Main()
    {
        Console.WriteLine("Hello World");
    }
}`;

      default:
        return '';
    }
  }
}