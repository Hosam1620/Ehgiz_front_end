import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './contact.component.html',
})
export class ContactComponent {
  name = signal('');
  email = signal('');
  subject = signal('');
  message = signal('');
  submitted = signal(false);

  submit(): void {
    if (!this.name() || !this.email() || !this.message()) return;
    this.submitted.set(true);
  }
}
