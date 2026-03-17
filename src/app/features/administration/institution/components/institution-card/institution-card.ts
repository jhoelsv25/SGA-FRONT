import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Institution } from '../../types/institution-types';


@Component({
  selector: 'sga-institution-card',
  standalone: true,
  imports: [CommonModule, ZardCardComponent, ZardButtonComponent],
  templateUrl: './institution-card.html',
  styleUrls: ['./institution-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstitutionCardComponent {
  @Input({ required: true }) institution!: Institution;
  
  @Output() edit = new EventEmitter<Institution>();
  @Output() delete = new EventEmitter<Institution>();

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'active': 'Activa',
      'inactive': 'Inactiva',
      'pending': 'Pendiente'
    };
    return labels[status.toLowerCase()] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'active': 'bg-success/10 text-success border-success/20',
      'inactive': 'bg-error/10 text-error border-error/20',
      'pending': 'bg-warning/10 text-warning border-warning/20'
    };
    return colors[status.toLowerCase()] || 'bg-base-200 text-base-content/60';
  }
}
