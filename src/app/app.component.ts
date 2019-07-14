import {ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, NgZone, OnInit} from '@angular/core';
import {OverlayContainer} from "@angular/cdk/overlay";
import {Router} from "@angular/router";
import {CommunicationService} from "./services/communication.service";
import {routerTransition, sideNavListTrigger} from "./animations/animations";
import {environment} from "../environments/environment.prod";

import * as firebase from 'firebase/app'
import 'firebase/auth';
import 'firebase/database';
import {DatabaseService} from "./services/database.service";
import {Contact} from "./classes/Classes";

firebase.initializeApp(environment.firebaseConfig);


@Component({
    selector: 'app-root',
    templateUrl : './app.component.html',
    styleUrls: ['./app.component.css'],
    animations : [sideNavListTrigger, routerTransition] ,
    changeDetection : ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit{
	
    public auth;
    public database;
    public firebase;
    public user;
    public appUser : Contact;
    @HostBinding('class') public componentCssClass;
    
    constructor(
        public changeRef : ChangeDetectorRef,
	public overlay : OverlayContainer,
	public communication : CommunicationService,
	private ngZone : NgZone,
	private router : Router,
	public databaseService : DatabaseService,
    ){
        this.firebase = firebase;
        this.auth = firebase.auth();
        this.database = firebase.database();
        this.databaseService.database = this.database;
        this.auth.onAuthStateChanged(async user => {
            //если пользователь существует, необходимо проверить существования пользователя в базе данных, и если его нет, то создать
	    await this.ngZone.run(() => this.router.navigateByUrl(user ? '/content' : '/authentication'));
	    if(user){
	        this.user = user;
	        this.appUser = await this.databaseService.checkDatabaseUser(user) ;
	    }
	}) ;
        
        this.communication.subject.subscribe(message => {
             if(message.type == 'colorTheme'){
                 this.setAppTheme(message.selector)
	     }
	})
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
	this.setAppTheme(window.localStorage.getItem('colorTheme') || 'second-theme') ;
    }
}
