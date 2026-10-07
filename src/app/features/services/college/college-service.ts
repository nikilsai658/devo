import { Injectable } from '@angular/core';
import {Api} from '../../../core/api/api';
@Injectable({
  providedIn: 'root',
})
export class CollegeService {
  constructor(private api:Api){}
 getcollege(){
    return this.api.GET('College');
  }
  // Before login (the college picker): the default instance answers, so a stopped college cannot block the list.
  getcollegeforlogin(){
    return this.api.GET('College', undefined, { useDefaultBase: true });
  }
  // The API address of the instance that serves a college ({ data: { apiBase } }, or data null).
  resolveapibase(code:string){
    return this.api.GET(`Deployment/resolve/${encodeURIComponent(code)}`, undefined, { useDefaultBase: true });
  }
  getcollegebyid(id:any){
    return this.api.GET(`College/${id}`);
  }
  createcollege(data:any){
    return this.api.POST('College',data);
  }
  updatecollege(id:any,data:any){
    return this.api.PUT(`College/${id}`,data);
  }
  deletecollege(id:any){
    return this.api.DELETE(`College/${id}`);
  }
}
