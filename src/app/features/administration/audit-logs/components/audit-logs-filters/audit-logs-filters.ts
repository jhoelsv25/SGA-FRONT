export type LocalSelectOption = { value: string | number; label: string; [key: string]: any };
import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ChangeDetectionStrategy, Component, input, OnDestroy, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';


@Component({
  selector: 'sga-audit-logs-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectOptionComponent],
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
    { label: 'Eliminaciones', value: 'DELETE' }]);

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
