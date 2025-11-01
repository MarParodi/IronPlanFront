import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';


@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  private _router = inject(Router);
  private _cdr = inject(ChangeDetectorRef);

  isLoginPage = false;
  logged = input.required<boolean>();

  ngOnInit(): void {
    this._router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isLoginPage = event.urlAfterRedirects.includes('/auth/login') || event.urlAfterRedirects.includes('/auth/recovery-password');
        this._cdr.markForCheck();
      });

    this.isLoginPage = this._router.url.includes('/auth/login') || this._router.url.includes('/auth/recovery-password');

  }
}
