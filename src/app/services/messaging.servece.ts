import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/messaging';
import {DatabaseService} from "./database.service";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {environment} from "../../environments/environment.prod";
@Injectable({
    providedIn: 'root'
})
export class MessagingService{
    
    public messaging = firebase.messaging();
    
    constructor(
        public database : DatabaseService,
	public http : HttpClient,
    ) {}
    
    public initialiseMessaging(){
	//Подписка на сервис сообщений в приложении с публичным ключем, сгенерированным  в консоли firebase /cloud messaging
	this.messaging.usePublicVapidKey(environment.appPublicKey);
	//Подписка на событие обновления токена
	this.messaging.onTokenRefresh(()=> {
	    //Получение нового токена
	    this.getToken().then((token)=>{
		//Отправка нового токена на сервер и замену старого токена
	//	this.sendTokenToServer(token);
	    })
	});
	//При получении сообщения от Push сервиса, отобразить сообщение пользователю
	//Срабатывает, если приложение в фокусе
	this.messaging.onMessage((payload)=> {
	    console.log('Получено новое сообщение!.', payload);
	    //Отобразить пользовательский интерфейс с новым сообщением
	    //todo Здесь находиться реализация отображения пользовательского интерфейса нового сообщения
	     //this.showUserNotification(payload);
	});
	
	this.startMessaging();
    }
    
    //1. При инициализации основного компонента приложения проверяем имеется ли токен данного пользователя
    //на сервере Firebase (Push сервер)
    public startMessaging(){
	this.getToken().then((token)=>{
	    //Если токен имеется, записываем (обновляем) его в базу на сервере приложения
	    if(token){
		console.info('Токен пользователя получен!');
	       this.sendTokenToServer(token);
	    }
	}).catch((err)=>{
	    console.log('Произошла ошибка при получении токена пользователя '+ err);
	});
    }
    
    public getPermission(){  //Функция запроса разрешения пользователя в браузере
        return Notification.requestPermission() ;
    }
    
    public getToken(){
	return this.messaging.getToken().then(function(token) {
	    return token;
	}).catch(function(err) {
	    console.log('Невозможно получить токен!', err);
	});
    }
    //Отправка нового токена на срвер
    private sendTokenToServer(token){
        this.database.setMessagingToken(token);
    }
    
    sendMessage(){
       this.getToken().then(token => {
	   this.http.post( //Устаревшая схема протокола
	       environment.messagingUrl, {
		   "to" : token,
		   "data" : {text : 'message'}
	       }, {
		   headers : new HttpHeaders({"Content-Type" : "application/json", "Authorization": "key="+environment.serverKey})}).toPromise();
       }) ;

    }
    
    sendHttpMessage(offer) : Promise<any> {//Отправка сообщения получателям
        //Получаем push токены для каждого получателя
	return Promise.all(Object.keys(offer.receivers).map(uid => {
	    return this.database.getMessagingToken(uid)
	})).then(tokens => {
	    return Promise.all(tokens.map(token => {
		return this.http.post( //Устаревшая схема протокола
		    environment.messagingUrl, {
		        "to" : token,
			"data" : {
		            messageType : offer.messageType,
			    sender: JSON.stringify(offer.sender),
			    messId : offer.messId,
			    pcId : offer.pcId}
			    },
		{headers : new HttpHeaders({"Content-Type" : "application/json", "Authorization": "key="+environment.serverKey})}).toPromise();
	    }))
	});
    }
    
    //Реализация удаление токена с Push сервера. Демонстрация возможнотей удаления токена с сервера.
    private deleteToken() {
        let that = this;
	that.messaging.getToken().then(function(currentToken) {
	    that.messaging.deleteToken(currentToken).then(function() {
		console.log('Токен удален с Push сервера.');
		//todo отобразить пользователю  успешное удаление токена
	    }).catch(function(err) {
		console.log('Возникла ошибка при удалении токена с Push сервера! ', err);
	    });
	    // [END delete_token]
	}).catch(function(err) {
	    console.log('Возникла ошибка при получении токена с Push сервера! ', err);
	});
    }
    
}
