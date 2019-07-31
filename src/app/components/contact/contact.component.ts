import {Component, EventEmitter, Input, NgZone, Output} from '@angular/core';
import {Contact} from "../../classes/Classes";
import {DatabaseService} from "../../services/database.service";
import {Router} from "@angular/router";
import {CommunicationService} from "../../services/communication.service";

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent  {

    @Input() public context : Contact;
    @Input() public menuType : number | boolean = false;
    @Output() public deletedFromMessage : EventEmitter<any> = new EventEmitter();
    constructor(
        private database : DatabaseService,
	private router : Router,
	public zone : NgZone,
	public communication : CommunicationService) {}
    
    onDelete(type?){
        type || this.database.deleteContact(this.context);
        type === 1 && this.deletedFromMessage.emit(this.context.uid);
    }
    onChange(){
    
    }
    onNewMessage(){
        this.zone.run(() => this.router.navigate(['content', 'message'])).then(res => {
	    this.communication.base.next({type : 'new-contacts', contacts : [this.context]}) ;
	});
    
    }

}
