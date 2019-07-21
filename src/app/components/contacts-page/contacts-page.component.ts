import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {ContentPageComponent} from "../content-page/content-page.component";
import {Contact} from "../../classes/Classes";
import {BehaviorSubject} from "rxjs";

@Component({
  selector: 'app-contacts-page',
  templateUrl: './contacts-page.component.html',
  styleUrls: ['./contacts-page.component.css']
})
export class ContactsPageComponent implements OnInit {

    public contacts : BehaviorSubject<Contact[]> ;

    constructor(
        public contentComp : ContentPageComponent
		) {
        this.contacts = this.contentComp.contacts;
    }
  
    ngOnInit() {

    }
}
