import { Injectable } from '@angular/core';
import { Api } from '../../../core/api/api';

export interface MaterialForm {
  title: string;
  description?: string | null;
  materialType: string;
  downloadAllowed: boolean;
  previewAllowed: boolean;
  isActive?: boolean;
  file?: File | null;
}

@Injectable({
  providedIn: 'root',
})
export class MaterialService {
  constructor(private api: Api) {}

  // The API lists materials through a POST filter, not a GET.
  getMaterials(filter: { search?: string; materialType?: string; isActive?: boolean } = {}) {
    return this.api.POST('Material/filter', filter);
  }
  createMaterial(form: MaterialForm) {
    return this.api.POST('Material', this.toFormData(form));
  }
  updateMaterial(id: number, form: MaterialForm) {
    return this.api.PUT(`Material/${id}`, this.toFormData(form));
  }
  deleteMaterial(id: number) {
    return this.api.DELETE(`Material/${id}`);
  }
  download(id: number) {
    return this.api.GETBlob(`Material/${id}/download`);
  }

  // The endpoints take multipart/form-data (the file travels with the fields).
  private toFormData(form: MaterialForm): FormData {
    const data = new FormData();
    data.append('Title', form.title);
    if (form.description) {
      data.append('Description', form.description);
    }
    data.append('MaterialType', form.materialType);
    data.append('DownloadAllowed', String(form.downloadAllowed));
    data.append('PreviewAllowed', String(form.previewAllowed));
    if (form.isActive !== undefined) {
      data.append('IsActive', String(form.isActive));
    }
    if (form.file) {
      data.append('File', form.file, form.file.name);
    }
    return data;
  }
}
