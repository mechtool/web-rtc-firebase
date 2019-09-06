import {Injectable, NgZone} from '@angular/core';
import {DatabaseService} from "./database.service";
import {AppContextService} from "./app-context.service";
import {Answer, Candidate, Contact, Message, Offer, PcMessage} from "../classes/Classes";
import {MessagingService} from "./messaging.servece";
import {Router} from "@angular/router";
import {NotificationService} from "./notification.service";
import {CommunicationService} from "./communication.service";
const uuid = require('uuid/v1');

@Injectable({
  providedIn: 'root'
})

export class WebRtcService {
    
    public timeouts : any ={};
    public notifications = {};
    public pcMessage = new PcMessage();
    public collections = ['rtc/offers/',  'rtc/answers/'];  /// 'rtc/candidates'
    public statusColors = {new : '#58ad4e', open : '#3f8e54', connecting : '#4351d9', connected : '#0e0ca5', message : '#00afb6',
	disconnected : '#959595', closing : '#dd4c48', closed : '#d10900', failed : '#959595', close : '#959595', error : '#c70900'};
    public configuration = {
        iceServers: [{
	    urls: [ "stun:eu-turn3.xirsys.com" ]
	}, {
	    username: "bg1V1XOWQtvhObCaa4IYix91GcJa4oUeD5u5cqwStfY_trcca8J332_MyWF2qsQHAAAAAFzfvPpzaXdh",
	    credential: "d0d52690-7943-11e9-ba1e-72c9c257b255",
	    urls: [
		"turn:eu-turn3.xirsys.com:80?transport=udp",
		"turn:eu-turn3.xirsys.com:3478?transport=udp",
		"turn:eu-turn3.xirsys.com:80?transport=tcp",
		"turn:eu-turn3.xirsys.com:3478?transport=tcp",
		"turns:eu-turn3.xirsys.com:443?transport=tcp",
		"turns:eu-turn3.xirsys.com:5349?transport=tcp"
	    ]
	}]} ;
    //Функция обезтка над функцией получение сигнала для передачи this
    public wrapOnSignal = this.onSignal.bind(this);
    
    constructor(
	    public database : DatabaseService,
	    public appContext : AppContextService,
	    public messaging : MessagingService,
	    public zone : NgZone,
	    public router : Router,
	    public notificationService : NotificationService,
	    public communications : CommunicationService,
	    ) {};
  
    async initialize(){ //Инициализация сервиса при авторизированном старте приложения:
        //1.Получаем конфигурацию STUN/TURN
	//2.Подписываемся на получения АКТИВНЫХ предложений или ответов
      try{
/*	  this.configuration =  await this.http.put("https://global.xirsys.net/_turn/web-rtc" , JSON.stringify({"format": "urls"}) ,{
	      headers : {
		  "Authorization" : "Basic " + window.btoa("siwa:9c159066-7943-11e9-8c10-0242ac110003"),
		  "Content-Type" : "application/json",
	      }
	  }).toPromise().then((res : any) => {
	      console.log(res.v ? 'STUN/TURN конфигурация получена!': 'STUN/TURN конфигурация не получена!');
	      return res.v;
	  });*/
	  //Запуск сервиса должен обеспечить подключения всех трех способов получения сообщений: текстовый, аудио, видео
	 this.collections.forEach(coll => {
	     //подписка на активные предложения и ответы
	     this.database.getDatabaseRef(coll + this.appContext.appUser.uid).orderByChild('status').equalTo("active").on('value', this.wrapOnSignal);
	 })
      }catch (e) {console.log(e)}
    }
    
    checkComponentCollection(options) : Promise<any>{
        let message = options.message || 'Новое сообщение закроет текущее!' ;
        if(this.notifications[options.mid]){
            return Promise.resolve({received : false});
	}else{
	    return new Promise(async (res, rej) => {
		let result : any = {received : true, messId : options.mid || uuid()};
		if(this.appContext.webRtcComponent && Object.keys(this.pcMessage.pcCollection).length){
		    this.notifications[result.messId] = options.message;
	    
		    //Отобразить предупреждение об удалении текущего сообщения
		    result = await this.showUserNotification({messId : result.messId, sender : {name : 'Application', photoURL : '/assets/app-shell/mess-00.png', imgColor : '', message : message}});
	    
		    delete this.notifications[result.messId]
		}
		res(result);
	    })
	}
    }
    
