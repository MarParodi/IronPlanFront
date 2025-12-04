import { Component, inject } from '@angular/core';
import { SpinnerService } from './services/spinner.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-spinner',
  template: `
    <div class="overlay" *ngIf="isLoading$ | async">
      <img src="assets/Logo.png" alt="spinner" />
    </div>
  `,
  styleUrls: ['./spinner.component.css'],
})
export class SpinnerComponent {
  private _spinnerService = inject(SpinnerService);
  isLoading$ = this._spinnerService.isLoading$;


  //commit de prueba

}