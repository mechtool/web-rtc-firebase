import {ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {Contact} from "../../classes/Classes";
import {Observable} from "rxjs";
import {DatabaseService} from "../../services/database.service";

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent  {

    @Input() public context : Contact;
    @Input() public menuType : number | boolean = false;
    constructor(private database : DatabaseService) {}
    
    onDelete(){
        this.database.deleteContact(this.context);
    }
    onChange(){
    
    }
    onNewMessage(){
    
    }

}
