import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ZardButtonComponent } from '@/shared/components/button';

type DetailRow = { label: string; value: string };

@Component({
  selector: 'sga-profile-hero',
  standalone: true,
  imports: [CommonModule, ZardButtonComponent],
  templateUrl: './profile-hero.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileHeroComponent {
  readonly photoUrl = input<string | null>(null);
  readonly displayName = input<string>('Usuario');
  readonly initials = input<string>('U');
  readonly roleBadge = input<string>('Perfil');
  readonly roleName = input<string | null>(null);
  readonly institutionName = input<string | null>(null);
  readonly heroDescription = input<string>('');
  readonly heroPills = input<DetailRow[]>([]);
  readonly editing = input<boolean>(false);
  readonly saving = input<boolean>(false);
  readonly saveDisabled = input<boolean>(false);
  readonly photoUploading = input<boolean>(false);

  readonly editRequested = output<void>();
  readonly cancelRequested = output<void>();
  readonly saveRequested = output<void>();
  readonly photoSelected = output<Event>();
}
