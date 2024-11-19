import { Routes } from '@angular/router';
import { MainFrameComponent } from './main-frame/main-frame.component';
import { GuildContentComponent } from './guild-content/guild-content.component';

export const routes: Routes = [
   { path: 'guild/:id', component: GuildContentComponent }
];
