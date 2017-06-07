import { Component } from '@angular/core';
import { objectHash } from 'ts-object-hash';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public title = 'app works!';
  public hash1: string;
  public hash2: string;
  constructor() {
    console.log('objectHash:', objectHash);
    this.hash1= objectHash({a:1,b:2});
    this.hash1= objectHash({b:2,a:1});
  }
}
