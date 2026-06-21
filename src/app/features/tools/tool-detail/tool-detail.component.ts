import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { finalize } from 'rxjs';
import { ToolsService } from '../../../core/services/tools.service';
import { Tool } from '../../../core/models/tool.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { MessageService } from '../../../core/services/message.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-tool-detail',
  imports: [RouterModule, DecimalPipe, LoadingSpinnerComponent],
  templateUrl: './tool-detail.component.html',
})
export class ToolDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toolsService = inject(ToolsService);
  private readonly messageService = inject(MessageService);
  private readonly auth = inject(AuthService);

  protected readonly tool = signal<Tool | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly messageError = signal<string | null>(null);
  protected readonly isStartingConversation = signal(false);
  protected readonly selectedImageIndex = signal(0);
  protected readonly failedImages = signal<Set<string>>(new Set());
  protected readonly withInsurance = signal(false);
  protected readonly rentalDays = signal(3);

  protected readonly subtotal = computed(() => {
    const t = this.tool();
    return t ? t.pricePerDay * this.rentalDays() : 0;
  });

  protected readonly insuranceCost = computed(() => {
    const t = this.tool();
    return t && this.withInsurance() ? t.insurancePrice * this.rentalDays() : 0;
  });

  protected readonly serviceFee = computed(() => Math.round(this.subtotal() * 0.1));

  protected readonly total = computed(
    () => this.subtotal() + this.insuranceCost() + this.serviceFee()
  );

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('Invalid tool id.');
      this.isLoading.set(false);
      return;
    }

    this.toolsService.getById(id).subscribe({
      next: tool => {
        this.tool.set(tool);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message ?? err.error?.title ?? 'Failed to load tool.');
        this.isLoading.set(false);
      },
    });
  }

  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  messageOwner(tool: Tool): void {
    this.messageError.set(null);

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/tools/${tool.id}` } });
      return;
    }

    if (this.isOwnTool(tool)) {
      this.router.navigate(['/tools']);
      return;
    }

    this.isStartingConversation.set(true);
    this.messageService
      .startOrGetConversation(tool.ownerId)
      .pipe(finalize(() => this.isStartingConversation.set(false)))
      .subscribe({
        next: conversation => this.router.navigate(['/messages', conversation.id]),
        error: err => {
          this.messageError.set(
            err.error?.message ?? err.error?.title ?? 'Could not open a conversation with this owner.'
          );
        },
      });
  }

  incrementDays(): void {
    this.rentalDays.update(d => d + 1);
  }

  decrementDays(): void {
    this.rentalDays.update(d => Math.max(1, d - 1));
  }

  toggleInsurance(): void {
    this.withInsurance.update(v => !v);
  }

  protected ownerInitials(name: string | null): string {
    if (!name) return 'O';
    const parts = name.split(/[\s@.]+/).filter(Boolean);
    return parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || 'O';
  }

  protected currentImage(tool: Tool): string | null {
    const urls = tool.imageUrls ?? [];
    if (!urls.length) return null;
    const failed = this.failedImages();
    const selected = urls[this.selectedImageIndex()];
    if (selected && !failed.has(selected)) {
      return selected;
    }
    return urls.find(url => !failed.has(url)) ?? null;
  }

  protected placeholderIcon(tool: Tool): string {
    const name = `${tool.categoryName ?? ''} ${tool.name ?? ''}`.toLowerCase();
    if (name.includes('photo') || name.includes('camera')) return 'fas fa-camera';
    if (name.includes('clean') || name.includes('washer')) return 'fas fa-broom';
    if (name.includes('garden') || name.includes('lawn')) return 'fas fa-seedling';
    if (name.includes('construct') || name.includes('ladder')) return 'fas fa-helmet-safety';
    if (name.includes('electri') || name.includes('generat')) return 'fas fa-bolt';
    if (name.includes('wood') || name.includes('saw')) return 'fas fa-ruler-combined';
    if (name.includes('paint')) return 'fas fa-paint-roller';
    return 'fas fa-toolbox';
  }

  protected cardBg(tool: Tool): string {
    const name = (tool.categoryName ?? '').toLowerCase();
    if (name.includes('photo') || name.includes('camera')) return '#EFF6FF';
    if (name.includes('power') || name.includes('drill')) return '#E8F4EE';
    if (name.includes('garden') || name.includes('lawn')) return '#E1F5EE';
    if (name.includes('electri') || name.includes('generat')) return '#FEF6E4';
    if (name.includes('wood') || name.includes('saw')) return '#F1EFE8';
    if (name.includes('construct')) return '#F1EFE8';
    return '#EFEFEA';
  }

  protected memberSince(createdAt: string): string {
    return new Date(createdAt).getFullYear().toString();
  }

  protected isOwnTool(tool: Tool): boolean {
    return this.auth.currentUser()?.id === tool.ownerId;
  }

  protected conditionLabel(condition: string | null): string | null {
    if (!condition) return null;
    const map: Record<string, string> = { '1': 'New', '2': 'Good', '3': 'Fair', '4': 'Poor' };
    return map[condition] ?? condition;
  }

  protected onImageError(url: string): void {
    this.failedImages.update(failed => {
      const next = new Set(failed);
      next.add(url);
      return next;
    });
  }
}
