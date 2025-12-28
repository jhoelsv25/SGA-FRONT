import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { Button } from '@shared/directives';

@Component({
  selector: 'sga-no-permissions',
  imports: [Button],
  templateUrl: './no-permissions.html',
  standalone: true,
})
export class NoPermissions {
  private authFacade = inject(AuthFacade);
  private router = inject(Router);

  logout() {
    this.authFacade.logout();
    this.router.navigate(['/auth/login']);
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}
