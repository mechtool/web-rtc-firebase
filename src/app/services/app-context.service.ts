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
    public contactStatus;
  constructor() { }
}
