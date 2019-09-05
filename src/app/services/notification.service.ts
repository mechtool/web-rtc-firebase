import {ComponentRef, Injectable} from '@angular/core';
import {UserNotificationComponent} from "../components/user-notification/user-notification.component";
import {AppContextService} from "./app-context.service";

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
    
    public userNoteSubscriptions = [];
    
    constructor(
        public appContext : AppContextService,
	) { }
    
    showUserNotification(payload) : ComponentRef<UserNotificationComponent>{
	let item = {messId :  payload.messId, componentRef : this.appContext.notificationView.createComponent(this.appContext.contentResolver.resolveComponentFactory(UserNotificationComponent))};
	let instance = item.componentRef.instance;
	instance.messageType = typeof payload.messageType == 'number' ?  payload.messageType : 0;
	instance.context = payload.sender;
	instance.hasCancel = payload.hasCancel instanceof Boolean ? payload.hasCancel : true;
	instance.messId = payload.messId;
	this.userNoteSubscriptions.push(item);
	this.appContext.contentComp.changeRef.detectChanges();
	return item.componentRef;
    }
    deleteNotification(messId){
	let res = this.userNoteSubscriptions.find(sn => sn.messId === messId);
	if(res){
	    res.componentRef.destroy();
	    this.userNoteSubscriptions.splice(this.userNoteSubscriptions.indexOf(res), 1);
	}
	this.appContext.contentComp.changeRef.detectChanges();
    }
}
