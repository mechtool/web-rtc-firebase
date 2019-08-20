import { Component, OnInit } from '@angular/core';
import {AppComponent} from "../../app.component";

@Component({
  selector: 'app-color-theme',
  templateUrl: './color-theme.component.html',
  styleUrls: ['./color-theme.component.css']
})
export class ColorThemeComponent implements OnInit {
    
    
    public colorItems = [
	{colorClass : 'first-theme', color : 'rgb(255, 214, 0)', active : false, iconColor : '#000'},
	{colorClass : 'second-theme', color : 'rgb(30, 136, 229)', active : true, iconColor : '#fff'},
	{colorClass : 'third-theme', color : 'rgb(0, 150, 136)', active : false, iconColor : '#fff'},
	{colorClass : 'forth-theme', color : 'rgb(63, 81, 181)', active : false, iconColor : '#fff'},
    ] ;
  constructor(public appComp : AppComponent) { }
  
  ngOnInit() {
       this.resetActive();
  }
  
  resetActive(){
      this.colorItems.forEach(item => {
	  item.active = false;
	  item.active = window.localStorage.getItem('colorTheme') === item.colorClass;
      })
  }
  
  onClickColor(selector){
      this.appComp.setAppTheme(selector);
      window.localStorage.setItem('colorTheme', selector);
      this.resetActive();
  }

}
