import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:true,
  imports: [],
  templateUrl: './logo.html',
  styleUrl: './logo.css',
})
export class Logo {
  images:any[]=[
    {name:'JNTUA College of Engineering Kalikiri',image:'../../../assets/TCN_logo.jpeg'},
    {name:'chaithaya college',image:'../../../assets/TCN_logo.jpeg'},
    {name:'chaithaya college',image:'../../../assets/TCN_logo.jpeg'}
  ]
}
