import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit
} from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { TokenService } from '../../services/token.service';
import { filter } from 'rxjs/operators';
import { input } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  private _tokenSvc = inject(TokenService);
  private _router = inject(Router);
  private _cdr = inject(ChangeDetectorRef);
  logged = input.required<boolean>();
  isLoginPage = false;
  isPromotionsPage = false;

  ngOnInit(): void {
    this._router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isLoginPage = event.urlAfterRedirects.includes('/auth/login') || event.urlAfterRedirects.includes('/auth/recovery-password');
        this._cdr.markForCheck();
      });
    this.isLoginPage = this._router.url.includes('/auth/login') || this._router.url.includes('/auth/recovery-password');

    this._router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isPromotionsPage = event.urlAfterRedirects.includes('/promotions');
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
