import { Injectable } from '@angular/core';
import { Api } from '../../../core/api/api';

@Injectable({
  providedIn: 'root',
})
export class MonitoringService {
  constructor(private api: Api) {}

  getDashboards() {
    return this.api.GET('Monitoring/dashboards');
  }
  // A one-hour, view-only Grafana link. Ask again for every page load / filter change.
  getEmbed(params: { dashboard: string; college?: string; from?: string; to?: string; theme?: string }) {
    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value) query[key] = value;
    }
    return this.api.GET('Monitoring/embed', query);
  }
  getUptimeTargets() {
    return this.api.GET('Monitoring/uptime-targets');
  }
}
