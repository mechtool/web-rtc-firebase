import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, ValidatorFn, Validators} from "@angular/forms";
import {AppContextService} from "../../services/app-context.service";
import {WebRtcService} from "../../services/web-rtc.service";
import {CommunicationService} from "../../services/communication.service";
import {ContentPageComponent} from "../content-page/content-page.component";
import {BehaviorSubject} from "rxjs";
import {Contact, PcMessage} from "../../classes/Classes";
import {filter} from "rxjs/operators";

@Component({
  selector: 'app-web-rtc',
  templateUrl: './web-rtc.component.html',
  styleUrls: ['./web-rtc.component.css']
})
export class WebRtcComponent implements OnInit, OnDestroy {
    
    public connecting = false;
    public noPeers = true;
    public subscribes = [];
    public textMessages = [];
    public messageType = 0;
    public typeIcons = [
        {text : 'message', active : 'active', tip : 'Текстовое'},
	{text : 'sms', active : false, tip : 'Audio' },
	{text : 'voice_chat', active : false, tip : 'Video'}
	];
    public pcMessage = new PcMessage();
    public messageContacts : BehaviorSubject<Contact[]> = new BehaviorSubject([]) ;
    public messageGroup : FormGroup = new FormGroup({
	textControl : new FormControl('', [Validators.required, this.contactListValidator()]),
    }) ;
    constructor(
        public appContext : AppContextService,
	public webRtcService : WebRtcService,
	public communication : CommunicationService,
	public contentComp : ContentPageComponent,
	public changeRef : ChangeDetectorRef,
		) {
        this.appContext.webRtcComponent = this;
        this.webRtcService.pcMessage = this.pcMessage;
    }

  ngOnInit() {
      this.subscribes.push(this.communication.base.subscribe((message : any) => {
	  if(message.type === 'new-contacts'){
	      let v = this.messageContacts.value;
	      (message.contacts as Array<any>).forEach(con => {
		  if(!v.some(c => c.uid === con.uid) || !v.length){
		      v.push(this.appContext.contentComp._contacts.find(cont => cont.uid == con.uid) || con) ;
		      this.messageContacts.next(v);
		  }
	      }) ;
	      message.complete && message.complete();
	  }
	  this.contentComp.changeRef.detectChanges();
      }));
  }
  
  ngOnDestroy(){
    this.onCloseConnection();
    this.subscribes.forEach(sub => sub.unsubscribe());
  }
  
    contactListValidator(): ValidatorFn {
	return (): {[key: string]: any} | null => {
	    return this.messageContacts.value.length ? null : {'contactList' : true};
	};
    }

    onSubmit(event){
        event.type === 'keydown' && event.preventDefault();
        this.webRtcService.startConnection({initializer : true, messageType : 'text'});
  }
  
  onClickIcon(inx){
      this.typeIcons.forEach((ic) => {
	  ic.active = false ;
      }) ;
      this.typeIcons[inx].active = true;
      this.messageType = inx;
    
    
  }
    
    deleteContact(uid){
	let arr = this.messageContacts.value;
	arr.splice(arr.findIndex(cont => cont.uid === uid), 1) ;
	this.messageContacts.next(arr);
	this.contentComp.changeRef.detectChanges();
    }
    
    onClickContacts(){
	this.contentComp.onClickMenu();
    }
    onCloseConnection(){
        this.webRtcService.closeAllMessages();
    }

}
