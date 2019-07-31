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
    public contactStatus;
    public notifications = [];
    public notificationView ;
    public contentResolver ;
    public messageComp;
    public webRtcService;
    public webRtcComponent;
    
  constructor() { }
}
