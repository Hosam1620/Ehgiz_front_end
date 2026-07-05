import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToolsService } from '../../core/services/tools.service';
import { BrowseService } from '../tools/browse.service';
import { BrowseFilterStore } from '../tools/browse-filter.store';
import { CategoryOption, Tool } from '../../core/models/tool.model';
import { ToolCardComponent } from '../../shared/components/tool-card/tool-card.component';

const CATEGORY_EMOJI: { match: RegExp; emoji: string }[] = [
  { match: /power|drill/i, emoji: '🛠️' },
  { match: /garden|lawn/i, emoji: '🌱' },
  { match: /construct|build/i, emoji: '🏗️' },
  { match: /clean|wash/i, emoji: '🧹' },
  { match: /photo|camera/i, emoji: '📷' },
  { match: /paint/i, emoji: '🎨' },
  { match: /electric|generat/i, emoji: '⚡' },
  { match: /wood|saw/i, emoji: '🪚' },
];

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, ToolCardComponent],
  templateUrl: './landing.component.html',
})
export class LandingComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly toolsService = inject(ToolsService);
  private readonly browseService = inject(BrowseService);
  private readonly filterStore = inject(BrowseFilterStore);
  private readonly router = inject(Router);

  protected readonly categories = signal<CategoryOption[]>([]);
  protected readonly featuredTools = signal<Tool[]>([]);
  protected readonly toolsLoading = signal(true);

  protected readonly steps = [
    { icon: '📋', title: 'List', description: 'Owners photograph their idle tools and publish a listing with price and availability in minutes.' },
    { icon: '📅', title: 'Book', description: 'Renters pick dates on the calendar and pay securely from their wallet — funds are held in escrow.' },
    { icon: '🤝', title: 'Handover', description: 'Both parties document the handover with photos and notes, so everyone is protected.' },
    { icon: '✅', title: 'Return', description: 'Return the tool, confirm its condition, and the owner gets paid automatically.' },
  ];

  ngOnInit(): void {
    this.browseService.loadCategoryOptions().subscribe({
      next: categories => this.categories.set(categories.slice(0, 6)),
    });

    this.toolsService.getAll({ isAvailable: true, page: 1, pageSize: 8 }).subscribe({
      next: result => {
        this.featuredTools.set((result.items ?? []).slice(0, 8));
        this.toolsLoading.set(false);
      },
      error: () => this.toolsLoading.set(false),
    });
  }

  categoryEmoji(name: string): string {
    return CATEGORY_EMOJI.find(c => c.match.test(name))?.emoji ?? '🧰';
  }

  browseCategory(category: CategoryOption): void {
    this.filterStore.reset();
    this.filterStore.patch({ categoryId: category.id });
    this.router.navigate(['/browse']);
  }
}
