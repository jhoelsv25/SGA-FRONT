import { ZardButtonComponent } from '@/shared/components/button';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';

@Component({
  selector: 'sga-no-permissions',
  imports: [ZardButtonComponent],
  templateUrl: './no-permissions.html',
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
