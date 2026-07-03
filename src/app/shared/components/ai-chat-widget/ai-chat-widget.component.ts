import { Component, inject, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AiChatStateService } from '../../../core/services/ai-chat-state.service';
import { ChatMarkdownPipe } from './chat-markdown.pipe';

@Component({
  selector: 'app-ai-chat-widget',
  standalone: true,
  imports: [FormsModule, NgClass, RouterLink, DatePipe, DecimalPipe, ChatMarkdownPipe],
  templateUrl: './ai-chat-widget.component.html',
})
export class AiChatWidgetComponent implements AfterViewChecked {
  readonly chatState = inject(AiChatStateService);

  @ViewChild('chatScrollContainer') private scrollContainer!: ElementRef;

  inputValue = '';

  protected readonly suggestions = [
    'I need to fix a leaky faucet',
    'Looking for a drill for a home project',
    'What tools do I need to paint a room?',
    'Something to trim my garden hedges',
  ];

  // To prevent scrolling on every change if the user has manually scrolled up, we can just scroll to bottom automatically on new messages.
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  toggleChat() {
    this.chatState.toggleChat();
  }

  closeChat() {
    this.chatState.closeChat();
  }

  clearChat() {
    this.chatState.clearChat();
  }

  sendMessage() {
    const val = this.inputValue.trim();
    if (val.length < 5 || this.chatState.isWaiting()) return;

    this.chatState.sendMessage(val);
    this.inputValue = '';
  }

  sendSuggestion(text: string) {
    if (this.chatState.isWaiting()) return;
    this.chatState.sendMessage(text);
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onToolImageError(event: Event) {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
