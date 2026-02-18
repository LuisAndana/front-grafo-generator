import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { App } from './app/app';

export default () => bootstrapApplication(App, {
  providers: [
    provideHttpClient(withFetch())
  ]
});