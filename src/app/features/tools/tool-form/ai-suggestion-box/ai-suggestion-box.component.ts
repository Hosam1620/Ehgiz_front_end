import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-ai-suggestion-box',
  standalone: true,
  templateUrl: './ai-suggestion-box.component.html',
  styleUrls: ['./ai-suggestion-box.component.css']
})
export class AiSuggestionBoxComponent {
  loading = input<boolean>(false);
  suggestion = input<string | null>(null);

  accept = output<void>();
  dismiss = output<void>();
}
