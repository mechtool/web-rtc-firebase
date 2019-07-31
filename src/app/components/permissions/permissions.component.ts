import {ChangeDetectorRef, Component} from '@angular/core';
import {MessagingService} from "../../services/messaging.servece";
import {AppContextService} from "../../services/app-context.service";
declare let navigator;
@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css']
})
export class PermissionsComponent  {

    private _descriptorStates;
    public rtcVisible = false;
    public noteVisible = false;
    public permissionsVisible = false;
    public set descriptorsStates(value){
          this._descriptorStates = value;
          this.notificationNote = value[2]['notifications'];
          this.noteVisible = this.descriptorsStates[2]['notifications'].indexOf('prompt') >= 0 || this.descriptorsStates[2]['notifications'].indexOf('denied') >= 0;
          this.rtcVisible = (this.descriptorsStates[0]['camera'].indexOf('prompt') >= 0 || this.descriptorsStates[1]['microphone'].indexOf('prompt') >= 0 )|| (this.descriptorsStates[0]['camera'].indexOf('denied') >= 0 || this.descriptorsStates[1]['microphone'].indexOf('denied') >= 0);
	  this.rtcNote = [this.descriptorsStates[0]['camera'] , this.descriptorsStates[1]['microphone']].find(data => (data === 'denied')) || 'prompt';
    };
    public get descriptorsStates(){
        return this._descriptorStates;
    }
    public notificationNote = 'prompt' ;
    public rtcNote = 'prompt';
    public descriptors = ['camera', 'microphone', 'notifications'];
    constructor(
        private messagingService : MessagingService,
	public changeRef : ChangeDetectorRef,
	public appContext : AppContextService,
    ) {
	this.checkPermissions();
    }
    
    checkComponentVisible(){
        this.permissionsVisible = this.rtcVisible || this.noteVisible;
	this.changeRef.detectChanges();
    }
    
    onNotification(){
        this.messagingService.getPermission().then(permission  => {
	    if (permission === 'denied') {
		this.notificationNote = permission;
		console.log('[Notifications] Разрешение пользователя не получено.');
	    }
	    else if(permission === 'default') {
		console.log('[Notifications] Пользователь закрыл диалог запроса без выбора');
	    }
	    else {
	        console.log('[Notifications] Пользователь выдал разрешение');
	        this.noteVisible = false;
	    }
	    this.checkComponentVisible();
	})
    }
    
    async onWebRtc(){
	await navigator.mediaDevices.getUserMedia({
	    audio: true,
	    video: true,
	}).then(stream => {
	    stream.getTracks().forEach(tr => tr.stop());
	    this.rtcVisible = false;
	}).catch(err => {
	    this.rtcNote = 'denied';
	    this.rtcVisible = true;
	});
	this.checkComponentVisible();
    }
    
    
    async checkPermissions(){
	await Promise.all(this.descriptors.map(desc => navigator.permissions.query({name : desc}))).then(res => {
	    this.descriptorsStates = this.descriptors.map((desc, inx) => {return {[desc] : res[inx].state}});
	});
	
	this.checkComponentVisible();
    }
}
