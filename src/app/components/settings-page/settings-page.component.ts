import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AppContextService} from "../../services/app-context.service";
import {MatSelect, MatSlideToggle} from "@angular/material";
import {FormControl} from "@angular/forms";

@Component({
  selector: 'app-settings-page',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.css']
})
export class SettingsPageComponent implements OnInit, OnDestroy{
    
    public hardware = this.appContext.contentComp.hardware;
    public timeout = ['30', '60', '90', '120', '180', '210'];
    public timeoutControl = new FormControl(window.localStorage.getItem('timeout') || '30');
    @ViewChild('saveMessages', {read : MatSlideToggle, static : true}) public saveMessagesToggle : MatSlideToggle;
    
    constructor(
      public appContext : AppContextService,
      public changeRef : ChangeDetectorRef,
  ) {}

    ngOnDestroy(){
	window.localStorage.setItem('videoInput', JSON.stringify(this.hardware.videoInputSelected)) ;
	window.localStorage.setItem('audioInput', JSON.stringify(this.hardware.audioInputSelected)) ;
	window.localStorage.setItem('audioOutput', JSON.stringify(this.hardware.audioOutputSelected)) ;
    }
    
  ngOnInit() {
        this.saveMessagesToggle.checked = window.localStorage.getItem('saveMessages') === 'true';
    }
    onInstallScreen(addScreen){//активация кнопки установки приложение на экран устройства
	if(addScreen.disable || this.appContext.beforeInstallPromptEvent){
	    this.appContext.beforeInstallPromptEvent.prompt();
	}
    }
  
    onChangeMessageToggle($event){
        window.localStorage.setItem('saveMessages', $event.checked);
    }
  
    onChangeSelect(event){
     window.localStorage.setItem('timeout', event.value);
}
    onSingOut(){
/*	this.appContext.auth.signOut().then(() => {
	    window.location.reload()
	}).catch(function(error) {
	    // An error happened.
	});*/
    }
}
