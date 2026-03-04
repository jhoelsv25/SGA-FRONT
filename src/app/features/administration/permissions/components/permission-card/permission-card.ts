import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from '@shared/directives';
import { Permission } from '../../../services/api/permission-api';

@Component({
  selector: 'sga-permission-card',
  standalone: true,
  imports: [CommonModule, Button],
  templateUrl: './permission-card.html',
  styleUrls: ['./permission-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionCardComponent {
  @Input({ required: true }) permission!: Permission;
  
  @Output() edit = new EventEmitter<Permission>();
  @Output() delete = new EventEmitter<Permission>();
}
