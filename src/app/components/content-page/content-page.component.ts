import {ChangeDetectorRef, Component, ComponentFactoryResolver, HostListener, OnDestroy, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {AppComponent} from "../../app.component";
import {routerTransition, sideNavListTrigger} from "../../animations/animations";
import {NavigationCancel, NavigationEnd, NavigationStart, Router } from "@angular/router";
import {MessagingService} from "../../services/messaging.servece";
import {AppContextService} from "../../services/app-context.service";
import {DatabaseService} from "../../services/database.service";
import {Contact} from "../../classes/Classes";
import {BehaviorSubject } from "rxjs";
import {BreakpointObserver} from "@angular/cdk/layout";
import {WebRtcService} from "../../services/web-rtc.service";

@Component({
    selector: 'app-content-page',
    templateUrl: './content-page.component.html',
    styleUrls: ['./content-page.component.css'],
    animations : [sideNavListTrigger, routerTransition]
})
export class ContentPageComponent implements OnInit, OnDestroy {

    public _users = [];
    public _messages = [];
    public _contacts = [];
    public subscriptions = [];
    public opened = false;
    public progressVisible = false;
    public sideNavMode : 'over' | 'push' | 'side' = 'side' ;
    public contacts : BehaviorSubject<Contact[]> = new BehaviorSubject([]);
    public messages : BehaviorSubject<Contact[]> = new BehaviorSubject([]);
    public users : BehaviorSubject<any> = new BehaviorSubject([]);
    public contentButtons = [
	{text : 'Сообщения', link : '/content/messages'},
	{text : 'Контакты', link : '/content/contacts'},
    ];
    @ViewChild('userNotificationView', {read : ViewContainerRef, static: true}) public notificationView : ViewContainerRef;
    @HostListener('window:unload') onUnLoad(){
    //При закрытии окна, выполняется выход с сайта
    //	this.authService.singOut();
    }
    constructor(
        public appComp : AppComponent,
	public router : Router,
	public changeRef : ChangeDetectorRef,
	public messaging : MessagingService,
	private appContext : AppContextService,
	public database : DatabaseService,
	private media: BreakpointObserver,
	public factoryResolver : ComponentFactoryResolver,
    ) {
    
        this.appContext.contentComp = this;
	//Подписка на события роутера начала и окончания маршрутизации
	this.subscriptions.push(this.router.events.subscribe(event => {
	    if (event instanceof NavigationStart || event instanceof NavigationEnd || event instanceof NavigationCancel) {
		this.progressVisible = event instanceof NavigationStart;
		this.changeRef.markForCheck();
	    }
	})) ;
	this.subscriptions.push(this.media.observe('(max-width: 599px)').subscribe((sub) => {  //наблюдение за медиаточкой
	    this.sideNavMode = (sub.matches ? 'over' : 'side');
	   // this.opened = !sub.matches ;
	    this.changeRef.markForCheck();
	}));
	
    }
    
    ngOnInit() {
         //Инициализация переменных контекста
	this.appContext.notificationView = this.notificationView ;
	this.appContext.contentResolver = this.factoryResolver;
	//Получение всех  пользователей для модуля контактов
	this.database.getDatabaseRef('users/').on('value', (snap => {
	    let v = snap.val();
	    this._users = v ? Object.keys(v).filter(uid => uid !== this.appContext.auth.currentUser.uid).map(key => v[key]) : [];
	    this.users.next(this._users);
	    this.changeRef.detectChanges();
	}));
 
	this.database.getDatabaseRef('messages/' + this.appContext.auth.currentUser.uid).on('value', (snap => {
	    let v = snap.val();
	    this._messages = v ? Object.keys(v).map(key => v[key]) : [];
	    this.messages.next(this._messages);
	    this.changeRef.detectChanges();
	    
	})) ;
 
	this.database.getDatabaseRef('contacts/' + this.appContext.auth.currentUser.uid).on('value', (snap => {
	    let v = snap.val();
	    this._contacts = v ? Object.keys(v).map(key => v[key]) : [];
	    this.contacts.next(this._contacts);
	    this.changeRef.detectChanges();
	}))
    }
    
    ngOnDestroy(){
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }
    
    onClickSettings(){
	
    }
    onClickMenu(){
      this.opened = !this.opened;
      this.changeRef.detectChanges();
    }
    getState(outlet){
	return outlet.activatedRouteData.type;
    }

}
