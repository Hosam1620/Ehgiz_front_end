import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [],
  templateUrl: './toast.component.html',
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
}
