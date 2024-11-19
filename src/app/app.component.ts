import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { MainFrameComponent} from './main-frame/main-frame.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainFrameComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent{
  title = 'fodase'
  // ngOnInit() {
  //   this.subject.subscribe({next: (message) => console.log(message), error: (err) => console.log(err)})
  // }
  // ngOnDestroy() {
  //   this.subject.unsubscribe();
  // }
  // private subject: Subject<any>

  // constructor() {
  //   this.subject = webSocket('ws://localhost:4000')
  //   console.log('eae')
  // }

  // ngOnInit() {
  //   this.subject.subscribe({next: (message) => console.log(message), error: (err) => console.log(err)})
  // }

  // ngOnDestroy() {
  //   this.subject.unsubscribe();
  // }
}
