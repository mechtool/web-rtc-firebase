import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {AuthPageComponent} from "./components/auth-page/auth-page.component";
import {ContentPageComponent} from "./components/content-page/content-page.component";
import {SettingsPageComponent} from "./components/settings-page/settings-page.component";
import {MessagesPageComponent} from "./components/messages-page/messages-page.component";
import {ContactsPageComponent} from "./components/contacts-page/contacts-page.component";
import {WebRtcComponent} from "./components/web-rtc/web-rtc.component";
import {TextMessageComponent} from "./components/text-message/text-message.component";
import {VideoMessageComponent} from "./components/video-message/video-message.component";
import {AudioMessageComponent} from "./components/audio-message/audio-message.component";

const routes: Routes = [
    {path : 'authentication', component : AuthPageComponent, data : {type : 'auth-page'}},
    {path : 'content',  data : {type : 'content-page'},  component  : ContentPageComponent, children : [
	{path : 'settings', component : SettingsPageComponent, data : {type : 'settings-page'}},
	{path : 'messages', component : MessagesPageComponent, data : {type : 'messages-page'}},
	{path : 'contacts',  component : ContactsPageComponent, data : {type : 'contacts-page'}},
	{path : 'message',  component : WebRtcComponent, data : {type : 'web-rtc-page'}, children : [
	    {path : 'text-message',  component : TextMessageComponent, data : {type : 'text-message-page'}},
	    {path : 'video-message',  component : VideoMessageComponent, data : {type : 'video-message-page'}},
	    {path : 'audio-message', component : AudioMessageComponent, data : {type : 'audio-message-page'}},
	    {path : '', redirectTo : 'text-message' , pathMatch : 'full'},
	    ]},
	{ path: '', redirectTo: 'messages', pathMatch: 'full'},
 
	]
    },
    { path: '', redirectTo: '/authentication', pathMatch: 'full'},
    { path: '**', redirectTo: '/authentication', pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {initialNavigation : false, onSameUrlNavigation: 'reload'})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
