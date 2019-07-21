import { Component, OnInit } from '@angular/core';
import {FormGroup, FormControl, Validators} from "@angular/forms";
import {AppComponent} from "../../app.component";
import {AppContextService} from "../../services/app-context.service";

@Component({
  selector: 'app-auth-page',
  templateUrl: './auth-page.component.html',
  styleUrls: ['./auth-page.component.css']
})
export class AuthPageComponent implements OnInit {

    public type = 0;
    public emailPassGroup;
    public phoneGroup;
    public codeSmsGroup;
    public recaptcha;
    public googleError;
    public conformation : any;
    public activeStage = false;
    public phoneBlockClass = true;
    public cursor = 'pointer';
    public emailButtonText = 'Проверить адрес';
    public phoneButtonText = 'Проверить номер';
    public phoneCodeError : boolean | string = false;
    public smsCodeError : boolean | string = false;
    public emailPassError : boolean | string = false;
    public images = [
	{src : '/assets/social/g.svg', tip : 'Google'},
	{src : '/assets/social/mail.svg', tip : 'Mail'},
	{src : '/assets/social/phone.svg', tip : 'Phone'},
    ];
    public states = [
	{class : 'us', code : '+1', src : '/assets/flags-24/002-flag.png'},
	{class : 'arm', code : '+374', src : '/assets/flags-24/007-armenia.png'},
	{class : 'ru', code : '+7', src : '/assets/flags-24/001-russia.png'},
	{class : 'kz', code : '+7', src : '/assets/flags-24/006-kazakhstan.png'},
	{class : 'geo', code : '+995', src : '/assets/flags-24/009-georgia.png' },
	{class : 'de', code : '+49', src : '/assets/flags-24/004-germany.png'},
	{class : 'uk', code : '+380', src : '/assets/flags-24/003-ukraine.png'},
	{class : 'bel', code : '+375', src : '/assets/flags-24/005-belarus.png'},
	{class : 'est' , code : '+372', src : '/assets/flags-24/008-estonia.png'},
    ] ;
    
    public selected = this.states.find((el) => {
	return el.class === window.navigator.language.substring(0, window.navigator.language.indexOf('-'));
    });
    
    constructor(
        public appComp : AppComponent,
	public appContext : AppContextService) {
        
        this.emailPassGroup = new FormGroup({
	    emailControl: new FormControl('', [Validators.required, Validators.email]),
	    passControl: new FormControl('', [Validators.required, Validators.minLength(8)]),
	});
	this.phoneGroup = new FormGroup({
	    codeControl: new FormControl(this.selected, [Validators.required]),
	    phoneControl: new FormControl('', [Validators.required, Validators.pattern('[0-9]{10}')]),
	});
	this.codeSmsGroup = new FormGroup({
	    codeSmsControl: new FormControl('', [Validators.required, Validators.pattern('[0-9]{6}')]),
	});
    }
    
    ngOnInit() {}
    
    
    onClickIcon(inx){
        this.type = inx + 1;
    
    }
    
    onClickEmailButton(){
	let val = this.emailPassGroup.value;
	this.cursor = 'not-allowed';
	this.emailPassError = 'Попытка входа в приложение.';
        this.appContext.auth.signInWithEmailAndPassword(val.emailControl, val.passControl).then(()=>{
            this.emailPassError = 'Пользователь аутентифицирован.';
            this.appComp.changeRef.detectChanges();
	}).catch((err) => {
		var errorCode = this.handleError('email-pass', err.code);
		if(errorCode.indexOf('user-not-found') >= 0){
		    this.emailPassError = 'Регистрация нового пользователя.';
		    this.appContext.auth.createUserWithEmailAndPassword(val.emailControl, val.passControl).then(res =>{
			this.emailPassError = 'Пользователь создан.';
			this.appComp.changeRef.detectChanges();
		    
		    }).catch(err => {
		        console.error(err);
			this.emailPassError =  this.handleError('email-pass', err.code);
			this.appComp.changeRef.detectChanges();
		    })
		}else {
		    this.emailPassError = errorCode;
		}
	    this.cursor = 'pointer';
	    this.activeStage = false;
	    this.appComp.changeRef.detectChanges();
    
	});
    }
    
    onClickRemainderPass(){
        let val = this.emailPassGroup.value.emailControl;
	this.appContext.auth.sendPasswordResetEmail(val).then(resp => {
	    this.emailPassError = 'Отправлено на '+ val;
	    this.appComp.changeRef.detectChanges();
	})
    }
    
    async onClickPhoneButton(){
        let phone = this.phoneGroup.value;
        this.cursor = 'not-allowed';
        this.activeStage = true;
        this.recaptcha =  new this.appContext.firebase.auth.RecaptchaVerifier('recaptcha-container');
        await this.recaptcha.render();
	this.appContext.auth.signInWithPhoneNumber(phone.codeControl.code + phone.phoneControl, this.recaptcha)
	    .then((conformation)=> {
	         this.conformation = conformation;
	         //открыть форму ввода кода из sms
		this.cursor = 'pointer';
		this.activeStage = false;
		this.phoneBlockClass = false;//отображение формы ввода sms
		this.smsCodeError =  'Пароль отправлен.';
		//обновить интерфейс
		this.appComp.changeRef.detectChanges();
	    })
    }
    
    
   async onClickPhoneCodeButton(){
        let code = this.codeSmsGroup.value.codeSmsControl;
        try{
	    if(this.conformation) {
	        await this.conformation.confirm(code);
	        this.smsCodeError = 'Пользователь аутентифицирован.';
		this.activeStage = false;
	    }
	}catch (e) {
	    this.smsCodeError = this.handleError('sms', e.code);
	}
	this.conformation = undefined;
	this.cursor = 'pointer';
       this.appComp.changeRef.detectChanges();
   
   
   }
    
    onClickGoogleButton(){
	this.appContext.auth.signInWithPopup(new this.appContext.firebase.auth.GoogleAuthProvider()).then((result) => {
	    // The signed-in user info.
	    var user = result.user;
	}).catch((error)=> {
	    // Handle Errors here.
	    this.googleError = this.handleError('google', error.code);
	});
    }
    
    onCancelButton(type?){

	type !== 'sms-code' && (this.type = 0);
	this.emailPassGroup.reset();
	this.emailPassGroup.reset() ;
	this.phoneGroup.get('phoneControl').reset();
	this.codeSmsGroup.reset();
	this.phoneBlockClass = true;
	this.phoneCodeError = this.emailPassError = this.smsCodeError = '';
	this.recaptcha && this.recaptcha.clear();
	this.recaptcha = undefined;
    }

    
    handleError(type, code){
        //todo временное решение. Необходимо обработать ошибки, согласно кодам firebase
         return code;
    }

}

