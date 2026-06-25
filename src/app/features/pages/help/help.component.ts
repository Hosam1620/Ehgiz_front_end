import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './help.component.html',
})
export class HelpComponent {
  openIndex = signal<number | null>(null);

  toggle(i: number): void {
    this.openIndex.set(this.openIndex() === i ? null : i);
  }

  faqs = [
    { q: 'How do I rent a tool?', a: 'Browse available tools, select one, choose your dates and submit a booking request. The owner will confirm and you can pick it up.' },
    { q: 'How do I list my tool for rent?', a: 'Go to "List a tool" from the navigation or footer, fill in the details, set your daily rate and availability, then publish.' },
    { q: 'How does payment work?', a: 'Payment is processed securely through our platform when the owner confirms your booking. Funds are released to the owner after the rental period ends.' },
    { q: 'What if the tool is damaged?', a: 'All rentals are covered by our insurance policy. Report any damage through the booking page within 24 hours of returning the tool.' },
    { q: 'Can I cancel a booking?', a: 'Yes, you can cancel up to 24 hours before the start date for a full refund. Later cancellations may be subject to the owner\'s cancellation policy.' },
    { q: 'How do I contact the tool owner?', a: 'Once a booking is created you can message the owner directly through the Messages section in your account.' },
  ];
}
