import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

@Pipe({ name: 'chatMarkdown', standalone: true })
export class ChatMarkdownPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeHtml {
    if (!value) return '';

    const bold = escapeHtml(value).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    const html = bold
      .split(/\n{2,}/)
      .map(block => {
        const lines = block.split('\n').filter(line => line.trim().length > 0);
        const isList = lines.length > 0 && lines.every(line => /^\s*[-*]\s+/.test(line));

        if (isList) {
          const items = lines.map(line => `<li>${line.replace(/^\s*[-*]\s+/, '')}</li>`).join('');
          return `<ul>${items}</ul>`;
        }
        return `<p>${lines.join('<br>')}</p>`;
      })
      .join('');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
