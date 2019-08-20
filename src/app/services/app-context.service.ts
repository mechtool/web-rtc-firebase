import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AppContextService {

    public auth;
    public appUser;
    public firebase;
    public database;
    public messaging;
    public contentComp;
    public notifications = [];
    public notificationView ;
    public contentResolver ;
    public webRtcService;
    public webRtcComponent;
    public textMessageComponent;
    public beforeInstallPromptEvent;
    public installScreenButton = true;
    
    constructor() { }
}
