import { Injectable } from '@angular/core';
import {Contact} from "../classes/Classes";
import {Observable} from "rxjs";
import {AppContextService} from "./app-context.service";

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

    constructor(private appContext : AppContextService) {}
    
    checkDatabaseUser(user) : Observable<Contact>{
        //проверяет существование пользователя в базе данных
	//и если его нет, то создает
	let ref = this.getDatabaseRef('users/' + user.uid);
	return new Observable(sub => {
	    ref.once('value').then(snap => {
		let appUser = snap.val();
		if(!appUser) {
		    appUser = new Contact(user);
		    ref.set(appUser);
		}
		return sub.next(appUser);
	    })
	})
    }

    getDatabaseRef(ref){
        return this.appContext.database.ref(ref);
    }
    sendDescriptor(desc){
        return new Promise((res, rej)=> {
	    this.getDatabaseRef(desc.descType + desc.contact.uid +'/'+ desc.messId).set(desc, ()=> {
	        res(desc);
	    })
	})
    }
    setContact(contact){
       return this.getDatabaseRef('contacts/' + this.appContext.auth.currentUser.uid + '/' + contact.uid).set(contact);
    }
    
    setDescriptorStatus(update){
	Object.keys(update).forEach(key => {
	    this.getDatabaseRef(key).once('value').then((snap)=> {
	        let value = snap.val();
		if(value && value.status === 'active') {
		    snap.ref.update(update[key]);
		}
	    })
	})
    }
    
    setMessagingToken(token){
        this.getDatabaseRef('users/' + this.appContext.auth.currentUser.uid).update({messToken : token});
    }
    getMessagingToken(uid){
	return this.getDatabaseRef('users/' + uid + '/messToken').once('value').then(snap => {
	    return  snap.val();
    	})
    }

    deleteContact(contact){
        this.getDatabaseRef('contacts/' + this.appContext.auth.currentUser.uid +'/'+ contact.uid).remove()
	    .then(()=>{
            //Оповещение об удалении контакта
	}).catch(err => {
	    //Неудачное удаление контакта
	})
    }

    listenContacts(){
	this.getDatabaseRef('contacts/' + this.appContext.auth.currentUser.uid).on('value', (snap => {
		snap.val();
	    }))
    }
}
