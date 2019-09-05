import {ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, NgZone, OnInit} from '@angular/core';
import {OverlayContainer} from "@angular/cdk/overlay";
import {Router} from "@angular/router";
import {CommunicationService} from "./services/communication.service";
import {routerTransition, sideNavListTrigger} from "./animations/animations";
import {environment} from "../environments/environment.prod";

import * as firebase from 'firebase/app'
import 'firebase/auth';
import 'firebase/database';
import 'firebase/messaging'
import {DatabaseService} from "./services/database.service";
import {Contact} from "./classes/Classes";
import {MessagingService} from "./services/messaging.servece";
import {AppContextService} from "./services/app-context.service";
import {WebRtcService} from "./services/web-rtc.service";
import {PwaService} from "./services/pwa.service";

firebase.initializeApp(environment.firebaseConfig);

@Component({
    selector: 'app-root',
    templateUrl : './app.component.html',
    styleUrls: ['./app.component.css'],
    animations : [sideNavListTrigger, routerTransition] ,
    changeDetection : ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit{
	
    public user ;
    public appUser : Contact;
    @HostBinding('class') public componentCssClass;
    
    constructor(
        public changeRef : ChangeDetectorRef,
	public overlay : OverlayContainer,
	public communication : CommunicationService,
	private ngZone : NgZone,
	private router : Router,
	public databaseService : DatabaseService,
	public messagingService : MessagingService,
	public webRtcService : WebRtcService,
    	public appContext : AppContextService,
    ){
        this.appContext.messaging = firebase.messaging();
        this.appContext.auth = firebase.auth();
        this.appContext.database = firebase.database();
        this.appContext.firebase = firebase;
	this.appContext.webRtcService = this.webRtcService;
	this.appContext.auth.onAuthStateChanged(async user => {
            //если пользователь существует, необходимо проверить существования пользователя в базе данных, и если его нет, то создать
	    await this.ngZone.run(() => this.router.navigateByUrl(user ? '/content' : '/authentication'));
	    if(user){
	        this.user = user;
	        //Проверка сети при загрузки приложения. Если при загрузки приложения нет сети,
		//тогда проверка на подключение базы данных оказывается безполезной,
		// тогда проверяем простое подключение навигатора к сети
		window.addEventListener('offline', (e) => {
		    console.log('offline');
		    this.showUserNotification({type : 'offline'});
		});
/*		window.addEventListener('online', (e) => {
		    console.log('online');
		    this.showUserNotification({type : 'online'})
		});*/
		//Проверка существования пользователя в базе данных
	        this.databaseService.checkDatabaseUser(user).subscribe(contact => {
	            //Инициализация пользователя приложения
		    this.appContext.appUser = this.appUser = contact;
		    //Отслеживание активности сетевого соединения и установка статуса
		    this.appContext.database.ref(".info/connected").on("value", (snap) => {
		        let val = snap.val();
			this.appUser.statusColor = val ? this.webRtcService.statusColors['open'] : this.webRtcService.statusColors['close'];
			//Обновление интерфейса
			this.changeRef.detectChanges();
		    });
		    this.messagingService.initialiseMessaging();
		    this.webRtcService.initialize().then(resp => {
			console.log('web-rtc сервис инициализирован!');
		    });
		    this.changeRef.detectChanges();
		});
	    }
	}) ;
        
        this.communication.base.subscribe(message => {
             if(message.type == 'colorTheme'){
                 this.setAppTheme(message.selector)
	     }
	});
    }
    
    showUserNotification(options){
        switch (options.type) {
	    case 'offline' : this.webRtcService.showUserNotification({messageType : 1, sender : {message : 'Нет соединения.', name : 'Application', photoURL : '/assets/app-shell/mess-00.png', imgColor : 'transparent'}}).then(res => {
	    }) ;
	        break;
	    case 'online': this.webRtcService.showUserNotification({messageType : 1, sender : {message : 'Есть соединение.', name : 'Application', photoURL : '/assets/app-shell/mess-00.png', imgColor : 'transparent'}}).then(res => {
	    }) ;
	    	break;
	}
    }
    
    setAppTheme(selector){
	this.componentCssClass = selector;
	this.overlay.getContainerElement().classList.add(this.componentCssClass);
	this.changeRef.markForCheck();
    }
    
    getState(outlet){
	return outlet.activatedRouteData.type;
    }
    
    ngOnInit(){
        let selector = window.localStorage.getItem('colorTheme');
	window.localStorage.setItem('usePushNotification', window.localStorage.getItem('usePushNotification') || 'true');
	window.localStorage.setItem('saveMessages', window.localStorage.getItem('saveMessages') || 'false');
	window.localStorage.setItem('contactSign', window.localStorage.getItem('contactSign') || '10 символов');
	//Установка настроек значений по умолчанию
	window.localStorage.setItem('timeout', window.localStorage.getItem('timeout') || '30 секунд');
        if(!selector){
	    window.localStorage.setItem('colorTheme', selector = 'second-theme');
	}
	this.setAppTheme(selector) ;
    }
}
