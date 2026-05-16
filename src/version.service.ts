import { Injectable } from '@angular/core';
import { catchError, map, of, from, switchMap } from 'rxjs';
import Swal from 'sweetalert2';
import { LIB_VERSION } from './version';

@Injectable({
  providedIn: 'root'
})
export class VersionService {
  readonly currentVersion = LIB_VERSION;
  private readonly registryUrl = 'https://registry.npmjs.org/ngx-email-builder/latest';

  checkVersion(): void {
    this.getLatestVersion().subscribe(latestVersion => {
      if (latestVersion && this.isNewer(latestVersion, this.currentVersion)) {
        this.showUpdateWarning(latestVersion);
      }
    });
  }

  private getLatestVersion() {
    // Use native fetch only to avoid HttpClient CORS/interceptor issues
    return from(fetch(this.registryUrl)).pipe(
      switchMap(res => res.ok ? from(res.json()) : of(null)),
      map((res: any) => res?.version),
      catchError(() => of(null))
    );
  }

  private isNewer(latest: string, current: string): boolean {
    const l = latest.split('.').map(Number);
    const c = current.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (l[i] > c[i]) return true;
      if (l[i] < c[i]) return false;
    }
    return false;
  }

  private showUpdateWarning(latestVersion: string): void {
    Swal.fire({
      title: 'Update Available!',
      html: `A newer version (v${latestVersion}) of <b>ngx-email-builder</b> is available.<br>Current version: v${this.currentVersion}`,
      icon: 'info',
      confirmButtonText: 'Upgrade Now',
      showCancelButton: true,
      cancelButtonText: 'Later',
      confirmButtonColor: '#1167ff',
      cancelButtonColor: '#64748b',
      background: '#111c2e',
      color: '#ffffff'
    }).then((result) => {
      if (result.isConfirmed) {
        window.open('https://github.com/jd-ashish/ngx-email-builder', '_blank');
      }
    });
  }
}
