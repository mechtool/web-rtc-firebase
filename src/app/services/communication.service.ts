import { Injectable } from '@angular/core';
import {BehaviorSubject, Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class CommunicationService {

    public base : BehaviorSubject<any> = new BehaviorSubject({type  : 'initialize'});
    constructor() { }
}
