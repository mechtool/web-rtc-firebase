import { Component, OnInit } from '@angular/core';
import {AppContextService} from "../../services/app-context.service";

@Component({
  selector: 'app-settings-page',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.css']
})
export class SettingsPageComponent implements OnInit {

    constructor(
      private appContext : AppContextService
  ) { }

  ngOnInit() {
  }
    
    onSingOut(){
	this.appContext.auth.signOut().then(() => {
	    window.location.reload()
	}).catch(function(error) {
	    // An error happened.
	});
    }
}
