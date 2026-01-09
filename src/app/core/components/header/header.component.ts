import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  OnDestroy
} from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { AuthService } from '../../../modules/auth/services/auth.service';
import { NotificationService } from '../../../modules/notifications/services/notification.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit, OnDestroy {
  private _tokenSvc = inject(AuthService);
  private _router = inject(Router);
  private _cdr = inject(ChangeDetectorRef);
  private _notificationSvc = inject(NotificationService);
  private _destroy$ = new Subject<void>();

  mobileMenuOpen = false;
  isLoginPage = false;
  isPromotionsPage = false;
  unreadNotifications = 0;

  ngOnInit(): void {
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

    // Cargar el contador inicial
    this._notificationSvc.refreshUnreadCount();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  goBack(): void {
    this._router.navigate(['home']);
  }

  logout(): void {
    this._tokenSvc.logout();
  }
}