    onSignal(snap){//получено предложение type=offer/answer/candidates
    
	if(!snap.val()) return ;
	
	let ntResult,
	    that = this,
	    val = Object.values(snap.val()) as any[],
	    descriptor = val[0];
	//если тип сигнала - предложение, то формируем интерфейс принятия предложения, если предложение принято
	//, тогда запускаем процедуру установки соединения
	if(descriptor.descType.indexOf('offers') >= 0){
	    // если предложение принято - запуск формирования соединения
	    descriptor.desc = JSON.parse(descriptor.desc);
	    (async () => {
		try {
		    if(descriptor.status === 'active'){
			//отобразить каждое сообщение пользователю
			ntResult = await that.showUserNotification(descriptor);
			//Выбран прием входяшего сообщения, нужно проверить общается ли пользователь с кем нибудь, т.е существует ли компонент сообщения
			if(this.appContext.webRtcComponent && Object.keys(this.pcMessage.pcCollection).length){
			    //Отобразить второе предупреждение об удалении текущего сообщения
			    ntResult = await that.showUserNotification({messId : uuid(), sender : {photoURL : '/assets/app-shell/attention-24px.svg', imgColor : '', name : "Application", message : 'Новое сообщение закроет текущее!'}}).catch(err => {
				console.log(err);
			    });
			    //Если новое сообщение или предупреждение принимается, то удаляем все сообщения
			    //иначе, отправляем на сервер новый статус дескриптора
			    ntResult.received &&  this.closeAllMessages();
			}
			//Устанавливаем выбранный контакт в список контактов в компоненте message
			//и создаем экземпляр компонента сообщения через вызов навигации
			if(ntResult.received) {
			    await this.zone.run(async () => await this.router.navigateByUrl('/content/message'));
			    //синхронно устанавливаем коллекцию контактов для возможности последующего запуска новых соединений
			    //через эту коллекцию контактов
			    await new Promise((res, rej) => {
				this.communications.base.next({
				    type: 'new-contacts',
				    contacts: setArrayContacts.bind(this, descriptor)(),
				    messType: descriptor.messageType,
				    complete: res
				});
			    });
			    //Обновление интерфейса после отправки сообщения для установки контактов в коллекцию контактов
			    this.appContext.webRtcComponent.changeRef.detectChanges();
			    //Изменение статуса сообщения  на принятое
			    await this.database.setDescriptorStatus({[descriptor.descType + this.appContext.appUser.uid + '/' + descriptor.messId]: {status: 'received'}});
			    //При получении предложения в активном статусе, в контакты передаем только отправителя предлжения
			    that.startConnection({initializer: false, desc: descriptor, contacts: [descriptor.sender]});
			    //Формирование теневых предложений и подписки на ответы
			if(Object.keys(descriptor.receivers).length > 1){
			    let active = false;
			    for(let key in descriptor.receivers){
				active = active ||  key == this.appContext.appUser.uid;
				if(key == this.appContext.appUser.uid) continue;
				if(active){
				    //Сформировать теневое предложение и сформировать подписку на теневые ответы
				    that.startConnection({initializer : true,  desc: {messageType : descriptor.messageType , status  : 'implicit' }, contacts : [descriptor.receivers[key]]});
				}
			    }
			//Запуск подписки на теневые предложения и ответы
			this.collections.forEach(coll => {
			    //подписка на теневые предложения и теневые ответы
			    this.database.getDatabaseRef(coll + this.appContext.appUser.uid).orderByChild('status').equalTo("implicit").on('value', this.wrapOnSignal) ;
			});
			
			}
		}else{
		    this.database.setDescriptorStatus({[descriptor.descType + this.appContext.appUser.uid + '/' + descriptor.messId] : {status : 'rejected'}});
			}
	    } else if(descriptor.status === 'implicit'){//здесь получили неявное предложение, создаем соединение
		    //Нужно его проверить : существует ли контакт с совпадающим идентификатором в списке контактов,
			//и если существует, то создать соединение
		    if(this.appContext.webRtcComponent.messageContacts.value.some((cont)=> {
			 return cont.uid === descriptor.uid;
		    })){
			//только для отправителя
			await this.database.setDescriptorStatus({[descriptor.descType + this.appContext.appUser.uid + '/' + descriptor.messId] : {status : 'received'}});
			that.startConnection({initializer : false,  desc: descriptor, contacts : [descriptor.sender]});
		    }
	    }
	    //объект соединения готов
	    let pcItem = that.getPcItem(descriptor.uid),
		pc = pcItem.pc ;
	    if(pc){
		// установили удаленный offer как удаленный дескриптор
		await pc.setRemoteDescription(descriptor.desc);
		//установили локальный дескриптор и создали свой ответ (answer)
		await pc.setLocalDescription(await pc.createAnswer());
		//формирование ответа на приглашение, после которого вызывается меод формирования кандидатов
		//в котором и происходит отправка дескриптора на сервер
		pcItem.desc = new Answer({messId : descriptor.messId , status :  pcItem.explicit ? 'active' : 'implicit',   uid : this.appContext.appUser.uid, messageType : descriptor.messageType,  descType : this.collections[1], contact : pcItem.contact, receivers : {[descriptor.sender.uid] : descriptor.sender}, sender : this.appContext.appUser, desc: JSON.stringify(pc.localDescription), explicit :  pcItem.explicit });
		//Отправка дескриптора на сервер
		await this.database.sendDescriptor(pcItem.desc);
		//Ссылка на функцию сигнализации для дальнейшего ее удаления
		pcItem.onSignal = this.wrapOnSignal;
		//Подписка на получение удаленных кандидатов
		//подписка на получение кандидатов ответов на отправленное предложение
		this.database.getDatabaseRef((pcItem.explicit ? 'rtc/candidates/' : 'rtc/implicit-candidates/') + this.appContext.appUser.uid ).orderByChild('descId')
		    .equalTo(pcItem.desc.messId).on('value', pcItem.onSignal);
	    }
	    }catch (e) { //Выход по ошибке
		//todo Отказ от принятия предложения - отправляем изменение статуса сообщения на сервер  status = rejected
		await this.database.setDescriptorStatus({[descriptor.descType + this.appContext.appUser.uid + '/' + descriptor.messId] : {status : 'rejected'}});
		}
	    })();
	}else if(descriptor.descType.indexOf('answers') >= 0 && descriptor.desc){
	    //пришедшие через сеть ответы не записываем в элемент pcConnection
	    //для определения инициатора соединения
		//Установка удаленного дескриптора из ответа и установка удпленных кандидатов
		let pcItem = that.getPcItem(descriptor.uid);
		if(pcItem && pcItem.pc) (async () => {
		    let desc = JSON.parse(descriptor.desc);
		    pcItem.pc.setRemoteDescription(desc).then(()=>{
		    //Изменение статуса дескриптора - принят
		    	this.database.setDescriptorStatus({[descriptor.descType + this.appContext.appUser.uid + '/' + descriptor.messId] : {status : 'received'}}) }).catch((err) => console.error(err));
		    
		    //Установка удаленных кандидатов, если
		   // this.setCandidates(pcItem.pc, d.candidates);
		})();
	}else if(descriptor.descType.indexOf('candidates') >= 0){
	    //получаем активные кандидаты
		let pcItem = that.getPcItem(descriptor.uid);
		this.setCandidates(pcItem.pc, descriptor);
		//После установки кандидата записать в базу его статус  "received"
		this.database.setDescriptorStatus({[descriptor.descType + descriptor.contact.uid + '/' + descriptor.messId] : {status : 'received'}})
	}

	//Функция, которая формирует список контактов для каждого пира, удаляя из этого списка
	//самого пира, чтобы его данные не отображались в списке пиров-участников разговора.
	//Возвращает отфильтрованный массив пиров.
	function setArrayContacts(desc){
	    let arr = Object.values(desc.receivers).filter((rec : Contact)  => rec.uid !== this.appContext.appUser.uid);
	    arr.push(desc.sender);
	    return arr;
	}
    }
    
