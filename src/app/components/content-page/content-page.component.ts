import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ComponentFactoryResolver,
    ElementRef,
    HostListener,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef
} from '@angular/core';
import {AppComponent} from "../../app.component";
import {routerTransition, sideNavListTrigger} from "../../animations/animations";
import {NavigationCancel, NavigationEnd, NavigationStart, Router } from "@angular/router";
import {MessagingService} from "../../services/messaging.servece";
import {AppContextService} from "../../services/app-context.service";
import {DatabaseService} from "../../services/database.service";
import {Contact} from "../../classes/Classes";
import {BehaviorSubject } from "rxjs";
import {BreakpointObserver} from "@angular/cdk/layout";
import {ContactComponent} from "../contact/contact.component";

@Component({
    selector: 'app-content-page',
    templateUrl: './content-page.component.html',
    styleUrls: ['./content-page.component.css'],
    animations : [sideNavListTrigger, routerTransition]
})
export class ContentPageComponent implements OnInit, OnDestroy {
    
    public low599;
    public _users = [];
    public _messages = [];
    public _contacts = [];
    public subscriptions = [];
    public opened = false;
    public disableButton = false;// отключение активности кнопок при старте нового сообщения
    public progressVisible = false;
    public toolbarProgressVisible = true;
    public sideNavMode : 'over' | 'push' | 'side' = 'side' ;
    public contacts : BehaviorSubject<Contact[]> = new BehaviorSubject([]);
    public messages : BehaviorSubject<Contact[]> = new BehaviorSubject([]);
    public users : BehaviorSubject<any> = new BehaviorSubject([]);
    public contentButtons = [
	{text : 'Сообщения', link : '/content/messages', icon : 'sms_failed'},
	{text : 'Контакты', link : '/content/contacts', icon : 'people'},  //how_to_reg   recent_actors
    ];
    public hardware = {videoInputs : [], audioInputs : [], audioOutputs : [], videoInputSelected : JSON.parse(window.localStorage.getItem('videoInput')), audioInputSelected : JSON.parse(window.localStorage.getItem('audioInput')) , audioOutputSelected : JSON.parse(window.localStorage.getItem('audioOutput'))  };
    
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
	public appContext : AppContextService,
	public database : DatabaseService,
	public media: BreakpointObserver,
	public factoryResolver : ComponentFactoryResolver,
    ) {
        //передача контекста компонента
        this.appContext.contentComp = this;
        //Установка настроек значений по умолчанию
	window.localStorage.setItem('timeout', window.localStorage.getItem('timeout') ? window.localStorage.getItem('timeout') : '2');
	//Подписка на события роутера начала и окончания маршрутизации
	this.subscriptions.push(this.router.events.subscribe(event => {
	    if (event instanceof NavigationStart || event instanceof NavigationEnd || event instanceof NavigationCancel) {
		this.progressVisible = event instanceof NavigationStart;
		this.changeRef.markForCheck();
	    }
	})) ;
	this.subscriptions.push(this.media.observe('(max-width: 599px)').subscribe((sub) => {  //наблюдение за медиаточкой
	    this.low599 = sub.matches;
	    this.sideNavMode = (sub.matches ? 'over' : 'side');
	    this.changeRef.markForCheck();
	}));
 //------------------------область формирования аппаратных средств------------------------------------------------
	//получаем все устройства ввода/вывода в os
	navigator.mediaDevices.enumerateDevices().then(this.gotDevices.bind(this)).catch(this.handleError);
    }
    
    handleError(){
	//обработка ошибок получения устройств
	
    }
    
    checkSideNav(option){
	 let cont = this.contacts.value.find(cont  => cont.uid === option.uid);
	 cont && (cont.checked = option.checked);
	 this.changeRef.detectChanges();
    }
    
    gotDevices(deviceInfos) {
	let devices = {"audioinput" : "микрофон", "audiooutput" : "аудиовыход", "videoinput" : "камера"};
	//получаем все устройства
	for (let i = 0; i !== deviceInfos.length; ++i) {
	    const deviceInfo = deviceInfos[i];
	    if (deviceInfo.kind === 'audioinput') {
		let text = setText.bind(this, deviceInfo.kind, deviceInfo.label, this.hardware.audioInputs)();
		checkArray(text, this.hardware.audioInputs) || this.hardware.audioInputs.push({text, deviceInfo});
	    } else if (deviceInfo.kind === 'audiooutput') {
		let text = setText.bind(this, deviceInfo.kind, deviceInfo.label, this.hardware.audioOutputs)();
		checkArray(text, this.hardware.audioOutputs) ||  this.hardware.audioOutputs.push({text,  deviceInfo});
	    } else if (deviceInfo.kind === 'videoinput') {
		let text = setText.bind(this, deviceInfo.kind, deviceInfo.label, this.hardware.videoInputs)();
		checkArray(text, this.hardware.videoInputs) || this.hardware.videoInputs.push({text, deviceInfo});
	    } else {
		console.log('Иной тип источника / устройста : ', deviceInfo);
	    }
	}
	//Установка первоначальных значений в элементах mat-select
	this.hardware.videoInputSelected = this.hardware.videoInputSelected || this.hardware.videoInputs.length ? this.hardware.videoInputs[0] : null;
	this.hardware.audioInputSelected = this.hardware.audioInputSelected || this.hardware.audioInputs.length ? this.hardware.audioInputs[0] : null;
	this.hardware.audioOutputSelected = this.hardware.audioOutputSelected || this.hardware.audioOutputs.length ? this.hardware.audioOutputs[0] : null;
	 //вспомогательные функции
	function checkArray(text, array) {
/*	    if(array.length){
		return array.some(item => item.text === text);
	    }else return false;*/
		return false;
	}
	function setText(type, label, array) {
	    return  label ? label.substr(label.lastIndexOf('-') + 1).trim() : (devices[type] + ` ${array.length + 1}`)
	}
//--------------------конец области формирования аппаратных средств------------------------------------------------------------
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
    
    onClickMenu(){
      this.opened = !this.opened;
      this.changeRef.detectChanges();
    }
    getState(outlet){
	return outlet.activatedRouteData.type;
    }

}
