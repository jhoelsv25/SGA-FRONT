import { ZardCardComponent } from '@/shared/components/card';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { DashboardStore } from '@features/dashboard/application/dashboard.store';
import { NgxChartsModule } from '@swimlane/ngx-charts';


@Component({
  selector: 'sga-home',
  imports: [ZardCardComponent, RouterLink, NgxChartsModule],
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
  chartData = computed(() => {
    const summary = this.dashboard()?.summary ?? [];
    return summary
      .map((item) => ({
        name: item.label,
        value: typeof item.value === 'number' ? item.value : Number(item.value),
      }))
      .filter((item) => Number.isFinite(item.value));
  });


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