    closeAllMessages(){
	//отчистка всей коммуникации
	this.communications.base.next({type  : 'initialize'});
	if(this.appContext.webRtcComponent){ //если компонент существует
	    //отчистка коллекции контактов сообщения, только, если экземпляр PeerConnection существует
	    //, т.е. существует объект соединения старого сообщения в котором использовались
	    //контактыы не нужные уже в новом сообщении
	    if(this.appContext.webRtcComponent.messageContacts.value.length){
		this.appContext.webRtcComponent.deleteContact(this.appContext.webRtcComponent.messageContacts.value.map(cont => cont.uid))  ;
		this.appContext.webRtcComponent.messageContacts.next([]);
	    }
	    
	    //отключение отображения прогрессбара соединения
	    this.appContext.webRtcComponent.connecting = false;
	    //принудительно устанавливаем отсутствие пиров
	    this.appContext.webRtcComponent.noPeers = true;
	    this.appContext.webRtcComponent.firstMessageText = undefined;
	}

	if(this.appContext.textMessageComponent){
	    //Отчистка всех сообщений в интерфейсе
	    this.appContext.textMessageComponent.textMessages = [];
	    //Отчистка поля ввода текста
	    this.appContext.textMessageComponent.messageGroup.get('textControl').setValue('');
	}
	//Отключение всех  таймаутов
	for(let key in this.timeouts){
	    clearTimeout(this.timeouts[key].listener);
	}
	//Затираем ссылку на объект
	this.timeouts = {};
	//Освобождение кнопок интерфейса от блокировки
	this.appContext.contentComp.disableButton = false;
	//Отчистка коллекции контактов и коллекции pcMap  с закрытием соединений
	//отправка данных на сервер о закрытых соединениях
	for(let key in this.pcMessage.pcCollection){
	    //todo В это место поместить функциональность удаления неявных соединений
	    //закрытие всех пир соединений
	    let pcItem = this.pcMessage.pcCollection[key],
		desc = pcItem.desc ;  //временная заглушка, поскольку соединения не имеющие дескриптора должны удаляться,
	    //это значит, что аббонент не ответил (когда пир получает входящее сообщение, его список контактов формируется на основе контактов
	    // , переданных от инициатора сообщения, их может быть больще одного. Дальше по этому списку контактов формируются соединения, дескрипторы которых должны заролняться в процессе теневого соединения контактов между собой. Если контакт не ответил на теневой вызов,
	    // его объект соединения должен быть удален по истечении периода времени ожидания ответа, настраиваемом на странице настроук.)
	    if(desc){
		//Снятие ранее установленных обработчиков на получения кандидатов
		 this.database.getDatabaseRef((pcItem.explicit ? 'rtc/candidates/' : 'rtc/implicit-candidates/') + this.appContext.appUser.uid ).orderByChild('descId').equalTo(desc.messId).off('value', pcItem.onSignal) ;

		 //Установка статуса дескриптора на отмененный, если его статус активный или теневой
		this.database.setDescriptorStatus({[desc.descType + (pcItem.initializer ? desc.contact.uid : this.appContext.appUser.uid) + '/' + desc.messId] : {status : 'refused'}});   //refused
	    }
	    //Закрыть соединение
	    pcItem.pc.close() ;
	    //Удалить соединение из коллекции соединений
	    //delete this.pcMessage.pcCollection[key];
	}
	//Удалить всю коллекцию
	this.pcMessage.pcCollection = {};
	//обновляем интерфейс
	this.appContext.contentComp.changeRef.detectChanges();
    }
    
    setCandidates(pc, candidate){
        let cand = JSON.parse(candidate.desc);
	pc.addIceCandidate(cand).then().catch((err) => console.error(err));
    }
    
    showUserNotification(payload){
	return new Promise((res, rej)=> {
	    let subs = [],
		noteRef = this.notificationService.showUserNotification(payload) ,
		instance = noteRef.instance;
	    subs.push(instance.receive.subscribe( messId => {
		console.log('received');
		res(unsubscribe.bind(this, subs, messId, true)());
	    }));
	    subs.push(instance.cancel.subscribe(messId => {
		console.log('cancel');
		res(unsubscribe.bind(this, subs, messId, false)());
	    }));
	}) ;
	
	function unsubscribe (subs, messId, received) {
	    this.notificationService.deleteNotification(messId);
	    subs.forEach(s => s.unsubscribe()) ;
	    return {received : received, messId : messId};
	}
    }
    
    getPcItem(pcId){
	return this.pcMessage.pcCollection[pcId];
    }
    
    setupChat(pcItem) { //Настройка текстового чата
	//Соединение открыто, т.е. собеседник принял соединение
	pcItem.channel.addEventListener('open', (event)=> this.onOpenConnection({pcItem : pcItem, that : this, event : event}));
	//Пришло сообщение от собеседника
	pcItem.channel.addEventListener('message', (event)=>this.onMessage({pcItem : pcItem, that : this, event : event}));
	//Ошибка канала сообщения
	pcItem.channel.addEventListener('error', (event)=> this.onErrorChannel({pcItem : pcItem, that : this, event :event})) ;
	//Закрытие канала связи собеседником
	pcItem.channel.addEventListener('close', (event)=> this.onCloseChannel({pcItem : pcItem, that : this, event : event}))
    }
    
    onOpenConnection(opt){
	let context = opt,
	    that = context.that;
	//канал открыт,// т.е. собеседник открыл соединение, нужно отправить содержимое первого сообщения
	//Для отправки первого сообщения, когда канал связи еще не открыт, у объекта канала (channel) вызывается
	//метод отправки send(), содержимое которого помещается в буфер и увеличивает свойство канала bufferedAmount
	//содержащий количество байт в сообщении. Когда канал связи откроется, браузер автоматически отправляет сообщение по новому каналу и значение свойства bufferedAmount изменяется и вызывается событие канала bufferedamountlow, указывая на снижение данных относительно установленного предела. Порог или предел, ниже объема данных которогого происходит запуск события bufferedamountlow устанавливается в свойстве bufferedAmountLowThreshold. Поэтому, первое сообщение отправитель может отправить сразу, до установки канала или после
	//возникновения события открытия канала.
	//todo здесь выполняется первая, автоматическая отправка сообщения пользователю, после установления соединения
	if(context.pcItem.initializer){
	    context.pcItem.messageText = that.appContext.webRtcComponent.firstMessageText || that.appContext.webRtcComponent.messageGroup.get('textControl').value;
	    that.sendTextMessage(context.pcItem);
	    that.appContext.webRtcComponent.firstMessageText || that.renderMessage(context.pcItem);
	    that.appContext.webRtcComponent.firstMessageText = context.pcItem.messageText;
		//Метод onOpenConnection запускается первый раз, когда первый из пиров откликнется на сообщение.
	    // И каждый раз, когда последующие пиры принимают сообщение. Следовательно, текущая группа кода
	    //выполняется когда первый, самый проворный пир поднимет трубку.Если в этом месте отчищать поле ввода сообщения, то другим
	    //пирам ,пришедшим позже достанется только отчищеное поле ввода и сообщение они не увидят. Поэтому, нужно сохранить первый ввод
	    //текстового поля в переменную и выдавать ее значение всем новоприбывшим.
	    that.appContext.webRtcComponent.messageGroup.get('textControl').setValue('');
	}
	context.pcItem.contact.statusColor = that.statusColors[opt.event.type];
	//Проверка всех соединений на предмет имеющегося хотябы одного открытого соединения
	//для изменения отображения кнопки отправки сообщения
	that.checkConnections();
	that.appContext.contentComp.changeRef.detectChanges();
    }
    
    sendTextMessage(pcItem){  //Отправка текстового сообщения всем контактам
	//если соединение активно, передать сообщение
	let text , pc = pcItem.pc, channel = pcItem.channel;
	if(pc && channel && channel.readyState !== 'close' && channel.readyState !== 'closing' && pc.connectionState === 'connected'){
	    channel.send(pcItem.messageText);
	    //Отрпавить сообщение на сервер / локальное хранилище, а в конце сессии отправить на сервер для
	    //хранения / архивирования
	    //todo код отправки сообщения на сервер
	    pcItem.sender = this.appContext.appUser;
	}
    }
    
    renderMessage(pcItem){ ///Отображение сообщения в интерфейсе
        if(!pcItem.messageText) return false;
	let desc = pcItem.desc || pcItem;
	let message = new Message({text : pcItem.messageText , messageId : uuid(),  sender : pcItem.sender, messageType : desc.messageType, receivers : desc.receivers }) ;
	//добавить новое текстовое сообщение в коллекцию текстовых сообщений компонента webtrc
	this.appContext.textMessageComponent.textMessages.unshift(message);
	//Прокрутить скролл кверху
	this.appContext.textMessageComponent.textBlock.nativeElement.scroll(0 ,0);
	//сообщение отправлено, нужно отчистить поле ввода
	this.appContext.contentComp.changeRef.detectChanges();
    }
    onMessage(opt){ //получение сообщения от pcConnection
	let context = opt;
	//Отобразить полученное сообщение
	context.pcItem.messageText =  opt.event.data;
	context.pcItem.sender = context.pcItem.contact;
	context.that.renderMessage(context.pcItem) ;
	context.pcItem.contact.statusColor = context.that.statusColors[opt.event.type];
	context.that.checkConnections();
    }
    
    onCloseChannel(opt){
	let context = opt;
	//Предупредить пользователя о закрытие канала сообщения
	context.pcItem.contact.statusColor = context.that.statusColors[opt.event.type];
	context.that.checkConnections();
    }
    
    onErrorChannel(opt){
	let context = opt;
	context.pcItem.contact.statusColor = context.that.statusColors[opt.event.type];
	context.that.checkConnections();
    }
    
    checkConnections(){
        let col = Object.values(this.pcMessage.pcCollection) ;
        if(col.length == 0) {
            //пиры отсутствуют
            return this.appContext.webRtcComponent.noPeers = false ;
	}
        //вычисление отсутствие  пиров на основе статуса, перебором всех элементов соединения
	this.appContext.webRtcComponent.noPeers = col.some((pcItem : any) => /#58ad4e|#3f8e54|#4351d9|#0e0ca5|#00afb6/.test(pcItem.contact.statusColor)) ;
	this.appContext.webRtcComponent.connecting = (!this.appContext.webRtcComponent.noPeers) && col.length;
	this.appContext.contentComp.changeRef.detectChanges();
    }
    
    textMessage(opts){
	if(Object.keys(this.pcMessage.pcCollection).length == 0 && opts.contacts.length){
	    this.startConnection(opts)
	} else{
	    let hasConnection,
		message = this.appContext.webRtcComponent.messageGroup.get('textControl').value;
	    Object.values(this.pcMessage.pcCollection).forEach((pcItem: any) => {
		//условия проверки соединения, и если соединение активное, тогда отправлять сообщение
		hasConnection = pcItem.pc.connectionState === 'connected';
		if (hasConnection) {//Если соединение существует, отправляем сообщение
		    pcItem.messageText =  message;
		    this.sendTextMessage(pcItem);
		}
	    });
	    if(hasConnection){//Отображаем сообщение пользователю и отчищаем поле ввода
		if(message){
		    this.renderMessage({sender : this.appContext.appUser, messageText : message, messageType : 'text', receivers : opts.contacts}) ;
		    this.appContext.webRtcComponent.messageGroup.get('textControl').setValue('') ;
		}
	    }
	}
    }
    
    startConnection(opts){
	let timeout;
	if(!this.configuration){
	    console.log('Невозможно создать соединение по причине отсутствующей STUN/TURN конфигурации!');
	    return false;
	}
	//Только новое сообщение с не пустым списком получателей
	if(opts.contacts.length){
	     if(opts.desc.messageType != 'video'){ //только если, тип сообщения не является видеосообщением
		 //Отключаем кнопку отправки сообщения
		 this.appContext.webRtcComponent.noPeers = false;
		 //Отключения кнопок интерфейса для предотвращения перехода на другие страницы до окончания сообщения
		 this.appContext.contentComp.disableButton = true;
		 //Включаем индикатор соединения (mat-toolbar);
		 this.appContext.webRtcComponent.connecting = true;
	     }
	    //Запуск счетчика времени ожидания вызовов, если пользователь, является инициатором сообщения. Если ни один контакт не ответил,
	    // тогда закрываем сообщение
/*	    if(opts.initializer && opts.desc.status === 'active') (timeout = setTimeout(()=>{
	        //Если пиров нет, тогда все закрыть;
	        if(this.appContext.webRtcComponent && !this.appContext.webRtcComponent.noPeers) {
	            //Отобразить предупреждение пользователю
	            this.showUserNotification({messageType : 1, sender : {message : 'Абоненты не ответили!', name : 'Application', photoURL : '/assets/app-shell/mess-00.png', imgColor : 'transparent', statusColor : this.statusColors.open}, messId : uuid()}).then(resp => {})  ;
	            this.closeAllMessages();
		}
	        clearTimeout(timeout);
	        timeout = undefined;
	        }, parseInt(window.localStorage.getItem('timeout')) * 1500 )) ;*/
	    //-----------------------------------------------------------------------------------
	    //Если предложение принято нужно сформировать предложения для контактов, находящихся в
	    // списке получателей desc.receivers + отправитель явного предложения по схеме:
	    //1.Пиры, имеющие больший индекс, относительо текущего пользователя - будут являтся инициаторами и формировать теневые (неявные) предложения (т.е. предложения не требующие явного подтверждения получения).
	    //2.Пиры, имеющие низший индекс, относительно текущего пользователя будут ожидать эти теневые предложения от текущего пира , установив подписку на теневые предложения, кандидаты.
	    //3. Если pcItem - является явным соединением, то ему ставиться истина в свойстве explicit, иначе, false
	    //4. Диапазон ожидания ответов от пиров устанавливается на соединения, для которых текущий пользователь является инициатором
	    for(let i = 0; i < opts.contacts.length; i++){
	        let cont = opts.contacts[i];
	        cont = this.appContext.webRtcComponent.messageContacts.value.find(con => con.uid === cont.uid) || cont;
	        let pcItem = {uid : cont.uid,  contact : cont, pc : new RTCPeerConnection(this.configuration), initializer : opts.initializer, messageType : opts.desc.messageType, channel : undefined, stream : undefined , srcObject : undefined, desc : undefined ,  explicit : opts.desc.status === 'active' };
		this.pcMessage.pcCollection[cont.uid]  =  pcItem;
	  //Изменение статуса контакта при изменении статуса соединения
		pcItem.pc.onconnectionstatechange = (event)=>{
		    pcItem.contact.statusColor = this.statusColors[(event.target as RTCPeerConnection).connectionState];
		    this.checkConnections();
	    };
	    //Обработка кандидатов соединения
	    pcItem.pc.onicecandidate = onIceCandidate.bind(this, pcItem); //подписались на получения кандидатов
	    //изменение статуса собирания кандидатов
	    //pcItem.pc.onicegatheringstatechange = onIceGatherStateChange.bind(this, pcItem);
	    //Если пользователь является инициатором соединения
	    if(opts.initializer){
	      //событие необходимости согласования соединения
		// актуально только на стороне инициатора соединения
	      pcItem.pc.onnegotiationneeded = onNegotiation.bind(this, pcItem);
	    }
	    
	    if(opts.desc.messageType == 'text'){
		    if (opts.initializer) {
			  // создан экземпляр чата открыть его настроку
			  pcItem.channel = pcItem.pc.createDataChannel(cont.uid);
			  ///отправка первого сообщения через буфер, при отсутствии открытого канала
			  //this.sendTextMessage(pcItem);
			  ///здесь происходит отправка первого сообщения, которое помещается в буффер,
			  //если соединение ещё не установленно и отправиться автоматически после открытия соединения
			  // channel.send('srt')
			this.setupChat(pcItem);
		    } else {
		      // получен экземпляр чата, открыть его настройку
			  pcItem.pc.ondatachannel = (event) => {
			      pcItem.channel = event.channel;
			      pcItem.contact.statusColor = this.statusColors['open'];
			      this.checkConnections();
			      this.setupChat(pcItem);
			  };
		    }
	    }else if(opts.desc.messageType === 'video' || opts.desc.messageType === 'audio'){
	                      //Обработчик получения треков от удаленных пиров
		  	      pcItem.pc.ontrack = onTrack.bind(this, pcItem);
		  	      (async ()=> {
				    try { //Получаем локальный поток, отображаем его в видео элементе, если это видеотип
					//или вставляем его в аудиоэлемент и убираем громкость, если это аудио тип, а затем
					//добавлякм все треки в PC
					let stream =  pcItem.stream = await navigator.mediaDevices.getUserMedia({audio: true, video:  opts.messageType === 'video'});
					stream.getTracks().forEach((track) => pcItem.pc.addTrack(track, stream));
					//selfView может быть как ссылкой на объект video так и сслылкой на объект audio и если ссылка на
					//объект-источник занята, её переписывать не надо.
					this.appContext.webRtcComponent.selfSrcObject || (this.appContext.webRtcComponent.selfSrcObject = stream);
				    } catch (err) {
					console.error(err);
				    }
			    })() ;
	      		}
	    }
	}
    
      async function onNegotiation(pcItem) {
	  
          try {//Установка локального дескриптора, который сформируется через создания предложения
	      //и присвоется свойству pc.localDescription, которое нужно отправить через сервис сигнализации
	      //для принятия его получателем. После установке локального дескриптора запускется несколько раз onIceCandidate
	      await pcItem.pc.setLocalDescription(await pcItem.pc.createOffer());
	      //1.Для данной реализации можно выполнить серверный запрос на облачную функцию, которая через  административную библиотеку сформирует записи в базу данных, а так же запустить push оповещение на сервере
	      //todo  2.Сформировать записи в базу данных средствами database, а затем, после успешного срабатывания промиса, отправить сообщение по средствам messaging
	      //Сначала сформируем предложение и отправим его в базу
	      //После срабатывания промиса, отправим push уведомление пользователю
	      //свойство status = active - активное (активируется отправителем) до дальнейших действий либо принимающей, либо отправляющей стороной,
	      // skipped - пропущено (устанавливается отправителем при не приятии предолжения)
	      //rejected - отклонено принимающей стороной (устанавливается принимающей стороной)
	      //received - принят (устанавливается принимающей стороной)
	      //refused - сброшен и прерван отправляющей стороной (принимающий абонент не ответил по таймауту)
	      pcItem.desc = new Offer({messId : uuid() , uid : this.appContext.appUser.uid, messageType : pcItem.messageType, contact : pcItem.contact,  receivers : getContactsObject(), status : pcItem.explicit ? 'active' : 'implicit',  descType : this.collections[0], sender : this.appContext.appUser, desc: JSON.stringify(pcItem.pc.localDescription), explicit : pcItem.explicit});
	      //Установка таймаута на сообщения, которых пользователь является инициатором для отслеживания соединения
/*	      this.timeouts[pcItem.contact.uid] = { listener : setTimeout(()=>{
	          if(pcItem.pc.connectionState === 'connected'){
	              //Если соединение принято, тогда просто удаляем ссылку на таймаут
		      //Снятие обработчика
		      clearTimeout(this.timeouts[pcItem.contact.uid].listener);
		      //Признак соединения
		      this.timeouts[pcItem.contact.uid].resolve = true;
	          }else{
	              //Иначе, закрываем соединение и отправляем статус 'refused' на сервер
		      //todo выполнить реализацию отправки статуса refused
	    
		      // Снятие обработчика
		      clearTimeout(this.timeouts[pcItem.contact.uid].listener);
	          }
	      }, parseInt(window.localStorage.getItem('timeout')) * 1000 ), resolve : false };*/
	      //Отправка предложения сигнализации
	      await this.database.sendDescriptor(pcItem.desc);
	      //отправка Push-Notification получателю, если настройка позволяет
	      JSON.parse(window.localStorage.getItem('usePushNotification')) && pcItem.explicit && await this.messaging.sendNotificationMessage(pcItem.desc);
	      //Ссылка на функцию сигнализации для дальнейшего удаления ее вызова
	      pcItem.onSignal =  this.wrapOnSignal/*this.onSignal.bind(this)*/;
	      //подписка на получение кандидатов ответов на отправленное предложение
	      this.database.getDatabaseRef((pcItem.explicit ? 'rtc/candidates/' : 'rtc/implicit-candidates/') + this.appContext.appUser.uid ).orderByChild('descId').equalTo(pcItem.desc.messId).on('value', pcItem.onSignal)

	  } catch (err) {
	      console.error(err);
	  }
      }
  
      function onIceGatherStateChange(pcItem, event){
	    if(window.localStorage.getItem('optimisation') === 'true' && event.target.iceGatheringState === 'complete'){
		if(pcItem.desc.candidates && pcItem.desc.candidates.length){
		    //Отправить предложение в базу, а затем запустить push messages для каждого получателя
		    this.database.sendDescriptor(pcItem.desc).then(desc => {
			desc.descType === 'rtc/offers/' && this.messaging.sendNotificationMessage(desc);
		    }).catch(err => {
			console.log(err);
		    })
		} else console.log('Кандидаты не сформированы, отправка предложения невозможна!')
	    }
      }
  
	async function onTrack(pcItem, event){
	    //Не устанавливаем свойство, если оно уже установлено
	    if (pcItem.pc.srcObject) return;
	    pcItem.pc.srcObject = event.streams[0];
	}
	
      async function onIceCandidate(pcItem, event) {
	  //при формировании своих кандидатов, отправляем их на сервер, если сформированные кандидаты напрвлены инициатором сообщения, тогда заполняется коллекция получателей (receivers), иначе - она остается пустой или формируются получатели по специальной структуре формирования получателей для множественных сессий
	  let target = pcItem.desc;
	  if (event.candidate && target) {//если кандидат не null
	      let candidate = new Candidate({
		  messId: uuid(),
		  descId : target.messId,
		  messageType: 'candidate',
		  uid: this.appContext.appUser.uid,
		  explicit : pcItem.explicit,
		  descType: pcItem.explicit ? 'rtc/candidates/' : 'rtc/implicit-candidates/',
		  contact : pcItem.contact,
		  receivers: {[ pcItem.contact.uid]:  pcItem.contact},
		  sender: this.appContext.appUser,
		  desc: JSON.stringify(event.candidate),
		  status : 'active',
	      });
	       //target.candidates.push(candidate);
	      //Отправить кандидата через сигнализацию
	       await this.database.sendDescriptor(candidate);
	  }/*else if(!event.candidate){
	      //Отправить предложение в базу, а затем запустить push messages для каждого получателя
	      if(target.candidates && target.candidates.length){
	          this.database.sendDescriptor(pcItem.desc).then(desc => {
		  		desc.descType === 'rtc/offers/' && this.messaging.sendNotificationMessage(desc);
	      		}).catch(err => {console.log(err)})
	      }else console.log('Кандидаты не сформированы, отправка предложения невозможна!')
	  }*/
      }
    
      function getContactsObject(){
	      let obj = {} ;
	      opts.contacts.forEach(contact => {
		  obj[contact.uid] = contact;
	      })  ;
	  return obj;
      }
	
    }
}
