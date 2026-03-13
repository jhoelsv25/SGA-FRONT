import { ChangeDetectionStrategy, Component, input, OnDestroy, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Select, SelectOption } from '@shared/adapters/ui/select/select';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'sga-audit-logs-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, Select],
  templateUrl: './audit-logs-filters.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogsFilters implements OnInit, OnDestroy {
  search = input<string>('');
  action = input<string | null>(null);

  searchChanged = output<string>();
  actionChanged = output<string | null>();

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  actionOptions = signal<SelectOption[]>([
    { label: 'Creaciones', value: 'CREATE' },
    { label: 'Modificaciones', value: 'UPDATE' },
    { label: 'Eliminaciones', value: 'DELETE' },
  ]);

  ngOnInit() {
    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(value => {
        this.searchChanged.emit(value);
      });
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }
}
