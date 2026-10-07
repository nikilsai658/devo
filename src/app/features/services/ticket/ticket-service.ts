import { Injectable } from '@angular/core';
import { Api } from '../../../core/api/api';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  constructor(private api:Api){}
  getTickets(status?: string, collegeName?: string){

    const params: any = {};

    if (status) {
      params.status = status;
    }

    if (collegeName) {
      params.collegeName = collegeName;
    }

    return this.api.GET('Ticket', params);
  }
  // `background`: a polling refresh (no global progress bar).
  getTicketById(id:number, background = false){
    return this.api.GET(`Ticket/${id}`, undefined, { background });
  }
  getticketmy(){
    return this.api.GET('Ticket/my');
  }
  createTicket(data:any){
    return this.api.POST('Ticket',data);
  }
  updateTicketstatus(id:number,data:any){
    return this.api.PUT(`Ticket/${id}/status`,data);
  }
  getMessages(ticketId: number, afterId: number = 0, background = false) {
    return this.api.GET(`Ticket/${ticketId}/messages`, { afterId }, { background });
  }
  replyTicket(ticketId: number, message: string) {
    return this.api.POST(`Ticket/${ticketId}/reply`, { message });
  }
}
