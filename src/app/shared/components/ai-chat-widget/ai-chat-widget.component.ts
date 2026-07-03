import { Component, inject, ElementRef, ViewChild, AfterViewChecked, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AiChatStateService } from '../../../core/services/ai-chat-state.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-ai-chat-widget',
  standalone: true,
  imports: [FormsModule, DatePipe, NgClass, RouterLink, LoadingSpinnerComponent],
  templateUrl: './ai-chat-widget.component.html',
})
export class AiChatWidgetComponent implements AfterViewChecked {
  readonly chatState = inject(AiChatStateService);
  
  @ViewChild('chatScrollContainer') private scrollContainer!: ElementRef;

  inputValue = '';

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

  sendMessage() {
    const val = this.inputValue.trim();
    if (val.length < 5 || this.chatState.isWaiting()) return;
    
    this.chatState.sendMessage(val);
    this.inputValue = '';
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
