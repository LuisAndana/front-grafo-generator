import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `<router-outlet></router-outlet>`,
  styles: []
})
export class App implements OnInit {
  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Aquí puedes hacer llamadas globales si las necesitas
  }
}