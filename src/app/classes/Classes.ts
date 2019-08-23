const uuid = require('uuid/v1');
export class Contact {
    
    public name: string;
    public displayName: string;
    public photoURL: string;
    public uid: string;
    public email: string;
    public phoneNumber: string;
    public imgColor?: string;
    public messToken?: string;
    public statusColor ;
    public checked : boolean;
    
    
    constructor(user) {
	this.name = user.name || '';
	this.displayName = user.displayName || '';
	this.phoneNumber = user.phoneNumber || '';
	this.photoURL = user.photoURL || '/assets/app-shell/user.svg';
	this.uid = user.uid;
	this.email = user.email || '';
	this.imgColor = user.imgColor || (this.photoURL == '/assets/app-shell/user.svg' ? Contact.getRandomColor() : 'transparent');
	this.messToken = user.messToken || '';
	this.statusColor = user.statusColor || '#959595' ;
	this.checked = user.checked || false;
    }
    
    static getRandomColor() {
	return '#'+(Math.random()*0xFFFFFF<<0).toString(16);
    }
}

export class Descriptor {
    
    uid : string; //Идентификатор пользователя
    messId : string;// идентификатор сообщения
    receivers : {[key : string] : string}; //идентификаторы получателей
    sender : {} | boolean; //идентификаторы отправителей (отправителя)
    date : number; //дата сообщения milliseconds
    desc : string; //дескриптор
    descType : string; //offer / answer / icecandidate
    messageType : string;
    status : string;
    contact : Contact;
    
    constructor(desc){
	this.uid = desc.uid; //Идентификатор пользователя
	this.receivers = desc.receivers;//идентификаторы получателей
	this.sender = desc.sender; //идентификаторы отправителей (отправителя)
	this.date  = Date.now(); //дата сообщения milliseconds
	this.desc  = desc.desc; //дескриптор
	this.descType = desc.descType; //offer / answer / icecandidate
	this.messId = desc.messId;// идентификатор дескриптора
	this.messageType = desc.messageType || '';
	this.status = desc.status || '' ;
	this.contact = desc.contact || undefined;
    }
}

export class Candidate extends Descriptor{
    public descId : string;
    constructor(cand){
        super(cand);
        this.descId = cand.descId;
    }
}

export class Offer extends Descriptor{
    public candidates  = []
}

export class Answer extends Descriptor{
    public candidates  = []
    
}

export class Message  {
    
    date : number = Date.now();
    messageType  : string  = '';// video/ text/ audio
    ext : string = ''; //расширение файла сообщения
    sourceUrl : string = '';//адрес ресурса если он кудато записан
    text : string = ''; //текст сообщения, если оно текстовое
    messageId  : string = '';
    sender : any;
    receivers : any;
    candidates? : Array<any>;
    
    constructor(message){
	this.date = message.date;
	this.messageType = message.messageType;
	this.ext = message.ext;
	this.sourceUrl = message.sourceUrl;
	this.text = message.text;
	this.messageId = message.messageId;
	this.sender = message.sender;
	this.receivers = message.receivers;
	this.candidates = message.candidates || [];
    }
}
export class PcMessage{
    
    public pcCollection = {};
    constructor(public mid : string = uuid()){}
}
