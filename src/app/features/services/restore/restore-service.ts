import { Injectable } from '@angular/core';
import { Api } from '../../../core/api/api';

@Injectable({
  providedIn: 'root',
})
export class RestoreService {
  constructor(private api: Api) {}

  getKinds() {
    return this.api.GET('Restore');
  }
  getDeleted(kind: string, page: number, pageSize: number) {
    return this.api.GET(`Restore/${kind}`, { page, pageSize });
  }
  restore(kind: string, id: number) {
    return this.api.POST(`Restore/${kind}/${id}`, {});
  }
}
