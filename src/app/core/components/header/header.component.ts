import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit
} from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { AuthService } from '../../../modules/auth/services/auth.service';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  private _tokenSvc = inject(AuthService);
  private _router = inject(Router);
  private _cdr = inject(ChangeDetectorRef);

  mobileMenuOpen = false;
  isLoginPage = false;
  isPromotionsPage = false;

  ngOnInit(): void {
    // Cerrar menú móvil en cambio de ruta
    this._router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.mobileMenuOpen = false;
        this._cdr.markForCheck();
      });
  }

  goBack(): void {
    this._router.navigate(['home']);
  }

  logout(): void {
    this._tokenSvc.logout();
  }
}
