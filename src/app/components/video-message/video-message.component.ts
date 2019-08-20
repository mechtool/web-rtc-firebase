import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild} from '@angular/core';
import {PcMessage} from "../../classes/Classes";
import {WebRtcService} from "../../services/web-rtc.service";
import {BehaviorSubject} from "rxjs";
import {WebRtcComponent} from "../web-rtc/web-rtc.component";
import {AppContextService} from "../../services/app-context.service";

@Component({
  selector: 'app-video-message',
  templateUrl: './video-message.component.html',
  styleUrls: ['./video-message.component.css']
})
export class VideoMessageComponent implements OnInit, AfterViewInit, OnDestroy {
    
    public pcMessage ;
    public messageContacts : BehaviorSubject<any>;
    public toolbarButtons =[
	{className : 'menu-button', text : 'menu' , listener : this.onMenuClick.bind(this)},
	{className : 'videocam-toggle-button', text : 'videocam' , listener : this.onVideoToggle.bind(this)},
	{className : 'microphone-toggle-button', text : 'mic_none' , listener : this.onPhoneToggle.bind(this)},
    ];
    @ViewChild('selfVideo', {read : ElementRef, static : false}) public selfVideo : ElementRef;
    constructor(
        public webRtcService : WebRtcService,
	public webRtcComp : WebRtcComponent,
	public renderer : Renderer2,
	public changeRef : ChangeDetectorRef,
	public appContext : AppContextService,
	) {
        this.pcMessage = this.webRtcService.pcMessage;
        this.messageContacts = this.webRtcComp.messageContacts;
    }

    ngAfterViewInit(){
	this.startLocalStream();
    }
    
  ngOnInit() {
  }
  
  onMenuClick(){
        //Отобразить / скрыть панель контактов
      this.appContext.contentComp.opened = !this.appContext.contentComp.opened;
  }
  
  onPhoneToggle(){
      this.toolbarButtons[2].text = this.toolbarButtons[2].text === 'mic_none' ?  'mic_off' :  'mic_none';
      this.selfVideo.nativeElement.srcObject.getAudioTracks().forEach(t => t.enabled = !t.enabled)
    
  }
  
  onVideoToggle(){
      this.toolbarButtons[1].text = this.toolbarButtons[1].text === 'videocam' ?  'videocam_off' :  'videocam';
      this.selfVideo.nativeElement.srcObject.getVideoTracks().forEach(t => t.enabled = !t.enabled)
  }
  
    onClickMenuButton(){
    }
    
    ngOnDestroy(){
        //Останавливаем все треки
      let stream = this.selfVideo.nativeElement.srcObject;
      stream && stream.getVideoTracks().forEach(track => track.stop());
      //Включаем отображение основного тулбара и прогрессбара
      this.appContext.contentComp.toolbarProgressVisible = true;
  }
    
    async startLocalStream(){
	const hardware = this.appContext.contentComp.hardware,
	    constraints = {
	    audio: {deviceId: hardware.audioInputSelected.deviceInfo.deviceId ? {exact: hardware.audioInputSelected.deviceInfo.deviceId } : undefined},
	    video: {deviceId: hardware.videoInputSelected.deviceInfo.deviceId  ? {exact: hardware.videoInputSelected.deviceInfo.deviceId } : undefined}
	};
	try{
	    const supports = navigator.mediaDevices.getSupportedConstraints();
	    let stream = await navigator.mediaDevices.getUserMedia(constraints);
	    this.selfVideo.nativeElement.srcObject = stream;
	    this.changeRef.detectChanges();
	}catch (e) {
	
	}
    }
  
  setVideoHeight(){
//	this.renderer.setStyle(this.selfVideo.nativeElement, 'maxHeight', document.body.getBoundingClientRect().height  + 'px');
    }

}
