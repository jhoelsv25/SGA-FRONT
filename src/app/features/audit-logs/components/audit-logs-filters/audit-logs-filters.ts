import { ZardInputDirective } from '@/shared/components/input';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardSelectImports } from '@/shared/components/select';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'sga-audit-logs-filters',

  imports: [CommonModule, FormsModule, ZardIconComponent, ZardInputDirective, ...ZardSelectImports],
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

  actionOptions = signal([
    { label: 'Todas las Acciones', value: '' },
    { label: 'Creaciones', value: 'CREATE' },
    { label: 'Modificaciones', value: 'UPDATE' },
    { label: 'Eliminaciones', value: 'DELETE' },
  ]);

  ngOnInit() {
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((value) => {
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
