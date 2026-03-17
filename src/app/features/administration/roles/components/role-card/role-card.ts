import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Role } from '../../../services/api/role-api';


@Component({
  selector: 'sga-role-card',
  standalone: true,
  imports: [CommonModule, ZardCardComponent, ZardButtonComponent],
  templateUrl: './role-card.html',
  styleUrls: ['./role-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleCardComponent {
  @Input({ required: true }) role!: Role;
  @Input() selected = false;
  
  @Output() roleSelected = new EventEmitter<Role>();
  @Output() editClicked = new EventEmitter<Role>();
  @Output() deleteClicked = new EventEmitter<Role>();
}
