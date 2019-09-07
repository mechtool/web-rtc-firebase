import {
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
} from '@angular/core';
import {AppContextService} from "../../services/app-context.service";
import {WebRtcService} from "../../services/web-rtc.service";
import {CommunicationService} from "../../services/communication.service";
import {ContentPageComponent} from "../content-page/content-page.component";
import {BehaviorSubject} from "rxjs";
import {Contact, PcMessage} from "../../classes/Classes";
import {Router} from "@angular/router";

@Component({
  selector: 'app-web-rtc',
  templateUrl: './web-rtc.component.html',
  styleUrls: ['./web-rtc.component.css']
})
export class WebRtcComponent implements OnInit, OnDestroy {
    
    public firstMessageText;
    private _messageType = 0;
    public pcMessage : PcMessage ;
    public selfSrcObject;
    public connecting = false;
    public noPeers = true;//контакты со статусами, позволяющие отправку сообщения
    public subscribes = [];
    public messageGroup;
    public typeIcons = [
        {text : 'message', active : true, tip : 'Текстовое', src : '/content/message/text-message'},
	{text : 'sms', active : false, tip : 'Audio', src : '/content/message/audio-message' },
	{text : 'voice_chat', active : false, tip : 'Video', src : '/content/message/video-message'}
	];
    
    public messageContacts : BehaviorSubject<Contact[]> = new BehaviorSubject([]) ;
    
    public set messageType(type){
         this._messageType = type;
         if(type === 2) {
             setTimeout(()=> {
		 this.contentComp.toolbarProgressVisible = false;
		 this.contentComp.changeRef.detectChanges();
	     }, 500);
	}else {
	     this.contentComp.toolbarProgressVisible = true;
	     this.contentComp.changeRef.detectChanges();
         }
    }
    public get messageType(){
        return this._messageType;
    }
    
    constructor(
        public appContext : AppContextService,
	public webRtcService : WebRtcService,
	public communication : CommunicationService,
	public contentComp : ContentPageComponent,
	public changeRef : ChangeDetectorRef,
	public router : Router,
		) {
        this.appContext.webRtcComponent = this;
	this.pcMessage = this.appContext.webRtcService.pcMessage;
 
	this.subscribes.push(this.communication.base.subscribe((message : any) => {
	    if(message.type === 'new-contacts'){
		let v = this.messageContacts.value;
		message.messType && (this.messageType = message.messType === 'text' ? 0 : message.messType === 'audio' ? 1 : 2);
		(message.contacts as Array<any>).forEach(con => {
		    if(!v.some(c => c.uid === con.uid) || !v.length){
			v.push(this.appContext.contentComp._contacts.find(cont => cont.uid == con.uid) || con) ;
			//*
			this.noPeers = true;
		    }
		}) ;
		this.messageContacts.next(v); //*
		message.complete && message.complete();
	    }
	    this.contentComp.changeRef.detectChanges();
	}));
    }
    
    ngOnInit() {

  }
  
  ngOnDestroy(){
    this.onCloseConnection().then(res => {
	this.appContext.webRtcComponent = undefined;
    	this.appContext.contentComp.checkSideNav() ;
	this.subscribes.forEach(sub => sub.unsubscribe());
    })
  }
  
    isDisabled(){
	return this.messageGroup &&  this.messageGroup.get('textControl').invalid ;
    }
    
    onClickIcon(inx){
        if((!this.typeIcons[inx].active && this.appContext.contentComp.disableButton)){
	    return false;
	}
        //Снимаем активность всех кнопок
	this.typeIcons.forEach(ic => ic.active = false ) ;
        //Устанавливаем активность на нужной кнопке
	this.typeIcons[inx].active = true;
	//Если активированная кнопка не является одной и тойже
	//пробуем закрыть соединение
	if(this.messageType !== inx){
	    this.onCloseConnection();
	    this.messageType = inx;
	    this.router.navigateByUrl(this.typeIcons[inx].src,{ skipLocationChange: true });
	}
    }
    
    onSubmit(event){
        event.type === 'keydown' && event.preventDefault();
        if(this.messageType === 0){
            this.webRtcService.textMessage({initializer : true, desc : {uid : this.appContext.appUser.uid, messageType : 'text', status : 'active'}, contacts : this.appContext.webRtcComponent.messageContacts.value});
        }else{
	    this.webRtcService.startConnection({initializer : true,  desc : {uid : this.appContext.appUser.uid, messageType :  this.messageType === 1 ? 'audio' : 'video', status  : 'active' },  contacts : this.appContext.webRtcComponent.messageContacts.value});
	}
  }
    
    deleteContact(uidArr : string[]){
	let arr = this.messageContacts.value;
	uidArr.forEach(uid =>{
	    let inx = arr.findIndex(cont => {
	        if(cont.uid === uid){
	            cont.checked = false;
	            return true;
		}
	    });
	    if(inx > -1){
		arr.splice(inx, 1) ;
		this.messageContacts.next((arr));
		//снять checkbox контакта в боковой навигации (mat-sidenav)
		this.contentComp.checkSideNav([{uid : uid, checked : false}]) ;
	    }
	});
	this.contentComp.changeRef.detectChanges();
    }
    
    onClickContacts(){
	this.contentComp.onClickMenu();
    }
   async onCloseConnection(){
        let result = await this.webRtcService.checkComponentCollection({mid : '123456', message : 'Закрыть текущее сообщение?'});
	if(result.received) this.webRtcService.closeAllMessages();
    }
}
