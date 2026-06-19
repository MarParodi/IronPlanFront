import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  OnDestroy,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { AuthService } from '../../../modules/auth/services/auth.service';
import { UserService } from '../../../modules/user/services/user.service';
import { NotificationService } from '../../../modules/notifications/services/notification.service';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { filter, takeUntil, startWith } from 'rxjs/operators';
import { Subject, interval } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule, ThemeToggleComponent],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit, OnDestroy {
  private _authSvc = inject(AuthService);
  private _userSvc = inject(UserService);
  private _router = inject(Router);
  private _cdr = inject(ChangeDetectorRef);
  private _notificationSvc = inject(NotificationService);
  private _destroy$ = new Subject<void>();
  private _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  mobileMenuOpen = false;
  isLoginPage = false;
  isPromotionsPage = false;
  unreadNotifications = 0;
  showMisGrupos = false;

  ngOnInit(): void {
    if (this._isBrowser && this._authSvc.isLoggedIn) {
      this._userSvc.getMe().subscribe({
        next: () => {
          this.showMisGrupos = true;
          this._cdr.markForCheck();
        },
        error: () => {
          this.showMisGrupos = false;
          this._cdr.markForCheck();
        }
      });
    }
    // Cerrar menú móvil en cambio de ruta
    this._router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.mobileMenuOpen = false;
        this._cdr.markForCheck();
      });

    // Suscribirse al contador de notificaciones no leídas
    this._notificationSvc.unreadCount$
      .pipe(takeUntil(this._destroy$))
      .subscribe(count => {
        this.unreadNotifications = count;
        this._cdr.markForCheck();
      });

    // Cargar el contador inicial y refrescar cada 60s (solo en navegador)
    if (this._isBrowser && this._authSvc.isLoggedIn) {
      interval(60_000)
        .pipe(startWith(0), takeUntil(this._destroy$))
        .subscribe(() => this._notificationSvc.refreshUnreadCount());
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  goBack(): void {
    this._router.navigate(['home']);
  }

  logout(): void {
    this._authSvc.logout();
  }
}
