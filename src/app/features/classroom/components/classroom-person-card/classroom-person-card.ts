import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sga-classroom-person-card',

  imports: [CommonModule],
  templateUrl: './classroom-person-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassroomPersonCard {
  public person = input.required<any>();
  public type = input.required<'teacher' | 'student'>();

  readonly displayName = computed(() => {
    const p = this.person();
    if (this.type() === 'teacher') return `${p.firstName} ${p.lastName}`;
    return p.name;
  });

  readonly initials = computed(() => {
    const name = this.displayName();
    return (
      name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part: string) => part[0]?.toUpperCase() ?? '')
        .join('') || '?'
    );
  });
}
