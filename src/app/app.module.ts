import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MaterialModule} from "./modules/material/material.module";
import {CommunicationService} from "./services/communication.service";
import { AuthPageComponent } from './components/auth-page/auth-page.component';
import { ContentPageComponent } from './components/content-page/content-page.component';
import { SettingsPageComponent } from './components/settings-page/settings-page.component';
import { MessagesPageComponent } from './components/messages-page/messages-page.component';
import { ContactsPageComponent } from './components/contacts-page/contacts-page.component';
import {RouterModule} from "@angular/router";
import {ReactiveFormsModule, FormsModule} from "@angular/forms";
import {DatabaseService} from "./services/database.service";
import { PermissionsComponent } from './components/permissions/permissions.component';
import {MessagingService} from "./services/messaging.servece";
import {HttpClientModule} from "@angular/common/http";
import { ContactComponent } from './components/contact/contact.component';
import { ColorThemeComponent } from './components/color-theme/color-theme.component';
import {AppContextService} from "./services/app-context.service";
import {SearchComponent} from "./components/search/search.component";
import { MessagePageComponent } from './components/message-page/message-page.component';
import { WebRtcComponent } from './components/web-rtc/web-rtc.component';
import {WebRtcService} from "./services/web-rtc.service";
import { UserNotificationComponent } from './components/user-notification/user-notification.component';
import {NotificationService} from "./services/notification.service";
import { MessageItemComponent } from './components/message-item/message-item.component';

@NgModule({
    declarations: [
	AppComponent,
	AuthPageComponent,
	ContentPageComponent,
	SettingsPageComponent,
	MessagesPageComponent,
	ContactsPageComponent,
	PermissionsComponent,
	ContactComponent,
	ColorThemeComponent,
	SearchComponent,
	MessagePageComponent,
	WebRtcComponent,
	UserNotificationComponent,
	MessageItemComponent,
    ],
    imports: [
	BrowserModule,
	BrowserAnimationsModule,
	AppRoutingModule,
	ReactiveFormsModule,
	HttpClientModule,
	FormsModule,
	ServiceWorkerModule.register('firebase-messaging-sw.js', {enabled: environment.production}),
	RouterModule,
	MaterialModule,
    ],
  providers: [
      CommunicationService ,
      DatabaseService,
      MessagingService,
      AppContextService,
      WebRtcService,
      NotificationService
  ],
    entryComponents : [UserNotificationComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }
