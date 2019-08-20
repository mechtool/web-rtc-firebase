import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-messages-page',
  templateUrl: './messages-page.component.html',
  styleUrls: ['./messages-page.component.css']
})
export class MessagesPageComponent implements OnInit {
    
    public tabIndex = 0;
    public icons = [
	[
	    {tip : 'Входящие', aria : 'Текстовые входящее',  icon : 'message',  active : true, className : 'inGoing'},
	    {tip : 'Исходящие', aria : 'Текстовые исходящие',  icon : 'message',  active : true, className : 'outGoing'},
	    {tip : 'Не принятые', aria : 'Текстовые не принятые',  icon : 'message',  active : true, className : 'notVisited'},
	
	],
	[
	    {tip : 'Входящие',aria : 'Аудио сообщение', icon : 'sms',active : true, className : 'inGoing'},
	    {tip : 'Исходящие',aria : 'Аудио сообщение', icon : 'sms',  active : true, className : 'outGoing'},
	    {tip : 'Не принятые',aria : 'Аудио сообщение', icon : 'sms',  active : true, className : 'notVisited'},
	
	],
	[
	    {tip : 'Входящие',aria : 'Видео сообщение', icon : 'voice_chat',  active : true, className : 'inGoing'},
	    {tip : 'Исходящие',aria : 'Видео сообщение', icon : 'voice_chat',  active : true, className : 'outGoing'},
	    {tip : 'Не принятые',aria : 'Видео сообщение', icon : 'voice_chat',  active : true, className : 'notVisited'},
	
	]
    ];
    
    constructor() {}
    
    ngOnInit() {
    }
    onChangeTab($event){
    	this.tabIndex = $event;
    }
    
    onClickButtonBlock(icon) {
    	icon.active = !icon.active;
    }

}
