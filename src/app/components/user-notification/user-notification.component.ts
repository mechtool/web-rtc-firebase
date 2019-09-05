import {ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {AppContextService} from "../../services/app-context.service";

@Component({
  selector: 'app-user-notification',
  templateUrl: './user-notification.component.html',
  styleUrls: ['./user-notification.component.css']
})
export class UserNotificationComponent implements  OnDestroy {
    
    public context ;
    public messId;
    public messageType = 0;
    public hasCancel = true;
    public subscriptions = [];
    @Output() public receive : EventEmitter<any> = new EventEmitter();
    @Output() public cancel : EventEmitter<any> = new EventEmitter() ;
    
    constructor(public changeRef : ChangeDetectorRef){}
    
    onReceive(){
	this.receive.emit(this.messId);
    }

    onCancel(){
	this.cancel.emit(this.messId);
    }
    
    ngOnDestroy(){
	this.subscriptions.forEach(sub => sub.unsubscribe())
    }
    
    
}
