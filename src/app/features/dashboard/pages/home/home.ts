import { ZardCardComponent } from '@/shared/components/card';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { DashboardStore } from '@features/dashboard/application/dashboard.store';
@Component({
  selector: 'sga-home',
  imports: [ZardCardComponent, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home implements OnInit {
  private authFacade = inject(AuthFacade);
  private dashboardStore = inject(DashboardStore);

  currentUser = computed(() => this.authFacade.getCurrentUser());
  dashboard = computed(() => this.dashboardStore.data());
  dashboardLoading = computed(() => this.dashboardStore.loading());

  greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  });

  userName = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    return (user as Record<string, unknown>)['firstName']
      ? `${(user as Record<string, unknown>)['firstName']}`
      : `${(user as Record<string, unknown>)['username'] ?? ''}`;
  });

  ngOnInit() {
    this.dashboardStore.load();
  }
}
