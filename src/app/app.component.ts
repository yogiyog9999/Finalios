import { Component } from '@angular/core';
import { supabase } from './services/supabase.client';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Platform, NavController } from '@ionic/angular';
import { App as CapacitorApp } from '@capacitor/app';

@Component({
  standalone: false,
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private navCtrl: NavController
  ) {
    this.initializeApp();
    this.handleDeepLinks();
  }

  async initializeApp() {
    await this.platform.ready();

    if (this.platform.is('ios')) {
      // 🧩 IMPORTANT: Disable overlay on iOS
      await StatusBar.setOverlaysWebView({ overlay: false });
    } else {
      // ✅ Android overlay is fine
      await StatusBar.setOverlaysWebView({ overlay: true });
    }

    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#4267B2' });

    // Optional: top inset variable
    document.documentElement.style.setProperty('--status-bar-height', 'env(safe-area-inset-top)');

    // ✅ Auth check
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Auth check failed:', error.message);
      this.navCtrl.navigateRoot('/auth/login');
      return;
    }

    this.navCtrl.navigateRoot(user ? '/tabs/dashboard' : '/auth/login');
  }

  handleDeepLinks() {
    CapacitorApp.addListener('appUrlOpen', (data: any) => {
      console.log('Deep link opened:', data.url);
      const url = new URL(data.url.replace('dlist://', 'https://dummy.com/'));
      const hash = url.hash;

      if (url.pathname === '/reset-password' && hash) {
        const queryParams = new URLSearchParams(hash.substring(1));
        const accessToken = queryParams.get('access_token');
        const type = queryParams.get('type');

        if (type === 'recovery' && accessToken) {
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: queryParams.get('refresh_token') || ''
          });
          this.navCtrl.navigateForward('/reset-password');
        }
      }
    });
  }
}
