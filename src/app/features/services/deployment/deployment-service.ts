import { Injectable } from '@angular/core';
import { Api } from '../../../core/api/api';

@Injectable({
  providedIn: 'root',
})
export class DeploymentService {
  constructor(private api: Api) {}

  getDeployments() {
    return this.api.GET('Deployment');
  }
  getSummary() {
    return this.api.GET('Deployment/summary');
  }
  createDeployment(data: any) {
    return this.api.POST('Deployment', data);
  }
  updateDeployment(id: number, data: any) {
    return this.api.PUT(`Deployment/${id}`, data);
  }
  setConnectionString(id: number, connectionString: string) {
    return this.api.PUT(`Deployment/${id}/connection-string`, { connectionString });
  }
  deleteDeployment(id: number) {
    return this.api.DELETE(`Deployment/${id}`);
  }
}
