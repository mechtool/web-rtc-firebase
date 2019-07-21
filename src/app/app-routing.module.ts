import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {AuthPageComponent} from "./components/auth-page/auth-page.component";
import {ContentPageComponent} from "./components/content-page/content-page.component";
import {SettingsPageComponent} from "./components/settings-page/settings-page.component";
import {MessagesPageComponent} from "./components/messages-page/messages-page.component";
import {ContactsPageComponent} from "./components/contacts-page/contacts-page.component";

const routes: Routes = [
    {path : 'authentication', component : AuthPageComponent, data : {type : 'auth-page'}},
    {path : 'content',  data : {type : 'content-page'},  component  : ContentPageComponent, resolve : {/*contacts : ContactsResolverService, messages : MessagesResolverService,*/ /*users : UsersResolverService*/ }, children : [
	{path : 'settings', component : SettingsPageComponent, data : {type : 'settings-page'}},
	{path : 'messages', component : MessagesPageComponent, data : {type : 'messages-page'}},
	{path : 'contacts',  component : ContactsPageComponent, data : {type : 'contacts-page'}}
	]
    },
    { path: '', redirectTo: '/authentication', pathMatch: 'full'},
    { path: '**', redirectTo: '/authentication', pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {initialNavigation : false})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
