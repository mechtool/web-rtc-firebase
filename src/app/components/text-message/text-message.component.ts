import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, ValidatorFn, Validators} from "@angular/forms";
import {BehaviorSubject} from "rxjs";
import {Contact} from "../../classes/Classes";
import {AppContextService} from "../../services/app-context.service";
import {WebRtcComponent} from "../web-rtc/web-rtc.component";

@Component({
  selector: 'app-text-message',
  templateUrl: './text-message.component.html',
  styleUrls: ['./text-message.component.css']
})
export class TextMessageComponent implements OnInit , AfterViewInit{
    
    public heightTextBlock;
    public textMessages = [];
    public messageGroup : FormGroup = new FormGroup({
	textControl : new FormControl('', [Validators.required, this.contactListValidator()]),
    }) ;
    @ViewChild('textBlock', {read : ElementRef, static : false}) public textBlock : ElementRef;
  constructor(
      public appContext : AppContextService,
      public webRtcComp : WebRtcComponent) {
      this.webRtcComp.messageGroup = this.messageGroup;
      this.appContext.textMessageComponent = this;
  }

  ngOnInit() {
  }
    
    contactListValidator(): ValidatorFn {
	return (): {[key: string]: any} | null => {
	    return this.webRtcComp.messageContacts.value.length ? null : {'contactList' : true};
	};
    }
    ngAfterViewInit(){
	this.heightTextBlock = (window.document.body.getBoundingClientRect().height - this.textBlock.nativeElement.getBoundingClientRect().top ) + 'px';
    }

  
}
