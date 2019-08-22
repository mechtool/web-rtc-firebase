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

    public pcMessage : PcMessage = new PcMessage();
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
	     //подписка на активные предложения ответы и кандидаты, если настрока оптимизации включена
	     this.database.getDatabaseRef(coll + this.appContext.appUser.uid).orderByChild('status').equalTo("active").on('value', this.onSignal.bind(this))
	 })
      }catch (e) {
      
      }
    }
    
    checkComponentCollection(message = 'Новое сообщение закроет текущее!') : Promise<any>{
	return new Promise(async (res, rej) => {
	    let result : any = {received : true, messId : uuid()};
	    if(this.appContext.webRtcComponent && Object.keys(this.pcMessage.pcCollection).length){
		//Отобразить предупреждение об удалении текущего сообщения
		result = await this.showUserNotification({messId : uuid(), sender : {photoURL : '/assets/app-shell/attention-24px.svg', imgColor : '', message : message}});
	    }
	    res(result);
	})
    }

    
    onSignal(snap){//получено предложение type=offer/answer
	let ntResult,
	    descriptors,
	    that = this,
	    val = snap.val();
	if(!val) return ;
	descriptors = setDescriptors(val, snap.ref.parent.key);
	//если тип сигнала - предложение, то формируем интерфейс принятия предложения, если предложение принято
	//, тогда запускаем процедуру установки соединения
	if(descriptors.descType ==='offers' ){
	    // если предложение принято - запуск формирования соединения
	    descriptors.desc.forEach(async desc => {
		desc.desc = JSON.parse(desc.desc);
		try {
		    //отобразить каждое сообщение пользователю
		    ntResult = await that.showUserNotification(desc);
		    //Выбран прием входяшего сообщения, нужно проверить общается ли пользователь с кем нибудь, т.е существует ли компонент сообщения
		    if(this.appContext.webRtcComponent && Object.keys(this.pcMessage.pcCollection).length){
			//Отобразить второе предупреждение об удалении текущего сообщения
			ntResult = await that.showUserNotification({messId : uuid(), sender : {photoURL : '/assets/app-shell/attention-24px.svg', imgColor : '', message : 'Новое сообщение закроет текущее!'}});
			//Если новое сообщение или предупреждение принимается, то удаляем все сообщения
			//иначе, отправляем на сервер новый статус дескриптора
			ntResult.received ? this.closeAllMessages() : this.database.setDescriptorStatus({[desc.descType + this.appContext.appUser.uid + '/' + desc.messId] : {status : 'rejected'}});
		    }
		//Устанавливаем выбранный контакт в список контактов в компоненте message
		    //и создаем экземпляр компонента сообщения через вызов навигации
		ntResult.received && this.zone.run(() => this.router.navigateByUrl('/content/message')).then(async () => {
			//Изменение статуса сообщения  на принятое
			await this.database.setDescriptorStatus({[desc.descType + this.appContext.appUser.uid + '/' + desc.messId] : {status : 'received'}});
		   //синхронно устанавливаем коллекцию контактов для возможности последующего запуска новых соединений
		   //через эту коллекцию контактов
		    await new Promise((res, rej) => {
		        this.communications.base.next({type : 'new-contacts', contacts : setArrayContacts.bind(this, desc)(), messType : desc.messageType, complete : res}) ;
		    });
		     this.appContext.webRtcComponent.changeRef.detectChanges();
		    //предложение (только одно, остальные нужно принудительно закрыть) принято
		    //todo принятие сообщения - отправляем изменение статуса на сервер status = received
		    that.startConnection({initializer : false, messageType: desc.messageType});
		    //объект соединения готов
		    let pcItem = that.getPcItem(desc.uid),
			pc = pcItem.pc ;
		    if(pc){
			//установили удаленный offer как удаленный дескриптор
			await pc.setRemoteDescription(desc.desc);
			//установили локальный дескриптор и создали свой ответ (answer)
			await pc.setLocalDescription(await pc.createAnswer());
			//установка удаленных кандидатов
		//	this.setCandidates(pc, desc.candidates);
			//формирование ответа на приглашение, после которого вызывается меод формирования кандидатов
			//в котором и происходит отправка дескриптора на сервер
			pcItem.desc = new Answer({messId : desc.messId , status : 'active',   uid : this.appContext.appUser.uid, messType : desc.messageType,  descType : this.collections[1], contact : pcItem.contact, receivers : {[desc.sender.uid] : desc.sender}, sender : this.appContext.appUser, desc: JSON.stringify(pc.localDescription), candidates : []});
			//Отправка дескриптора на сервер
			await this.database.sendDescriptor(pcItem.desc);
			//Ссылка на функцию сигнализации для дальнейшего удаления ее вызова
			pcItem.onSignalCandidates = this.onSignal.bind(this);
			//Подписка на получение удаленных кандидатов
			//подписка на получение кандидатов ответов на отправленное предложение
			this.database.getDatabaseRef('rtc/candidates/' + this.appContext.appUser.uid ).orderByChild('descId').equalTo(pcItem.desc.messId).on('value', pcItem.onSignalCandidates);
		    }
		});
	    }catch (e) { //Выход по ошибке
		    //todo Отказ от принятия предложения - отправляем изменение статуса сообщения на сервер  status = rejected
		    await this.database.setDescriptorStatus({[desc.descType + this.appContext.appUser.uid + '/' + desc.messId] : {status : 'rejected'}});
		}
	    }) ;
	}else if(descriptors.descType ==='answers' && descriptors.desc){
	    //пришедшие через сеть ответы не записываем в элемент pcConnection
	    //для определения инициатора соединения
	    descriptors.desc.forEach(async d => {
		//Установка удаленного дескриптора из ответа и установка удпленных кандидатов
		let pcItem = that.getPcItem(d.uid);
		pcItem && pcItem.pc && await pcItem.pc.setRemoteDescription(JSON.parse(d.desc)).then(()=>{
		    //Изменение статуса дескриптора - принят
		    this.database.setDescriptorStatus({[d.descType + this.appContext.appUser.uid + '/' + d.messId] : {status : 'received'}}) ;
		    
		    //Установка удаленных кандидатов, если
		   // this.setCandidates(pcItem.pc, d.candidates);
		});
	    });
	}else if(descriptors.descType === 'candidates'){
	    //получаем активные кандидаты
	    descriptors.desc.forEach(d => {
		let pcItem = that.getPcItem(d.uid);
		this.setCandidates(pcItem.pc, d);
		//После установки кандидата записать в базу его статус  "received"
		this.database.setDescriptorStatus({[d.descType + d.contact.uid + '/' + d.messId] : {status : 'received'}})
	    })
	}
	
	function setDescriptors(val, type) {
	     return {desc : Object.values(val).map(d => d), descType : type};
	}
 
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
	    if(Object.keys(this.pcMessage.pcCollection).length && this.appContext.webRtcComponent){
		this.appContext.webRtcComponent.deleteContact(this.appContext.webRtcComponent.messageContacts.value.map(cont => cont.uid))  ;
		this.appContext.webRtcComponent.messageContacts.next([]);
	    }
	    
	    //отключение отображения прогрессбара соединения
	    this.appContext.webRtcComponent.connecting = false;
	    //принудительно устанавливаем отсутствие пиров
	    this.appContext.webRtcComponent.noPeers = true;
	}

	if(this.appContext.textMessageComponent){
	    //Отчистка всех сообщений в интерфейсе
	    this.appContext.textMessageComponent.textMessages = [];
	    //Отчистка поля ввода текста
	    this.appContext.textMessageComponent.messageGroup.get('textControl').setValue('');
	}
	//Освобождение кнопок интерфейса от блокировки
	this.appContext.contentComp.disableButton = false;
	//Отчистка коллекции контактов и коллекции pcMap  с закрытием соединений
	//отправка данных на сервер о закрытых соединениях
	for(let key in this.pcMessage.pcCollection){
	    //закрытие всех пир соединений
	    let pcItem = this.pcMessage.pcCollection[key],
		desc = pcItem.desc ;
	    //Снятие ранее установленных обработчиков на получения кандидатов
	    this.database.getDatabaseRef('rtc/candidates/' + this.appContext.appUser.uid ).orderByChild('descId').equalTo(pcItem.desc.messId).off('value', pcItem.onSignal);
	    //Закрыть соединение
	    pcItem.pc.close() ;
	    desc && this.database.setDescriptorStatus({[desc.descType + (pcItem.initializer ? desc.contact.uid : this.appContext.appUser.uid) + '/' + desc.messId] : {status : 'refused'}});   //refused
	    delete this.pcMessage.pcCollection[key];
	}
	//обновляем интерфейс
	this.appContext.contentComp.changeRef.detectChanges();
    }
    
    setCandidates(pc, candidate){
	pc.addIceCandidate(JSON.parse(candidate.desc))
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
	let channel = pcItem.channel;
	//Соединение открыто, т.е. собеседник принял соединение
	channel.addEventListener('open', this.onOpenConnection.bind({pcItem : pcItem, that : this}));
	//Пришло сообщение от собеседника
	channel.addEventListener('message', this.onMessage.bind({pcItem : pcItem, that : this}));
	//Ошибка канала сообщения
	channel.addEventListener('error', this.onErrorChannel.bind({pcItem : pcItem, that : this})) ;
	//Закрытие канала связи собеседником
	channel.addEventListener('close', this.onCloseChannel.bind({pcItem : pcItem, that : this}))
    }
    
    onOpenConnection(event){
	let context = <any>this,
	    that = context.that;
	//канал открыт,// т.е. собеседник открыл соединение, нужно отправить содержимое первого сообщения
	//Для отправки первого сообщения, когда канал связи еще не открыт, у объекта канала (channel) вызывается
	//метод отправки send(), содержимое которого помещается в буфер и увеличивает свойство канала bufferedAmount
	//содержащий количество байт в сообщении. Когда канал связи откроется, браузер автоматически отправляет сообщение по новому каналу и значение свойства bufferedAmount изменяется и вызывается событие канала bufferedamountlow, указывая на снижение данных относительно установленного предела. Порог или предел, ниже объема данных которогого происходит запуск события bufferedamountlow устанавливается в свойстве bufferedAmountLowThreshold. Поэтому, первое сообщение отправитель может отправить сразу, до установки канала или после
	//возникновения события открытия канала.
	//todo здесь выполняется первая, автоматическая отправка сообщения пользователю, после установления соединения
	if(context.pcItem.initializer){
	    that.sendTextMessage(context.pcItem)  ;
	    that.renderMessage(context.pcItem);
	    that.appContext.webRtcComponent.messageGroup.get('textControl').setValue('');
	}
	context.pcItem.contact.statusColor = that.statusColors[event.type];
	that.appContext.contentComp.changeRef.detectChanges();
	//Проверка всех соединений на предмет имеющегося хотябы одного открытого соединения
	//для изменения отображения кнопки отправки сообщения
	that.checkConnections();
    }
    
    sendTextMessage(pcItem){  //Отправка текстового сообщения всем контактам
	//если соединение активно, передать сообщение
	let text , pc = pcItem.pc, channel = pcItem.channel;
	if(pc && channel && channel.readyState !== 'close' && channel.readyState !== 'closing' && pc.connectionState === 'connected'){
	    text =  this.appContext.textMessageComponent.messageGroup.get('textControl').value;
	    channel.send(text);
	    //Отрпавить сообщение на сервер / локальное хранилище, а в конце сессии отправить на сервер для
	    //хранения / архивирования
	    //todo код отправки сообщения на сервер
	    pcItem.sender = this.appContext.appUser;
	    pcItem.messageText = text;
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
    onMessage(event){ //получение сообщения от pcConnection
	let context = <any>this;
	//Отобразить полученное сообщение
	context.pcItem.messageText =  event.data;
	context.pcItem.sender = context.pcItem.contact;
	context.that.renderMessage(context.pcItem) ;
	context.pcItem.contact.statusColor = context.that.statusColors[event.type];
	context.that.checkConnections();
    }
    
    onCloseChannel(event){
	let context = <any>this;
	//Предупредить пользователя о закрытие канала сообщения
	context.pcItem.contact.statusColor = context.that.statusColors[event.type];
	context.that.checkConnections();
    }
    
    onErrorChannel(event){
	let context = <any>this;
	context.pcItem.contact.statusColor = context.that.statusColors[event.type];
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
    
    startConnection(options){
      
	let contacts = this.appContext.webRtcComponent.messageContacts.value;
	if(!this.configuration){
	    console.log('Невозможно создать соединение по причине отсутствующей STUN/TURN конфигурации!');
	    return false;
	}
	//Только новое сообщение с не пустым списком получателей
	if(!Object.keys(this.pcMessage.pcCollection).length && contacts.length){
	    //Отключаем кнопку отправки сообщения
	    this.appContext.webRtcComponent.noPeers = false;
	    //Отключения кнопок интерфейса для предотвращения перехода на другие страницы до окончания сообщения
	    this.appContext.contentComp.disableButton = true;
	    //Включаем индикатор соединения (mat-toolbar);
	    this.appContext.webRtcComponent.connecting = true;
	    //Запуск счетчика времени ожидания вызова. Если ни один контакт не ответил,
	    // тогда закрываем сообщение
	    let t = window.localStorage.getItem('timeout'),
		timeout = setTimeout(()=>{
	        //Если пиров нет, тогда все закрыть;
	        if(!this.appContext.webRtcComponent.noPeers) this.closeAllMessages();
	        clearTimeout(timeout);
	        }, +t * 60000 ) ;
	    //-----------------------------------------------------------------------------------
	    
	    contacts.forEach(cont => {
		let pcItem = {uid : cont.uid, mid: this.pcMessage.mid, contact : cont, pc : new RTCPeerConnection(this.configuration), initializer : options.initializer, messageType : options.messageType, channel : undefined, stream : undefined , srcObject : undefined, desc : undefined};
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
	    if(options.initializer){
	      //событие необходимости согласования соединения
		// актуально только на стороне инициатора соединения
	      pcItem.pc.onnegotiationneeded = onNegotiation.bind(this, pcItem);
	    }
	    
	    if(options.messageType == 'text'){
		    if (options.initializer) {
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
	    }else if(options.messageType === 'video' || options.messageType === 'audio'){
	                      //Обработчик получения треков от удаленных пиров
		  	      pcItem.pc.ontrack = onTrack.bind(this, pcItem);
		  	      (async ()=> {
				    try { //Получаем локальный поток, отображаем его в видео элементе, если это видеотип
					//или вставляем его в аудиоэлемент и убираем громкость, если это аудио тип, а затем
					//добавлякм все треки в PC
					let stream =  pcItem.stream = await navigator.mediaDevices.getUserMedia({audio: true, video:  options.messageType === 'video'});
					stream.getTracks().forEach((track) => pcItem.pc.addTrack(track, stream));
					//selfView может быть как ссылкой на объект video так и сслылкой на объект audio и если ссылка на
					//объект-источник занята, её переписывать не надо.
					this.appContext.webRtcComponent.selfSrcObject || (this.appContext.webRtcComponent.selfSrcObject = stream);
				    } catch (err) {
					console.error(err);
				    }
				})() ;
	      		}
	    })
	}else {//выполняется при отправке только текстовых сообщений по существующему каналу связи
		let hasConnection;
		Object.values(this.pcMessage.pcCollection).forEach((pcItem: any) => {
		    //условия проверки соединения, и если соединение активное, тогда отправлять сообщение
		    hasConnection = pcItem.pc.connectionState === 'connected';
		    if (hasConnection) {//Если соединение существует, отправляем сообщение
			this.sendTextMessage(pcItem);
		    }
		});
	    
	    if(hasConnection){//Отображаем сообщение пользователю и отчищаем поле ввода
	        let message = this.appContext.webRtcComponent.messageGroup.get('textControl').value;
	        if(message){
		    this.renderMessage({sender : this.appContext.appUser, messageText : message, messageType : 'text', receivers : contacts}) ;
		    this.appContext.webRtcComponent.messageGroup.get('textControl').setValue('') ;
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
	      //refused - сброшен и прерван отправляющей стороной (при изменении типа сообщения)
	      pcItem.desc = new Offer({messId : uuid() , uid : this.appContext.appUser.uid, messageType : pcItem.messageType, contact : pcItem.contact,  receivers : getContactsObject(), status : 'active',  descType : this.collections[0], sender : this.appContext.appUser, desc: JSON.stringify(pcItem.pc.localDescription), candidates : []});
	      //Отправка предложения сигнализации
	      await this.database.sendDescriptor(pcItem.desc);
	      //отправка Push-Notification получателю.
	      await this.messaging.sendNotificationMessage(pcItem.desc);
	      //Ссылка на функцию сигнализации для дальнейшего удаления ее вызова
	      pcItem.onSignal =  this.onSignal.bind(this);
	      //подписка на получение кандидатов ответов на отправленное предложение
	      this.database.getDatabaseRef('rtc/candidates/' + this.appContext.appUser.uid ).orderByChild('descId').equalTo(pcItem.desc.messId).on('value', pcItem.onSignal)

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
		  descType: 'rtc/candidates/',
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
	      contacts.forEach(contact => {
		  obj[contact.uid] = contact;
	      })  ;
	  return obj;
      }
	
    }
}
