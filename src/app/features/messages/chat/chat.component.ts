import {
  Component,
  DestroyRef,
  HostListener,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  AfterViewChecked,
  ElementRef,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MessageService } from '../../../core/services/message.service';
import { ChatHubService } from '../../../core/services/chat-hub.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConversationDto, MessageDto } from '../../../core/models/message.model';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';

@Component({
  standalone: true,
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  imports: [FormsModule, TimeAgoPipe, LoadingSpinnerComponent, AvatarComponent],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  private readonly messagesEnd = viewChild<ElementRef<HTMLElement>>('messagesEnd');
  private readonly chatBodyRef = viewChild<ElementRef<HTMLElement>>('chatBody');

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly chatHub = inject(ChatHubService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly conversationId = signal(0);
  readonly conversation = signal<ConversationDto | null>(null);
  readonly messages = signal<MessageDto[]>([]);
  readonly isLoading = signal(false);
  readonly isSending = signal(false);
  readonly isLoadingMore = signal(false);
  readonly hasMore = signal(false);
  readonly error = signal<string | null>(null);
  readonly sendError = signal<string | null>(null);
  readonly messageInput = signal('');
  readonly isOtherTyping = signal(false);

  private currentPage = 1;
  private readonly PAGE_SIZE = 30;
  private typingTimer?: ReturnType<typeof setTimeout>;
  private isTypingSent = false;
  private shouldScrollToBottom = false;
  private scrollHeightBefore = 0;
  private restoreScroll = false;

  readonly currentUserId = computed(() => this.auth.currentUser()?.id ?? 0);

  @HostListener('window:focus')
  onWindowFocus(): void {
    if (this.conversationId() && this.messages().length) {
      this.markRead();
    }
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = Number(params.get('id'));
      this.conversationId.set(id);
      this.messages.set([]);
      this.conversation.set(null);
      this.currentPage = 1;
      this.hasMore.set(false);
      this.error.set(null);
      this.isOtherTyping.set(false);
      this.loadInitial();
    });
    this.subscribeToHub();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
    const chatBody = this.chatBodyRef();
    if (this.restoreScroll && chatBody) {
      const el = chatBody.nativeElement;
      el.scrollTop = el.scrollHeight - this.scrollHeightBefore;
      this.restoreScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.clearTypingTimer();
    if (this.isTypingSent) {
      this.chatHub.stopTyping(this.conversationId());
    }
  }

  // ─── Data loading ────────────────────────────────────────────────────────────

  private loadInitial(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.currentPage = 1;

    // Load conversation metadata from the inbox
    this.messageService.getConversations().subscribe({
      next: list => {
        this.conversation.set(list?.find(c => c.id === this.conversationId()) ?? null);
      },
      error: () => {},
    });

    this.messageService.getMessages(this.conversationId(), 1, this.PAGE_SIZE).subscribe({
      next: data => {
        // Backend returns newest-first — reverse so oldest is at the top
        this.messages.set([...(data ?? [])].reverse());
        this.hasMore.set((data?.length ?? 0) === this.PAGE_SIZE);
        this.isLoading.set(false);
        this.markRead();
      },
      error: () => {
        this.error.set('Could not load messages. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  loadOlderMessages(): void {
    if (this.isLoadingMore() || !this.hasMore()) return;
    this.isLoadingMore.set(true);
    this.scrollHeightBefore = this.chatBodyRef()?.nativeElement.scrollHeight ?? 0;
    this.currentPage++;

    this.messageService.getMessages(this.conversationId(), this.currentPage, this.PAGE_SIZE).subscribe({
      next: data => {
        const older = [...(data ?? [])].reverse();
        this.messages.update(list => [...older, ...list]);
        this.hasMore.set((data?.length ?? 0) === this.PAGE_SIZE);
        this.isLoadingMore.set(false);
        this.restoreScroll = true;
      },
      error: () => {
        this.isLoadingMore.set(false);
        this.currentPage--;
      },
    });
  }

  private markRead(): void {
    this.messageService.markAsRead(this.conversationId()).subscribe({ error: () => {} });
  }

  // ─── Hub subscriptions ───────────────────────────────────────────────────────

  private subscribeToHub(): void {
    // New message pushed by the server (could be from us or the other user)
    this.chatHub.messageReceived$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(msg => {
      if (msg.conversationId !== this.conversationId()) return;
      // Skip if already in the list (e.g. our own message added via optimistic update)
      if (this.messages().some(m => m.id === msg.id)) return;
      this.messages.update(list => [...list, msg]);
      this.shouldScrollToBottom = true;
      this.markRead();
    });

    // Our messages were read by the other user
    this.chatHub.messagesRead$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ conversationId }) => {
      if (conversationId !== this.conversationId()) return;
      this.messages.update(list =>
        list.map(m =>
          m.senderId === this.currentUserId() ? { ...m, status: 'Read' as const } : m
        )
      );
    });

    // Typing indicator
    this.chatHub.userTyping$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ conversationId, userId, isTyping }) => {
      if (conversationId !== this.conversationId()) return;
      if (userId === this.currentUserId()) return;
      this.isOtherTyping.set(isTyping);
      if (isTyping) this.shouldScrollToBottom = true;
    });
  }

  // ─── Sending ─────────────────────────────────────────────────────────────────

  send(): void {
    const content = this.messageInput().trim();
    if (!content || this.isSending()) return;

    this.sendError.set(null);
    this.stopTypingSignal();

    const tempId = -Date.now();
    const optimistic: MessageDto = {
      id: tempId,
      conversationId: this.conversationId(),
      senderId: this.currentUserId(),
      senderName: this.auth.currentUser()?.fullName ?? '',
      senderAvatarUrl: null,
      content,
      status: 'Sent',
      createdAt: new Date().toISOString(),
      deliveredAt: null,
      readAt: null,
    };

    this.messages.update(list => [...list, optimistic]);
    this.messageInput.set('');
    this.shouldScrollToBottom = true;
    this.isSending.set(true);

    this.messageService.sendMessage(this.conversationId(), content).subscribe({
      next: confirmed => {
        this.messages.update(list => {
          const filtered = list.filter(m => m.id !== tempId);
          return filtered.some(m => m.id === confirmed.id) ? filtered : [...filtered, confirmed];
        });
        this.isSending.set(false);
      },
      error: () => {
        this.messages.update(list => list.filter(m => m.id !== tempId));
        this.sendError.set('Failed to send. Please try again.');
        this.isSending.set(false);
      },
    });
  }

  // ─── Input events ────────────────────────────────────────────────────────────

  onInputChange(value: string): void {
    this.messageInput.set(value);
    this.sendError.set(null);
    this.triggerTyping();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  onInputBlur(): void {
    this.stopTypingSignal();
  }

  // ─── Typing signals ──────────────────────────────────────────────────────────

  private triggerTyping(): void {
    if (!this.isTypingSent) {
      this.isTypingSent = true;
      this.chatHub.startTyping(this.conversationId());
    }
    this.clearTypingTimer();
    this.typingTimer = setTimeout(() => this.stopTypingSignal(), 2000);
  }

  private stopTypingSignal(): void {
    this.clearTypingTimer();
    if (this.isTypingSent) {
      this.isTypingSent = false;
      this.chatHub.stopTyping(this.conversationId());
    }
  }

  private clearTypingTimer(): void {
    clearTimeout(this.typingTimer);
  }

  // ─── Scroll ──────────────────────────────────────────────────────────────────

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (el.scrollTop < 80 && !this.isLoadingMore() && this.hasMore()) {
      this.loadOlderMessages();
    }
  }

  private scrollToBottom(): void {
    try {
      const el = this.chatBodyRef()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  isMe(msg: MessageDto): boolean {
    return msg.senderId === this.currentUserId();
  }

  initialsOf(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase() ?? '')
      .join('');
  }

  statusIcon(status: MessageDto['status']): string {
    if (status === 'Read') return 'fas fa-check-double text-primary';
    if (status === 'Delivered') return 'fas fa-check-double';
    return 'fas fa-check';
  }

  goBack(): void {
    this.router.navigate(['/messages']);
  }
}
