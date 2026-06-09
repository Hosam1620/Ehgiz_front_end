import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  imports: [],
  templateUrl: './loading-spinner.component.html',
})
export class LoadingSpinnerComponent {
  message = input<string>('Loading...');
  overlay = input<boolean>(false);
}
