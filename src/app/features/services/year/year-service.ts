import { Injectable } from '@angular/core';
import {Api} from '../../../core/api/api';
@Injectable({
  providedIn: 'root',
})
export class YearService {
  constructor(private api:Api){}
  getYears(){
    return this.api.GET('Year');
  }
  getYearById(id:number){
    return this.api.GET(`Year/${id}`);
  }
  createYear(data:any){
    return this.api.POST('Year',data);
  }
  updateYear(id:number,data:any){
    return this.api.PUT(`Year/${id}`,data);
  }
  deleteYear(id:number){
    return this.api.DELETE(`Year/${id}`);
  }
  YearUpdate(data:any){
    return this.api.POST(`Year/promote`,data);
  }
  YearUpdatewithDomain(file:File){
    const formData = new FormData();

  // Fixed key expected by backend
  formData.append('file', file);
    return this.api.POST('Year/promote-with-domains',formData);
  }
}
