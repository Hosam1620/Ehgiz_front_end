import { Component, computed, input, model, signal } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  imports: [],
  templateUrl: './star-rating.component.html',
})
export class StarRatingComponent {
  rating = model<number>(0);
  maxStars = input<number>(5);
  readonly = input<boolean>(false);

  private hoverRating = signal<number>(0);

  stars = computed(() => Array.from({ length: this.maxStars() }, (_, i) => i + 1));

  isFilled(star: number): boolean {
    const effective = this.hoverRating() || this.rating();
    return star <= Math.round(effective);
  }

  onHover(star: number): void {
    if (!this.readonly()) this.hoverRating.set(star);
  }

  onLeave(): void {
    this.hoverRating.set(0);
  }

  onSelect(star: number): void {
    if (!this.readonly()) this.rating.set(star);
  }
}
