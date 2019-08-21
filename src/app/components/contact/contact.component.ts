import {Component, EventEmitter, Input, NgZone, Output} from '@angular/core';
import {Contact} from "../../classes/Classes";
import {DatabaseService} from "../../services/database.service";
import {Router} from "@angular/router";
import {CommunicationService} from "../../services/communication.service";
import {AppComponent} from "../../app.component";
import {AppContextService} from "../../services/app-context.service";

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent  {

    @Input() public context : Contact;
    @Input() public menuType : number | boolean = false;
    constructor(
        private database : DatabaseService,
	private router : Router,
	public zone : NgZone,
	public communication : CommunicationService,
	public appContext : AppContextService) {}
    
    onDelete(type?){
        type || this.database.deleteContact(this.context);
        type === 1 && this.appContext.webRtcComponent.deleteContact(this.context.uid);
    }
    onChange(){
    
    }
    onNewMessage(){
        //Проверить существование экземпляров компонентов сообщений (текстового, аудио, видео)
	//Если не одного из сообщений не существует, то переходин на страницу текстового сообщения
	this.communication.base.next({type : 'new-contacts', contacts : [this.context]}) ;
	this.appContext.webRtcComponent || this.zone.run(() => this.router.navigate(['content', 'message']));
    }
    onChangeCheckbox(check){
        check.checked ? this.onNewMessage(): this.appContext.webRtcComponent.deleteContact(this.context.uid);
        this.appContext.contentComp.changeRef.detectChanges();
    }

}
