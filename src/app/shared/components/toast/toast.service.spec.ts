import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  afterEach(() => vi.useRealTimers());

  it('show adds a toast with the given content', () => {
    service.show('Saved', 'Your tool was saved', 'success');

    const toast = service.toasts()[0];
    expect(toast.title).toBe('Saved');
    expect(toast.body).toBe('Your tool was saved');
    expect(toast.type).toBe('success');
  });

  it('auto-dismisses after the duration', () => {
    service.show('Ping', '', 'info', 1000);
    expect(service.toasts()).toHaveLength(1);

    vi.advanceTimersByTime(1001);

    expect(service.toasts()).toHaveLength(0);
  });

  it('dismiss removes only the targeted toast', () => {
    service.show('One');
    service.show('Two');
    const [first] = service.toasts();

    service.dismiss(first.id);

    expect(service.toasts().map(t => t.title)).toEqual(['Two']);
  });
});
