import {Component, EventEmitter, Input, NgZone, OnInit, Output} from '@angular/core';
import {Contact} from "../../classes/Classes";
import {DatabaseService} from "../../services/database.service";
import {Router} from "@angular/router";
import {CommunicationService} from "../../services/communication.service";
import {AppContextService} from "../../services/app-context.service";

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent implements OnInit {
    
    public contactName;
    @Input() public context : Contact;
    @Input() public menuType : number | boolean = false;
    constructor(
        private database : DatabaseService,
	private router : Router,
	public zone : NgZone,
	public communication : CommunicationService,
	public appContext : AppContextService,
	) {}
    
    onDelete(type?){
        type || this.database.deleteContact(this.context);
        type === 1 && this.appContext.webRtcComponent.deleteContact([this.context.uid]);
    }
    onChange(){

    }
    
    ngOnInit(){
	let name = (this.context.name || this.context.displayName || this.context.email || this.context.phoneNumber),
	    num =  parseInt(window.localStorage.getItem('contactSign'));
	this.contactName =  name.substring(0, isNaN(num) ? undefined : num );
	this.contactName += (name.split('').length >  this.contactName.split('').length) ? '...' : '';
    }
    onNewMessage(){
        //Проверить существование экземпляров компонентов сообщений (текстового, аудио, видео)
	//Если не одного из сообщений не существует, то переходин на страницу текстового сообщения
	this.context.checked = true;
	if(!this.appContext.webRtcComponent) {
	    this.zone.run(() => this.router.navigate(['content', 'message'])).then(() => 	this.communication.base.next({type : 'new-contacts', contacts :  [this.context]}))
	}else this.communication.base.next({type : 'new-contacts', contacts :  [this.context]}) ;
    
    }
    onChangeCheckbox(check){
        check.checked ? this.onNewMessage(): (this.appContext.webRtcComponent && this.appContext.webRtcComponent.deleteContact([this.context.uid]));
        this.appContext.contentComp.changeRef.detectChanges();
    }

}
