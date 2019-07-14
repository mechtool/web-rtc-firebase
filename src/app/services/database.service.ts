import { Injectable } from '@angular/core';
import {Contact} from "../classes/Classes";

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

    public database;
    
    constructor() {}
    
    checkDatabaseUser(user){
        //проверяет существование пользователя в базе данных
	//и если его нет, то создает
	let ref = this.getDatabaseRef('users/' + user.uid);
	return ref.once('value').then(snap => {
	    let appUser = snap.val();
	    if(!appUser) {
	        appUser = new Contact(user);
	        ref.set(appUser);
	    }
	    return appUser;
	})
	
    
    }
    getDatabaseRef(ref){
        return this.database.ref(ref);
    }
    
    setMessagingToken(token){
    
    }
    getMessagingToken(uid){
    
    }
}
