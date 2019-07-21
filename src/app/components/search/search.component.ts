import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {map} from "rxjs/operators";
import {BehaviorSubject, Observable} from "rxjs";
import {Contact} from "../../classes/Classes";
import {ContentPageComponent} from "../content-page/content-page.component";
import {DatabaseService} from "../../services/database.service";
import {AppContextService} from "../../services/app-context.service";

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {

    public users : BehaviorSubject<Contact[]> ;
    public searchGroup = new FormGroup({
	searchControl : new FormControl('', [Validators.required])
    }) ;
    constructor(
        private contentComp : ContentPageComponent,
	private database : DatabaseService,
	private appContext : AppContextService,
    ) {
	this.users = this.contentComp.users;
    }
    
    onSelectContact(contact){
        this.database.setContact(contact).then(()=>{
            //сообщение об успешной записи контакта для пользователя
	    console.log('Контакт успешно записан!')  ;
	});
    
    }
    
    displayFn(value) : string{
	return value.name || value.displayName || value.email || value.phone;
    }
    
    ngOnInit() {
	this.searchGroup.get('searchControl').valueChanges.subscribe(value => {
	    this.users.next(this.contentComp._users.filter(user=> {
		return (user.name.indexOf(value) === 0 || user.displayName.indexOf(value) === 0 || user.email.indexOf(value) === 0|| user.phoneNumber.indexOf(value) === 0)}));
	})
    }

}
