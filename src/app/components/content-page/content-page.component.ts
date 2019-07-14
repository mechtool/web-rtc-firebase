import {ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {AppComponent} from "../../app.component";
import {routerTransition, sideNavListTrigger} from "../../animations/animations";
import {NavigationCancel, NavigationEnd, NavigationStart, Router} from "@angular/router";
import {MessagingService} from "../../services/messaging.servece";

@Component({
    selector: 'app-content-page',
    templateUrl: './content-page.component.html',
    styleUrls: ['./content-page.component.css'],
    animations : [sideNavListTrigger, routerTransition]
})
export class ContentPageComponent implements OnInit, OnDestroy {

    public subscribes = [];
    public opened = true;
    public progressVisible = false;
    public contentButtons = [
	{text : 'Сообщения', link : '/content/messages'},
	{text : 'Контакты', link : '/content/contacts'},
    ];
    @HostListener('window:unload') onUnLoad(){
    //При закрытии окна, выполняется выход с сайта
    //	this.authService.singOut();
    }
    constructor(
        public appComp : AppComponent,
	public router : Router,
	public changeRef : ChangeDetectorRef,
	public messaging : MessagingService,
    ) {
        //Подписка на события роутера начала и окончания маршрутизации
	this.subscribes.push(this.router.events.subscribe(event => {
	    if (event instanceof NavigationStart || event instanceof NavigationEnd || event instanceof NavigationCancel) {
		this.progressVisible = event instanceof NavigationStart;
		this.changeRef.markForCheck();
	    }
	})) ;
    }
    
    ngOnInit() {
    }
    
    ngOnDestroy(){
        this.subscribes.forEach(sub => sub.unsubscribe());
    }
    
    onClickSettings(){
	this.messaging.sendMessage();
    }
    onClickMenu(){
      this.opened = !this.opened;
    }
    getState(outlet){
	return outlet.activatedRouteData.type;
    }

}
