import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@shared/ui/card/card';
import { Button } from '@shared/directives';
import { Role } from '../../../services/api/role-api';

@Component({
  selector: 'sga-role-card',
  standalone: true,
  imports: [CommonModule, Card, CardHeader, CardTitle, CardContent, CardFooter, Button],
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
