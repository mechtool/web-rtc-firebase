import { Injectable } from '@angular/core';
import {DatabaseService} from "./database.service";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {environment} from "../../environments/environment.prod";
import {AppContextService} from "./app-context.service";
@Injectable({
    providedIn: 'root'
})
export class MessagingService{
    
    constructor(
        public database : DatabaseService,
	public http : HttpClient,
	public appContext : AppContextService,
    ) {}
    
    public initialiseMessaging(){
	//Подписка на сервис сообщений в приложении с публичным ключем, сгенерированным  в консоли firebase /cloud messaging
	this.appContext.messaging.usePublicVapidKey(environment.appPublicKey);
	//Подписка на событие обновления токена
	this.appContext.messaging.onTokenRefresh(()=> {
	    //Получение нового токена
	    this.getToken().then((token)=>{
		//Отправка нового токена на сервер и замену старого токена
		this.sendTokenToServer(token);
	    })
	});
	//При получении сообщения от Push сервиса, отобразить сообщение пользователю
	//Срабатывает, если приложение в фокусе
	this.appContext.messaging.onMessage((payload)=> {
	    console.log('Получено новое сообщение!.', payload);
	    //Отобразить пользовательский интерфейс с новым сообщением
	    //todo Здесь находиться реализация отображения пользовательского интерфейса нового сообщения
	    payload.data.sender = JSON.parse(payload.data.sender);
	     //this.showUserNotification(payload.data);
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
	return this.appContext.messaging.getToken().then(function(token) {
	    return token;
	}).catch(function(err) {
	    console.log('Невозможно получить токен!', err);
	});
    }
    //Отправка нового токена на срвер
    private sendTokenToServer(token){
        this.database.setMessagingToken(token);
    }
    
    sendNotificationMessage(offer) : Promise<any> {//Отправка сообщения получателям
        //Получаем push токены для каждого получателя
	let usid;
	return Promise.all(Object.keys(offer.receivers).map(uid => {
	    usid = uid;
	    return this.database.getMessagingToken(uid)
	})).then(token => {
	    if(token){
		return this.http.post( //Устаревшая схема протокола
		    environment.messagingUrl, {
			"to" : token[0],
			"data" : {
			    messageType : offer.messageType,
			    sender: JSON.stringify(offer.sender),
			    messId : offer.messId
			}
		    },
		    {headers : new HttpHeaders({"Content-Type" : "application/json", "Authorization": "key="+environment.serverKey})}).toPromise();
	    }else throw 'Нет токена для пользователя '+ usid;
	}).catch(err => console.log(err))
    }
    
    //Реализация удаление токена с Push сервера. Демонстрация возможнотей удаления токена с сервера.
    private deleteToken() {
        let that = this;
	that.appContext.messaging.getToken().then(function(currentToken) {
	    that.appContext.messaging.deleteToken(currentToken).then(function() {
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
