import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {ServiceWorkerModule, SwUpdate} from '@angular/service-worker';
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
import { WebRtcComponent } from './components/web-rtc/web-rtc.component';
import {WebRtcService} from "./services/web-rtc.service";
import { UserNotificationComponent } from './components/user-notification/user-notification.component';
import {NotificationService} from "./services/notification.service";
import { MessageItemComponent } from './components/message-item/message-item.component';
import {PwaService} from "./services/pwa.service";
import {environment} from "../environments/environment";
import { TextMessageComponent } from './components/text-message/text-message.component';
import { VideoMessageComponent } from './components/video-message/video-message.component';
import { AudioMessageComponent } from './components/audio-message/audio-message.component';

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
	WebRtcComponent,
	UserNotificationComponent,
	MessageItemComponent,
	TextMessageComponent,
	VideoMessageComponent,
	AudioMessageComponent,
    ],
    imports: [
	BrowserModule,
	BrowserAnimationsModule,
	AppRoutingModule,
	ReactiveFormsModule,
	HttpClientModule,
	FormsModule,
	//ServiceWorkerModule.register('firebase-messaging-sw.js', {enabled: environment.production, scope : '/'}),
	RouterModule,
	MaterialModule,
    ],
  providers: [
      CommunicationService ,
      DatabaseService,
      MessagingService,
      AppContextService,
      WebRtcService,
      NotificationService,
  ],
    entryComponents : [UserNotificationComponent],
  bootstrap: [AppComponent]
})
export class AppModule {
	constructor(public appContext : AppContextService){
	    if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register('/firebase-messaging-sw.js', {scope: '/'})  ;
		//Обработка события установки приложения на экран устройства
		window["onbeforeinstallprompt"] = (beforeInstallPromptEvent) => {
		    //Управление переходит в этот обработчик, если приложение еще не установлено (каждый раз)
		    //и не переходит, когда приложение уже установлено
		    this.appContext.installScreenButton = false;
		    beforeInstallPromptEvent.preventDefault(); // Предотвратить немедленный запуск отображения диалога
		    this.appContext.beforeInstallPromptEvent = beforeInstallPromptEvent;
		};
		//прослушивание события 'appinstall' для определения установки приложения на экран устройства
		window["onappinstalled"] = (evt) => {
		    //Управление переходит в этот обработчик сразу (next tick) после принятия
		    //предложения об установки приложения один раз и больще никогда не переходит.
		    //приложение уже установлено на экран устройства
		    this.appContext.installScreenButton = true;
		};
	    }
	}
}
//
