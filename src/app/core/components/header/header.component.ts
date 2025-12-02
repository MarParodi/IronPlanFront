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
import { input } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  private _tokenSvc = inject(AuthService);
  private _router = inject(Router);
  private _cdr = inject(ChangeDetectorRef);

  isLoginPage = false;
  isPromotionsPage = false;

  ngOnInit(): void {
   

  }

  goBack(): void {
    this._router.navigate(['home']);
  }

  logout(): void {
    this._tokenSvc.logout();
  }
}
