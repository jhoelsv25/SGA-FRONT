import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardTabComponent, ZardTabGroupComponent } from '@/shared/components/tabs';
import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';

type DetailRow = { label: string; value: string };
type RoleGroup = { key: string; title: string; rows: DetailRow[] };

@Component({
  selector: 'sga-profile-main-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardInputDirective,
    SelectOptionComponent,
    ZardTabGroupComponent,
    ZardTabComponent,
  ],
  templateUrl: './profile-main-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileMainPanelComponent {
  readonly editing = input<boolean>(false);
  readonly profileRows = input<DetailRow[]>([]);
  readonly summaryRows = input<DetailRow[]>([]);
  readonly roleRows = input<DetailRow[]>([]);
  readonly profileForm = input.required<any>();
  readonly documentTypeOptions = input<{ value: string; label: string }[]>([]);
  readonly genderOptions = input<{ value: string; label: string }[]>([]);
  readonly roleSectionTitle = input<string>('Contexto del rol');
  readonly roleSectionDescription = input<string>('');
  readonly roleBadge = input<string>('Perfil');
  readonly roleEditGroups = input<RoleGroup[]>([]);
}
